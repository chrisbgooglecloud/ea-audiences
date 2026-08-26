# EA Audiences Command Center & Intelligence Studio

> Real-time player intelligence, Spanner Property Graph traversal, lifecycle Sankey journeys, grounded synthetic focus groups, and Agent-to-Agent (A2A) campaign dispatch for EA Live Services.

---

## 🎯 Architecture Overview

The **EA Audiences Command Center** unifies fragmented player telemetry across 5 EA franchises into a centralized intelligence platform powered by Google Cloud:

1. **Cloud Spanner Property Graph**:
   * Unified Graph connecting 5,000 master player identities, 15,663 linked telemetry nodes, and behavioral traits across EA SPORTS FC, Apex Legends, Madden NFL, Battlefield, and The Sims.
   * Real-time traversal for loss streaks, tilt index, creator stream affinities, and cross-title gravity.

2. **Player Marketing Journeys (Sankey Lifecycle Flow)**:
   * 5-Stage dynamic lifecycle visualizer mapping *Acquisition $\rightarrow$ Core Mode $\rightarrow$ Behavioral Friction $\rightarrow$ Marketing Offer $\rightarrow$ Outcome*.
   * Real-time Gemini 3.5 Flash-Lite path-level intelligence and macro funnel health diagnostics.

3. **Grounded Synthetic Focus Groups (DeepSona Simulation)**:
   * Real-time multi-agent persona simulations grounded in sampled graph telemetry.
   * Tests price sensitivity, Willingness to Pay ($), and community backlash across Discord, Reddit, and 1-on-1 qualitative focus groups.

4. **Agent-to-Agent (A2A) Protocol**:
   * Dispatches machine-readable audience opportunity briefs directly to Act 2 (Creative Studio) and Act 4 (Commerce Media).

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Canvas / SVG Visualizers.
* **GCP Infrastructure**: Google Cloud Run, Cloud Spanner (Graph DB), BigQuery, Cloud Storage.
* **Generative AI**: Google Cloud Vertex AI Gemini 3.5 Flash-Lite.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file or set the environment variables:
```env
GCP_PROJECT_ID=jamie-bq-test
GCP_REGION=us-central1
SPANNER_INSTANCE_ID=blackrock-spanner
SPANNER_DATABASE_ID=ea_graph_db
BQ_DATASET_ID=ea_marketing_intelligence
VERTEX_MODEL=gemini-3.5-flash-lite
```

### 3. Run Locally
```bash
npm run dev
# or for production build
npm run build && npm run start -p 3005
```

---

## 🚢 Google Cloud Run Deployment

```bash
gcloud run deploy ea-audiences-studio \
  --source . \
  --region us-central1 \
  --project jamie-bq-test \
  --service-account=694576205607-compute@developer.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=jamie-bq-test,GCP_REGION=us-central1,SPANNER_INSTANCE_ID=blackrock-spanner,SPANNER_DATABASE_ID=ea_graph_db,BQ_DATASET_ID=ea_marketing_intelligence,VERTEX_MODEL=gemini-3.5-flash-lite"
```
