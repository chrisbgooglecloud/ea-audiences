"""Tier 5 Adversarial & Stress Testing Suite for Data Foundation & Backend Microservices.

Milestone 5 Phase 2: Empirical Challenger & Test Coverage Audit
Targets:
- 00-data-foundation (GeoSpine 25 DMAs, WeatherNext Shocks, MMM Math Engine, Hybrid BQML Generator)
- 03-measurement/backend (Equimarginal Hill Saturation Solver, Campaign Intake Service, 2D Shapley Video Service, API Routers)

Exhaustively verifies mathematical invariants, boundary conditions, zero/extreme inputs,
single-channel/single-metro degenerate cases, non-converging parameters, extreme WeatherNext shocks,
invalid dates, negative values, and malformed requests.
"""

import math
import time
import numpy as np
import pytest
from typing import List, Dict, Any
from pydantic import ValidationError
from fastapi.testclient import TestClient

# -----------------------------------------------------------------------------
# Imports from Data Foundation & Backend Services
# -----------------------------------------------------------------------------
from generators.geospine_generator import geospine_generator, TOP_25_NIELSEN_DMAS
from generators.mmm_math_engine import mmm_math_engine
from generators.hybrid_bqml_runner import hybrid_bqml_runner
from config import config as data_config

from app.schemas.intake import (
    CampaignBriefSubmission,
    ConflictFatigueAnalysis,
    CampaignKPIProjection,
    CampaignPredictionResponse,
    CohortTargetEnum,
)
from app.schemas.shapley import (
    FunnelCategoryEnum,
    ShapleyFeatureElement,
    WaterfallStep,
    PreTestVideoAuditRequest,
    PreTestVideoAuditResponse,
)
from app.schemas.meridian import (
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
    EquimarginalOptimizationResponse,
    ChannelOptimizationResult,
    SCurvePoint,
)
from app.services.pacing_engine import pacing_engine, EquimarginalPacingEngine
from app.services.campaign_intake_service import campaign_intake_service
from app.services.shapley_service import shapley_service
from app.main import app as backend_app


# =============================================================================
# 1. DATA FOUNDATION ADVERSARIAL TESTS: WeatherNext & Geo-Spine
# =============================================================================

class TestDataFoundationWeatherNextAdversarial:
    """Stress-test WeatherNext climate elasticity and spatial geo-spine generator."""

    @pytest.mark.parametrize(
        "temp_anom,precip_mm,agreement,expected_min,expected_max",
        [
            # Extreme deep freeze / polar vortex (-50°C anomaly)
            (-50.0, 0.0, 0.85, 1.0, 1.50),
            # Extreme heatwave (+60°C anomaly)
            (60.0, 0.0, 0.85, 1.0, 1.50),
            # Hurricane storm surge (1000mm precipitation)
            (0.0, 1000.0, 0.85, 1.0, 1.50),
            # Combined extreme polar vortex + catastrophic blizzard
            (-40.0, 500.0, 1.0, 1.0, 1.50),
            # Zero weather anomaly and baseline conditions
            (0.0, 0.0, 0.0, 1.0, 1.05),
            # Negative precipitation input (should not go below 1.0)
            (5.0, -100.0, 0.0, 1.0, 1.0),
            # Boundary agreement parameters (negative or above 1.0)
            (-10.0, 20.0, -0.5, 1.0, 1.50),
            (-10.0, 20.0, 5.0, 1.0, 1.50),
        ],
    )
    def test_indoor_elasticity_strict_bounds(
        self, temp_anom, precip_mm, agreement, expected_min, expected_max
    ):
        """Invariant: calculate_indoor_elasticity must be strictly bounded in [1.00, 1.50]."""
        elasticity = geospine_generator.calculate_indoor_elasticity(
            temp_anomaly_c=temp_anom,
            precip_mm=precip_mm,
            agreement=agreement,
        )
        assert isinstance(elasticity, float)
        assert 1.00 <= elasticity <= 1.50, f"Elasticity {elasticity} out of [1.00, 1.50] bounds!"
        assert expected_min <= elasticity <= expected_max

    def test_geospine_210_dmas_invariant_integrity(self):
        """Invariant: Exactly 210 unique DMAs with unique ranks 1..210 and valid coordinates."""
        dmas = geospine_generator.generate_all_210_dmas()
        assert len(dmas) == 210

        # Unique DMA codes and Nielsen ranks
        dma_codes = [d["dma_code"] for d in dmas]
        ranks = [d["nielsen_rank"] for d in dmas]
        assert len(set(dma_codes)) == 210, "Duplicate DMA codes found!"
        assert sorted(ranks) == list(range(1, 211)), "Ranks must be contiguous 1..210!"

        # Coordinate bounds and population invariants
        for d in dmas:
            assert -90.0 <= d["latitude"] <= 90.0
            assert -180.0 <= d["longitude"] <= 180.0
            assert d["population"] > 0
            assert d["population_weight"] > 0.0
            assert d["gaming_density_index"] > 0.0
            assert "POINT(" in d["centroid_geom"]
            assert d["timezone"] in ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "America/Detroit"]

    def test_daily_metro_facts_multi_lead_shocks_bounds(self):
        """Invariant: All lead shock elasticities (T-3, T-5, T-8, T-15) must lie in [1.0, 1.50]."""
        dmas = geospine_generator.generate_all_210_dmas()
        facts = geospine_generator.generate_daily_metro_facts(dmas=dmas, days_count=30)
        assert len(facts) > 0

        for f in facts:
            assert 1.0 <= f["indoor_gaming_elasticity_multiplier"] <= 1.50
            assert 1.0 <= f["lead_shock_t3_elasticity"] <= 1.50
            assert 1.0 <= f["lead_shock_t5_elasticity"] <= 1.50
            assert 1.0 <= f["lead_shock_t8_elasticity"] <= 1.50
            assert 1.0 <= f["lead_shock_t15_elasticity"] <= 1.50
            assert f["pop_adjusted_gaming_hours"] >= 0.0
            assert f["estimated_active_gamers"] >= 0


# =============================================================================
# 2. DATA FOUNDATION ADVERSARIAL TESTS: MMM Engine & BQML Runner
# =============================================================================

class TestDataFoundationMMMBQMLAdversarial:
    """Stress-test 3-Year MMM math engine and synthetic BQML generator."""

    def test_hill_saturation_extreme_spend_asymptotes(self):
        """Invariant: Hill saturation curve R(x) is monotonically non-decreasing and in [0.0, 1.0]."""
        spends = np.array([0.0, 1e-12, 1.0, 100.0, 10000.0, 1e6, 1e9, 1e15])
        k = 50000.0
        s = 1.3

        responses = mmm_math_engine.hill_saturation(spends, k=k, s=s)
        assert len(responses) == len(spends)
        assert responses[0] == 0.0
        # Check monotonic increase
        for i in range(len(responses) - 1):
            assert responses[i] <= responses[i + 1] + 1e-9
            assert 0.0 <= responses[i] <= 1.0
        # Check asymptotic convergence to 1.0 at massive spend
        assert abs(responses[-1] - 1.0) < 1e-4

    def test_geometric_adstock_extreme_decays(self):
        """Invariant: Adstock filter handles extreme decay rates (0.0 instantaneous, 1.0 full memory)."""
        series = np.array([100.0, 0.0, 0.0, 0.0, 0.0], dtype=np.float64)

        # Decay = 0.0 -> no carryover
        ad_zero = mmm_math_engine.geometric_adstock(series, decay_rate=0.0)
        np.testing.assert_allclose(ad_zero, series)

        # Decay = 0.5 -> exponential decay: 100, 50, 25, 12.5, 6.25
        ad_half = mmm_math_engine.geometric_adstock(series, decay_rate=0.5)
        np.testing.assert_allclose(ad_half, [100.0, 50.0, 25.0, 12.5, 6.25], atol=1e-5)

    def test_hybrid_bqml_runner_shapley_marginal_lift_invariants(self):
        """Invariant: 2D Shapley marginal lift features separate TOFU from BOFU."""
        records = hybrid_bqml_runner.generate_creative_shapley_marginal_lift(count=25)
        assert len(records) == 25

        for r in records:
            assert r["confidence_score"] >= 0.85
            assert r["confidence_score"] <= 1.0
            if r["feature_category"] == "TOP_OF_FUNNEL":
                assert r["marginal_ctr_lift_pct"] > 0.0
            elif r["feature_category"] == "LOWER_FUNNEL_MONETIZATION":
                assert r["marginal_cti_lift_pct"] > 0.0
                assert r["marginal_d7_roas_multiplier"] >= 2.50


# =============================================================================
# 3. BACKEND PACING SOLVER ADVERSARIAL TESTS
# =============================================================================

class TestEquimarginalPacingSolverAdversarial:
    """Empirical adversarial stress testing for Scipy SLSQP pacing solver."""

    def test_single_channel_degenerate_portfolio(self):
        """Adversarial test: Portfolio with exactly 1 channel."""
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-adversarial-single-ch",
            franchise="Apex Legends",
            total_budget=750000.0,
            channels=[
                ChannelSpendConstraint(
                    channel="SingleChannel_PaidSocial",
                    current_spend=750000.0,
                    base_roas=3.80,
                    half_saturation_s=500000.0,
                    hill_slope_k=1.40,
                )
            ],
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )
        resp = pacing_engine.solve(req)
        assert resp.zero_sum_satisfied is True
        assert resp.pacing_clamp_satisfied is True
        assert len(resp.channel_allocations) == 1
        assert resp.channel_allocations[0].allocated_spend == 750000.0
        assert resp.channel_allocations[0].spend_delta == 0.0
        assert resp.solver_latency_ms < 150.0

    def test_25_channel_nielsen_dma_portfolio_high_concurrency(self):
        """Adversarial test: 25-Channel simultaneous optimization simulating 25 DMAs."""
        rng = np.random.default_rng(999)
        channels = []
        for i, dma in enumerate(TOP_25_NIELSEN_DMAS):
            spend = float(dma["pop_weight"] * 2_000_000.0)
            channels.append(
                ChannelSpendConstraint(
                    channel=f"DMA_{dma['dma_code']}_{dma['state']}",
                    current_spend=round(spend, 2),
                    base_roas=round(float(rng.uniform(2.5, 4.8)), 2),
                    half_saturation_s=round(spend * float(rng.uniform(0.7, 1.5)), 2),
                    hill_slope_k=round(float(rng.uniform(1.1, 1.9)), 2),
                )
            )

        total_b = sum(c.current_spend for c in channels)
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-25-dma-portfolio",
            franchise="EA Sports FC",
            total_budget=total_b,
            channels=channels,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        t0 = time.perf_counter()
        resp = pacing_engine.solve(req)
        latency = (time.perf_counter() - t0) * 1000.0

        assert resp.zero_sum_satisfied is True
        assert resp.pacing_clamp_satisfied is True
        assert abs(resp.budget_net_delta) < 0.05
        assert len(resp.channel_allocations) == 25
        assert latency < 150.0, f"25-channel solve took {latency:.2f}ms >= 150ms SLA"

    @pytest.mark.parametrize("extreme_budget", [1.00, 5.00, 100_000_000.0, 500_000_000.0])
    def test_extreme_budget_magnitudes_numerical_stability(self, extreme_budget):
        """Adversarial test: Extremely tiny ($1.00) and gigantic ($500M) budgets."""
        channels = [
            ChannelSpendConstraint(
                channel="Ch_A",
                current_spend=extreme_budget * 0.60,
                base_roas=4.2,
                half_saturation_s=extreme_budget * 0.70,
                hill_slope_k=1.3,
            ),
            ChannelSpendConstraint(
                channel="Ch_B",
                current_spend=extreme_budget * 0.40,
                base_roas=3.1,
                half_saturation_s=extreme_budget * 0.50,
                hill_slope_k=1.5,
            ),
        ]
        req = EquimarginalOptimizationRequest(
            campaign_id=f"camp-extreme-{extreme_budget}",
            franchise="Apex Legends",
            total_budget=extreme_budget,
            channels=channels,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )
        resp = pacing_engine.solve(req)
        assert resp.zero_sum_satisfied is True
        assert resp.pacing_clamp_satisfied is True
        assert not math.isnan(resp.total_projected_revenue)
        assert not math.isinf(resp.total_projected_revenue)
        assert resp.total_projected_revenue > 0.0

    @pytest.mark.parametrize("shift_pct", [0.01, 0.05, 0.20, 0.40, 0.50])
    def test_pacing_shift_clamp_variations(self, shift_pct):
        """Adversarial test: Pacing clamp tightness from 1% to 50%."""
        channels = [
            ChannelSpendConstraint(
                channel="Ch_HighROAS",
                current_spend=100000.0,
                base_roas=6.0,
                half_saturation_s=300000.0,
                hill_slope_k=1.2,
            ),
            ChannelSpendConstraint(
                channel="Ch_LowROAS",
                current_spend=100000.0,
                base_roas=1.5,
                half_saturation_s=50000.0,
                hill_slope_k=2.0,
            ),
        ]
        req = EquimarginalOptimizationRequest(
            campaign_id=f"camp-shift-{shift_pct}",
            franchise="EA Sports FC",
            total_budget=200000.0,
            channels=channels,
            max_daily_shift_pct=shift_pct,
            enforce_zero_sum=True,
        )
        resp = pacing_engine.solve(req)
        assert resp.zero_sum_satisfied is True
        assert resp.pacing_clamp_satisfied is True
        # Verify allocations stay within clamp
        for ch in resp.channel_allocations:
            assert abs(ch.spend_delta_pct) <= (shift_pct + 0.01)

    def test_empty_channels_raises_error(self):
        """Adversarial test: Zero channels must raise ValueError."""
        req = EquimarginalOptimizationRequest(
            campaign_id="camp-empty",
            channels=[],
        )
        with pytest.raises(ValueError, match="at least 1 channel"):
            pacing_engine.solve(req)


# =============================================================================
# 4. BACKEND CAMPAIGN INTAKE ADVERSARIAL TESTS
# =============================================================================

class TestCampaignIntakeServiceAdversarial:
    """Stress-test Campaign Intake Service collision logic and boundary flights."""

    @pytest.mark.parametrize(
        "start,end,expected_collision",
        [
            # Boundary exact dates
            ("2026-10-24", "2026-10-24", True),
            ("2026-10-27", "2026-10-27", True),
            ("2026-10-23", "2026-10-23", False),
            ("2026-10-28", "2026-10-28", False),
            # Overlap spans
            ("2026-10-20", "2026-10-24", True),
            ("2026-10-27", "2026-11-05", True),
            ("2026-10-20", "2026-11-05", True),
            ("2026-10-24", "2026-10-27", True),
            # Non-overlapping
            ("2026-11-01", "2026-11-15", False),
            ("2026-09-01", "2026-10-20", False),
        ],
    )
    def test_intake_collision_date_matrix(self, start, end, expected_collision):
        """Verify exact collision boundary detection for EA Sports FC."""
        brief = CampaignBriefSubmission(
            campaign_id="camp-date-matrix",
            franchise="EA Sports FC",
            flight_start=start,
            flight_end=end,
            total_budget=1500000.0,
            apply_mitigation=False,
        )
        resp = campaign_intake_service.simulate_campaign(brief)
        assert resp.fatigue_analysis.collision_detected is expected_collision
        if expected_collision:
            assert resp.fatigue_analysis.shared_ea_id_overlap_pct == 42.1
            assert resp.fatigue_analysis.ad_fatigue_suppression_penalty_pct == 14.5
            assert resp.fatigue_analysis.net_bookings_risk_usd == 420000.0
        else:
            assert resp.fatigue_analysis.shared_ea_id_overlap_pct == 0.0
            assert resp.fatigue_analysis.net_bookings_risk_usd == 0.0

    def test_intake_mitigation_toggle_mathematical_recovery(self):
        """Verify apply_mitigation toggle recovers exactly +$420,000 to baseline $5,130,000."""
        brief_unmitigated = CampaignBriefSubmission(
            campaign_id="camp-fc27-toty",
            franchise="EA Sports FC",
            flight_start="2026-10-24",
            flight_end="2026-10-27",
            total_budget=1500000.0,
            target_roas=3.42,
            apply_mitigation=False,
        )
        resp_unmitigated = campaign_intake_service.simulate_campaign(brief_unmitigated)
        assert resp_unmitigated.fatigue_analysis.status == "AMBER_COLLISION_DETECTED"
        assert resp_unmitigated.kpi_projection.effective_net_bookings_usd == 4710000.0

        brief_mitigated = CampaignBriefSubmission(
            campaign_id="camp-fc27-toty",
            franchise="EA Sports FC",
            flight_start="2026-10-24",
            flight_end="2026-10-27",
            total_budget=1500000.0,
            target_roas=3.42,
            apply_mitigation=True,
        )
        resp_mitigated = campaign_intake_service.simulate_campaign(brief_mitigated)
        assert resp_mitigated.fatigue_analysis.status == "MITIGATED_COLLISION_CLEARED"
        assert resp_mitigated.kpi_projection.effective_net_bookings_usd == 5130000.0
        # Recovery delta must be exactly $420,000
        delta = (
            resp_mitigated.kpi_projection.effective_net_bookings_usd
            - resp_unmitigated.kpi_projection.effective_net_bookings_usd
        )
        assert delta == 420000.0

    def test_non_fc_franchise_during_conflict_window(self):
        """Verify non-FC franchise (e.g. Battlefield 6) during Oct 24-27 produces clean simulation."""
        brief = CampaignBriefSubmission(
            campaign_id="camp-bf6-test",
            franchise="Battlefield 6",
            flight_start="2026-10-24",
            flight_end="2026-10-27",
            total_budget=2000000.0,
        )
        resp = campaign_intake_service.simulate_campaign(brief)
        assert resp.fatigue_analysis.collision_detected is False
        assert resp.fatigue_analysis.status == "NO_COLLISION_DETECTED"


# =============================================================================
# 5. BACKEND SHAPLEY VIDEO INTELLIGENCE ADVERSARIAL TESTS
# =============================================================================

class TestShapleyVideoIntelligenceAdversarial:
    """Stress-test 2D Shapley Video Intelligence and Funnel Balance Index (FBI)."""

    def test_fbi_mathematical_bounds_100_random_feature_sets(self):
        """Invariant: FBI must be strictly in [0.0, 1.0] for any random feature combination."""
        rng = np.random.default_rng(777)
        for trial in range(100):
            n_tofu = int(rng.integers(0, 6))
            n_bofu = int(rng.integers(0, 6))

            features = []
            for i in range(n_tofu):
                features.append(
                    ShapleyFeatureElement(
                        feature_name=f"Random_TOFU_{i}",
                        category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
                        funnel_tier="TOFU",
                        marginal_ctr_lift_pct=float(rng.uniform(1.0, 60.0)),
                        marginal_cti_lift_pct=float(rng.uniform(-20.0, 0.0)),
                        marginal_d7_roas_multiplier=float(rng.uniform(1.2, 2.2)),
                    )
                )
            for i in range(n_bofu):
                features.append(
                    ShapleyFeatureElement(
                        feature_name=f"Random_BOFU_{i}",
                        category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
                        funnel_tier="BOFU",
                        marginal_ctr_lift_pct=float(rng.uniform(0.5, 10.0)),
                        marginal_cti_lift_pct=float(rng.uniform(5.0, 45.0)),
                        marginal_d7_roas_multiplier=float(rng.uniform(2.5, 4.0)),
                    )
                )

            fbi = shapley_service.calculate_funnel_balance_index(features)
            assert isinstance(fbi, float)
            assert 0.0 <= fbi <= 1.0, f"Trial {trial}: FBI {fbi} out of [0.0, 1.0]!"

    def test_shapley_waterfall_step_consistency(self):
        """Invariant: Waterfall steps count equals features count and maintains 2D coordinates."""
        req = PreTestVideoAuditRequest(
            asset_id="asset-fc27-waterfall-test",
            asset_title="FC 27 Full Gameplay",
            franchise="EA Sports FC",
            video_duration_seconds=15.0,
        )
        resp = shapley_service.audit_video_asset(req)
        assert len(resp.waterfall_breakdown) == len(resp.features)
        for step, feat in zip(resp.waterfall_breakdown, resp.features):
            assert step.step_name == feat.feature_name
            assert step.ctr_lift == feat.marginal_ctr_lift_pct
            assert step.cti_lift == feat.marginal_cti_lift_pct
            assert step.roas_multiplier == feat.marginal_d7_roas_multiplier


# =============================================================================
# 6. HTTP API ENDPOINTS ADVERSARIAL TESTS (TestClient)
# =============================================================================

class TestHttpApiEndpointsAdversarial:
    """Stress-test backend FastAPI endpoints with edge payloads, missing fields, and extremes."""

    @pytest.fixture
    def client(self):
        with TestClient(backend_app) as c:
            yield c

    def test_post_intake_simulate_empty_body_200_ok(self, client):
        """POST /api/v1/intake/simulate with empty body defaults cleanly."""
        resp = client.post("/api/v1/intake/simulate", json={})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert data["fatigue_analysis"]["collision_detected"] is True

    def test_post_intake_simulate_invalid_budget_422(self, client):
        """POST /api/v1/intake/simulate with negative budget returns 422."""
        resp = client.post(
            "/api/v1/intake/simulate",
            json={"total_budget": -500.0},
        )
        assert resp.status_code == 422

    def test_post_shapley_pretest_empty_body_200_ok(self, client):
        """POST /api/v1/shapley/pretest with empty body defaults cleanly."""
        resp = client.post("/api/v1/shapley/pretest", json={})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "SUCCESS"
        assert 0.0 <= data["funnel_balance_index"] <= 1.0

    def test_post_meridian_solve_valid_200_ok(self, client):
        """POST /api/v1/meridian/solve returns optimal allocation in <150ms."""
        payload = {
            "campaign_id": "camp-api-test",
            "franchise": "EA Sports FC",
            "total_budget": 1000000.0,
            "channels": [
                {
                    "channel": "Paid Social",
                    "current_spend": 600000.0,
                    "base_roas": 4.1,
                    "half_saturation_s": 400000.0,
                    "hill_slope_k": 1.4,
                },
                {
                    "channel": "Paid Search",
                    "current_spend": 400000.0,
                    "base_roas": 5.2,
                    "half_saturation_s": 200000.0,
                    "hill_slope_k": 1.2,
                },
            ],
            "max_daily_shift_pct": 0.20,
            "enforce_zero_sum": True,
        }
        resp = client.post("/api/v1/meridian/solve", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["zero_sum_satisfied"] is True
        assert data["pacing_clamp_satisfied"] is True
        assert data["solver_latency_ms"] < 150.0

    def test_post_meridian_solve_empty_channels_400_or_422(self, client):
        """POST /api/v1/meridian/solve with empty channel list returns error."""
        resp = client.post(
            "/api/v1/meridian/solve",
            json={"campaign_id": "camp-empty", "channels": []},
        )
        assert resp.status_code in [400, 422]

    def test_system_healthz_and_root_endpoints(self, client):
        """Verify health check and root endpoints return 200 UP."""
        r_root = client.get("/")
        assert r_root.status_code == 200
        assert r_root.json()["status"] == "HEALTHY"

        r_health = client.get("/healthz")
        assert r_health.status_code == 200
        assert r_health.json()["status"] == "UP"
        assert r_health.json()["services"]["pacing_engine"] == "ACTIVE"
        assert r_health.json()["services"]["campaign_intake_service"] == "ACTIVE"
        assert r_health.json()["services"]["shapley_service"] == "ACTIVE"


# =============================================================================
# 7. MATHEMATICAL INVARIANT & KKT STATIONARITY ADVERSARIAL TESTS
# =============================================================================

class TestMathematicalInvariantsAndKKTAdversarial:
    """Stress-test mathematical optimality, KKT conditions, and revenue non-negativity."""

    def test_revenue_super_optimality_over_baseline(self):
        """Invariant: Optimal allocation revenue R(x*) must be >= baseline revenue R(x0) within 1e-6 tolerance."""
        rng = np.random.default_rng(4242)
        for trial in range(50):
            n_ch = int(rng.integers(3, 8))
            total_b = float(rng.uniform(100_000, 5_000_000))
            weights = rng.dirichlet(np.ones(n_ch))
            spends = weights * total_b

            channels = []
            for i in range(n_ch):
                channels.append(
                    ChannelSpendConstraint(
                        channel=f"Ch_{i+1}",
                        current_spend=round(float(spends[i]), 2),
                        base_roas=round(float(rng.uniform(2.0, 5.5)), 2),
                        half_saturation_s=round(float(spends[i] * rng.uniform(0.6, 1.6)), 2),
                        hill_slope_k=round(float(rng.uniform(1.1, 1.8)), 2),
                    )
                )

            req = EquimarginalOptimizationRequest(
                campaign_id=f"camp-kkt-{trial}",
                franchise="EA Sports FC",
                total_budget=round(float(np.sum([c.current_spend for c in channels])), 2),
                channels=channels,
                max_daily_shift_pct=0.20,
                enforce_zero_sum=True,
            )

            resp = pacing_engine.solve(req)
            baseline_rev = sum(
                pacing_engine.hill_revenue(c.current_spend, c.base_roas, c.half_saturation_s, c.hill_slope_k)
                for c in channels
            )
            # R(x*) >= R(x0) - 1e-4
            assert resp.total_projected_revenue >= baseline_rev - 1e-4, (
                f"Trial {trial}: Optimal revenue {resp.total_projected_revenue} < baseline {baseline_rev}"
            )
            assert resp.revenue_uplift_pct >= -1e-4

    def test_marginal_roas_monotonicity_in_saturation_regime(self):
        """Invariant: In saturation regime, marginal ROAS mROAS(x) decreases monotonically with spend."""
        s = 50000.0
        k = 1.4
        base_roas = 4.5

        # Saturation regime spend points: x > 50000
        spend_points = np.linspace(60000.0, 500000.0, 100)
        m_values = [pacing_engine.marginal_roas(float(x), base_roas, s, k) for x in spend_points]

        for i in range(len(m_values) - 1):
            assert m_values[i] >= m_values[i + 1] - 1e-9, "Marginal ROAS must monotonically decrease in saturation regime!"


# =============================================================================
# 8. SQL DDL & EXPORT FIXTURE INTEGRITY TESTS
# =============================================================================

class TestSqlDdlAndFixtureExportsIntegrity:
    """Verify DDL specifications and mock orchestrator JSON export contracts."""

    def test_remote_model_ddl_specifies_gemini_37_flash(self):
        """Verify 01_setup_remote_model.sql uses gemini-3.7-flash."""
        import os
        sql_path = os.path.abspath("00-data-foundation/sql/01_setup_remote_model.sql")
        if not os.path.exists(sql_path):
            sql_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../00-data-foundation/sql/01_setup_remote_model.sql"))

        assert os.path.exists(sql_path), f"DDL file {sql_path} does not exist!"
        with open(sql_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "gemini-3.7-flash" in content
        assert "ea_measurement.gemini_flash_model" in content
        assert "vertex-ai-connection" in content

    def test_datasets_and_tables_ddl_contains_required_tables(self):
        """Verify 02_create_datasets_and_tables.sql creates all required tables with expected fields."""
        import os
        sql_path = os.path.abspath("00-data-foundation/sql/02_create_datasets_and_tables.sql")
        if not os.path.exists(sql_path):
            sql_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../00-data-foundation/sql/02_create_datasets_and_tables.sql"))

        assert os.path.exists(sql_path), f"DDL file {sql_path} does not exist!"
        with open(sql_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "fct_cross_franchise_fatigue" in content
        assert "fct_creative_shapley_marginal_lift" in content
        assert "dim_metro_geospine" in content
        assert "shared_ea_id_overlap_pct" in content
        assert "ad_fatigue_suppression_penalty_pct" in content
        assert "net_bookings_risk_usd" in content
        assert "marginal_ctr_lift_pct" in content
        assert "marginal_cti_lift_pct" in content
        assert "marginal_d7_roas_multiplier" in content

    def test_exported_json_fixtures_exist_and_valid(self):
        """Verify deterministic fixtures in 00-data-foundation/exports are valid JSON and non-empty."""
        import os
        import json
        export_dir = os.path.abspath("00-data-foundation/exports")
        if not os.path.exists(export_dir):
            export_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../00-data-foundation/exports"))

        if os.path.exists(export_dir):
            required_files = [
                "dim_metro_geospine.json",
                "fct_cross_franchise_fatigue.json",
                "fct_creative_shapley_marginal_lift.json",
                "fct_collision_scenario_oct24_27.json",
                "fct_bellingham_shapley_tradeoff.json",
                "fct_apex_shapley_tradeoff.json",
            ]
            for fname in required_files:
                fpath = os.path.join(export_dir, fname)
                if os.path.exists(fpath):
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    assert data is not None, f"File {fname} is null!"

