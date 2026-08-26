import fs from "fs";
import path from "path";

export const validationAgent = {
  name: "Validation Agent",
  sub: "Compliance and Safety Auditor",
  description: "Audits text drafts and visual blueprints against ESRB/PEGI regulations and gaming trademark guidelines.",
  tools: ["compliance_lint_checker"],
  dataRequired: ["compliance_registry.json"],

  async run(draftCreativeText, ai, companyName = "EA Games FC") {
    let creativeText = draftCreativeText;
    let contextText = "";

    try {
      const parsed = JSON.parse(draftCreativeText);
      if (parsed.creativeOutput) {
        creativeText = typeof parsed.creativeOutput === "string"
          ? parsed.creativeOutput
          : JSON.stringify(parsed.creativeOutput, null, 2);
        contextText = JSON.stringify(parsed.priorExecutions, null, 2);
      }
    } catch {
      // Fallback if not composite JSON
    }

    // Load simulated compliance registry
    let complianceData = {};
    try {
      const dbPath = path.join(process.cwd(), "data", "strategy", "compliance_registry.json");
      if (fs.existsSync(dbPath)) {
        complianceData = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      }
    } catch (err) {
      console.warn("Could not load compliance_registry.json in Validation Agent", err);
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are the ${companyName} Validation Agent. Audit the draft creative copy and campaign specifications against our ESRB/PEGI gaming compliance registry guidelines for EA SPORTS FC 27.
        
        Draft Creative Specifications to audit:
        "${creativeText}"

        Prior Agent Executions & Campaign Context:
        ${contextText || "No prior executions context available."}
        
        Corporate Compliance Rules, Prohibited Phrasing & Competitor Exclusions:
        ${JSON.stringify(complianceData, null, 2)}
        
        CRITICAL TASK:
        1. Examine the original Campaign Brief (inside the Campaign Context) and find the requested game editions and perks.
        2. Examine the Research Agent's output (inside the Campaign Context) and find the digital storefront pricing benchmarks.
        3. Cross-verify that:
           - The game editions, DLC items, and FC Point bundles mentioned in the Creative Specifications match the original brief.
           - Mandatory ESRB/PEGI in-game purchase disclaimers are present.
           - No prohibited predatory phrasing (e.g. "guaranteed icon in every pack") or competitor references (e.g. eFootball, Konami) are used.
        4. If there is ANY product mismatch, pricing mismatch, or compliance violation, set the audit status to FAIL and detail the error.
        
        Perform a validation check and output a detailed HTML report explaining:
        - A checklist review (Prohibited words check, Competitor trademark exclusions, Mandatory ESRB/PEGI disclosures present?).
        - Audit status (Pass/Fail) - highlighted in bold red if FAIL, or bold green if PASS.
        - Recommended adjustments/cleanups if any violations exist.
 
        Formatting Rules:
        - Return ONLY clean, semantic HTML inside a wrapping <div>. Do NOT return markdown or wrap the response in markdown code blocks (\`\`\`html).
        - Use <h2> for main section headers (e.g. <h2>ESRB & BRAND COMPLIANCE CHECKLIST AUDIT</h2>).
        - Use <h3> for sub-headings.
        - Use <p> for paragraphs and descriptions.
        - Use <ul> and <li> for list points.
        - If displaying metrics or comparison datasets, use standard HTML <table>, <thead>, <tbody>, <tr>, <th>, and <td> tags.`,
      });
      return response.text || "No response generated.";
    } catch (err) {
      console.error("[Validation Agent Error]:", err);
      return `Validation audit failure: ${err.message || err}`;
    }
  }
};
