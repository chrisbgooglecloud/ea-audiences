export const researchAgent = {
  name: "Research Agent",
  sub: "Market Trends Grounding",
  description: "Leverages Google Search Grounding to validate campaign concepts and benchmark real-time digital gaming editions, DLCs, and competitor sports games.",
  tools: ["google_search_grounding"],
  dataRequired: [],

  async run(campaignTheme, ai, companyName = "EA Games FC") {
    let themeText = campaignTheme;
    let divisionCategory = "";
    try {
      const parsed = JSON.parse(campaignTheme);
      themeText = parsed.name || parsed.objective || campaignTheme;
      divisionCategory = parsed.divisionId || "";
    } catch {
      // Fallback if raw string
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are the ${companyName} Research Agent. Use Google Search Grounding to validate the proposed campaign concept and cross-reference with real-time digital gaming storefront data (PlayStation Store, Xbox Store, Steam, EA App) and sports gaming community trends for EA SPORTS FC 27.
        
        Campaign parameters context:
        "${campaignTheme}"
        
        CRITICAL TASK:
        1. Parse the campaign parameters json above to identify the specific target products, game editions, DLC items, or virtual currency packs (e.g. "Standard Edition", "Ultimate Edition", "4,600 FC Points bundle", "Career Mode DLC", "Season Pass").
        2. Perform Google Search queries focusing on digital video game pricing benchmarks, pre-order incentives, and competitive sports gaming titles (e.g. eFootball, Football Manager, NBA 2K).
        3. Benchmark the proposed pricing and promotional value proposition against digital gaming market standards.
        
        Formulate a detailed HTML market analysis report explaining:
        - Digital storefront pricing competitiveness analysis (grounded on current search-retrieved pricing benchmarks).
        - Real-time gamer demand index for these specific editions/features (e.g. HypermotionV+, FC IQ tactics, Ultimate Team early access).
        - Trend validation alignment (Does this campaign theme align with active gamer search trends, transfer windows, or tournament seasonality?).
        
        Include search sources, URLs, or citations if applicable.
 
        Formatting Rules:
        - Return ONLY clean, semantic HTML inside a wrapping <div>. Do NOT return markdown or wrap the response in markdown code blocks (\`\`\`html).
        - Use <h2> for main section headers (e.g. <h2>REAL-TIME PRICE & VALUE COMPETITIVENESS ANALYSIS</h2>).
        - Use <h3> for sub-headings.
        - Use <p> for paragraphs and descriptions.
        - Use <ul> and <li> for list points.
        - If displaying metrics or comparison datasets, use standard HTML <table>, <thead>, <tbody>, <tr>, <th>, and <td> tags.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      return response.text || "No response generated.";
    } catch (err) {
      console.error("[Research Agent Error]:", err);
      return `<div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
        <strong>Research Agent Failure:</strong> ${err.message || err}
      </div>`;
    }
  }
};
