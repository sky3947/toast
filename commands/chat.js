import { ChatInputCommandInteraction, SlashCommandBuilder, userMention } from "discord.js";
import { MAX_MESSAGE_LENGTH, GPTMessage, chat, splitMessage } from "../gpt-interface.js";

const acceptedImageTypes = ['png', 'jpeg', 'gif', 'webp'];

export const chatCommand = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Type a message to chat with toast with no chat history.')
        .addStringOption(option =>
            option
                .setName('prompt')
                .setDescription('What would you like toast to respond to?')
                .setRequired(true)
                .setMaxLength(MAX_MESSAGE_LENGTH)
        )
        .addAttachmentOption(option =>
            option
                .setName('image')
                .setDescription('Is there something toast should look at?')
                .setRequired(false)
        ),
    /**
     * @param {ChatInputCommandInteraction<>} interaction
     */
    async execute(interaction) {
        // Defer message to buy time for processing.
        await interaction.deferReply({ ephemeral: true });
        const prompt = interaction.options.getString('prompt');
        const attachment = interaction.options.getAttachment('image');

        // OpenAI's max image size is 20MB.
        if (attachment && attachment.size > 20000000) {
            await interaction.followUp('Cannot process images larger than 20MB.');
            return;
        }
        // OpenAI only accepts PNG, JPEG, GIF, and WebP images.
        if (attachment && !acceptedImageTypes.includes(attachment.name.split('.').pop())) {
            await interaction.followUp('Only PNG, JPEG, GIF, and WebP images are accepted.');
            return;
        }

        // Make API call.
        const attachmentURL = attachment?.url;
        const gptResponse = await chat([new GPTMessage(prompt, attachmentURL)]);

        // Delete deferred reply.
        await interaction.deleteReply();

        // Send reply.
        const messagePrefix = `${userMention(interaction.user.id)} says:\n> *${prompt}*\n`
        const splitMessages = splitMessage(gptResponse, messagePrefix);

        if (interaction.guild === null) {
            for (const message of splitMessages) {
                await interaction.user.send({ content: message, files: attachmentURL && [{ attachment: attachmentURL }] });
            }
        } else {
            for (const message of splitMessages) {
                await interaction.channel.send({ content: message, files: attachmentURL && [{ attachment: attachmentURL }] });
            }
        }
    },
}
