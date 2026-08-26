import { GoogleGenAI, Modality, MediaResolution } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
    try {
        console.log("Connecting to Gemini Live with API key...");
        const session = await ai.live.connect({
            model: 'models/gemini-3.5-flash-lite-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
            }
        });
        console.log("Connected!");
        session.close();
    } catch (e) {
        console.error("Error connecting with API Key:", e);
    }
}
run();
