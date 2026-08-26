# Two-Way Interface Contract: `01-audiences`
**Lead Contributor**: Jamie Pourturk (`jlpourt@google.com`)  
**Track**: Executive Command Center, Player Graph & DeepSona Synthetic Focus Groups  
**EBC Session**: Act 1 — Audiences: The Foundation (11:00 AM - 12:00 PM)  
**Target EA Stakeholders**: Brian Baron (VP Data & Analytics), Christina Bumbaca (VP Mobile Growth), Joel Knutson (VP Live Services)  

---

## 1. Executive Summary & Scope

`01-audiences` (Act 1) operates the central Executive Command Center, Spanner Property Graph identity resolution engine (5,000 master identities, 15,663 linked telemetry nodes), 5-Stage Sankey Player Marketing Journey visualizer, and grounded DeepSona multi-agent synthetic focus group simulator.

---

## 2. What `01-audiences` Delivers (Outbound Contracts)

### A. To `02-creative-insights` (Curtis Gross - Act 2)
1. **`AudienceBrief` via A2A Protocol (`DISPATCH_AUDIENCE_BRIEF`)**:
   - Machine-readable audience opportunity briefs including targeted gamer archetypes (`ULTIMATE_TEAM_WHALE`, `COMPETITIVE_GRINDER`, `CASUAL_SOCIALIZER`, `LORE_SEEKER`), friction triggers (e.g., "3+ Defeat Streak Tilt"), and recommended creative angles.
2. **Player Psychographic & Churn Telemetry**:
   - Resolved player identities, favorite clubs, favored formations, and primary creator affiliations (e.g., NickRTFM, Castro) to guide personalized multi-surface ad creative.

### B. To `03-measurement` (Pat Grady - Act 3)
1. **`ACK_SIMULATE_PERSONA_REACTION` (A2A Protocol)**:
   - Responds to `MediaBuyingAgent` pre-flight queries with DeepSona persona simulation scores (Willingness to Pay $, Churn Risk, and Backlash Polarity) to validate media reallocations before campaign execution.
2. **Data Warehouse Contract (`ea_audiences.fct_player_identity_graph` & `ea_audiences.fct_player_telemetry_events`)**:
   - Pre-generated player telemetry connecting EA ID, XUID, PSN ID, lifetime spend, and loss-streak friction flags.

### C. To `04-commerce-media` (Surya Kunju - Act 4)
1. **Target Cohort Affinities & DMA Geo-Clusters**:
   - High-density geographic clusters and brand affinities for programmatic dynamic 3D in-game billboard targeting.

---

## 3. What `01-audiences` Consumes (Inbound Dependencies)

### A. From `00-data-foundation` (Synthetic Data Engine)
1. **Spanner Property Graph (`EAPlayerGraph`)**:
   - Master nodes (`Players`, `Identities`, `Games`, `Clans`, `Offers`) and relational edges (`HAS_IDENTITY`, `PLAYED_GAME`, `MEMBER_OF_CLAN`, `PURCHASED_OFFER`).
2. **BigQuery Telemetry Tables**:
   - `ea_marketing_intelligence.fct_player_identity_graph` and `ea_marketing_intelligence.telemetry_match_events`.

### B. From `03-measurement` (Pat Grady - Act 3)
1. **`SIMULATE_PERSONA_REACTION` (Inbound A2A Query)**:
   - Pre-flight queries requesting simulated gamer reactions on proposed budget and channel allocations.

---

## 4. A2A Protocol Specifications

* **Endpoint**: `/api/a2a`
* **Protocol**: Linux Foundation / Google Agent-to-Agent (A2A) SDK v0.3
* **Agent Card**: `/.well-known/agent-card.json` (`Jamie_AudienceIntelligenceAgent`)
