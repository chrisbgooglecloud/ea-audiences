"""Tier 1: Multi-Agent Fleet & A2A / A2UI Protocols (Features 13 to 16).

Verifies:
- Feature 13: Gemini Enterprise Agent Card Specification (name, version, skills, A2UI extensions)
- Feature 14: Declarative A2UI Protocol Generator (createSurface, surfaceUpdate, updateDataModel, widget builders, SSE)
- Feature 15: Autonomous A2A Cross-Module Dispatch (MediaBuyingAgent -> Curtis Gross, Jamie Pourturk, Surya Kunju)
- Feature 16: Agent Fleet Pytest Suite & Runtime Quality (sub-agent execution, routing, SLAs)
"""

import os
import sys
import json
import time
import uuid
import pytest

# Ensure repo paths are in sys.path
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

from agents.app.agent import RootOrchestratorAgent, root_agent
from agents.app.schemas import (
    SurfaceEnum,
    FunnelStageEnum,
    FranchiseEnum,
    GamerArchetypeEnum,
    FSMBuyerStateEnum,
    QuadrantEnum,
    DetectedMechanic,
    Storybeat,
    CreativeMetadataSchema,
    BuyerAction,
    PersonaSimulationResult,
    Tactical9GridPoint,
    RecommendationAction,
    A2AMessage,
    A2UIComponent,
    A2UIStreamEvent,
)
from agents.app.protocols.a2a_protocol import (
    create_a2a_message,
    route_a2a_message,
    get_conversation_history,
    register_agent_handler,
)
from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator
from agents.app.sub_agents.tagging_agent import TaggingAgent, create_tagging_agent
from agents.app.sub_agents.analytics_agent import AnalyticsAgent, create_analytics_agent
from agents.app.sub_agents.media_buying_agent import MediaBuyingAgent, create_media_buying_agent


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




# ============================================================================
# Feature 13: Gemini Enterprise Agent Card Specification
# ============================================================================

def test_t1_f13_01_agent_card_file_exists_and_valid_json():
    """Verify agent_card.json exists and parses as valid JSON."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    assert os.path.exists(card_path), f"agent_card.json not found at {card_path}"
    with open(card_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, dict)
    assert "name" in data
    assert "description" in data
    assert "url" in data
    assert "skills" in data


def test_t1_f13_02_agent_card_identity_and_transport():
    """Verify agent card name, transport, and input/output modes."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["name"] == "eagames-ebc-demo-ge-app"
    assert data.get("version") == "2.0.0"
    assert "run.app" in data["url"]
    assert data.get("preferredTransport") == "JSONRPC"
    assert "text/plain" in data["defaultInputModes"]
    assert "application/json" in data["defaultInputModes"]
    assert "text/event-stream" in data["defaultOutputModes"]


def test_t1_f13_03_agent_card_capabilities_and_a2ui_extension():
    """Verify capabilities streaming flag and A2UI extension v0.8 registration."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    caps = data.get("capabilities", {})
    assert caps.get("streaming") is True
    extensions = caps.get("extensions", [])
    assert len(extensions) >= 1
    a2ui_ext = next((e for e in extensions if "a2ui" in e.get("uri", "")), None)
    assert a2ui_ext is not None
    assert "a2ui" in a2ui_ext["uri"]
    assert "params" in a2ui_ext
    assert "supportedCatalogIds" in a2ui_ext["params"]


def test_t1_f13_04_agent_card_skills_count_and_structure():
    """Verify agent card defines at least 3 skills with tags and examples."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    skills = data.get("skills", [])
    assert len(skills) >= 3
    for s in skills:
        assert "id" in s and len(s["id"]) > 0
        assert "name" in s and len(s["name"]) > 0
        assert "description" in s and len(s["description"]) > 0
        assert "tags" in s and isinstance(s["tags"], list)
        assert "examples" in s and len(s["examples"]) >= 1


def test_t1_f13_05_agent_card_skill_domain_coverage():
    """Verify agent card skills cover tagging, attribution, and budget pacing domains."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    skill_ids = [s["id"] for s in data["skills"]]
    has_tagging = any("tag" in sid or "intake" in sid for sid in skill_ids)
    has_pacing = any("pacing" in sid or "budget" in sid or "meridian" in sid for sid in skill_ids)
    has_attribution = any("attribution" in sid or "shapley" in sid or "9grid" in sid for sid in skill_ids)
    assert has_tagging, f"Expected tagging/intake skill in {skill_ids}"
    assert has_pacing, f"Expected pacing/budget skill in {skill_ids}"
    assert has_attribution, f"Expected attribution/shapley skill in {skill_ids}"


# ============================================================================
# Feature 14: Declarative A2UI Protocol Generator
# ============================================================================

def test_t1_f14_01_a2ui_create_surface():
    """Verify createSurface action creates valid dictionary structure."""
    surface = A2UIProtocolGenerator.create_surface(
        surface_id="surf-exec-01",
        title="Executive Command Center",
        layout="vertical",
    )
    assert surface["type"] == "createSurface"
    assert surface["surfaceId"] == "surf-exec-01"
    assert surface["title"] == "Executive Command Center"
    assert surface["layout"] == "vertical"
    assert "timestamp" in surface


def test_t1_f14_02_a2ui_surface_update():
    """Verify surfaceUpdate action packages component trees."""
    components = [
        {"id": "c1", "type": "a2ui-metric-card", "value": "100k"},
        {"id": "c2", "type": "a2ui-bar-chart", "data": []},
    ]
    update = A2UIProtocolGenerator.surface_update(
        surface_id="surf-exec-01",
        components=components,
    )
    assert update["type"] == "surfaceUpdate"
    assert update["surfaceId"] == "surf-exec-01"
    assert len(update["components"]) == 2
    assert update["components"][0]["id"] == "c1"


def test_t1_f14_03_a2ui_update_data_model():
    """Verify updateDataModel uses standard JSON pointer notation."""
    msg = A2UIProtocolGenerator.update_data_model(
        surface_id="surf-exec-01",
        path="/budget/totalAllocated",
        value=4200000.0,
    )
    assert msg["type"] == "updateDataModel"
    assert msg["surfaceId"] == "surf-exec-01"
    assert msg["path"] == "/budget/totalAllocated"
    assert msg["value"] == 4200000.0


def test_t1_f14_04_a2ui_build_metric_card():
    """Verify build_metric_card produces compliant widget dictionary."""
    card = A2UIProtocolGenerator.build_metric_card(
        component_id="metric-cpi-01",
        title="Effective CPI",
        value="$4.12",
        subtitle="Across 4 Channels",
        delta="-18.5%",
        trend="up",
        badge="Optimized",
    )
    assert card["component_type"] == "a2ui-metric-card"
    assert card["component_id"] == "metric-cpi-01"
    assert card["title"] == "Effective CPI"
    assert card["data"]["value"] == "$4.12"
    assert card["data"]["delta"] == "-18.5%"
    assert card["data"]["trend"] == "up"
    assert card["props"]["variant"] == "glassmorphic"


def test_t1_f14_05_a2ui_build_scurve_chart():
    """Verify build_scurve_chart packages Hill Saturation S-curves."""
    channels = [
        {"channel": "YouTube", "spend": 1400000, "marginal_roas": 3.2},
        {"channel": "Meta", "spend": 1200000, "marginal_roas": 2.8},
    ]
    chart = A2UIProtocolGenerator.build_scurve_chart(
        component_id="scurve-meridian-01",
        title="Meridian Response Vectors",
        channels=channels,
        description="Equimarginal S-Curves",
    )
    assert chart["component_type"] == "a2ui-scurve-chart"
    assert len(chart["data"]["channels"]) == 2
    assert chart["props"]["show_tangents"] is True


def test_t1_f14_06_a2ui_build_tactical_9grid_scatter():
    """Verify build_tactical_9grid_scatter packages 9-grid feature coordinates."""
    points = [
        {"feature_name": "Jude Bellingham Walkout", "frequency_x": 4, "roas_impact_y": 3.85, "quadrant": "GOLD_MINES"},
        {"feature_name": "Generic Battle Pass", "frequency_x": 38, "roas_impact_y": 0.65, "quadrant": "MONEY_PITS"},
    ]
    scatter = A2UIProtocolGenerator.build_tactical_9grid_scatter(
        component_id="scatter-9grid-01",
        title="Tactical 9-Grid Matrix",
        points=points,
        franchise="EA Sports FC",
    )
    assert scatter["component_type"] == "a2ui-grid-scatter"
    assert scatter["data"]["franchise"] == "EA Sports FC"
    assert len(scatter["data"]["features"]) == 2
    assert scatter["props"]["highlight_gold_mines"] is True


def test_t1_f14_07_a2ui_build_recommendation_and_persona_cards():
    """Verify build_recommendation_card and build_persona_card."""
    recom = A2UIProtocolGenerator.build_recommendation_card(
        component_id="recom-01",
        title="Executive Directives",
        recommendations=[{"action": "Shift spend to TikTok", "expected_lift": "+14.2%"}],
    )
    assert recom["component_type"] == "a2ui-recommendation-card"
    assert recom["props"]["allow_one_click_apply"] is True

    persona = A2UIProtocolGenerator.build_persona_card(
        component_id="persona-01",
        persona_name="Ranked Apex Grinder",
        archetype="COMPETITIVE_GRINDER",
        pass1_monologue="Battle pass progression is too grindy...",
        buyer_action={"final_fsm_state": "EVALUATING", "willingness_to_pay_usd": 15.0},
    )
    assert persona["component_type"] == "a2ui-persona-card"
    assert persona["data"]["archetype"] == "COMPETITIVE_GRINDER"


def test_t1_f14_08_a2ui_sse_line_formatting():
    """Verify format_sse_event formats compliant SSE text stream lines."""
    sse = A2UIProtocolGenerator.format_sse_event(
        event_type="thought",
        agent_name="RootOrchestratorAgent",
        session_id="sess-test-01",
        content="Computing Hill saturation...",
        component={"component_type": "a2ui-metric-card", "component_id": "m1"},
        metadata={"step": 1},
    )
    assert sse.startswith("event: message\ndata: ")
    assert sse.endswith("\n\n")

    json_str = sse.replace("event: message\ndata: ", "").strip()
    payload = json.loads(json_str)
    assert payload["event_type"] == "thought"
    assert payload["agent_name"] == "RootOrchestratorAgent"
    assert payload["session_id"] == "sess-test-01"
    assert payload["content"] == "Computing Hill saturation..."
    assert payload["component"]["component_type"] == "a2ui-metric-card"
    assert payload["metadata"]["step"] == 1


def test_t1_f14_09_a2ui_build_conflict_card():
    """Verify build_conflict_card produces compliant <a2ui-conflict-card> payload and markup."""
    card = A2UIProtocolGenerator.build_conflict_card(
        component_id="conflict-fc27-toty-001",
        title="Cross-Franchise Audience Collision Detected",
        severity="AMBER",
        target_campaign_name="EA FC 27 TOTY Mid-Season Push",
        conflicting_campaign_name="Apex Legends Season 26 Launch",
        conflicting_franchise="Apex Legends",
        shared_ea_id_overlap_pct=42.1,
        ad_fatigue_suppression_penalty_pct=14.5,
        net_bookings_risk_usd=420000.0,
        recommended_timeline_shift_days=3,
        projected_net_bookings_recovery_usd=420000.0,
    )
    assert card["component_type"] == "a2ui-conflict-card"
    assert card["component_id"] == "conflict-fc27-toty-001"
    assert card["data"]["collision_detected"] is True
    assert card["data"]["conflicting_franchise"] == "Apex Legends"
    assert card["data"]["shared_ea_id_overlap_pct"] == 42.1
    assert card["data"]["ad_fatigue_suppression_penalty_pct"] == 14.5
    assert card["data"]["net_bookings_risk_usd"] == 420000.0
    assert card["data"]["projected_net_bookings_recovery_usd"] == 420000.0
    assert card["props"]["variant"] == "amber_warning"
    assert card["props"]["allow_one_click_apply"] is True

    markup = A2UIProtocolGenerator.render_conflict_card_markup(
        component_id="conflict-fc27-toty-001",
        title="Cross-Franchise Audience Collision Detected",
        severity="AMBER",
        target_campaign="EA FC 27 TOTY Mid-Season Push",
        conflicting_campaign="Apex Legends Season 26 Launch",
        overlap_pct=42.1,
        penalty_pct=14.5,
        risk_usd=420000.0,
        shift_days=3,
        recovery_usd=420000.0,
    )
    assert "<a2ui-conflict-card" in markup
    assert 'id="conflict-fc27-toty-001"' in markup
    assert 'overlap-pct="42.1"' in markup


def test_t1_f14_10_a2ui_build_shapley_chart():
    """Verify build_shapley_chart produces compliant <a2ui-shapley-chart> payload and markup."""
    chart = A2UIProtocolGenerator.build_shapley_chart(
        component_id="shapley-fc27-pretest-001",
        title="2D Creative Shapley CTR vs CTI Marginal Lift Attribution",
        asset_id="asset-fc27-pretest-001",
        asset_title="EA SPORTS FC 27 - Official Gameplay Trailer (15s Pre-Test)",
        franchise="EA Sports FC",
        video_duration_seconds=15.0,
        funnel_balance_index=0.78,
    )
    assert chart["component_type"] == "a2ui-shapley-chart"
    assert chart["component_id"] == "shapley-fc27-pretest-001"
    assert chart["data"]["asset_id"] == "asset-fc27-pretest-001"
    assert chart["data"]["funnel_balance_index"] == 0.78
    assert len(chart["data"]["features"]) >= 3
    assert len(chart["data"]["waterfall_steps"]) >= 4
    assert len(chart["data"]["channel_attribution"]) >= 4
    assert chart["props"]["chart_type"] == "2d_tradeoff_waterfall"
    assert chart["props"]["show_fbi_gauge"] is True
    assert chart["props"]["show_pareto_frontier"] is True

    markup = A2UIProtocolGenerator.render_shapley_chart_markup(
        component_id="shapley-fc27-pretest-001",
        title="2D Creative Shapley CTR vs CTI Marginal Lift",
        asset_id="asset-fc27-pretest-001",
        franchise="EA Sports FC",
        funnel_balance_index=0.78,
        top_ctr_feature="Skill Move / Trick Shot Showcase (+41.0%)",
        top_cti_feature="FUT Pack Walkout Jude Bellingham (+32.4%)",
        duration_seconds=15.0,
    )
    assert "<a2ui-shapley-chart" in markup
    assert 'id="shapley-fc27-pretest-001"' in markup
    assert 'funnel-balance-index="0.78"' in markup


# ============================================================================
# Feature 15: Autonomous A2A Cross-Module Dispatch
# ============================================================================

def test_t1_f15_01_a2a_create_message_envelope():
    """Verify create_a2a_message initializes valid envelope and bus entry."""
    corr_id = f"corr-{uuid.uuid4().hex[:8]}"
    msg = create_a2a_message(
        sender="MediaBuyingAgent",
        recipient="Curtis_CreativeStudioAgent",
        intent="REVISE_CREATIVE",
        payload={"asset_id": "asset-fc27-01", "directive": "Vertical 9:16 cut"},
        correlation_id=corr_id,
    )
    assert msg["message_id"].startswith("msg-")
    assert msg["correlation_id"] == corr_id
    assert msg["sender"] == "MediaBuyingAgent"
    assert msg["recipient"] == "Curtis_CreativeStudioAgent"
    assert msg["intent"] == "REVISE_CREATIVE"
    assert msg["status"] == "SENT"
    assert "timestamp" in msg


def test_t1_f15_02_a2a_route_with_registered_handler():
    """Verify route_a2a_message executes registered recipient handler and returns ACK."""
    test_recipient = f"TestAgent_{uuid.uuid4().hex[:6]}"
    
    def mock_handler(message: dict) -> dict:
        return {"action_taken": "APPROVED", "received_intent": message["intent"]}
    
    register_agent_handler(test_recipient, mock_handler)

    msg = create_a2a_message(
        sender="MediaBuyingAgent",
        recipient=test_recipient,
        intent="PROPOSE_ALLOCATION",
        payload={"budget": 100000},
    )
    resp = route_a2a_message(msg)
    assert resp["sender"] == test_recipient
    assert resp["status"] == "PROCESSED"
    assert resp["intent"] == "ACK_PROPOSE_ALLOCATION"
    assert resp["payload"]["action_taken"] == "APPROVED"


def test_t1_f15_03_a2a_route_unregistered_fallback():
    """Verify route_a2a_message gracefully falls back to ACK_QUEUED for external queue agents."""
    unregistered_agent = f"ExternalAgent_{uuid.uuid4().hex[:6]}"
    msg = create_a2a_message(
        sender="MediaBuyingAgent",
        recipient=unregistered_agent,
        intent="REVISE_CREATIVE",
        payload={"feature": "Jude Bellingham Walkout"},
    )
    resp = route_a2a_message(msg)
    assert resp["status"] == "DELIVERED"
    assert resp["intent"] == "ACK_QUEUED"
    assert resp["payload"]["status"] == "DELIVERED"


def test_t1_f15_04_a2a_trace_history_retrieval():
    """Verify get_conversation_history aggregates multi-turn A2A negotiation traces."""
    corr_id = f"corr-trace-{uuid.uuid4().hex[:8]}"
    msg1 = create_a2a_message("AgentA", "AgentB", "STEP_1", {"step": 1}, correlation_id=corr_id)
    route_a2a_message(msg1)
    
    msg2 = create_a2a_message("AgentB", "AgentA", "STEP_2", {"step": 2}, correlation_id=corr_id)
    route_a2a_message(msg2)

    history = get_conversation_history(corr_id)
    assert len(history) >= 2
    for item in history:
        assert item["correlation_id"] == corr_id


def test_t1_f15_05_media_buying_negotiate_creative_revision():
    """Verify MediaBuyingAgent.negotiate_creative_revision sends REVISE_CREATIVE to Curtis Gross."""
    agent = create_media_buying_agent()
    corr_id = f"corr-curtis-{uuid.uuid4().hex[:8]}"
    result = agent.negotiate_creative_revision(
        creative_agent_name="Curtis_CreativeStudioAgent",
        recommended_feature="Jude Bellingham 9:16 Walkout",
        target_channel="TikTok",
        budget_allocated=85000.0,
        directive="Lead with 2-second ToFu action hook into Bellingham climax",
        correlation_id=corr_id,
    )
    assert result["status"] == "NEGOTIATION_COMPLETED"
    msg = result["dispatched_message"]
    assert msg["recipient"] == "Curtis_CreativeStudioAgent"
    assert msg["intent"] == "REVISE_CREATIVE"
    assert msg["payload"]["feature_name"] == "Jude Bellingham 9:16 Walkout"
    assert msg["payload"]["target_channel"] == "TikTok"
    assert msg["payload"]["budget_allocated"] == 85000.0


def test_t1_f15_06_media_buying_persona_simulation_dispatch():
    """Verify MediaBuyingAgent.request_persona_simulation sends SIMULATE_PERSONA_REACTION to Jamie."""
    agent = create_media_buying_agent()
    corr_id = f"corr-jamie-{uuid.uuid4().hex[:8]}"
    result = agent.request_persona_simulation(
        persona_agent_name="Jamie_DeepSonaAgent",
        campaign_id="camp-fc27-toty",
        target_roas=3.42,
        creative_title="EA FC 27 Jude Bellingham Walkout",
        franchise="EA Sports FC",
        proposed_spend=150000.0,
        correlation_id=corr_id,
    )
    assert result["status"] == "PERSONA_SIMULATION_DISPATCHED"
    msg = result["dispatched_message"]
    assert msg["recipient"] == "Jamie_DeepSonaAgent"
    assert msg["intent"] == "SIMULATE_PERSONA_REACTION"
    assert "COMPETITIVE_GRINDER" in msg["payload"]["archetypes"]
    assert msg["payload"]["target_roas"] == 3.42


def test_t1_f15_07_media_buying_programmatic_allocation_dispatch():
    """Verify MediaBuyingAgent.allocate_programmatic_spend sends ALLOCATE_PROGRAMMATIC_SPEND to Surya."""
    agent = create_media_buying_agent()
    corr_id = f"corr-surya-{uuid.uuid4().hex[:8]}"
    result = agent.allocate_programmatic_spend(
        ad_server_agent_name="Surya_CommerceMediaAgent",
        campaign_id="camp-fc27-stadium",
        franchise="EA Sports FC",
        stadium_board_budget=95000.0,
        dma_focus=[501, 803, 602],
        correlation_id=corr_id,
    )
    assert result["status"] == "PROGRAMMATIC_SPEND_ALLOCATED"
    msg = result["dispatched_message"]
    assert msg["recipient"] == "Surya_CommerceMediaAgent"
    assert msg["intent"] == "ALLOCATE_PROGRAMMATIC_SPEND"
    assert "STADIUM_BOARDS" in msg["payload"]["target_surfaces"]
    assert msg["payload"]["dma_focus"] == [501, 803, 602]


# ============================================================================
# Feature 16: Agent Fleet Pytest Suite & Runtime Quality
# ============================================================================

def test_t1_f16_01_root_orchestrator_initialization():
    """Verify RootOrchestratorAgent initializes all 3 subagents and A2A handlers."""
    orch = RootOrchestratorAgent()
    assert orch.tagging_agent is not None
    assert orch.analytics_agent is not None
    assert orch.media_buying_agent is not None


def test_t1_f16_02_root_orchestrator_routing_budget():
    """Verify RootOrchestrator routes budget/pacing prompt to MediaBuyingAgent."""
    res = root_agent.route_request("Optimize budget allocation across YouTube and Meta for Apex Legends")
    assert res["route"] == "MediaBuyingAgent"
    assert "Equimarginal optimization complete" in res["message"]
    assert "results" in res
    assert res["results"]["zero_sum_satisfied"] is True


def test_t1_f16_03_root_orchestrator_routing_tagging():
    """Verify RootOrchestrator routes tagging prompt to TaggingAgent."""
    res = root_agent.route_request("Extract multimodal gameplay mechanics and tags for trailer")
    assert res["route"] == "TaggingAgent"
    assert "Extracted" in res["message"]
    assert "results" in res
    assert "detected_mechanics" in res["results"]


def test_t1_f16_04_root_orchestrator_routing_attribution():
    """Verify RootOrchestrator routes attribution prompt to AnalyticsAgent."""
    res = root_agent.route_request("Explain SHAP attribution matrix and 9-grid gold mines")
    assert res["route"] == "AnalyticsAgent"
    assert "Tactical 9-Grid" in res["message"]
    assert "results" in res
    assert "executive_summary" in res["results"]


def test_t1_f16_05_tagging_agent_fc_analysis():
    """Verify TaggingAgent returns valid Pydantic schema for EA Sports FC."""
    agent = create_tagging_agent()
    result = agent.analyze_creative(asset_id="asset-fc27-01", franchise="EA Sports FC")
    assert isinstance(result, CreativeMetadataSchema)
    assert len(result.detected_mechanics) >= 2
    assert len(result.target_surfaces) >= 2
    assert all(isinstance(s, SurfaceEnum) for s in result.target_surfaces)


def test_t1_f16_06_analytics_agent_9grid_quadrant_accuracy():
    """Verify AnalyticsAgent accurately classifies Gold Mines, Money Pits, and Core Drivers."""
    agent = create_analytics_agent()
    p_gold = agent.classify_feature_point("Akimbo Combat", roas_impact=3.80, frequency=5.0)
    assert p_gold.quadrant == QuadrantEnum.GOLD_MINES
    assert p_gold.strategic_action.startswith("Scale Up")

    p_pit = agent.classify_feature_point("Generic Logo Banner", roas_impact=0.80, frequency=40.0)
    assert p_pit.quadrant == QuadrantEnum.MONEY_PITS
    assert p_pit.strategic_action.startswith("Kill Immediately")

    p_core = agent.classify_feature_point("Precision Volley", roas_impact=3.40, frequency=15.0)
    assert p_core.quadrant == QuadrantEnum.CORE_DRIVERS
    assert p_core.strategic_action.startswith("Maintain")



def test_t1_f16_07_media_buying_solver_sla():
    """Verify MediaBuyingAgent budget solver executes within <200ms SLA."""
    agent = create_media_buying_agent()
    channels = [
        {"channel": "YouTube Paid", "current_spend": 1400000.0, "base_roas": 3.2, "half_saturation_s": 450000.0, "hill_slope_k": 1.40},
        {"channel": "Meta Ads", "current_spend": 1200000.0, "base_roas": 2.8, "half_saturation_s": 350000.0, "hill_slope_k": 1.35},
        {"channel": "Programmatic 3D", "current_spend": 900000.0, "base_roas": 3.6, "half_saturation_s": 280000.0, "hill_slope_k": 1.50},
        {"channel": "TikTok", "current_spend": 700000.0, "base_roas": 3.0, "half_saturation_s": 320000.0, "hill_slope_k": 1.45},
    ]
    t0 = time.perf_counter()
    opt = agent.execute_budget_reallocation(channels=channels, total_budget=4200000.0)
    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    assert elapsed_ms < 200.0, f"Solver took {elapsed_ms:.2f}ms, exceeding 200ms SLA"
    assert opt["zero_sum_satisfied"] is True
    assert opt["pacing_clamp_satisfied"] is True
    assert len(opt["channel_allocations"]) == 4
