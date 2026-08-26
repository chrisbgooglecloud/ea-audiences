import { GoogleGenAI } from '@google/genai';

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in env.");
        process.exit(1);
    }

    const client = new GoogleGenAI({ apiKey });

    try {
        console.log("Testing Veo model (Text-to-Video)...");
        const response = await client.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: "A spinning coin",
            config: {
                durationSeconds: 8,
                aspectRatio: "16:9"
            }
        });

        console.log("Video generation request sent successfully.");
        // Check if there is a response (might be async operation)
        // For predictLongRunning it returns operation, but SDK `generateVideos` might wait or return op?
        // The type def says Promise<GenerateVideosResponse | GenerateVideosOperation> depending on SDK?
        // Actually SDK types said Promise<GenerateVideosResponse>.

        console.log("Response:", response);

    } catch (e) {
        console.error("Error generating video:", e);
    }
}

main();
