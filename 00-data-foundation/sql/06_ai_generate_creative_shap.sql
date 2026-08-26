-- ==============================================================================
-- 06: Bulk Generate Creative Mechanics & SHAP 9-Grid via BQML AI.GENERATE_TABLE
-- Enforces structured output schema using OUTPUT_SCHEMA parameter with gemini-3.7-flash
-- ==============================================================================

INSERT INTO `ea_measurement.fct_creative_shap_attributions` (
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
    ['Apex Legends', 'EA Sports FC', 'Battlefield 6', 'The Sims 4'][OFFSET(CAST(FLOOR(RAND() * 4) AS INT64))] AS franchise,
    ['EA_APP_LAUNCHER', 'IN_GAME_STORE', 'STADIUM_BOARDS', 'PAUSE_SCREENS', 'MOBILE_COMPANION', 'STREAMING_OVERLAYS'][OFFSET(CAST(FLOOR(RAND() * 6) AS INT64))] AS surface,
    CONCAT('camp-', CAST(FLOOR(RAND() * 10) + 1 AS INT64)) AS campaign_id,
    'Generate authentic creative gameplay mechanics, visual hooks, audio cues, and SHAP attribution values mapped to the Tactical 9-Grid.' AS prompt
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
  MODEL `ea_measurement.gemini_flash_model`,
  TABLE input_features,
  STRUCT(
    0.7 AS temperature,
    8192 AS max_output_tokens,
    '''
    feature_name STRING OPTIONS(description = 'Creative mechanic or visual hook name e.g. Squad Breach & Clear, Dynamic Weather Drop, Finessed Bicycle Kick, Kinetic Superglide'),
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
