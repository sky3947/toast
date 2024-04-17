import OpenAI from "openai";
import 'dotenv/config';

const openai = new OpenAI({ apiKey: process.env.CHATGPT_KEY });
const botInstructions = process.env.BOT_INSTRUCTIONS;

/**
 * @param {string[]} userMessages 
 * @param {string[]} assistantMessages 
 * @returns {Promise<string>}
 */
export async function chat(userMessages, assistantMessages) {
    userMessages = userMessages || [];
    assistantMessages = assistantMessages || [];

    // Prepare messages.
    const mergedMessages = userMessages.map((message, index) =>
        [
            message === undefined ? undefined : ({
                role: 'user',
                content: message,
            }),
            assistantMessages[index] === undefined ? undefined : ({
                role: 'assistant',
                content: assistantMessages[index],
            }),
        ]
    ).flat().filter(message => message !== undefined);

    // Make API call.
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: botInstructions }, ...mergedMessages],
        model: 'gpt-4-turbo',
    });

    // Return output.
    const [messageChoice] = chatCompletion.choices;
    return messageChoice.message.content;
}

/**
 * @param {string} prompt 
 * @returns {Promise<OpenAI.Images.Image>}
 */
export async function image(prompt) {
    // Make API call.
    const imageCompletion = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
    });

    // Return output.
    return imageCompletion.data[0];
}