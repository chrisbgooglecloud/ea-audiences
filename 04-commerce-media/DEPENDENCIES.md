# Dependencies & Integration Guide: `04-commerce-media`

## Service & Infrastructure Dependencies

1. **Google Cloud Services**:
   - Cloud Run service: `ea-commerce-backend`
   - Cloud Run service: `ea-commerce-frontend`
   - Cloud Run service: `ea-commerce-agents` (`Surya_CommerceMediaAgent`)
   - BigQuery Dataset: `ea_commerce_media`
   - Vertex AI Multimodal Vision for IAS Camera Dwell verification

2. **Shared BigQuery Data Sources**:
   - `ea_measurement.dim_metro_geospine` (Managed by Pat's Dataform pipeline in `03-measurement/dataform`)

3. **ADK Agent Configuration**:
   - Agent Name: `Surya_CommerceMediaAgent`
   - Model: `gemini-3.6-flash`
   - Protocol: A2A (JSON-RPC over HTTP)

4. **Monorepo Contracts**:
   - Schema reference: See `04-commerce-media/CONTRACT.md` for exact message envelope structures.
