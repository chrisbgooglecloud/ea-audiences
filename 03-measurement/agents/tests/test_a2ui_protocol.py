"""Unit tests for A2UI Protocol builders, markup emitters, Pydantic validation, and streaming."""

import re
import json
import pytest
from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator
from agents.app.schemas import A2UIComponent, A2UIStreamEvent


def test_build_conflict_card_default_payload():
    """Verify build_conflict_card default payload and business metrics."""
    card = A2UIProtocolGenerator.build_conflict_card()
    assert card["component_type"] == "a2ui-conflict-card"
    assert card["component_id"] == "conflict-fc27-toty-001"
    assert "Cross-Franchise Audience Collision Detected" in card["title"]
    
    data = card["data"]
    assert data["severity"] == "AMBER"
    assert data["collision_detected"] is True
    assert data["target_franchise"] == "EA Sports FC"
    assert data["conflicting_franchise"] == "Apex Legends"
    assert data["shared_ea_id_overlap_pct"] == 42.1
    assert data["shared_player_count"] == 1280000
    assert data["ad_fatigue_suppression_penalty_pct"] == 14.5
    assert data["net_bookings_risk_usd"] == 420000.0
    assert data["recommended_timeline_shift_days"] == 3
    assert data["mitigated_flight_start"] == "2026-10-27"
    assert data["mitigated_flight_end"] == "2026-11-07"
    assert data["projected_net_bookings_recovery_usd"] == 420000.0
    assert len(data["options"]) == 2

    props = card["props"]
    assert props["variant"] == "amber_warning"
    assert props["allow_one_click_apply"] is True
    assert props["action_payload"]["action"] == "APPLY_COLLISION_MITIGATION"
    assert props["action_payload"]["recovery_usd"] == 420000.0


def test_build_conflict_card_custom_parameters():
    """Verify build_conflict_card with custom parameters."""
    card = A2UIProtocolGenerator.build_conflict_card(
        component_id="conflict-bf6-sims-001",
        title="Battlefield vs Sims Collision",
        severity="CRITICAL",
        target_campaign_id="camp-bf6-001",
        target_campaign_name="Battlefield 6 Global Launch",
        target_franchise="Battlefield",
        conflicting_campaign_id="camp-sims5-002",
        conflicting_campaign_name="The Sims 5 Early Access",
        conflicting_franchise="The Sims",
        shared_ea_id_overlap_pct=28.4,
        ad_fatigue_suppression_penalty_pct=18.0,
        net_bookings_risk_usd=750000.0,
        recommended_timeline_shift_days=5,
        projected_net_bookings_recovery_usd=750000.0,
    )
    assert card["component_id"] == "conflict-bf6-sims-001"
    assert card["data"]["severity"] == "CRITICAL"
    assert card["data"]["target_franchise"] == "Battlefield"
    assert card["data"]["conflicting_franchise"] == "The Sims"
    assert card["data"]["shared_ea_id_overlap_pct"] == 28.4
    assert card["data"]["net_bookings_risk_usd"] == 750000.0
    assert card["data"]["recommended_timeline_shift_days"] == 5


def test_build_conflict_card_markup_generation():
    """Verify render_conflict_card_markup produces valid HTML5 custom element tag."""
    markup = A2UIProtocolGenerator.render_conflict_card_markup(
        component_id="conflict-fc27-toty-001",
        title="Cross-Franchise Audience Collision Detected",
        severity="AMBER",
        target_campaign="EA FC 27 TOTY Mid-Season Push",
        conflicting_campaign="Apex Legends Season 26 Launch",
        overlap_pct=42.1,
        penalty_pct=14.5,
        risk_usd=420000.0,
        shift_days=3,
        recovery_usd=420000.0,
    )
    pattern = r"<(a2ui-conflict-card)\s+([^>]+)></\1>"
    match = re.search(pattern, markup)
    assert match is not None
    assert 'id="conflict-fc27-toty-001"' in markup
    assert 'severity="AMBER"' in markup
    assert 'overlap-pct="42.1"' in markup
    assert 'penalty-pct="14.5"' in markup
    assert 'risk-usd="420000.0"' in markup
    assert 'shift-days="3"' in markup
    assert 'recovery-usd="420000.0"' in markup


def test_build_conflict_card_pydantic_validation():
    """Verify build_conflict_card output adheres to A2UIComponent Pydantic schema."""
    card = A2UIProtocolGenerator.build_conflict_card()
    component = A2UIComponent(**card)
    assert component.component_type == "a2ui-conflict-card"
    assert component.component_id == "conflict-fc27-toty-001"
    assert component.data["severity"] == "AMBER"


def test_build_shapley_chart_default_payload():
    """Verify build_shapley_chart default payload, 2D lift features, and FBI score."""
    chart = A2UIProtocolGenerator.build_shapley_chart()
    assert chart["component_type"] == "a2ui-shapley-chart"
    assert chart["component_id"] == "shapley-fc27-pretest-001"
    assert chart["data"]["franchise"] == "EA Sports FC"
    assert chart["data"]["funnel_balance_index"] == 0.78
    assert chart["data"]["audit_verdict"] == "STRONG_CONVERSION_PROFILE"
    
    features = chart["data"]["features"]
    assert len(features) >= 3

    # Feature 1: Skill Move / Trick Shot (ToFu)
    tofu = next(f for f in features if f["feature_id"] == "feat-fc27-01")
    assert tofu["category"] == "TOP_OF_FUNNEL"
    assert tofu["marginal_ctr_lift_pct"] == 41.0
    assert tofu["marginal_cti_lift_pct"] == -12.1

    # Feature 3: Jude Bellingham (BoFu)
    bofu = next(f for f in features if f["feature_id"] == "feat-fc27-03")
    assert bofu["category"] == "LOWER_FUNNEL_MONETIZATION"
    assert bofu["marginal_ctr_lift_pct"] == 4.2
    assert bofu["marginal_cti_lift_pct"] == 32.4
    assert bofu["marginal_d7_roas_multiplier"] == 3.42

    # Verify breakdown
    breakdown = chart["data"]["video_breakdown"]
    assert len(breakdown["top_of_funnel_features"]) >= 1
    assert len(breakdown["lower_funnel_monetization_features"]) >= 1


def test_build_shapley_chart_custom_features_and_channels():
    """Verify build_shapley_chart with custom Apex Legends mechanics and channels."""
    custom_features = [
        {
            "feature_id": "feat-apex-01",
            "feature_name": "Superglide Movement Showcase",
            "category": "TOP_OF_FUNNEL",
            "funnel_tier": "TOFU",
            "marginal_ctr_lift_pct": 38.0,
            "marginal_cti_lift_pct": -9.0,
            "marginal_d7_roas_multiplier": 1.70,
        },
        {
            "feature_id": "feat-apex-02",
            "feature_name": "Mythic Heirloom Inspect & Finisher",
            "category": "LOWER_FUNNEL_MONETIZATION",
            "funnel_tier": "BOFU",
            "marginal_ctr_lift_pct": 6.5,
            "marginal_cti_lift_pct": 28.5,
            "marginal_d7_roas_multiplier": 3.15,
        },
    ]
    custom_channels = [
        {"channel": "TikTok", "allocated_weight_pct": 50.0, "blended_roas": 3.80},
        {"channel": "YouTube Shorts", "allocated_weight_pct": 50.0, "blended_roas": 3.50},
    ]

    chart = A2UIProtocolGenerator.build_shapley_chart(
        component_id="shapley-apex-s26-001",
        title="Apex Season 26 2D Shapley",
        asset_id="asset-apex-s26-001",
        asset_title="Apex Season 26 Trailer",
        franchise="Apex Legends",
        funnel_balance_index=0.84,
        features=custom_features,
        channel_attribution=custom_channels,
        audit_verdict="BALANCED_HIGH_IMPACT",
    )
    assert chart["data"]["franchise"] == "Apex Legends"
    assert chart["data"]["funnel_balance_index"] == 0.84
    assert len(chart["data"]["features"]) == 2
    assert len(chart["data"]["channel_attribution"]) == 2
    assert chart["data"]["audit_verdict"] == "BALANCED_HIGH_IMPACT"


def test_build_shapley_chart_markup_generation():
    """Verify render_shapley_chart_markup produces valid HTML5 custom element tag."""
    markup = A2UIProtocolGenerator.render_shapley_chart_markup(
        component_id="shapley-fc27-pretest-001",
        title="2D Creative Shapley CTR vs CTI Marginal Lift",
        asset_id="asset-fc27-pretest-001",
        franchise="EA Sports FC",
        funnel_balance_index=0.78,
        top_ctr_feature="Skill Move / Trick Shot Showcase (+41.0%)",
        top_cti_feature="FUT Pack Walkout Jude Bellingham (+32.4%)",
        duration_seconds=15.0,
    )
    pattern = r"<(a2ui-shapley-chart)\s+([^>]+)></\1>"
    match = re.search(pattern, markup)
    assert match is not None
    assert 'id="shapley-fc27-pretest-001"' in markup
    assert 'franchise="EA Sports FC"' in markup
    assert 'funnel-balance-index="0.78"' in markup
    assert 'top-ctr-feature="Skill Move / Trick Shot Showcase (+41.0%)"' in markup
    assert 'top-cti-feature="FUT Pack Walkout Jude Bellingham (+32.4%)"' in markup
    assert 'duration-sec="15.0"' in markup


def test_build_shapley_chart_pydantic_validation():
    """Verify build_shapley_chart output adheres to A2UIComponent Pydantic schema."""
    chart = A2UIProtocolGenerator.build_shapley_chart()
    component = A2UIComponent(**chart)
    assert component.component_type == "a2ui-shapley-chart"
    assert component.component_id == "shapley-fc27-pretest-001"
    assert component.data["funnel_balance_index"] == 0.78


def test_a2ui_sse_stream_event_formatting_with_new_components():
    """Verify format_sse_event serializes conflict and shapley components cleanly."""
    conflict_card = A2UIProtocolGenerator.build_conflict_card()
    sse_conflict = A2UIProtocolGenerator.format_sse_event(
        event_type="component",
        agent_name="MediaBuyingAgent",
        session_id="sess-m3-001",
        component=conflict_card,
    )
    assert sse_conflict.startswith("event: message\ndata: ")
    data_conflict = json.loads(sse_conflict.split("data: ")[1].strip())
    assert data_conflict["component"]["component_type"] == "a2ui-conflict-card"

    shapley_chart = A2UIProtocolGenerator.build_shapley_chart()
    sse_shapley = A2UIProtocolGenerator.format_sse_event(
        event_type="component",
        agent_name="AnalyticsAgent",
        session_id="sess-m3-002",
        component=shapley_chart,
    )
    data_shapley = json.loads(sse_shapley.split("data: ")[1].strip())
    assert data_shapley["component"]["component_type"] == "a2ui-shapley-chart"


def test_surface_lifecycle_and_json_pointer_updates():
    """Verify surface creation, update with new components, and JSON Pointer model updates."""
    surface = A2UIProtocolGenerator.create_surface("surf-m3", "EA Executive Cockpit", layout="grid")
    assert surface["type"] == "createSurface"
    assert surface["layout"] == "grid"

    components = [
        A2UIProtocolGenerator.build_conflict_card(),
        A2UIProtocolGenerator.build_shapley_chart(),
    ]
    update = A2UIProtocolGenerator.surface_update("surf-m3", components)
    assert update["type"] == "surfaceUpdate"
    assert len(update["components"]) == 2

    pointer_update = A2UIProtocolGenerator.update_data_model(
        surface_id="surf-m3",
        path="/metrics/net_bookings_recovery_usd",
        value=420000.0,
    )
    assert pointer_update["type"] == "updateDataModel"
    assert pointer_update["path"] == "/metrics/net_bookings_recovery_usd"
    assert pointer_update["value"] == 420000.0


def test_a2ui_adversarial_boundary_robustness():
    """Verify boundary robustness for 0.0 values, negative lifts, empty lists, and unicode/special characters."""
    # 1. Zero and negative values
    card = A2UIProtocolGenerator.build_conflict_card(
        shared_ea_id_overlap_pct=0.0,
        ad_fatigue_suppression_penalty_pct=0.0,
        net_bookings_risk_usd=0.0,
        recommended_timeline_shift_days=0,
        projected_net_bookings_recovery_usd=0.0,
    )
    assert card["data"]["shared_ea_id_overlap_pct"] == 0.0
    assert card["data"]["net_bookings_risk_usd"] == 0.0

    # 2. Empty lists
    chart = A2UIProtocolGenerator.build_shapley_chart(
        features=[],
        waterfall_steps=[],
        channel_attribution=[],
        recommendations=[],
    )
    assert chart["data"]["features"] == []
    assert chart["data"]["video_breakdown"]["total_features_count"] == 0

    # 3. Unicode and special characters in markup
    markup = A2UIProtocolGenerator.render_conflict_card_markup(
        title='EA FC & Apex ⚽ <script>alert("test")</script>',
        target_campaign='EA "Champions" Edition & More',
    )
    assert 'id="conflict-fc27-toty-001"' in markup
    assert 'target-campaign=' in markup
