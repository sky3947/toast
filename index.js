import { ActivityType, Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import { onMessageCreate } from './events/message-create.js';
import { chatCommand } from './commands/chat.js';
import { newChatCommand } from './commands/newchat.js';
import { imageCommand } from './commands/image.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Set up slash commands.
const commands = new Collection();
commands.set(chatCommand.data.name, chatCommand);
commands.set(newChatCommand.data.name, newChatCommand);
commands.set(imageCommand.data.name, imageCommand);
client.commands = commands;

// Handle slash commands.
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error('No command', interaction.commandName);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);

        const errorReply = { content: 'An error occurred. :( *Beep Boop*', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorReply);
        } else {
            await interaction.reply(errorReply);
        }
    }
});

// Handle message responses.
client.on(Events.MessageCreate, onMessageCreate);

// Initialization.
client.once(Events.ClientReady, readyClient => {
    client.user.setActivity({ name: '\uD83C\uDF5E', state: 'Running on a toaster', type: ActivityType.Custom });
    console.log(readyClient.user.tag + ' is online *Beep Boop*');
});

client.login(process.env.DISCORD_TOKEN);
