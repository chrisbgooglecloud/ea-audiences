/**
 * Google Cloud and Application Configuration with sensible fallbacks.
 */

export const GCP_CONFIG = {
  projectId: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "agent-engine-468716",
  region: process.env.GCP_REGION || "us-central1",
  spannerInstanceId: process.env.SPANNER_INSTANCE_ID || "bravoverse-spanner",
  spannerDatabaseId: process.env.SPANNER_DATABASE_ID || "twok_graph_db",
  bqDatasetId: process.env.BQ_DATASET_ID || "twok_measurement",
  gcsBucketName: process.env.GCS_BUCKET_NAME || "twok-ebc-marketing-agent-engine-468716",
  vertexModel: process.env.VERTEX_MODEL || "gemini-3.5-flash-lite",
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-004",
  adkAgentServiceUrl: process.env.ADK_AGENT_SERVICE_URL || "http://localhost:8080",
};
