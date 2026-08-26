# Cloud Run Service 1: Python FastAPI Backend Microservices
resource "google_cloud_run_v2_service" "backend" {
  name                 = "ea-measurement-backend"
  location             = var.region
  project              = var.project_id
  ingress              = "INGRESS_TRAFFIC_ALL"
  deletion_protection  = false
  invoker_iam_disabled = true

  template {
    service_account = google_service_account.ea_measurement_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      image = var.backend_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
      }

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_CLOUD_LOCATION"
        value = var.region
      }
      env {
        name  = "GEMINI_LOCATION"
        value = var.gemini_location
      }
      env {
        name  = "GEMINI_APP_NAME"
        value = var.gemini_app_name
      }
      env {
        name  = "GEMINI_MODEL_HEAVY"
        value = "gemini-3.7-flash"
      }
      env {
        name  = "FIRESTORE_DATABASE"
        value = google_firestore_database.default.name
      }
      env {
        name  = "BIGQUERY_DATASET"
        value = google_bigquery_dataset.ea_measurement.dataset_id
      }
      env {
        name  = "GCS_CREATIVE_BUCKET"
        value = google_storage_bucket.creative_assets.name
      }
      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name  = "DEPLOY_VERSION"
        value = var.deploy_version
      }
    }
  }

  depends_on = [
    google_project_service.enabled_apis,
    google_project_iam_member.sa_roles
  ]
}

# Cloud Run Service 2: Next.js Executive Dashboard Frontend
resource "google_cloud_run_v2_service" "frontend" {
  name                 = "ea-measurement-frontend"
  location             = var.region
  project              = var.project_id
  ingress              = "INGRESS_TRAFFIC_ALL"
  deletion_protection  = false
  invoker_iam_disabled = true

  template {
    service_account = google_service_account.ea_measurement_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = var.frontend_image

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "2Gi"
        }
      }

      env {
        name  = "NEXT_PUBLIC_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
      env {
        name  = "BACKEND_API_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
      env {
        name  = "NEXT_PUBLIC_APP_PASSWORD"
        value = "ea+google=awesome"
      }
      env {
        name  = "NEXT_PUBLIC_FIRESTORE_DATABASE"
        value = google_firestore_database.default.name
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "DEPLOY_VERSION"
        value = var.deploy_version
      }
    }
  }

  depends_on = [
    google_project_service.enabled_apis,
    google_project_iam_member.sa_roles
  ]
}

# Cloud Run Service 3: ADK Multi-Agent Server (Tagging, Analytics, Media Buying, Persona)
resource "google_cloud_run_v2_service" "agents" {
  name                 = "ea-measurement-agents"
  location             = var.region
  project              = var.project_id
  ingress              = "INGRESS_TRAFFIC_ALL"
  deletion_protection  = false
  invoker_iam_disabled = true

  template {
    service_account = google_service_account.ea_measurement_sa.email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      image = var.agents_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
      }

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GEMINI_LOCATION"
        value = var.gemini_location
      }
      env {
        name  = "GEMINI_APP_NAME"
        value = var.gemini_app_name
      }
      env {
        name  = "BACKEND_URL"
        value = google_cloud_run_v2_service.backend.uri
      }
      env {
        name  = "FIRESTORE_DATABASE"
        value = google_firestore_database.default.name
      }
      env {
        name  = "BIGQUERY_DATASET"
        value = google_bigquery_dataset.ea_measurement.dataset_id
      }
      env {
        name  = "GCS_CREATIVE_BUCKET"
        value = google_storage_bucket.creative_assets.name
      }
      env {
        name  = "DEPLOY_VERSION"
        value = var.deploy_version
      }
    }
  }

  depends_on = [
    google_project_service.enabled_apis,
    google_project_iam_member.sa_roles
  ]
}
