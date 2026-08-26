#!/usr/bin/env bash
set -e

PROJECT_ID="${GCP_PROJECT_ID:-jamie-bq-test}"
BUCKET_NAME="${GCS_BUCKET_NAME:-ea-audiences-data-${PROJECT_ID}}"
REGION="${GCP_REGION:-us-central1}"

echo "============================================================"
echo "🚀 Initializing Google Cloud Storage Setup"
echo "Project: ${PROJECT_ID}"
echo "Bucket:  gs://${BUCKET_NAME}"
echo "Region:  ${REGION}"
echo "============================================================"

if ! gcloud storage buckets describe "gs://${BUCKET_NAME}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
  echo "⚡ Creating GCS bucket 'gs://${BUCKET_NAME}'..."
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --uniform-bucket-level-access
else
  echo "✅ Bucket 'gs://${BUCKET_NAME}' already exists."
fi

echo "✅ GCS setup complete!"
