output "project_id" {
  description = "The GCP Project ID"
  value       = var.project_id
}

output "region" {
  description = "The primary Google Cloud region"
  value       = var.region
}

output "creative_assets_bucket_name" {
  description = "The name of the GCS bucket storing multimodal creative assets"
  value       = google_storage_bucket.creative_assets.name
}

output "creative_assets_bucket_url" {
  description = "The gsutil URL of the GCS creative assets bucket"
  value       = google_storage_bucket.creative_assets.url
}

output "firestore_database_name" {
  description = "The name of the Cloud Firestore Native database"
  value       = google_firestore_database.default.name
}

output "bigquery_dataset_id" {
  description = "The BigQuery dataset ID for MLOps and Geo-Spine"
  value       = google_bigquery_dataset.ea_measurement.dataset_id
}

output "vertex_ai_connection_id" {
  description = "BigQuery Vertex AI Remote Connection ID for BQML AI.GENERATE_TABLE"
  value       = google_bigquery_connection.vertex_ai_connection.connection_id
}

output "vertex_ai_connection_sa" {
  description = "Service account associated with the BigQuery Vertex AI connection"
  value       = google_bigquery_connection.vertex_ai_connection.cloud_resource[0].service_account_id
}

output "artifact_registry_repo_id" {
  description = "The Artifact Registry Docker repository ID"
  value       = google_artifact_registry_repository.ea_measurement_docker.repository_id
}

output "artifact_registry_repo_url" {
  description = "The full registry URL for container images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.ea_measurement_docker.repository_id}"
}

output "service_account_email" {
  description = "The email address of the dedicated measurement service account"
  value       = google_service_account.ea_measurement_sa.email
}

output "backend_cloud_run_url" {
  description = "The URL of the deployed FastAPI backend service"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_cloud_run_url" {
  description = "The URL of the deployed Next.js frontend service"
  value       = google_cloud_run_v2_service.frontend.uri
}

output "agents_cloud_run_url" {
  description = "The URL of the deployed ADK multi-agent runtime service"
  value       = google_cloud_run_v2_service.agents.uri
}
