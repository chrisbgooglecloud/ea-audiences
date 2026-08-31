export const CAMPAIGN_BRIEF_PROMPT = `
You are a Principal Marketing Strategist for 2K Games at Take-Two Interactive.
Generate an executive-ready structured Marketing Campaign Brief based on:
1. Target 2K Audience Segment (The City MyCAREER, MyTEAM, ProPASS, Borderlands Co-Op, Civ VII) & Spanner Graph Insights
2. Real-Time Situational Trigger Rules (e.g. 3 consecutive The REC losses, Friday 11AM EST Dark Matter Drop)
3. DeepSona Multi-Agent Synthetic Pre-Flight Evaluation
4. Projected Revenue (Virtual Currency / VC), Conversion Lift, and Churn Mitigation Metrics

Format the output in clean JSON matching:
{
  "brief_id": "brief-nba2k26-rec-retention",
  "title": "NBA 2K26 The City & The REC Loss-Streak Retention Brief",
  "franchise": "NBA 2K26",
  "target_segment": "High-Tilt The REC Streetballers & Weekend Pro-Am Squads",
  "audience_size": 285000,
  "trigger_rules": [
    "Consecutive Loss Streak >= 3 in The REC or Pro-Am within 90 minutes",
    "Friday 11:00 EST Promo Drop Squad Login Surge",
    "Tilt Index > 0.70 derived from match rage-quit and shot meter deceleration"
  ],
  "deepsona_consensus": "DeepSona synthetic focus group showed 94% authenticity rating. The City Hoopers praised the 5,000 VC + 2-Hour 2x Rep & Gatorade boost pack, reducing slump churn by 26.2%.",
  "predicted_conversion_lift": 28.5,
  "projected_roi": 3.12,
  "recommended_action": "Deploy dynamic in-game situational trigger offering the 'The REC Loss-Mitigation Tilt Shield ($4.99 / 5,000 VC)' upon 3rd defeat at match summary screen.",
  "creative_hooks": [
    "Protect your The City rep with the 2-Hour 2x Rep Token + 10x Gatorade Boosts",
    "Bounce back in The REC: 5,000 VC + Cap Breaker Badge Progress Accelerator",
    "Friday 11AM MyTEAM Drop: Guaranteed 100 OVR Holo Dark Matter Topper active now"
  ]
}
`;
