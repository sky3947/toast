import { Message } from "discord.js";
import { chat } from "../gpt-interface.js";
import 'dotenv/config';

const processingFlag = 'Thinking...';
const maxChatLength = 100;

/**
 * @param {string} data 
 * @returns {{
 *     userId: string,
 *     userMessageIndices: number[],
 *     assistantMessageIndices: number[]
 * } | undefined}
 */
function parseMetadata(data) {
    const lines = data.split('\n');

    // Make sure the user is in the metadata.
    if (lines[0].length <= 3) return undefined;

    const userIdRegex = /^<@\d+>$/;
    if (!userIdRegex.test(lines[0])) return undefined;

    const userId = lines[0].slice(2, -1);
    const positiveIntRegex = /^\d+$/;
    if (!positiveIntRegex.test(userId)) return undefined;

    // Case: no chat messages yet.
    if (lines.length === 2) {
        return {
            userId: userId,
            userMessageIndices: [],
            assistantMessageIndices: [],
        };
    }
    // Ignore message if metadata is badly formed or processing flag is on.
    if (lines.length !== 4) return undefined;

    // Case: chat has history.
    const rawUserMessageIndices = lines[1].split(' ');
    if (rawUserMessageIndices.some(index => !positiveIntRegex.test(index))) return undefined;

    const rawAssistantMessageIndices = lines[2].split(' ');
    if (rawAssistantMessageIndices.some(index => !positiveIntRegex.test(index))) return undefined;

    const userMessageIndices = rawUserMessageIndices.map(index => parseInt(index));
    const assistantMessageIndices = rawAssistantMessageIndices.map(index => parseInt(index));

    return {
        userId: userId,
        userMessageIndices: userMessageIndices,
        assistantMessageIndices: assistantMessageIndices,
    }
}

/**
 * @param {Message<true>} metadataMessage
 */
async function toggleThreadLock(metadataMessage) {
    const lines = metadataMessage.content.split('\n');
    const [lastLine] = lines.slice(-1);

    if (lastLine === processingFlag) {
        await metadataMessage.edit(lines.slice(0, -1).join('\n'));
    } else {
        await metadataMessage.edit(metadataMessage.content + '\n' + processingFlag);
    }
}

/**
 * @param {Message<true>} metadataMessage 
 * @param {number[]} userMessageIndices 
 * @param {number[]} assistantMessageIndices 
 */
async function updateMetadata(metadataMessage, userMessageIndices, assistantMessageIndices) {
    const lines = metadataMessage.content.split('\n');
    const newMetadata = [
        // Mentioned user.
        lines[0],
        // User message indices.
        userMessageIndices.join(' '),
        // Assistant message indices.
        assistantMessageIndices.join(' '),
        // Footer.
        lines.slice(lines.length === 3 ? 1 : 3).join('\n')
    ];
    await metadataMessage.edit(newMetadata.join('\n'));
}

/**
 * @param {Message<boolean>} message 
 */
export async function onMessageCreate(message) {
    // Only react to messages in a chatroom thread with toast.
    if (!message.channel.isThread()) return;
    if (message.author.bot) return;
    if ((await message.channel.fetchOwner()).thread.ownerId !== process.env.DISCORD_CLIENT_ID) return;

    // Fetch messages and metadata.
    const messages = (await message.channel.messages.fetch()).reverse();
    // Ignore malformed chatrooms.
    if (messages.size < 2) return;

    const metadataMessage = messages.first();
    if (metadataMessage.author.id !== process.env.DISCORD_CLIENT_ID) return;

    const metadata = parseMetadata(metadataMessage.content);
    if (metadata === undefined) return;
    // Ignore messages not from dedicated chat user.
    if (metadata.userId !== message.author.id) return;
    // Don't respond if we're over at the max chat length.
    if (metadata.userMessageIndices.length >= maxChatLength) {
        message.reply('Max chat length reached. Please create a new chatroom! *Beep Boop*');
        return;
    }

    // Lock from additional message events until response is done.
    await toggleThreadLock(metadataMessage);

    // Load messages.
    let userMessages = [];
    let assistantMessages = [];
    for (let index = 0; index < messages.size; index++) {
        if (metadata.userMessageIndices.includes(index)) {
            userMessages.push(messages.at(index).content);
            continue;
        }
        if (metadata.assistantMessageIndices.includes(index)) {
            assistantMessages.push(messages.at(index).content);
            continue;
        }
    }

    userMessages.push(message.content);

    // Make API call.
    const gptResponse = await chat(userMessages, assistantMessages);
    const assistantReply = await message.reply(gptResponse, { split: true });

    await updateMetadata(
        metadataMessage,
        [...metadata.userMessageIndices, message.position],
        [...metadata.assistantMessageIndices, assistantReply.position]
    );

    // Unlock the thread after finishing.
    await toggleThreadLock(metadataMessage);
}
