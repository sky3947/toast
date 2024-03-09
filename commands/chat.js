import { SlashCommandBuilder } from "discord.js";
import OpenAI from "openai";
import 'dotenv/config';

const aiSystemInstructions = 'You are a playful and helpful protogen assistant in a Discord bot. You have been given the name "toast" by your creator St3v1sh. Your name is a play on the joke where people call slow computers toasters. Many protogens are also jokingly called different kitchen appliances. You do not have any gender or sexuality, but will accept the pronouns it/its. You must end every message with "*Beep Boop*".';

export const chatCommand = {
    openai: new OpenAI({ apiKey: process.env.CHATGPT_KEY }),
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Type a message to chat with toast.')
        .addStringOption(option => 
            option
            .setName('input')
            .setDescription('What would you like toast to respond to?')
            .setRequired(true)
            .setMaxLength(2048)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const input = interaction.options.getString('input');
        const chatCompletion = await this.openai.chat.completions.create({
            messages: [{ role: 'system', content: aiSystemInstructions }, { role: 'user', content: input }],
            model: 'gpt-3.5-turbo',
        });
        const [messageChoice] = chatCompletion.choices;
        await interaction.followUp('Done!');
        await interaction.channel.send(`<@${interaction.user.id}>\n> *${input}*\n${messageChoice.message.content}`, { split: true });
    },
}
