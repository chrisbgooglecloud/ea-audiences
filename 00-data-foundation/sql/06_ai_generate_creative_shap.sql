-- ==============================================================================
-- 06: Bulk Generate Creative Mechanics & SHAP 9-Grid via BQML AI.GENERATE_TABLE
-- Enforces structured output schema using OUTPUT_SCHEMA parameter with gemini-3.7-flash
-- ==============================================================================

INSERT INTO `twok_measurement.fct_creative_shap_attributions` (
  attribution_id,
  snapshot_date,
  campaign_id,
  franchise,
  feature_name,
  feature_category,
  funnel_stage,
  surface,
  frequency_count,
  mean_shap_value,
  marginal_roas_impact,
  tactical_quadrant,
  strategic_recommendation,
  creative_reasoning,
  updated_at
)
WITH input_features AS (
  SELECT
    ['NBA 2K26', 'Borderlands 4', 'Civilization VII', 'WWE 2K25'][OFFSET(CAST(FLOOR(RAND() * 4) AS INT64))] AS franchise,
    ['2K_STOREFRONT', 'THE_CITY_BILLBOARDS', 'MYCAREER_FACILITY', 'MYTEAM_MARKETPLACE', 'MOBILE_COMPANION', 'TWITCH_EXTENSION'][OFFSET(CAST(FLOOR(RAND() * 6) AS INT64))] AS surface,
    CONCAT('camp-', CAST(FLOOR(RAND() * 10) + 1 AS INT64)) AS campaign_id,
    'Generate authentic 2K creative gameplay mechanics, visual hooks, audio cues, and SHAP attribution values mapped to the Tactical 9-Grid.' AS prompt
  FROM UNNEST(GENERATE_ARRAY(1, 10))
)
SELECT
  GENERATE_UUID() AS attribution_id,
  CURRENT_DATE() AS snapshot_date,
  inp.campaign_id,
  inp.franchise,
  gen.feature_name,
  gen.feature_category,
  gen.funnel_stage,
  inp.surface,
  gen.frequency_count,
  gen.mean_shap_value,
  gen.marginal_roas_impact,
  gen.tactical_quadrant,
  gen.strategic_recommendation,
  gen.creative_reasoning,
  CURRENT_TIMESTAMP() AS updated_at
FROM AI.GENERATE_TABLE(
  MODEL `twok_measurement.gemini_flash_model`,
  TABLE input_features,
  STRUCT(
    0.7 AS temperature,
    8192 AS max_output_tokens,
    '''
    feature_name STRING OPTIONS(description = 'Creative mechanic or visual hook name e.g. ProPLAY Step-Back Iso, The REC 5v5 Squad Highlight, Mayhem 10 Raid Boss, Age of Antiquity Leader Transition'),
    feature_category STRING OPTIONS(description = 'Category: GAMEPLAY_MECHANIC, VISUAL_HOOK, AUDIO_CUE, SURFACE_ALIGNMENT'),
    funnel_stage STRING OPTIONS(description = 'Funnel stage: ToFu_Exploration, MoFu_Progression, BoFu_Conversion'),
    frequency_count INT64 OPTIONS(description = 'Historical frequency occurrence in creative asset library (1 to 80)'),
    mean_shap_value FLOAT64 OPTIONS(description = 'Mean SHAP attribution impact (-0.45 to +0.85)'),
    marginal_roas_impact FLOAT64 OPTIONS(description = 'Marginal ROAS multiplier (0.80x to 4.20x)'),
    tactical_quadrant STRING OPTIONS(description = 'Tactical 9-Grid Quadrant: GOLD_MINES, CORE_DRIVERS, SATURATED_STARS, UNTAPPED, WORKHORSES, EFFICIENCY_RISKS, NOISE, UNDERPERFORMERS, MONEY_PITS'),
    strategic_recommendation STRING OPTIONS(description = 'Action rule: Scale Up, Maintain, Monitor, Test More, Optimize, Trim Budget, Discard, Pivot Creative, Kill Immediately'),
    creative_reasoning STRING OPTIONS(description = 'Executive reasoning summary explaining causal link to player engagement and ROAS')
    ''' AS output_schema
  )
) gen
JOIN input_features inp ON TRUE;
