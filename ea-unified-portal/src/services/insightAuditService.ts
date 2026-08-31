import { GEMINI_MODELS, generateText, safeJsonParse } from './geminiService';

export interface ActionItem {
    id: string;
    title: string;
    description: string;
    owner: string;
    priority: 'critical' | 'high' | 'medium';
    expectedImpact: string;
    evidenceSource: string;
}

export interface DoubleDownFeature {
    id: string;
    name: string;
    category: string;
    positiveSignalRate: number; // e.g. 88%
    whyDoubleDown: string;
    recommendedPatchActions: string[];
    riskIfIgnored: string;
}

export interface GoNoGoDecision {
    id: string;
    featureName: string;
    category: string;
    decision: 'GO' | 'NO-GO' | 'RE-ARCHITECT';
    sentimentScore: number; // 0 - 100
    communityVerdict: string;
    strategicRationale: string;
    fc28Recommendation: string;
}

export interface InsightAuditReport {
    id: string;
    companyName: string;
    generatedAt: string;
    executiveSummary: {
        healthScore: number; // 0 - 100
        healthVerdict: string;
        topPositiveBreakthrough: string;
        primaryFrictionVector: string;
        summaryNarrative: string;
    };
    roadmap: {
        oneWeek: {
            theme: string;
            items: ActionItem[];
        };
        oneMonth: {
            theme: string;
            items: ActionItem[];
        };
        oneYear: {
            theme: string;
            items: ActionItem[];
        };
    };
    fc27DoubleDownFeatures: DoubleDownFeature[];
    fc28GoNoGoMatrix: GoNoGoDecision[];
    evidenceSummary: {
        individualCount: number;
        hasBulkAnalysis: boolean;
        noiseFilterSignalCount: number;
        noiseFilterTotal: number;
        alertsCount: number;
    };
}

// Hydrate upstream evidence across all 4 Insights components
export const hydrateInsightAuditEvidence = async (companyName: string = "2K Games (Take-Two Interactive)") => {
    let individualAnalyses: any[] = [];
    let bulkAnalysis: any = null;
    let noiseFilterData: any = null;
    let alertsData: any = null;

    // 1. Individual Insights
    try {
        const res = await fetch(`/api/insights/analyses-all?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) individualAnalyses = data;
        }
    } catch (e) {
        console.warn("Could not load individual analyses for audit:", e);
    }

    // 2. Bulk Analysis
    try {
        const res = await fetch(`/api/insights/analysis?analysisId=bulk_analysis&companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
            bulkAnalysis = await res.json();
        }
    } catch (e) {
        console.warn("Could not load bulk analysis for audit:", e);
    }

    // 3. Noise Filter
    try {
        const res = await fetch(`/api/load-run/noise_filter?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
            noiseFilterData = await res.json();
        }
    } catch (e) {
        console.warn("Could not load noise filter for audit:", e);
    }

    // 4. Alerts
    try {
        const res = await fetch(`/api/load-run/sentiment_anomaly_alerts?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
            alertsData = await res.json();
        }
    } catch (e) {
        console.warn("Could not load alerts for audit:", e);
    }

    return {
        individualAnalyses,
        bulkAnalysis,
        noiseFilterData,
        alertsData
    };
};

// Generate Comprehensive Insight Audit Report via Gemini 3.7 Flash
export const generateInsightAuditReport = async (
    evidence: {
        individualAnalyses: any[];
        bulkAnalysis: any;
        noiseFilterData: any;
        alertsData: any;
    },
    companyName: string = "EA Games FC",
    onProgress?: (msg: string) => void
): Promise<InsightAuditReport> => {
    console.log(`\n======================================================`);
    console.log(`📑 [INSIGHT AUDIT] Generating Strategic Audit Report for ${companyName} via Gemini 3.7 Flash`);
    console.log(`======================================================\n`);

    if (onProgress) onProgress("Synthesizing evidence across Individual Insights, Bulk, Noise Filter & Alerts...");

    const indivSummary = evidence.individualAnalyses.slice(0, 15).map(a => ({
        id: a.id || a.analysisId,
        title: a.title,
        type: a.type,
        overallSentiment: a.sentiment_overall || a.sentiment,
        keyFindings: a.summary || a.top_positives || []
    }));

    const bulkSummary = evidence.bulkAnalysis ? {
        takeaways: evidence.bulkAnalysis.gemini_summary || evidence.bulkAnalysis.takeaways || [],
        overallScore: evidence.bulkAnalysis.overall_sentiment_score || 72
    } : null;

    const noiseSummary = evidence.noiseFilterData ? {
        totalHarvested: evidence.noiseFilterData.totalHarvested,
        signalCount: evidence.noiseFilterData.signalCount,
        noisePercentage: evidence.noiseFilterData.noisePercentage,
        signalPercentage: evidence.noiseFilterData.signalPercentage,
        topFeatures: (evidence.noiseFilterData.nodes || []).filter((n: any) => n.type === 'feature').slice(0, 12).map((n: any) => ({
            label: n.label,
            category: n.category,
            sentiment: n.sentiment,
            positiveRatio: n.positiveRatio
        })),
        crossReleaseEvolution: evidence.noiseFilterData.crossReleaseEvolution || []
    } : null;

    const alertsSummary = evidence.alertsData ? {
        activeAlerts: (evidence.alertsData.alerts || []).slice(0, 5).map((al: any) => ({
            title: al.title,
            severity: al.severity,
            channel: al.channel,
            summary: al.summary
        }))
    } : null;

    const prompt = `You are the Chief Product Officer, Executive Producer, and Studio Analytics Director for ${companyName}.
Your objective is to conduct a strategic **INSIGHT AUDIT** by evaluating all findings across 4 core evidence channels:
1. Individual Insights (Video, Steam Reviews, Social Pulse, Reddit)
2. Bulk Research Analysis (Cross-channel synthesis)
3. Noise Filter Results (High-signal game mechanics isolated from pile-on negativity, cross-release trajectory FC 25 -> 26 -> 27)
4. Sentiment Anomaly Alerts (Friction spikes, netcode/crash flags)

==================================================
UPSTREAM EVIDENCE CORPUS:
==================================================
- Individual Analyses Count: ${evidence.individualAnalyses.length}
- Individual Samples: ${JSON.stringify(indivSummary, null, 2)}
- Bulk Research Summary: ${JSON.stringify(bulkSummary, null, 2)}
- Noise Filter High-Signal Summary: ${JSON.stringify(noiseSummary, null, 2)}
- Anomaly Alerts Summary: ${JSON.stringify(alertsSummary, null, 2)}

==================================================
STRATEGIC DIRECTIVES:
==================================================
1. Executive Health Scorecard: Determine overall player sentiment trajectory (0-100), top breakthrough, and primary friction.
2. Horizon Action Plan:
   - 1-Week Plan: Immediate hotfixes, server netcode tuning, urgent live comms.
   - 1-Month Plan: Upcoming Title Update tuning, balance tweaks (e.g. evolutions requirements, jockey acceleration).
   - 1-Year Plan: Long-term architectural engine, anti-cheat, and volumetric physics investments.
3. Features to Double Down on for FC 27 Patches:
   - Identify 4-5 gameplay features with high positive signal that should receive maximum dev polish and promotion in upcoming FC 27 patches (e.g. Rush 5v5 Mode, Manual Driven Pass Inertia, Untradeable Duplicate Storage, Youth Academy Physical Attributes).
4. FC 28 Go / No-Go Feature Matrix:
   - Provide concrete strategic verdicts for FC 28:
     - GO: Features to greenlight and expand.
     - NO-GO: Legacy mechanics to cut/deprecate.
     - RE-ARCHITECT: Mechanics that need a ground-up redesign (e.g., win-gated evolutions -> playtime gates, PC Anti-Cheat).

==================================================
REQUIRED OUTPUT SCHEMA:
==================================================
Return a valid JSON object matching this schema:
{
  "id": "audit-${Date.now()}",
  "companyName": "${companyName}",
  "generatedAt": "Today • Real-Time Insight Audit",
  "executiveSummary": {
    "healthScore": 78,
    "healthVerdict": "Strong Tactical Foundation with Addressable Live-Service Friction",
    "topPositiveBreakthrough": "Rush 5v5 Mode & Ground Pass Deceleration Physics",
    "primaryFrictionVector": "Evolutions 15-Win Requirement & PC DirectX 12 Anti-Cheat Crashes",
    "summaryNarrative": "Executive narrative summarizing community sentiment across FC 25, FC 26, and forward outlook into FC 27 and FC 28."
  },
  "roadmap": {
    "oneWeek": {
      "theme": "Live Service Stabilization & Anti-Cheat Hotfixes",
      "items": [
        {
          "id": "w1-1",
          "title": "Deploy DirectX 12 Splash Screen Hotfix for PC Title Update #4",
          "description": "Resolve splash screen crash vector affecting AMD and Nvidia GPUs post-patch.",
          "owner": "PC Core Engine Team",
          "priority": "critical",
          "expectedImpact": "Eliminate 70% of negative Steam review spikes within 48 hours.",
          "evidenceSource": "Steam Reviews & Reddit Bug Megathread"
        },
        {
          "id": "w1-2",
          "title": "Publish Developer Direct Memo on Evolutions Objective Adjustments",
          "description": "Acknowledge 15-win frustration and communicate upcoming Title Update gate changes.",
          "owner": "Live Ops & Community Comms",
          "priority": "high",
          "expectedImpact": "De-escalate viral creator friction and establish transparency.",
          "evidenceSource": "Social Pulse & YouTube Creator Sentiment"
        }
      ]
    },
    "oneMonth": {
      "theme": "Title Update 5 Balance & Objective Rework",
      "items": [
        {
          "id": "m1-1",
          "title": "Rework Evolution Progression from 'Wins' to 'Matches Played & Objectives'",
          "description": "Convert 15-win bottleneck into milestone match-completions to eliminate sweat-gate toxicity.",
          "owner": "FUT Game Design Team",
          "priority": "critical",
          "expectedImpact": "Increase active Evolution engagement by +35% among casual player base.",
          "evidenceSource": "Noise Filter FC 26 Signal Extraction"
        },
        {
          "id": "m1-2",
          "title": "Tune Manual Defensive Jockey Pivot Responsiveness (+8% Turn Rate)",
          "description": "Tighten deceleration radius to reward manual defending without over-buffing AI auto-tackling.",
          "owner": "Gameplay Physics Team",
          "priority": "high",
          "expectedImpact": "Restore competitive skill gap and positive sentiment in Division Rivals.",
          "evidenceSource": "Noise Filter Trajectory Matrix"
        }
      ]
    },
    "oneYear": {
      "theme": "Next-Gen Physics & Crossplay Infrastructure Overhaul",
      "items": [
        {
          "id": "y1-1",
          "title": "Re-engineer Anti-Cheat Architecture for Kernel-Level Zero-Stutter Compliance",
          "description": "Complete architectural redesign of PC Anti-Cheat to decouple from splash loader.",
          "owner": "Security & Architecture Group",
          "priority": "high",
          "expectedImpact": "Neutralize perpetual PC review bombing across multi-year cycles.",
          "evidenceSource": "Multi-Year Steam Sentiment Trend"
        },
        {
          "id": "y1-2",
          "title": "Unified Volumetric HyperMotion Match Engine Scale",
          "description": "Expand motion capture volumetric machine learning to full 22-man player inertia.",
          "owner": "Core Tech & Animation",
          "priority": "medium",
          "expectedImpact": "Establish unmatched realism benchmark for FC 28 marketing flight.",
          "evidenceSource": "Individual Video Creative Benchmarks"
        }
      ]
    }
  },
  "fc27DoubleDownFeatures": [
    {
      "id": "dd-1",
      "name": "ProPLAY Dynamic Motion & Animation Engine",
      "category": "Core Simulation Engine",
      "positiveSignalRate": 91,
      "whyDoubleDown": "Fastest growing positive signal with 91% acclaim; unmatched authenticity translating real NBA footage into responsive 1-to-1 moves.",
      "recommendedPatchActions": [
        "Expand signature step-backs and contest animations across all 30 NBA rosters",
        "Add contextual collision physics at the rim for contested layups",
        "Fine-tune green-release visual windows for custom jumpshots"
      ],
      "riskIfIgnored": "Player fatigue if animation latency or input lag is perceived during competitive online play."
    },
    {
      "id": "dd-2",
      "name": "The City Dynamic Parks & Fast Travel Hubs",
      "category": "Social World Innovation",
      "positiveSignalRate": 86,
      "whyDoubleDown": "Acclaimed social streetball immersion; reduced transit dead-time and enhanced squad matchmaking.",
      "recommendedPatchActions": [
        "Retain subway fast-travel nodes and optimize park loading textures",
        "Expand Pro-Am 3v3 and 5v5 dedicated server courts with zero latency",
        "Add seasonal night-market events with streetwear brand drops"
      ],
      "riskIfIgnored": "Oversized maps with empty walking space trigger community backlash."
    },
    {
      "id": "dd-3",
      "name": "Cap Breaker Attribute System & Zero Badge Regression",
      "category": "Live Service & Progression",
      "positiveSignalRate": 89,
      "whyDoubleDown": "Universal praise for eliminating badge decay while rewarding dedicated MyPLAYER rep grinding.",
      "recommendedPatchActions": [
        "Introduce seasonal Tier-2 Cap Breaker unlock tiers",
        "Expand attribute milestone cosmetics (exclusive shoes, park animations)"
      ],
      "riskIfIgnored": "Re-introducing badge decay or slow progression will cause massive churn."
    },
    {
      "id": "dd-4",
      "name": "MyTEAM Transparent Drop Rates & Player Market Auction",
      "category": "Live Economy",
      "positiveSignalRate": 84,
      "whyDoubleDown": "Restoring transparent auction trading and clear pack odds restored community trust and spending confidence.",
      "recommendedPatchActions": [
        "Maintain guaranteed promo box toppers with verifiable odds",
        "Implement anti-bot sniping algorithms for fair auction house trades"
      ],
      "riskIfIgnored": "Locking cards behind RNG gambling packs risks severe regulatory scrutiny."
    }
  ],
  "fc28GoNoGoMatrix": [
    {
      "id": "gng-1",
      "featureName": "ProPLAY Volumetric Motion Engine",
      "category": "Core Gameplay",
      "decision": "GO",
      "sentimentScore": 94,
      "communityVerdict": "Near-Universal Acclaim • Essential Franchise Pillar",
      "strategicRationale": "Proven realism driver that solidifies 2K's unmatched lead in sports simulation fidelity.",
      "fc28Recommendation": "Position as headline marketing feature for NBA 2K27 / 2K28 and expand to WWE and PGA franchises."
    },
    {
      "id": "gng-2",
      "featureName": "Forced Badge Floor Regression",
      "category": "Progression Mechanics",
      "decision": "NO-GO",
      "sentimentScore": 14,
      "communityVerdict": "Severe Community Backlash & Toxic Player Exhaustion",
      "strategicRationale": "Punishing players for not playing daily destroys casual-to-core retention.",
      "fc28Recommendation": "Permanently ban badge regression across all future 2K titles; replace with permanent milestone badges."
    },
    {
      "id": "gng-3",
      "featureName": "Unskippable The City Transit Walks",
      "category": "World Design",
      "decision": "NO-GO",
      "sentimentScore": 25,
      "communityVerdict": "Wasted Playtime Friction",
      "strategicRationale": "Excessive transit times between quest NPCs and courts causes player frustration.",
      "fc28Recommendation": "Enable instant teleportation to any court, shop, or arena directly from pause menu."
    },
    {
      "id": "gng-4",
      "featureName": "PC Next-Gen & Cross-Play Server Architecture",
      "category": "Online Infrastructure",
      "decision": "GO",
      "sentimentScore": 88,
      "communityVerdict": "Historic PC Breakthrough",
      "strategicRationale": "Delivering true next-gen parity and cross-play to PC unlocked +45% PC player base growth.",
      "fc28Recommendation": "Double down with dedicated 128-tick online tournament servers and Linux/Steam Deck optimization."
    },
    {
      "id": "gng-5",
      "featureName": "Pure Green Window Shooting Timing",
      "category": "Gameplay Physics",
      "decision": "GO",
      "sentimentScore": 86,
      "communityVerdict": "True Skill-Gap Basketball",
      "strategicRationale": "Rewards timing precision and shot IQ over RNG contested luck.",
      "fc28Recommendation": "Maintain customizable visual release cues (Push, Release, Set Point, Jump)."
    }
  ],
  "evidenceSummary": {
    "individualCount": ${evidence.individualAnalyses.length},
    "hasBulkAnalysis": ${Boolean(evidence.bulkAnalysis)},
    "noiseFilterSignalCount": ${evidence.noiseFilterData?.signalCount || 0},
    "noiseFilterTotal": ${evidence.noiseFilterData?.totalHarvested || 0},
    "alertsCount": ${(evidence.alertsData?.alerts || []).length}
  }
}

Return JSON only. No markdown formatting, no backticks.`;

    try {
        const text = await generateText(prompt, GEMINI_MODELS.FLASH, {
            responseMimeType: "application/json",
            temperature: 0.2
        });

        const parsed = safeJsonParse(text);
        if (parsed && parsed.executiveSummary && parsed.roadmap) {
            return parsed;
        }
        throw new Error("Invalid Insight Audit JSON structure");
    } catch (e) {
        console.error("Insight audit generation failed:", e);
        throw e;
    }
};
