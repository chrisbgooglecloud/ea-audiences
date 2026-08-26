# Two-Way Interface Contract: `03-measurement`
**Lead Contributor**: Pat Grady (`patrickgrady@google.com`)  
**Track**: Agentic Utility, Predictive Measurement & Meridian MMM  
**EBC Session**: Act 3 — Agentic Utility & Measurement (12:45 PM - 1:45 PM)  
**Target EA Stakeholders**: Brian Baron (VP Data & Analytics), Christina Bumbaca (VP Mobile Growth), Gabi De Rossi (Sr. Director Growth Analytics)  

---

## 1. Executive Summary & Dual-Interface Role

`03-measurement` (Act 3) serves as the mathematical, econometric, and causal decision engine for the entire EA platform. It operates in two modes:
1. **Specialized Line-of-Business (LOB) Workspace**: Interactive 4-tab Next.js dashboard providing deep multimodal video tagging, 210-DMA Geo-Spine exploration, Bayesian prior calibration (`mmm.proto`), real-time Equimarginal Hill Saturation budget solving (<200ms), and SHAP 9-Grid explainability via `gemini-3.6-flash` (`thinking_level=HIGH`).
2. **Gemini Enterprise Feed Provider**: Exposes structured A2A endpoints and dynamic A2UI components (metric cards, S-curves, scatter matrices) rendered inside the Executive Command Center (`01-audiences`).

---

## 2. What `03-measurement` Delivers (Outbound Contracts)

### A. To `01-audiences` (Jamie Pourturk - Act 1)
1. **Data Warehouse Contract (`ea_measurement.dim_metro_geospine` & `ea_measurement.vw_unified_geospine_features`)**:
   - 210 Google Ads Metro Areas spine table with demographic, income, gaming density, and WeatherNext 2.0 climate shocks (+18% to +35% session lift).
   - Seeded via `00-data-foundation/generators/geospine_generator.py` and `00-data-foundation/sql/07_vw_unified_geospine_features.sql`.
   - Purpose: Enables Jamie to map player cohorts and regional density clusters for DeepSona persona simulations.
2. **A2UI Streaming Components**:
   - Standardized A2UI v0.8 declarative components streamed via SSE: `<a2ui-metric-card>`, `<a2ui-scurve-chart>`, `<a2ui-grid-scatter>`, `<a2ui-recommendation-card>`.
3. **Outbound A2A Dispatches**:
   - `SIMULATE_PERSONA_REACTION` pre-flight requests before executing large-scale media reallocations.

### B. To `02-creative-insights` (Curtis Gross - Act 2)
1. **Data Warehouse Contract (`ea_measurement.fct_creative_shap_attributions` & Tactical 9-Grid)**:
   - Aggregated BigQuery table and view classifying all extracted creative mechanics, visual hooks, and audio cues into the Tactical 3x3 Matrix:
     - `GOLD_MINES` (Marginal ROAS $\ge 2.5$, Frequency $<15$) $\rightarrow$ *Directive: Scale Up*
     - `CORE_DRIVERS` (Marginal ROAS $\ge 2.5$, Frequency $15-40$) $\rightarrow$ *Directive: Maintain*
     - `SATURATED_STARS` (Marginal ROAS $\ge 2.5$, Frequency $>40$) $\rightarrow$ *Directive: Monitor / Retire*
     - `MONEY_PITS` (Marginal ROAS $<1.2$, Frequency $>40$) $\rightarrow$ *Directive: Kill Immediately*
   - Seeded via `00-data-foundation/sql/06_ai_generate_creative_shap.sql`.
2. **A2A Protocol Directives (`REVISE_CREATIVE`)**:
   - Real-time A2A messages specifying feature name, target surface, target channel, and creative hook directives.

### C. To `04-commerce-media` (Surya Kunju - Act 4)
1. **Data Warehouse Contract (`ea_measurement.dim_metro_geospine` & `ea_measurement.fct_daily_channel_spend`)**:
   - Shared 210 DMA geographic spine and 3-Year daily channel spend facts ($1,095$ days, $4.39\text{x}$ ROAS) for localized dynamic 3D in-game ad targeting and programmatic yield modeling.
2. **A2A Protocol Allocations (`ALLOCATE_PROGRAMMATIC_SPEND`)**:
   - Optimized programmatic spend weights, target surfaces (`STADIUM_BOARDS`, `PAUSE_SCREENS`), and target DMA lists computed by the Equimarginal Hill Saturation solver.

---

## 3. What `03-measurement` Consumes (Inbound Dependencies)

### A. From `01-audiences` (Jamie Pourturk - Act 1)
1. **`ea_audiences.fct_player_identity_graph` & `ea_audiences.fct_player_telemetry_events`**:
   - Player identity telemetry (XUID, PSN, EA ID), APM, loss streak counts, and behavioral state segments (e.g., "High Frustration", "Lapsed Whale").
   - Seeded via `00-data-foundation/sql/04_ai_generate_player_telemetry.sql`.
2. **`ACK_SIMULATE_PERSONA_REACTION`**:
   - DeepSona persona simulation response payload containing `willingness_to_pay_usd`, `churn_risk_score`, `final_fsm_state`, and `authenticity_rating` across 4 gamer archetypes.

### B. From `02-creative-insights` (Curtis Gross - Act 2)
1. **Creative Asset Ingestion Feed & Social Sentiment (`ea_creative.fct_community_sentiment_stream`)**:
   - Raw/rendered video and static image assets in Cloud Storage (`gs://eagames-ebc-demo-app-creative-assets/...`) with associated surface metadata.
   - 500k community sentiment logs across Steam, Reddit, Discord, and Twitch generated via `00-data-foundation/sql/03_ai_generate_community_sentiment.sql`.
2. **`ACK_REVISE_CREATIVE`**:
   - Acknowledgment and generated asset variant metadata generated in response to Gold Mine revision requests.

### C. From `04-commerce-media` (Surya Kunju - Act 4)
1. **In-Game Ad Delivery & IAS Telemetry (`ea_commerce.fct_3d_ad_impressions_ias`)**:
   - Impression logs and IAS camera-dwell verification scores (0.1s - 8.0s) from 3D Frostbite in-game placements to update Meridian MMM channel response curves.
   - Seeded via `00-data-foundation/sql/05_ai_generate_commerce_ias.sql`.
2. **`ACK_ALLOCATE_PROGRAMMATIC_SPEND`**:
   - Ad server pacing confirmation and active match delivery status.

---

## 4. Contract Schema Definitions

### A2A Message Envelope Schema
```json
{
  "message_id": "string (UUID)",
  "correlation_id": "string (Trace ID)",
  "sender": "MediaBuyingAgent | TaggingAgent | AnalyticsAgent",
  "recipient": "Jamie_DeepSonaAgent | Curtis_CreativeStudioAgent | Surya_CommerceMediaAgent",
  "timestamp": "ISO 8601 UTC timestamp",
  "intent": "REVISE_CREATIVE | SIMULATE_PERSONA_REACTION | ALLOCATE_PROGRAMMATIC_SPEND",
  "payload": "object",
  "status": "SENT | PROCESSED | DELIVERED"
}
```

### Dataform Schema: `ea_measurement.dim_metro_geospine`
| Column | Type | Description |
| :--- | :--- | :--- |
| `metro_code` | INT64 | Google Ads Metro Area Code (210 US DMAs) |
| `metro_name` | STRING | Metro name (e.g. "New York, NY", "Los Angeles, CA") |
| `state_code` | STRING | US State abbreviation |
| `total_population` | INT64 | Metro population (WorldPop aligned) |
| `median_household_income_usd` | INT64 | Census median household income |
| `gaming_density_index` | FLOAT64 | Relative gaming penetration index |
| `hill_saturation_s_multiplier` | FLOAT64 | Local market saturation scalar |
| `lat` / `lon` | FLOAT64 | Metro centroid coordinates |

### Dataform Schema: `ea_measurement.vw_tactical_9grid_features`
| Column | Type | Description |
| :--- | :--- | :--- |
| `franchise` | STRING | EA Franchise (*Apex Legends*, *EA Sports FC*, *Battlefield*, *The Sims*) |
| `feature_name` | STRING | Mechanic or hook name (e.g. "Squad Breach & Clear") |
| `funnel_stage` | STRING | `ToFu_Exploration`, `MoFu_Progression`, `BoFu_Conversion` |
| `surface` | STRING | Primary EA surface alignment |
| `frequency_count` | INT64 | Occurrence count across creative telemetry (X-axis) |
| `mean_shap_value` | FLOAT64 | Average SHAP attribution value |
| `marginal_roas_impact` | FLOAT64 | Marginal ROAS multiple (Y-axis) |
| `tactical_quadrant` | STRING | Quadrant enum (`GOLD_MINES`, `CORE_DRIVERS`, etc.) |
| `strategic_recommendation` | STRING | Prescribed strategic directive |
