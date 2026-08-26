# `03-measurement`: Creative Intelligence, Predictive Measurement & Meridian MMM

**Lead**: Pat Grady (`patrickgrady@google.com`)  
**EBC Session**: Act 3 — Agentic Utility & Measurement (12:45 PM - 1:45 PM)  
**Target EA Stakeholders**: Brian Baron (VP Data & Analytics), Christina Bumbaca (VP Mobile Growth), Gabi De Rossi (Sr. Director Growth Analytics)  

---

## 1. Executive Narrative & Mission
As performance marketers at Electronic Arts, leadership’s primary mandate is driving **Net Bookings**, lowering **Cost Per Install (CPI)**, and maximizing **Day 7 ROAS (D7 ROAS)**.

`03-measurement` (Act 3) is the econometric decision engine of the closed-loop growth platform. It connects raw creative game mechanics to bottom-line financial impact by combining:
1. **Multimodal Asset Intelligence**: Gemini 3.6 Flash extraction of game mechanics and storybeats classified across EA’s 6 marketing surfaces and 3 funnel stages.
2. **Spatial-Temporal MLOps (210 DMAs)**: BigQuery Dataform data fusion joining Google Ads Metro areas, Google Trends search zeitgeist, and WeatherNext 2 climate shocks.
3. **Meridian MMM & Bayesian Prior Calibration**: Protobuf-serialized state (`mmm.proto`) tuning log-normal priors from causal geo-incrementality trials.
4. **Equimarginal Hill Saturation Budget Solver**: Sub-200ms mathematical solver enforcing a strict **20% daily pacing clamp** and **zero-sum portfolio constraint**.
5. **Tactical 9-Grid SHAP Attribution**: Decomposition of creative feature importance into a 3x3 matrix (`GOLD_MINES`, `CORE_DRIVERS`, `MONEY_PITS`) with `gemini-3.6-flash` (`thinking_level=HIGH`) chain-of-thought deep reasoning.
6. **Agentic Media Buying & Protocols**: ADK Multi-Agent Fleet with A2A dispatchers calling Jamie (Audiences - Act 1), Curtis (Creative Studio - Act 2), and Surya (Commerce Media - Act 4), plus A2UI dynamic streaming to Next.js.

---

## 2. Dual-Interface Architecture
- **Specialized LOB Workspace (Next.js Dashboard)**:
  - **Command Center** (`/`): Executive KPI hero banner, enterprise ROI benchmarks, and A2UI streaming sandbox.
  - **Tab 1: Multimodal Creative Tagger** (`/multimodal`): Synchronized video player, time-coded storybeats, funnel classifier, 6-surface suitability matrix, Pydantic JSON drawer.
  - **Tab 2: Tactical 9-Grid Attribution** (`/attribution`): Interactive SHAP scatter matrix and Gemini 3.6 Flash CoT deep reasoning cards.
  - **Tab 3: Spatial MLOps Geo-Explorer** (`/geospine`): 210-metro US DMA interactive map with WeatherNext climate shocks and local Hill parameters.
  - **Tab 4: Scenario Planner & Simulator** (`/scenario`): Meridian sliders ($100k-$10M), real-time S-curve response curves, 20% clamp indicator, and "Send to Media Agent" CTA.
- **Single-Pane Feeder**: Streams metric cards, S-curve graphs, and 9-grid scatter charts via the A2UI v0.8 protocol to the Executive Command Center (`01-audiences`).

---

## 3. Directory Structure

```text
03-measurement/
├── agents/                       # ADK Multi-Agent Fleet
│   ├── app/
│   │   ├── sub_agents/           # TaggingAgent, AnalyticsAgent, MediaBuyingAgent
│   │   ├── tools/                # BigQuery, Firestore, Meridian, RAG tools
│   │   ├── protocols/            # A2A Message Bus & A2UI Protocol Generator
│   │   ├── agent.py              # Root Orchestrator Agent
│   │   ├── fast_api_app.py       # Agent Fleet FastAPI Server
│   │   ├── schemas.py            # Pydantic Types & Schemas
│   │   └── agent_card.json       # A2A Agent Card for Gemini Enterprise Registry
│   └── tests/                    # Agent unit & integration tests
│
├── backend/                      # Core FastAPI MLOps & Math Microservice
│   ├── app/
│   │   ├── routers/              # multimodal, mlops, meridian, attribution, agents
│   │   ├── services/             # pacing_engine, meridian_prior_tuner, attribution_engine, gemini_service, geospine_service
│   │   └── main.py
│   └── pyproject.toml
│
├── dataform/                     # BigQuery Dataform Pipeline & Contracts
│   └── definitions/marts/
│       ├── dim_metro_geospine.sqlx          # 210 DMA Shared Spine Table
│       ├── fct_geospine_daily_metro.sqlx    # Daily WeatherNext & Trends Facts
│       └── vw_tactical_9grid_features.sqlx  # 9-Grid Attribution View for Curtis
│
├── frontend/                     # Next.js Analytics & Simulator UI
│   └── src/app/
│       ├── page.tsx              # Executive Summary & A2UI Sandbox
│       ├── multimodal/page.tsx   # Tab 1: Multimodal Tagger
│       ├── attribution/page.tsx  # Tab 2: Tactical 9-Grid
│       ├── geospine/page.tsx     # Tab 3: Spatial Geo-Spine
│       └── scenario/page.tsx     # Tab 4: Scenario Planner
│
├── proto/                        # Meridian Protobuf Definitions
│   ├── mmm.proto                 # Meridian state schema
│   └── mmm_pb2.py                # Compiled Python Protobuf
│
├── terraform/                    # Cloud Run, BigQuery, Firestore IaC
├── tests/                        # Tier 1-5 Unit, Integration, E2E & Adversarial Tests
├── CONTRACT.md                   # Formal Two-Way Interface Contract
├── DEPENDENCIES.md               # Infrastructure & Package Specifications
└── README.md                     # This Document
```

---

## 4. Synthetic Data Foundation & Seeding Quickstart

All datasets and tables are seeded via the central `00-data-foundation` engine:

```bash
# 1. Run Data Foundation Orchestrator (Steps 1 to 5)
python3 00-data-foundation/orchestrator.py --live

# 2. Seed Cloud Firestore Native and BigQuery Marts
python3 03-measurement/scripts/seed_firestore_and_bq.py --live

# 3. Run full automated test suite (Unit, Agent, Data Foundation)
PYTHONPATH="03-measurement:00-data-foundation" ./03-measurement/.venv/bin/pytest 03-measurement/tests 03-measurement/agents/tests 00-data-foundation/tests
```

---

## 5. Local Development Quickstart

```bash
# 1. Start Backend Microservice (Port 8000)
cd 03-measurement/backend
uvicorn app.main:app --reload --port 8000

# 2. Start ADK Agent Server (Port 8080)
cd ../agents
uvicorn app.fast_api_app:app --reload --port 8080

# 3. Start Next.js Frontend (Port 3000)
cd ../frontend
npm install && npm run dev
```

---

## 6. Interface Contracts
- See [CONTRACT.md](CONTRACT.md) for full inbound/outbound payload specifications with `01-audiences`, `02-creative-insights`, and `04-commerce-media`.
