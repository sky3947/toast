import { REST, Routes } from 'discord.js';
import { chatCommand } from './commands/chat.js';
import { newChatCommand } from './commands/newchat.js';
import { imageCommand } from './commands/image.js';
import 'dotenv/config';

const commands = [chatCommand.data.toJSON(), newChatCommand.data.toJSON(), imageCommand.data.toJSON()];
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
    await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
    );
    console.log('successfully reloaded commands');
} catch (error) {
    console.error(error);
}
