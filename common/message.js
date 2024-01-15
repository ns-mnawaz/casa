import OpenAI from 'openai';
const apiKey = process.env.OPEN_AI_KEY;
const openAI = new OpenAI({ apiKey });
import log from './log.js';

/**
 * generate openAI message
 * @param {Object} house house object
 * @returns {string} message 
 */
async function get(company, rooms, rent, address, name, job) {
    try {
        const prompt = `Schreiben Sie eine Bewerbungsnachricht für ${company}, ${rooms}-Zimmer-Wohnung zur Miete in ${address} zum Preis von ${rent}, mein Name ist ${name} und ein ${job} mit einer stabilen Einkommensquelle`;
        // const prompt = 'Write an email for a family a 3 members, 3 rooms apartment rental at Gallwitzallee 100 Berlin after the visit today, I have stable income to afford rental arrears';
        const response = await openAI.completions.create({ model: 'text-davinci-003', prompt, temperature: 1, max_tokens: 1000, });
        return response?.choices[0]?.text
    } catch (error) {
        log.error('OpenAI get message error', error);
        return false;
    }
}

export { get };
