"""Tier 1 Test Suite: Measurement Backend Microservices (Features 7 to 12).

Authoritative source of truth:
- ORIGINAL_REQUEST.md (§R2)
- PROJECT.md (Features 7–12)
- miner_backend/report.md
"""

import time
import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from tests.e2e.conftest import (
    CampaignBriefSubmission,
    ConflictFatigueAnalysis,
    CampaignPredictionResponse,
    ChannelPredictionDetail,
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
# FEATURE 7: Backend Pydantic Schemas
# =============================================================================

class TestFeature7BackendSchemas:
    """Verifies strict Pydantic v2 data models for intake, shapley, and meridian."""

    def test_f07_campaign_brief_submission_valid(self, standard_eafc_brief):
        """Verify valid instantiation of CampaignBriefSubmission."""
        assert standard_eafc_brief.campaign_name == "EA FC 27 TOTY Mid-Season Push"
        assert standard_eafc_brief.budget_usd == 1500000.0
        assert standard_eafc_brief.flight_start == "2026-10-24"
        assert standard_eafc_brief.flight_end == "2026-11-04"
        assert standard_eafc_brief.target_cpi == 4.12
        assert standard_eafc_brief.target_roas == 3.42

    def test_f07_conflict_fatigue_analysis_schema(self):
        """Verify ConflictFatigueAnalysis schema constraints and fields."""
        conflict = ConflictFatigueAnalysis(
            has_collision=True,
            conflicting_franchise="Apex Legends Season 26 Launch",
            collision_window_start="2026-10-24",
            collision_window_end="2026-10-27",
            shared_ea_id_overlap_pct=42.1,
            ad_fatigue_suppression_penalty_pct=14.5,
            net_bookings_risk_usd=420000.0,
            recommended_timeline_shift_days=3,
            recommended_flight_start="2026-10-27",
            recommended_flight_end="2026-11-07",
            projected_net_bookings_recovery_usd=420000.0,
            mitigation_strategy="+3 day shift to Oct 27-Nov 07 recovering $420k",
        )
        assert conflict.has_collision is True
        assert conflict.shared_ea_id_overlap_pct == 42.1
        assert conflict.ad_fatigue_suppression_penalty_pct == 14.5
        assert conflict.net_bookings_risk_usd == 420000.0
        assert conflict.recommended_timeline_shift_days == 3
        assert conflict.projected_net_bookings_recovery_usd == 420000.0

    def test_f07_campaign_prediction_response_schema(self):
        """Verify CampaignPredictionResponse schema fields and numeric properties."""
        conflict = ConflictFatigueAnalysis(
            has_collision=True,
            conflicting_franchise="Apex Legends Season 26 Launch",
            collision_window_start="2026-10-24",
            collision_window_end="2026-10-27",
            shared_ea_id_overlap_pct=42.1,
            ad_fatigue_suppression_penalty_pct=14.5,
            net_bookings_risk_usd=420000.0,
            recommended_timeline_shift_days=3,
            recommended_flight_start="2026-10-27",
            recommended_flight_end="2026-11-07",
            projected_net_bookings_recovery_usd=420000.0,
            mitigation_strategy="+3 day shift",
        )
        resp = CampaignPredictionResponse(
            campaign_id="camp-test-01",
            campaign_name="EA FC 27 TOTY Mid-Season Push",
            franchise="EA Sports FC",
            budget_usd=1500000.0,
            predicted_installs=364000,
            predicted_cpi=4.12,
            predicted_d7_roas=3.42,
            baseline_net_bookings_usd=5130000.0,
            penalized_net_bookings_usd=4710000.0,
            net_bookings_post_mitigation_usd=5130000.0,
            conflict_analysis=conflict,
            channel_breakdown=[],
            generated_at="2026-08-17T12:00:00Z",
        )
        assert resp.predicted_installs == 364000
        assert resp.baseline_net_bookings_usd == 5130000.0
        assert resp.penalized_net_bookings_usd == 4710000.0
        assert resp.net_bookings_post_mitigation_usd == 5130000.0

    def test_f07_shapley_feature_element_schema(self):
        """Verify ShapleyFeatureElement schema across the 3 enum categories."""
        elem_tofu = ShapleyFeatureElement(
            feature_name="Skill Move / Trick Shot Showcase",
            category=ShapleyCategoryEnum.TOP_OF_FUNNEL,
            timestamp_start_sec=0.0,
            timestamp_end_sec=5.0,
            marginal_ctr_lift_pct=41.0,
            marginal_cti_lift_pct=-12.1,
            marginal_d7_roas_multiplier=1.85,
            confidence_score=0.96,
        )
        elem_bofu = ShapleyFeatureElement(
            feature_name="FUT Pack Walkout Jude Bellingham",
            category=ShapleyCategoryEnum.LOWER_FUNNEL_MONETIZATION,
            timestamp_start_sec=8.0,
            timestamp_end_sec=14.0,
            marginal_ctr_lift_pct=4.2,
            marginal_cti_lift_pct=32.4,
            marginal_d7_roas_multiplier=3.42,
            confidence_score=0.98,
        )
        assert elem_tofu.category == ShapleyCategoryEnum.TOP_OF_FUNNEL
        assert elem_bofu.category == ShapleyCategoryEnum.LOWER_FUNNEL_MONETIZATION
        assert elem_tofu.marginal_ctr_lift_pct == 41.0
        assert elem_bofu.marginal_cti_lift_pct == 32.4

    def test_f07_pretest_video_audit_schemas(self, video_audit_request):
        """Verify PreTestVideoAuditRequest and PreTestVideoAuditResponse."""
        assert video_audit_request.video_asset_id == "asset-fc27-toty-cut-01"
        assert video_audit_request.duration_seconds == 15.0

    def test_f07_equimarginal_pacing_schemas(self, standard_pacing_request):
        """Verify EquimarginalOptimizationRequest schema and channel constraints."""
        assert len(standard_pacing_request.channels) == 4
        assert standard_pacing_request.max_daily_shift_pct == 0.20
        assert standard_pacing_request.enforce_zero_sum is True


# =============================================================================
# FEATURE 8: Campaign Intake & Fatigue Service
# =============================================================================

class TestFeature8CampaignIntakeService:
    """Verifies KPI forecasting, Oct 24-27 collision detection, and prescriptive recovery."""

    def test_f08_intake_kpi_forecast_standard_brief(self, standard_eafc_brief):
        """Verify standard brief forecast: 364,000 installs, $4.12 CPI, 3.42x ROAS, $5.13M bookings."""
        res = CampaignIntakeService.simulate(standard_eafc_brief)
        assert res.predicted_installs == 364000
        assert res.predicted_cpi == 4.12
        assert res.predicted_d7_roas == 3.42
        assert res.baseline_net_bookings_usd == 5130000.0

    def test_f08_intake_collision_detection_oct24_27(self, standard_eafc_brief):
        """Verify schedule overlap with Oct 24-27 triggers collision detection."""
        res = CampaignIntakeService.simulate(standard_eafc_brief)
        assert res.conflict_analysis.has_collision is True
        assert res.conflict_analysis.conflicting_franchise in {"Apex Legends", "Apex Legends Season 26 Launch"}
        assert res.conflict_analysis.collision_window_start == "2026-10-24"
        assert res.conflict_analysis.collision_window_end == "2026-10-27"

    def test_f08_intake_collision_metrics(self, standard_eafc_brief):
        """Verify 42.1% overlap, 14.5% suppression penalty, $420k risk."""
        res = CampaignIntakeService.simulate(standard_eafc_brief)
        assert res.conflict_analysis.shared_ea_id_overlap_pct == 42.1
        assert res.conflict_analysis.ad_fatigue_suppression_penalty_pct == 14.5
        assert res.conflict_analysis.net_bookings_risk_usd == 420000.0

    def test_f08_intake_penalized_net_bookings(self, standard_eafc_brief):
        """Verify penalized Net Bookings = $4,710,000 ($5,130,000 - $420,000)."""
        res = CampaignIntakeService.simulate(standard_eafc_brief)
        assert res.penalized_net_bookings_usd == 4710000.0
        assert res.penalized_net_bookings_usd == res.baseline_net_bookings_usd - res.conflict_analysis.net_bookings_risk_usd

    def test_f08_intake_prescriptive_mitigation_and_recovery(self, standard_eafc_brief):
        """Verify +3 day timeline shift to Oct 27-Nov 07 recovering +$420,000 to full $5,130,000."""
        res = CampaignIntakeService.simulate(standard_eafc_brief)
        assert res.conflict_analysis.recommended_timeline_shift_days == 3
        assert res.conflict_analysis.recommended_flight_start == "2026-10-27"
        assert res.conflict_analysis.recommended_flight_end == "2026-11-07"
        assert res.conflict_analysis.projected_net_bookings_recovery_usd == 420000.0
        assert res.net_bookings_post_mitigation_usd == 5130000.0

    def test_f08_intake_no_collision_november_flight(self, non_colliding_brief):
        """Verify non-overlapping flight in November yields 0 collision and 0 risk."""
        res = CampaignIntakeService.simulate(non_colliding_brief)
        assert res.conflict_analysis.has_collision is False
        assert res.conflict_analysis.net_bookings_risk_usd == 0.0
        assert res.conflict_analysis.ad_fatigue_suppression_penalty_pct == 0.0
        assert res.penalized_net_bookings_usd == res.baseline_net_bookings_usd


# =============================================================================
# FEATURE 9: 2D Shapley Video Intelligence Service
# =============================================================================

class TestFeature9ShapleyVideoService:
    """Verifies frame decomposition, 2D trade-offs, Funnel Balance Index, and pre-test audits."""

    def test_f09_shapley_frame_decomposition_3_tiers(self, video_audit_request):
        """Verify frame decomposition creates TOP_OF_FUNNEL, LOWER_FUNNEL, and NEUTRAL tiers."""
        audit = ShapleyService.pretest_video(video_audit_request)
        categories = {f.category for f in audit.features}
        assert ShapleyCategoryEnum.TOP_OF_FUNNEL in categories
        assert ShapleyCategoryEnum.LOWER_FUNNEL_MONETIZATION in categories
        assert ShapleyCategoryEnum.NEUTRAL_ENGAGEMENT in categories

    def test_f09_shapley_trickshot_mechanic_lifts(self, video_audit_request):
        """Verify Trick Shots mechanic: +41.0% CTR lift and -12.1% CTI lift."""
        audit = ShapleyService.pretest_video(video_audit_request)
        trickshot = next(f for f in audit.features if "Trick Shot" in f.feature_name)
        assert trickshot.marginal_ctr_lift_pct == 41.0
        assert trickshot.marginal_cti_lift_pct == -12.1
        assert trickshot.category == ShapleyCategoryEnum.TOP_OF_FUNNEL

    def test_f09_shapley_bellingham_walkout_lifts(self, video_audit_request):
        """Verify Jude Bellingham Walkout: +4.2% CTR lift, +32.4% CTI lift, 3.42x ROAS."""
        audit = ShapleyService.pretest_video(video_audit_request)
        bellingham = next(f for f in audit.features if "Bellingham" in f.feature_name)
        assert bellingham.marginal_ctr_lift_pct == 4.2
        assert bellingham.marginal_cti_lift_pct == 32.4
        assert bellingham.marginal_d7_roas_multiplier == 3.42
        assert bellingham.category == ShapleyCategoryEnum.LOWER_FUNNEL_MONETIZATION

    def test_f09_shapley_funnel_balance_index_range(self, video_audit_request):
        """Verify calculated Funnel Balance Index is strictly between 0.0 and 1.0 and >= 0.70 for standard asset."""
        audit = ShapleyService.pretest_video(video_audit_request)
        assert 0.0 <= audit.funnel_balance_index <= 1.0
        assert audit.funnel_balance_index >= 0.70
        assert audit.verdict in {"OPTIMAL_BALANCE", "TOP_HEAVY_CTR_SPIKE", "LOWER_FUNNEL_CONVERSION_HEAVY"}

    def test_f09_shapley_pretest_prescriptive_recommendations(self, video_audit_request):
        """Verify prescriptive recommendations contain Jude Bellingham anchoring directive."""
        audit = ShapleyService.pretest_video(video_audit_request)
        assert len(audit.prescriptive_recommendations) >= 2
        assert any("Bellingham" in r or "3.42x" in r for r in audit.prescriptive_recommendations)

    def test_f09_shapley_aggregate_lifts_positive(self, video_audit_request):
        """Verify aggregate CTR and CTI lifts are calculated."""
        audit = ShapleyService.pretest_video(video_audit_request)
        assert audit.ctr_lift_aggregate_pct > 0.0
        assert audit.cti_lift_aggregate_pct > 0.0


# =============================================================================
# FEATURE 10: Equimarginal Hill Saturation Solver
# =============================================================================

class TestFeature10EquimarginalPacingEngine:
    """Verifies closed-form mROAS, zero-sum budget preservation, 20% clamp, and <150ms latency."""

    def test_f10_pacing_solver_closed_form_mroas(self):
        """Verify closed-form mROAS calculation against analytical formula."""
        base = 4.1
        s = 120000.0
        k = 1.5
        spend = 50000.0

        # Formula: Base * (s^k * k * spend^(k-1)) / (spend^k + s^k)^2 * s
        num = base * s * (s ** k) * k * (spend ** (k - 1))
        denom = (spend ** k + s ** k) ** 2
        expected_mroas = num / denom

        actual_mroas = EquimarginalPacingEngine.marginal_roas(spend, base, s, k)
        assert abs(actual_mroas - expected_mroas) < 1e-4

    def test_f10_pacing_solver_zero_sum_budget_preservation(self, standard_pacing_request):
        """Verify exact zero-sum budget preservation: sum(Delta Spend) == $0.00."""
        res = pacing_engine.solve(standard_pacing_request)
        assert res.zero_sum_satisfied is True
        assert abs(res.budget_net_delta) < 0.05
        assert abs(res.total_allocated_budget - res.total_current_budget) < 0.05

    def test_f10_pacing_solver_20pct_daily_pacing_clamp(self, standard_pacing_request):
        """Verify strict +/- 20% daily pacing clamp across all channels."""
        res = pacing_engine.solve(standard_pacing_request)
        assert res.pacing_clamp_satisfied is True
        for ch in res.channel_allocations:
            lower = ch.current_spend * 0.80 - 0.01
            upper = ch.current_spend * 1.20 + 0.01
            assert lower <= ch.allocated_spend <= upper, (
                f"Channel {ch.channel} allocated ${ch.allocated_spend} outside [{lower}, {upper}]"
            )

    def test_f10_pacing_solver_latency_under_150ms(self, standard_pacing_request):
        """Verify solver execution latency is strictly under 150.0 ms."""
        t0 = time.perf_counter()
        res = pacing_engine.solve(standard_pacing_request)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        assert elapsed_ms < 150.0, f"Solver latency {elapsed_ms:.2f}ms exceeded 150ms threshold"
        assert res.solver_latency_ms < 150.0

    def test_f10_pacing_solver_positive_revenue_uplift(self, standard_pacing_request):
        """Verify optimal allocation generates positive or non-negative revenue uplift."""
        res = pacing_engine.solve(standard_pacing_request)
        assert res.total_projected_revenue > 0.0
        assert res.portfolio_d7_roas > 0.0
        assert res.revenue_uplift_pct >= 0.0

    def test_f10_pacing_solver_s_curve_points_generated(self, standard_pacing_request):
        """Verify high-resolution S-curve points generated for each channel."""
        res = pacing_engine.solve(standard_pacing_request)
        for ch in res.channel_allocations:
            assert len(ch.s_curve_points) >= 20
            for pt in ch.s_curve_points:
                assert pt.spend >= 0.0
                assert pt.projected_revenue >= 0.0


# =============================================================================
# FEATURE 11: Backend Routers & HTTP Endpoints
# =============================================================================

class TestFeature11BackendHTTPRouters:
    """Verifies FastAPI endpoints, CORS, X-Process-Time-Ms headers, and health checks."""

    def test_f11_post_intake_simulate_endpoint(self, test_client: TestClient, standard_eafc_brief):
        """Verify POST /api/v1/intake/simulate returns HTTP 200 with forecast."""
        payload = standard_eafc_brief.model_dump()
        response = test_client.post("/api/v1/intake/simulate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["kpi_projection"]["projected_installs"] == 364000
        assert data["kpi_projection"]["blended_cpi_usd"] == 4.12
        assert data["kpi_projection"]["day7_roas"] == 3.42
        assert data["fatigue_analysis"]["collision_detected"] is True
        assert data["fatigue_analysis"]["net_bookings_risk_usd"] == 420000.0

    def test_f11_post_shapley_pretest_endpoint(self, test_client: TestClient, video_audit_request):
        """Verify POST /api/v1/shapley/pretest returns HTTP 200 with 2D Shapley audit."""
        payload = video_audit_request.model_dump()
        response = test_client.post("/api/v1/shapley/pretest", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "funnel_balance_index" in data
        assert len(data["features"]) >= 2

    def test_f11_post_meridian_solve_endpoint(self, test_client: TestClient, standard_pacing_request):
        """Verify POST /api/v1/meridian/solve returns HTTP 200 with zero-sum allocation."""
        payload = standard_pacing_request.model_dump()
        response = test_client.post("/api/v1/meridian/solve", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["zero_sum_satisfied"] is True
        assert data["pacing_clamp_satisfied"] is True
        assert data["solver_latency_ms"] < 150.0

    def test_f11_process_time_header_injected(self, test_client: TestClient):
        """Verify X-Process-Time-Ms header is present on HTTP responses."""
        response = test_client.get("/healthz")
        assert response.status_code == 200
        assert "x-process-time-ms" in response.headers
        latency = float(response.headers["x-process-time-ms"])
        assert latency >= 0.0

    def test_f11_cors_headers_present(self, test_client: TestClient):
        """Verify CORS middleware responds to pre-flight requests."""
        response = test_client.options(
            "/api/v1/intake/simulate",
            headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"}
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") in {"*", "http://localhost:3000"}

    def test_f11_health_check_endpoint(self, test_client: TestClient):
        """Verify GET /healthz returns status UP."""
        response = test_client.get("/healthz")
        assert response.status_code == 200
        assert response.json()["status"] == "UP"


# =============================================================================
# FEATURE 12: Backend Pytest Suite & Service Integration
# =============================================================================

class TestFeature12BackendIntegration:
    """Verifies service interactions, channel spend math, and benchmark throughput."""

    def test_f12_intake_channel_breakdown_sum_equals_budget(self, standard_eafc_brief):
        """Verify sum of channel breakdown spends equals total budget."""
        res = CampaignIntakeService.simulate(standard_eafc_brief)
        total_ch_spend = sum(ch.allocated_spend for ch in res.channel_breakdown)
        assert abs(total_ch_spend - standard_eafc_brief.budget_usd) < 1.0

    def test_f12_pacing_solver_8_channel_portfolio(self):
        """Verify solver scales to 8 channels with zero-sum preservation and <150ms."""
        channels = [
            ChannelSpendConstraint(channel=f"Channel {i}", current_spend=100000.0, base_roas=3.0 + (i * 0.2), half_saturation_s=50000.0, hill_slope_k=1.2 + (i * 0.1))
            for i in range(8)
        ]
        req = EquimarginalOptimizationRequest(campaign_id="camp-8ch", total_budget=800000.0, channels=channels, max_daily_shift_pct=0.20)
        res = pacing_engine.solve(req)
        assert res.zero_sum_satisfied is True
        assert res.pacing_clamp_satisfied is True
        assert res.solver_latency_ms < 150.0

    def test_f12_backend_error_handling_invalid_payload(self, test_client: TestClient):
        """Verify 422 Unprocessable Entity on malformed brief payload."""
        response = test_client.post("/api/v1/intake/simulate", json={"budget_usd": -100.0})
        assert response.status_code == 422

    def test_f12_backend_concurrent_solver_benchmark(self, standard_pacing_request):
        """Verify 20 solver iterations complete with average latency < 50ms."""
        latencies = []
        for _ in range(20):
            t0 = time.perf_counter()
            res = pacing_engine.solve(standard_pacing_request)
            latencies.append((time.perf_counter() - t0) * 1000.0)
            assert res.zero_sum_satisfied is True

        avg_latency = sum(latencies) / len(latencies)
        assert avg_latency < 50.0, f"Average solver latency {avg_latency:.2f}ms exceeded 50ms"
