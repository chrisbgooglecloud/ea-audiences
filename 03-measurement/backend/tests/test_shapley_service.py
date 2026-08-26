"""Unit Tests for 2D Multimodal Creative Shapley Video Intelligence Service."""

import pytest
from app.schemas.shapley import (
    PreTestVideoAuditRequest,
    ShapleyFeatureElement,
    FunnelCategoryEnum,
)
from app.services.shapley_service import shapley_service


def test_bellingham_vs_trickshots_tradeoff(sample_fc27_shapley_request):
    """Test 2D Shapley lift metrics for Jude Bellingham Walkout vs Trick Shots."""
    response = shapley_service.audit_video_asset(sample_fc27_shapley_request)

    assert response.status == "SUCCESS"
    assert len(response.features) >= 2

    # Verify Jude Bellingham Walkout
    bellingham = next(f for f in response.features if "Bellingham" in f.feature_name)
    assert bellingham.category == FunnelCategoryEnum.LOWER_FUNNEL_MONETIZATION.value
    assert bellingham.marginal_ctr_lift_pct == 4.2
    assert bellingham.marginal_cti_lift_pct == 32.4
    assert bellingham.marginal_d7_roas_multiplier == 3.42

    # Verify Trick Shots
    trickshot = next(f for f in response.features if "Trick Shot" in f.feature_name)
    assert trickshot.category == FunnelCategoryEnum.TOP_OF_FUNNEL.value
    assert trickshot.marginal_ctr_lift_pct == 41.0
    assert trickshot.marginal_cti_lift_pct == -12.1
    assert trickshot.marginal_d7_roas_multiplier == 1.85


def test_apex_heirloom_vs_superglide_tradeoff(sample_apex_shapley_request):
    """Test 2D Shapley lift metrics for Apex Mythic Heirloom vs Superglide."""
    response = shapley_service.audit_video_asset(sample_apex_shapley_request)

    assert response.status == "SUCCESS"
    heirloom = next(f for f in response.features if "Heirloom" in f.feature_name)
    assert heirloom.marginal_ctr_lift_pct == 6.5
    assert heirloom.marginal_cti_lift_pct == 28.5
    assert heirloom.marginal_d7_roas_multiplier == 3.15

    superglide = next(f for f in response.features if "Superglide" in f.feature_name)
    assert superglide.marginal_ctr_lift_pct == 38.0
    assert superglide.marginal_cti_lift_pct == -9.0
    assert superglide.marginal_d7_roas_multiplier == 1.92


def test_funnel_balance_index_bounds(sample_fc27_shapley_request, sample_apex_shapley_request):
    """Test Funnel Balance Index (FBI) is correctly computed on [0.0, 1.0]."""
    res_fc = shapley_service.audit_video_asset(sample_fc27_shapley_request)
    assert 0.0 <= res_fc.funnel_balance_index <= 1.0
    assert abs(res_fc.funnel_balance_index - 0.74) < 0.05

    res_apex = shapley_service.audit_video_asset(sample_apex_shapley_request)
    assert 0.0 <= res_apex.funnel_balance_index <= 1.0
    assert abs(res_apex.funnel_balance_index - 0.76) < 0.05


def test_prescriptive_sequencing_rules(sample_fc27_shapley_request):
    """Test prescriptive sequencing rules recommend ToFu hook in 0:00-0:03 and BoFu at 0:08+."""
    response = shapley_service.audit_video_asset(sample_fc27_shapley_request)
    assert "0:00-0:03" in response.prescriptive_action or "first 3 seconds" in response.prescriptive_action
    assert "Bellingham" in response.prescriptive_action or "Walkout" in response.prescriptive_action
    assert len(response.waterfall_breakdown) >= 2


def test_empty_request_defaults():
    """Test empty request uses automatic benchmark features for EA Sports FC."""
    req = PreTestVideoAuditRequest()
    response = shapley_service.audit_video_asset(req)
    assert response.status == "SUCCESS"
    assert len(response.features) >= 2
    assert response.funnel_balance_index > 0.5
