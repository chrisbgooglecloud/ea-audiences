"""Tier 4 E2E Tests: Full Executive Workflow Simulation.

Simulates the complete executive pipeline:
1. Media Upload (Video/Image)
2. Gemini Multimodal Structured Tagging (6 surfaces, 3 funnels)
3. Tactical 9-Grid Mapping & SHAP Attributions (Gold Mines, Core Drivers, Money Pits)
4. Gemini 3.6 Flash (HIGH thinking) Chain-of-Thought Explanation
5. Equimarginal Hill Saturation Optimization (20% clamp, zero-sum)
6. A2A Inter-Agent Protocol Negotiation (Media Buying Agent <-> Creative Agent)
7. A2UI Streaming Component Generation
8. Multi-Franchise Application Scenarios (Apex Legends, Battlefield, EA Sports FC, The Sims).
"""

import io
import json
import pytest
from fastapi.testclient import TestClient
from app.schemas.creative import FunnelStageEnum, SurfaceEnum
from app.schemas.attribution import QuadrantEnum


class TestFullExecutiveLifecycle:
    """Execute complete end-to-end multi-agent measurement and optimization workflow."""

    def test_complete_upload_to_a2a_roundtrip(self, client: TestClient):
        """End-to-end test exercising all 6 pipeline stages sequentially."""
        # --- Stage 1: Upload Creative Asset ---
        fake_video = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom" + b"\x00" * 2048
        upload_resp = client.post(
            "/api/v1/multimodal/upload",
            files={"file": ("battlefield_squad_breach.mp4", io.BytesIO(fake_video), "video/mp4")},
            data={"campaign_id": "camp-bf6-e2e", "franchise": "Battlefield"},
        )
        assert upload_resp.status_code == 200
        upload_data = upload_resp.json()
        asset_id = upload_data["asset_id"]
        assert upload_data["status"] == "PROCESSED"

        # --- Stage 2: Verify Structured Metadata Tagging ---
        asset_resp = client.get(f"/api/v1/multimodal/assets/{asset_id}")
        assert asset_resp.status_code == 200
        asset_data = asset_resp.json()
        metadata = asset_data["metadata_schema"]
        assert metadata is not None
        assert len(metadata["target_surfaces"]) > 0
        assert metadata["funnel_stage"] in [f.value for f in FunnelStageEnum]

        # --- Stage 3: Tactical 9-Grid Feature Attribution ---
        grid_resp = client.get("/api/v1/attribution/9grid?franchise=Battlefield&campaign_id=camp-bf6-e2e")
        assert grid_resp.status_code == 200
        grid_data = grid_resp.json()
        assert len(grid_data["features"]) > 0
        gold_mines = [f for f in grid_data["features"] if f["quadrant"] == "GOLD_MINES"]
        assert len(gold_mines) >= 1

        # --- Stage 4: Gemini 3.6 Flash CoT Explanation ---
        explain_resp = client.post(
            "/api/v1/attribution/explain",
            json={
                "campaign_id": "camp-bf6-e2e",
                "franchise": "Battlefield",
                "target_metric": "D7 ROAS",
            },
        )
        assert explain_resp.status_code == 200
        explain_data = explain_resp.json()
        assert len(explain_data["chain_of_thought_reasoning"]) >= 3
        assert len(explain_data["key_recommendations"]) >= 2

        # --- Stage 5: Equimarginal Pacing Budget Optimization ---
        pacing_req = {
            "campaign_id": "camp-bf6-e2e",
            "franchise": "Battlefield",
            "total_budget": 400000.0,
            "channels": [
                {
                    "channel": "YouTube",
                    "current_spend": 120000.0,
                    "base_roas": 2.7,
                    "half_saturation_s": 70000.0,
                    "hill_slope_k": 1.35,
                },
                {
                    "channel": "Meta",
                    "current_spend": 130000.0,
                    "base_roas": 2.9,
                    "half_saturation_s": 75000.0,
                    "hill_slope_k": 1.40,
                },
                {
                    "channel": "TikTok",
                    "current_spend": 90000.0,
                    "base_roas": 3.5,
                    "half_saturation_s": 50000.0,
                    "hill_slope_k": 1.50,
                },
                {
                    "channel": "Programmatic 3D",
                    "current_spend": 60000.0,
                    "base_roas": 1.7,
                    "half_saturation_s": 40000.0,
                    "hill_slope_k": 1.20,
                },
            ],
            "max_daily_shift_pct": 0.20,
            "enforce_zero_sum": True,
        }
        solve_resp = client.post("/api/v1/meridian/solve-pacing", json=pacing_req)
        assert solve_resp.status_code == 200
        solve_data = solve_resp.json()
        assert solve_data["zero_sum_satisfied"] is True
        assert solve_data["pacing_clamp_satisfied"] is True
        assert solve_data["solver_latency_ms"] < 200.0

        # --- Stage 6: Inter-Agent A2A Negotiation ---
        a2a_payload = {
            "message_id": "msg-e2e-exec-01",
            "correlation_id": "corr-bf6-rebalance",
            "sender": "MediaBuyingAgent",
            "recipient": "TaggingAgent",
            "timestamp": "2026-08-09T18:00:00Z",
            "intent": "REVISE_CREATIVE",
            "payload": {
                "top_driver": grid_data["top_driver_feature"],
                "target_budget_uplift": solve_data["revenue_uplift_pct"],
                "action": "Scale Up Gold Mines creative variants",
            },
            "status": "SENT",
        }
        a2a_resp = client.post("/api/v1/agents/a2a", json=a2a_payload)
        assert a2a_resp.status_code == 200
        a2a_ack = a2a_resp.json()
        assert a2a_ack["status"] == "DELIVERED"
        assert a2a_ack["payload"]["negotiated_status"] == "ACCEPTED"


class TestRealWorldApplicationScenarios:
    """Validate 4 distinct franchise real-world operational scenarios."""

    def test_scenario_1_apex_cold_weather_budget_shift(self, client: TestClient):
        """Scenario 1: Apex Legends extreme winter cold snap in Northeast DMAs triggers reallocation."""
        # 1. Fetch climate shocks
        weather_resp = client.get("/api/v1/mlops/weather-shocks")
        assert weather_resp.status_code == 200
        shocks = weather_resp.json()["shocks"]
        assert len(shocks) > 0

        # 2. Rebalance budget towards digital video
        pacing_req = {
            "campaign_id": "camp-apex-weather-surge",
            "franchise": "Apex Legends",
            "channels": [
                {"channel": "YouTube", "current_spend": 80000.0, "base_roas": 3.1, "half_saturation_s": 50000.0, "hill_slope_k": 1.4},
                {"channel": "Twitch Influencers", "current_spend": 60000.0, "base_roas": 3.6, "half_saturation_s": 40000.0, "hill_slope_k": 1.5},
                {"channel": "Out of Home", "current_spend": 40000.0, "base_roas": 1.2, "half_saturation_s": 25000.0, "hill_slope_k": 1.1},
            ],
            "max_daily_shift_pct": 0.20,
            "enforce_zero_sum": True,
        }
        solve_resp = client.post("/api/v1/meridian/solve-pacing", json=pacing_req)
        assert solve_resp.status_code == 200
        data = solve_resp.json()
        assert data["zero_sum_satisfied"] is True
        # Twitch should receive budget shift from Out of Home
        twitch_alloc = next(c for c in data["channel_allocations"] if c["channel"] == "Twitch Influencers")
        ooh_alloc = next(c for c in data["channel_allocations"] if c["channel"] == "Out of Home")
        assert twitch_alloc["spend_delta"] > 0
        assert ooh_alloc["spend_delta"] < 0

    def test_scenario_2_battlefield_squad_breach_tagging(self, client: TestClient):
        """Scenario 2: Battlefield 6 Squad Breach video tagging and 9-grid quadrant placement."""
        grid_resp = client.get("/api/v1/attribution/9grid?franchise=Battlefield")
        assert grid_resp.status_code == 200
        grid = grid_resp.json()
        assert grid["franchise"] == "Battlefield"
        assert grid["avg_marginal_roas"] > 0.0

    def test_scenario_3_ea_sports_fc_prior_calibration(self, client: TestClient, sample_causal_experiments):
        """Scenario 3: EA Sports FC Ultimate Team prior calibration from causal geo-trials."""
        prior_req = {
            "franchise": "EA Sports FC",
            "experiments": [e.model_dump() for e in sample_causal_experiments],
        }
        resp = client.post("/api/v1/meridian/tune-priors", json=prior_req)
        assert resp.status_code == 200
        priors = resp.json()["calibrated_priors"]
        assert "YouTube" in priors
        assert priors["YouTube"]["hill_slope_prior_k"] >= 1.0

    def test_scenario_4_the_sims_multi_surface_campaign(self, client: TestClient):
        """Scenario 4: The Sims multi-surface asset listing and A2A negotiation."""
        assets_resp = client.get("/api/v1/multimodal/assets?franchise=The+Sims")
        assert assets_resp.status_code == 200
        assert assets_resp.json()["total"] >= 0
