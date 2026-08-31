import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GCP_CONFIG } from "@/lib/config";

let aiClient: GoogleGenAI | null = null;

function getGenAiClient(): GoogleGenAI {
  if (!aiClient) {
    const project = GCP_CONFIG.projectId || "agent-engine-468716";
    const location = GCP_CONFIG.region || "us-central1";
    aiClient = new GoogleGenAI({
      vertexai: true,
      project,
      location,
    });
  }
  return aiClient;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { model, contents, config } = body;

    // Use fast & reliable model available in vertex project
    const targetModel = model && !model.includes("image") && !model.includes("veo")
      ? (model.includes("3.5") || model.includes("3.1") || model.includes("3.7") ? "gemini-2.5-flash" : model)
      : "gemini-2.5-flash";

    const ai = getGenAiClient();

    // Standardize contents
    let formattedContents: any = contents;
    if (typeof contents === "string") {
      formattedContents = [{ role: "user", parts: [{ text: contents }] }];
    } else if (contents && !Array.isArray(contents) && contents.parts) {
      formattedContents = [{ role: "user", parts: contents.parts }];
    } else if (Array.isArray(contents)) {
      formattedContents = contents.map((c: any) => {
        if (!c.role && c.parts) return { ...c, role: "user" };
        if (!c.parts && !c.role) return { role: "user", parts: [c] };
        return c;
      });
    }

    const genConfig: any = {
      temperature: config?.temperature ?? 0.2,
      maxOutputTokens: config?.maxOutputTokens ?? 8192,
    };

    if (config?.responseMimeType) {
      genConfig.responseMimeType = config.responseMimeType;
    }
    if (config?.responseSchema) {
      genConfig.responseSchema = config.responseSchema;
    }

    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: formattedContents,
        config: genConfig,
      });

      const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return NextResponse.json({
        candidates: [
          {
            content: {
              parts: [{ text: responseText }],
              role: "model",
            },
            finishReason: "STOP",
          },
        ],
        text: responseText,
      });
    } catch (modelErr: any) {
      console.warn(`[GenAI API] Primary model '${targetModel}' failed, falling back to gemini-2.5-flash:`, modelErr?.message);
      
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattedContents,
        config: genConfig,
      });

      const responseText = fallbackResponse.text || fallbackResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return NextResponse.json({
        candidates: [
          {
            content: {
              parts: [{ text: responseText }],
              role: "model",
            },
            finishReason: "STOP",
          },
        ],
        text: responseText,
      });
    }
  } catch (error: any) {
    console.error("[GenAI Proxy API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate content via Vertex AI" },
      { status: 500 }
    );
  }
}
