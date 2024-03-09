import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import { chatCommand } from './commands/chat.js';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = new Collection();
commands.set(chatCommand.data.name, chatCommand);
client.commands = commands;

client.on(Events.InteractionCreate, async interaction => {
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
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'An error occurred. :(', ephemeral: true });
		} else {
			await interaction.reply({ content: 'An error occurred. :(', ephemeral: true });
		}
	}
});

client.once(Events.ClientReady, readyClient => {
    console.log(readyClient.user.tag + ' is online *Beep Boop*');
});

client.login(process.env.DISCORD_TOKEN);
