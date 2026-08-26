# Dependencies & Environment Specification: `03-measurement`

---

## 1. System & Cloud Infrastructure Dependencies

### Google Cloud Resources
- **Project ID**: `eagames-ebc-demo-app`
- **Region**: `us-central1` (Location: `global` for Gemini Enterprise)
- **Cloud Run Services** (Deployed with `invoker_iam_disabled = true` for public access):
  - `ea-measurement-backend` (FastAPI MLOps & Math engine, Port 8000)
  - `ea-measurement-frontend` (Next.js Analytics Dashboard, Port 3000)
  - `ea-measurement-agents` (ADK Agent Server, Port 8080)
- **Google BigQuery Datasets & Remote Models**:
  - `ea_measurement` (Houses `dim_metro_geospine`, `fct_geospine_daily_metro`, `fct_daily_channel_spend`, `causal_lift_experiments`, `fct_creative_shap_attributions`, `vw_unified_geospine_features`)
  - `ea_audiences` (`fct_player_identity_graph`, `fct_player_telemetry_events`)
  - `ea_creative` (`fct_community_sentiment_stream`)
  - `ea_commerce` (`fct_3d_ad_impressions_ias`)
  - `ea_measurement.gemini_flash_model` (Remote Vertex AI model pointing to `gemini-3.5-flash-lite` via `vertex-ai-connection`)
  - `patrickgrady-dev-machine.weathernext_2.weathernext_2_0_0` (WeatherNext 2 ensemble weather shocks)
- **Google Cloud Firestore**:
  - Database: `(default)` in Native mode (nam5)
  - Collections: `campaigns`, `creative_assets`, `metro_geospine`, `attribution_models`, `scenarios`, `agent_states`
- **Google Cloud Storage**:
  - Bucket: `gs://eagames-ebc-demo-app-creative-assets`
- **Data Foundation & Seeding Engine**:
  - Central Orchestrator: `python3 00-data-foundation/orchestrator.py --live`
  - Seed CLI: `python3 03-measurement/scripts/seed_firestore_and_bq.py --live`

---

## 2. Machine Learning & Model Specifications

- **Vertex AI Gemini Models**:
  - `gemini-3.6-flash`: High-fidelity reasoning (`thinking_level=HIGH`) for SHAP chain-of-thought attribution and multimodal video storybeat extraction.
  - `gemini-3.5-flash-lite`: Low-latency agentic routing and real-time negotiation dispatching.
- **Meridian Marketing Mix Model**:
  - Bayesian log-normal prior calibration from causal incrementality tests ($\mu, \sigma, S, k$).
  - Protobuf state schema: `proto/mmm.proto` compiled via `protoc` to `proto/mmm_pb2.py`.
- **Equimarginal Hill Saturation Solver**:
  - Scipy optimization runtime solving $\frac{\partial R_i}{\partial x_i} = \lambda$ under zero-sum budget constraint $\sum \Delta x_i = 0$ and 20% daily shift clamp $|x_i - x_i^0| \le 0.20 x_i^0$.
  - Target latency: $\le 200\text{ms}$.

---

## 3. Software & Runtime Packages

### Backend & Agents (Python 3.11+)
- `fastapi>=0.115.0`
- `uvicorn>=0.30.0`
- `pydantic>=2.10.0`
- `google-genai>=1.0.0`
- `google-cloud-bigquery>=3.25.0`
- `google-cloud-firestore>=2.18.0`
- `google-cloud-storage>=2.18.0`
- `protobuf>=5.28.0`
- `numpy>=1.26.0`
- `scipy>=1.13.0`
- `sse-starlette>=2.1.0`
- `pytest>=8.0.0`
- `pytest-asyncio>=0.24.0`

### Frontend (Node.js 18+)
- `next: 14.2.35`
- `react: ^18.3.1`
- `react-dom: ^18.3.1`
- `lucide-react: ^0.460.0`
- `recharts: ^2.13.0`
- `tailwindcss: ^3.4.1`
- `typescript: ^5.6.0`

### Dataform
- `@dataform/core: ^3.0.0`
- BigQuery connection: `ea-measurement-dw`
