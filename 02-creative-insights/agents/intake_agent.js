export const intakeAgent = {
  name: "Intake Agent",
  sub: "Natural Language Parser",
  description: "Parses plain text campaign briefs into structured parameters for EA SPORTS FC 27.",
  tools: ["nlp_intent_parser"],
  dataRequired: ["category_taxonomies"],
  
  async run(prompt, ai, companyName = "EA Games FC") {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are the ${companyName} Intake Agent. Parse the gaming marketing brief and extract campaign properties for EA SPORTS FC 27.
        Brief: "${prompt}"
        
        Return a JSON response conforming strictly to:
        {
          "name": "Brief title",
          "objective": "Objective summary",
          "divisionId": "One of: Ultimate Team & In-Game Packs, Career Mode & DLC Expansions, FC Points & Digital Bundles, Brand Sponsorships & Virtual Gear, Esports & Live Tournaments, Community Drops & Free Rewards",
          "audienceSegment": "Primary gamer segment target (e.g. Competitive Ultimate Team Players, Career Mode Tacticians, VOLTA Street Squads)",
          "projectedBudget": 75000,
          "tier": "Tier 1 (High) or Tier 2 (Medium) or Tier 3 (Low)"
        }`,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      return response.text || "{}";
    } catch (err) {
      console.error("[Intake Agent Error]:", err);
      return JSON.stringify({
        error: `Intake parsing failure: ${err.message || err}`,
        fallbackName: `EA SPORTS FC 27 Campaign`,
        divisionId: "Ultimate Team & In-Game Packs",
        projectedBudget: 50000,
        tier: "Tier 2 (Medium)"
      });
    }
  }
};
