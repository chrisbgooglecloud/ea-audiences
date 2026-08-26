"""Integration tests for FastAPI agent server routes."""

import pytest
from fastapi.testclient import TestClient
from agents.app.fast_api_app import app

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /health returns service status and model configurations."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "TaggingAgent" in data["agents"]
    assert "AnalyticsAgent" in data["agents"]
    assert "MediaBuyingAgent" in data["agents"]


def test_agent_card_endpoint():
    """Verify GET /.well-known/agent-card.json returns valid A2A agent card."""
    response = client.get("/.well-known/agent-card.json")
    assert response.status_code == 200
    card = response.json()
    assert card["name"] == "eagames-ebc-demo-ge-app"
    assert card["version"] == "2.0.0"
    assert "skills" in card
    assert len(card["skills"]) == 3
    skill_ids = [s["id"] for s in card["skills"]]
    assert "campaign_intake_prediction" in skill_ids
    assert "shapley_video_analysis" in skill_ids
    assert "meridian_equimarginal_pacing" in skill_ids


def test_agent_run_endpoint_budget():
    """Verify POST /api/v1/agents/run routes to MediaBuyingAgent."""
    payload = {
        "prompt": "Optimize budget allocation and solve equimarginal pacing for YouTube and Meta",
        "franchise": "Apex Legends",
    }
    response = client.post("/api/v1/agents/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert data["response"]["route"] == "MediaBuyingAgent"
    assert "results" in data["response"]
    assert data["response"]["results"]["zero_sum_satisfied"] is True


def test_agent_stream_endpoint():
    """Verify POST /api/v1/agents/stream returns valid Server-Sent Events."""
    payload = {
        "prompt": "Run budget allocation optimization and stream A2UI components",
        "franchise": "Apex Legends",
    }
    response = client.post("/api/v1/agents/stream", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    
    # Read first lines of stream
    content = response.text
    assert "event: message" in content
    assert "thought" in content or "component" in content


def test_a2a_message_endpoints():
    """Verify POST /a2a/messages and GET /a2a/messages/{correlation_id}."""
    post_payload = {
        "sender": "MediaBuyingAgent",
        "recipient": "TaggingAgent",
        "intent": "REVISE_CREATIVE",
        "payload": {"feature": "Squad Breach"},
        "correlation_id": "corr-test-fastapi-01",
    }
    res_post = client.post("/a2a/messages", json=post_payload)
    assert res_post.status_code == 200
    data_post = res_post.json()
    assert data_post["dispatched"]["status"] == "SENT"

    # Get conversation history
    res_get = client.get("/a2a/messages/corr-test-fastapi-01")
    assert res_get.status_code == 200
    data_get = res_get.json()
    assert data_get["message_count"] >= 1


def test_subagent_direct_endpoints():
    """Verify direct subagent execution routes."""
    # 1. Tagging
    res_tag = client.post("/subagents/tagging", json={"franchise": "Apex Legends"})
    assert res_tag.status_code == 200
    assert "detected_mechanics" in res_tag.json()

    # 2. Analytics
    res_ana = client.post("/subagents/analytics", json={"franchise": "Apex Legends"})
    assert res_ana.status_code == 200
    assert "executive_summary" in res_ana.json()

    # 3. Media buying
    res_mb = client.post("/subagents/media-buying", json={})
    assert res_mb.status_code == 200
    assert "total_allocated_budget" in res_mb.json()
