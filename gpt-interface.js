import OpenAI from "openai";
import { unified } from 'unified';
import markdown from 'remark-parse';
import { Attachment } from "discord.js";
import 'dotenv/config';

const openai = new OpenAI({ apiKey: process.env.CHATGPT_KEY });
const botInstructions = process.env.BOT_INSTRUCTIONS;

export const MAX_MESSAGE_LENGTH = 2000;

export const ACCEPTED_IMAGE_TYPES = ['png', 'jpeg', 'gif', 'webp'];

export class GPTMessage {
    /**
     * @param {string} text
     * @param {string | undefined} imageURL
     * @return {GPTMessage}
     */
    constructor(text, imageURL) {
        this.text = text;
        this.imageURL = imageURL;
    }
}

/**
 * @param {GPTMessage[]} userMessages
 * @param {GPTMessage[]} assistantMessages
 * @returns {Promise<string>}
 */
export async function chat(userMessages, assistantMessages) {
    userMessages = userMessages || [];
    assistantMessages = assistantMessages || [];

    // Prepare messages.
    const mergedMessages = userMessages.map((message, index) =>
        [
            message === undefined ? undefined : ({
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: message.text,
                    },
                    message.imageURL && {
                        type: 'image_url',
                        image_url: {
                            url: message.imageURL,
                        },
                    },
                ].filter(content => content !== undefined),
            }),
            assistantMessages[index] === undefined ? undefined : ({
                role: 'assistant',
                content: [
                    {
                        type: 'text',
                        text: assistantMessages[index].text,
                    }
                ],
            }),
        ]
    ).flat().filter(message => message !== undefined);

    // Make API call.
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: botInstructions }, ...mergedMessages],
        model: 'gpt-4o',
    });

    // Return output.
    const [messageChoice] = chatCompletion.choices;
    return messageChoice.message.content;
}

/**
 * @param {string} prompt
 * @returns {Promise<OpenAI.Images.Image>}
 */
export async function image(prompt) {
    // Make API call.
    const imageCompletion = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
    });

    // Return output.
    return imageCompletion.data[0];
}

/**
 * @param {Attachment} attachment
 * @returns
 */
export function isImageAttachmentValid(attachment) {
    if (!attachment) {
        return false;
    }
    // OpenAI's max image size is 20MB.
    if (attachment.size > 20000000) {
        return false;
    }
    // OpenAI only accepts PNG, JPEG, GIF, and WebP images.
    if (!ACCEPTED_IMAGE_TYPES.includes(attachment.contentType.split('/').pop())) {
        return false;
    }
    return true;
}

/**
 * @param {import('mdast').RootContent} node
 * @param {number} depth
 * @returns {string[]}
 */
function parseMDSyntaxTreeRec(node, depth) {
    if (node.type === 'root') {
        return node.children.map(node => parseMDSyntaxTreeRec(node, depth));
    } else if (node.type === 'heading') {
        return ['#'.repeat(node.depth) + ' ' + node.children.map(node => parseMDSyntaxTreeRec(node, depth).join('')).join('')];
    } else if (node.type === 'link') {
        if (node.url.startsWith('mailto:')) return [`<${node.children[0].value}>`];
        return [`[${node.children.map(node => parseMDSyntaxTreeRec(node, depth).join('')).join('')}](${node.url})`];
    } else if (node.type === 'list') {
        const isEmptyListItem = node.children.length === 1 && node.children[0].type === 'listItem' && node.children[0].children.length === 0;
        if (node.children.length === 0 || isEmptyListItem) {
            return node.children.map((_, index) => ' '.repeat(depth * 3) + (node.start ? (node.start + index) + '.' : '-'));
        }
        return node.children.map((listItem, index) => ' '.repeat(depth * 3) + (node.start ? (node.start + index) + '. ' : '- ') + parseMDSyntaxTreeRec(listItem, depth + 1).join('\n'));
    } else if (node.type === 'listItem') {
        return node.children.map(item => parseMDSyntaxTreeRec(item, depth).join('\n'));
    } else if (node.type === 'paragraph') {
        return [node.children.map(node => parseMDSyntaxTreeRec(node, depth).join('')).join('')];
    } else if (node.type === 'inlineCode') {
        return ['`' + node.value + '`'];
    } else if (node.type === 'code') {
        return splitCodeFence(node.lang, node.value);
    } else if (node.type === 'emphasis') {
        return [`_${node.children.map(node => parseMDSyntaxTreeRec(node, depth).join('')).join('')}_`];
    } else if (node.type === 'strong') {
        return [`**${node.children.map(node => parseMDSyntaxTreeRec(node, depth).join('')).join('')}**`];
    } else if (node.type === 'blockquote') {
        return ['> ' + node.children.map(node => parseMDSyntaxTreeRec(node, depth).join('')).join('')];
    } else if (node.type === 'image') {
        return [`![${node.alt}](${node.url})`];
    } else if (node.type === 'break') {
        return ['\n'];
    } else if (node.type === 'thematicBreak') {
        return ['\n'];
    } else if (node.type === 'text') {
        return [node.value];
    } else {
        console.log('Unexpected node.type=' + node.type);
        return [node.value];
    }
}

/**
 * @param {string | undefined} lang
 * @param {string} value
 * @returns {string[]}
 */
function splitCodeFence(lang, value) {
    const decoratorPrefix = '```' + (lang || '') + '\n';
    const decoratorPostfix = '\n```';
    const rawValue = decoratorPrefix + value + decoratorPostfix;
    if (rawValue.length <= MAX_MESSAGE_LENGTH) {
        return [rawValue];
    }

    const decoratorLength = decoratorPrefix.length + decoratorPostfix.length;
    const parts = value.split('\n');
    const result = [];
    let buffer = [];
    for (const part of parts) {
        if ([...buffer, part].join('\n').length + decoratorLength > MAX_MESSAGE_LENGTH) {
            result.push([decoratorPrefix.trimEnd(), ...buffer, decoratorPostfix.trimStart()].join('\n'));
            buffer = [];
        }
        buffer.push(part);
    }
    if (buffer.length > 0) {
        result.push([decoratorPrefix.trimEnd(), ...buffer, decoratorPostfix.trimStart()].join('\n'));
    }

    return result;
}

/**
 * @param {string} message
 * @return {string[]}
 */
export function splitMessage(message, prefix = '') {
    const tokens = unified()
        .use(markdown)
        .parse(message);

    let parts = [prefix, ...parseMDSyntaxTreeRec(tokens, 0)];
    parts = parts.flat();

    const messages = [];
    let buffer = [];
    for (const part of parts) {
        if ([...buffer, part].join('\n').length > MAX_MESSAGE_LENGTH) {
            messages.push([...buffer].join('\n'));
            buffer = [];
        }
        buffer.push(part);
    }
    if (buffer.length > 0) {
        messages.push([...buffer].join('\n'));
    }

    return messages;
}