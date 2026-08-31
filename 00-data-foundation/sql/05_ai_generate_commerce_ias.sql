-- ==============================================================================
-- 05: Bulk Generate 3D Ad Impressions & IAS Brand Safety Logs via BQML AI.GENERATE_TABLE
-- Enforces structured output schema using OUTPUT_SCHEMA parameter with gemini-3.7-flash
-- ==============================================================================

INSERT INTO `twok_commerce.fct_3d_ad_impressions_ias` (
  impression_id,
  match_id,
  franchise,
  dma_code,
  surface,
  timestamp,
  dwell_time_seconds,
  camera_view_angle_degrees,
  occlusion_percentage,
  clearing_cpm_usd,
  ias_brand_safety_score,
  ias_viewability_status
)
WITH input_impressions AS (
  SELECT
    CONCAT('match-', CAST(FLOOR(RAND() * 50000) AS INT64)) AS match_id,
    ['NBA 2K26', 'Borderlands 4', 'WWE 2K25'][OFFSET(CAST(FLOOR(RAND() * 3) AS INT64))] AS franchise,
    [501, 803, 602, 506, 504, 623, 511, 524, 618][OFFSET(CAST(FLOOR(RAND() * 9) AS INT64))] AS dma_code,
    ['COURTSIDE_LEDS', 'JUMBOTRON_SCREENS', 'CITY_BILLBOARDS', 'ARENA_POSTERS'][OFFSET(CAST(FLOOR(RAND() * 4) AS INT64))] AS surface,
    TIMESTAMP_ADD(
      TIMESTAMP '2026-08-01 00:00:00 UTC',
      INTERVAL CAST(FLOOR(RAND() * 864000) AS INT64) SECOND
    ) AS timestamp,
    'Generate IAS brand safety and camera dwell verification telemetry for a 3D in-game dynamic ad impression in 2K games.' AS prompt
  FROM UNNEST(GENERATE_ARRAY(1, 10))
)
SELECT
  GENERATE_UUID() AS impression_id,
  inp.match_id,
  inp.franchise,
  inp.dma_code,
  inp.surface,
  inp.timestamp,
  gen.dwell_time_seconds,
  gen.camera_view_angle_degrees,
  gen.occlusion_percentage,
  gen.clearing_cpm_usd,
  gen.ias_brand_safety_score,
  gen.ias_viewability_status
FROM AI.GENERATE_TABLE(
  MODEL `twok_measurement.gemini_flash_model`,
  TABLE input_impressions,
  STRUCT(
    0.6 AS temperature,
    4096 AS max_output_tokens,
    '''
    dwell_time_seconds FLOAT64 OPTIONS(description = 'IAS verified camera dwell duration in seconds (0.1 to 8.0)'),
    camera_view_angle_degrees FLOAT64 OPTIONS(description = 'Angle between camera view normal and 3D billboard (0.0 to 75.0 degrees)'),
    occlusion_percentage FLOAT64 OPTIONS(description = 'Player character or object occlusion percentage (0.0 to 40.0%)'),
    clearing_cpm_usd FLOAT64 OPTIONS(description = 'Programmatic first-price auction clearing CPM in USD ($12.00 to $45.00)'),
    ias_brand_safety_score FLOAT64 OPTIONS(description = 'Integral Ad Science brand safety suitability score (0.80 to 1.00)'),
    ias_viewability_status STRING OPTIONS(description = 'IAS standard viewability: VIEWABLE_PASSED, OCCLUSION_FAILED, DWELL_UNDER_THRESHOLD')
    ''' AS output_schema
  )
) gen
JOIN input_impressions inp ON TRUE;
