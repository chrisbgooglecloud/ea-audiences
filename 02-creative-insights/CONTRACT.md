# Two-Way Interface Contract: `02-creative-insights`
**Lead Contributor**: Curtis Gross (`curtisgross@google.com`)  
**EBC Session**: Act 2 — Creative: Multi-Agent Content Creation (1:45 PM - 2:30 PM)  
**Target EA Stakeholders**: Andrea Hopelain (SVP EA SPORTS), Julie Foster (SVP EA Experiences), Evan Dexter (VP Franchise Strategy)  

---

## 1. Executive Summary & Scope

`02-creative-insights` operates the generative creative studio (Act 2), automated multi-surface renderer across EA's 6 surfaces, localization engine (transcreation), legal audit scanner, and community social listening hub.

---

## 2. What `02-creative-insights` Delivers (Outbound Contracts)

### A. To `03-measurement` (Pat Grady - Act 3)
1. **Multimodal Creative Asset Feed**:
   - Stores rendered video clips and static creatives in Cloud Storage (`gs://eagames-ebc-demo-app-creative-assets/...`).
   - Provides asset metadata (`surface`, `funnel_stage`, `franchise`, `duration_sec`, `language_code`) ready for Gemini 3.6 Flash structured tagging.
2. **Community Social Listening Stream (`ea_creative.fct_community_sentiment_stream`)**:
   - Seeded and generated via `00-data-foundation/sql/03_ai_generate_community_sentiment.sql` using BigQuery BQML `AI.GENERATE_TABLE` (`OUTPUT_SCHEMA`) with `gemini-3.5-flash-lite`.
   - Contains 500k authentic gamer posts across Steam, Reddit, Discord, Twitch Chat, and EA Forums with polarity (-1.0 to 1.0), detected issues (`BATTLE_PASS_GRIND`, `WEAPON_BALANCE`, `SERVER_LAG`, `STORE_PRICING`, `AUDIO_BUG`), and friction ratings.
3. **`ACK_REVISE_CREATIVE` (A2A Protocol)**:
   - Responds to `MediaBuyingAgent` revision directives with generated asset variants highlighting Gold Mine mechanics (e.g. "Squad Breach & Clear 2s Hook").

### B. To `04-commerce-media` (Surya Kunju - Act 4)
1. **3D In-Game Creative Assets**:
   - High-resolution textures and billboard assets optimized for Frostbite in-game rendering.

### C. To `01-audiences` (Jamie Pourturk - Act 1)
1. **Corrective Creative Proofs**:
   - Asset links provided to DeepSona to re-test player sentiment and confirm friction resolution.

---

## 3. What `02-creative-insights` Consumes (Inbound Dependencies)

### A. From `00-data-foundation` & `03-measurement` (Pat Grady - Act 3)
1. **`ea_measurement.fct_creative_shap_attributions` & Tactical 9-Grid (BigQuery)**:
   - Live table and view classifying 120+ creative mechanics into all 9 quadrants with SHAP explainability and marginal ROAS multiples.
   - Seeded via `00-data-foundation/sql/06_ai_generate_creative_shap.sql`.
   - Purpose: Directs Curtis's studio to scale up production for `GOLD_MINES` and deprecate `MONEY_PITS`.
2. **`REVISE_CREATIVE` (A2A Protocol)**:
   - Real-time messages from Pat's `MediaBuyingAgent` directing specific asset variations.

### B. From `01-audiences` (Jamie Pourturk - Act 1)
1. **`AudienceBrief` & `ea_audiences.fct_player_telemetry_events`**:
   - Churn-point alerts and player cohort psychographics from DeepSona simulations.

---

## 4. Inbound A2A Payload Specification (`MediaBuyingAgent` $\rightarrow$ `Curtis_CreativeStudioAgent`)

```json
{
  "message_id": "msg-mb-rev-001",
  "correlation_id": "corr-bf6-goldmine-rev",
  "sender": "MediaBuyingAgent",
  "recipient": "Curtis_CreativeStudioAgent",
  "timestamp": "2026-08-09T18:00:00Z",
  "intent": "REVISE_CREATIVE",
  "payload": {
    "campaign_id": "camp-bf6-fall",
    "franchise": "Battlefield",
    "feature_name": "Squad Breach & Clear",
    "quadrant": "GOLD_MINES",
    "marginal_roas_multiplier": 3.85,
    "target_channel": "TikTok",
    "target_surface": "STREAMING_OVERLAYS",
    "directive": "Lead with 2-second high-intensity ToFu action hook featuring Squad Breach & Clear for TikTok flights.",
    "budget_allocated": 85000.0
  }
}
```
