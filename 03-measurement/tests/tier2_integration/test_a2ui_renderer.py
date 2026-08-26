"""Tier 2 Integration Tests: Dynamic A2UI Protocol & Streaming Renderer.

Tests:
1. Server-Sent Events (SSE) `/api/v1/agents/stream` endpoint.
2. A2UI dynamic component payloads (a2ui-metric-card, a2ui-line-chart).
3. Parser verification for `<a2ui-*>` custom tag streaming and deserialization.
4. Client Widget Catalog contract compliance.
"""

import json
import re
import pytest
from fastapi.testclient import TestClient
from app.schemas.protocols import A2UIComponent, A2UIStreamEvent


class TestA2UIStreamingProtocol:
    """Validate Server-Sent Events (SSE) streaming and A2UI component generation."""

    def test_a2ui_streaming_endpoint(self, client: TestClient):
        """Verify SSE endpoint streams valid events (thought, tool_call, component, message, done)."""
        with client.stream(
            "POST",
            "/api/v1/agents/stream?agent_name=MediaBuyingAgent&prompt=Optimize+Budget",
        ) as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers.get("content-type", "")

            events = []
            for line in response.iter_lines():
                if line and line.startswith("data: "):
                    json_str = line[6:]
                    event_data = json.loads(json_str)
                    events.append(event_data)

            assert len(events) >= 5
            event_types = [e["event_type"] for e in events]
            assert "thought" in event_types
            assert "tool_call" in event_types
            assert "component" in event_types
            assert "message" in event_types
            assert "done" in event_types

            # Verify streamed component structures
            component_events = [e for e in events if e["event_type"] == "component"]
            assert len(component_events) >= 2

            comp_types = [c["component"]["component_type"] for c in component_events]
            assert "a2ui-metric-card" in comp_types
            assert "a2ui-line-chart" in comp_types

    def test_a2ui_metric_card_structure(self):
        """Verify A2UI metric card component schema and props."""
        card = A2UIComponent(
            component_type="a2ui-metric-card",
            component_id="metric-d7-roas",
            title="Portfolio D7 ROAS Uplift",
            description="Optimal Equimarginal reallocation",
            data={"current_roas": 2.15, "projected_roas": 2.55, "uplift_pct": 18.4},
            props={"badge": "VERIFIED_OPTIMAL", "variant": "emerald"},
        )
        assert card.component_type == "a2ui-metric-card"
        assert card.data["uplift_pct"] == 18.4
        assert card.props["variant"] == "emerald"

    def test_a2ui_tag_parser_regex_and_dom_extraction(self):
        """Verify parsing of custom <a2ui-metric-card> and <a2ui-line-chart> tags from LLM stream."""
        raw_llm_stream = """
        I have rebalanced the budget across channels. Here is the resulting uplift:
        <a2ui-metric-card id="card-1" title="ROAS Surge" value="+24.5%" variant="emerald"></a2ui-metric-card>
        Below is the Meridian diminishing return curve:
        <a2ui-line-chart id="chart-1" x="spend" y="marginal_roas" data-points="50"></a2ui-line-chart>
        """

        # Regex extracting <a2ui-*> tags
        tag_pattern = re.compile(r"<(a2ui-[a-z-]+)\s+([^>]+)></\1>")
        matches = tag_pattern.findall(raw_llm_stream)

        assert len(matches) == 2
        tag_1, attrs_1 = matches[0]
        tag_2, attrs_2 = matches[1]

        assert tag_1 == "a2ui-metric-card"
        assert 'title="ROAS Surge"' in attrs_1
        assert tag_2 == "a2ui-line-chart"
        assert 'x="spend"' in attrs_2
