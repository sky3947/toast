import { SlashCommandBuilder } from "discord.js";

export const chatCommand = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Type a message to chat with toast.'),
    async execute(interaction) {
        console.log(interaction);
        await interaction.reply('WIP');
    }
}
