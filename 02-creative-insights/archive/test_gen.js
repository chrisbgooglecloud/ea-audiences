import { GoogleGenAI } from '@google/genai';

async function test() {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await client.models.generateContent({
            model: 'gemini-3.1-flash-lite-image-preview',
            contents: [{ role: "user", parts: [{ text: "A cute puppy" }] }],
            config: {
                responseModalities: ["IMAGE", "TEXT"],
                tools: [{ googleSearch: {} }]
            }
        });
        console.log("Success", response.text);
    } catch (e) {
        console.error("Failed:", e.message);
    }
}
test();
