import { GoogleGenAI, Modality, MediaResolution } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
    try {
        console.log("Connecting...");
        const session = await ai.live.connect({
            model: 'models/gemini-3.5-flash-lite-native-audio-preview-09-2025',
            callbacks: {
                onmessage: (m) => { console.log("Msg:", m.serverContent?.modelTurn ? "got audio" : m) }
            },
            config: {
                responseModalities: [Modality.AUDIO],
            }
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: "Say hello world" }] }],
            turnComplete: true
        });

        await new Promise(r => setTimeout(r, 4000));
        session.close();

    } catch (e) {
        console.error("Error:", e);
    }
}
run();
