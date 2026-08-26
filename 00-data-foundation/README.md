# Unified Synthetic Data Foundation (`00-data-foundation/`)

This directory contains the central synthetic data generation engine and BQML orchestration pipeline powering all four modules of the `ea-ebc-demos` platform (`01-audiences`, `02-creative-insights`, `03-measurement`, and `04-commerce-media`).

---

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        3-TIER HYBRID GENERATION ARCHITECTURE                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 1: BigQuery BQML Remote Gemini Model & AI.GENERATE_TABLE                         │
│ • Registered Remote Model `ea_measurement.gemini_flash_model` (gemini-3.5-flash-lite)  │
│ • Enforces structured OUTPUT_SCHEMA with field definitions and OPTIONS(description)    │
│ • Bulk generates unstructured sentiment streams, telemetry logs, and IAS audit logs.   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 2: Python Vectorized Econometric Math Engine (NumPy / SciPy)                      │
│ • 3-Year (1,095 Days / 156 Weeks) Meridian MMM time-series spend and conversion facts. │
│ • Enforces exact Hill saturation curves, Weibull adstock carryover, and zero-sum pacing│
│ • 210 Google Ads Metro Areas Geo-Spine with WeatherNext 2.0 and Google Trends joins.   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TIER 3: Multi-Module Data Warehouse & Storage Layer                                    │
│ • BigQuery Datasets: ea_measurement, ea_audiences, ea_creative, ea_commerce           │
│ • Cloud Firestore Native Collections: /campaigns, /creative_assets, /scenarios         │
│ • Local Parquet & JSON artifact exports for offline development and testing.           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```text
00-data-foundation/
├── config.py                             # Central configuration, GCP settings, and budget constraints
├── orchestrator.py                       # Master CLI runner executing Steps 1 to 5
├── README.md                             # Architecture and usage documentation
├── generators/
│   ├── __init__.py
│   ├── mmm_math_engine.py                # 3-Year MMM daily spend, Hill curves, Weibull adstock
│   ├── geospine_generator.py             # Complete 210 DMA Geo-Spine + WeatherNext 2.0 anomalies
│   └── hybrid_bqml_runner.py             # BQML AI.GENERATE_TABLE runner with structured schema engine
├── sql/
│   ├── 01_setup_remote_model.sql         # BigQuery Vertex AI Remote Model registration (gemini-3.5-flash-lite)
│   ├── 02_create_datasets_and_tables.sql # BigQuery DDL for all 4 module datasets
│   ├── 03_ai_generate_community_sentiment.sql # AI.GENERATE_TABLE with OUTPUT_SCHEMA for ea_creative
│   ├── 04_ai_generate_player_telemetry.sql    # AI.GENERATE_TABLE with OUTPUT_SCHEMA for ea_audiences
│   ├── 05_ai_generate_commerce_ias.sql        # AI.GENERATE_TABLE with OUTPUT_SCHEMA for ea_commerce
│   ├── 06_ai_generate_creative_shap.sql       # AI.GENERATE_TABLE with OUTPUT_SCHEMA for ea_measurement
│   └── 07_vw_unified_geospine_features.sql    # Unified Geo-Spine View (WeatherNext + Trends + WorldPop)
└── exports/                              # Local JSON / data exports generated during runs
```

---

## 3. The 5 Synthetic Data Generation Steps

| Step | Target Module | Output Tables / Collections | Key Analytical / ML Techniques |
| :--- | :--- | :--- | :--- |
| **Step 1** | `03-measurement` & All Modules | `ea_measurement.dim_metro_geospine`<br>`ea_measurement.fct_geospine_daily_metro`<br>`ea_measurement.vw_unified_geospine_features` | 210 US Google Ads DMAs with centroid geometries, WorldPop demographic proxies, Google Trends interest, and WeatherNext 2.0 severe weather shocks (+18% to +35% session lift). |
| **Step 2** | `03-measurement` (MMM) | `ea_measurement.fct_daily_channel_spend`<br>`ea_measurement.causal_lift_experiments` | 3 full years (1,095 days) of daily media spend ($5M-$10M/month) across 8 channels, 4 titles, and 7 countries with exact Hill saturation curves, Weibull adstock decays, and a 4.39x portfolio average ROAS. |
| **Step 3** | `02-creative` & `03-measurement` | `ea_measurement.fct_creative_shap_attributions`<br>Firestore `/attribution_models` | 120 creative mechanics and visual hooks across 6 surfaces and 3 funnel stages mapped into all 9 Tactical 9-Grid quadrants with SHAP explainability. |
| **Step 4** | `01-audiences` & `02-creative` | `ea_audiences.fct_player_telemetry_events`<br>`ea_creative.fct_community_sentiment_stream` | 10M player telemetry events with Markov behavioral state transitions (APM, loss streak, store visits) and 500k community sentiment logs across Steam, Reddit, Discord, and Twitch. |
| **Step 5** | `04-commerce-media` | `ea_commerce.fct_3d_ad_impressions_ias` | 100k 3D in-game Frostbite ad impressions with IAS camera dwell verification (0.1s - 8.0s), occlusion %, and programmatic first-price auction clearing CPMs. |

---

## 4. BQML `AI.GENERATE_TABLE` with `OUTPUT_SCHEMA`

BigQuery's `AI.GENERATE_TABLE` allows passing a structured schema directly inside SQL using the `OUTPUT_SCHEMA` parameter with field definitions and `OPTIONS(description = '...')` clauses:

```sql
SELECT *
FROM AI.GENERATE_TABLE(
  MODEL `ea_measurement.gemini_flash_model`,
  TABLE input_prompts,
  STRUCT(
    0.75 AS temperature,
    4096 AS max_output_tokens,
    '''
    sentiment_polarity FLOAT64 OPTIONS(description = 'Sentiment polarity score from -1.0 to 1.0'),
    detected_issue STRING OPTIONS(description = 'Primary category: BATTLE_PASS_GRIND, WEAPON_BALANCE, SERVER_LAG, STORE_PRICING, AUDIO_BUG, NONE'),
    player_archetype STRING OPTIONS(description = 'Gamer archetype: COMPETITIVE_GRINDER, LORE_SEEKER, CASUAL_SOCIALIZER, ULTIMATE_TEAM_WHALE'),
    friction_intensity FLOAT64 OPTIONS(description = 'Player friction rating from 0.0 to 1.0'),
    raw_text STRING OPTIONS(description = 'Raw verbatim gamer text including slang and mechanic mentions')
    ''' AS output_schema
  )
);
```

---

## 5. Usage & CLI Commands

### Run Full Pipeline in Local Validation / Dry-Run Mode
```bash
python3 00-data-foundation/orchestrator.py
```

### Run Full Pipeline Live against BigQuery & Firestore
```bash
python3 00-data-foundation/orchestrator.py --live
```

### Run a Specific Generation Step
```bash
python3 00-data-foundation/orchestrator.py --step 2 --export-dir 00-data-foundation/exports
```
