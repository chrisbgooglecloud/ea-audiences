"""Unit Tests for Backend Schemas, Mathematical Solvers, and Bayesian Calibration."""

import pytest
import math
import numpy as np

from app.schemas.creative import (
    SurfaceEnum,
    FunnelStageEnum,
    FranchiseEnum,
    MediaTypeEnum,
    DetectedMechanic,
    CreativeMetadataSchema,
)
from app.schemas.attribution import QuadrantEnum, Tactical9GridPoint
from app.schemas.meridian import (
    CausalLiftExperiment,
    PriorCalibrationRequest,
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
)
from app.services.pacing_engine import pacing_engine
from app.services.meridian_prior_tuner import prior_tuner
from app.services.attribution_engine import attribution_engine
from app.services.geospine_service import geospine_service
from app.services.data_generator import data_generator


def test_ea_surfaces_and_funnel_stages():
    """Verify all 6 EA surfaces and 3 funnel stages are defined."""
    surfaces = list(SurfaceEnum)
    assert len(surfaces) == 6
    assert SurfaceEnum.EA_APP_LAUNCHER in surfaces
    assert SurfaceEnum.IN_GAME_STORE in surfaces
    assert SurfaceEnum.STADIUM_BOARDS in surfaces
    assert SurfaceEnum.PAUSE_SCREENS in surfaces
    assert SurfaceEnum.MOBILE_COMPANION in surfaces
    assert SurfaceEnum.STREAMING_OVERLAYS in surfaces

    stages = list(FunnelStageEnum)
    assert len(stages) == 3
    assert FunnelStageEnum.ToFu_Exploration in stages
    assert FunnelStageEnum.MoFu_Progression in stages
    assert FunnelStageEnum.BoFu_Conversion in stages


def test_tactical_9grid_quadrants():
    """Verify all 9 quadrants of Tactical 9-Grid are defined and mapped correctly."""
    quadrants = list(QuadrantEnum)
    assert len(quadrants) == 9

    # Test all 9 boundary conditions
    cases = [
        # (freq, roas, expected_quadrant)
        (10.0, 1.50, QuadrantEnum.GOLD_MINES),
        (40.0, 1.50, QuadrantEnum.CORE_DRIVERS),
        (80.0, 1.50, QuadrantEnum.SATURATED_STARS),
        (10.0, 1.10, QuadrantEnum.UNTAPPED),
        (40.0, 1.10, QuadrantEnum.WORKHORSES),
        (80.0, 1.10, QuadrantEnum.EFFICIENCY_RISKS),
        (10.0, 0.50, QuadrantEnum.NOISE),
        (40.0, 0.50, QuadrantEnum.UNDERPERFORMERS),
        (80.0, 0.50, QuadrantEnum.MONEY_PITS),
    ]

    for freq, roas, expected_q in cases:
        q, action = attribution_engine.classify_quadrant(freq, roas)
        assert q == expected_q, f"Failed for freq={freq}, roas={roas}: got {q}, expected {expected_q}"
        assert len(action) > 5


def test_equimarginal_hill_solver_invariants():
    """Verify Equimarginal Hill Saturation solver satisfies mathematical invariants:
    1. Zero-Sum Portfolio Reallocation: sum(allocated) == sum(current) within $0.01
    2. Strict 20% Pacing Clamp: 0.80 * x_i <= x_i* <= 1.20 * x_i
    3. Solver latency < 200ms
    """
    channels = [
        ChannelSpendConstraint(channel="YouTube", current_spend=100000.0, base_roas=2.5, half_saturation_s=50000.0, hill_slope_k=1.3),
        ChannelSpendConstraint(channel="Meta", current_spend=120000.0, base_roas=2.7, half_saturation_s=60000.0, hill_slope_k=1.35),
        ChannelSpendConstraint(channel="TikTok", current_spend=80000.0, base_roas=3.0, half_saturation_s=40000.0, hill_slope_k=1.4),
        ChannelSpendConstraint(channel="Programmatic 3D", current_spend=50000.0, base_roas=1.8, half_saturation_s=35000.0, hill_slope_k=1.2),
    ]
    total_current = sum(ch.current_spend for ch in channels)

    req = EquimarginalOptimizationRequest(
        campaign_id="camp-test-invariants",
        franchise="Apex Legends",
        channels=channels,
        max_daily_shift_pct=0.20,
        enforce_zero_sum=True,
    )

    resp = pacing_engine.solve(req)

    # Invariant 1: Zero-Sum Reallocation
    assert abs(resp.budget_net_delta) < 0.05
    assert abs(resp.total_allocated_budget - total_current) < 0.05
    assert resp.zero_sum_satisfied is True

    # Invariant 2: Strict 20% Pacing Clamp
    assert resp.pacing_clamp_satisfied is True
    for ch_res in resp.channel_allocations:
        assert 0.80 * ch_res.current_spend - 0.01 <= ch_res.allocated_spend <= 1.20 * ch_res.current_spend + 0.01

    # Invariant 3: Performance Latency
    assert resp.solver_latency_ms < 200.0

    # Invariant 4: S-Curve generated
    for ch_res in resp.channel_allocations:
        assert len(ch_res.s_curve_points) > 0
        assert ch_res.marginal_roas > 0.0


def test_meridian_bayesian_prior_calibration():
    """Verify Bayesian log-normal prior calibration produces mathematically sound parameters."""
    experiments = data_generator.get_causal_lift_experiments()
    req = PriorCalibrationRequest(
        franchise="Apex Legends",
        experiments=experiments,
    )

    resp = prior_tuner.calibrate(req)
    assert resp.status == "SUCCESS"
    assert len(resp.calibrated_priors) >= 6

    for ch_name, prior in resp.calibrated_priors.items():
        assert prior.prior_std_sigma > 0.0
        assert prior.pooled_roas_estimate > 0.0
        assert prior.half_saturation_prior_s > 0.0
        assert prior.hill_slope_prior_k >= 0.8
        # Test log-normal expected value identity: E[X] = exp(mu + sigma^2 / 2)
        reconstructed_mean = math.exp(prior.prior_mean_mu + (prior.prior_std_sigma ** 2) / 2.0)
        assert math.isclose(reconstructed_mean, prior.pooled_roas_estimate, rel_tol=0.05)


def test_geospine_and_combinatorial_features():
    """Verify 210 DMAs and combinatorial feature logic."""
    dmas = geospine_service.get_all_dmas()
    assert dmas.total_dmas == 210

    weather = geospine_service.get_weather_shocks()
    assert weather.total_records >= 25

    trends = geospine_service.get_trend_signals("Apex Legends")
    assert len(trends) >= 25

    comb = geospine_service.compute_combinatorial_features("Apex Legends")
    assert comb.total_features > 0
    for rec in comb.records[:5]:
        assert rec.combinatorial_lift_score > 0.0


def test_shap_decomposition_invariants():
    """Verify SHAP attributions sum to 100% relative importance."""
    raw_features = data_generator.get_tactical_9grid_features()
    feature_names = [f["feature_name"] for f in raw_features]
    activations = {f["feature_name"]: 1.0 for f in raw_features}
    weights = {f["feature_name"]: (f["roas_impact_y"] - 1.0) for f in raw_features}

    shap_results = attribution_engine.calculate_shap_attributions(
        feature_names=feature_names,
        feature_activations=activations,
        weights=weights,
        base_roas=1.0,
    )
    assert len(shap_results) == len(raw_features)
    total_rel_imp = sum(s.relative_importance_pct for s in shap_results)
    assert math.isclose(total_rel_imp, 100.0, rel_tol=1e-3)


def test_pacing_engine_extreme_budget_stress():
    """Verify pacing engine clamps extreme budget allocation requests to 20% limit."""
    channels = [
        ChannelSpendConstraint(channel="YouTube", current_spend=200000.0, base_roas=2.2, half_saturation_s=80000.0, hill_slope_k=1.25),
        ChannelSpendConstraint(channel="Meta", current_spend=300000.0, base_roas=2.8, half_saturation_s=100000.0, hill_slope_k=1.40),
        ChannelSpendConstraint(channel="TikTok", current_spend=150000.0, base_roas=3.2, half_saturation_s=60000.0, hill_slope_k=1.50),
        ChannelSpendConstraint(channel="Programmatic 3D", current_spend=80000.0, base_roas=1.7, half_saturation_s=40000.0, hill_slope_k=1.15),
        ChannelSpendConstraint(channel="Twitch Influencers", current_spend=120000.0, base_roas=3.0, half_saturation_s=50000.0, hill_slope_k=1.35),
        ChannelSpendConstraint(channel="Connected TV", current_spend=150000.0, base_roas=1.5, half_saturation_s=90000.0, hill_slope_k=1.10),
    ]
    total_budget = sum(ch.current_spend for ch in channels)

    req = EquimarginalOptimizationRequest(
        campaign_id="camp-stress-test",
        franchise="Apex Legends",
        channels=channels,
        max_daily_shift_pct=0.20,
        enforce_zero_sum=True,
    )

    resp = pacing_engine.solve(req)
    assert resp.zero_sum_satisfied is True
    assert resp.pacing_clamp_satisfied is True
    assert resp.max_shift_observed_pct <= 20.01
    assert abs(resp.budget_net_delta) < 0.05
    assert resp.solver_latency_ms < 50.0
