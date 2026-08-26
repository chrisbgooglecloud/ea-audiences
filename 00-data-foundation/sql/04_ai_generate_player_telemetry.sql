-- ==============================================================================
-- 04: Bulk Generate Player Telemetry & Churn Prediction Events via BQML AI.GENERATE_TABLE
-- Enforces structured output schema using OUTPUT_SCHEMA parameter with gemini-3.7-flash
-- ==============================================================================

INSERT INTO `ea_audiences.fct_player_telemetry_events` (
  event_id,
  session_id,
  xuid,
  ea_id,
  franchise,
  timestamp,
  session_length_minutes,
  actions_per_minute,
  loss_streak_count,
  store_page_visits,
  churn_probability,
  behavioral_state,
  state_transition_reason
)
WITH input_sessions AS (
  SELECT
    CONCAT('sess-', GENERATE_UUID()) AS session_id,
    CONCAT('xuid-', CAST(FLOOR(RAND() * 1000000) AS INT64)) AS xuid,
    CONCAT('ea-user-', CAST(FLOOR(RAND() * 1000000) AS INT64)) AS ea_id,
    ['Apex Legends', 'EA Sports FC', 'Battlefield 6', 'The Sims 4'][OFFSET(CAST(FLOOR(RAND() * 4) AS INT64))] AS franchise,
    TIMESTAMP_ADD(
      TIMESTAMP '2026-07-01 00:00:00 UTC',
      INTERVAL CAST(FLOOR(RAND() * 2592000) AS INT64) SECOND
    ) AS timestamp,
    'Generate realistic telemetry metrics and behavioral state transitions for an EA gamer session.' AS prompt
  FROM UNNEST(GENERATE_ARRAY(1, 10))
)
SELECT
  GENERATE_UUID() AS event_id,
  inp.session_id,
  inp.xuid,
  inp.ea_id,
  inp.franchise,
  inp.timestamp,
  gen.session_length_minutes,
  gen.actions_per_minute,
  gen.loss_streak_count,
  gen.store_page_visits,
  gen.churn_probability,
  gen.behavioral_state,
  gen.state_transition_reason
FROM AI.GENERATE_TABLE(
  MODEL `ea_measurement.gemini_flash_model`,
  TABLE input_sessions,
  STRUCT(
    0.7 AS temperature,
    4096 AS max_output_tokens,
    '''
    session_length_minutes FLOAT64 OPTIONS(description = 'Duration of session in minutes (5.0 to 360.0)'),
    actions_per_minute FLOAT64 OPTIONS(description = 'Calculated APM (Actions Per Minute, 20.0 to 450.0)'),
    loss_streak_count INT64 OPTIONS(description = 'Current consecutive loss streak count (0 to 15)'),
    store_page_visits INT64 OPTIONS(description = 'Number of store visits during session (0 to 8)'),
    churn_probability FLOAT64 OPTIONS(description = 'Predicted 14-day churn probability (0.0 to 1.0)'),
    behavioral_state STRING OPTIONS(description = 'Behavioral state: High Frustration, Casual Weekend, Hardcore Competitor, Lapsed Whale'),
    state_transition_reason STRING OPTIONS(description = 'Causal trigger for state: UNLOCK_FATIGUE, WIN_STREAK_EUPHORIA, COSMETIC_FOMO, MATCHMAKING_IMBALANCE')
    ''' AS output_schema
  )
) gen
JOIN input_sessions inp ON TRUE;
