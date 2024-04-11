import { ChatInputCommandInteraction, SlashCommandBuilder, userMention } from "discord.js";
import { image } from "../gpt-interface.js";

export const imageCommand = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('Ask Toast to generate an image from a prompt.')
        .addStringOption(option =>
            option
                .setName('prompt')
                .setDescription('The prompt to generate an image from.')
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
        const { revised_prompt, url } = await image(prompt);

        // Delete deferred reply.
        await interaction.deleteReply();

        // Send a reply.
        const messageToSend = `${userMention(interaction.user.id)} wants to generate an image:\n> *${prompt}*\n\nRevised prompt by OpenAI:\n> ${revised_prompt}\n\n[Image Link](${url})`
        if (interaction.guild === null) {
            await interaction.user.send(messageToSend, { split: true });
        } else {
            await interaction.channel.send(messageToSend, { split: true });
        }
    },
}
