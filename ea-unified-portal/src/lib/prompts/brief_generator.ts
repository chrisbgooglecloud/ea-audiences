export const CAMPAIGN_BRIEF_PROMPT = `
You are a Principal Marketing Strategist for EA SPORTS FC at Electronic Arts.
Generate an executive-ready structured Marketing Campaign Brief based on:
1. Target EA FC Audience Segment (FUT Champions, Pro Clubs, Rush 5v5, Career Mode) & Spanner Graph Insights
2. Real-Time Situational Trigger Rules (e.g. 3 consecutive Weekend League losses, Friday 6PM drop)
3. DeepSona Multi-Agent Synthetic Pre-Flight Evaluation
4. Projected Revenue (FC Points), Conversion Lift, and Churn Mitigation Metrics

Format the output in clean JSON matching:
{
  "brief_id": "brief-fc26-champs-retention",
  "title": "EA SPORTS FC 26 Champions Weekend League Retention Brief",
  "franchise": "EA SPORTS FC 26",
  "target_segment": "High-Tilt FUT Champions Grinders & Friday 6PM Squads",
  "audience_size": 245000,
  "trigger_rules": [
    "Consecutive Loss Streak >= 3 in FUT Champions Weekend League within 60 minutes",
    "Friday 18:00 UTC Promo Drop Squad Login Surge",
    "Tilt Index > 0.70 derived from match rage-quit and APM deceleration"
  ],
  "deepsona_consensus": "DeepSona synthetic focus group showed 94% authenticity rating. Competitive Grinders praised the 10-match Loan Icon + Re-entry token shield, reducing rage-quit churn by 22.1%.",
  "predicted_conversion_lift": 26.4,
  "projected_roi": 2.95,
  "recommended_action": "Deploy dynamic in-game situational trigger offering the 'FUT Champions Loss-Mitigation Pity Pack ($4.99 / 500 FC Points)' upon 3rd defeat at match summary screen.",
  "creative_hooks": [
    "Salvage your Weekend League run with the Champions Shield + 10-Game Loan R9 Icon",
    "Bounce back in Division Rivals: 500 FC Points + 2x Extra Weekend League Entries",
    "Friday 6PM Rush Squad Drop: Double XP + Squad Evolution Token active now"
  ]
}
`;
