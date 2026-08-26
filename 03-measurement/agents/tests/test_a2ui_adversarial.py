"""Adversarial stress test harness and empirical oracles for A2UI Protocol generators."""

import re
import json
import uuid
import time
import pytest
from pydantic import ValidationError

from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator
from agents.app.schemas import A2UIComponent, A2UIStreamEvent


# ==============================================================================
# 1. EXTREME NUMERICAL BOUNDARY & EDGE CASE STRESS TESTS
# ==============================================================================

@pytest.mark.parametrize("overlap_pct,penalty_pct,risk_usd,shift_days,recovery_usd,player_count", [
    (0.0, 0.0, 0.0, 0, 0.0, 0),                           # Absolute zero boundary
    (100.0, 100.0, 1e9, 365, 1e9, 500_000_000),          # Maximum saturation & scale
    (0.00001, 0.00001, 0.01, 1, 0.01, 1),                # Epsilon boundary
    (-15.5, -5.0, -100000.0, -3, -100000.0, 100),         # Negative boundary values (e.g., negative risk/bonus)
    (42.1, 14.5, 420000.0, 3, 420000.0, 1280000),        # Baseline reference
    (999.9, 500.0, 1e12, 10000, 1e12, 10_000_000_000),   # Super-massive extreme values
])
def test_conflict_card_numerical_boundaries(
    overlap_pct, penalty_pct, risk_usd, shift_days, recovery_usd, player_count
):
    """Stress test build_conflict_card with extreme numerical values."""
    card = A2UIProtocolGenerator.build_conflict_card(
        component_id="conflict-stress-num-001",
        shared_ea_id_overlap_pct=overlap_pct,
        ad_fatigue_suppression_penalty_pct=penalty_pct,
        net_bookings_risk_usd=risk_usd,
        recommended_timeline_shift_days=shift_days,
        projected_net_bookings_recovery_usd=recovery_usd,
        shared_player_count=player_count,
    )
    
    # 1. Structural integrity
    assert card["component_type"] == "a2ui-conflict-card"
    assert card["component_id"] == "conflict-stress-num-001"
    
    data = card["data"]
    assert data["shared_ea_id_overlap_pct"] == overlap_pct
    assert data["ad_fatigue_suppression_penalty_pct"] == penalty_pct
    assert data["net_bookings_risk_usd"] == risk_usd
    assert data["recommended_timeline_shift_days"] == shift_days
    assert data["projected_net_bookings_recovery_usd"] == recovery_usd
    assert data["shared_player_count"] == player_count
    
    # 2. Metrics sub-object consistency
    metrics = data["metrics"]
    assert metrics["overlap_pct"] == overlap_pct
    assert metrics["penalty_pct"] == penalty_pct
    assert metrics["risk_usd"] == risk_usd
    assert metrics["recovery_usd"] == recovery_usd

    # 3. Action payload consistency
    action_payload = card["props"]["action_payload"]
    assert action_payload["recovery_usd"] == recovery_usd
    assert action_payload["recommended_shift_days"] == shift_days

    # 4. Pydantic validation
    pydantic_card = A2UIComponent(**card)
    assert pydantic_card.component_id == "conflict-stress-num-001"

    # 5. JSON serialization invariance
    serialized = json.dumps(card)
    deserialized = json.loads(serialized)
    assert deserialized["data"]["net_bookings_risk_usd"] == risk_usd


@pytest.mark.parametrize("fbi,duration,ctr_lift,cti_lift,roas_mult,confidence", [
    (0.0, 0.1, -100.0, -100.0, 0.0, 0.0),                # Lower limits
    (1.0, 3600.0, 500.0, 500.0, 100.0, 1.0),              # Upper limits
    (-0.5, 0.0, 0.0, 0.0, 1.0, 0.5),                     # Negative FBI / zero duration
    (0.78, 15.0, 41.0, -12.1, 1.85, 0.96),               # Standard FC27 values
    (2.5, 600.0, 1000.0, -500.0, 50.0, 0.999),           # Extreme divergent lifts
])
def test_shapley_chart_numerical_boundaries(
    fbi, duration, ctr_lift, cti_lift, roas_mult, confidence
):
    """Stress test build_shapley_chart with extreme numerical values."""
    custom_features = [
        {
            "feature_id": "feat-stress-01",
            "feature_name": "Boundary Test Feature",
            "category": "TOP_OF_FUNNEL",
            "funnel_tier": "TOFU",
            "marginal_ctr_lift_pct": ctr_lift,
            "marginal_cti_lift_pct": cti_lift,
            "marginal_d7_roas_multiplier": roas_mult,
            "confidence_score": confidence,
            "timestamp_start_sec": 0.0,
            "timestamp_end_sec": duration,
        }
    ]

    chart = A2UIProtocolGenerator.build_shapley_chart(
        component_id="shapley-stress-num-001",
        funnel_balance_index=fbi,
        video_duration_seconds=duration,
        features=custom_features,
    )

    assert chart["component_type"] == "a2ui-shapley-chart"
    assert chart["data"]["funnel_balance_index"] == fbi
    assert chart["data"]["video_duration_seconds"] == duration
    assert len(chart["data"]["features"]) == 1
    assert chart["data"]["features"][0]["marginal_ctr_lift_pct"] == ctr_lift

    # Pydantic validation
    pydantic_chart = A2UIComponent(**chart)
    assert pydantic_chart.data["funnel_balance_index"] == fbi

    # JSON serialization invariance
    serialized = json.dumps(chart)
    deserialized = json.loads(serialized)
    assert deserialized["data"]["video_duration_seconds"] == duration


# ==============================================================================
# 2. MALFORMED, EMPTY, AND DEEPLY NESTED DATA STRUCTURE STRESS TESTS
# ==============================================================================

def test_shapley_chart_empty_collections():
    """Verify build_shapley_chart handles all empty collections gracefully without crashing."""
    chart = A2UIProtocolGenerator.build_shapley_chart(
        component_id="shapley-empty-001",
        features=[],
        waterfall_steps=[],
        channel_attribution=[],
        recommendations=[],
    )

    assert chart["data"]["features"] == []
    assert chart["data"]["waterfall_steps"] == []
    assert chart["data"]["channel_attribution"] == []
    assert chart["data"]["recommendations"] == []
    
    breakdown = chart["data"]["video_breakdown"]
    assert breakdown["top_of_funnel_features"] == []
    assert breakdown["lower_funnel_monetization_features"] == []
    assert breakdown["neutral_features"] == []
    assert breakdown["total_features_count"] == 0

    # Ensure valid Pydantic model
    component = A2UIComponent(**chart)
    assert component.component_type == "a2ui-shapley-chart"


def test_shapley_chart_features_without_standard_keys():
    """Verify build_shapley_chart with features missing optional keys (e.g. category, lifts)."""
    minimal_features = [
        {"feature_id": "min-01", "feature_name": "Sparse Feature A"},
        {"feature_id": "min-02", "category": "TOP_OF_FUNNEL"},
        {"feature_id": "min-03", "marginal_ctr_lift_pct": 25.0},
        {"feature_id": "min-04", "marginal_cti_lift_pct": 18.0},
        {"feature_id": "min-05", "category": "LOWER_FUNNEL_MONETIZATION"},
        {"feature_id": "min-06", "marginal_ctr_lift_pct": 5.0, "marginal_cti_lift_pct": 2.0},
    ]

    chart = A2UIProtocolGenerator.build_shapley_chart(
        component_id="shapley-sparse-001",
        features=minimal_features,
    )

    breakdown = chart["data"]["video_breakdown"]
    assert breakdown["total_features_count"] == 6

    # min-02 and min-03 should be classified into top_of_funnel
    tofu_ids = [f["feature_id"] for f in breakdown["top_of_funnel_features"]]
    assert "min-02" in tofu_ids
    assert "min-03" in tofu_ids

    # min-04 and min-05 should be classified into lower_funnel
    bofu_ids = [f["feature_id"] for f in breakdown["lower_funnel_monetization_features"]]
    assert "min-04" in bofu_ids
    assert "min-05" in bofu_ids

    # min-01 and min-06 should be neutral
    neutral_ids = [f["feature_id"] for f in breakdown["neutral_features"]]
    assert "min-01" in neutral_ids
    assert "min-06" in neutral_ids


def test_shapley_chart_high_volume_features():
    """Stress test build_shapley_chart with 1,000 features for performance and memory scaling."""
    large_feature_set = [
        {
            "feature_id": f"feat-scale-{i:04d}",
            "feature_name": f"Dynamic Storybeat Hook #{i}",
            "category": "TOP_OF_FUNNEL" if i % 3 == 0 else ("LOWER_FUNNEL_MONETIZATION" if i % 3 == 1 else "NEUTRAL_ENGAGEMENT"),
            "funnel_tier": "TOFU" if i % 3 == 0 else ("BOFU" if i % 3 == 1 else "MOFU"),
            "marginal_ctr_lift_pct": float(i % 50),
            "marginal_cti_lift_pct": float((i * 7) % 50),
            "marginal_d7_roas_multiplier": 1.0 + (i % 30) * 0.1,
            "confidence_score": 0.90 + (i % 10) * 0.01,
            "timestamp_start_sec": float(i * 0.5),
            "timestamp_end_sec": float((i + 1) * 0.5),
        }
        for i in range(1000)
    ]

    t0 = time.perf_counter()
    chart = A2UIProtocolGenerator.build_shapley_chart(
        component_id="shapley-scale-1000",
        features=large_feature_set,
    )
    t_elapsed = time.perf_counter() - t0

    assert chart["data"]["video_breakdown"]["total_features_count"] == 1000
    assert t_elapsed < 0.1, f"Feature processing took {t_elapsed:.4f}s, expected < 100ms"
    
    # Ensure JSON serializable and valid Pydantic
    serialized = json.dumps(chart)
    assert len(serialized) > 100_000
    component = A2UIComponent(**chart)
    assert component.component_id == "shapley-scale-1000"


def test_conflict_card_empty_and_custom_options():
    """Verify build_conflict_card handles empty options and custom action payloads."""
    # 1. Empty options list
    card_empty_options = A2UIProtocolGenerator.build_conflict_card(
        options=[],
    )
    assert card_empty_options["data"]["options"] == []

    # 2. Custom action payload
    custom_action = {
        "action": "CUSTOM_AUTONOMOUS_RESOLVE",
        "parameters": {"auto_shift": True, "suppress_threshold": 0.85},
        "target_nodes": ["ad_server_eu_west", "ad_server_na_east"],
    }
    card_custom_action = A2UIProtocolGenerator.build_conflict_card(
        action_payload=custom_action,
    )
    assert card_custom_action["props"]["action_payload"]["action"] == "CUSTOM_AUTONOMOUS_RESOLVE"
    assert card_custom_action["props"]["action_payload"]["parameters"]["auto_shift"] is True


# ==============================================================================
# 3. SPECIAL CHARACTERS, XSS PAYLOADS & JSON INJECTION STRESS TESTS
# ==============================================================================

@pytest.mark.parametrize("payload", [
    "<script>alert('XSS_ATTACK_01')</script>",
    "'; DROP TABLE campaigns; --",
    '{"malicious_json": true, "nested": {"hack": 1}}',
    "<b>Bold</b> & <i>Italic</i> & <img src=x onerror=alert(1)>",
    "EA FC 27™ «Champions & Legends» — ⚽🎮🔥 [Special Edition]",
    "اختبار واجهة المستخدم متعددة اللغات (Arabic RTL)",
    "日本語テスト: 究極のチーム 2027年版 (Japanese CJK)",
    "Line 1\nLine 2\r\nLine 3\tTabbed\0Null",
    '"quoted" and \'single-quoted\' and `backticks` and \\backslashes\\',
])
def test_conflict_card_injection_and_unicode_safety(payload):
    """Stress test build_conflict_card and render_conflict_card_markup against injection & unicode payloads."""
    # 1. Dictionary generation
    card = A2UIProtocolGenerator.build_conflict_card(
        component_id=f"conflict-{uuid.uuid4().hex[:8]}",
        title=f"Conflict Alert: {payload}",
        target_campaign_name=f"Campaign A: {payload}",
        conflicting_campaign_name=f"Campaign B: {payload}",
        description=f"Description containing: {payload}",
        mitigation_strategy=f"Mitigation strategy: {payload}",
    )
    
    # Must serialize cleanly to JSON
    serialized = json.dumps(card)
    deserialized = json.loads(serialized)
    assert deserialized["title"] == f"Conflict Alert: {payload}"
    assert deserialized["data"]["target_campaign_name"] == f"Campaign A: {payload}"

    # Must validate cleanly as Pydantic model
    component = A2UIComponent(**card)
    assert payload in component.title

    # 2. Markup generation
    markup = A2UIProtocolGenerator.render_conflict_card_markup(
        title=payload,
        target_campaign=payload,
        conflicting_campaign=payload,
    )
    assert markup.startswith("<a2ui-conflict-card ")
    assert markup.endswith("></a2ui-conflict-card>")
    assert f'title="{payload}"' in markup
    assert f'target-campaign="{payload}"' in markup


@pytest.mark.parametrize("payload", [
    "<script>alert('SHAPLEY_XSS')</script>",
    '"><svg onload=alert(document.cookie)>',
    "Apex S26 💥 // High-Intensity 4K HDR 🎬 [120fps]",
    "🔥⚡ Ultimate FUT Walkout — Bellingham x Mbappé 🌟",
    "Payload with \n\r\t control sequences and escaped \"quotes\"",
])
def test_shapley_chart_injection_and_unicode_safety(payload):
    """Stress test build_shapley_chart and render_shapley_chart_markup with special characters and XSS payloads."""
    custom_feature = {
        "feature_id": "feat-xss-01",
        "feature_name": payload,
        "category": "TOP_OF_FUNNEL",
        "description": f"XSS Description: {payload}",
        "marginal_ctr_lift_pct": 20.0,
        "marginal_cti_lift_pct": 10.0,
    }

    chart = A2UIProtocolGenerator.build_shapley_chart(
        title=f"Shapley Analysis: {payload}",
        asset_title=f"Asset: {payload}",
        features=[custom_feature],
        recommendations=[f"Rec 1: {payload}"],
    )

    # Valid JSON
    serialized = json.dumps(chart)
    deserialized = json.loads(serialized)
    assert deserialized["title"] == f"Shapley Analysis: {payload}"

    # Valid Pydantic model
    component = A2UIComponent(**chart)
    assert payload in component.title

    # Markup generation
    markup = A2UIProtocolGenerator.render_shapley_chart_markup(
        title=payload,
        asset_id=f"asset-{payload}",
        top_ctr_feature=payload,
        top_cti_feature=payload,
    )
    assert markup.startswith("<a2ui-shapley-chart ")
    assert markup.endswith("></a2ui-shapley-chart>")
    assert f'title="{payload}"' in markup


# ==============================================================================
# 4. SSE STREAMING & JSON POINTER LIFECYCLE STRESS TESTS
# ==============================================================================

def test_format_sse_event_high_throughput_burst():
    """Verify high-throughput burst generation of 1,000 SSE stream events (< 50ms)."""
    session_id = f"sess-stress-{uuid.uuid4().hex[:6]}"
    conflict_card = A2UIProtocolGenerator.build_conflict_card()

    t0 = time.perf_counter()
    events = [
        A2UIProtocolGenerator.format_sse_event(
            event_type="component_update" if i % 2 == 0 else "telemetry_chunk",
            agent_name="MediaBuyingAgent" if i % 2 == 0 else "CreativeInsightsAgent",
            session_id=session_id,
            content=f"Burst stream packet #{i}",
            component=conflict_card if i % 5 == 0 else None,
            metadata={"sequence_idx": i, "buffer_state": "ACTIVE"},
        )
        for i in range(1000)
    ]
    t_elapsed = time.perf_counter() - t0

    assert len(events) == 1000
    assert t_elapsed < 0.10, f"1,000 SSE events generated in {t_elapsed:.4f}s, expected < 100ms"

    # Verify first, middle, and last event conform to SSE spec
    for sample_event in [events[0], events[500], events[-1]]:
        assert sample_event.startswith("event: message\ndata: ")
        assert sample_event.endswith("\n\n")
        
        # Parse payload
        raw_json = sample_event.split("data: ")[1].rstrip("\n")
        data = json.loads(raw_json)
        assert data["session_id"] == session_id
        assert "timestamp" in data
        assert "metadata" in data


def test_format_sse_event_with_pydantic_a2ui_stream_event():
    """Verify that SSE event payloads match the A2UIStreamEvent Pydantic schema."""
    card = A2UIProtocolGenerator.build_conflict_card()
    sse_line = A2UIProtocolGenerator.format_sse_event(
        event_type="a2ui_component",
        agent_name="MeasurementFleetLeader",
        session_id="sess-pydantic-001",
        content="Cross-franchise collision detected between EA FC 27 and Apex Legends",
        component=card,
        metadata={"priority": "CRITICAL_P0", "retry_count": 0},
    )

    data_str = sse_line.split("data: ")[1].rstrip("\n")
    data_dict = json.loads(data_str)

    # Validate against Pydantic schema
    stream_event = A2UIStreamEvent(**data_dict)
    assert stream_event.event_type == "a2ui_component"
    assert stream_event.agent_name == "MeasurementFleetLeader"
    assert stream_event.session_id == "sess-pydantic-001"
    assert stream_event.component is not None
    assert stream_event.component.component_type == "a2ui-conflict-card"
    assert stream_event.component.component_id == "conflict-fc27-toty-001"


@pytest.mark.parametrize("pointer_path,value", [
    ("/data/shared_ea_id_overlap_pct", 48.5),
    ("/data/metrics/risk_usd", 520000.0),
    ("/props/variant", "critical_red"),
    ("/data/options/0/projected_recovery_usd", 450000.0),
    ("/data/features/0/marginal_ctr_lift_pct", 55.0),
    ("/data/video_breakdown/total_features_count", 15),
    ("/complex/nested/state", {"flag": True, "weights": [0.1, 0.4, 0.5]}),
    ("", "root_override"),
    ("/", "slash_root"),
    ("/escaped~1slash~0tilde", "rfc6901_compliant"),
])
def test_json_pointer_updates_diversity(pointer_path, value):
    """Stress test update_data_model with various RFC 6901 JSON pointer paths and nested values."""
    surface_id = "surf-dynamic-001"
    update = A2UIProtocolGenerator.update_data_model(
        surface_id=surface_id,
        path=pointer_path,
        value=value,
    )
    assert update["type"] == "updateDataModel"
    assert update["surfaceId"] == surface_id
    assert update["path"] == pointer_path
    assert update["value"] == value
    assert "timestamp" in update


# ==============================================================================
# 5. ORACLES: CROSS-COMPONENT CONSISTENCY & INVARIANCE
# ==============================================================================

def test_oracle_conflict_card_data_and_markup_consistency():
    """Oracle: verify that dictionary data values match markup attribute representations."""
    test_cases = [
        {"overlap": 15.0, "penalty": 5.0, "risk": 150000.0, "shift": 2, "recovery": 150000.0},
        {"overlap": 42.1, "penalty": 14.5, "risk": 420000.0, "shift": 3, "recovery": 420000.0},
        {"overlap": 88.9, "penalty": 35.0, "risk": 1200000.0, "shift": 7, "recovery": 1200000.0},
    ]

    for tc in test_cases:
        card = A2UIProtocolGenerator.build_conflict_card(
            shared_ea_id_overlap_pct=tc["overlap"],
            ad_fatigue_suppression_penalty_pct=tc["penalty"],
            net_bookings_risk_usd=tc["risk"],
            recommended_timeline_shift_days=tc["shift"],
            projected_net_bookings_recovery_usd=tc["recovery"],
        )

        markup = A2UIProtocolGenerator.render_conflict_card_markup(
            overlap_pct=tc["overlap"],
            penalty_pct=tc["penalty"],
            risk_usd=tc["risk"],
            shift_days=tc["shift"],
            recovery_usd=tc["recovery"],
        )

        # Oracle assertions
        assert card["data"]["shared_ea_id_overlap_pct"] == tc["overlap"]
        assert f'overlap-pct="{tc["overlap"]}"' in markup
        assert f'penalty-pct="{tc["penalty"]}"' in markup
        assert f'risk-usd="{tc["risk"]}"' in markup
        assert f'shift-days="{tc["shift"]}"' in markup
        assert f'recovery-usd="{tc["recovery"]}"' in markup


def test_oracle_shapley_chart_features_breakdown_invariant():
    """Oracle: invariant that sum of tiers in video_breakdown covers all input features."""
    test_features = [
        {"feature_id": "f1", "category": "TOP_OF_FUNNEL", "marginal_ctr_lift_pct": 25.0},
        {"feature_id": "f2", "category": "LOWER_FUNNEL_MONETIZATION", "marginal_cti_lift_pct": 30.0},
        {"feature_id": "f3", "category": "NEUTRAL_ENGAGEMENT", "marginal_ctr_lift_pct": 2.0, "marginal_cti_lift_pct": 3.0},
        {"feature_id": "f4", "category": "UNCATEGORIZED", "marginal_ctr_lift_pct": 18.0},  # > 15.0 -> Top of Funnel
        {"feature_id": "f5", "category": "UNCATEGORIZED", "marginal_cti_lift_pct": 22.0},  # > 15.0 -> Lower Funnel
        {"feature_id": "f6", "category": "BACKGROUND_MUSIC", "marginal_ctr_lift_pct": 0.5, "marginal_cti_lift_pct": 0.2}, # Neutral
    ]

    chart = A2UIProtocolGenerator.build_shapley_chart(features=test_features)
    breakdown = chart["data"]["video_breakdown"]

    tofu_count = len(breakdown["top_of_funnel_features"])
    bofu_count = len(breakdown["lower_funnel_monetization_features"])
    neutral_count = len(breakdown["neutral_features"])

    # Invariant: Each feature is classified appropriately
    assert tofu_count == 2   # f1 (TOP_OF_FUNNEL), f4 (marginal_ctr_lift > 15.0)
    assert bofu_count == 2   # f2 (LOWER_FUNNEL_MONETIZATION), f5 (marginal_cti_lift > 15.0)
    assert neutral_count == 2 # f3, f6
    assert tofu_count + bofu_count + neutral_count == len(test_features)
    assert breakdown["total_features_count"] == len(test_features)
