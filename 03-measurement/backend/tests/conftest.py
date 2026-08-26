"""Pytest Fixtures for Backend Microservices Unit and Integration Tests."""

import os
import sys
import pytest
from typing import List
from fastapi.testclient import TestClient

# Ensure backend and measurement root are on sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
MEASUREMENT_DIR = os.path.dirname(BACKEND_DIR)

for p in [MEASUREMENT_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app
from app.schemas.intake import CampaignBriefSubmission
from app.schemas.shapley import (
    PreTestVideoAuditRequest,
    ShapleyFeatureElement,
    FunnelCategoryEnum,
)
from app.schemas.meridian import (
    EquimarginalOptimizationRequest,
    ChannelSpendConstraint,
)


@pytest.fixture(scope="session")
def client() -> TestClient:
    """FastAPI test client instance."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_fc27_brief() -> CampaignBriefSubmission:
    """Standard FC 27 brief triggering Oct 24-27 Apex collision."""
    return CampaignBriefSubmission(
        campaign_id="camp-fc27-toty-001",
        campaign_name="EA FC 27 TOTY Mid-Season Push",
        franchise="EA Sports FC",
        target_audience="GEN_Z_CORE",
        flight_start="2026-10-24",
        flight_end="2026-10-27",
        total_budget=1500000.0,
        channels=["YouTube", "TikTok", "Meta", "Twitch", "Google Ads"],
        apply_mitigation=False,
    )


@pytest.fixture
def sample_mitigated_brief() -> CampaignBriefSubmission:
    """FC 27 brief with AI mitigation applied (+3 day shift to Oct 27-Nov 07)."""
    return CampaignBriefSubmission(
        campaign_id="camp-fc27-toty-001",
        campaign_name="EA FC 27 TOTY Mid-Season Push",
        franchise="EA Sports FC",
        target_audience="GEN_Z_CORE",
        flight_start="2026-10-27",
        flight_end="2026-11-07",
        total_budget=1500000.0,
        channels=["YouTube", "TikTok", "Meta", "Twitch", "Google Ads"],
        apply_mitigation=True,
    )


@pytest.fixture
def sample_fc27_shapley_request() -> PreTestVideoAuditRequest:
    """15s Pre-test trailer for EA FC 27 with Bellingham Walkout and Trick Shots."""
    return PreTestVideoAuditRequest(
        asset_id="asset-fc27-pretest-001",
        asset_title="EA SPORTS FC 27 - Official Gameplay Trailer (15s Pre-Test)",
        franchise="EA Sports FC",
        video_duration_seconds=15.0,
        features=[
            ShapleyFeatureElement(
                feature_name="FUT Pack Walkout Jude Bellingham",
                category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
                feature_category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
                funnel_tier="BOFU",
                marginal_ctr_lift_pct=4.2,
                marginal_cti_lift_pct=32.4,
                marginal_d7_roas_multiplier=3.42,
                confidence_score=0.96,
                description="High intent walkout animation hook driving direct in-game store conversions.",
                timestamp_start_sec=8.0,
                timestamp_end_sec=15.0,
            ),
            ShapleyFeatureElement(
                feature_name="Skill Move / Trick Shot Showcase",
                category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
                feature_category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
                funnel_tier="TOFU",
                marginal_ctr_lift_pct=41.0,
                marginal_cti_lift_pct=-12.1,
                marginal_d7_roas_multiplier=1.85,
                confidence_score=0.94,
                description="Viral stopping power and high CTR hook.",
                timestamp_start_sec=0.0,
                timestamp_end_sec=4.0,
            ),
        ],
    )


@pytest.fixture
def sample_apex_shapley_request() -> PreTestVideoAuditRequest:
    """15s Pre-test trailer for Apex Legends with Heirloom Inspect and Superglide."""
    return PreTestVideoAuditRequest(
        asset_id="asset-apex-pretest-002",
        asset_title="Apex Legends Season 26 - Launch Trailer (15s Pre-Test)",
        franchise="Apex Legends",
        video_duration_seconds=15.0,
        features=[
            ShapleyFeatureElement(
                feature_name="Apex Mythic Heirloom Inspect",
                category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
                feature_category=FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value,
                funnel_tier="BOFU",
                marginal_ctr_lift_pct=6.5,
                marginal_cti_lift_pct=28.5,
                marginal_d7_roas_multiplier=3.15,
                confidence_score=0.95,
                description="Premium cosmetic showcase driving pack purchases.",
                timestamp_start_sec=9.0,
                timestamp_end_sec=15.0,
            ),
            ShapleyFeatureElement(
                feature_name="Apex Superglide / Tap-Strafe",
                category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
                feature_category=FunnelCategoryEnum.TOP_OF_FUNNEL.value,
                funnel_tier="TOFU",
                marginal_ctr_lift_pct=38.0,
                marginal_cti_lift_pct=-9.0,
                marginal_d7_roas_multiplier=1.92,
                confidence_score=0.92,
                description="High-velocity movement mechanics capturing immediate gamer attention.",
                timestamp_start_sec=0.0,
                timestamp_end_sec=3.5,
            ),
        ],
    )


@pytest.fixture
def sample_pacing_request() -> EquimarginalOptimizationRequest:
    """5-channel portfolio spend constraints for Equimarginal pacing."""
    return EquimarginalOptimizationRequest(
        campaign_id="camp-fc27-toty-001",
        franchise="EA Sports FC",
        total_budget=1500000.0,
        channels=[
            ChannelSpendConstraint(
                channel="YouTube",
                current_spend=450000.0,
                base_roas=3.60,
                half_saturation_s=600000.0,
                hill_slope_k=1.35,
            ),
            ChannelSpendConstraint(
                channel="TikTok",
                current_spend=400000.0,
                base_roas=3.80,
                half_saturation_s=500000.0,
                hill_slope_k=1.40,
            ),
            ChannelSpendConstraint(
                channel="Meta",
                current_spend=300000.0,
                base_roas=2.90,
                half_saturation_s=400000.0,
                hill_slope_k=1.25,
            ),
            ChannelSpendConstraint(
                channel="Twitch",
                current_spend=200000.0,
                base_roas=3.20,
                half_saturation_s=300000.0,
                hill_slope_k=1.30,
            ),
            ChannelSpendConstraint(
                channel="Google Ads",
                current_spend=150000.0,
                base_roas=2.50,
                half_saturation_s=250000.0,
                hill_slope_k=1.20,
            ),
        ],
        max_daily_shift_pct=0.20,
        enforce_zero_sum=True,
    )
