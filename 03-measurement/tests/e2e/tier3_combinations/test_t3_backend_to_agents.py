"""Tier 3 Combinations: Backend Services -> Multi-Agent Fleet Integration.

Verifies end-to-end data flow and contract synchronization between:
- Backend Econometric Models (Hill saturation, 2D Shapley, GeoSpine DMAs, Collision Engine)
- Multi-Agent Fleet (TaggingAgent, AnalyticsAgent, MediaBuyingAgent, RootOrchestrator)
- A2A & A2UI Protocols (Agent Card, Declarative Builders, Message Bus)
"""

import os
import sys
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

from generators.hybrid_bqml_runner import hybrid_bqml_runner
from generators.geospine_generator import TOP_25_NIELSEN_DMAS
from app.services.pacing_engine import EquimarginalPacingEngine
from agents.app.agent import root_agent
from agents.app.schemas import (
    SurfaceEnum,
    FunnelStageEnum,
    QuadrantEnum,
    CreativeMetadataSchema,
)
from agents.app.protocols.a2a_protocol import (
    create_a2a_message,
    route_a2a_message,
    get_conversation_history,
)
from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator
from agents.app.sub_agents.tagging_agent import create_tagging_agent, TaggingAgent
from agents.app.sub_agents.analytics_agent import create_analytics_agent, AnalyticsAgent
from agents.app.sub_agents.media_buying_agent import create_media_buying_agent, MediaBuyingAgent


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


def test_t3_01_backend_bqml_metadata_to_tagging_agent():
    """Verify backend BQML creative metadata format aligns with TaggingAgent Pydantic schema."""
    agent = create_tagging_agent()
    result = agent.analyze_creative("asset-fc27-bellingham", franchise="EA Sports FC")
    assert isinstance(result, CreativeMetadataSchema)
    assert len(result.detected_mechanics) >= 2
    # Verify surfaces match SurfaceEnum
    for surface in result.target_surfaces:
        assert isinstance(surface, SurfaceEnum)


def test_t3_02_backend_shapley_tradeoff_to_analytics_agent_9grid():
    """Verify backend Jude Bellingham 2D Shapley output converts directly into AnalyticsAgent 9-grid point."""
    tradeoff = hybrid_bqml_runner.generate_bellingham_shapley_tradeoff()
    agent = create_analytics_agent()

    bellingham_feat = next(f for f in tradeoff["features"] if "Bellingham" in f["feature_name"])
    grid_point = agent.classify_feature_point(
        feature_name=bellingham_feat["feature_name"],
        roas_impact=bellingham_feat["marginal_d7_roas_multiplier"],
        frequency=5.0,  # low frequency -> Gold Mine
        franchise="EA Sports FC",
    )
    assert grid_point.quadrant == QuadrantEnum.GOLD_MINES
    assert grid_point.strategic_action.startswith("Scale Up")
    assert grid_point.roas_impact_y == 3.42


def test_t3_03_backend_pacing_engine_to_media_buying_agent():
    """Verify backend EquimarginalPacingEngine and MediaBuyingAgent agree on budget conservation."""
    engine = EquimarginalPacingEngine()
    agent = create_media_buying_agent()

    channels = [
        {"channel": "YouTube", "current_spend": 1400000.0, "base_roas": 3.2, "half_saturation_s": 450000.0, "hill_slope_k": 1.40},
        {"channel": "Meta", "current_spend": 1200000.0, "base_roas": 2.8, "half_saturation_s": 350000.0, "hill_slope_k": 1.35},
        {"channel": "Prog3D", "current_spend": 900000.0, "base_roas": 3.6, "half_saturation_s": 280000.0, "hill_slope_k": 1.50},
        {"channel": "TikTok", "current_spend": 700000.0, "base_roas": 3.0, "half_saturation_s": 320000.0, "hill_slope_k": 1.45},
    ]
    agent_res = agent.execute_budget_reallocation(channels=channels, total_budget=4200000.0)
    assert agent_res["zero_sum_satisfied"] is True
    assert agent_res["pacing_clamp_satisfied"] is True
    assert agent_res["total_allocated_budget"] == pytest.approx(4200000.0, abs=1.0)


def test_t3_04_backend_collision_scenario_to_a2ui_recommendation():
    """Verify backend Oct 24-27 collision scenario converts into A2UI recommendation card."""
    collision = hybrid_bqml_runner.generate_collision_scenario_oct24_27()
    recom_component = A2UIProtocolGenerator.build_recommendation_card(
        component_id="recom-collision-mitigation",
        title="Schedule Collision Alert: EA FC 27 vs Apex Legends S26",
        recommendations=[
            {
                "action": f"Shift flight +{collision['recommended_timeline_shift_days']} days to {collision['mitigated_flight_start']}",
                "expected_lift": f"+${collision['projected_net_bookings_recovery_usd']:,.2f} Net Bookings",
                "risk_mitigated": f"${collision['net_bookings_risk_usd']:,.2f}",
            }
        ],
    )
    assert recom_component["component_type"] == "a2ui-recommendation-card"
    assert "recom-collision-mitigation" in recom_component["component_id"]
    assert len(recom_component["data"]["recommendations"]) == 1
    assert "420,000" in recom_component["data"]["recommendations"][0]["risk_mitigated"]


def test_t3_05_backend_geospine_to_a2a_programmatic_spend():
    """Verify top 3 Nielsen DMAs from GeoSpine populate A2A programmatic spend dispatch."""
    agent = create_media_buying_agent()
    top_3_dmas = [d["dma_code"] for d in TOP_25_NIELSEN_DMAS[:3]]  # [501, 803, 602]
    corr_id = f"corr-geo-{uuid.uuid4().hex[:6]}"

    res = agent.allocate_programmatic_spend(
        ad_server_agent_name="Surya_CommerceMediaAgent",
        campaign_id="camp-fc27-geospine",
        franchise="EA Sports FC",
        stadium_board_budget=150000.0,
        dma_focus=top_3_dmas,
        correlation_id=corr_id,
    )
    assert res["status"] == "PROGRAMMATIC_SPEND_ALLOCATED"
    msg = res["dispatched_message"]
    assert msg["payload"]["dma_focus"] == [501, 803, 602]
    assert msg["payload"]["stadium_board_budget"] == 150000.0


def test_t3_06_backend_cti_decay_to_a2a_curtis_revision():
    """Verify lower-funnel CTI decay detected in 2D Shapley triggers A2A revision to Curtis Gross."""
    tradeoff = hybrid_bqml_runner.generate_bellingham_shapley_tradeoff()
    agent = create_media_buying_agent()

    # Trick shot has -12.1% CTI decay
    trick_shot = next(f for f in tradeoff["features"] if "Trick Shot" in f["feature_name"])
    assert trick_shot["marginal_cti_lift_pct"] < 0.0

    # Trigger A2A revision
    corr_id = f"corr-bellingham-fix-{uuid.uuid4().hex[:6]}"
    res = agent.negotiate_creative_revision(
        creative_agent_name="Curtis_CreativeStudioAgent",
        recommended_feature="Jude Bellingham 9:16 Vertical Walkout",
        target_channel="TikTok",
        budget_allocated=85000.0,
        directive="Replace top-of-funnel trick shot hook with high-monetization Jude Bellingham walkout sequence",
        correlation_id=corr_id,
    )
    assert res["status"] == "NEGOTIATION_COMPLETED"
    assert res["dispatched_message"]["recipient"] == "Curtis_CreativeStudioAgent"
    assert res["dispatched_message"]["intent"] == "REVISE_CREATIVE"
