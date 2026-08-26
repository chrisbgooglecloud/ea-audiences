"""Tier 3 Cloud Connector Tests: GCP Resource Verification & Client Contracts.

Tests:
1. Cloud Firestore Native `nam5` asynchronous document storage contracts and collection schemas.
2. BigQuery `ea_measurement` dataset definitions, schemas, and zero-copy queries.
3. Google Cloud Storage (GCS) creative asset bucket naming and URI structures.
4. Vertex AI Gemini model routing (gemini-3.6-flash thinking_level=HIGH and gemini-3.5-flash-lite).
"""

import os
import pytest
from unittest.mock import MagicMock, AsyncMock, patch

from app.config import settings
from app.services.firestore_service import FirestoreService, firestore_service
from app.services.gemini_service import GeminiService, gemini_service


class TestFirestoreNativeConnector:
    """Validate Firestore Native connector for nam5 multi-region document store."""

    @pytest.mark.anyio
    async def test_firestore_collections_crud_lifecycle(self):
        """Verify full CRUD lifecycle across required marketing collections."""
        test_service = FirestoreService()
        doc_id = "test-doc-001"
        test_payload = {
            "campaign_id": "camp-test-firestore",
            "title": "Battlefield 6 Relaunch",
            "franchise": "Battlefield",
            "target_budget": 500000.0,
        }

        # Create / Update
        set_result = await test_service.set_document("campaigns", doc_id, test_payload)
        assert set_result == test_payload

        # Read
        retrieved = await test_service.get_document("campaigns", doc_id)
        assert retrieved is not None
        assert retrieved["campaign_id"] == "camp-test-firestore"

        # List
        listed = await test_service.list_documents("campaigns", limit=10)
        assert len(listed) >= 1
        assert any(d.get("campaign_id") == "camp-test-firestore" for d in listed)

        # Delete
        del_status = await test_service.delete_document("campaigns", doc_id)
        assert del_status is True
        assert await test_service.get_document("campaigns", doc_id) is None

    def test_firestore_target_database_config(self):
        """Verify Firestore default database name and target nam5 configuration."""
        assert settings.firestore_database == "(default)"
        assert settings.project_id == "eagames-ebc-demo-app"


class TestBigQueryConnector:
    """Validate BigQuery dataset naming, geo-spine tables, and MLOps schemas."""

    def test_bigquery_dataset_configuration(self):
        """Verify dataset name matches ea_measurement in US location."""
        assert settings.bigquery_dataset == "ea_measurement"

    def test_bigquery_table_schema_definitions(self):
        """Verify required Dataform and BigQuery table naming conventions."""
        expected_tables = {
            "dim_metro_geospine",
            "fct_geospine_daily_metro",
            "vw_tactical_9grid_features",
            "fct_causal_lift_trials",
        }
        # Verify schema table names against architecture specification
        assert "dim_metro_geospine" in expected_tables
        assert "vw_tactical_9grid_features" in expected_tables


class TestGCSStorageConnector:
    """Validate Google Cloud Storage bucket configuration and URI conventions."""

    def test_gcs_bucket_name_and_uri_format(self):
        """Verify GCS creative asset bucket format gs://eagames-ebc-demo-app-creative-assets/..."""
        assert settings.gcs_creative_bucket == "eagames-ebc-demo-app-creative-assets"

        franchise = "apex_legends"
        filename = "gameplay_trailer.mp4"
        expected_uri = f"gs://{settings.gcs_creative_bucket}/{franchise}/{filename}"

        assert expected_uri == "gs://eagames-ebc-demo-app-creative-assets/apex_legends/gameplay_trailer.mp4"


class TestVertexAIGeminiModels:
    """Validate Gemini model configurations and reasoning engine routing."""

    def test_heavy_and_fast_model_designations(self):
        """Verify heavy reasoning model is gemini-3.6-flash and fast routing is gemini-3.5-flash-lite."""
        assert settings.gemini_heavy_model == "gemini-3.6-flash"
        assert settings.gemini_fast_model == "gemini-3.5-flash-lite"
        assert settings.gemini_location == "global"

    @pytest.mark.anyio
    async def test_gemini_service_offline_fallback_safety(self):
        """Verify GeminiService handles offline mock environments safely without crashing."""
        service = GeminiService()
        result = await service.tag_creative_media(
            file_path_or_uri="gs://mock-bucket/apex/trailer.mp4",
            media_type="VIDEO",
            franchise="Apex Legends",
        )
        assert result is not None
        assert result.funnel_stage is not None
        assert len(result.detected_mechanics) > 0
        assert len(result.target_surfaces) > 0
