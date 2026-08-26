# Google Cloud Storage bucket for multimodal video/image creative assets
resource "google_storage_bucket" "creative_assets" {
  name                        = var.gcs_bucket_name
  location                    = var.region
  project                     = var.project_id
  force_destroy               = false
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age        = 365
      with_state = "ANY"
    }
  }

  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age        = 60
      with_state = "LIVE"
    }
  }

  depends_on = [google_project_service.enabled_apis]
}
