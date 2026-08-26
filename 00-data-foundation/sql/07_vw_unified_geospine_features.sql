-- ==============================================================================
-- 07: Unified Geo-Spine Feature View Definition
-- Joins 210 DMA Spine with WeatherNext 2.0, Google Trends, and WorldPop Demographics
-- ==============================================================================

CREATE OR REPLACE VIEW `ea_measurement.vw_unified_geospine_features` AS
WITH dma_base AS (
  SELECT
    dma_code,
    google_ads_metro_code,
    dma_name,
    metro_name,
    state,
    nielsen_rank,
    latitude,
    longitude,
    population,
    population_weight,
    gaming_density_index,
    esports_cluster_tag,
    timezone
  FROM `ea_measurement.dim_metro_geospine`
),
daily_facts AS (
  SELECT
    dma_code,
    date,
    franchise,
    search_interest_index,
    temp_celsius,
    temp_anomaly_celsius,
    precip_mm,
    precip_anomaly_mm,
    weather_shock_flag,
    indoor_gaming_elasticity_multiplier,
    lead_shock_t3_elasticity,
    lead_shock_t5_elasticity,
    lead_shock_t8_elasticity,
    lead_shock_t15_elasticity,
    pop_adjusted_gaming_hours,
    estimated_active_gamers
  FROM `ea_measurement.fct_geospine_daily_metro`
)
SELECT
  d.dma_code,
  d.google_ads_metro_code,
  d.dma_name,
  d.metro_name,
  d.state,
  d.nielsen_rank,
  d.latitude,
  d.longitude,
  d.population,
  d.population_weight,
  d.gaming_density_index,
  d.esports_cluster_tag,
  d.timezone,
  f.date,
  f.franchise,
  f.search_interest_index,
  f.temp_celsius,
  f.temp_anomaly_celsius,
  f.precip_mm,
  f.precip_anomaly_mm,
  f.weather_shock_flag,
  f.indoor_gaming_elasticity_multiplier,
  f.lead_shock_t3_elasticity,
  f.lead_shock_t5_elasticity,
  f.lead_shock_t8_elasticity,
  f.lead_shock_t15_elasticity,
  f.pop_adjusted_gaming_hours,
  f.estimated_active_gamers,
  -- Derived features for MMM and Spatial Attribution
  CASE 
    WHEN f.weather_shock_flag THEN 1.25
    ELSE 1.0
  END AS weather_shock_uplift_factor,
  (d.gaming_density_index * IFNULL(f.search_interest_index, 50.0) / 100.0) AS composite_demand_velocity
FROM dma_base d
LEFT JOIN daily_facts f
  ON d.dma_code = f.dma_code;
