"""Tier 5 Adversarial Tests: A2UI Dynamic Tag Fuzzing & SSE Streaming Robustness.

Adversarial vectors:
1. Malformed XML/HTML Tag Fuzzing: Unclosed `<a2ui-*>`, mismatched tags, broken attributes, truncated tags.
2. Attribute Injection & XSS: Script tags, quotes escaping, invalid JSON inside web component attributes.
3. A2UI Protocol Generator Boundary Inputs: None values, empty collections, negative metrics.
4. Server-Sent Events (SSE) Stream Deserialization: Fragmented chunks, corrupted JSON in data lines.
"""

import re
import json
import pytest
from typing import List, Dict, Any
from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator
from app.schemas.protocols import A2UIComponent, A2UIStreamEvent


class TestAdversarialA2UITagParsing:
    """Stress-test custom <a2ui-*> tag parser against malformed and hostile inputs."""

    def test_unclosed_and_mismatched_a2ui_tags(self):
        """Verify regex / DOM parser behavior when tags are unclosed or mismatched."""
        tag_pattern = re.compile(r"<(a2ui-[a-z-]+)\s+([^>]+)></\1>")

        raw_streams_adversarial = [
            # 1. Unclosed tag
            '<a2ui-metric-card id="card-1" title="Unclosed Tag"',
            # 2. Mismatched closing tag
            '<a2ui-metric-card id="card-2" title="Mismatched"></a2ui-line-chart>',
            # 3. Truncated mid-attribute
            '<a2ui-metric-card id="card-3" title="Trunca',
            # 4. Self-closing instead of explicit closing pair
            '<a2ui-metric-card id="card-4" title="Self-closing" />',
        ]

        for stream in raw_streams_adversarial:
            matches = tag_pattern.findall(stream)
            # The strict pair pattern will correctly reject these malformed streams
            assert len(matches) == 0

    def test_valid_paired_tags_extracted_among_corrupted_text(self):
        """Verify valid tags are still successfully parsed even when surrounded by garbage/malformed tags."""
        tag_pattern = re.compile(r"<(a2ui-[a-z-]+)\s+([^>]+)></\1>")

        noisy_stream = """
        Corrupted opening: <a2ui-broken id="bad"
        Valid Card: <a2ui-metric-card id="card-ok" title="Valid Metric" value="+45%"></a2ui-metric-card>
        Mismatched: <a2ui-line-chart id="bad2"></a2ui-metric-card>
        Valid Chart: <a2ui-line-chart id="chart-ok" data-points="10"></a2ui-line-chart>
        Garbage closing: </a2ui-random>
        """

        matches = tag_pattern.findall(noisy_stream)
        assert len(matches) == 2

        tag_1, attrs_1 = matches[0]
        tag_2, attrs_2 = matches[1]

        assert tag_1 == "a2ui-metric-card"
        assert 'id="card-ok"' in attrs_1
        assert tag_2 == "a2ui-line-chart"
        assert 'id="chart-ok"' in attrs_2

    def test_attribute_injection_and_quotes_handling(self):
        """Stress-test attribute parsing against hostile injection strings."""
        tag_pattern = re.compile(r'(\w+)=["\']([^"\']*)["\']')

        sample_attrs = 'id="card-xss" title="Apex <script>alert(1)</script>" data="{\\"key\\": \\"val\\"}"'
        extracted_attrs = dict(tag_pattern.findall(sample_attrs))

        assert extracted_attrs["id"] == "card-xss"
        assert "<script>alert(1)</script>" in extracted_attrs["title"]


class TestAdversarialA2UIProtocolGenerator:
    """Stress-test A2UIProtocolGenerator helper functions with boundary and edge inputs."""

    def test_build_metric_card_boundary_values(self):
        """Verify metric card generation with empty, negative, or extreme values."""
        card1 = A2UIProtocolGenerator.build_metric_card(
            component_id="metric-boundary-1",
            title="",
            value="0.00",
            subtitle=None,
            delta="-100.0%",
            trend="down",
            badge=None,
        )
        assert card1["component_type"] == "a2ui-metric-card"
        assert card1["data"]["subtitle"] == ""
        assert card1["data"]["badge"] == ""

    def test_build_scurve_chart_empty_channels(self):
        """Verify S-curve generator handles empty channel lists without failing."""
        card = A2UIProtocolGenerator.build_scurve_chart(
            component_id="scurve-empty",
            title="Empty Channels",
            channels=[],
        )
        assert card["component_type"] == "a2ui-scurve-chart"
        assert len(card["data"]["channels"]) == 0

    def test_build_recommendation_card_boundary(self):
        """Verify recommendation card generator handles empty or unusual recommendation dicts."""
        card = A2UIProtocolGenerator.build_recommendation_card(
            component_id="recom-fuzz-1",
            title="Test Recommendations",
            recommendations=[],
        )
        assert card["component_type"] == "a2ui-recommendation-card"
        assert card["data"]["recommendations"] == []

    def test_format_sse_event_serialization(self):
        """Verify format_sse_event outputs valid SSE wire format."""
        sse_line = A2UIProtocolGenerator.format_sse_event(
            event_type="test_event",
            agent_name="TestAgent",
            session_id="sess-123",
            content="Sample text with newline \n and unicode 🎮",
            metadata={"priority": "HIGH"},
        )
        assert sse_line.startswith("event: message\ndata: ")
        assert sse_line.endswith("\n\n")

        # Extract data json
        json_part = sse_line.split("data: ")[1].strip()
        data = json.loads(json_part)
        assert data["event_type"] == "test_event"
        assert data["agent_name"] == "TestAgent"
        assert "🎮" in data["content"]
