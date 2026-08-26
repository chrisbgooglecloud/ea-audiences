# Dedicated Service Account for EA Creative Intelligence & Measurement Engine
resource "google_service_account" "ea_measurement_sa" {
  account_id   = var.service_account_id
  display_name = "EA Creative Intelligence & Agentic Measurement Engine Service Account"
  description  = "Dedicated service account for backend services, ADK multi-agent fleet, and Dataform pipelines"
  project      = var.project_id
}

locals {
  service_account_roles = toset([
    "roles/bigquery.admin",
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/aiplatform.user",
    "roles/run.invoker",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/secretmanager.secretAccessor"
  ])

  cloudbuild_sa_roles = toset([
    "roles/cloudbuild.builds.builder",
    "roles/storage.objectAdmin",
    "roles/artifactregistry.writer",
    "roles/logging.logWriter"
  ])
}

resource "google_project_iam_member" "sa_roles" {
  for_each = local.service_account_roles
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.ea_measurement_sa.email}"

  depends_on = [
    google_service_account.ea_measurement_sa,
    google_project_service.enabled_apis
  ]
}

data "google_project" "current" {
  project_id = var.project_id
}

resource "google_project_iam_member" "compute_sa_roles" {
  for_each = local.cloudbuild_sa_roles
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${data.google_project.current.number}-compute@developer.gserviceaccount.com"

  depends_on = [google_project_service.enabled_apis]
}
