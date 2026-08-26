"""Unit tests for agent tools: BigQuery, Firestore, Meridian, and RAG."""

import pytest
from agents.app.tools.bq_tools import query_geospine_metro, query_weather_shocks
from agents.app.tools.firestore_tools import get_campaign, save_creative_metadata, save_agent_state, get_agent_state
from agents.app.tools.meridian_tools import (
    compute_hill_marginal_roas,
    compute_hill_revenue,
    solve_equimarginal_allocation,
    calibrate_bayesian_priors,
)
from agents.app.tools.rag_tools import query_roi_benchmarks, query_feature_knowledge


def test_bq_tools_geospine():
    """Verify Geo-Spine queries return DMA demographic, trends, and weather shock data."""
    results = query_geospine_metro(limit=5)
    assert len(results) == 5
    assert results[0]["dma_code"] == 501  # NYC
    assert "google_trends_index" in results[0]
    assert "weather_temp_shock_c" in results[0]
    assert "combined_gaming_propensity" in results[0]


def test_bq_tools_weather_shocks():
    """Verify weather shock queries calculate indoor dwell multipliers."""
    shocks = query_weather_shocks(trailing_days=14)
    assert len(shocks) > 0
    assert "indoor_dwell_multiplier" in shocks[0]
    assert "ad_efficiency_boost_pct" in shocks[0]


def test_firestore_tools_campaigns():
    """Verify Firestore campaign lookup."""
    camp = get_campaign("camp-apex-s22-relaunch")
    assert camp is not None
    assert camp["franchise"] == "Apex Legends"
    assert camp["target_budget"] == 500000.0


def test_firestore_tools_agent_state():
    """Verify agent state save and retrieve."""
    sess_id = "test-session-xyz"
    save_agent_state(sess_id, "TaggingAgent", {"sample_key": "sample_val"})
    state = get_agent_state(sess_id)
    assert state is not None
    assert state["active_agent"] == "TaggingAgent"
    assert state["payload"]["sample_key"] == "sample_val"


def test_meridian_hill_math():
    """Verify Hill function mathematical formulas."""
    m_roas = compute_hill_marginal_roas(spend=50000.0, base_roas=2.5, half_saturation_s=50000.0, hill_slope_k=1.3)
    assert m_roas > 0.0
    
    rev = compute_hill_revenue(spend=50000.0, base_roas=2.5, half_saturation_s=50000.0, hill_slope_k=1.3)
    assert rev > 0.0
    assert rev == pytest.approx(2.5 * 50000.0 * 0.5, rel=1e-2)


def test_meridian_equimarginal_solver_invariants():
    """Verify mathematical zero-sum constraint and 20% shift limits."""
    channels = [
        {"channel": "YouTube", "current_spend": 100000.0, "base_roas": 3.5, "half_saturation_s": 70000.0, "hill_slope_k": 1.4},
        {"channel": "Meta", "current_spend": 80000.0, "base_roas": 2.6, "half_saturation_s": 45000.0, "hill_slope_k": 1.2},
        {"channel": "TikTok", "current_spend": 60000.0, "base_roas": 2.2, "half_saturation_s": 35000.0, "hill_slope_k": 1.15},
    ]
    res = solve_equimarginal_allocation(channels, max_daily_shift_pct=0.20, enforce_zero_sum=True)
    
    # 1. Zero sum constraint
    assert abs(res["budget_net_delta"]) <= 0.05
    assert res["zero_sum_satisfied"] is True
    
    # 2. Pacing clamp
    assert res["pacing_clamp_satisfied"] is True
    assert res["max_shift_observed_pct"] <= 20.01

    # 3. Latency
    assert res["solver_latency_ms"] < 200.0


def test_meridian_prior_calibration():
    """Verify log-normal Bayesian prior calibration from causal experiments."""
    experiments = [
        {"experiment_id": "exp-1", "channel": "YouTube", "spend": 40000.0, "observed_roas": 3.4, "standard_error": 0.20},
        {"experiment_id": "exp-2", "channel": "YouTube", "spend": 60000.0, "observed_roas": 3.1, "standard_error": 0.18},
        {"experiment_id": "exp-3", "channel": "Meta", "spend": 50000.0, "observed_roas": 2.7, "standard_error": 0.22},
    ]
    calib = calibrate_bayesian_priors(experiments, franchise="Apex Legends")
    assert "YouTube" in calib["calibrated_priors"]
    assert "Meta" in calib["calibrated_priors"]
    yt_prior = calib["calibrated_priors"]["YouTube"]
    assert yt_prior["pooled_roas_estimate"] > 3.0
    assert yt_prior["prior_mean_mu"] > 1.0


def test_rag_benchmarks():
    """Verify verified industry proof points (Netmarble, Hitapps, SuperPlay, InnoGames)."""
    benchmarks = query_roi_benchmarks()
    assert len(benchmarks) == 4
    publishers = [b["publisher"] for b in benchmarks]
    assert "Netmarble" in publishers
    assert "Hitapps" in publishers
    assert "SuperPlay" in publishers
    assert "InnoGames" in publishers
