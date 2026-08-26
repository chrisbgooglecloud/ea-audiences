import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in env.");
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });

  const imagePath = path.join(process.cwd(), 'public/images/qvc-logo.png');
  if (!fs.existsSync(imagePath)) {
    console.error("Image not found at:", imagePath);
    process.exit(1);
  }

  const base64Image = fs.readFileSync(imagePath).toString('base64');

  try {
    console.log("Testing Veo model with top-level 'image' parameter + polling...");

    const response = await client.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: "A spinning shoe",
      image: {
        imageBytes: base64Image,
        mimeType: "image/png"
      },
      config: {
        durationSeconds: 6,
        aspectRatio: "16:9",
      }
    });

    console.log("Image-to-Video generation request sent successfully.");
    console.log("Initial Response Name:", response.name);

    // Poll for completion
    let operation = response;
    const POLL_INTERVAL = 5000;
    const MAX_POLLS = 60;

    for (let i = 0; i < MAX_POLLS; i++) {
      if (operation.done) {
        console.log("Video generation completed in loop.");
        break;
      }
      console.log(`Waiting for video generation... attempt ${i + 1}/${MAX_POLLS}`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

      try {
        const opResp = await client.operations.get({ operation: operation });
        console.log("Raw Operation Response:", JSON.stringify(opResp, null, 2));

        // Attempt to determine if opResp is the operation itself or a wrapper
        if (opResp) {
          operation = opResp;
        }
        if (opResp.name) {
          operation = opResp;
        } else if (opResp.done !== undefined) {
          Object.assign(operation, opResp);
        } else {
          console.warn("Operation response structure unclear:", Object.keys(opResp));
        }
      } catch (e) {
        console.warn("Error refreshing operation:", e.message);
      }
    }

    if (operation.done) {
      console.log("Video Generation DONE!");
      // console.log("Final Result Keys:", Object.keys(operation.result || {}));
      // console.log("Generated Videos:", operation.result?.generatedVideos?.length);
      if (operation.result?.generatedVideos?.[0]?.video?.encodedVideo) {
        console.log("SUCCESS: Video bytes present.");
      } else {
        console.log("WARNING: Video bytes missing? Result:", JSON.stringify(operation.result, null, 2));
      }
    } else {
      console.error("Timed out waiting for video.");
    }

  } catch (e) {
    console.error("Error generating video:", e);
  }
}

main();
