-- ==============================================================================
-- 03: Bulk Generate Community Sentiment Stream via BQML AI.GENERATE_TABLE
-- Enforces structured output schema using OUTPUT_SCHEMA parameter with gemini-3.7-flash
-- ==============================================================================

INSERT INTO `twok_creative.fct_community_sentiment_stream` (
  message_id,
  timestamp,
  platform,
  franchise,
  sentiment_polarity,
  detected_issue,
  player_archetype,
  friction_intensity,
  raw_text
)
WITH input_prompts AS (
  SELECT
    TIMESTAMP_ADD(
      TIMESTAMP '2026-06-01 00:00:00 UTC',
      INTERVAL CAST(FLOOR(RAND() * 5184000) AS INT64) SECOND
    ) AS timestamp,
    ['Steam', 'Reddit', 'Discord', 'Twitch Chat', '2K Forums'][OFFSET(CAST(FLOOR(RAND() * 5) AS INT64))] AS platform,
    ['NBA 2K26', 'Borderlands 4', 'Civilization VII', 'WWE 2K25'][OFFSET(CAST(FLOOR(RAND() * 4) AS INT64))] AS franchise,
    'Generate an authentic gamer comment discussing recent patch updates, ProPLAY motion, The REC netcode, Cap Breaker grind, pack odds, or server latency.' AS prompt
  FROM UNNEST(GENERATE_ARRAY(1, 10)) -- Batch sample
)
SELECT
  GENERATE_UUID() AS message_id,
  inp.timestamp,
  inp.platform,
  inp.franchise,
  gen.sentiment_polarity,
  gen.detected_issue,
  gen.player_archetype,
  gen.friction_intensity,
  gen.raw_text
FROM AI.GENERATE_TABLE(
  MODEL `twok_measurement.gemini_flash_model`,
  TABLE input_prompts,
  STRUCT(
    0.75 AS temperature,
    4096 AS max_output_tokens,
    '''
    sentiment_polarity FLOAT64 OPTIONS(description = 'Sentiment polarity score from -1.0 (extremely negative) to 1.0 (extremely positive)'),
    detected_issue STRING OPTIONS(description = 'Primary category: PROPLAY_ANIMATIONS, THE_REC_NETCODE, CAP_BREAKER_GRIND, PACK_ODDS, SERVER_LAG, NONE'),
    player_archetype STRING OPTIONS(description = 'Gamer archetype: MYCAREER_HOOPER, 4X_GRAND_STRATEGIST, VAULT_HUNTER_SQUAD, MYTEAM_WHALE'),
    friction_intensity FLOAT64 OPTIONS(description = 'Player friction rating from 0.0 (delighted) to 1.0 (rage quit/churn risk)'),
    raw_text STRING OPTIONS(description = 'Raw verbatim gamer text including slang, sentiment, and specific gameplay mechanic mentions')
    ''' AS output_schema
  )
) gen
JOIN input_prompts inp ON TRUE;
