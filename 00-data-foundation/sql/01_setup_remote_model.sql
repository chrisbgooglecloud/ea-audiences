-- ==============================================================================
-- 01: Setup BigQuery Vertex AI Remote Model Registration
-- Uses gemini-3.7-flash endpoint via vertex-ai-connection
-- ==============================================================================

-- 1. Ensure target dataset exists
CREATE SCHEMA IF NOT EXISTS `ea_measurement`
OPTIONS (
  location = 'US',
  description = 'EA Measurement Engine MLOps & Attribution Data Warehouse'
);

-- 2. Register Remote Model using the Terraform-created connection
CREATE OR REPLACE MODEL `ea_measurement.gemini_flash_model`
REMOTE WITH CONNECTION `projects/eagames-ebc-demo-app/locations/us/connections/vertex-ai-connection`
OPTIONS (
  endpoint = 'gemini-3.7-flash'
);
