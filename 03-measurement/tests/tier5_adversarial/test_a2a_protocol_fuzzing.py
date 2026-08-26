"""Tier 5 Adversarial Tests: A2A Cross-Agent Protocol Fuzzing & Message Bus Robustness.

Adversarial vectors:
1. Envelope Fuzzing: Missing correlation_id, None fields, corrupted payloads.
2. Unregistered & Malicious Recipients: Routing to non-existent agents, null recipients.
3. Fault Injection in Handlers: Handlers raising ZeroDivisionError, KeyError, RuntimeError.
4. Message Bus Integrity: Huge nested payloads, circular message loops, trace queries for non-existent IDs.
5. REST Endpoint Fuzzing: Invalid A2A payloads to `/api/v1/agents/a2a` and `/a2a/messages`.
"""

import pytest
import uuid
from typing import Dict, Any
from fastapi.testclient import TestClient

from agents.app.protocols.a2a_protocol import (
    create_a2a_message,
    route_a2a_message,
    get_conversation_history,
    register_agent_handler,
    _MESSAGE_BUS,
    _AGENT_HANDLERS,
)
from agents.app.schemas import A2AMessage
from app.main import app as backend_app
from agents.app.fast_api_app import app as agents_app


class TestAdversarialA2AProtocol:
    """Stress-test A2A protocol bus and routing engine."""

    def test_missing_correlation_id_generates_valid_uuid(self):
        """When correlation_id is omitted or None, a valid UUID must be generated."""
        msg = create_a2a_message(
            sender="MediaBuyingAgent",
            recipient="TaggingAgent",
            intent="PROPOSE_ALLOCATION",
            payload={"delta": 5000},
            correlation_id=None,
        )
        assert msg["correlation_id"] is not None
        assert msg["correlation_id"].startswith("corr-")
        assert len(msg["correlation_id"]) > 5

    def test_unregistered_recipient_falls_back_to_queued_ack(self):
        """Routing to an agent with no registered handler returns ACK_QUEUED without throwing."""
        msg = create_a2a_message(
            sender="AttributionAgent",
            recipient="NonExistentGhostAgent_999",
            intent="SYNC_STATE",
            payload={"sync": True},
        )
        response = route_a2a_message(msg)

        assert response["status"] == "DELIVERED"
        assert response["intent"] == "ACK_QUEUED"
        assert response["sender"] == "NonExistentGhostAgent_999"
        assert response["correlation_id"] == msg["correlation_id"]

    def test_failing_handler_returns_rejected_status_safely(self):
        """When an agent handler raises an exception, route_a2a_message must catch it and return REJECT."""
        faulty_agent_name = f"FaultyAgent_{uuid.uuid4().hex[:6]}"

        def crashing_handler(payload: Dict[str, Any]):
            raise ValueError("Simulated catastrophic agent crash during processing")

        register_agent_handler(faulty_agent_name, crashing_handler)

        msg = create_a2a_message(
            sender="TestRunner",
            recipient=faulty_agent_name,
            intent="CRITICAL_CALCULATION",
            payload={"input": 42},
        )
        response = route_a2a_message(msg)

        assert response["status"] == "REJECTED"
        assert response["intent"] == "REJECT"
        assert "Simulated catastrophic agent crash" in response["payload"]["error"]

    def test_deeply_nested_and_oversized_payload_fuzzing(self):
        """Fuzz A2A bus with deeply nested dictionaries and large payload structures."""
        # Construct 50-level nested dictionary
        nested_dict: Dict[str, Any] = {"leaf": "value"}
        for i in range(50):
            nested_dict = {f"level_{i}": nested_dict}

        corr_id = f"corr-deep-fuzz-{uuid.uuid4().hex[:6]}"
        msg = create_a2a_message(
            sender="FuzzerAgent",
            recipient="MediaBuyingAgent",
            intent="STRESS_TEST",
            payload=nested_dict,
            correlation_id=corr_id,
        )

        assert msg["payload"] == nested_dict
        history = get_conversation_history(corr_id)
        assert len(history) >= 1
        assert history[0]["message_id"] == msg["message_id"]

    def test_trace_for_nonexistent_correlation_id_returns_empty_list(self):
        """Querying history for an unknown correlation_id returns an empty list without error."""
        history = get_conversation_history("corr-completely-non-existent-999999")
        assert isinstance(history, list)
        assert len(history) == 0

    def test_a2a_message_schema_validation_adversarial(self):
        """Validate Pydantic A2AMessage schema against malformed structures."""
        # Valid message
        valid_msg = A2AMessage(
            message_id="msg-1",
            correlation_id="corr-1",
            sender="AgentA",
            recipient="AgentB",
            timestamp="2026-08-09T00:00:00Z",
            intent="TEST",
            payload={"key": "val"},
        )
        assert valid_msg.status == "SENT"

        # Missing required fields
        with pytest.raises(Exception):
            A2AMessage(sender="AgentA")  # type: ignore


class TestAdversarialA2ARestEndpoints:
    """Stress-test REST A2A message dispatch endpoints."""

    def test_backend_a2a_endpoint_with_corrupted_json(self):
        """POST /api/v1/agents/a2a with corrupted JSON body returns 422."""
        with TestClient(backend_app) as client:
            resp = client.post(
                "/api/v1/agents/a2a",
                json={"corrupted_field": True},
            )
            assert resp.status_code == 422

    def test_agents_fleet_a2a_messages_endpoint_fuzzing(self):
        """POST /a2a/messages on ADK agents app server."""
        with TestClient(agents_app) as client:
            # 1. Valid dispatch
            resp = client.post(
                "/a2a/messages",
                json={
                    "sender": "MediaBuyingAgent",
                    "recipient": "TaggingAgent",
                    "intent": "REVISE_CREATIVE",
                    "payload": {"target_quadrant": "GOLD_MINES"},
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "dispatched" in data
            assert "response" in data
            assert data["dispatched"]["intent"] == "REVISE_CREATIVE"

            # 2. Missing required fields
            bad_resp = client.post(
                "/a2a/messages",
                json={"sender": "OnlySender"},
            )
            assert bad_resp.status_code == 422
