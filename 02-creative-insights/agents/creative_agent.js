import { GoogleGenAI } from "@google/genai";
import { safeParseJson } from "./orchestrator.js";

export const creativeAgent = {
  name: "Creative Gen Agent",
  sub: "Copywriter & Asset Compiler",
  description: "Generates creative themes, banner specs, copy hooks, and handles files uploads references to GCS for EA SPORTS FC 27.",
  tools: ["creative_concept_builder", "gcs_asset_uploader"],
  dataRequired: ["gcs_creative_assets_bucket"],

  async run(campaignParamsJson, ai, companyName = "EA Games FC") {
    const params = safeParseJson(campaignParamsJson, { name: "Active Campaign", objective: "General Promotion", divisionId: "Ultimate Team & In-Game Packs" });

    const toneDescription = "energetic, competitive, cinematic, tactical, and football-authentic tone";
    const imageThemeDescription = "next-gen volumetric HypermotionV+ match action, superstar athletes (Mbappé, Haaland, Bellingham, Vinicius Jr.), modern stadium floodlights, dynamic walkout pack pyrotechnics, or tactical chalkboard formations";

    const defaultTheme = `${companyName} The World's Game`;
    const defaultHeadline = "Experience next-level football authenticity with EA SPORTS FC 27.";
    const defaultVisual = "Dramatic floodlit stadium pitch, superstar athletes executing skill moves with HypermotionV+ particle overlays";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are the ${companyName} Creative Gen Agent. Generate marketing copywriting and banner specs for EA SPORTS FC 27.
        
        Campaign Context:
        ${JSON.stringify(params, null, 2)}
        
        CRITICAL TASK:
        1. Examine the "pricingGrounding" field in the Campaign Context.
        2. Extract the specific promotional editions, DLCs, or FC Points bundles and the benchmark pricing or recommended offers (e.g. "$99.99 Ultimate Edition", "Save 10% with EA Play", "4,600 FC Points included").
        3. You MUST explicitly embed these exact game editions, perks, and pricing numbers into the copywriting body of all assets (Email, SMS, Display Banner).
        4. Focus visual directions on authentic football gameplay, licensed clubs, iconic stadium atmosphere, and cover athletes.
        
        Return a JSON response conforming strictly to:
        {
          "theme": "The creative theme title",
          "headline": "Main marketing headline containing specific editions and pricing",
          "subHeadline": "Subheadline / Call-to-Action with exact offer perks",
          "visualDirection": "Visual layout description",
          "explainableCTRScore": 94,
          "assets": [
            {
              "type": "Email",
              "title": "Email Subject Line",
              "body": "Email body copywriting with ${toneDescription} containing the specific game editions and early access perks",
              "dimensions": "600x900px",
              "imgText": "A detailed descriptive prompt for generating a ${imageThemeDescription} using Gemini Flash Lite Image."
            },
            {
              "type": "SMS",
              "title": "SMS Short Offer",
              "body": "SMS copywriting matching character limits, containing specific price and pre-order perks",
              "dimensions": "160 Chars",
              "imgText": "No Image"
            },
            {
              "type": "Display Banner",
              "title": "Web banner copy",
              "body": "Banner overlay text copywriting with specific edition and price",
              "dimensions": "1200x628px",
              "imgText": "A detailed descriptive prompt for generating a ${imageThemeDescription} using Gemini Flash Lite Image."
            }
          ]
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              theme: { type: "STRING" },
              headline: { type: "STRING" },
              subHeadline: { type: "STRING" },
              visualDirection: { type: "STRING" },
              explainableCTRScore: { type: "INTEGER" },
              assets: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    type: { type: "STRING" },
                    title: { type: "STRING" },
                    body: { type: "STRING" },
                    dimensions: { type: "STRING" },
                    imgText: { type: "STRING" }
                  },
                  required: ["type", "title", "body", "dimensions", "imgText"]
                }
              }
            },
            required: ["theme", "headline", "subHeadline", "visualDirection", "explainableCTRScore", "assets"]
          }
        }
      });

      const creativeObj = safeParseJson(response.text || "{}", {});
      return JSON.stringify(creativeObj);
    } catch (err) {
      console.error("[Creative Agent Error]:", err);
      return JSON.stringify({
        error: `Creative asset generation failure: ${err.message || err}`,
        theme: defaultTheme,
        headline: defaultHeadline,
        subHeadline: "Pre-order now on the EA App and digital storefronts.",
        visualDirection: defaultVisual,
        explainableCTRScore: 88,
        assets: []
      });
    }
  },

  async generateImagesBackground(creativeObj, ai, onImageReady, companyName = "EA Games FC") {
    if (!creativeObj || !creativeObj.assets || !Array.isArray(creativeObj.assets)) return;

    console.log(`[Creative Agent - Async] Triggering concurrent image generation for ${creativeObj.assets.filter((a) => a.imgText && a.imgText !== "No Image").length} assets...`);

    // Map prompts to concurrent generateContent promises
    const promises = creativeObj.assets.map(async (asset) => {
      if (!asset.imgText || asset.imgText === "No Image") return;

      const runConfig = {
        model: "gemini-3.1-flash-lite-image",
        contents: [`Cinematic photorealistic EA SPORTS FC 27 video game advertisement visual, professional sports photography, dynamic lighting, dramatic stadium atmosphere. Scene: ${asset.imgText}`],
        config: {
          temperature: 1,
          topP: 0.95,
          maxOutputTokens: 32768,
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: asset.type === "Email" ? "4:3" : "16:9",
            imageSize: "1K",
            outputMimeType: "image/jpeg"
          },
          thinkingConfig: {
            thinkingLevel: "LOW"
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' }
          ]
        }
      };

      try {
        console.log(`[Creative Agent - Async] Concurrent image generation started for: "${asset.imgText}"`);
        const imgResponse = await ai.models.generateContent(runConfig);

        const part = imgResponse.candidates?.[0]?.content?.parts?.find(
          (p) => p.inlineData && p.inlineData.mimeType?.startsWith("image/")
        );
        const base64Bytes = part?.inlineData?.data;
        if (base64Bytes) {
          console.log(`[Creative Agent - Async] Concurrent image generation success for: "${asset.type}"`);
          onImageReady(asset.type, `data:image/png;base64,${base64Bytes}`);
        } else {
          console.warn(`[Creative Agent - Async] No image part found in response for prompt "${asset.imgText}"`);
        }
      } catch (imgErr) {
        console.error(`[Creative Agent - Async] Concurrent image generation failed for: "${asset.imgText}":`, imgErr.message || imgErr);
      }
    });

    // Execute concurrently
    await Promise.all(promises);
  }
};
