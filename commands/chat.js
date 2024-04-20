import { ChatInputCommandInteraction, SlashCommandBuilder, userMention } from "discord.js";
import { MAX_MESSAGE_LENGTH, chat, splitMessage } from "../gpt-interface.js";

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
        ),
    /**
     * @param {ChatInputCommandInteraction<>} interaction 
     */
    async execute(interaction) {
        // Defer message to buy time for processing.
        await interaction.deferReply({ ephemeral: true });
        const prompt = interaction.options.getString('prompt');
        const gptResponse = await chat([prompt]);

        // Delete deferred reply.
        await interaction.deleteReply();

        // Send reply.
        const messagePrefix = `${userMention(interaction.user.id)} says:\n> *${prompt}*\n`
        const splitMessages = splitMessage(gptResponse, messagePrefix);

        const replyMethod = interaction.guild === null ? interaction.user.send : interaction.channel.send;
        for (const message of splitMessages) {
            await replyMethod(message);
        }
    },
}
