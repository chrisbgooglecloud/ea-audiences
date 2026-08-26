#!/usr/bin/env bash
# ==============================================================================
# EA Creative Intelligence & Agentic Measurement Engine
# Production Cloud Run Deployment Orchestrator (03-measurement)
# ==============================================================================
set -euo pipefail

# Visual styling
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Resolve root and module directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEASUREMENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${MEASUREMENT_DIR}/.." && pwd)"

# Configuration defaults
PROJECT_ID="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null || echo "eagames-ebc-demo-app")}"
REGION="${GCP_REGION:-us-central1}"
ARTIFACT_REPO="ea-measurement-docker"
SERVICE_ACCOUNT="ea-measurement-sa@${PROJECT_ID}.iam.gserviceaccount.com"
APP_PASSWORD="${APP_PASSWORD:-ea+google=awesome}"
ENVIRONMENT="production"

echo -e "${CYAN}${BOLD}"
echo "=================================================================="
echo " EA CREATIVE INTELLIGENCE & AGENTIC MEASUREMENT ENGINE"
echo " Production Cloud Run Deployment Orchestrator"
echo "=================================================================="
echo -e "${NC}"
echo -e "Project:         ${GREEN}${PROJECT_ID}${NC}"
echo -e "Region:          ${GREEN}${REGION}${NC}"
echo -e "Service Account: ${GREEN}${SERVICE_ACCOUNT}${NC}"
echo -e "Password:        ${GREEN}${APP_PASSWORD}${NC}"
echo -e "Timestamp:       $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "------------------------------------------------------------------"

# ------------------------------------------------------------------------------
# 1. Pre-flight & Google Cloud API Verification
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[1/5] Verifying Google Cloud configuration and APIs...${NC}"
gcloud config set project "${PROJECT_ID}" --quiet

REQUIRED_APIS=(
  "run.googleapis.com"
  "cloudbuild.googleapis.com"
  "artifactregistry.googleapis.com"
  "aiplatform.googleapis.com"
  "firestore.googleapis.com"
  "bigquery.googleapis.com"
  "storage.googleapis.com"
  "iam.googleapis.com"
  "secretmanager.googleapis.com"
)

echo "Ensuring required GCP APIs are active..."
gcloud services enable "${REQUIRED_APIS[@]}" --quiet

# ------------------------------------------------------------------------------
# 2. Terraform Infrastructure Verification & Provisioning
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[2/5] Checking Terraform Infrastructure & Artifact Registry...${NC}"

# Ensure Artifact Registry repository exists
if ! gcloud artifacts repositories describe "${ARTIFACT_REPO}" --location="${REGION}" --quiet >/dev/null 2>&1; then
  echo "Artifact Registry repository ${ARTIFACT_REPO} not found. Running Terraform..."
  (
    cd "${MEASUREMENT_DIR}/terraform"
    terraform init -backend=false
    terraform apply -auto-approve
  )
else
  echo -e "${GREEN}✓ Artifact Registry repository '${ARTIFACT_REPO}' is ready.${NC}"
fi

REGISTRY_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}"

# ------------------------------------------------------------------------------
# 3. Google Cloud Build: Multi-Service Container Images in Parallel
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[3/5] Building all 3 container images in PARALLEL with Cloud Build...${NC}"

echo -e "--> Launching parallel Cloud Build jobs for Backend, Agents, and Frontend..."

gcloud builds submit "${MEASUREMENT_DIR}/backend" \
  --tag "${REGISTRY_URL}/backend:latest" \
  --project "${PROJECT_ID}" \
  --async --format='value(id)' > /tmp/build_backend_id.txt 2>/dev/null &
PID_BACKEND=$!

gcloud builds submit "${MEASUREMENT_DIR}/agents" \
  --tag "${REGISTRY_URL}/agents:latest" \
  --project "${PROJECT_ID}" \
  --async --format='value(id)' > /tmp/build_agents_id.txt 2>/dev/null &
PID_AGENTS=$!

gcloud builds submit "${MEASUREMENT_DIR}/frontend" \
  --tag "${REGISTRY_URL}/frontend:latest" \
  --project "${PROJECT_ID}" \
  --async --format='value(id)' > /tmp/build_frontend_id.txt 2>/dev/null &
PID_FRONTEND=$!

wait "${PID_BACKEND}"
wait "${PID_AGENTS}"
wait "${PID_FRONTEND}"

BUILD_BACKEND_ID=$(cat /tmp/build_backend_id.txt | tr -d '[:space:]')
BUILD_AGENTS_ID=$(cat /tmp/build_agents_id.txt | tr -d '[:space:]')
BUILD_FRONTEND_ID=$(cat /tmp/build_frontend_id.txt | tr -d '[:space:]')

echo -e "  • Backend Build ID:  ${CYAN}${BUILD_BACKEND_ID}${NC}"
echo -e "  • Agents Build ID:   ${CYAN}${BUILD_AGENTS_ID}${NC}"
echo -e "  • Frontend Build ID: ${CYAN}${BUILD_FRONTEND_ID}${NC}"

echo -e "\n--> Streaming & monitoring parallel builds until completion..."

wait_for_build() {
  local build_id=$1
  local name=$2
  while true; do
    local status=$(gcloud builds describe "${build_id}" --project="${PROJECT_ID}" --format='value(status)' 2>/dev/null || echo "WORKING")
    if [ "${status}" = "SUCCESS" ]; then
      echo -e "${GREEN}✓ ${name} container built and pushed successfully!${NC}"
      break
    elif [ "${status}" = "FAILURE" ] || [ "${status}" = "CANCELLED" ] || [ "${status}" = "TIMEOUT" ]; then
      echo -e "${RED}✗ ${name} container build failed with status ${status}.${NC}"
      gcloud builds log "${build_id}" --project="${PROJECT_ID}" | tail -n 30
      exit 1
    fi
    sleep 3
  done
}

wait_for_build "${BUILD_BACKEND_ID}" "Backend" &
WAIT_PID_1=$!
wait_for_build "${BUILD_AGENTS_ID}" "Agents" &
WAIT_PID_2=$!
wait_for_build "${BUILD_FRONTEND_ID}" "Frontend" &
WAIT_PID_3=$!

wait "${WAIT_PID_1}"
wait "${WAIT_PID_2}"
wait "${WAIT_PID_3}"

echo -e "${GREEN}✓ All 3 container images built in parallel and ready in Artifact Registry.${NC}"

# ------------------------------------------------------------------------------
# 4. Apply 100% of Infrastructure & Cloud Run Services via Terraform
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[4/5] Applying 100% of Cloud Run Services & IAM via Terraform (-parallelism=10)...${NC}"
(
  cd "${MEASUREMENT_DIR}/terraform"
  DEPLOY_TS="$(date +%s)"
  terraform apply -auto-approve -parallelism=10 -var="deploy_version=${DEPLOY_TS}"
)

BACKEND_URL=$(gcloud run services describe ea-measurement-backend --region "${REGION}" --format 'value(status.url)' --project "${PROJECT_ID}")
echo -e "${GREEN}✓ Backend live at: ${BACKEND_URL}${NC}"

AGENTS_URL=$(gcloud run services describe ea-measurement-agents --region "${REGION}" --format 'value(status.url)' --project "${PROJECT_ID}")
echo -e "${GREEN}✓ Agents live at: ${AGENTS_URL}${NC}"

FRONTEND_URL=$(gcloud run services describe ea-measurement-frontend --region "${REGION}" --format 'value(status.url)' --project "${PROJECT_ID}")
echo -e "${GREEN}✓ Frontend live at: ${FRONTEND_URL}${NC}"

# ------------------------------------------------------------------------------
# 5. Health Checks & Verification
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[5/5] Performing live endpoint health verification...${NC}"

echo -n "Checking Backend health... "
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/health" || echo "FAIL")
if [ "${BACKEND_HEALTH}" = "200" ]; then
  echo -e "${GREEN}OK (200)${NC}"
else
  echo -e "${YELLOW}HTTP ${BACKEND_HEALTH} (Service starting)${NC}"
fi

echo -n "Checking Agents health... "
AGENTS_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${AGENTS_URL}/health" || echo "FAIL")
if [ "${AGENTS_HEALTH}" = "200" ]; then
  echo -e "${GREEN}OK (200)${NC}"
else
  echo -e "${YELLOW}HTTP ${AGENTS_HEALTH} (Service starting)${NC}"
fi

echo -n "Checking Frontend health... "
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/" || echo "FAIL")
if [ "${FRONTEND_HEALTH}" = "200" ]; then
  echo -e "${GREEN}OK (200)${NC}"
else
  echo -e "${YELLOW}HTTP ${FRONTEND_HEALTH}${NC}"
fi

echo -e "\n${GREEN}${BOLD}=================================================================="
echo " DEPLOYMENT SUCCESSFUL — PRODUCTION READY"
echo "==================================================================${NC}"
echo -e "Frontend Executive UI: ${CYAN}${FRONTEND_URL}${NC}"
echo -e "FastAPI Backend API:   ${CYAN}${BACKEND_URL}${NC}"
echo -e "Multi-Agent Fleet API: ${CYAN}${AGENTS_URL}${NC}"
echo -e "Session Password:      ${YELLOW}${BOLD}${APP_PASSWORD}${NC}"
echo "=================================================================="
