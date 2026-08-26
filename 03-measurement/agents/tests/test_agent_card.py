"""Unit tests for Gemini Enterprise Agent Card schema and deployment alignment."""

import os
import json
import pytest

AGENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CARD_PATH = os.path.join(AGENT_DIR, "app", "agent_card.json")
DEPLOYMENT_METADATA_PATH = os.path.join(AGENT_DIR, "deployment_metadata.json")


@pytest.fixture
def agent_card():
    """Fixture to load and parse agent_card.json."""
    assert os.path.exists(CARD_PATH), f"agent_card.json not found at {CARD_PATH}"
    with open(CARD_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def deployment_metadata():
    """Fixture to load deployment_metadata.json."""
    assert os.path.exists(DEPLOYMENT_METADATA_PATH), f"deployment_metadata.json not found at {DEPLOYMENT_METADATA_PATH}"
    with open(DEPLOYMENT_METADATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_agent_card_top_level_structure(agent_card):
    """Verify agent card root keys and protocol version."""
    assert agent_card["name"] == "eagames-ebc-demo-ge-app"
    assert agent_card["version"] == "2.0.0"
    assert agent_card["protocolVersion"] == "0.3.0"
    assert agent_card["preferredTransport"] in ["JSONRPC", "HTTP"]
    assert "https://eagames-ebc-demo-ge-app" in agent_card["url"]
    assert "text/plain" in agent_card["defaultInputModes"]
    assert "application/json" in agent_card["defaultInputModes"]
    assert "text/event-stream" in agent_card["defaultOutputModes"]


def test_agent_card_capabilities_and_a2ui(agent_card):
    """Verify streaming capability and A2UI v0.8 extension configuration."""
    assert "capabilities" in agent_card
    caps = agent_card["capabilities"]
    assert caps.get("streaming") is True
    
    extensions = caps.get("extensions", [])
    assert len(extensions) >= 1
    a2ui_ext = next((e for e in extensions if "a2ui" in e.get("uri", "")), None)
    assert a2ui_ext is not None
    assert "https://a2ui.org/a2a-extension/a2ui/v0.8" in a2ui_ext["uri"]
    assert "ea-creative-measurement-catalog-v1" in a2ui_ext["params"]["supportedCatalogIds"]


def test_agent_card_skills_specification(agent_card):
    """Verify exactly 3 skills exist with exact IDs and non-empty metadata."""
    skills = agent_card.get("skills", [])
    assert len(skills) == 3, f"Expected exactly 3 skills, found {len(skills)}"

    skill_map = {s["id"]: s for s in skills}
    expected_ids = [
        "campaign_intake_prediction",
        "shapley_video_analysis",
        "meridian_equimarginal_pacing",
    ]

    for expected_id in expected_ids:
        assert expected_id in skill_map, f"Missing skill ID: {expected_id}"
        skill = skill_map[expected_id]
        assert len(skill["name"]) > 5
        assert len(skill["description"]) > 20
        assert isinstance(skill["tags"], list) and len(skill["tags"]) >= 3
        assert isinstance(skill["examples"], list) and len(skill["examples"]) >= 2


def test_deployment_metadata_alignment(agent_card, deployment_metadata):
    """Verify agent_card.json aligns with deployment_metadata.json."""
    assert deployment_metadata["agent_name"] == agent_card["name"]
    assert deployment_metadata["location"] == "global"
    assert deployment_metadata["registration_type"] == "a2a"
    assert agent_card["url"] in deployment_metadata["agent_card_url"]
