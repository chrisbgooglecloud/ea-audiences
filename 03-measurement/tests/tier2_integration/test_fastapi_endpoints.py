"""Tier 2 Integration Tests: FastAPI Endpoints.

Tests:
1. /api/v1/multimodal (upload, tag, list assets, get asset).
2. /api/v1/mlops (210 DMA Geo-Spine, WeatherNext shocks, Trends, Combinatorial Features).
3. /api/v1/meridian (Bayesian prior calibration, Equimarginal solver, Scenarios).
4. /api/v1/attribution (Tactical 9-Grid, SHAP decompositions, CoT reasoning).
5. Root, health probes, and campaigns catalog.
"""

import pytest
from fastapi.testclient import TestClient


class TestMultimodalEndpoints:
    """Test /api/v1/multimodal endpoints with synthetic file uploads and tagging."""

    def test_upload_video_asset(self, client: TestClient, sample_video_file_payload):
        """Verify video upload, metadata extraction, and GCS URI generation."""
        filename, file_io, content_type = sample_video_file_payload
        response = client.post(
            "/api/v1/multimodal/upload",
            files={"file": (filename, file_io, content_type)},
            data={"campaign_id": "camp-apex-integration", "franchise": "Apex Legends"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "PROCESSED"
        assert "asset_id" in data
        assert data["media_type"] == "VIDEO"
        assert data["gcs_uri"].startswith("gs://eagames-ebc-demo-app-creative-assets/")

    def test_upload_image_asset(self, client: TestClient, sample_image_file_payload):
        """Verify image upload and single-frame tagging."""
        filename, file_io, content_type = sample_image_file_payload
        response = client.post(
            "/api/v1/multimodal/upload",
            files={"file": (filename, file_io, content_type)},
            data={"campaign_id": "camp-sims-integration", "franchise": "The Sims"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "PROCESSED"
        assert data["media_type"] == "IMAGE"

    def test_list_and_get_creative_assets(self, client: TestClient):
        """Verify listing assets with franchise filters and fetching single asset details."""
        list_resp = client.get("/api/v1/multimodal/assets?limit=10")
        assert list_resp.status_code == 200
        data = list_resp.json()
        assert data["total"] > 0
        assert len(data["assets"]) > 0

        first_asset = data["assets"][0]
        asset_id = first_asset["asset_id"]

        get_resp = client.get(f"/api/v1/multimodal/assets/{asset_id}")
        assert get_resp.status_code == 200
        asset_detail = get_resp.json()
        assert asset_detail["asset_id"] == asset_id
        assert "metadata_schema" in asset_detail

    def test_tag_asset_trigger(self, client: TestClient):
        """Verify explicit re-tagging of an existing asset returns CreativeMetadataSchema."""
        list_resp = client.get("/api/v1/multimodal/assets?limit=1")
        asset_id = list_resp.json()["assets"][0]["asset_id"]

        tag_resp = client.post(
            f"/api/v1/multimodal/tag/{asset_id}",
            json={
                "asset_id": asset_id,
                "franchise": "Apex Legends",
                "custom_prompt": "Focus on high-adrenaline battle royale pacing",
            },
        )
        assert tag_resp.status_code == 200
        tagged = tag_resp.json()
        assert "title" in tagged
        assert "funnel_stage" in tagged
        assert "target_surfaces" in tagged


class TestMLOpsGeoSpineEndpoints:
    """Test /api/v1/mlops endpoints for geographic and zeitgeist signals."""

    def test_geospine_metros_endpoint(self, client: TestClient):
        """Verify retrieval of all 210 Google Ads Metro DMAs."""
        resp = client.get("/api/v1/mlops/geospine/metros")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_dmas"] == 210
        assert len(data["dmas"]) == 210
        # Verify rank 1 is New York
        assert data["dmas"][0]["dma_name"] == "New York, NY"

    def test_weather_shocks_endpoint(self, client: TestClient):
        """Verify retrieval of WeatherNext 2 climate shocks."""
        resp = client.get("/api/v1/mlops/weather-shocks")
        assert resp.status_code == 200
        data = resp.json()
        assert "active_shocks_count" in data
        assert len(data["shocks"]) > 0
        first_shock = data["shocks"][0]
        assert "indoor_gaming_lift_factor" in first_shock

    def test_trends_endpoint(self, client: TestClient):
        """Verify Google Trends search momentum index for franchises."""
        resp = client.get("/api/v1/mlops/geospine/trends?franchise=Apex+Legends")
        assert resp.status_code == 200
        trends = resp.json()
        assert len(trends) > 0
        assert all(t["franchise"] == "Apex Legends" for t in trends)

    def test_combinatorial_features_endpoint(self, client: TestClient):
        """Verify combinatorial feature expansion: Feature = Tag * Trend * Climate."""
        resp = client.post("/api/v1/mlops/geospine/combinatorial?franchise=Apex+Legends")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_features"] > 0
        record = data["records"][0]
        assert "combinatorial_lift_score" in record
        assert "dma_code" in record


class TestMeridianEndpoints:
    """Test /api/v1/meridian endpoints for Bayesian prior tuning and Equimarginal pacing."""

    def test_prior_tune_endpoint(self, client: TestClient, sample_causal_experiments):
        """Verify Bayesian log-normal prior calibration from causal experiments."""
        req_payload = {
            "franchise": "Apex Legends",
            "experiments": [e.model_dump() for e in sample_causal_experiments],
        }
        resp = client.post("/api/v1/meridian/tune-priors", json=req_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert "calibrated_priors" in data
        assert "YouTube" in data["calibrated_priors"]
        assert data["calibrated_priors"]["YouTube"]["prior_mean_mu"] > 0

    def test_solve_pacing_endpoint(self, client: TestClient, sample_pacing_request):
        """Verify Equimarginal solver endpoint returns zero-sum allocations with low latency."""
        resp = client.post("/api/v1/meridian/solve-pacing", json=sample_pacing_request.model_dump())
        assert resp.status_code == 200
        data = resp.json()
        assert data["zero_sum_satisfied"] is True
        assert data["pacing_clamp_satisfied"] is True
        assert data["solver_latency_ms"] < 200.0
        assert len(data["channel_allocations"]) == 4

        # Verify scenario persistence
        scenario_id = data["scenario_id"]
        scen_resp = client.get(f"/api/v1/meridian/scenarios/{scenario_id}")
        assert scen_resp.status_code == 200
        assert scen_resp.json()["scenario_id"] == scenario_id


class TestAttributionEndpoints:
    """Test /api/v1/attribution endpoints for 9-Grid, SHAP values, and Gemini CoT."""

    def test_tactical_9grid_endpoint(self, client: TestClient):
        """Verify 9-grid matrix retrieval with quadrant counts and top driver/risk."""
        resp = client.get("/api/v1/attribution/9grid?franchise=Apex+Legends")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["features"]) > 0
        assert "GOLD_MINES" in data["quadrant_counts"]
        assert data["top_driver_feature"] != ""

    def test_shap_endpoint(self, client: TestClient):
        """Verify SHAP value contributions for campaign features."""
        resp = client.get("/api/v1/attribution/shap/camp-apex-001?franchise=Apex+Legends")
        assert resp.status_code == 200
        shap_data = resp.json()
        assert len(shap_data) > 0
        assert "shap_value" in shap_data[0]
        assert "relative_importance_pct" in shap_data[0]

    def test_attribution_explain_endpoint(self, client: TestClient):
        """Verify Gemini 3.6 Flash high-thinking attribution reasoning generation."""
        req_payload = {
            "campaign_id": "camp-apex-s22-relaunch",
            "franchise": "Apex Legends",
            "target_metric": "D7 ROAS",
        }
        resp = client.post("/api/v1/attribution/explain", json=req_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["chain_of_thought_reasoning"]) > 0
        assert len(data["key_recommendations"]) > 0
        assert data["model_used"].startswith("gemini-3.6-flash")


class TestSystemAndHealthEndpoints:
    """Test root and health check probes."""

    def test_root_endpoint(self, client: TestClient):
        """Verify root metadata returns version and health."""
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "HEALTHY"
        assert "version" in data

    def test_health_check_endpoint(self, client: TestClient):
        """Verify healthz returns all active services."""
        resp = client.get("/healthz")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "UP"
        assert data["services"]["pacing_engine"] == "ACTIVE"

    def test_campaigns_endpoint(self, client: TestClient):
        """Verify active marketing campaigns catalog."""
        resp = client.get("/api/v1/campaigns")
        assert resp.status_code == 200
        campaigns = resp.json()
        assert len(campaigns) > 0
        assert any("Apex" in c.get("title", "") or "Apex" in c.get("franchise", "") for c in campaigns)
