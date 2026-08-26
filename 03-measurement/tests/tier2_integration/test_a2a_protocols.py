"""Tier 2 Integration Tests: Agent-to-Agent (A2A) Protocols.

Tests:
1. Inter-agent A2A message envelope formatting and validation.
2. Cross-agent negotiation flows (MediaBuyingAgent <-> TaggingAgent, MediaBuyingAgent <-> AnalyticsAgent).
3. Intent routing and payload acknowledgment.
4. Agent state tracking in Firestore.
"""

import time
import pytest
from fastapi.testclient import TestClient
from app.schemas.protocols import A2AMessage


class TestA2AProtocols:
    """Validate inter-agent message passing and multi-agent negotiation."""

    def test_media_buying_to_creative_tagging_negotiation(
        self, client: TestClient, sample_a2a_message: A2AMessage
    ):
        """Verify MediaBuyingAgent sends creative revision request to TaggingAgent and receives ACK."""
        resp = client.post("/api/v1/agents/a2a", json=sample_a2a_message.model_dump())
        assert resp.status_code == 200
        ack_msg = resp.json()

        assert ack_msg["correlation_id"] == sample_a2a_message.correlation_id
        assert ack_msg["sender"] == sample_a2a_message.recipient  # TaggingAgent
        assert ack_msg["recipient"] == sample_a2a_message.sender  # MediaBuyingAgent
        assert ack_msg["intent"] == "ACK"
        assert ack_msg["status"] == "DELIVERED"
        assert ack_msg["payload"]["negotiated_status"] == "ACCEPTED"

    def test_analytics_to_media_buying_allocation_proposal(self, client: TestClient):
        """Verify AnalyticsAgent sends allocation proposal based on SHAP Gold Mines."""
        proposal = A2AMessage(
            message_id="msg-prop-001",
            correlation_id="corr-alloc-888",
            sender="AnalyticsAgent",
            recipient="MediaBuyingAgent",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            intent="PROPOSE_ALLOCATION",
            payload={
                "high_priority_quadrants": ["GOLD_MINES", "CORE_DRIVERS"],
                "recommended_channels": ["TikTok", "YouTube"],
                "suggested_budget_delta_usd": 25000.0,
            },
        )

        resp = client.post("/api/v1/agents/a2a", json=proposal.model_dump())
        assert resp.status_code == 200
        reply = resp.json()
        assert reply["correlation_id"] == "corr-alloc-888"
        assert reply["payload"]["negotiated_status"] == "ACCEPTED"

    def test_agent_states_persistence(self, client: TestClient):
        """Verify A2A session exchanges persist to agent states catalog."""
        session_id = f"sess-test-{int(time.time())}"
        msg = A2AMessage(
            message_id="msg-state-check",
            correlation_id=session_id,
            sender="MediaBuyingAgent",
            recipient="AnalyticsAgent",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            intent="REQUEST_EXPLANATION",
            payload={"focus_metric": "D7 ROAS"},
        )
        client.post("/api/v1/agents/a2a", json=msg.model_dump())

        # Retrieve recent states
        states_resp = client.get("/api/v1/agents/states?limit=10")
        assert states_resp.status_code == 200
        states = states_resp.json()
        assert any(s.get("session_id") == session_id for s in states)

    def test_invalid_a2a_payload_raises_422(self, client: TestClient):
        """Verify missing required fields in A2A envelope raises 422 Unprocessable Entity."""
        malformed_envelope = {
            "message_id": "msg-bad",
            # missing correlation_id, sender, recipient, intent
        }
        resp = client.post("/api/v1/agents/a2a", json=malformed_envelope)
        assert resp.status_code == 422
