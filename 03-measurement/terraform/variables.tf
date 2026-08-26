variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
  default     = "eagames-ebc-demo-app"
}

variable "region" {
  description = "The primary Google Cloud region for compute and regional storage"
  type        = string
  default     = "us-central1"
}

variable "bq_location" {
  description = "The location for BigQuery datasets (US multi-region)"
  type        = string
  default     = "US"
}

variable "firestore_location" {
  description = "The location for Cloud Firestore Native database (North America multi-region)"
  type        = string
  default     = "nam5"
}

variable "gemini_location" {
  description = "The Vertex AI / Gemini API location for reasoning models"
  type        = string
  default     = "global"
}

variable "gemini_app_name" {
  description = "The Gemini Enterprise Application identifier"
  type        = string
  default     = "eagames-ebc-demo-ge-app"
}

variable "gcs_bucket_name" {
  description = "The Google Cloud Storage bucket name for multimodal creative assets"
  type        = string
  default     = "eagames-ebc-demo-app-creative-assets"
}

variable "service_account_id" {
  description = "The account ID of the dedicated measurement service account"
  type        = string
  default     = "ea-measurement-sa"
}

variable "backend_image" {
  description = "Container image URL for the FastAPI backend service"
  type        = string
  default     = "us-central1-docker.pkg.dev/eagames-ebc-demo-app/ea-measurement-docker/backend:latest"
}

variable "frontend_image" {
  description = "Container image URL for the Next.js frontend service"
  type        = string
  default     = "us-central1-docker.pkg.dev/eagames-ebc-demo-app/ea-measurement-docker/frontend:latest"
}

variable "agents_image" {
  description = "Container image URL for the ADK multi-agent runtime service"
  type        = string
  default     = "us-central1-docker.pkg.dev/eagames-ebc-demo-app/ea-measurement-docker/agents:latest"
}

variable "environment" {
  description = "Deployment environment name (e.g., development, staging, production)"
  type        = string
  default     = "production"
}

variable "deploy_version" {
  description = "Unique deployment version or timestamp to trigger rolling updates on Cloud Run"
  type        = string
  default     = "v1"
}
