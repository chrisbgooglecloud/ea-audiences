# Dependencies & Integration Guide: `02-creative-insights`

## Service & Infrastructure Dependencies

1. **Google Cloud Services**:
   - Cloud Run service: `ea-creative-backend`
   - Cloud Run service: `ea-creative-frontend`
   - Cloud Run service: `ea-creative-agents` (`Curtis_CreativeStudioAgent`)
   - Cloud Storage Bucket: `eagames-ebc-demo-app-creative-assets`
   - Vertex AI Imagen / Video FX API for multi-surface rendering

2. **Shared BigQuery Data Sources (Seeded by `00-data-foundation`)**:
   - `ea_creative.fct_community_sentiment_stream` (Generated via BQML `AI.GENERATE_TABLE` with `OUTPUT_SCHEMA`)
   - `ea_measurement.fct_creative_shap_attributions` (Tactical 9-Grid feature attributions)
   - Seeding Command: `python3 00-data-foundation/orchestrator.py --live`

3. **ADK Agent Configuration**:
   - Agent Name: `Curtis_CreativeStudioAgent`
   - Model: `gemini-3.6-flash`
   - Protocol: A2A (JSON-RPC over HTTP)

4. **Monorepo Contracts**:
   - Schema reference: See `02-creative-insights/CONTRACT.md` for exact message envelope structures.
