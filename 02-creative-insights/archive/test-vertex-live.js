import { GoogleGenAI, Modality, MediaResolution } from '@google/genai';
const ai = new GoogleGenAI({ vertexai: { project: process.env.GOOGLE_CLOUD_PROJECT || 'rl-stylist', location: 'us-central1' } });
async function run() {
    try {
        console.log("Connecting to Vertex Live...");
        const session = await ai.live.connect({
            model: 'gemini-2.0-flash-exp', // Vertex AI model name format
            config: {
                responseModalities: [Modality.AUDIO],
            }
        });
        console.log("Connected!");
        session.close();
    } catch (e) {
        console.error("Error connecting via Vertex:", e);
    }
}
run();
