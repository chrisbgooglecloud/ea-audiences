"""Unit Tests for Campaign Intake & Cross-Franchise Fatigue Service."""

import pytest
from app.schemas.intake import CampaignBriefSubmission
from app.services.campaign_intake_service import campaign_intake_service


def test_baseline_kpi_prediction(sample_fc27_brief):
    """Test core predictive KPI calculation matches benchmark requirements."""
    response = campaign_intake_service.simulate_campaign(sample_fc27_brief)

    assert response.status == "SUCCESS"
    assert response.kpi_projection.projected_installs == 364000
    assert abs(response.kpi_projection.blended_cpi_usd - 4.12) < 0.05
    assert abs(response.kpi_projection.day7_roas - 3.42) < 0.05
    assert response.kpi_projection.baseline_net_bookings_usd >= 4700000.0


def test_oct24_27_apex_collision_detection(sample_fc27_brief):
    """Test cross-franchise collision detection when flight overlaps Oct 24-27."""
    response = campaign_intake_service.simulate_campaign(sample_fc27_brief)

    fatigue = response.fatigue_analysis
    assert fatigue.collision_detected is True
    assert fatigue.conflicting_franchise == "Apex Legends"
    assert fatigue.shared_ea_id_overlap_pct == 42.1
    assert fatigue.shared_player_count == 1280000
    assert fatigue.ad_fatigue_suppression_penalty_pct == 14.5
    assert fatigue.net_bookings_risk_usd == 420000.0
    assert fatigue.recommended_timeline_shift_days == 3
    assert fatigue.status == "AMBER_COLLISION_DETECTED"
    assert response.kpi_projection.effective_net_bookings_usd == 4710000.0


def test_mitigation_recovery(sample_mitigated_brief):
    """Test one-click mitigation recovers +$420k Net Bookings to $5,130,000."""
    response = campaign_intake_service.simulate_campaign(sample_mitigated_brief)

    fatigue = response.fatigue_analysis
    assert fatigue.projected_net_bookings_recovery_usd == 420000.0
    assert fatigue.status == "MITIGATED_COLLISION_CLEARED"
    assert response.kpi_projection.penalty_applied_pct == 0.0
    assert response.kpi_projection.effective_net_bookings_usd == 5130000.0
    assert fatigue.mitigated_flight_start == "2026-10-27"
    assert fatigue.mitigated_flight_end == "2026-11-07"


def test_non_conflicting_flight_dates():
    """Test flight dates with no overlapping campaigns return clean status."""
    clean_brief = CampaignBriefSubmission(
        campaign_id="camp-fc27-clean-005",
        campaign_name="EA FC 27 Holiday Promo",
        franchise="EA Sports FC",
        flight_start="2026-12-01",
        flight_end="2026-12-15",
        total_budget=1000000.0,
        apply_mitigation=False,
    )
    response = campaign_intake_service.simulate_campaign(clean_brief)

    assert response.fatigue_analysis.collision_detected is False
    assert response.fatigue_analysis.status == "NO_COLLISION_DETECTED"
    assert response.fatigue_analysis.ad_fatigue_suppression_penalty_pct == 0.0
    assert response.fatigue_analysis.net_bookings_risk_usd == 0.0


def test_known_collision_scenarios_listing():
    """Test retrieval of multi-franchise collision scenarios."""
    scenarios = campaign_intake_service.get_known_collision_scenarios()
    assert len(scenarios) >= 3
    target_franchises = [s.target_franchise for s in scenarios]
    assert "EA Sports FC" in target_franchises
    assert "Battlefield 6" in target_franchises
