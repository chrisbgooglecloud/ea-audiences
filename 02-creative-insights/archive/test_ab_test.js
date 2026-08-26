import { GoogleGenAI } from '@google/genai';

async function testSimulateABTest(apiKey) {
    const client = new GoogleGenAI({ apiKey: apiKey });

    const persona = {
        name: "Test Persona",
        bio: "I am a 45-year-old living in central Pennsylvania. I value community, family, and practical health solutions.",
        pain_points: ["High deductibles", "Confusing plans"],
        goals: ["Find affordable care", "Stay healthy"]
    };

    const variants = [
        { region: "Generic", description: "Standard corporate health campaign" },
        { region: "Central PA", description: "Image featuring rolling farm hills, community events, and a local vibe" },
        { region: "West PA", description: "Image featuring Pittsburgh skyline, bridges, and steel city culture" }
    ];

    const prompt = `
    You are evaluating marketing creative variants as a synthetic user.
    
    Persona Profile:
    Name: ${persona.name}
    Bio: ${persona.bio}
    Goals: ${persona.goals.join(", ")}

    Variants presented to you:
    ${variants.map(v => `- Variant: ${v.region}\n  Description: ${v.description}`).join("\n\n")}

    Task: Choose the single best variant that resonates most strongly with your persona and explain why. Be realistic.

    Return ONLY a JSON object:
    {
        "selectedVariant": "Region Name",
        "rationale": "Why you chose it...",
        "sentiment": "Positive/Neutral/Critical"
    }
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json"
            }
        });
        
        console.log("Response text:", response.text);
        const data = JSON.parse(response.text);
        console.log("Parsed result:", data);
        
        if (!data.selectedVariant || !data.rationale) {
            throw new Error("Missing required fields in response");
        }
        if (data.selectedVariant === "Central PA") {
            console.log("✅ Passed: Persona correctly preferred Central PA based on bio.");
        } else {
            console.warn("⚠️ Warning: Persona selected a different variant.", data.selectedVariant);
        }

    } catch (e) {
        console.error("Test failed:", e);
    }
}

async function testRegionalVariants(apiKey) {
    const client = new GoogleGenAI({ apiKey });
    
    // We'll just test the prompt generation for image editing here to ensure it's structurally sound
    // We won't actually hit the image endpoint to save time & money, just verify we can generate prompts
    const basePrompt = "A family enjoying a picnic in the park.";
    const regions = ["West New York", "Central PA", "Health specific"];

    const prompt = `
    Take the following base marketing concept: "${basePrompt}"
    
    Adapt this concept for the following regions/themes, adding specific imagery or cultural cues relevant to that region:
    ${regions.join(", ")}
    
    Return a JSON object mapping each region to a highly detailed image generation prompt.
    `;

    try {
        const response = await client.models.generateContent({
            model: 'gemini-3.1-flash-preview',
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const data = JSON.parse(response.text);
        console.log("Generated Prompts:", data);
        
        for (const r of regions) {
            if (!data[r]) {
                throw new Error(`Missing prompt for region: ${r}`);
            }
        }
        console.log("✅ Passed: All regional prompts generated.");

    } catch(e) {
        console.error("Regional variants test failed", e);
    }
}

async function runTests() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key provided in process.env.GEMINI_API_KEY");
        return;
    }
    console.log("Running A/B Test Simulation...");
    await testSimulateABTest(apiKey);
    console.log("\nRunning Regional Variant Generation Test...");
    await testRegionalVariants(apiKey);
}

runTests();
