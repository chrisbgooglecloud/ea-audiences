# Dependencies & Setup: `01-audiences`

## Runtime Environment
- **Node.js**: `v20.x+` (Alpine Linux supported in Docker)
- **Framework**: Next.js 14 (App Router), React 18, Tailwind CSS, TypeScript 5.7+
- **GCP Services**:
  - Cloud Run (Managed, min 2GB RAM / 2 vCPU recommended)
  - Google Cloud Spanner Enterprise (`EAPlayerGraph`)
  - Google Cloud BigQuery (`ea_marketing_intelligence`)
  - Google Cloud Vertex AI (`gemini-2.5-flash-lite`, `gemini-3.5-flash-lite`)

## NPM Dependencies
- `@a2a-js/sdk`: `^1.0.1` (A2A Protocol)
- `@google-cloud/spanner`: `^7.18.0`
- `@google-cloud/bigquery`: `^7.9.2`
- `@google-cloud/vertexai`: `^1.9.3`
- `@google/genai`: `^2.16.0`
- `react-force-graph-2d`: `^1.25.7`
- `react-force-graph-3d`: `^1.24.4`
- `three`: `^0.160.0`
- `framer-motion`: `^11.18.2`
- `lucide-react`: `^0.475.0`
- `d3-geo`, `topojson-client`, `world-atlas` (Geo Map visualization)
