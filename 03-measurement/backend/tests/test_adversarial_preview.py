"""Adversarial and Empirical Stress Test Suite for Intake and Shapley Microservices.

Stress-tests boundary conditions, edge cases, zero/extreme inputs, multi-franchise briefs,
and mathematical stability of CampaignIntakeService and ShapleyService.
"""

import pytest
from pydantic import ValidationError

from app.schemas.intake import (
    CampaignBriefSubmission,
    CohortTargetEnum,
)
from app.schemas.shapley import (
    PreTestVideoAuditRequest,
    ShapleyFeatureElement,
    FunnelCategoryEnum,
)
from app.services.campaign_intake_service import campaign_intake_service
from app.services.shapley_service import shapley_service


# ==============================================================================
# 1. CAMPAIGN INTAKE SERVICE: Non-Overlapping Flight Dates
# ==============================================================================


@pytest.mark.parametrize(
    "flight_start,flight_end",
    [
        ("2026-11-01", "2026-11-15"),
        ("2026-12-10", "2026-12-25"),
        ("2026-09-01", "2026-09-15"),
        ("2026-10-01", "2026-10-23"),  # Ends right before Oct 24
        ("2026-10-28", "2026-11-05"),  # Starts right after Oct 27
    ],
)
def test_non_overlapping_flight_dates_zero_penalty(flight_start, flight_end):
    """Verify non-overlapping flight dates yield exactly 0.0% penalty, 0.0% overlap, 0 risk, and NO_COLLISION_DETECTED."""
    brief = CampaignBriefSubmission(
        campaign_id="camp-fc27-nonoverlap",
        campaign_name="EA FC 27 Clean Promo",
        franchise="EA Sports FC",
        flight_start=flight_start,
        flight_end=flight_end,
        total_budget=1500000.0,
        apply_mitigation=False,
    )
    response = campaign_intake_service.simulate_campaign(brief)

    assert response.status == "SUCCESS"
    fatigue = response.fatigue_analysis
    assert fatigue.collision_detected is False
    assert fatigue.has_conflict is False
    assert fatigue.shared_ea_id_overlap_pct == 0.0
    assert fatigue.shared_player_count == 0
    assert fatigue.ad_fatigue_suppression_penalty_pct == 0.0
    assert fatigue.net_bookings_risk_usd == 0.0
    assert fatigue.recommended_timeline_shift_days == 0
    assert fatigue.status == "NO_COLLISION_DETECTED"
    assert response.kpi_projection.penalty_applied_pct == 0.0
    assert response.kpi_projection.effective_net_bookings_usd == response.kpi_projection.baseline_net_bookings_usd


# ==============================================================================
# 2. CAMPAIGN INTAKE SERVICE: Exact Boundary Dates
# ==============================================================================


def test_boundary_single_day_oct24_collision():
    """Verify flight on exact collision start date (Oct 24 only) is detected as collision."""
    brief = CampaignBriefSubmission(
        campaign_id="camp-boundary-oct24",
        campaign_name="Oct 24 Single Day Push",
        franchise="EA Sports FC",
        flight_start="2026-10-24",
        flight_end="2026-10-24",
    )
    response = campaign_intake_service.simulate_campaign(brief)
    assert response.fatigue_analysis.collision_detected is True
    assert response.fatigue_analysis.status == "AMBER_COLLISION_DETECTED"
    assert response.fatigue_analysis.shared_ea_id_overlap_pct == 42.1
    assert response.fatigue_analysis.ad_fatigue_suppression_penalty_pct == 14.5


def test_boundary_single_day_oct27_collision():
    """Verify flight on exact collision end date (Oct 27 only) is detected as collision."""
    brief = CampaignBriefSubmission(
        campaign_id="camp-boundary-oct27",
        campaign_name="Oct 27 Single Day Push",
        franchise="EA Sports FC",
        flight_start="2026-10-27",
        flight_end="2026-10-27",
    )
    response = campaign_intake_service.simulate_campaign(brief)
    assert response.fatigue_analysis.collision_detected is True
    assert response.fatigue_analysis.status == "AMBER_COLLISION_DETECTED"


def test_boundary_single_day_oct23_clean():
    """Verify flight on day immediately before conflict window (Oct 23 only) is clean."""
    brief = CampaignBriefSubmission(
        campaign_id="camp-boundary-oct23",
        campaign_name="Oct 23 Eve Push",
        franchise="EA Sports FC",
        flight_start="2026-10-23",
        flight_end="2026-10-23",
    )
    response = campaign_intake_service.simulate_campaign(brief)
    assert response.fatigue_analysis.collision_detected is False
    assert response.fatigue_analysis.status == "NO_COLLISION_DETECTED"


def test_boundary_single_day_oct28_clean():
    """Verify flight on day immediately after conflict window (Oct 28 only) is clean."""
    brief = CampaignBriefSubmission(
        campaign_id="camp-boundary-oct28",
        campaign_name="Oct 28 Post-Window Push",
        franchise="EA Sports FC",
        flight_start="2026-10-28",
        flight_end="2026-10-28",
    )
    response = campaign_intake_service.simulate_campaign(brief)
    assert response.fatigue_analysis.collision_detected is False
    assert response.fatigue_analysis.status == "NO_COLLISION_DETECTED"


def test_boundary_overlapping_spans():
    """Verify spans that partially touch the conflict window trigger collision detection."""
    # Span starting before window and ending on start day
    brief_left = CampaignBriefSubmission(
        flight_start="2026-10-20",
        flight_end="2026-10-24",
    )
    res_left = campaign_intake_service.simulate_campaign(brief_left)
    assert res_left.fatigue_analysis.collision_detected is True

    # Span starting on end day and ending after window
    brief_right = CampaignBriefSubmission(
        flight_start="2026-10-27",
        flight_end="2026-11-02",
    )
    res_right = campaign_intake_service.simulate_campaign(brief_right)
    assert res_right.fatigue_analysis.collision_detected is True


# ==============================================================================
# 3. CAMPAIGN INTAKE SERVICE: Budget Edge Cases & Validation
# ==============================================================================


def test_extreme_large_budget():
    """Verify simulation handles extreme large budgets ($100M) without numeric overflow."""
    large_budget = 100_000_000.0
    brief = CampaignBriefSubmission(
        campaign_id="camp-mega-budget",
        flight_start="2026-11-01",
        flight_end="2026-11-15",
        total_budget=large_budget,
    )
    response = campaign_intake_service.simulate_campaign(brief)
    assert response.kpi_projection.baseline_net_bookings_usd == round(large_budget * 3.42, 2)
    assert response.kpi_projection.effective_net_bookings_usd == round(large_budget * 3.42, 2)


def test_micro_budget():
    """Verify simulation handles micro budgets ($1.00) gracefully."""
    micro_budget = 1.0
    brief = CampaignBriefSubmission(
        campaign_id="camp-micro-budget",
        flight_start="2026-11-01",
        flight_end="2026-11-15",
        total_budget=micro_budget,
    )
    response = campaign_intake_service.simulate_campaign(brief)
    assert response.kpi_projection.baseline_net_bookings_usd == round(micro_budget * 3.42, 2)
    assert response.kpi_projection.baseline_net_bookings_usd == 3.42


def test_zero_or_negative_budget_raises_validation_error():
    """Verify zero or negative budgets are rejected at schema validation boundary."""
    with pytest.raises(ValidationError):
        CampaignBriefSubmission(
            campaign_id="camp-zero-budget",
            total_budget=0.0,
        )

    with pytest.raises(ValidationError):
        CampaignBriefSubmission(
            campaign_id="camp-negative-budget",
            total_budget=-5000.0,
        )


def test_budget_alias_reconciliation():
    """Verify budget_usd is accepted and mapped to total_budget."""
    brief = CampaignBriefSubmission(
        campaign_id="camp-alias-budget",
        budget_usd=2500000.0,
    )
    assert brief.total_budget == 2500000.0


# ==============================================================================
# 4. CAMPAIGN INTAKE SERVICE: Multi-Franchise Briefs
# ==============================================================================


@pytest.mark.parametrize(
    "franchise_name,camp_id",
    [
        ("Battlefield 6", "camp-bf6-launch"),
        ("Need for Speed", "camp-nfs-underground"),
        ("The Sims 4", "camp-sims4-expansion"),
        ("Mass Effect", "camp-me-remaster"),
        ("Dragon Age", "camp-da-dreadwolf"),
    ],
)
def test_multi_franchise_campaign_briefs(franchise_name, camp_id):
    """Verify service correctly processes briefs from various EA franchises."""
    brief = CampaignBriefSubmission(
        campaign_id=camp_id,
        campaign_name=f"{franchise_name} Global Campaign",
        franchise=franchise_name,
        flight_start="2026-11-10",
        flight_end="2026-11-20",
        total_budget=2000000.0,
    )
    response = campaign_intake_service.simulate_campaign(brief)

    assert response.status == "SUCCESS"
    assert response.fatigue_analysis.target_franchise == franchise_name
    assert response.fatigue_analysis.target_campaign_id == camp_id
    assert response.submission.franchise == franchise_name


def test_get_known_collision_scenarios_comprehensive():
    """Verify multi-franchise collision scenario catalog contains valid structures."""
    scenarios = campaign_intake_service.get_known_collision_scenarios()
    assert len(scenarios) >= 3
    franchises = {s.target_franchise for s in scenarios}
    assert "EA Sports FC" in franchises
    assert "Battlefield 6" in franchises
    assert "The Sims 4" in franchises

    for s in scenarios:
        assert s.collision_detected is True
        assert s.shared_ea_id_overlap_pct > 0.0
        assert s.ad_fatigue_suppression_penalty_pct > 0.0
        assert s.net_bookings_risk_usd > 0.0
        assert s.recommended_timeline_shift_days >= 0


# ==============================================================================
# 5. SHAPLEY SERVICE: Empty Feature List Handling
# ==============================================================================


def test_shapley_empty_feature_list_in_request():
    """Verify audit_video_asset with empty feature list falls back to default benchmarks with valid FBI."""
    req = PreTestVideoAuditRequest(
        asset_id="asset-empty-features-001",
        asset_title="Empty Features Test Trailer",
        franchise="EA Sports FC",
        video_duration_seconds=15.0,
        features=[],
    )
    response = shapley_service.audit_video_asset(req)

    assert response.status == "SUCCESS"
    assert len(response.features) >= 2
    assert 0.0 <= response.funnel_balance_index <= 1.0
    assert response.funnel_balance_index == 0.74


def test_shapley_calculate_fbi_empty_list_returns_zero_within_bounds():
    """Verify calculate_funnel_balance_index([]) directly returns 0.0 without exception."""
    fbi = shapley_service.calculate_funnel_balance_index([])
    assert isinstance(fbi, float)
    assert 0.0 <= fbi <= 1.0
    assert fbi == 0.0


# ==============================================================================
# 6. SHAPLEY SERVICE: Pure TOFU vs Pure BOFU (No ZeroDivisionError)
# ==============================================================================


def test_shapley_pure_tofu_features():
    """Verify custom features with ONLY TOFU mechanics computes FBI = 0.0 without division by zero."""
    pure_tofu_features = [
        ShapleyFeatureElement(
            feature_name="Trick Shot Hook 1",
            category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
            funnel_tier="TOFU",
            marginal_ctr_lift_pct=35.0,
            marginal_cti_lift_pct=-8.0,
            marginal_d7_roas_multiplier=1.75,
        ),
        ShapleyFeatureElement(
            feature_name="High Pace Sprint Hook 2",
            category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
            funnel_tier="TOFU",
            marginal_ctr_lift_pct=28.0,
            marginal_cti_lift_pct=-5.0,
            marginal_d7_roas_multiplier=1.60,
        ),
    ]

    fbi = shapley_service.calculate_funnel_balance_index(pure_tofu_features)
    assert fbi == 0.0

    req = PreTestVideoAuditRequest(
        asset_id="asset-pure-tofu",
        asset_title="Pure TOFU Video",
        franchise="EA Sports FC",
        features=pure_tofu_features,
    )
    response = shapley_service.audit_video_asset(req)
    assert response.status == "SUCCESS"
    assert response.funnel_balance_index == 0.0
    assert response.top_of_funnel_score == 63.0
    assert response.lower_funnel_score == 0.0
    assert response.audit_verdict == "NEEDS_OPTIMIZATION"


def test_shapley_pure_bofu_features():
    """Verify custom features with ONLY BOFU mechanics computes FBI = 0.0 without division by zero."""
    pure_bofu_features = [
        ShapleyFeatureElement(
            feature_name="Pack Opening Climax 1",
            category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
            funnel_tier="BOFU",
            marginal_ctr_lift_pct=3.0,
            marginal_cti_lift_pct=30.0,
            marginal_d7_roas_multiplier=3.20,
        ),
        ShapleyFeatureElement(
            feature_name="VIP In-Game Store CTA 2",
            category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
            funnel_tier="BOFU",
            marginal_ctr_lift_pct=2.0,
            marginal_cti_lift_pct=25.0,
            marginal_d7_roas_multiplier=3.10,
        ),
    ]

    fbi = shapley_service.calculate_funnel_balance_index(pure_bofu_features)
    assert fbi == 0.0

    req = PreTestVideoAuditRequest(
        asset_id="asset-pure-bofu",
        asset_title="Pure BOFU Video",
        franchise="Apex Legends",
        features=pure_bofu_features,
    )
    response = shapley_service.audit_video_asset(req)
    assert response.status == "SUCCESS"
    assert response.funnel_balance_index == 0.0
    assert response.top_of_funnel_score == 0.0
    assert response.lower_funnel_score == 55.0
    assert response.audit_verdict == "NEEDS_OPTIMIZATION"


def test_shapley_zero_lift_custom_features():
    """Verify custom features with 0.0 marginal lifts handle total weight = 0 without error."""
    zero_lift_features = [
        ShapleyFeatureElement(
            feature_name="Zero TOFU Hook",
            category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
            funnel_tier="TOFU",
            marginal_ctr_lift_pct=0.0,
            marginal_cti_lift_pct=0.0,
            marginal_d7_roas_multiplier=1.0,
        ),
        ShapleyFeatureElement(
            feature_name="Zero BOFU Climax",
            category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
            funnel_tier="BOFU",
            marginal_ctr_lift_pct=0.0,
            marginal_cti_lift_pct=0.0,
            marginal_d7_roas_multiplier=1.0,
        ),
    ]
    fbi = shapley_service.calculate_funnel_balance_index(zero_lift_features)
    assert fbi == 0.0


def test_shapley_balanced_custom_features():
    """Verify arbitrary custom features with balanced TOFU + BOFU calculate mathematical FBI in [0.0, 1.0]."""
    custom_features = [
        ShapleyFeatureElement(
            feature_name="Custom TOFU Movement Hook",
            category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
            funnel_tier="TOFU",
            marginal_ctr_lift_pct=30.0,
            marginal_cti_lift_pct=-5.0,
            marginal_d7_roas_multiplier=2.0,
        ),
        ShapleyFeatureElement(
            feature_name="Custom BOFU Hero Reveal",
            category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
            funnel_tier="BOFU",
            marginal_ctr_lift_pct=5.0,
            marginal_cti_lift_pct=30.0,
            marginal_d7_roas_multiplier=3.0,
        ),
    ]
    # tofu_weight = 30.0, bofu_weight = 30.0 -> imbalance = 0.0 -> FBI = 1.0
    fbi = shapley_service.calculate_funnel_balance_index(custom_features)
    assert fbi == 1.0
    assert 0.0 <= fbi <= 1.0


# ==============================================================================
# 7. SHAPLEY SERVICE: Video Duration Bounds (5s to 120s)
# ==============================================================================


@pytest.mark.parametrize("duration", [5.0, 15.0, 30.0, 60.0, 120.0, 300.0])
def test_shapley_video_durations(duration):
    """Verify video durations from 5s to 120s (and up to 300s) execute and preserve duration metadata."""
    req = PreTestVideoAuditRequest(
        asset_id=f"asset-dur-{int(duration)}s",
        asset_title=f"Trailer {duration}s Duration",
        franchise="EA Sports FC",
        video_duration_seconds=duration,
    )
    response = shapley_service.audit_video_asset(req)

    assert response.status == "SUCCESS"
    assert response.video_duration_seconds == duration
    assert response.duration_sec == duration


def test_shapley_invalid_duration_validation():
    """Verify zero, negative, or excessive (>300s) durations are rejected by Pydantic validation."""
    with pytest.raises(ValidationError):
        PreTestVideoAuditRequest(video_duration_seconds=0.0)

    with pytest.raises(ValidationError):
        PreTestVideoAuditRequest(video_duration_seconds=-10.0)

    with pytest.raises(ValidationError):
        PreTestVideoAuditRequest(video_duration_seconds=301.0)
