# BigQuery Datasets for EA EBC Platform
resource "google_bigquery_dataset" "ea_measurement" {
  dataset_id                  = "ea_measurement"
  friendly_name               = "EA Measurement Engine MLOps & Attribution Data Warehouse"
  description                 = "Central dataset for Geo-Spine, daily MLOps facts, multimodal creative telemetry, causal lift trials, 3-year MMM spend, and SHAP 9-grid attribution."
  location                    = var.bq_location
  project                     = var.project_id
  default_table_expiration_ms = null

  labels = {
    env        = var.environment
    workload   = "creative-intelligence-measurement"
    managed_by = "terraform"
  }

  depends_on = [google_project_service.enabled_apis]
}

resource "google_bigquery_dataset" "ea_audiences" {
  dataset_id                  = "ea_audiences"
  friendly_name               = "EA Audiences Identity Graph & Player Telemetry"
  description                 = "Act 1: Identity resolution, 10M player telemetry events, and DeepSona persona states"
  location                    = var.bq_location
  project                     = var.project_id
  default_table_expiration_ms = null

  labels = {
    env        = var.environment
    workload   = "audiences-identity-graph"
    managed_by = "terraform"
  }

  depends_on = [google_project_service.enabled_apis]
}

resource "google_bigquery_dataset" "ea_creative" {
  dataset_id                  = "ea_creative"
  friendly_name               = "EA Creative Studio & Community Insights"
  description                 = "Act 2: 500k community sentiment stream, patch note diffs, and multi-surface asset metadata"
  location                    = var.bq_location
  project                     = var.project_id
  default_table_expiration_ms = null

  labels = {
    env        = var.environment
    workload   = "creative-studio-insights"
    managed_by = "terraform"
  }

  depends_on = [google_project_service.enabled_apis]
}

resource "google_bigquery_dataset" "ea_commerce" {
  dataset_id                  = "ea_commerce"
  friendly_name               = "EA Commerce Media Network & 3D Ads"
  description                 = "Act 4: 100k 3D in-game ad impressions, IAS camera dwell-time telemetry, and programmatic yield logs"
  location                    = var.bq_location
  project                     = var.project_id
  default_table_expiration_ms = null

  labels = {
    env        = var.environment
    workload   = "commerce-media-network"
    managed_by = "terraform"
  }

  depends_on = [google_project_service.enabled_apis]
}

# BigQuery Cloud Resource Remote Connection for Vertex AI / Gemini
resource "google_bigquery_connection" "vertex_ai_connection" {
  connection_id = "vertex-ai-connection"
  project       = var.project_id
  location      = var.bq_location
  friendly_name = "BigQuery Vertex AI Remote Connection"
  description   = "Remote connection enabling BQML AI.GENERATE_TABLE and ML.GENERATE_TEXT to invoke Gemini models"
  cloud_resource {}

  depends_on = [google_project_service.enabled_apis]
}

# Grant Vertex AI User role to the BigQuery Connection's Service Account
resource "google_project_iam_member" "connection_vertex_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_bigquery_connection.vertex_ai_connection.cloud_resource[0].service_account_id}"

  depends_on = [google_bigquery_connection.vertex_ai_connection]
}

# Table 1: Geographic Backbone - 210 US Metro DMAs
resource "google_bigquery_table" "dim_metro_geospine" {
  dataset_id          = google_bigquery_dataset.ea_measurement.dataset_id
  table_id            = "dim_metro_geospine"
  project             = var.project_id
  deletion_protection = false
  description         = "Complete 210 DMA Google Ads metro spine dimension table with coordinates, population, and gaming density index"

  clustering = ["state", "dma_code"]

  schema = jsonencode([
    { name = "dma_code", type = "INT64", mode = "REQUIRED", description = "Google Ads Metro Criteria ID / DMA Code (e.g., 501, 803)" },
    { name = "dma_name", type = "STRING", mode = "REQUIRED", description = "Metro Market Name (e.g., New York, Los Angeles)" },
    { name = "state", type = "STRING", mode = "REQUIRED", description = "Primary State abbreviation (e.g., NY, CA)" },
    { name = "latitude", type = "FLOAT64", mode = "REQUIRED", description = "Centroid latitude" },
    { name = "longitude", type = "FLOAT64", mode = "REQUIRED", description = "Centroid longitude" },
    { name = "population", type = "INT64", mode = "REQUIRED", description = "Metropolitan area population" },
    { name = "gaming_density_index", type = "FLOAT64", mode = "REQUIRED", description = "Index of active gaming hardware & broadband penetration (1.0 = national average)" },
    { name = "centroid_geom", type = "GEOGRAPHY", mode = "NULLABLE", description = "Centroid point geography representation" },
    { name = "timezone", type = "STRING", mode = "REQUIRED", description = "Primary local timezone (e.g., America/New_York)" },
    { name = "updated_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Timestamp of last record update" }
  ])
}

# Table 2: Daily Geo-Spine Facts (Weather Shocks + Trends + Demographics)
resource "google_bigquery_table" "fct_geospine_daily_metro" {
  dataset_id          = google_bigquery_dataset.ea_measurement.dataset_id
  table_id            = "fct_geospine_daily_metro"
  project             = var.project_id
  deletion_protection = false
  description         = "Daily fact table joining DMA spatial backbone with WeatherNext climate shocks, Google Trends zeitgeist, and demographic activity"

  time_partitioning {
    type  = "DAY"
    field = "date"
  }

  clustering = ["dma_code", "franchise"]

  schema = jsonencode([
    { name = "dma_code", type = "INT64", mode = "REQUIRED", description = "DMA Criteria Code" },
    { name = "date", type = "DATE", mode = "REQUIRED", description = "Fact observation date" },
    { name = "franchise", type = "STRING", mode = "REQUIRED", description = "EA Title Franchise (Apex Legends, EA Sports FC, Battlefield, The Sims)" },
    { name = "search_interest_index", type = "FLOAT64", mode = "NULLABLE", description = "Google Trends search interest index (0-100)" },
    { name = "temp_celsius", type = "FLOAT64", mode = "NULLABLE", description = "Observed 2m air temperature in Celsius" },
    { name = "temp_anomaly_celsius", type = "FLOAT64", mode = "NULLABLE", description = "Deviation from 30-day baseline temperature" },
    { name = "precip_mm", type = "FLOAT64", mode = "NULLABLE", description = "Observed total daily precipitation in mm" },
    { name = "precip_anomaly_mm", type = "FLOAT64", mode = "NULLABLE", description = "Precipitation shock delta relative to seasonal average" },
    { name = "weather_shock_flag", type = "BOOL", mode = "NULLABLE", description = "True if temperature shock > 3C or heavy rain > 15mm" },
    { name = "pop_adjusted_gaming_hours", type = "FLOAT64", mode = "NULLABLE", description = "Estimated total hours spent gaming across the DMA on date" },
    { name = "estimated_active_gamers", type = "INT64", mode = "NULLABLE", description = "Active player population estimated in DMA" },
    { name = "updated_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Ingestion timestamp" }
  ])
}

# Table 3: 3-Year Econometric MMM Daily Channel Spend Fact Table
resource "google_bigquery_table" "fct_daily_channel_spend" {
  dataset_id          = google_bigquery_dataset.ea_measurement.dataset_id
  table_id            = "fct_daily_channel_spend"
  project             = var.project_id
  deletion_protection = false
  description         = "3-Year daily marketing spend, impressions, adstock, and attributed revenue across 8 channels, 4 titles, and 7 countries for Meridian MMM"

  time_partitioning {
    type  = "DAY"
    field = "date"
  }

  clustering = ["franchise", "channel", "country_code"]

  schema = jsonencode([
    { name = "spend_id", type = "STRING", mode = "REQUIRED", description = "Unique daily spend fact identifier" },
    { name = "date", type = "DATE", mode = "REQUIRED", description = "Calendar date (2023-08-01 to 2026-08-01, 1095 days)" },
    { name = "franchise", type = "STRING", mode = "REQUIRED", description = "EA Franchise (Apex Legends, EA Sports FC, Battlefield 6, The Sims 4)" },
    { name = "country_code", type = "STRING", mode = "REQUIRED", description = "Target country ISO code (US, UK, DE, FR, JP, KR, SA)" },
    { name = "channel", type = "STRING", mode = "REQUIRED", description = "Marketing channel (Paid Search, Paid Social, Influencers, CTV, Linear TV, Display, DOOH, Podcast)" },
    { name = "spend_usd", type = "FLOAT64", mode = "REQUIRED", description = "Daily media spend in USD" },
    { name = "impressions", type = "INT64", mode = "REQUIRED", description = "Delivered ad impressions count" },
    { name = "clicks", type = "INT64", mode = "REQUIRED", description = "Tracked clicks count" },
    { name = "conversions", type = "INT64", mode = "REQUIRED", description = "Attributed game installs / primary conversions" },
    { name = "adstocked_spend", type = "FLOAT64", mode = "REQUIRED", description = "Weibull/geometric carryover adstock spend" },
    { name = "hill_saturated_response", type = "FLOAT64", mode = "REQUIRED", description = "Hill saturation curve output value" },
    { name = "attributed_revenue_usd", type = "FLOAT64", mode = "REQUIRED", description = "Attributed gross revenue in USD" },
    { name = "observed_roas", type = "FLOAT64", mode = "REQUIRED", description = "Daily Return on Ad Spend (attributed_revenue_usd / spend_usd)" },
    { name = "weather_shock_multiplier", type = "FLOAT64", mode = "REQUIRED", description = "Weather shock scalar from WeatherNext 2.0" },
    { name = "seasonality_factor", type = "FLOAT64", mode = "REQUIRED", description = "Holiday/seasonality multiplier" },
    { name = "created_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Fact creation timestamp" }
  ])
}

# Table 4: Feature Attribution & Tactical 9-Grid SHAP Records
resource "google_bigquery_table" "feature_attribution_shap" {
  dataset_id          = google_bigquery_dataset.ea_measurement.dataset_id
  table_id            = "feature_attribution_shap"
  project             = var.project_id
  deletion_protection = false
  description         = "SHAP explainability values and Tactical 9-Grid quadrant classifications for creative features"

  time_partitioning {
    type  = "DAY"
    field = "snapshot_date"
  }

  clustering = ["franchise", "tactical_quadrant"]

  schema = jsonencode([
    { name = "attribution_id", type = "STRING", mode = "REQUIRED", description = "Attribution run ID" },
    { name = "snapshot_date", type = "DATE", mode = "REQUIRED", description = "Attribution evaluation snapshot date" },
    { name = "campaign_id", type = "STRING", mode = "REQUIRED", description = "Associated campaign ID" },
    { name = "franchise", type = "STRING", mode = "REQUIRED", description = "EA Franchise" },
    { name = "feature_name", type = "STRING", mode = "REQUIRED", description = "Extracted creative feature mechanic or visual hook" },
    { name = "feature_category", type = "STRING", mode = "REQUIRED", description = "Category (e.g., GAMEPLAY_MECHANIC, VISUAL_HOOK, AUDIO_CUE, SURFACE_ALIGNMENT)" },
    { name = "funnel_stage", type = "STRING", mode = "REQUIRED", description = "Funnel classification" },
    { name = "surface", type = "STRING", mode = "REQUIRED", description = "Target surface" },
    { name = "frequency_count", type = "INT64", mode = "REQUIRED", description = "Historical occurrence frequency (X-axis coordinate)" },
    { name = "mean_shap_value", type = "FLOAT64", mode = "REQUIRED", description = "Average SHAP value contribution" },
    { name = "marginal_roas_impact", type = "FLOAT64", mode = "REQUIRED", description = "Marginal ROAS impact in currency multiple (Y-axis coordinate)" },
    { name = "tactical_quadrant", type = "STRING", mode = "REQUIRED", description = "9-Grid Quadrant: GOLD_MINES, CORE_DRIVERS, SATURATED_STARS, UNTAPPED, WORKHORSES, EFFICIENCY_RISKS, NOISE, UNDERPERFORMERS, MONEY_PITS" },
    { name = "strategic_recommendation", type = "STRING", mode = "REQUIRED", description = "Action rule: Scale Up, Maintain, Monitor, Test More, Optimize, Trim Budget, Discard, Pivot Creative, Kill Immediately" },
    { name = "llm_reasoning_summary", type = "STRING", mode = "NULLABLE", description = "Executive CoT reasoning output from gemini-3.6-flash" },
    { name = "updated_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Timestamp of evaluation" }
  ])
}

# Table 5: Causal Lift Experiments for Bayesian Meridian Priors
resource "google_bigquery_table" "causal_lift_experiments" {
  dataset_id          = google_bigquery_dataset.ea_measurement.dataset_id
  table_id            = "causal_lift_experiments"
  project             = var.project_id
  deletion_protection = false
  description         = "Geo-matched and holdout randomized causal lift experiments for calibrating Meridian MMM priors"

  time_partitioning {
    type  = "DAY"
    field = "start_date"
  }

  clustering = ["franchise", "channel"]

  schema = jsonencode([
    { name = "experiment_id", type = "STRING", mode = "REQUIRED", description = "Experiment unique ID" },
    { name = "experiment_name", type = "STRING", mode = "REQUIRED", description = "Human-readable experiment name" },
    { name = "franchise", type = "STRING", mode = "REQUIRED", description = "EA Franchise" },
    { name = "channel", type = "STRING", mode = "REQUIRED", description = "Marketing channel evaluated" },
    { name = "surface", type = "STRING", mode = "REQUIRED", description = "Target surface" },
    { name = "start_date", type = "DATE", mode = "REQUIRED", description = "Trial start date" },
    { name = "end_date", type = "DATE", mode = "REQUIRED", description = "Trial end date" },
    { name = "test_dma_codes", type = "INT64", mode = "REPEATED", description = "List of treated DMA criteria IDs" },
    { name = "control_dma_codes", type = "INT64", mode = "REPEATED", description = "List of synthetic or matched control DMA criteria IDs" },
    { name = "spend_delta", type = "FLOAT64", mode = "REQUIRED", description = "Incremental media spend in test group" },
    { name = "observed_lift_pct", type = "FLOAT64", mode = "REQUIRED", description = "Estimated incremental causal lift percentage" },
    { name = "baseline_cpi", type = "FLOAT64", mode = "REQUIRED", description = "Control group CPI" },
    { name = "observed_cpi", type = "FLOAT64", mode = "REQUIRED", description = "Test group CPI" },
    { name = "causal_roas_estimate", type = "FLOAT64", mode = "REQUIRED", description = "Estimated point incremental ROAS" },
    { name = "ci_lower", type = "FLOAT64", mode = "REQUIRED", description = "95% confidence interval lower bound" },
    { name = "ci_upper", type = "FLOAT64", mode = "REQUIRED", description = "95% confidence interval upper bound" },
    { name = "p_value", type = "FLOAT64", mode = "REQUIRED", description = "Hypothesis test p-value" },
    { name = "prior_lognormal_mu", type = "FLOAT64", mode = "REQUIRED", description = "Derived Log-Normal prior mean parameter" },
    { name = "prior_lognormal_sigma", type = "FLOAT64", mode = "REQUIRED", description = "Derived Log-Normal prior standard deviation parameter" },
    { name = "created_at", type = "TIMESTAMP", mode = "REQUIRED", description = "Record created timestamp" }
  ])
}
