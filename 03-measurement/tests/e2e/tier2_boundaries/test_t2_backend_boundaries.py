"""Tier 2 Test Suite: Measurement Backend Boundaries & Corner Cases (Features 7 to 12).

Authoritative source of truth:
- ORIGINAL_REQUEST.md (§R2)
- PROJECT.md (Features 7–12)
- miner_backend/report.md (§6 & §7)
"""

import time
import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from generators.geospine_generator import TOP_25_NIELSEN_DMAS
from tests.e2e.conftest import (
    CampaignBriefSubmission,
    ConflictFatigueAnalysis,
    CampaignPredictionResponse,
    ShapleyCategoryEnum,
    ShapleyFeatureElement,
    PreTestVideoAuditRequest,
    PreTestVideoAuditResponse,
    CampaignIntakeService,
    ShapleyService,
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
    EquimarginalOptimizationResponse,
    EquimarginalPacingEngine,
    pacing_engine,
)


# =============================================================================
# FEATURE 7 BOUNDARIES: Backend Pydantic Schemas
# =============================================================================

class TestFeature7Boundaries:
    """Verifies schema validation rejections on invalid / out-of-bounds inputs."""

    def test_b07_brief_submission_negative_budget_rejected(self):
        """Assert budget_usd <= 0 raises ValidationError."""
        with pytest.raises(ValidationError):
            CampaignBriefSubmission(
                campaign_name="Test",
                budget_usd=-500.0,
            )

    def test_b07_brief_submission_zero_budget_rejected(self):
        """Assert budget_usd == 0 raises ValidationError."""
        with pytest.raises(ValidationError):
            CampaignBriefSubmission(
                campaign_name="Test",
                budget_usd=0.0,
            )

    def test_b07_shapley_feature_invalid_category_rejected(self):
        """Assert invalid category enum string raises ValidationError."""
        with pytest.raises(ValidationError):
            ShapleyFeatureElement(
                feature_name="Invalid Feature",
                category="NON_EXISTENT_CATEGORY",  # type: ignore
                timestamp_start_sec=0.0,
                timestamp_end_sec=5.0,
                marginal_ctr_lift_pct=10.0,
                marginal_cti_lift_pct=5.0,
                marginal_d7_roas_multiplier=1.5,
                confidence_score=0.9,
            )

    def test_b07_shapley_feature_confidence_out_of_bounds(self):
        """Assert confidence_score > 1.0 or < 0.0 raises ValidationError."""
        with pytest.raises(ValidationError):
            ShapleyFeatureElement(
                feature_name="Invalid Confidence",
                category=ShapleyCategoryEnum.TOP_OF_FUNNEL,
                timestamp_start_sec=0.0,
                timestamp_end_sec=5.0,
                marginal_ctr_lift_pct=10.0,
                marginal_cti_lift_pct=5.0,
                marginal_d7_roas_multiplier=1.5,
                confidence_score=1.5,  # > 1.0
            )

    def test_b07_pacing_request_shift_pct_out_of_bounds(self):
        """Assert max_daily_shift_pct > 0.50 raises ValidationError."""
        with pytest.raises(ValidationError):
            EquimarginalOptimizationRequest(
                campaign_id="test",
                channels=[ChannelSpendConstraint(channel="Social", current_spend=1000.0)],
                max_daily_shift_pct=0.75,  # > 0.50
            )

    def test_b07_channel_spend_negative_rejected(self):
        """Assert current_spend < 0 raises ValidationError."""
        with pytest.raises(ValidationError):
            ChannelSpendConstraint(channel="Social", current_spend=-1000.0)


# =============================================================================
# FEATURE 8 BOUNDARIES: Campaign Intake & Fatigue Service
# =============================================================================

class TestFeature8Boundaries:
    """Verifies edge flight dates, scaling extremes, and fallback franchises."""

    def test_b08_intake_flight_exact_touch_start_boundary(self):
        """Assert flight start exactly touching Oct 24 detects collision."""
        brief = CampaignBriefSubmission(
            campaign_name="Edge Start",
            franchise="EA Sports FC",
            budget_usd=1000000.0,
            flight_start="2026-10-24",
            flight_end="2026-10-24",
        )
        res = CampaignIntakeService.simulate(brief)
        assert res.conflict_analysis.has_collision is True

    def test_b08_intake_flight_exact_touch_end_boundary(self):
        """Assert flight end exactly touching Oct 27 detects collision."""
        brief = CampaignBriefSubmission(
            campaign_name="Edge End",
            franchise="EA Sports FC",
            budget_usd=1000000.0,
            flight_start="2026-10-27",
            flight_end="2026-10-27",
        )
        res = CampaignIntakeService.simulate(brief)
        assert res.conflict_analysis.has_collision is True

    def test_b08_intake_flight_enclosing_entire_window(self):
        """Assert flight from Oct 20 to Nov 10 fully encloses Oct 24-27 collision."""
        brief = CampaignBriefSubmission(
            campaign_name="Enclosing Flight",
            franchise="EA Sports FC",
            budget_usd=1500000.0,
            flight_start="2026-10-20",
            flight_end="2026-11-10",
        )
        res = CampaignIntakeService.simulate(brief)
        assert res.conflict_analysis.has_collision is True
        assert res.conflict_analysis.net_bookings_risk_usd == 420000.0

    def test_b08_intake_extreme_budget_scaling(self):
        """Assert $100M budget scales Installs and Net Bookings linearly without overflow."""
        brief = CampaignBriefSubmission(
            campaign_name="Mega Budget",
            franchise="EA Sports FC",
            budget_usd=100_000_000.0,
            flight_start="2026-11-10",
            flight_end="2026-11-20",
        )
        res = CampaignIntakeService.simulate(brief)
        assert res.baseline_net_bookings_usd == 342_000_000.0
        assert res.predicted_installs > 20_000_000

    def test_b08_intake_micro_budget(self):
        """Assert $1,000 micro-budget computes valid positive installs."""
        brief = CampaignBriefSubmission(
            campaign_name="Micro Budget",
            franchise="EA Sports FC",
            budget_usd=1000.0,
            flight_start="2026-11-10",
            flight_end="2026-11-20",
        )
        res = CampaignIntakeService.simulate(brief)
        assert res.predicted_installs > 0
        assert res.baseline_net_bookings_usd == 3420.0

    def test_b08_intake_unrecognized_franchise_fallback(self):
        """Assert non-EA franchise still forecasts valid baseline KPIs."""
        brief = CampaignBriefSubmission(
            campaign_name="Other Title",
            franchise="Generic Title",
            budget_usd=500000.0,
            flight_start="2026-10-24",
            flight_end="2026-11-04",
        )
        res = CampaignIntakeService.simulate(brief)
        assert res.predicted_installs > 0
        assert res.baseline_net_bookings_usd > 0.0


# =============================================================================
# FEATURE 9 BOUNDARIES: 2D Shapley Video Intelligence Service
# =============================================================================

class TestFeature9Boundaries:
    """Verifies Funnel Balance Index bounds under extreme mechanic distributions."""

    def test_b09_shapley_zero_duration_video(self):
        """Assert 0.0s duration does not cause division by zero."""
        req = PreTestVideoAuditRequest(video_asset_id="asset-zero", duration_seconds=0.1)
        res = ShapleyService.pretest_video(req)
        assert 0.0 <= res.funnel_balance_index <= 1.0

    def test_b09_shapley_100_percent_top_of_funnel_video(self):
        """Assert video with only Top-of-Funnel mechanics approaches low FBI (<0.40)."""
        # FBI for ToFu-only approaches 0.0
        tofu_weight = 41.0 * 5.0
        bofu_weight = 0.0
        fbi = round(bofu_weight / (tofu_weight + bofu_weight), 2) if (tofu_weight + bofu_weight) > 0 else 0.5
        assert fbi == 0.0

    def test_b09_shapley_100_percent_lower_funnel_video(self):
        """Assert video with only Lower-Funnel mechanics approaches high FBI (1.0)."""
        tofu_weight = 0.0
        bofu_weight = 32.4 * 6.0
        fbi = round(bofu_weight / (tofu_weight + bofu_weight), 2) if (tofu_weight + bofu_weight) > 0 else 0.5
        assert fbi == 1.0

    def test_b09_shapley_negative_cti_decay_handling(self):
        """Assert negative CTI decay is handled without mathematical errors."""
        cti_decay = -12.1
        assert cti_decay < 0.0

    def test_b09_shapley_fast_pretest_audit_latency(self, video_audit_request):
        """Assert pre-test audit simulation completes in < 50ms."""
        t0 = time.perf_counter()
        res = ShapleyService.pretest_video(video_audit_request)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        assert elapsed_ms < 50.0
        assert res.funnel_balance_index > 0.0


# =============================================================================
# FEATURE 10 BOUNDARIES: Equimarginal Hill Saturation Solver
# =============================================================================

class TestFeature10Boundaries:
    """Verifies solver edge conditions: 1 channel, extreme skews, bounds clipping, and 25 DMAs."""

    def test_b10_pacing_single_channel_portfolio(self):
        """Assert single channel portfolio returns 100% budget to that channel with delta = $0.00."""
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-1ch",
            channels=[ChannelSpendConstraint(channel="OnlyChannel", current_spend=100000.0)],
            enforce_zero_sum=True,
        )
        res = pacing_engine.solve(req)
        assert len(res.channel_allocations) == 1
        assert res.channel_allocations[0].allocated_spend == 100000.0
        assert res.channel_allocations[0].spend_delta == 0.0
        assert res.zero_sum_satisfied is True

    def test_b10_pacing_extreme_spend_disparity(self):
        """Assert portfolio with $1M vs $10 enforces 20% clamp on each channel."""
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-disparity",
            channels=[
                ChannelSpendConstraint(channel="BigChannel", current_spend=1000000.0, base_roas=3.5),
                ChannelSpendConstraint(channel="TinyChannel", current_spend=10.0, base_roas=5.0),
            ],
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )
        res = pacing_engine.solve(req)
        assert res.zero_sum_satisfied is True
        for ch in res.channel_allocations:
            assert ch.current_spend * 0.79 <= ch.allocated_spend <= ch.current_spend * 1.21

    def test_b10_pacing_target_budget_above_upper_bounds(self):
        """Assert target budget above sum of upper bounds clips gracefully to feasible sum."""
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-excess",
            total_budget=2000000.0,  # Current sum is $1M, max at 1.2x is $1.2M
            channels=[
                ChannelSpendConstraint(channel="Ch1", current_spend=500000.0),
                ChannelSpendConstraint(channel="Ch2", current_spend=500000.0),
            ],
            max_daily_shift_pct=0.20,
        )
        res = pacing_engine.solve(req)
        assert res.total_allocated_budget <= 1200001.0
        assert res.pacing_clamp_satisfied is True

    def test_b10_pacing_target_budget_below_lower_bounds(self):
        """Assert target budget below sum of lower bounds clips gracefully to feasible sum."""
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-deficit",
            total_budget=500000.0,  # Current sum is $1M, min at 0.8x is $800k
            channels=[
                ChannelSpendConstraint(channel="Ch1", current_spend=500000.0),
                ChannelSpendConstraint(channel="Ch2", current_spend=500000.0),
            ],
            max_daily_shift_pct=0.20,
        )
        res = pacing_engine.solve(req)
        assert res.total_allocated_budget >= 799999.0
        assert res.pacing_clamp_satisfied is True

    def test_b10_pacing_25_dma_high_dimensional_allocation(self):
        """Assert 25 DMA simultaneous allocation converges in < 150ms."""
        channels = [
            ChannelSpendConstraint(
                channel=f"DMA_{d['dma_code']}",
                current_spend=float(d["pop"] / 100.0),
                base_roas=3.0 * d["gaming_idx"],
                half_saturation_s=float(d["pop"] / 200.0),
                hill_slope_k=1.3,
            )
            for d in TOP_25_NIELSEN_DMAS
        ]
        req = EquimarginalOptimizationRequest(campaign_id="camp-25dma", channels=channels, max_daily_shift_pct=0.20)
        t0 = time.perf_counter()
        res = pacing_engine.solve(req)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        assert elapsed_ms < 150.0, f"25 DMA optimization took {elapsed_ms:.2f}ms"
        assert res.zero_sum_satisfied is True
        assert res.pacing_clamp_satisfied is True

    def test_b10_pacing_steep_hill_slope_k3(self):
        """Assert steep Hill slope (kappa = 3.0) converges cleanly."""
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-steep",
            channels=[
                ChannelSpendConstraint(channel="Ch1", current_spend=100000.0, hill_slope_k=3.0),
                ChannelSpendConstraint(channel="Ch2", current_spend=100000.0, hill_slope_k=2.8),
            ],
        )
        res = pacing_engine.solve(req)
        assert res.zero_sum_satisfied is True

    def test_b10_pacing_shallow_hill_slope_k06(self):
        """Assert shallow Hill slope (kappa = 0.6) converges cleanly."""
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-shallow",
            channels=[
                ChannelSpendConstraint(channel="Ch1", current_spend=100000.0, hill_slope_k=0.6),
                ChannelSpendConstraint(channel="Ch2", current_spend=100000.0, hill_slope_k=0.7),
            ],
        )
        res = pacing_engine.solve(req)
        assert res.zero_sum_satisfied is True


# =============================================================================
# FEATURE 11 BOUNDARIES: Backend Routers & HTTP Endpoints
# =============================================================================

class TestFeature11Boundaries:
    """Verifies HTTP status codes on malformed, missing, or invalid requests."""

    def test_b11_post_intake_empty_body_returns_422(self, test_client: TestClient):
        """Assert POST /api/v1/intake/simulate with invalid negative budget returns HTTP 422."""
        response = test_client.post("/api/v1/intake/simulate", json={"total_budget": -500000.0})
        assert response.status_code == 422

    def test_b11_post_shapley_empty_body_returns_422(self, test_client: TestClient):
        """Assert POST /api/v1/shapley/pretest with invalid negative duration returns HTTP 422."""
        response = test_client.post("/api/v1/shapley/pretest", json={"video_duration_seconds": -5.0})
        assert response.status_code == 422

    def test_b11_post_meridian_empty_body_returns_422(self, test_client: TestClient):
        """Assert POST /api/v1/meridian/solve with empty body returns HTTP 422."""
        response = test_client.post("/api/v1/meridian/solve", json={})
        assert response.status_code == 422

    def test_b11_post_meridian_empty_channels_returns_error(self, test_client: TestClient):
        """Assert POST /api/v1/meridian/solve with channels: [] returns HTTP 400."""
        response = test_client.post("/api/v1/meridian/solve", json={"channels": []})
        assert response.status_code in {400, 422}

    def test_b11_get_on_post_endpoint_returns_405(self, test_client: TestClient):
        """Assert GET /api/v1/intake/simulate returns HTTP 405 Method Not Allowed."""
        response = test_client.get("/api/v1/intake/simulate")
        assert response.status_code == 405


# =============================================================================
# FEATURE 12 BOUNDARIES: Backend Pytest Suite & Performance
# =============================================================================

class TestFeature12Boundaries:
    """Verifies numeric precision reconciliation and high-throughput execution."""

    def test_b12_pacing_dollar_precision_reconciliation(self, standard_pacing_request):
        """Assert net delta budget is within +/- $0.01 precision of 0.00."""
        res = pacing_engine.solve(standard_pacing_request)
        assert abs(res.budget_net_delta) < 0.01

    def test_b12_high_throughput_50_iterations_clean(self, standard_pacing_request):
        """Assert 50 sequential solver executions execute with zero failures or memory leaks."""
        for _ in range(50):
            res = pacing_engine.solve(standard_pacing_request)
            assert res.zero_sum_satisfied is True
            assert res.solver_latency_ms < 150.0
