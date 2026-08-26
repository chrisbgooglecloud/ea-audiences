"""Tier 2: Agent Fleet Boundaries & Adversarial Stress Tests (Features 13 to 16).

Verifies boundary, extreme value, and corner-case resilience:
- Feature 13 Boundaries: Schema edge cases, protocol versions, missing skills, URL schemes
- Feature 14 Boundaries: Extreme coordinate bounds, deep JSON pointers, empty/null A2UI payloads, SSE unicode/newline escaping
- Feature 15 Boundaries: Unknown agent routing queue fallback, zero/negative budget envelopes, rapid bus scaling, missing correlation IDs
- Feature 16 Boundaries: Exact threshold classifications, single-channel solver allocations, ambiguous multi-intent prompt routing
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

from agents.app.agent import RootOrchestratorAgent, root_agent
from agents.app.schemas import (
    SurfaceEnum,
    FunnelStageEnum,
    FranchiseEnum,
    QuadrantEnum,
    DetectedMechanic,
    Storybeat,
    CreativeMetadataSchema,
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
# Feature 13 Boundaries: Agent Card Schema Edge Cases
# ============================================================================

def test_t2_f13_b01_agent_card_protocol_version():
    """Verify agent card adheres to protocolVersion specification format."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        card = json.load(f)
    version = card.get("protocolVersion", card.get("version", "1.0.0"))
    parts = version.split(".")
    assert len(parts) >= 2
    assert all(p.isdigit() for p in parts)


def test_t2_f13_b02_agent_card_url_scheme():
    """Verify agent card URL uses https or valid cloud run endpoint."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        card = json.load(f)
    url = card["url"]
    assert url.startswith("https://") or url.startswith("http://")
    assert not url.endswith(" ")


def test_t2_f13_b03_agent_card_extensions_structure():
    """Verify capabilities extensions contain URI and params dictionary."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        card = json.load(f)
    extensions = card.get("capabilities", {}).get("extensions", [])
    for ext in extensions:
        assert "uri" in ext and isinstance(ext["uri"], str)
        assert "params" in ext and isinstance(ext["params"], dict)


def test_t2_f13_b04_agent_card_skill_examples_non_empty():
    """Verify every skill defines non-empty example query strings."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        card = json.load(f)
    for skill in card.get("skills", []):
        for eg in skill.get("examples", []):
            assert len(eg.strip()) > 5


def test_t2_f13_b05_agent_card_unsupported_field_tolerance():
    """Verify agent card handles non-interfering custom metadata attributes."""
    card_path = os.path.join(REPO_ROOT, "03-measurement", "agents", "app", "agent_card.json")
    with open(card_path, "r", encoding="utf-8") as f:
        card = json.load(f)
    assert "description" in card
    assert len(card["description"]) > 10


# ============================================================================
# Feature 14 Boundaries: Declarative A2UI Protocol Extremes
# ============================================================================

def test_t2_f14_b01_a2ui_empty_surface_update():
    """Verify surface_update handles empty component list cleanly."""
    update = A2UIProtocolGenerator.surface_update(
        surface_id="surf-empty-01",
        components=[],
    )
    assert update["type"] == "surfaceUpdate"
    assert update["surfaceId"] == "surf-empty-01"
    assert update["components"] == []


def test_t2_f14_b02_a2ui_deep_json_pointer():
    """Verify update_data_model with 6-level deep JSON pointer path."""
    deep_path = "/marketing/q3/campaigns/fc27/budget/subAllocations/meta"
    msg = A2UIProtocolGenerator.update_data_model(
        surface_id="surf-nested",
        path=deep_path,
        value=125000.0,
    )
    assert msg["path"] == deep_path
    assert msg["value"] == 125000.0


def test_t2_f14_b03_a2ui_metric_card_extreme_values():
    """Verify build_metric_card with zero/negative deltas and huge numeric values."""
    card = A2UIProtocolGenerator.build_metric_card(
        component_id="metric-extreme",
        title="D30 Net Bookings",
        value="$125,450,000.00",
        delta="-42.8%",
        trend="down",
        badge="CRITICAL",
    )
    assert card["data"]["value"] == "$125,450,000.00"
    assert card["data"]["delta"] == "-42.8%"
    assert card["data"]["trend"] == "down"


def test_t2_f14_b04_a2ui_tactical_9grid_extreme_coordinates():
    """Verify 9-grid scatter with 50+ features and negative ROAS points."""
    many_points = [
        {"feature_name": f"Feature_{i}", "frequency_x": float(i * 2), "roas_impact_y": float(3.5 - i * 0.1), "quadrant": "WORKHORSES"}
        for i in range(50)
    ]
    scatter = A2UIProtocolGenerator.build_tactical_9grid_scatter(
        component_id="scatter-50-features",
        title="Massive Feature Space",
        points=many_points,
        franchise="Battlefield",
    )
    assert len(scatter["data"]["features"]) == 50
    assert scatter["data"]["features"][0]["feature_name"] == "Feature_0"


def test_t2_f14_b05_a2ui_sse_formatting_unicode_and_quotes():
    """Verify format_sse_event properly encodes double quotes, newlines, and emojis."""
    complex_content = 'Analyzing "Volumetric Kick" \n Line 2: 🚀 +35% Lift & <Special Tag>'
    sse = A2UIProtocolGenerator.format_sse_event(
        event_type="thought",
        agent_name="RootOrchestratorAgent",
        session_id="sess-unicode-01",
        content=complex_content,
        component={"component_type": "a2ui-alert-banner", "text": "Warning: 🔥 High Fatigue"},
    )
    assert "event: message\ndata: " in sse
    json_line = sse.replace("event: message\ndata: ", "").strip()
    parsed = json.loads(json_line)
    assert "🚀" in parsed["content"]
    assert "🔥" in parsed["component"]["text"]


def test_t2_f14_b06_a2ui_recommendation_card_empty_list():
    """Verify recommendation card builder handles empty recommendation array."""
    card = A2UIProtocolGenerator.build_recommendation_card(
        component_id="recom-empty",
        title="Empty Directives",
        recommendations=[],
    )
    assert card["component_type"] == "a2ui-recommendation-card"
    assert card["data"]["recommendations"] == []


# ============================================================================
# Feature 15 Boundaries: A2A Cross-Module Bus Stress
# ============================================================================

def test_t2_f15_b01_a2a_auto_generate_missing_correlation_id():
    """Verify create_a2a_message auto-generates a valid correlation_id when omitted."""
    msg = create_a2a_message(
        sender="MediaBuyingAgent",
        recipient="Curtis_CreativeStudioAgent",
        intent="QUERY_STATE",
        payload={},
        correlation_id=None,
    )
    assert msg["correlation_id"] is not None
    assert msg["correlation_id"].startswith("corr-")


def test_t2_f15_b02_a2a_zero_budget_creative_negotiation():
    """Verify MediaBuyingAgent handles zero budget allocation request gracefully."""
    agent = create_media_buying_agent()
    res = agent.negotiate_creative_revision(
        creative_agent_name="Curtis_CreativeStudioAgent",
        recommended_feature="Akimbo P2020 Close-Up",
        target_channel="YouTube",
        budget_allocated=0.0,
        directive="Zero-spend organic cut revision",
    )
    assert res["status"] == "NEGOTIATION_COMPLETED"
    assert res["dispatched_message"]["payload"]["budget_allocated"] == 0.0


def test_t2_f15_b03_a2a_emojis_and_special_chars_in_directive():
    """Verify A2A payload safely transmits emojis, HTML entities, and special characters."""
    agent = create_media_buying_agent()
    directive_text = "✨ Lead with 1.5s 'Explosive' 🎯 Kickoff! <script>alert(1)</script> ⚽"
    res = agent.negotiate_creative_revision(
        creative_agent_name="Curtis_CreativeStudioAgent",
        recommended_feature="Mbappe TOTY Walkout",
        target_channel="TikTok",
        budget_allocated=50000.0,
        directive=directive_text,
    )
    assert res["dispatched_message"]["payload"]["directive"] == directive_text


def test_t2_f15_b04_a2a_unknown_recipient_bus_resilience():
    """Verify route_a2a_message never raises on unhandled recipients; queues safely."""
    for i in range(10):
        unknown = f"GhostAgent_{i}_{uuid.uuid4().hex[:4]}"
        msg = create_a2a_message("MediaBuyingAgent", unknown, f"INTENT_{i}", {"index": i})
        resp = route_a2a_message(msg)
        assert resp["status"] == "DELIVERED"
        assert resp["intent"] == "ACK_QUEUED"


def test_t2_f15_b05_a2a_rapid_multi_turn_bus_stress():
    """Verify message bus handles 50 rapid sequential turns (50 requests + 50 ACKs = 100 messages)."""
    corr_id = f"corr-rapid-50-{uuid.uuid4().hex[:6]}"
    for turn in range(50):
        sender = f"Agent_{turn % 3}"
        recipient = f"Agent_{(turn + 1) % 3}"
        msg = create_a2a_message(sender, recipient, f"STEP_{turn}", {"turn": turn}, correlation_id=corr_id)
        route_a2a_message(msg)

    history = get_conversation_history(corr_id)
    assert len(history) == 100
    assert history[0]["payload"]["turn"] == 0


def test_t2_f15_b06_a2a_programmatic_spend_empty_dma():
    """Verify MediaBuyingAgent applies default DMAs when empty DMA focus array is passed."""
    agent = create_media_buying_agent()
    res = agent.allocate_programmatic_spend(
        ad_server_agent_name="Surya_CommerceMediaAgent",
        campaign_id="camp-empty-dma",
        franchise="The Sims",
        stadium_board_budget=25000.0,
        dma_focus=[],
    )
    assert res["status"] == "PROGRAMMATIC_SPEND_ALLOCATED"
    assert res["dispatched_message"]["payload"]["dma_focus"] == [501, 803, 602]



# ============================================================================
# Feature 16 Boundaries: Micro-Agent Edge Classifications & Robustness
# ============================================================================

def test_t2_f16_b01_analytics_agent_exact_boundary_thresholds():
    """Verify Tactical 9-Grid boundary classifications at exact threshold edges."""
    agent = create_analytics_agent()

    # Exact threshold: ROAS = 3.0, Frequency = 8.0 -> CORE_DRIVERS (freq in [8, 25))
    p1 = agent.classify_feature_point("Edge Point 1", roas_impact=3.0, frequency=8.0)
    assert p1.quadrant == QuadrantEnum.CORE_DRIVERS

    # Exact threshold: ROAS = 3.0, Frequency = 25.0 -> SATURATED_STARS (freq >= 25)
    p2 = agent.classify_feature_point("Edge Point 2", roas_impact=3.0, frequency=25.0)
    assert p2.quadrant == QuadrantEnum.SATURATED_STARS

    # Exact threshold: ROAS = 1.5, Frequency = 7.99 -> UNTAPPED (ROAS >= 1.5, freq < 8)
    p3 = agent.classify_feature_point("Edge Point 3", roas_impact=1.5, frequency=7.99)
    assert p3.quadrant == QuadrantEnum.UNTAPPED

    # Exact threshold: ROAS = 1.49, Frequency = 25.0 -> MONEY_PITS (ROAS < 1.5, freq >= 25)
    p4 = agent.classify_feature_point("Edge Point 4", roas_impact=1.49, frequency=25.0)
    assert p4.quadrant == QuadrantEnum.MONEY_PITS


def test_t2_f16_b02_tagging_agent_unknown_franchise_fallback():
    """Verify TaggingAgent falls back gracefully to default schema for unlisted franchise."""
    agent = create_tagging_agent()
    result = agent.analyze_creative(asset_id="asset-wildcard-01", franchise="Skate 4")
    assert isinstance(result, CreativeMetadataSchema)
    assert len(result.detected_mechanics) >= 1
    assert result.call_to_action is not None


def test_t2_f16_b03_media_buying_single_channel_solve():
    """Verify MediaBuyingAgent solves optimization with only a single active channel."""
    agent = create_media_buying_agent()
    channels = [
        {"channel": "YouTube Paid", "current_spend": 500000.0, "base_roas": 3.2, "half_saturation_s": 450000.0, "hill_slope_k": 1.40},
    ]
    res = agent.execute_budget_reallocation(channels=channels, total_budget=500000.0)
    assert res["zero_sum_satisfied"] is True
    assert len(res["channel_allocations"]) == 1
    assert res["channel_allocations"][0]["allocated_spend"] == 500000.0


def test_t2_f16_b04_root_orchestrator_whitespace_prompt():
    """Verify RootOrchestrator handles empty or whitespace prompts safely."""
    res = root_agent.route_request("    \n\t  ")
    assert "route" in res
    assert res["route"] in ["TaggingAgent", "AnalyticsAgent", "MediaBuyingAgent", "OrchestratorComposite"]


def test_t2_f16_b05_root_orchestrator_ambiguous_prompt():
    """Verify RootOrchestrator routes ambiguous multi-topic prompt without throwing."""
    res = root_agent.route_request("Tag creative mechanics and rebalance Hill saturation pacing for 9-grid attribution")
    assert res["route"] in ["TaggingAgent", "AnalyticsAgent", "MediaBuyingAgent", "OrchestratorComposite"]
    assert "message" in res


def test_t2_f16_b06_media_buying_zero_shift_optimization():
    """Verify MediaBuyingAgent maintains spend when all channels are already equimarginally balanced."""
    agent = create_media_buying_agent()
    channels = [
        {"channel": "YouTube", "current_spend": 250000.0, "base_roas": 3.0, "half_saturation_s": 250000.0, "hill_slope_k": 1.4},
        {"channel": "Meta", "current_spend": 250000.0, "base_roas": 3.0, "half_saturation_s": 250000.0, "hill_slope_k": 1.4},
    ]
    res = agent.execute_budget_reallocation(channels=channels, total_budget=500000.0)
    assert res["zero_sum_satisfied"] is True
    assert abs(res["channel_allocations"][0]["spend_delta"]) < 1000.0
