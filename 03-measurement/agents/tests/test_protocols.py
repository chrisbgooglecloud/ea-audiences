"""Unit tests for A2A and A2UI Protocols."""

import json
import pytest
from agents.app.protocols.a2a_protocol import (
    create_a2a_message,
    route_a2a_message,
    get_conversation_history,
    register_agent_handler,
)
from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator


def test_a2a_protocol_lifecycle():
    """Verify A2A message creation, routing, handler execution, and trace history."""
    # Register custom mock handler
    register_agent_handler("CustomMockAgent", lambda msg: {"result": "ok", "echo": msg["payload"]})

    msg = create_a2a_message(
        sender="MediaBuyingAgent",
        recipient="CustomMockAgent",
        intent="QUERY_AUDIENCE",
        payload={"segment": "LapsedWhales"},
    )
    assert msg["status"] == "SENT"
    assert msg["sender"] == "MediaBuyingAgent"
    assert msg["recipient"] == "CustomMockAgent"

    resp = route_a2a_message(msg)
    assert resp["status"] == "PROCESSED"
    assert resp["payload"]["result"] == "ok"

    history = get_conversation_history(msg["correlation_id"])
    assert len(history) >= 2


def test_a2ui_protocol_actions():
    """Verify A2UI createSurface, surfaceUpdate, updateDataModel messages."""
    surface = A2UIProtocolGenerator.create_surface("surf-01", "Executive Command Center")
    assert surface["type"] == "createSurface"
    assert surface["surfaceId"] == "surf-01"

    update = A2UIProtocolGenerator.surface_update("surf-01", [{"id": "c1"}])
    assert update["type"] == "surfaceUpdate"

    data_model = A2UIProtocolGenerator.update_data_model("surf-01", "/budget/allocated", 150000.0)
    assert data_model["type"] == "updateDataModel"
    assert data_model["value"] == 150000.0


def test_a2ui_widget_catalog_builders():
    """Verify declarative widget catalog component builders."""
    # 1. Metric card
    metric = A2UIProtocolGenerator.build_metric_card("metric-01", "Netmarble ROAS", "+640%", "Shift to tROAS", "+$2.4M", "up")
    assert metric["component_type"] == "a2ui-metric-card"
    assert metric["data"]["value"] == "+640%"

    # 2. S-Curve Chart
    scurve = A2UIProtocolGenerator.build_scurve_chart("chart-01", "Hill Saturation", [{"channel": "YouTube", "spend": 100}])
    assert scurve["component_type"] == "a2ui-scurve-chart"

    # 3. 9-Grid Scatter
    scatter = A2UIProtocolGenerator.build_tactical_9grid_scatter("scatter-01", "Attribution Matrix", [{"feature": "Squad Breach"}])
    assert scatter["component_type"] == "a2ui-grid-scatter"

    # 4. Recommendation Card
    recom_card = A2UIProtocolGenerator.build_recommendation_card(
        "recom-01",
        "P0 Action Recommendations",
        [{"priority": "P0_CRITICAL", "action": "Reallocate $350k to Gold Mines"}],
    )
    assert recom_card["component_type"] == "a2ui-recommendation-card"


def test_a2ui_sse_formatting():
    """Verify SSE line formatting."""
    sse = A2UIProtocolGenerator.format_sse_event(
        event_type="thought",
        agent_name="AnalyticsAgent",
        session_id="sess-123",
        content="Analyzing SHAP values...",
    )
    assert sse.startswith("event: message\ndata: ")
    assert sse.endswith("\n\n")
    
    # Verify json validity inside data
    data_str = sse.split("data: ")[1].strip()
    payload = json.loads(data_str)
    assert payload["event_type"] == "thought"
    assert payload["agent_name"] == "AnalyticsAgent"
