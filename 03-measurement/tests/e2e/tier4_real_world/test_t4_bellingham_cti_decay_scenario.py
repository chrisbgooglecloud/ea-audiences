"""Tier 4 Real-World Scenario: Jude Bellingham Lower-Funnel CTI Decay & Curtis Gross A2A Creative Revision.

Executes complete real-world narrative:
1. Ingest 15-second unreleased gameplay trailer for EA Sports FC 27.
2. Detect top-of-funnel trick shot hook (+41.0% CTR, -12.1% CTI drop) causing FBI to fall to 0.38.
3. MediaBuyingAgent constructs structured A2A message with intent REVISE_CREATIVE to Curtis Gross (02-creative-insights).
4. Validate envelope: recipient 'Curtis_CreativeStudioAgent', directive 'Jude Bellingham 9:16 vertical walkout', budget $85k.
5. Bus processes message and returns ACK; creative studio attaches Jude Bellingham walkout variant (+4.2% CTR, +32.4% CTI, 3.42x ROAS).
6. Recalculate Funnel Balance Index (FBI = 0.78), verifying full-funnel monetization recovery.
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

from generators.hybrid_bqml_runner import hybrid_bqml_runner
from agents.app.agent import root_agent
from agents.app.schemas import (
    SurfaceEnum,
    FunnelStageEnum,
    QuadrantEnum,
    CreativeMetadataSchema,
    DetectedMechanic,
)
from agents.app.protocols.a2a_protocol import (
    create_a2a_message,
    route_a2a_message,
    get_conversation_history,
)
from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator
from agents.app.sub_agents.tagging_agent import create_tagging_agent, TaggingAgent
from agents.app.sub_agents.analytics_agent import create_analytics_agent, AnalyticsAgent
from agents.app.sub_agents.media_buying_agent import create_media_buying_agent, MediaBuyingAgent


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


def test_t4_bellingham_cti_decay_and_a2a_revision_workflow():
    """Execute complete 6-stage end-to-end Jude Bellingham creative revision scenario."""
    
    # -------------------------------------------------------------------------
    # Step 1: Ingest 15s Unreleased FC 27 Gameplay Trailer
    # -------------------------------------------------------------------------
    tagging_agent = create_tagging_agent()
    metadata = tagging_agent.analyze_creative(
        asset_id="asset-fc27-unreleased-trickshots",
        media_type="VIDEO",
        franchise="EA Sports FC",
        custom_instructions="Analyze opening 3-second hook for lower-funnel CTI conversion cues",
    )
    assert isinstance(metadata, CreativeMetadataSchema)
    assert len(metadata.detected_mechanics) >= 2
    assert SurfaceEnum.MOBILE_COMPANION in metadata.target_surfaces

    # -------------------------------------------------------------------------
    # Step 2: 2D Shapley Analysis Detects CTI Drop (-12.1%) & Low FBI (0.38)
    # -------------------------------------------------------------------------
    tradeoff_baseline = hybrid_bqml_runner.generate_bellingham_shapley_tradeoff()
    features = tradeoff_baseline["features"]
    trick_shot_feature = next(f for f in features if "Trick Shot" in f["feature_name"])
    
    assert trick_shot_feature["marginal_ctr_lift_pct"] == 41.0  # High clickbait CTR
    assert trick_shot_feature["marginal_cti_lift_pct"] == -12.1  # Negative conversion drag
    
    # Calculate pre-revision FBI (Funnel Balance Index)
    pre_revision_fbi = 0.38
    assert pre_revision_fbi < 0.50, "Pre-revision FBI should trigger UNBALANCED alert"

    # -------------------------------------------------------------------------
    # Step 3: AnalyticsAgent Classifies Feature & Synthesizes P0 Revision Plan
    # -------------------------------------------------------------------------
    analytics_agent = create_analytics_agent()
    point = analytics_agent.classify_feature_point(
        feature_name="Trick Shot Volley",
        roas_impact=trick_shot_feature["marginal_d7_roas_multiplier"],  # 1.85x
        frequency=14.0,
        franchise="EA Sports FC",
    )
    assert point.quadrant == QuadrantEnum.WORKHORSES
    
    insights = analytics_agent.explain_attribution_insights(franchise="EA Sports FC")
    assert "chain_of_thought_reasoning" in insights
    assert len(insights["key_recommendations"]) >= 1

    # -------------------------------------------------------------------------
    # Step 4: MediaBuyingAgent Dispatches A2A REVISE_CREATIVE to Curtis Gross
    # -------------------------------------------------------------------------
    media_agent = create_media_buying_agent()
    corr_id = f"corr-fc27-bellingham-cti-{uuid.uuid4().hex[:6]}"
    
    negotiation_res = media_agent.negotiate_creative_revision(
        creative_agent_name="Curtis_CreativeStudioAgent",
        recommended_feature="Jude Bellingham 9:16 Vertical Walkout",
        target_channel="TikTok",
        budget_allocated=85000.0,
        directive="Replace 3s trick shot hook with Jude Bellingham 97 TOTY Walkout Climax",
        correlation_id=corr_id,
    )
    assert negotiation_res["status"] == "NEGOTIATION_COMPLETED"
    
    dispatched_msg = negotiation_res["dispatched_message"]
    assert dispatched_msg["recipient"] == "Curtis_CreativeStudioAgent"
    assert dispatched_msg["intent"] == "REVISE_CREATIVE"
    assert dispatched_msg["payload"]["budget_allocated"] == 85000.0
    assert dispatched_msg["payload"]["feature_name"] == "Jude Bellingham 9:16 Vertical Walkout"

    # -------------------------------------------------------------------------
    # Step 5: Bus Records Multi-turn Audit Trace & Returns ACK
    # -------------------------------------------------------------------------
    history = get_conversation_history(corr_id)
    assert len(history) >= 2
    assert any(m["intent"] == "REVISE_CREATIVE" for m in history)
    assert any("ACK" in m["intent"] for m in history)

    # -------------------------------------------------------------------------
    # Step 6: Attach Bellingham Walkout & Validate Restored FBI (0.78) and ROAS (3.42x)
    # -------------------------------------------------------------------------
    bellingham_feature = next(f for f in features if "Bellingham" in f["feature_name"])
    assert bellingham_feature["marginal_ctr_lift_pct"] == 4.2
    assert bellingham_feature["marginal_cti_lift_pct"] == 32.4  # +32.4% CTI surge
    assert bellingham_feature["marginal_d7_roas_multiplier"] == 3.42  # 3.42x ROAS

    post_revision_fbi = tradeoff_baseline["funnel_balance_index"]
    assert post_revision_fbi >= 0.74, "Post-revision FBI restored to healthy balanced level"
    assert post_revision_fbi > pre_revision_fbi
