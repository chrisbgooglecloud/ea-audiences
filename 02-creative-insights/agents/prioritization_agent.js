import fs from "fs";
import path from "path";

export const prioritizationAgent = {
  name: "Prioritization Agent",
  sub: "Conflict & Queue Ranking Manager",
  description: "Resolves priority conflicts when multiple live-service campaigns compete for same gamer segments.",
  tools: ["ranking_prioritization_engine"],
  dataRequired: ["m360_historical.json", "c360_opt_in.json"],

  async run(campaignParamsJson, ai, companyName = "EA Games FC") {
    let params = {};
    try {
      params = JSON.parse(campaignParamsJson);
    } catch {
      params = { name: "Active Campaign", divisionId: "Ultimate Team & In-Game Packs", tier: "Tier 2 (Medium)" };
    }

    // Load simulated DB
    let mockM360Data = [];
    try {
      const dbPath = path.join(process.cwd(), "data", "strategy", "m360_historical.json");
      if (fs.existsSync(dbPath)) {
        mockM360Data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      }
    } catch (err) {
      console.warn("Could not load m360_historical.json", err);
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are the ${companyName} Prioritization Agent. Resolve campaign queue ranking and schedule conflicts across in-game live service events and store drops for EA SPORTS FC 27.
        
        New Campaign:
        ${JSON.stringify(params, null, 2)}
        
        Historical & Active Live-Service Campaigns Database:
        ${JSON.stringify(mockM360Data, null, 2)}
        
        Provide a detailed HTML conflict report:
        - Conflict overlap index (does this conflict with active Weekend League, TOTS, or Promo events?).
        - Ranking priority recommendation based on campaign tier and objective values.
        - Founder Status and EA Play subscriber priority multipliers.

        Formatting Rules:
        - Return ONLY clean, semantic HTML inside a wrapping <div>. Do NOT return markdown or wrap the response in markdown code blocks (\`\`\`html).
        - Use <h2> for main section headers (e.g. <h2>SCHEDULING CONFLICT INDEX</h2>).
        - Use <h3> for sub-headings.
        - Use <p> for paragraphs and descriptions.
        - Use <ul> and <li> for list points.
        - If displaying metrics or comparison datasets, use standard HTML <table>, <thead>, <tbody>, <tr>, <th>, and <td> tags.`,
      });
      return response.text || "No response generated.";
    } catch (err) {
      console.error("[Prioritization Agent Error]:", err);
      return `Prioritization check failure: ${err.message || err}`;
    }
  }
};
