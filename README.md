# toast

This is a Discord bot that uses ChatGPT to respond to commands and chatroom messages. Use `npm i` to install dependencies, `node deploy-commands.js` to deploy the bot's commands, and `node .` to run the bot.

## Environment Variables

Create a root-level `.env` file with your secrets. You need to define these secrets with your own keys and text:
```Properties
DISCORD_TOKEN=YOUR_DISCORD_BOTS_PRIVATE_TOKEN
DISCORD_CLIENT_ID=YOUR_DISCORD_BOTS_USER_ID
CHATGPT_KEY=YOUR_OPENAI_API_KEY
BOT_INSTRUCTIONS='You are a helpful assistant in a Discord bot'
```
