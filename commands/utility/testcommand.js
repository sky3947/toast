import { SlashCommandBuilder } from "discord.js";

export const testCommand = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('test command'),
    async execute(interaction) {
        console.log(interaction);
        await interaction.reply('test command successful');
    }
}
