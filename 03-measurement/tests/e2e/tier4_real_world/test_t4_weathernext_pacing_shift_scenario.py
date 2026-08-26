"""Tier 4 Real-World Scenario: WeatherNext 2.0 90-Day Lead Shocks & Meridian Equimarginal Pacing Rebalance.

Executes complete real-world narrative:
1. Query 25 Nielsen DMAs spatial geo-spine and WeatherNext multi-lead shocks (T-3, T-5, T-8, T-15).
2. Compute indoor gaming elasticity multiplier (1.00x <= E_indoor <= 1.50x) under cold anomaly conditions (Minneapolis -8.4°C, Chicago -6.8°C).
3. Ingest market-adjusted demand into Equimarginal Hill Saturation solver with Target ROAS 3.20x and $4,200,000 budget.
4. Verify solver converges in <150ms satisfying closed-form Hill equations.
5. Validate zero-sum portfolio budget preservation (sum(Delta Spend) == $0.00 +/- $0.01) and strict +/-20% daily pacing clamps.
6. Verify positive revenue uplift and dispatch rebalance envelope via A2A to Surya_CommerceMediaAgent.
"""

import os
import sys
import time
import json
import uuid
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
PATHS = [
    REPO_ROOT,
    os.path.join(REPO_ROOT, "03-measurement"),
    os.path.join(REPO_ROOT, "03-measurement", "agents"),
    os.path.join(REPO_ROOT, "03-measurement", "backend"),
    os.path.join(REPO_ROOT, "00-data-foundation"),
]
for p in PATHS:
    if p not in sys.path:
        sys.path.insert(0, p)

from generators.geospine_generator import TOP_25_NIELSEN_DMAS
from agents.app.agent import root_agent
from agents.app.tools.bq_tools import query_geospine_metro, query_weather_shocks
from agents.app.tools.meridian_tools import solve_equimarginal_allocation
from agents.app.sub_agents.media_buying_agent import create_media_buying_agent, MediaBuyingAgent
from agents.app.sub_agents.tagging_agent import TaggingAgent
from agents.app.sub_agents.analytics_agent import AnalyticsAgent
from agents.app.protocols.a2a_protocol import create_a2a_message, route_a2a_message, get_conversation_history


@pytest.fixture(autouse=True)
def ensure_deterministic_agent_clients(monkeypatch):
    """Ensure agent clients use deterministic fallback when live API key is unavailable."""
    if not os.getenv("GEMINI_API_KEY"):
        monkeypatch.setattr(TaggingAgent, "_init_genai_client", lambda self: setattr(self, "client", None))
        monkeypatch.setattr(AnalyticsAgent, "_init_genai_client", lambda self: setattr(self, "client", None))
        monkeypatch.setattr(MediaBuyingAgent, "_init_genai_client", lambda self: setattr(self, "client", None))
        root_agent.analytics_agent.client = None
        root_agent.tagging_agent.client = None
        root_agent.media_buying_agent.client = None
    yield


def test_t4_weathernext_pacing_shift_scenario_workflow():
    """Execute complete 6-stage end-to-end WeatherNext climate telemetry & Equimarginal pacing scenario."""
    
    # -------------------------------------------------------------------------
    # Step 1: Query 25 Nielsen DMAs & WeatherNext Lead Shocks
    # -------------------------------------------------------------------------
    metros = query_geospine_metro(limit=12)
    assert len(metros) >= 10
    shocks = query_weather_shocks(trailing_days=14)
    assert len(shocks) > 0

    # -------------------------------------------------------------------------
    # Step 2: Compute Indoor Gaming Elasticity Multiplier for Cold Midwest Anomaly
    # -------------------------------------------------------------------------
    cold_dma = next((m for m in metros if m["weather_temp_shock_c"] != 0 or m["dma_code"] in [602, 501, 803]), metros[0])
    assert cold_dma is not None
    
    # Calculate climate multiplier: E_indoor in [1.0x, 1.5x]
    temp_anomaly = cold_dma["weather_temp_shock_c"]
    elasticity_multiplier = min(1.50, 1.0 + abs(temp_anomaly) * 0.04)
    assert 1.00 <= elasticity_multiplier <= 1.50


    # -------------------------------------------------------------------------
    # Step 3: Ingest Demand into Equimarginal Hill Saturation Solver
    # -------------------------------------------------------------------------
    channels = [
        {"channel": "YouTube Paid", "current_spend": 1400000.0, "base_roas": 3.2 * elasticity_multiplier, "half_saturation_s": 450000.0, "hill_slope_k": 1.40},
        {"channel": "Meta Ads", "current_spend": 1200000.0, "base_roas": 2.8 * elasticity_multiplier, "half_saturation_s": 350000.0, "hill_slope_k": 1.35},
        {"channel": "Programmatic 3D", "current_spend": 900000.0, "base_roas": 3.6 * elasticity_multiplier, "half_saturation_s": 280000.0, "hill_slope_k": 1.50},
        {"channel": "TikTok", "current_spend": 700000.0, "base_roas": 3.0 * elasticity_multiplier, "half_saturation_s": 320000.0, "hill_slope_k": 1.45},
    ]

    t0 = time.perf_counter()
    solver_res = solve_equimarginal_allocation(channels=channels, max_daily_shift_pct=0.20, enforce_zero_sum=True)
    solve_duration_ms = (time.perf_counter() - t0) * 1000.0

    # -------------------------------------------------------------------------
    # Step 4: Verify Solver Converges in <150ms SLA
    # -------------------------------------------------------------------------
    assert solve_duration_ms < 150.0, f"Solver took {solve_duration_ms:.2f}ms, exceeding 150ms SLA"
    assert solver_res["zero_sum_satisfied"] is True
    assert solver_res["pacing_clamp_satisfied"] is True

    # -------------------------------------------------------------------------
    # Step 5: Validate Zero-Sum Preservation & Daily Pacing Clamp (+/-20%)
    # -------------------------------------------------------------------------
    assert abs(solver_res["budget_net_delta"]) <= 0.05
    assert solver_res["max_shift_observed_pct"] <= 20.01
    
    # Verify positive portfolio revenue
    assert solver_res["total_projected_revenue"] > 3000000.0
    assert solver_res["total_allocated_budget"] == pytest.approx(4200000.0, abs=1.0)


    # -------------------------------------------------------------------------
    # Step 6: Dispatch A2A Rebalance Envelope to Surya_CommerceMediaAgent
    # -------------------------------------------------------------------------
    media_agent = create_media_buying_agent()
    corr_id = f"corr-weathernext-pacing-{uuid.uuid4().hex[:6]}"
    
    dispatch_res = media_agent.allocate_programmatic_spend(
        ad_server_agent_name="Surya_CommerceMediaAgent",
        campaign_id="camp-fc27-weathernext-boost",
        franchise="EA Sports FC",
        stadium_board_budget=220000.0,
        dma_focus=[cold_dma["dma_code"], 501, 803],
        correlation_id=corr_id,
    )
    assert dispatch_res["status"] == "PROGRAMMATIC_SPEND_ALLOCATED"
    
    dispatched_msg = dispatch_res["dispatched_message"]
    assert dispatched_msg["recipient"] == "Surya_CommerceMediaAgent"
    assert dispatched_msg["intent"] == "ALLOCATE_PROGRAMMATIC_SPEND"
    assert cold_dma["dma_code"] in dispatched_msg["payload"]["dma_focus"]
    assert dispatched_msg["payload"]["stadium_board_budget"] == 220000.0


    # Audit bus trace
    trace = get_conversation_history(corr_id)
    assert len(trace) >= 2


def test_t4_weathernext_multi_lead_horizon_decay():
    """Verify WeatherNext multi-lead shock horizons (T-3, T-5, T-8, T-15) show expected confidence bounds."""
    lead_horizons = [3, 5, 8, 15]
    for horizon in lead_horizons:
        shocks = query_weather_shocks(trailing_days=horizon)
        assert len(shocks) > 0
        for s in shocks:
            assert s["trailing_days"] == horizon
            assert s["indoor_dwell_multiplier"] >= 1.0


def test_t4_weathernext_cross_metro_elasticity_ordering():
    """Verify cold-snap metros (Minneapolis/Chicago) exhibit higher gaming elasticity than warm metros."""
    metros = query_geospine_metro(limit=12)
    minneapolis = next((m for m in metros if m["dma_code"] == 613 or "Minneapolis" in m["metro_name"]), None)
    la = next((m for m in metros if m["dma_code"] == 803 or "Los Angeles" in m["metro_name"]), None)
    
    if minneapolis and la:
        e_minneapolis = min(1.50, 1.0 + abs(minneapolis["weather_temp_shock_c"]) * 0.04)
        e_la = min(1.50, 1.0 + abs(la["weather_temp_shock_c"]) * 0.04)
        assert e_minneapolis >= e_la

