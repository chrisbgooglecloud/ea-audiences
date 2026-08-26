"""Tier 4 Real-World Scenario: EA FC 27 vs Apex Legends Cross-Franchise Collision & Autonomous Mitigation.

Authoritative source of truth:
- ORIGINAL_REQUEST.md (§R1, §R2, §R4)
- PROJECT.md (§Milestones & §Interface Contracts)
- TEST_INFRA.md (§6 Scenario 1)
- miner_data_foundation/report.md
- miner_backend/report.md
"""

import pytest
from fastapi.testclient import TestClient

from tests.e2e.conftest import (
    CampaignBriefSubmission,
    ConflictFatigueAnalysis,
    CampaignPredictionResponse,
    campaign_intake_service,
)


class TestTier4EAFCApexCollisionScenario:
    """Scenario 1: Full end-to-end executive journey for cross-franchise fatigue collision and AI mitigation."""

    @pytest.fixture
    def eafc_toty_brief(self) -> CampaignBriefSubmission:
        """Campaign brief for EA FC 27 TOTY Mid-Season Push ($1.5M, Oct 24 - Nov 07)."""
        return CampaignBriefSubmission(
            campaign_name="EA FC 27 TOTY Mid-Season Push",
            franchise="EA Sports FC",
            target_audience="Core Gamers & Lapsed Whales",
            channels=["Paid Social", "Paid Search", "Influencers", "CTV"],
            total_budget=1500000.0,
            budget_usd=1500000.0,
            flight_start="2026-10-24",
            flight_end="2026-11-07",
            apply_mitigation=False,
        )

    def test_t4_scenario1_step1_ingest_eafc27_brief(self, eafc_toty_brief):
        """Step 1: Ingest EA FC 27 TOTY Mid-Season Push campaign brief."""
        assert eafc_toty_brief.campaign_name == "EA FC 27 TOTY Mid-Season Push"
        assert eafc_toty_brief.franchise == "EA Sports FC"
        assert eafc_toty_brief.total_budget == 1500000.0
        assert eafc_toty_brief.flight_start == "2026-10-24"
        assert eafc_toty_brief.flight_end == "2026-11-07"

    def test_t4_scenario1_step2_validate_forecasted_kpis(self, eafc_toty_brief):
        """Step 2: Validate forecasted KPIs: 364,000 installs, $4.12 CPI, 3.42x ROAS, $5.13M recovered target."""
        prediction = campaign_intake_service.simulate_campaign(eafc_toty_brief)
        kpi = prediction.kpi_projection
        assert kpi.projected_installs == 364000
        assert kpi.blended_cpi_usd == 4.12
        assert kpi.day7_roas == 3.42
        assert kpi.post_mitigation_net_bookings_usd == 5130000.0

    def test_t4_scenario1_step3_detect_apex_schedule_collision(self, eafc_toty_brief):
        """Step 3: Detect schedule collision with Apex Legends Season 26 Launch (Oct 24-27)."""
        prediction = campaign_intake_service.simulate_campaign(eafc_toty_brief)
        conflict = prediction.fatigue_analysis
        assert conflict.collision_detected is True
        assert "Apex Legends" in conflict.conflicting_franchise
        assert conflict.conflict_flight_start == "2026-10-24"
        assert conflict.conflict_flight_end == "2026-10-27"

    def test_t4_scenario1_step4_verify_collision_financial_penalties(self, eafc_toty_brief):
        """Step 4: Verify 42.1% overlap, 14.5% suppression penalty, $420k risk, $4.71M penalized bookings."""
        prediction = campaign_intake_service.simulate_campaign(eafc_toty_brief)
        conflict = prediction.fatigue_analysis
        kpi = prediction.kpi_projection
        assert conflict.shared_ea_id_overlap_pct == 42.1
        assert conflict.ad_fatigue_suppression_penalty_pct == 14.5
        assert conflict.net_bookings_risk_usd == 420000.0
        assert kpi.unmitigated_net_bookings_usd == 4710000.0
        assert kpi.baseline_net_bookings_usd - conflict.net_bookings_risk_usd == kpi.unmitigated_net_bookings_usd

    def test_t4_scenario1_step5_apply_ai_prescriptive_recommendation(self, eafc_toty_brief):
        """Step 5: Verify AI prescriptive recommendation: +3 day shift to Oct 27 - Nov 07."""
        prediction = campaign_intake_service.simulate_campaign(eafc_toty_brief)
        conflict = prediction.fatigue_analysis
        assert conflict.recommended_timeline_shift_days == 3
        assert conflict.mitigated_flight_start == "2026-10-27"
        assert conflict.mitigated_flight_end == "2026-11-07"
        assert "pruning" in conflict.mitigation_strategy.lower() or "shift" in conflict.mitigation_strategy.lower()

    def test_t4_scenario1_step6_verify_financial_net_bookings_recovery(self, eafc_toty_brief):
        """Step 6: Verify financial recovery: Net Bookings restored by +$420k to $5,130,000."""
        prediction = campaign_intake_service.simulate_campaign(eafc_toty_brief)
        conflict = prediction.fatigue_analysis
        kpi = prediction.kpi_projection
        assert conflict.projected_net_bookings_recovery_usd == 420000.0
        assert kpi.post_mitigation_net_bookings_usd == 5130000.0
        assert kpi.post_mitigation_net_bookings_usd == kpi.unmitigated_net_bookings_usd + conflict.projected_net_bookings_recovery_usd

    def test_t4_scenario1_step7_full_lifecycle_http_journey(self, test_client: TestClient, eafc_toty_brief):
        """Step 7: Complete HTTP journey simulating executive brief submission on /api/v1/intake/simulate."""
        resp = test_client.post("/api/v1/intake/simulate", json=eafc_toty_brief.model_dump())
        assert resp.status_code == 200
        data = resp.json()

        # All key financial & collision guarantees
        assert data["submission"]["campaign_name"] == "EA FC 27 TOTY Mid-Season Push"
        assert data["kpi_projection"]["projected_installs"] == 364000
        assert data["kpi_projection"]["blended_cpi_usd"] == 4.12
        assert data["kpi_projection"]["day7_roas"] == 3.42
        assert data["kpi_projection"]["post_mitigation_net_bookings_usd"] == 5130000.0

        # Conflict details
        assert data["fatigue_analysis"]["collision_detected"] is True
        assert data["fatigue_analysis"]["shared_ea_id_overlap_pct"] == 42.1
        assert data["fatigue_analysis"]["ad_fatigue_suppression_penalty_pct"] == 14.5
        assert data["fatigue_analysis"]["net_bookings_risk_usd"] == 420000.0
        assert data["fatigue_analysis"]["recommended_timeline_shift_days"] == 3
        assert data["fatigue_analysis"]["mitigated_flight_start"] == "2026-10-27"
        assert data["fatigue_analysis"]["mitigated_flight_end"] == "2026-11-07"
        assert data["fatigue_analysis"]["projected_net_bookings_recovery_usd"] == 420000.0

    def test_t4_scenario1_step8_channel_breakdown_consistency(self, eafc_toty_brief):
        """Step 8: Verify mitigation application clears collision status and restores net bookings."""
        eafc_mitigated = CampaignBriefSubmission(
            campaign_name="EA FC 27 TOTY Mid-Season Push",
            franchise="EA Sports FC",
            total_budget=1500000.0,
            flight_start="2026-10-24",
            flight_end="2026-11-07",
            apply_mitigation=True,
        )
        prediction = campaign_intake_service.simulate_campaign(eafc_mitigated)
        assert prediction.fatigue_analysis.status == "MITIGATED_COLLISION_CLEARED"
        assert prediction.kpi_projection.effective_net_bookings_usd == 5130000.0
        assert prediction.kpi_projection.penalty_applied_pct == 0.0
