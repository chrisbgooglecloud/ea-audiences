"""Unit tests for all 3 ADK measurement sub-agents and outbound A2A contracts."""

import pytest
from agents.app.sub_agents.tagging_agent import TaggingAgent, create_tagging_agent
from agents.app.sub_agents.analytics_agent import AnalyticsAgent, create_analytics_agent
from agents.app.sub_agents.media_buying_agent import MediaBuyingAgent, create_media_buying_agent
from agents.app.schemas import (
    SurfaceEnum,
    FunnelStageEnum,
    QuadrantEnum,
    FranchiseEnum,
)


def test_tagging_agent_apex():
    """Verify TaggingAgent processes Apex Legends creative and outputs schema."""
    agent = create_tagging_agent()
    result = agent.analyze_creative(
        asset_id="test-apex-01",
        franchise="Apex Legends",
    )
    assert result.title != ""
    assert result.funnel_stage in [FunnelStageEnum.ToFu_Exploration, FunnelStageEnum.MoFu_Progression, FunnelStageEnum.BoFu_Conversion]
    assert len(result.detected_mechanics) >= 2
    assert len(result.target_surfaces) >= 2
    # Check that EA Core 6 surfaces are respected
    for s in result.target_surfaces:
        assert isinstance(s, SurfaceEnum)


def test_tagging_agent_fc26():
    """Verify TaggingAgent processes EA Sports FC 26 creative."""
    agent = create_tagging_agent()
    result = agent.analyze_creative(
        asset_id="test-fc26-01",
        franchise="EA Sports FC",
    )
    assert any(term.lower() in result.title.lower() for term in ["fc 26", "fc", "fut", "ea sports fc", "ultimate team", "gameplay"])
    assert len(result.detected_mechanics) >= 2
    assert len(result.target_surfaces) >= 1
    for m in result.detected_mechanics:
        assert m.mechanic_name != ""
        assert m.funnel_stage in [FunnelStageEnum.ToFu_Exploration, FunnelStageEnum.MoFu_Progression, FunnelStageEnum.BoFu_Conversion]



def test_analytics_agent_9grid_classification():
    """Verify AnalyticsAgent accurately maps all 9 quadrants."""
    agent = create_analytics_agent()
    
    # Gold Mines: High ROAS (>=3.0), Low Frequency (<8)
    p_gold = agent.classify_feature_point("Squad Breach", roas_impact=3.85, frequency=4.0)
    assert p_gold.quadrant == QuadrantEnum.GOLD_MINES
    
    # Money Pits: Low ROAS (<1.5), High Frequency (>=25)
    p_pit = agent.classify_feature_point("Generic Tier Grid", roas_impact=0.65, frequency=38.0)
    assert p_pit.quadrant == QuadrantEnum.MONEY_PITS
    
    # Core Drivers: High ROAS (>=3.0), Medium Frequency ([8, 25))
    p_core = agent.classify_feature_point("HyperMotion Dribbling", roas_impact=3.60, frequency=16.0)
    assert p_core.quadrant == QuadrantEnum.CORE_DRIVERS

    # Generate full grid
    grid = agent.generate_tactical_grid("Apex Legends")
    assert len(grid) >= 9


def test_analytics_agent_insights():
    """Verify AnalyticsAgent generates deep CoT reasoning and actionable directives."""
    agent = create_analytics_agent()
    insights = agent.explain_attribution_insights(franchise="Apex Legends")
    assert "executive_summary" in insights
    assert len(insights["chain_of_thought_reasoning"]) >= 3
    assert len(insights["key_recommendations"]) >= 2
    assert any(r["priority"] == "P0_CRITICAL" for r in insights["key_recommendations"])


def test_media_buying_agent_equimarginal_solver():
    """Verify MediaBuyingAgent executes budget optimization respecting 20% clamp and zero-sum."""
    agent = create_media_buying_agent()
    channels = [
        {"channel": "YouTube Paid", "current_spend": 100000.0, "base_roas": 3.2, "half_saturation_s": 60000.0, "hill_slope_k": 1.3},
        {"channel": "Meta Ads", "current_spend": 80000.0, "base_roas": 2.8, "half_saturation_s": 50000.0, "hill_slope_k": 1.25},
        {"channel": "TikTok", "current_spend": 50000.0, "base_roas": 2.4, "half_saturation_s": 40000.0, "hill_slope_k": 1.2},
    ]
    opt = agent.execute_budget_reallocation(channels)
    assert opt["zero_sum_satisfied"] is True
    assert opt["pacing_clamp_satisfied"] is True
    assert opt["revenue_uplift_pct"] >= 0.0
    assert opt["solver_latency_ms"] < 200.0  # Solver latency requirement (<200ms)


def test_media_buying_a2a_curtis_creative_revision():
    """Verify MediaBuyingAgent dispatches A2A revision request to Curtis's Creative Studio."""
    agent = create_media_buying_agent()
    res = agent.negotiate_creative_revision(
        creative_agent_name="Curtis_CreativeStudioAgent",
        recommended_feature="Squad Breach & Clear",
        target_channel="YouTube Paid",
        budget_allocated=75000.0,
        directive="Lead with 2s ToFu action hook for TikTok",
    )
    assert res["status"] == "NEGOTIATION_COMPLETED"
    assert res["dispatched_message"]["recipient"] == "Curtis_CreativeStudioAgent"
    assert res["dispatched_message"]["intent"] == "REVISE_CREATIVE"


def test_media_buying_a2a_jamie_persona_simulation():
    """Verify MediaBuyingAgent dispatches A2A simulation request to Jamie's DeepSona service."""
    agent = create_media_buying_agent()
    res = agent.request_persona_simulation(
        persona_agent_name="Jamie_DeepSonaAgent",
        campaign_id="camp-apex-s22-test",
        target_roas=2.45,
    )
    assert res["status"] == "PERSONA_SIMULATION_DISPATCHED"
    assert res["dispatched_message"]["recipient"] == "Jamie_DeepSonaAgent"
    assert res["dispatched_message"]["intent"] == "SIMULATE_PERSONA_REACTION"


def test_media_buying_a2a_surya_programmatic_allocation():
    """Verify MediaBuyingAgent dispatches A2A budget allocation to Surya's Commerce Media ad server."""
    agent = create_media_buying_agent()
    res = agent.allocate_programmatic_spend(
        ad_server_agent_name="Surya_CommerceMediaAgent",
        stadium_board_budget=85000.0,
        dma_focus=[501, 803],
    )
    assert res["status"] == "PROGRAMMATIC_SPEND_ALLOCATED"
    assert res["dispatched_message"]["recipient"] == "Surya_CommerceMediaAgent"
    assert res["dispatched_message"]["intent"] == "ALLOCATE_PROGRAMMATIC_SPEND"
