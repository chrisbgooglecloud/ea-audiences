#!/bin/bash

# Exit on any error
set -e

# Auto-detect compatible Python version for gcloud (requires Python 3.10-3.14)
if [ -z "$CLOUDSDK_PYTHON" ]; then
    for py_bin in "/opt/homebrew/bin/python3.11" "/opt/homebrew/bin/python3.14" "/usr/local/bin/python3" "/usr/bin/python3" "python3" "python"; do
        if command -v "$py_bin" &> /dev/null; then
            PY_VER=$("$py_bin" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)
            if [[ "$PY_VER" =~ ^3\.(10|11|12|13|14)$ ]]; then
                export CLOUDSDK_PYTHON=$(command -v "$py_bin")
                break
            fi
        fi
    done
fi

# ANSI Color Codes for Premium CLI Aesthetics
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

clear
echo -e "${BLUE}${BOLD}===================================================================="
echo -e "      ☁️   AI Lab GCP Project Setup & Deployment Wizard   ☁️"
echo -e "====================================================================${NC}"
echo -e "This wizard will help you configure a new Google Cloud Project,"
echo -e "tailor the branding context, and deploy the application to Cloud Run."
echo ""
echo -e "📋 Prerequisites to have ready:"
echo -e "  • GCP Billing Account Access: Google account credentials with permissions to list/link billing accounts."
echo -e "  • Project ID: A unique project identifier to use/create."
echo -e "  • Customer Name: The brand name to deploy the application for (e.g., StateFarm)."
echo -e "  • Target Region: Preferred GCP region for deployment (e.g., us-central1)."
echo ""

#-------------------------------------------------------------------
# Phase A: Check gcloud authentication
#-------------------------------------------------------------------
echo -e "${BLUE}${BOLD}[Phase A/E] Verifying Google Cloud CLI Authentication...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}${BOLD}❌ Google Cloud SDK (gcloud) is not installed!${NC}"
    echo -e "Please install it before running this script: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verify user auth
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
if [ -z "$ACTIVE_ACCOUNT" ]; then
    echo -e "${YELLOW}⚠️ No active Google Cloud account detected. Launching authentication login...${NC}"
    gcloud auth login
else
    echo -e "${GREEN}✓ Authenticated with Google Cloud as: ${BOLD}$ACTIVE_ACCOUNT${NC}"
    
    # Check if the active account has access to any billing accounts
    echo "Checking billing access for $ACTIVE_ACCOUNT..."
    BILLING_ACCOUNTS=$(gcloud billing accounts list --format="value(name)" 2>/dev/null || true)
    if [ -z "$BILLING_ACCOUNTS" ]; then
        NUM_ACCOUNTS=0
    else
        NUM_ACCOUNTS=$(echo "$BILLING_ACCOUNTS" | grep -v '^$' | wc -l | tr -d ' ')
    fi
    
    if [ "$NUM_ACCOUNTS" -eq 0 ]; then
        echo -e "${YELLOW}⚠️ The active account ($ACTIVE_ACCOUNT) does not have access to any billing accounts.${NC}"
        echo -e "Billing administration privileges are required to link projects and enable paid services."
        read -p "Do you want to switch to a different Google Cloud account now? (y/n) [n]: " SWITCH_ACCOUNT
        if [[ "$SWITCH_ACCOUNT" =~ ^[Yy]$ ]]; then
            gcloud auth login
            # Re-read active account
            ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
            echo -e "${GREEN}✓ Switched to account: ${BOLD}$ACTIVE_ACCOUNT${NC}"
        fi
    fi
fi

# Verify Application Default Credentials (ADC)
echo "Checking Application Default Credentials..."
if ! gcloud auth application-default print-access-token &> /dev/null; then
    echo -e "${YELLOW}⚠️ Application Default Credentials (ADC) missing or expired.${NC}"
    echo -e "Launching login for application default credentials..."
    gcloud auth application-default login
else
    echo -e "${GREEN}✓ Application Default Credentials verified.${NC}"
fi
echo ""

#-------------------------------------------------------------------
# Phase B: Prompt for Configuration Inputs
#-------------------------------------------------------------------
echo -e "${BLUE}${BOLD}[Phase B/E] Configuration Settings${NC}"

# Ask for Project ID
read -p "Enter Google Cloud Project ID: " PROJECT_ID
while [ -z "$PROJECT_ID" ]; do
    echo -e "${RED}Project ID cannot be empty.${NC}"
    read -p "Enter Google Cloud Project ID: " PROJECT_ID
done

# Ask for Customer / Company Name
read -p "Enter Customer / Company Name (e.g., StateFarm): " CUSTOMER_NAME
while [ -z "$CUSTOMER_NAME" ]; do
    echo -e "${RED}Customer/Company Name cannot be empty.${NC}"
    read -p "Enter Customer / Company Name: " CUSTOMER_NAME
done

# Default to Keyless Google Cloud Vertex AI
GEMINI_API_KEY="VERTEX_AI_FALLBACK"

# Ask for Region
echo -e "${YELLOW}Common US Regions for Cloud Run / Vertex AI:${NC}"
echo -e "  • us-central1 (Iowa - Default)"
echo -e "  • us-east1    (South Carolina)"
echo -e "  • us-east4    (N. Virginia)"
echo -e "  • us-west1    (Oregon)"
echo -e "  • us-west2    (Los Angeles)"
read -p "Enter deployment region [us-central1]: " REGION
if [ -z "$REGION" ]; then
    REGION="us-central1"
fi
echo ""

# Generate service name and bucket name slugs
SERVICE_NAME=$(echo "$CUSTOMER_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\{1,\}/-/g' | sed 's/^-//' | sed 's/-$//')-app
GCS_BUCKET_NAME="${PROJECT_ID}-ailab-gcs"

echo -e "${MAGENTA}${BOLD}Summary of Actions:${NC}"
echo -e "  - Target Project ID:   ${BOLD}$PROJECT_ID${NC}"
echo -e "  - Customer Name:       ${BOLD}$CUSTOMER_NAME${NC}"
echo -e "  - Target Service Name: ${BOLD}$SERVICE_NAME${NC}"
echo -e "  - GCS Bucket Name:     ${BOLD}$GCS_BUCKET_NAME${NC}"
echo -e "  - Deployment Region:   ${BOLD}$REGION${NC}"
echo ""
read -p "Press Enter to proceed or Ctrl+C to abort..."
echo ""

#-------------------------------------------------------------------
# Phase C: Google Cloud Platform Setup
#-------------------------------------------------------------------
echo -e "${BLUE}${BOLD}[Phase C/E] Setting up Google Cloud Resources...${NC}"

# Check if project exists, create if not
if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
    echo -e "${YELLOW}Project '$PROJECT_ID' not found. Creating project...${NC}"
    gcloud projects create "$PROJECT_ID"
    echo -e "${GREEN}✓ Created project '$PROJECT_ID'.${NC}"
else
    echo -e "${GREEN}✓ Using existing project '$PROJECT_ID'.${NC}"
fi

# Set active project
gcloud config set project "$PROJECT_ID"

# Link Billing Account (Required for enabling APIs)
echo "Verifying billing status for project '$PROJECT_ID'..."
BILLING_LINKED=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingEnabled)" 2>/dev/null || echo "false")
BILLING_LINKED_LOWER=$(echo "$BILLING_LINKED" | tr '[:upper:]' '[:lower:]')

if [ "$BILLING_LINKED_LOWER" != "true" ]; then
    echo -e "${YELLOW}⚠️ Project '$PROJECT_ID' does not have billing enabled.${NC}"
    
    # Try to find active billing accounts
    BILLING_ACCOUNTS=$(gcloud billing accounts list --format="value(name)" 2>/dev/null || true)
    if [ -z "$BILLING_ACCOUNTS" ]; then
        NUM_ACCOUNTS=0
    else
        NUM_ACCOUNTS=$(echo "$BILLING_ACCOUNTS" | grep -v '^$' | wc -l | tr -d ' ')
    fi
    
    if [ "$NUM_ACCOUNTS" -gt 0 ]; then
        if [ "$NUM_ACCOUNTS" -eq 1 ]; then
            ACCOUNT_ID=$(echo "$BILLING_ACCOUNTS" | head -n 1)
            echo "Found one billing account: $ACCOUNT_ID. Linking it automatically..."
            gcloud billing projects link "$PROJECT_ID" --billing-account="$ACCOUNT_ID"
            echo -e "${GREEN}✓ Billing enabled successfully.${NC}"
        else
            echo "Available Billing Accounts:"
            i=1
            echo "$BILLING_ACCOUNTS" | while read -r line; do
                if [ -n "$line" ]; then
                    echo "  [$i] $line"
                    i=$((i+1))
                fi
            done
            
            read -p "Select a billing account number to link: " SELECTION
            SELECTED_ACCOUNT=$(echo "$BILLING_ACCOUNTS" | sed -n "${SELECTION}p")
            if [ -n "$SELECTED_ACCOUNT" ]; then
                gcloud billing projects link "$PROJECT_ID" --billing-account="$SELECTED_ACCOUNT"
                echo -e "${GREEN}✓ Billing enabled successfully.${NC}"
            else
                echo -e "${RED}Invalid selection. Skipping automatic linkage...${NC}"
            fi
        fi
    fi
    
    # Check again
    BILLING_LINKED=$(gcloud billing projects describe "$PROJECT_ID" --format="value(billingEnabled)" 2>/dev/null || echo "false")
    BILLING_LINKED_LOWER=$(echo "$BILLING_LINKED" | tr '[:upper:]' '[:lower:]')
    if [ "$BILLING_LINKED_LOWER" != "true" ]; then
        echo -e "${YELLOW}👉 Please link a billing account to your project in the GCP Console:${NC}"
        echo -e "${BLUE}${BOLD}https://console.cloud.google.com/billing/projects?project=$PROJECT_ID${NC}"
        echo ""
        read -p "Once linked, press Enter here to resume the setup..."
    fi
fi


# Enable APIs
echo "Enabling required APIs (Vertex AI, Cloud Run, Cloud Build, GCS, Secret Manager)..."
gcloud services enable aiplatform.googleapis.com run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com storage.googleapis.com secretmanager.googleapis.com
echo -e "${GREEN}✓ All APIs successfully enabled.${NC}"
echo "Waiting 10 seconds for API activations to propagate..."
sleep 10
# Disable organizational constraint blocking unauthenticated Cloud Run services
echo "Ensuring unauthenticated Cloud Run invocations are allowed by organization policies..."
gcloud resource-manager org-policies disable-enforce constraints/run.allowedUnauthenticated --project="$PROJECT_ID" &> /dev/null || true

# Create GCS Bucket
echo "Creating GCS Bucket: gs://${GCS_BUCKET_NAME}..."
if ! gcloud storage buckets describe "gs://${GCS_BUCKET_NAME}" &> /dev/null; then
    gcloud storage buckets create "gs://${GCS_BUCKET_NAME}" --location="$REGION"
    echo -e "${GREEN}✓ Created GCS Bucket: gs://${GCS_BUCKET_NAME}${NC}"
else
    echo -e "${GREEN}✓ GCS Bucket gs://${GCS_BUCKET_NAME} already exists.${NC}"
fi

# Create Artifact Registry Repository for Cloud Run builds
echo "Ensuring Artifact Registry Docker repository exists..."
if ! gcloud artifacts repositories describe cloud-run-source-deploy --location="$REGION" &>/dev/null; then
    echo "Creating Artifact Registry repository 'cloud-run-source-deploy'..."
    
    MAX_RETRIES=6
    RETRY_COUNT=0
    SUCCESS=false
    
    # Temporarily disable exit-on-error to handle retry logic
    set +e
    while [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; do
        # Capture stderr and stdout
        OUTPUT=$(gcloud artifacts repositories create cloud-run-source-deploy \
            --repository-format=docker \
            --location="$REGION" \
            --description="Docker repository for Cloud Run source deployments" 2>&1)
        
        if [ $? -eq 0 ]; then
            SUCCESS=true
            break
        else
            RETRY_COUNT=$((RETRY_COUNT+1))
            echo -e "${YELLOW}API propagation is still in progress. Retrying in 10 seconds... (Attempt $RETRY_COUNT/$MAX_RETRIES)${NC}"
            sleep 10
        fi
    done
    set -e # Re-enable exit-on-error
    
    if [ "$SUCCESS" != "true" ]; then
        echo -e "${RED}❌ Failed to create Artifact Registry repository after multiple attempts.${NC}"
        echo -e "${RED}Error output was: $OUTPUT${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Created Artifact Registry repository.${NC}"
else
    echo -e "${GREEN}✓ Artifact Registry repository already exists.${NC}"
fi

# Setup Secret Manager
echo "Uploading GEMINI_API_KEY to Secret Manager..."
if ! gcloud secrets describe GEMINI_API_KEY &> /dev/null; then
    gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
fi
echo -n "$GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
echo -e "${GREEN}✓ Gemini API Key successfully updated in Secret Manager.${NC}"

# Grant IAM access roles to Cloud Run default compute service account
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Granting Secret Manager access to default Compute service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor" &> /dev/null
echo -e "${GREEN}✓ Granted Secret Manager access to: $COMPUTE_SA${NC}"

echo "Granting Vertex AI User access to default Compute service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/aiplatform.user" &> /dev/null
echo -e "${GREEN}✓ Granted Vertex AI User access to: $COMPUTE_SA${NC}"

echo "Granting Storage Admin access to default Compute service account (required for Cloud Run source builds)..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/storage.admin" &> /dev/null
echo -e "${GREEN}✓ Granted Storage Admin access to: $COMPUTE_SA${NC}"

echo "Granting Logs Writer access to default Compute service account (required for Cloud Build logs)..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/logging.logWriter" &> /dev/null
echo -e "${GREEN}✓ Granted Logs Writer access to: $COMPUTE_SA${NC}"

CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
echo "Granting Artifact Registry Writer access to default Compute service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/artifactregistry.writer" &> /dev/null
echo -e "${GREEN}✓ Granted Artifact Registry Writer access to: $COMPUTE_SA${NC}"

echo "Granting Artifact Registry Writer access to Cloud Build service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUDBUILD_SA}" \
    --role="roles/artifactregistry.writer" &> /dev/null
echo -e "${GREEN}✓ Granted Artifact Registry Writer access to: $CLOUDBUILD_SA${NC}"
echo ""

#-------------------------------------------------------------------
# Phase D: Modifying Local Codebase
#-------------------------------------------------------------------
echo -e "${BLUE}${BOLD}[Phase D/E] Tailoring Codebase for '$CUSTOMER_NAME'...${NC}"

# Modify config.ts
if [ -f "config.ts" ]; then
    perl -pi -e 's/companyName:\s*".*"/companyName: "'"$CUSTOMER_NAME"'"/g' config.ts
    echo -e "${GREEN}✓ Updated companyName in config.ts to: $CUSTOMER_NAME${NC}"
else
    echo -e "${RED}⚠️ config.ts not found. Skipping...${NC}"
fi

# Modify public/data/configuration/app_config.json
if [ -f "public/data/configuration/app_config.json" ]; then
    perl -pi -e 's/"companyName":\s*".*"/"companyName": "'"$CUSTOMER_NAME"'"/g' public/data/configuration/app_config.json
    echo -e "${GREEN}✓ Updated companyName in public/data/configuration/app_config.json${NC}"
else
    echo -e "${RED}⚠️ public/data/configuration/app_config.json not found. Skipping...${NC}"
fi

# Modify cloud_run.sh
if [ -f "cloud_run.sh" ]; then
    perl -pi -e 's/SERVICE_NAME=".*"/SERVICE_NAME="'"$SERVICE_NAME"'"/g' cloud_run.sh
    perl -pi -e 's/REGION=".*"/REGION="'"$REGION"'"/g' cloud_run.sh
    echo -e "${GREEN}✓ Updated SERVICE_NAME in cloud_run.sh to: $SERVICE_NAME${NC}"
else
    echo -e "${RED}⚠️ cloud_run.sh not found. Skipping...${NC}"
fi
echo ""

#-------------------------------------------------------------------
# Phase E: Deploying Application
#-------------------------------------------------------------------
echo -e "${BLUE}${BOLD}[Phase E/E] Triggering Cloud Run Deployment...${NC}"
export GCS_BUCKET_NAME="$GCS_BUCKET_NAME"

if ./cloud_run.sh; then
    echo ""
    echo -e "${GREEN}${BOLD}===================================================================="
    echo -e "      🚀   Deployment Completed Successfully!   🚀"
    echo -e "====================================================================${NC}"
    echo -e "Your application has been deployed and is running in Cloud Run."
    echo -e "The active GCS bucket for data persistence is: ${BOLD}$GCS_BUCKET_NAME${NC}"
    echo -e "===================================================================="
else
    echo -e "${RED}${BOLD}❌ Deployment failed. Please verify the Cloud Run / Cloud Build logs in the GCP console.${NC}"
    exit 1
fi
