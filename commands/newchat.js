import { ChannelType, ChatInputCommandInteraction, SlashCommandBuilder, userMention, ThreadChannel, GuildTextThreadManager } from "discord.js";

export const newChatCommand = {
    data: new SlashCommandBuilder()
        .setName('newchat')
        .setDescription('Creates a new chat thread with toast to give it chat history.'),
    /**
     * @param {ChatInputCommandInteraction<>} interaction 
     */
    async execute(interaction) {
        // Defer message to buy time for processing.
        await interaction.deferReply({ ephemeral: true });

        // Only allow in chats that support threads.
        try {
            // Help VSCode keep track of threads type.
            /** @type {GuildTextThreadManager<>} */
            const threads = interaction.channel.threads;

            /** @type {ThreadChannel} */
            const thread = await threads.create({
                name: `${interaction.member.nickname}'s chat with toast`,
                autoArchiveDuration: 60,
                type: ChannelType.PrivateThread,
                reason: 'Thread creation for chatting with toast with message history',
            });
            await interaction.followUp(`*Beep Boop* Chatroom created: ${thread.url}`);

            // Populate metadata.
            thread.send(`${userMention(interaction.user.id)}\nHello! This message sets up some metadata for our conversation. Please wait for my response before sending additional messages. Please do not delete messages because that will mess up my processing. Chat with me by sending messages to this thread! *Beep Boop*`);
        } catch (error) {
            await interaction.followUp('Cannot create a chat thread here :( *Beep Boop*');
        }
    }
}
