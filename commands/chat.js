import { ChatInputCommandInteraction, SlashCommandBuilder, userMention } from "discord.js";
import { chat } from "../gpt-interface.js";

export const chatCommand = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Type a message to chat with toast with no chat history.')
        .addStringOption(option =>
            option
            .setName('input')
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
        const input = interaction.options.getString('input');
        const gptResponse = await chat([input]);

        // Keep the deferred message to allow up-arrow.
        await interaction.followUp('Done!');

        // Send a reply.
        const messageToSend = `${userMention(interaction.user.id)} says:\n> *${input}*\n\n${gptResponse}`
        if (interaction.guild === null) {
            await interaction.user.send(messageToSend, { split: true });
        } else {
            await interaction.channel.send(messageToSend, { split: true });
        }
    },
}
