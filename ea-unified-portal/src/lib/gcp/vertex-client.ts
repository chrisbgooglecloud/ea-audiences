import { VertexAI } from "@google-cloud/vertexai";
import { GCP_CONFIG } from "../config";

let vertexAI: VertexAI | null = null;

export function getVertexAI() {
  if (!vertexAI) {
    vertexAI = new VertexAI({
      project: GCP_CONFIG.projectId,
      location: GCP_CONFIG.region,
    });
  }
  return vertexAI;
}

export function getGenerativeModel(
  modelName: string = GCP_CONFIG.vertexModel,
  isJson: boolean = false
) {
  const vertex = getVertexAI();
  return vertex.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: isJson ? "application/json" : "text/plain",
    },
  });
}

/**
 * Robust live Vertex AI content generator that queries Gemini Flash-Lite live.
 */
export async function generateVertexContent(prompt: string, isJson: boolean = true): Promise<string> {
  const vertex = getVertexAI();
  const candidateModels = Array.from(
    new Set([GCP_CONFIG.vertexModel, "gemini-3.5-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"])
  );

  for (const modelName of candidateModels) {
    try {
      const model = vertex.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          responseMimeType: isJson ? "application/json" : "text/plain",
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text) {
        return text;
      }
    } catch (e: any) {
      // Try next supported model endpoint
    }
  }

  throw new Error("Vertex AI Gemini model endpoint failed to generate content.");
}
