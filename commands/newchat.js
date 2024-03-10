import { ChannelType, SlashCommandBuilder, userMention } from "discord.js";

export const newChatCommand = {
    data: new SlashCommandBuilder()
        .setName('newchat')
        .setDescription('Creates a new chat thread with toast. This command gives toast a message history.'),
    async execute(interaction) {
        // Defer message to buy time for processing.
        await interaction.deferReply({ ephemeral: true });

        // Only allow in chats that support threads.
        try {
            const thread = await interaction.channel.threads.create({
                name: `${interaction.member.nickname}'s chat with toast`,
                autoArchiveDuration: 60,
                type: ChannelType.PrivateThread,
                reason: 'Thread creation for chatting with message history',
            });
            await interaction.followUp(`Chatroom created: https://discord.com/channels/${thread.guild.id}/${thread.id}`);

            // Populate metadata.
            thread.send(`${userMention(interaction.user.id)}\nHello! This message sets up some metadata for our conversation. Chat with me by sending messages to this thread! *Beep Boop*`);
        } catch (error) {
            await interaction.followUp('Cannot create a chat thread here :( *Beep Boop*');
        }
    }
}
