"""Tier 3 Combinations: Multi-Agent Fleet -> Frontend Console Integration.

Verifies end-to-end payload validation and protocol synchronization between:
- A2UI Protocol Generator (`03-measurement/agents/app/protocols/a2ui_protocol.py`)
- Frontend Widget Catalog & Security Validator (`03-measurement/frontend/src/lib/widget_catalog.ts`)
- Next.js A2UIRenderer Component Tree & SSE Stream Handlers
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

from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator
from agents.app.protocols.a2a_protocol import create_a2a_message, route_a2a_message
from agents.app.sub_agents.analytics_agent import create_analytics_agent, AnalyticsAgent
from agents.app.sub_agents.media_buying_agent import create_media_buying_agent, MediaBuyingAgent
from agents.app.sub_agents.tagging_agent import TaggingAgent
from agents.app.agent import root_agent


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


# Frontend Widget Catalog Validator Simulation
TRUSTED_WIDGET_TYPES = {
    "a2ui-metric-card",
    "a2ui-bar-chart",
    "a2ui-line-chart",
    "a2ui-scurve-chart",
    "a2ui-recommendation-card",
    "a2ui-grid-layout",
    "a2ui-alert-banner",
    "a2ui-button-action",
}

def validate_widget_node(node: dict) -> bool:
    if not isinstance(node, dict):
        return False
    node_id = node.get("id") or node.get("component_id")
    if not node_id or not isinstance(node_id, str):
        return False
    node_type = node.get("type") or node.get("component_type")
    if node_type not in TRUSTED_WIDGET_TYPES:
        return False
    if "children" in node and isinstance(node["children"], list):
        return all(validate_widget_node(c) for c in node["children"])
    return True


def test_t3_01_a2ui_metric_card_to_frontend_validator():
    """Verify A2UI metric card generator produces compliant frontend widget node."""
    card = A2UIProtocolGenerator.build_metric_card(
        component_id="metric-d7-roas",
        title="Predicted Day-7 ROAS",
        value="3.42x",
        subtitle="Post-Conflict Mitigation",
        delta="+24.8%",
        trend="up",
        badge="TARGET_BEAT",
    )
    assert validate_widget_node(card) is True


def test_t3_02_a2ui_scurve_chart_to_frontend_validator():
    """Verify A2UI S-curve chart generator produces compliant frontend widget node."""
    channels = [
        {"channel": "YouTube", "spend": 1400000, "marginal_roas": 3.2},
        {"channel": "Meta", "spend": 1200000, "marginal_roas": 2.8},
    ]
    chart = A2UIProtocolGenerator.build_scurve_chart(
        component_id="scurve-meridian-01",
        title="Meridian Response Vectors",
        channels=channels,
    )
    assert validate_widget_node(chart) is True


def test_t3_03_a2ui_recommendation_card_to_frontend_validator():
    """Verify A2UI recommendation card generator produces compliant frontend widget node."""
    recom = A2UIProtocolGenerator.build_recommendation_card(
        component_id="recom-action-plan",
        title="Autonomous Reallocation Directives",
        recommendations=[
            {"action": "Shift $80k to TikTok 9:16 vertical hooks", "expected_lift": "+18.2% D7 ROAS"},
        ],
    )
    assert validate_widget_node(recom) is True


def test_t3_04_a2ui_sse_stream_parsing_to_frontend_state():
    """Verify SSE line stream format parses into JSON object matching frontend state."""
    raw_sse = A2UIProtocolGenerator.format_sse_event(
        event_type="component",
        agent_name="RootOrchestratorAgent",
        session_id="session-frontend-test-01",
        content="Generated Executive Summary Metric",
        component={
            "component_type": "a2ui-metric-card",
            "component_id": "metric-stream-01",
            "title": "Effective CPI",
            "data": {"value": "$4.12", "delta": "-18.5%"},
        },
        metadata={"step": 2, "timestamp": "2026-08-17T12:00:00Z"},
    )
    # Simulate client-side EventSource onmessage parser
    lines = raw_sse.strip().split("\n")
    assert lines[0] == "event: message"
    assert lines[1].startswith("data: ")

    payload_json = json.loads(lines[1][6:])
    assert payload_json["event_type"] == "component"
    assert payload_json["component"]["component_type"] == "a2ui-metric-card"
    assert validate_widget_node(payload_json["component"]) is True


def test_t3_05_scenario_page_a2a_dispatch_to_media_buying_agent():
    """Verify Scenario page A2A envelope is processed by MediaBuyingAgent."""
    agent = create_media_buying_agent()
    envelope = {
        "sender": "Frontend_ScenarioCockpit",
        "recipient": "MediaBuyingAgent",
        "intent": "EXECUTE_EQUIMARGINAL_REBALANCE",
        "payload": {
            "campaign_id": "camp-fc27-pacing-rebalance",
            "franchise": "EA Sports FC",
            "total_budget": 4200000.0,
            "channel_spends": {
                "youtube": 1400000.0,
                "meta": 1200000.0,
                "programmatic_3d": 900000.0,
                "tiktok": 700000.0,
            },
        },
        "correlation_id": f"corr-scenario-pacing-{uuid.uuid4().hex[:6]}",
    }
    msg = create_a2a_message(
        sender=envelope["sender"],
        recipient=envelope["recipient"],
        intent=envelope["intent"],
        payload=envelope["payload"],
        correlation_id=envelope["correlation_id"],
    )
    resp = route_a2a_message(msg)
    assert resp["status"] in ["PROCESSED", "DELIVERED"]
    assert resp["intent"] in ["ACK_EXECUTE_EQUIMARGINAL_REBALANCE", "ACK_QUEUED"]


def test_t3_06_analytics_cot_trace_to_a2ui_update_data_model():
    """Verify AnalyticsAgent CoT output updates frontend state via A2UI updateDataModel."""
    agent = create_analytics_agent()
    insights = agent.explain_attribution_insights(franchise="EA Sports FC")

    # Construct updateDataModel message for frontend state binding
    update_msg = A2UIProtocolGenerator.update_data_model(
        surface_id="surface-attribution-fc27",
        path="/attribution/geminiCoTTrace",
        value=insights["chain_of_thought_reasoning"],
    )
    assert update_msg["type"] == "updateDataModel"
    assert update_msg["surfaceId"] == "surface-attribution-fc27"
    assert update_msg["path"] == "/attribution/geminiCoTTrace"
    assert len(update_msg["value"]) >= 3
