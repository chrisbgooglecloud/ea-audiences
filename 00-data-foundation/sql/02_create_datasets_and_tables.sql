-- ==============================================================================
-- 02: Create BigQuery Datasets and Target Fact / Dimension Tables
-- Covers all 4 acts: ea_measurement, ea_audiences, ea_creative, ea_commerce
-- ==============================================================================

-- 1. Create Datasets
CREATE SCHEMA IF NOT EXISTS `ea_measurement`
OPTIONS (location = 'US', description = 'Act 3: Measurement, Geo-Spine & 3-Year MMM Data Warehouse');

CREATE SCHEMA IF NOT EXISTS `ea_audiences`
OPTIONS (location = 'US', description = 'Act 1: Audiences Identity Graph & 10M Player Telemetry');

CREATE SCHEMA IF NOT EXISTS `ea_creative`
OPTIONS (location = 'US', description = 'Act 2: Creative Studio & 500k Community Sentiment Stream');

CREATE SCHEMA IF NOT EXISTS `ea_commerce`
OPTIONS (location = 'US', description = 'Act 4: Commerce Media Network & 100k 3D Ad Impressions');

-- ------------------------------------------------------------------------------
-- EA_MEASUREMENT: Geographic Backbone Dimension (25 Top Nielsen DMAs & 210 DMA Spine)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_measurement.dim_metro_geospine` (
  dma_code INT64 NOT NULL OPTIONS(description = 'Google Ads Metro Criteria ID / DMA Code (e.g., 501, 803)'),
  google_ads_metro_code INT64 NOT NULL OPTIONS(description = 'Google Ads Criteria ID (e.g., 21149, 21175)'),
  dma_name STRING NOT NULL OPTIONS(description = 'Metro Market Name (e.g., New York, NY, Los Angeles, CA)'),
  metro_name STRING NOT NULL OPTIONS(description = 'Canonical Metro Name identifier'),
  state STRING NOT NULL OPTIONS(description = 'Primary State abbreviation (e.g., NY, CA)'),
  nielsen_rank INT64 NOT NULL OPTIONS(description = 'Nielsen DMA Market Rank (1 through 210)'),
  latitude FLOAT64 NOT NULL OPTIONS(description = 'Centroid latitude'),
  longitude FLOAT64 NOT NULL OPTIONS(description = 'Centroid longitude'),
  population INT64 NOT NULL OPTIONS(description = 'Metropolitan area population (WorldPop aligned)'),
  population_weight FLOAT64 NOT NULL OPTIONS(description = 'Normalized population weight across target markets'),
  gaming_density_index FLOAT64 NOT NULL OPTIONS(description = 'Index of active gaming hardware & broadband penetration (1.0 = national average)'),
  esports_cluster_tag STRING NOT NULL OPTIONS(description = 'Franchise eSports hub cluster categorization'),
  centroid_geom GEOGRAPHY OPTIONS(description = 'Centroid point geography representation'),
  timezone STRING NOT NULL OPTIONS(description = 'Primary local timezone'),
  updated_at TIMESTAMP NOT NULL OPTIONS(description = 'Timestamp of last record update')
)
CLUSTER BY state, dma_code;

-- ------------------------------------------------------------------------------
-- EA_MEASUREMENT: Daily Geo-Spine Facts (WeatherNext 2.0 Shocks + Trends + Demographics)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_measurement.fct_geospine_daily_metro` (
  dma_code INT64 NOT NULL OPTIONS(description = 'DMA Criteria Code'),
  date DATE NOT NULL OPTIONS(description = 'Fact observation date'),
  franchise STRING NOT NULL OPTIONS(description = 'EA Title Franchise'),
  search_interest_index FLOAT64 OPTIONS(description = 'Google Trends search interest index (0-100)'),
  temp_celsius FLOAT64 OPTIONS(description = 'Observed 2m air temperature in Celsius'),
  temp_anomaly_celsius FLOAT64 OPTIONS(description = 'Deviation from 30-day baseline temperature'),
  precip_mm FLOAT64 OPTIONS(description = 'Observed total daily precipitation in mm'),
  precip_anomaly_mm FLOAT64 OPTIONS(description = 'Precipitation shock delta relative to seasonal average'),
  weather_shock_flag BOOL OPTIONS(description = 'True if temperature shock > 3C or heavy rain > 15mm'),
  indoor_gaming_elasticity_multiplier FLOAT64 OPTIONS(description = 'Continuous 1.0x to 1.5x indoor gaming elasticity index'),
  lead_shock_t3_elasticity FLOAT64 OPTIONS(description = 'WeatherNext T-3 (72h) lead forecast elasticity multiplier'),
  lead_shock_t5_elasticity FLOAT64 OPTIONS(description = 'WeatherNext T-5 (120h) lead forecast elasticity multiplier'),
  lead_shock_t8_elasticity FLOAT64 OPTIONS(description = 'WeatherNext T-8 (192h) lead forecast elasticity multiplier'),
  lead_shock_t15_elasticity FLOAT64 OPTIONS(description = 'WeatherNext T-15 (360h) lead forecast elasticity multiplier'),
  pop_adjusted_gaming_hours FLOAT64 OPTIONS(description = 'Estimated total hours spent gaming across DMA on date'),
  estimated_active_gamers INT64 OPTIONS(description = 'Active player population in DMA'),
  updated_at TIMESTAMP NOT NULL OPTIONS(description = 'Ingestion timestamp')
)
PARTITION BY date
CLUSTER BY dma_code, franchise;

-- ------------------------------------------------------------------------------
-- EA_MEASUREMENT: Cross-Franchise Schedule Collision & Fatigue Fact Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_measurement.fct_cross_franchise_fatigue` (
  campaign_id STRING NOT NULL OPTIONS(description = 'Unique campaign identifier (e.g., camp-fc27-toty-001)'),
  target_franchise STRING NOT NULL OPTIONS(description = 'Target campaign franchise (e.g., EA Sports FC)'),
  conflicting_franchise STRING NOT NULL OPTIONS(description = 'Conflicting overlapping franchise (e.g., Apex Legends)'),
  flight_start DATE NOT NULL OPTIONS(description = 'Scheduled campaign flight start date'),
  flight_end DATE NOT NULL OPTIONS(description = 'Scheduled campaign flight end date'),
  shared_ea_id_overlap_pct FLOAT64 NOT NULL OPTIONS(description = 'Percentage of target audience overlapping with conflicting title (e.g., 42.1%)'),
  ad_fatigue_suppression_penalty_pct FLOAT64 NOT NULL OPTIONS(description = 'Cross-title ad fatigue suppression penalty (e.g., 14.5%)'),
  net_bookings_risk_usd FLOAT64 NOT NULL OPTIONS(description = 'Projected gross net bookings dollar risk (e.g., $420,000)'),
  recommended_timeline_shift_days INT64 NOT NULL OPTIONS(description = 'Prescriptive schedule shift recommendation in days (+3 days)'),
  projected_net_bookings_recovery_usd FLOAT64 NOT NULL OPTIONS(description = 'Projected net bookings recovered via timeline shift ($420,000)'),
  created_at TIMESTAMP NOT NULL OPTIONS(description = 'Record creation timestamp')
)
PARTITION BY flight_start
CLUSTER BY target_franchise, conflicting_franchise;

-- ------------------------------------------------------------------------------
-- EA_MEASUREMENT: 2D Creative Shapley Marginal Lift Attribution Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_measurement.fct_creative_shapley_marginal_lift` (
  asset_id STRING NOT NULL OPTIONS(description = 'Creative asset identifier (e.g., asset-fc27-bellingham-001)'),
  franchise STRING NOT NULL OPTIONS(description = 'EA Franchise (e.g., EA Sports FC, Apex Legends)'),
  feature_name STRING NOT NULL OPTIONS(description = 'Creative mechanic or visual hook name (e.g., FUT Pack Walkout Jude Bellingham)'),
  feature_category STRING NOT NULL OPTIONS(description = 'Feature classification (LOWER_FUNNEL_MONETIZATION, TOP_OF_FUNNEL, NEUTRAL_ENGAGEMENT)'),
  funnel_tier STRING NOT NULL OPTIONS(description = 'Funnel stage: TOFU, BOFU, MOFU, LOWER_FUNNEL_MONETIZATION, TOP_OF_FUNNEL'),
  marginal_ctr_lift_pct FLOAT64 NOT NULL OPTIONS(description = 'Marginal CTR lift percentage (+4.2% or +41.0%)'),
  marginal_cti_lift_pct FLOAT64 NOT NULL OPTIONS(description = 'Marginal Click-to-Install CTI lift percentage (+32.4% or -12.1%)'),
  marginal_d7_roas_multiplier FLOAT64 NOT NULL OPTIONS(description = 'Marginal Day-7 ROAS multiplier (3.42x)'),
  confidence_score FLOAT64 NOT NULL OPTIONS(description = 'Statistical confidence score (0.0 to 1.0)'),
  updated_at TIMESTAMP NOT NULL OPTIONS(description = 'Attribution calculation timestamp')
)
CLUSTER BY franchise, feature_category, funnel_tier;

-- ------------------------------------------------------------------------------
-- EA_MEASUREMENT: 3-Year Econometric MMM Daily Channel Spend Fact Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_measurement.fct_daily_channel_spend` (
  spend_id STRING NOT NULL OPTIONS(description = 'Unique daily spend fact identifier'),
  date DATE NOT NULL OPTIONS(description = 'Calendar date (2023-08-01 to 2026-08-01, 1095 days)'),
  franchise STRING NOT NULL OPTIONS(description = 'EA Franchise (Apex Legends, EA Sports FC, Battlefield 6, The Sims 4)'),
  country_code STRING NOT NULL OPTIONS(description = 'Target country ISO code (US, UK, DE, FR, JP, KR, SA)'),
  channel STRING NOT NULL OPTIONS(description = 'Marketing channel (Paid Search, Paid Social, Influencers, CTV, Linear TV, Display, DOOH, Podcast)'),
  spend_usd FLOAT64 NOT NULL OPTIONS(description = 'Daily media spend in USD'),
  impressions INT64 NOT NULL OPTIONS(description = 'Delivered ad impressions count'),
  clicks INT64 NOT NULL OPTIONS(description = 'Tracked clicks count'),
  conversions INT64 NOT NULL OPTIONS(description = 'Attributed game installs / primary conversions'),
  adstocked_spend FLOAT64 NOT NULL OPTIONS(description = 'Weibull/geometric carryover adstock spend'),
  hill_saturated_response FLOAT64 NOT NULL OPTIONS(description = 'Hill saturation curve output value'),
  attributed_revenue_usd FLOAT64 NOT NULL OPTIONS(description = 'Attributed gross revenue in USD'),
  observed_roas FLOAT64 NOT NULL OPTIONS(description = 'Daily Return on Ad Spend (attributed_revenue_usd / spend_usd)'),
  weather_shock_multiplier FLOAT64 NOT NULL OPTIONS(description = 'Weather shock scalar from WeatherNext 2.0'),
  seasonality_factor FLOAT64 NOT NULL OPTIONS(description = 'Holiday/seasonality multiplier'),
  created_at TIMESTAMP NOT NULL OPTIONS(description = 'Fact creation timestamp')
)
PARTITION BY date
CLUSTER BY franchise, channel, country_code;

-- ------------------------------------------------------------------------------
-- EA_MEASUREMENT: Feature Attribution & Tactical 9-Grid SHAP Records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_measurement.fct_creative_shap_attributions` (
  attribution_id STRING NOT NULL OPTIONS(description = 'Attribution run ID'),
  snapshot_date DATE NOT NULL OPTIONS(description = 'Attribution evaluation snapshot date'),
  campaign_id STRING NOT NULL OPTIONS(description = 'Associated campaign ID'),
  franchise STRING NOT NULL OPTIONS(description = 'EA Franchise'),
  feature_name STRING NOT NULL OPTIONS(description = 'Extracted creative feature mechanic or visual hook'),
  feature_category STRING NOT NULL OPTIONS(description = 'Category: GAMEPLAY_MECHANIC, VISUAL_HOOK, AUDIO_CUE, SURFACE_ALIGNMENT'),
  funnel_stage STRING NOT NULL OPTIONS(description = 'Funnel stage: ToFu_Exploration, MoFu_Progression, BoFu_Conversion'),
  surface STRING NOT NULL OPTIONS(description = 'Primary EA surface alignment'),
  frequency_count INT64 NOT NULL OPTIONS(description = 'Historical occurrence frequency (X-axis coordinate)'),
  mean_shap_value FLOAT64 NOT NULL OPTIONS(description = 'Average SHAP value contribution'),
  marginal_roas_impact FLOAT64 NOT NULL OPTIONS(description = 'Marginal ROAS impact in currency multiple (Y-axis coordinate)'),
  tactical_quadrant STRING NOT NULL OPTIONS(description = '9-Grid Quadrant: GOLD_MINES, CORE_DRIVERS, SATURATED_STARS, UNTAPPED, WORKHORSES, EFFICIENCY_RISKS, NOISE, UNDERPERFORMERS, MONEY_PITS'),
  strategic_recommendation STRING NOT NULL OPTIONS(description = 'Prescribed strategic directive: Scale Up, Maintain, Monitor, Test More, Optimize, Trim Budget, Discard, Pivot Creative, Kill Immediately'),
  creative_reasoning STRING OPTIONS(description = 'Executive reasoning summary explaining causal link to player engagement and ROAS'),
  updated_at TIMESTAMP NOT NULL OPTIONS(description = 'Timestamp of evaluation')
)
PARTITION BY snapshot_date
CLUSTER BY franchise, tactical_quadrant;

-- ------------------------------------------------------------------------------
-- EA_MEASUREMENT: Causal Lift Experiments for Bayesian Meridian Priors
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_measurement.causal_lift_experiments` (
  experiment_id STRING NOT NULL OPTIONS(description = 'Experiment unique ID'),
  experiment_name STRING NOT NULL OPTIONS(description = 'Human-readable experiment name'),
  franchise STRING NOT NULL OPTIONS(description = 'EA Franchise'),
  channel STRING NOT NULL OPTIONS(description = 'Marketing channel evaluated'),
  surface STRING NOT NULL OPTIONS(description = 'Target surface'),
  start_date DATE NOT NULL OPTIONS(description = 'Trial start date'),
  end_date DATE NOT NULL OPTIONS(description = 'Trial end date'),
  test_dma_codes ARRAY<INT64> OPTIONS(description = 'List of treated DMA criteria IDs'),
  control_dma_codes ARRAY<INT64> OPTIONS(description = 'List of matched control DMA criteria IDs'),
  spend_delta FLOAT64 NOT NULL OPTIONS(description = 'Incremental media spend in test group'),
  observed_lift_pct FLOAT64 NOT NULL OPTIONS(description = 'Estimated incremental causal lift percentage'),
  baseline_cpi FLOAT64 NOT NULL OPTIONS(description = 'Control group CPI'),
  observed_cpi FLOAT64 NOT NULL OPTIONS(description = 'Test group CPI'),
  causal_roas_estimate FLOAT64 NOT NULL OPTIONS(description = 'Estimated point incremental ROAS'),
  ci_lower FLOAT64 NOT NULL OPTIONS(description = '95% confidence interval lower bound'),
  ci_upper FLOAT64 NOT NULL OPTIONS(description = '95% confidence interval upper bound'),
  p_value FLOAT64 NOT NULL OPTIONS(description = 'Hypothesis test p-value'),
  prior_lognormal_mu FLOAT64 NOT NULL OPTIONS(description = 'Derived Log-Normal prior mean parameter'),
  prior_lognormal_sigma FLOAT64 NOT NULL OPTIONS(description = 'Derived Log-Normal prior standard deviation parameter'),
  created_at TIMESTAMP NOT NULL OPTIONS(description = 'Record created timestamp')
)
PARTITION BY start_date
CLUSTER BY franchise, channel;

-- ------------------------------------------------------------------------------
-- EA_AUDIENCES: 10M Player Telemetry Fact Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_audiences.fct_player_telemetry_events` (
  event_id STRING NOT NULL OPTIONS(description = 'Unique telemetry event ID'),
  session_id STRING NOT NULL OPTIONS(description = 'Gamer session UUID'),
  xuid STRING NOT NULL OPTIONS(description = 'Cross-platform Xbox/EA User ID'),
  ea_id STRING NOT NULL OPTIONS(description = 'EA Account ID'),
  franchise STRING NOT NULL OPTIONS(description = 'EA Franchise'),
  timestamp TIMESTAMP NOT NULL OPTIONS(description = 'Event UTC timestamp'),
  session_length_minutes FLOAT64 NOT NULL OPTIONS(description = 'Session duration in minutes (5.0 to 360.0)'),
  actions_per_minute FLOAT64 NOT NULL OPTIONS(description = 'Calculated APM (Actions Per Minute, 20.0 to 450.0)'),
  loss_streak_count INT64 NOT NULL OPTIONS(description = 'Consecutive loss streak count (0 to 15)'),
  store_page_visits INT64 NOT NULL OPTIONS(description = 'Store visits during session (0 to 8)'),
  churn_probability FLOAT64 NOT NULL OPTIONS(description = 'Predicted 14-day churn probability (0.0 to 1.0)'),
  behavioral_state STRING NOT NULL OPTIONS(description = 'Behavioral state: High Frustration, Casual Weekend, Hardcore Competitor, Lapsed Whale'),
  state_transition_reason STRING NOT NULL OPTIONS(description = 'Causal trigger for state: UNLOCK_FATIGUE, WIN_STREAK_EUPHORIA, COSMETIC_FOMO, MATCHMAKING_IMBALANCE')
)
PARTITION BY DATE(timestamp)
CLUSTER BY franchise, behavioral_state;

-- ------------------------------------------------------------------------------
-- EA_AUDIENCES: Player Identity Resolution Graph Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_audiences.fct_player_identity_graph` (
  unified_player_id STRING NOT NULL OPTIONS(description = 'Unified Resolved EA Player Profile UUID'),
  ea_id STRING NOT NULL OPTIONS(description = 'EA Global Core Account ID'),
  xuid STRING OPTIONS(description = 'Xbox Live Account Identifier'),
  psn_id STRING OPTIONS(description = 'PlayStation Network Online ID'),
  maid STRING OPTIONS(description = 'Mobile Advertising Identifier (IDFA / GAID)'),
  primary_dma_code INT64 NOT NULL OPTIONS(description = 'Primary Google Ads DMA Criteria ID'),
  country_code STRING NOT NULL OPTIONS(description = 'Country code'),
  primary_franchise STRING NOT NULL OPTIONS(description = 'Highest lifetime engagement franchise'),
  lifetime_value_usd FLOAT64 NOT NULL OPTIONS(description = 'Estimated historical gross player LTV'),
  willingness_to_pay_usd FLOAT64 NOT NULL OPTIONS(description = 'Predicted monthly microtransaction willingness-to-pay'),
  primary_archetype STRING NOT NULL OPTIONS(description = 'Core archetype: COMPETITIVE_GRINDER, LORE_SEEKER, CASUAL_SOCIALIZER, ULTIMATE_TEAM_WHALE'),
  churn_risk_score FLOAT64 NOT NULL OPTIONS(description = 'Composite churn risk (0.0 to 1.0)'),
  updated_at TIMESTAMP NOT NULL OPTIONS(description = 'Graph resolution timestamp')
)
CLUSTER BY primary_franchise, primary_archetype, primary_dma_code;

-- ------------------------------------------------------------------------------
-- EA_CREATIVE: 500k Community Sentiment Stream Fact Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_creative.fct_community_sentiment_stream` (
  message_id STRING NOT NULL OPTIONS(description = 'Unique community message UUID'),
  timestamp TIMESTAMP NOT NULL OPTIONS(description = 'Message posting timestamp'),
  platform STRING NOT NULL OPTIONS(description = 'Platform source: Steam, Reddit, Discord, Twitch Chat, EA Forums'),
  franchise STRING NOT NULL OPTIONS(description = 'EA Franchise (Apex Legends, EA Sports FC, Battlefield 6, The Sims 4)'),
  sentiment_polarity FLOAT64 NOT NULL OPTIONS(description = 'Polarity score from -1.0 (extremely negative) to 1.0 (extremely positive)'),
  detected_issue STRING NOT NULL OPTIONS(description = 'Primary issue category: BATTLE_PASS_GRIND, WEAPON_BALANCE, SERVER_LAG, STORE_PRICING, AUDIO_BUG, AUDIO_PRAISE, NONE'),
  player_archetype STRING NOT NULL OPTIONS(description = 'Gamer archetype: COMPETITIVE_GRINDER, LORE_SEEKER, CASUAL_SOCIALIZER, ULTIMATE_TEAM_WHALE'),
  friction_intensity FLOAT64 NOT NULL OPTIONS(description = 'Player friction rating from 0.0 to 1.0'),
  raw_text STRING NOT NULL OPTIONS(description = 'Verbatim community post text with slang and gameplay mechanics')
)
PARTITION BY DATE(timestamp)
CLUSTER BY franchise, platform, detected_issue;

-- ------------------------------------------------------------------------------
-- EA_COMMERCE: 100k 3D Ad Impressions & IAS Verification Fact Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ea_commerce.fct_3d_ad_impressions_ias` (
  impression_id STRING NOT NULL OPTIONS(description = 'Unique 3D ad impression UUID'),
  match_id STRING NOT NULL OPTIONS(description = 'Multiplayer match identifier'),
  franchise STRING NOT NULL OPTIONS(description = 'EA Franchise (EA Sports FC, Apex Legends, Battlefield 6)'),
  dma_code INT64 NOT NULL OPTIONS(description = 'Viewer Google Ads DMA Code'),
  surface STRING NOT NULL OPTIONS(description = 'In-game placement: STADIUM_BOARDS, PAUSE_SCREENS, ROAD_BILLBOARDS'),
  timestamp TIMESTAMP NOT NULL OPTIONS(description = 'Impression delivery timestamp'),
  dwell_time_seconds FLOAT64 NOT NULL OPTIONS(description = 'IAS verified camera dwell duration in seconds (0.1 to 8.0)'),
  camera_view_angle_degrees FLOAT64 NOT NULL OPTIONS(description = 'Angle between camera view normal and billboard (0.0 to 75.0 degrees)'),
  occlusion_percentage FLOAT64 NOT NULL OPTIONS(description = 'Player/object occlusion percentage (0.0 to 40.0%)'),
  clearing_cpm_usd FLOAT64 NOT NULL OPTIONS(description = 'Programmatic first-price clearing CPM in USD ($12.00 to $45.00)'),
  ias_brand_safety_score FLOAT64 NOT NULL OPTIONS(description = 'IAS brand safety suitability score (0.80 to 1.00)'),
  ias_viewability_status STRING NOT NULL OPTIONS(description = 'Viewability status: VIEWABLE_PASSED, OCCLUSION_FAILED, DWELL_UNDER_THRESHOLD')
)
PARTITION BY DATE(timestamp)
CLUSTER BY franchise, surface, dma_code;
