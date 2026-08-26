#!/bin/bash

# ANSI Color Codes for Premium CLI Aesthetics
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

clear
echo -e "${BLUE}${BOLD}==========================================================="
echo -e "        🤖   AI Lab Client Setup & Onboarding Wizard   🤖"
echo -e "===========================================================${NC}"
echo -e "This script will guide you through configuring Google Cloud,"
echo -e "setting up local credentials, and installing dependencies."
echo ""
echo -e "${YELLOW}${BOLD}💡 NOTE: If you encounter permission errors during execution (especially during package installation),${NC}"
echo -e "${YELLOW}${BOLD}please run the script using 'sudo':${NC}"
echo -e "   ${BOLD}sudo ./setup.sh${NC}"
echo ""

#---------------------------------------------------------
# Step 1: Check System Dependencies
#---------------------------------------------------------
echo -e "${BLUE}${BOLD}[Step 1/4] Checking System Dependencies...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}${BOLD}❌ Node.js is not installed!${NC}"
    echo -e "Please download and install Node.js (v18+) from: https://nodejs.org"
    exit 1
else
    NODE_VER=$(node -v)
    echo -e "${GREEN}✓ Node.js is installed (${NODE_VER})${NC}"
fi

# Check NPM
if ! command -v npm &> /dev/null; then
    echo -e "${RED}${BOLD}❌ NPM is not installed!${NC}"
    echo -e "Please install NPM (comes bundled with Node.js)."
    exit 1
else
    NPM_VER=$(npm -v)
    echo -e "${GREEN}✓ NPM is installed (${NPM_VER})${NC}"
fi
echo ""

#---------------------------------------------------------
# Step 2: Google Cloud & Gemini Credentials Setup Guidance
#---------------------------------------------------------
echo -e "${BLUE}${BOLD}[Step 2/4] Google Cloud & Gemini API Setup${NC}"
echo -e "The AI Lab applications rely on the Gemini Models to run intelligence analyses."
echo -e "You can connect in two ways:"
echo -e "  1) ${BOLD}Google AI Studio (API Key)${NC} - Fastest local setup."
echo -e "  2) ${BOLD}Google Cloud Vertex AI (Enterprise)${NC} - Production grade storage & compliance."
echo ""

echo -e "${YELLOW}${BOLD}🔑 Google AI Studio API Key Setup:${NC}"
echo -e "1. Go to Google AI Studio: ${BOLD}https://aistudio.google.com/${NC}"
echo -e "2. Click 'Create API Key' and copy the generated key."
echo ""

echo -e "${YELLOW}${BOLD}☁️ Google Cloud Platform (GCP) Vertex AI Setup:${NC}"
echo -e "If you want to use Vertex AI and Google Cloud Storage (GCS) fallbacks:"
echo -e "1. Create a GCP project."
echo -e "2. Enable the ${BOLD}Vertex AI API${NC} and ${BOLD}Google Cloud Storage API${NC} in the GCP console."
echo -e "3. Install the Google Cloud SDK (gcloud CLI) on your machine."
echo -e "4. Authenticate your local machine by running:"
echo -e "   ${BOLD}gcloud auth application-default login${NC}"
echo -e "   OR create a service account, download the JSON keyfile, and reference it."
echo ""

# Prompt for Gemini API Key
read -p "Enter your GEMINI_API_KEY (leave blank to use GCP Application Default Credentials): " USER_GEMINI_KEY

# Prompt for optional YouTube API Key
echo ""
echo -e "${YELLOW}${BOLD}📺 Optional Video Features Setup:${NC}"
echo -e "The Video Insights panel can dynamically extract and analyze real YouTube comment feeds."
read -p "Enter a YOUTUBE_API_KEY (optional, leave blank to use mock comments): " USER_YT_KEY
echo ""

#---------------------------------------------------------
# Step 3: Generate .env File
#---------------------------------------------------------
echo -e "${BLUE}${BOLD}[Step 3/4] Generating Local .env Configuration...${NC}"

ENV_FILE=".env"

# Create or overwrite the .env file
echo "# Local environment configurations for AI Lab" > $ENV_FILE

if [ -n "$USER_GEMINI_KEY" ]; then
    # Strip quotes if any
    CLEAN_KEY=$(echo "$USER_GEMINI_KEY" | tr -d '"' | tr -d "'")
    echo "GEMINI_API_KEY=\"$CLEAN_KEY\"" >> $ENV_FILE
    echo -e "${GREEN}✓ Saved GEMINI_API_KEY to .env${NC}"
else
    echo -e "${YELLOW}⚠️ No explicit GEMINI_API_KEY entered. The server will fall back to Google Cloud Application Default Credentials.${NC}"
fi

if [ -n "$USER_YT_KEY" ]; then
    CLEAN_YT=$(echo "$USER_YT_KEY" | tr -d '"' | tr -d "'")
    echo "YOUTUBE_API_KEY=\"$CLEAN_YT\"" >> $ENV_FILE
    echo -e "${GREEN}✓ Saved YOUTUBE_API_KEY to .env${NC}"
fi

# Ensure .env is ignored in Git
if [ -f ".gitignore" ]; then
    if ! grep -q "^\.env" .gitignore; then
        echo ".env" >> .gitignore
        echo -e "${GREEN}✓ Added .env to .gitignore${NC}"
    fi
fi
echo ""

#---------------------------------------------------------
# Step 4: Install NPM dependencies
#---------------------------------------------------------
echo -e "${BLUE}${BOLD}[Step 4/4] Installing Node.js Dependencies...${NC}"
echo -e "Running 'npm install' to pull and compile local packages. Please wait..."
echo ""

if npm install; then
    echo -e "${GREEN}${BOLD}✓ All package dependencies installed successfully!${NC}"
else
    echo -e "${RED}${BOLD}❌ Failed to install NPM dependencies. Please check your network connection and run 'npm install' manually.${NC}"
    exit 1
fi
echo ""

#---------------------------------------------------------
# Completion Banner
#---------------------------------------------------------
echo -e "${GREEN}${BOLD}==========================================================="
echo -e "      ✨   AI Lab Configuration Setup Complete!   ✨"
echo -e "===========================================================${NC}"
echo -e "Your environment has been aligned and is ready for execution!"
echo ""
echo -e "To launch your server locally in production mode:"
echo -e "   ${BOLD}./start_local.sh${NC}"
echo ""
echo -e "The app will boot dynamically and become available at: ${BOLD}http://localhost:8080${NC}"
echo -e "==========================================================="
