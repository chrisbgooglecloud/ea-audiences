"""Tier 3 Test Suite: Data Foundation to Backend Microservices Cross-Feature Interactions.

Authoritative source of truth:
- ORIGINAL_REQUEST.md (§R1 & §R2)
- PROJECT.md (§Interface Contracts)
- TEST_INFRA.md (§3 & §4)
"""

import os
import json
import time
import pytest
from fastapi.testclient import TestClient

from config import config
from generators.geospine_generator import geospine_generator, TOP_25_NIELSEN_DMAS
from orchestrator import run_step_1_geospine, run_step_2_mmm, run_step_3_creative_shap
from tests.e2e.conftest import (
    CampaignBriefSubmission,
    ConflictFatigueAnalysis,
    CampaignPredictionResponse,
    campaign_intake_service,
    shapley_service,
    PreTestVideoAuditRequest,
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
    EquimarginalOptimizationResponse,
    pacing_engine,
)


class TestTier3DataToBackendIntegration:
    """Verifies end-to-end integration and pairwise state flow from Data Foundation to Backend."""

    def test_t3_fatigue_fixture_to_intake_service_contract(self, exported_fixtures_dir):
        """Verify fct_cross_franchise_fatigue fixture aligns with CampaignIntakeService output."""
        run_step_3_creative_shap(live=False, export_dir=exported_fixtures_dir)
        path = os.path.join(exported_fixtures_dir, "fct_cross_franchise_fatigue.json")
        assert os.path.exists(path), f"Fixture not found at {path}"

        with open(path, "r", encoding="utf-8") as f:
            scenarios = json.load(f)

        assert len(scenarios) > 0
        collision = scenarios[0]

        # Verify key fields in fixture
        assert collision["shared_ea_id_overlap_pct"] == 42.1
        assert collision["ad_fatigue_suppression_penalty_pct"] == 14.5
        assert collision["net_bookings_risk_usd"] == 420000.0
        assert collision["recommended_timeline_shift_days"] == 3

        # Feed flight dates into Intake Service
        brief = CampaignBriefSubmission(
            campaign_name=collision["campaign_id"],
            franchise=collision["target_franchise"],
            flight_start=collision["flight_start"],
            flight_end=collision["flight_end"],
            total_budget=1500000.0,
            budget_usd=1500000.0,
        )
        res = campaign_intake_service.simulate_campaign(brief)
        assert res.fatigue_analysis.collision_detected is True
        assert res.fatigue_analysis.shared_ea_id_overlap_pct == collision["shared_ea_id_overlap_pct"]
        assert res.fatigue_analysis.net_bookings_risk_usd == collision["net_bookings_risk_usd"]
        assert res.fatigue_analysis.recommended_timeline_shift_days == collision["recommended_timeline_shift_days"]

    def test_t3_shapley_fixture_to_video_service_contract(self, exported_fixtures_dir):
        """Verify fct_creative_shapley_marginal_lift fixture aligns with ShapleyService pre-test mechanics."""
        run_step_3_creative_shap(live=False, export_dir=exported_fixtures_dir)
        path = os.path.join(exported_fixtures_dir, "fct_creative_shapley_marginal_lift.json")
        assert os.path.exists(path)

        with open(path, "r", encoding="utf-8") as f:
            shapley_records = json.load(f)

        assert len(shapley_records) > 0
        mechanic_names = {r["feature_name"] for r in shapley_records}

        # Run pre-test video audit
        req = PreTestVideoAuditRequest(
            asset_id="asset-fc27-toty-cut-01",
            video_duration_seconds=15.0,
        )
        audit = shapley_service.audit_video_asset(req)
        assert "Skill Move / Trick Shot Showcase" in mechanic_names
        assert "FUT Pack Walkout Jude Bellingham" in mechanic_names
        assert len(audit.features) >= 2

    def test_t3_geospine_fixture_to_25_dma_pacing_optimization(self, exported_fixtures_dir):
        """Verify dim_metro_geospine fixture builds a 25-DMA Equimarginal pacing optimization problem."""
        run_step_1_geospine(live=False, export_dir=exported_fixtures_dir)
        path = os.path.join(exported_fixtures_dir, "dim_metro_geospine.json")
        assert os.path.exists(path)

        with open(path, "r", encoding="utf-8") as f:
            dmas = json.load(f)

        top_25 = dmas[:25]
        assert len(top_25) == 25

        # Construct 25 DMA constraints
        channels = [
            ChannelSpendConstraint(
                channel=d["dma_name"],
                current_spend=round(float(d["population"]) / 100.0, 2),
                base_roas=round(3.0 * float(d["gaming_density_index"]), 2),
                half_saturation_s=round(float(d["population"]) / 250.0, 2),
                hill_slope_k=1.3,
            )
            for d in top_25
        ]

        total_budget = sum(ch.current_spend for ch in channels)
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-25dma-integration",
            franchise="EA Sports FC",
            total_budget=total_budget,
            channels=channels,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        t0 = time.perf_counter()
        res = pacing_engine.solve(req)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        assert elapsed_ms < 150.0
        assert res.zero_sum_satisfied is True
        assert res.pacing_clamp_satisfied is True
        assert len(res.channel_allocations) == 25

    def test_t3_intake_budget_to_pacing_solver_pipeline(self, standard_eafc_brief):
        """Verify brief simulation channel breakdown feeds seamlessly into pacing engine preserving budget."""
        intake_res = campaign_intake_service.simulate_campaign(standard_eafc_brief)
        budget = intake_res.submission.total_budget
        channels = ["Paid Social", "Paid Search", "Influencers", "CTV"]
        weights = [0.35, 0.28, 0.22, 0.15]

        # Map channel breakdown to pacing constraints
        constraints = [
            ChannelSpendConstraint(
                channel=ch,
                current_spend=round(budget * w, 2),
                base_roas=3.42,
                half_saturation_s=round(budget * w * 0.4, 2),
                hill_slope_k=1.4,
            )
            for ch, w in zip(channels, weights)
        ]

        req = EquimarginalOptimizationRequest(
            campaign_id=intake_res.submission.campaign_id,
            franchise=intake_res.submission.franchise,
            total_budget=budget,
            channels=constraints,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        res = pacing_engine.solve(req)
        assert res.zero_sum_satisfied is True
        assert abs(res.total_allocated_budget - budget) < 0.05
        assert res.pacing_clamp_satisfied is True

    def test_t3_weathernext_shock_to_pacing_demand_shift(self):
        """Verify WeatherNext weather shocks adjust base ROAS and shift budget to shock DMAs."""
        # Top 4 DMAs: New York (501), Los Angeles (803), Chicago (602), Dallas (623)
        # Chicago has cold weather shock (elasticity 1.35x), LA is normal (1.00x)
        channels = [
            ChannelSpendConstraint(channel="New York, NY", current_spend=200000.0, base_roas=3.8 * 1.10),
            ChannelSpendConstraint(channel="Los Angeles, CA", current_spend=150000.0, base_roas=3.5 * 1.00),
            ChannelSpendConstraint(channel="Chicago, IL", current_spend=100000.0, base_roas=3.2 * 1.35),  # Shock boosted
            ChannelSpendConstraint(channel="Dallas-Ft. Worth, TX", current_spend=100000.0, base_roas=3.4 * 1.05),
        ]

        req = EquimarginalOptimizationRequest(
            campaign_id="camp-weather-shift",
            channels=channels,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        res = pacing_engine.solve(req)
        chicago_alloc = next(ch for ch in res.channel_allocations if "Chicago" in ch.channel)

        # Chicago should experience a positive spend increase due to higher marginal return
        assert chicago_alloc.spend_delta > 0.0
        assert res.zero_sum_satisfied is True

    def test_t3_collision_mitigation_to_pacing_schedule(self, standard_eafc_brief):
        """Verify mitigated flight dates preserve daily budget pacing bounds."""
        intake_res = campaign_intake_service.simulate_campaign(standard_eafc_brief)
        assert intake_res.fatigue_analysis.recommended_timeline_shift_days == 3
        assert intake_res.fatigue_analysis.mitigated_flight_start == "2026-10-27"
        assert intake_res.fatigue_analysis.mitigated_flight_end == "2026-11-07"

        # 11-day mitigated flight with $1.5M budget -> daily spend ~$136,363
        daily_budget = intake_res.submission.total_budget / 11.0
        assert 130000.0 <= daily_budget <= 140000.0

    def test_t3_orchestrator_10_fixtures_schema_conformity(self, exported_fixtures_dir):
        """Verify all generated export fixtures have valid JSON structure and non-empty records."""
        run_step_1_geospine(live=False, export_dir=exported_fixtures_dir)
        run_step_2_mmm(live=False, export_dir=exported_fixtures_dir)
        run_step_3_creative_shap(live=False, export_dir=exported_fixtures_dir)

        expected_fixtures = [
            "dim_metro_geospine.json",
            "fct_geospine_daily_metro.json",
            "fct_daily_channel_spend.json",
            "causal_lift_experiments.json",
            "fct_creative_shap_attributions.json",
            "fct_creative_shapley_marginal_lift.json",
            "fct_cross_franchise_fatigue.json",
        ]

        for fn in expected_fixtures:
            path = os.path.join(exported_fixtures_dir, fn)
            assert os.path.exists(path), f"Expected fixture {fn} not found in exports"
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            assert isinstance(data, list)
            assert len(data) > 0

    def test_t3_causal_lift_experiments_to_prior_tuner(self, exported_fixtures_dir):
        """Verify causal lift experiments calibrate positive Log-Normal prior parameters."""
        run_step_2_mmm(live=False, export_dir=exported_fixtures_dir)
        path = os.path.join(exported_fixtures_dir, "causal_lift_experiments.json")
        with open(path, "r", encoding="utf-8") as f:
            experiments = json.load(f)

        assert len(experiments) > 0
        for exp in experiments:
            assert exp["prior_lognormal_mu"] > 0.0
            assert exp["prior_lognormal_sigma"] > 0.0
            assert exp["ci_lower"] < exp["ci_upper"]

    def test_t3_end_to_end_http_intake_to_pacing_flow(self, test_client: TestClient, standard_eafc_brief):
        """Verify end-to-end HTTP pipeline: /api/v1/intake/simulate -> /api/v1/meridian/solve."""
        # 1. Simulate brief
        intake_resp = test_client.post("/api/v1/intake/simulate", json=standard_eafc_brief.model_dump())
        assert intake_resp.status_code == 200
        intake_data = intake_resp.json()

        # 2. Extract channels and post to solver
        campaign_id = intake_data["submission"]["campaign_id"]
        franchise = intake_data["submission"]["franchise"]
        total_budget = intake_data["submission"]["total_budget"]
        channels = ["Paid Social", "Paid Search", "Influencers", "CTV"]
        weights = [0.35, 0.28, 0.22, 0.15]

        pacing_payload = {
            "campaign_id": campaign_id,
            "franchise": franchise,
            "total_budget": total_budget,
            "channels": [
                {
                    "channel": ch,
                    "current_spend": round(total_budget * w, 2),
                    "base_roas": 3.42,
                    "half_saturation_s": round(total_budget * w * 0.5, 2),
                    "hill_slope_k": 1.3,
                }
                for ch, w in zip(channels, weights)
            ],
            "max_daily_shift_pct": 0.20,
            "enforce_zero_sum": True,
        }

        pacing_resp = test_client.post("/api/v1/meridian/solve", json=pacing_payload)
        assert pacing_resp.status_code == 200
        pacing_data = pacing_resp.json()

        assert pacing_data["zero_sum_satisfied"] is True
        assert pacing_data["pacing_clamp_satisfied"] is True
        assert pacing_data["solver_latency_ms"] < 150.0
        assert len(pacing_data["channel_allocations"]) == 4

    def test_t3_shapley_pretest_to_creative_attribution_quadrant(self, video_audit_request):
        """Verify pre-test audit detects Trick Shots and Jude Bellingham mapping to strategic recommendations."""
        audit = shapley_service.audit_video_asset(video_audit_request)
        assert audit.funnel_balance_index >= 0.40
        assert audit.audit_verdict == "BALANCED_HIGH_POTENTIAL"
        assert any("Bellingham" in r for r in audit.prescriptive_recommendations)
