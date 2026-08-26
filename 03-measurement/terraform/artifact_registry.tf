# Artifact Registry Repository for Docker container images
resource "google_artifact_registry_repository" "ea_measurement_docker" {
  provider      = google-beta
  project       = var.project_id
  location      = var.region
  repository_id = "ea-measurement-docker"
  description   = "Docker repository for EA Creative Intelligence & Agentic Measurement Engine microservices"
  format        = "DOCKER"

  labels = {
    env       = var.environment
    managed_by = "terraform"
  }

  depends_on = [google_project_service.enabled_apis]
}
