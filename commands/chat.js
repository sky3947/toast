import { ChatInputCommandInteraction, SlashCommandBuilder, userMention } from "discord.js";
import { chat } from "../gpt-interface.js";

export const chatCommand = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Type a message to chat with toast with no chat history.')
        .addStringOption(option =>
            option
                .setName('prompt')
                .setDescription('What would you like toast to respond to?')
                .setRequired(true)
                .setMaxLength(2048)
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

        // Send a reply.
        const messageToSend = `${userMention(interaction.user.id)} says:\n> *${prompt}*\n\n${gptResponse}`
        if (interaction.guild === null) {
            await interaction.user.send(messageToSend, { split: true });
        } else {
            await interaction.channel.send(messageToSend, { split: true });
        }
    },
}
