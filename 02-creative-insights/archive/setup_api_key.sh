#!/bin/bash

echo "Setting up Gemini API Key in Google Cloud Secret Manager..."

# Check if the secret already exists
if ! gcloud secrets describe GEMINI_API_KEY > /dev/null 2>&1; then
  echo "Creating secret 'GEMINI_API_KEY'..."
  gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
else
  echo "Secret 'GEMINI_API_KEY' already exists."
fi

echo "Please enter your Gemini API Key:"
read -s API_KEY

if [ -z "$API_KEY" ]; then
  echo "API Key cannot be empty."
  exit 1
fi

# Add the secret version
echo -n "$API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

echo "API Key stored in Secret Manager."
