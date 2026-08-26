import { generateImageFromPrompt } from './services/geminiService.js';

async function test() {
    console.log("Testing image generation...");
    const url = await generateImageFromPrompt("A cute puppy");
    console.log("Result:", url);
}

test();
