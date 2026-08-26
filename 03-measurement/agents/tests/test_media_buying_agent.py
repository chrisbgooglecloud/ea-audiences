"""Unit tests for MediaBuyingAgent CTI decay detection and A2A Creative Studio dispatch."""

import pytest
from agents.app.sub_agents.media_buying_agent import MediaBuyingAgent, create_media_buying_agent
from agents.app.protocols.a2a_protocol import (
    register_agent_handler,
    get_conversation_history,
)


@pytest.fixture
def media_agent():
    """Fixture providing MediaBuyingAgent instance."""
    return create_media_buying_agent()


def test_detect_cti_decay_triggered(media_agent):
    """Verify detect_cti_decay flags negative CTI lift and severe CTR divergence."""
    performance = {
        "asset_id": "asset-fc27-pretest-001",
        "franchise": "EA Sports FC",
        "marginal_ctr_lift_pct": 41.0,
        "marginal_cti_lift_pct": -12.1,
        "funnel_balance_index": 0.28,
    }
    result = media_agent.detect_cti_decay(performance)
    assert result["decay_detected"] is True
    assert result["franchise"] == "EA Sports FC"
    assert len(result["trigger_reasons"]) >= 2
    
    rec = result["prescriptive_recommendation"]
    assert rec is not None
    assert rec["feature_name"] == "FUT Pack Walkout Jude Bellingham"
    assert rec["creative_direction"] == "Jude Bellingham 9:16 vertical walkout"
    assert rec["aspect_ratio"] == "9:16"
    assert rec["budget_allocated"] == 85000.0
    assert rec["expected_marginal_cti_lift_pct"] == 32.4
    assert rec["expected_marginal_roas_multiplier"] == 3.42
    assert "TikTok" in rec["target_channels"]


def test_detect_cti_decay_healthy(media_agent):
    """Verify detect_cti_decay passes healthy assets with strong CTI and FBI."""
    performance = {
        "asset_id": "asset-fc27-pretest-002",
        "franchise": "EA Sports FC",
        "marginal_ctr_lift_pct": 4.2,
        "marginal_cti_lift_pct": 32.4,
        "funnel_balance_index": 0.78,
    }
    result = media_agent.detect_cti_decay(performance)
    assert result["decay_detected"] is False
    assert result["prescriptive_recommendation"] is None


def test_detect_cti_decay_apex_franchise(media_agent):
    """Verify detect_cti_decay produces franchise-specific prescriptive recommendations for Apex Legends."""
    performance = {
        "asset_id": "asset-apex-pretest-001",
        "franchise": "Apex Legends",
        "marginal_ctr_lift_pct": 38.0,
        "marginal_cti_lift_pct": -9.0,
        "funnel_balance_index": 0.35,
    }
    result = media_agent.detect_cti_decay(performance)
    assert result["decay_detected"] is True
    rec = result["prescriptive_recommendation"]
    assert rec["feature_name"] == "Apex Mythic Heirloom Inspect"
    assert rec["expected_marginal_cti_lift_pct"] == 28.5


def test_dispatch_creative_revision_on_cti_decay(media_agent):
    """Verify automated A2A dispatch to Curtis Gross's Creative Studio on CTI decay."""
    performance = {
        "asset_id": "asset-fc27-pretest-001",
        "franchise": "EA Sports FC",
        "marginal_ctr_lift_pct": 41.0,
        "marginal_cti_lift_pct": -12.1,
        "funnel_balance_index": 0.28,
    }
    corr_id = "corr-test-cti-dispatch-001"
    res = media_agent.dispatch_creative_revision_on_cti_decay(
        performance_metrics=performance,
        creative_agent_name="Curtis_CreativeStudioAgent",
        campaign_id="camp-fc27-toty-001",
        correlation_id=corr_id,
    )
    assert res["status"] == "REVISION_DISPATCHED"
    assert res["audit"]["decay_detected"] is True
    
    dispatched = res["dispatched_message"]
    assert dispatched["sender"] == "MediaBuyingAgent"
    assert dispatched["recipient"] == "Curtis_CreativeStudioAgent"
    assert dispatched["intent"] == "REVISE_CREATIVE"
    assert dispatched["correlation_id"] == corr_id
    
    payload = dispatched["payload"]
    assert payload["action"] == "REVISE_CREATIVE"
    assert payload["campaign_id"] == "camp-fc27-toty-001"
    assert payload["creative_direction"] == "Jude Bellingham 9:16 vertical walkout"
    assert payload["feature_name"] == "FUT Pack Walkout Jude Bellingham"
    assert payload["aspect_ratio"] == "9:16"
    assert payload["budget_allocated"] == 85000.0
    assert payload["expected_marginal_cti_lift_pct"] == 32.4
    assert payload["expected_marginal_roas_multiplier"] == 3.42


def test_dispatch_creative_revision_healthy_no_op(media_agent):
    """Verify dispatch is a no-op when performance metrics are healthy."""
    performance = {
        "asset_id": "asset-fc27-healthy",
        "franchise": "EA Sports FC",
        "marginal_ctr_lift_pct": 5.0,
        "marginal_cti_lift_pct": 25.0,
        "funnel_balance_index": 0.82,
    }
    res = media_agent.dispatch_creative_revision_on_cti_decay(performance)
    assert res["status"] == "NO_DECAY_DETECTED"
    assert res["dispatched_message"] is None


def test_a2a_trace_history_preserved(media_agent):
    """Verify full A2A conversation history is preserved on the message bus."""
    corr_id = "corr-test-trace-history-001"
    performance = {
        "asset_id": "asset-fc27-decay-trace",
        "franchise": "EA Sports FC",
        "marginal_ctr_lift_pct": 40.0,
        "marginal_cti_lift_pct": -10.0,
        "funnel_balance_index": 0.30,
    }
    media_agent.dispatch_creative_revision_on_cti_decay(
        performance_metrics=performance,
        correlation_id=corr_id,
    )
    
    history = get_conversation_history(corr_id)
    assert len(history) >= 2  # Dispatched message + Response ACK
    assert history[0]["intent"] == "REVISE_CREATIVE"
    assert history[0]["sender"] == "MediaBuyingAgent"


def test_custom_curtis_handler_ack(media_agent):
    """Verify dispatch with registered Curtis_CreativeStudioAgent custom mock handler."""
    def curtis_mock_handler(message):
        payload = message.get("payload", {})
        return {
            "status": "ASSET_RENDERED",
            "variant_asset_id": "asset-fc27-bellingham-9x16-v1",
            "asset_gcs_uri": "gs://eagames-ebc-demo-app-creative-assets/fc27/bellingham_walkout_9x16.mp4",
            "aspect_ratio": payload.get("aspect_ratio", "9:16"),
            "featured_mechanic": payload.get("feature_name", "Jude Bellingham 9:16 Vertical Walkout"),
            "projected_cti_lift_pct": payload.get("expected_marginal_cti_lift_pct", 32.4),
            "projected_d7_roas": payload.get("expected_marginal_roas_multiplier", 3.42),
            "funnel_balance_index": 0.78,
        }

    register_agent_handler("Curtis_CreativeStudioAgent", curtis_mock_handler)

    performance = {
        "asset_id": "asset-fc27-curtis-test",
        "franchise": "EA Sports FC",
        "marginal_ctr_lift_pct": 42.0,
        "marginal_cti_lift_pct": -15.0,
        "funnel_balance_index": 0.25,
    }
    res = media_agent.dispatch_creative_revision_on_cti_decay(
        performance_metrics=performance,
        creative_agent_name="Curtis_CreativeStudioAgent",
    )
    assert res["status"] == "REVISION_DISPATCHED"
    ack = res["negotiation_response"]
    assert ack["intent"] == "ACK_REVISE_CREATIVE"
    assert ack["status"] == "PROCESSED"
    assert ack["payload"]["status"] == "ASSET_RENDERED"
    assert "gs://eagames-ebc-demo-app-creative-assets/fc27/bellingham_walkout_9x16.mp4" in ack["payload"]["asset_gcs_uri"]
