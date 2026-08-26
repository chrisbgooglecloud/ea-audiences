# Two-Way Interface Contract: `04-commerce-media`
**Lead Contributor**: Surya Kunju (`suryakunju@google.com`)  
**EBC Session**: Act 4 — RMN: Identity & Data Partnerships Breakout (3:30 PM - 4:15 PM)  
**Target EA Stakeholders**: Andrea Hopelain (SVP EA SPORTS), Evan Dexter (VP Franchise Strategy), Mark Cole (Sr. Director Asia Insights)  

---

## 1. Executive Summary & Scope

`04-commerce-media` (Act 4) powers the EA Commerce Media Network middleware inside Frostbite, the self-serve advertiser portal, and the IAS camera dwell-time brand safety verification engine.

---

## 2. What `04-commerce-media` Delivers (Outbound Contracts)

### A. To `03-measurement` (Pat Grady - Act 3)
1. **Ad Impression & IAS Dwell Telemetry (`ea_commerce.fct_3d_ad_impressions_ias`)**:
   - Seeded and generated via `00-data-foundation/sql/05_ai_generate_commerce_ias.sql` using BigQuery BQML `AI.GENERATE_TABLE` (`OUTPUT_SCHEMA`) with `gemini-3.5-flash-lite`.
   - Telemetry logs detailing delivered in-game impressions, 210 DMA distribution, CPMs ($12–$45), camera view angle (0°–75°), occlusion %, and IAS verified camera dwell duration (0.1s to 8.0s).
   - Purpose: Ingested by Pat's Meridian MMM to update saturation curves and response elasticity for in-game programmatic channels.
2. **`ACK_ALLOCATE_PROGRAMMATIC_SPEND` (A2A Protocol)**:
   - Confirmation response to Pat's `MediaBuyingAgent` with active match serving count and pacing status.

### B. To `01-audiences` (Jamie Pourturk - Act 1)
1. **Advertiser Network Revenue Feeds**:
   - High-level net yield and inventory fill rates displayed on the Executive Command Center dashboard.

---

## 3. What `04-commerce-media` Consumes (Inbound Dependencies)

### A. From `00-data-foundation` & `03-measurement` (Pat Grady - Act 3)
1. **`ea_measurement.dim_metro_geospine` & `ea_measurement.vw_unified_geospine_features`**:
   - Complete 210 Google Ads Metro Areas spine table with demographic, gaming density, and WeatherNext 2.0 climate anomalies used to target dynamic in-game ads to specific DMA viewer regions.
2. **`ALLOCATE_PROGRAMMATIC_SPEND` (A2A Protocol)**:
   - Optimized programmatic spend weights, target surfaces (`STADIUM_BOARDS`, `PAUSE_SCREENS`), and target DMA lists computed by the Equimarginal Hill Saturation solver.

### B. From `02-creative-insights` (Curtis Gross - Act 2)
1. **3D Billboard & Stadium Textures**:
   - Rendered creative assets and brand textures formatted for Frostbite 3D in-game surfaces.

### C. From `01-audiences` (Jamie Pourturk - Act 1)
1. **Player Segment State Telemetry (`ea_audiences.fct_player_identity_graph` & `fct_player_telemetry_events`)**:
   - Contextual player states and Markov behavioral transitions from the Identity Graph used for in-game ad personalization.

---

## 4. Inbound A2A Payload Specification (`MediaBuyingAgent` $\rightarrow$ `Surya_CommerceMediaAgent`)

```json
{
  "message_id": "msg-mb-prog-001",
  "correlation_id": "corr-fc26-stadium-spend",
  "sender": "MediaBuyingAgent",
  "recipient": "Surya_CommerceMediaAgent",
  "timestamp": "2026-08-09T18:00:00Z",
  "intent": "ALLOCATE_PROGRAMMATIC_SPEND",
  "payload": {
    "campaign_id": "camp-fc26-launch",
    "franchise": "EA Sports FC",
    "channel": "Programmatic 3D",
    "stadium_board_budget": 85000.0,
    "target_surfaces": ["STADIUM_BOARDS", "PAUSE_SCREENS"],
    "dma_focus": [501, 803, 602],
    "pacing_daily_limit": 17000.0,
    "ias_dwell_threshold_ms": 1500
  }
}
```
