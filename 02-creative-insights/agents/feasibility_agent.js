import fs from "fs";
import path from "path";

export const feasibilityAgent = {
  name: "Feasibility Agent",
  sub: "Audience & Reach Inspector",
  description: "Queries C360 directories, calculates target gamer cohort sizes, and checks platform contact frequency caps.",
  tools: ["c360_cohort_evaluator"],
  dataRequired: ["c360_opt_in.json"],

  async run(campaignParamsJson, ai, companyName = "EA Games FC") {
    let params = {};
    try {
      params = JSON.parse(campaignParamsJson);
    } catch {
      params = { name: "Active Campaign", divisionId: "Ultimate Team & In-Game Packs" };
    }

    // Load simulated DB
    let mockC360Data = [];
    try {
      const dbPath = path.join(process.cwd(), "data", "strategy", "c360_opt_in.json");
      if (fs.existsSync(dbPath)) {
        mockC360Data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      }
    } catch (err) {
      console.warn("Could not load c360_opt_in.json in Feasibility Agent", err);
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are the ${companyName} Feasibility Agent. Check target audience reachability and contact frequency limits across console, PC, and mobile companion app telemetry for EA SPORTS FC 27.
        
        Campaign Parameters:
        ${JSON.stringify(params, null, 2)}
        
        Gamer Opt-in Database Telemetry:
        ${JSON.stringify(mockC360Data, null, 2)}
        
        Formulate a structured HTML feasibility report explaining:
        - Target gamer audience reach matching this division/segments.
        - Opt-in status check across in-game notifications, push alerts, and email.
        - Overlap collision warnings if contact frequency limits are exceeded.
        - Recommended adjustments to parameters if needed.

        Formatting Rules:
        - Return ONLY clean, semantic HTML inside a wrapping <div>. Do NOT return markdown or wrap the response in markdown code blocks (\`\`\`html).
        - Use <h2> for main section headers (e.g. <h2>AUDIENCE COHORT REACH</h2>).
        - Use <h3> for sub-headings.
        - Use <p> for paragraphs and descriptions.
        - Use <ul> and <li> for list points.
        - If displaying metrics or comparison datasets, use standard HTML <table>, <thead>, <tbody>, <tr>, <th>, and <td> tags.`,
      });
      return response.text || "No response generated.";
    } catch (err) {
      console.error("[Feasibility Agent Error]:", err);
      return `Feasibility analysis failure: ${err.message || err}`;
    }
  }
};
