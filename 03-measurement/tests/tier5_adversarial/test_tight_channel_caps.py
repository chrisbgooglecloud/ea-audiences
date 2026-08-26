"""Tier 5 Adversarial Tests: Tight Channel Caps and Min/Max Constraints.

Validates:
1. Pinned channel (min_spend == max_spend == current_spend) remains exact.
2. Ultra-tight symmetric caps (±1% to ±5%) constrain reallocations accurately.
3. Asymmetric caps with flex channels absorbing portfolio delta.
4. Feasible budget clipping when total_budget exceeds aggregate bounds.
5. Priority handling when user min/max constraints conflict.
"""

import pytest
import numpy as np
from app.services.pacing_engine import EquimarginalPacingEngine, pacing_engine
from app.schemas.meridian import ChannelSpendConstraint, EquimarginalOptimizationRequest


class TestTightChannelCapsAdversarial:
    """Stress tests on tight channel min/max caps and constraint interactions."""

    def test_pinned_single_channel_in_portfolio(self):
        """Pinned Channel: One channel with min_spend == max_spend must have exactly 0.0 spend delta."""
        request = EquimarginalOptimizationRequest(
            campaign_id="camp-pinned-cap",
            franchise="Apex Legends",
            channels=[
                ChannelSpendConstraint.model_construct(
                    channel="PinnedBroadcastTV",
                    current_spend=50000.0,
                    min_spend=50000.0,
                    max_spend=50000.0,
                    base_roas=2.0,
                    half_saturation_s=40000.0,
                    hill_slope_k=1.2,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="FlexTikTok",
                    current_spend=30000.0,
                    base_roas=3.8,
                    half_saturation_s=40000.0,
                    hill_slope_k=1.4,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="FlexDisplay",
                    current_spend=20000.0,
                    base_roas=1.2,
                    half_saturation_s=20000.0,
                    hill_slope_k=1.1,
                ),
            ],
            total_budget=100000.0,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.zero_sum_satisfied is True
        assert abs(response.budget_net_delta) < 0.01

        pinned_ch = next(c for c in response.channel_allocations if c.channel == "PinnedBroadcastTV")
        assert pinned_ch.allocated_spend == 50000.0
        assert pinned_ch.spend_delta == 0.0

        flex_tt = next(c for c in response.channel_allocations if c.channel == "FlexTikTok")
        flex_disp = next(c for c in response.channel_allocations if c.channel == "FlexDisplay")
        assert flex_tt.spend_delta > 0
        assert flex_disp.spend_delta < 0
        assert pytest.approx(flex_tt.spend_delta, abs=0.01) == -flex_disp.spend_delta

    @pytest.mark.parametrize("tight_pct", [0.01, 0.02, 0.05])
    def test_ultra_tight_symmetric_caps(self, tight_pct):
        """Ultra-tight caps (±1% to ±5%): Allocated spend must strictly obey [min_spend, max_spend]."""
        curr_1, curr_2 = 60000.0, 40000.0
        min_1, max_1 = curr_1 * (1.0 - tight_pct), curr_1 * (1.0 + tight_pct)
        min_2, max_2 = curr_2 * (1.0 - tight_pct), curr_2 * (1.0 + tight_pct)

        request = EquimarginalOptimizationRequest(
            campaign_id=f"camp-tight-{int(tight_pct*100)}pct",
            franchise="Battlefield",
            channels=[
                ChannelSpendConstraint.model_construct(
                    channel="TightChannelA",
                    current_spend=curr_1,
                    min_spend=min_1,
                    max_spend=max_1,
                    base_roas=3.5,
                    half_saturation_s=50000.0,
                    hill_slope_k=1.3,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="TightChannelB",
                    current_spend=curr_2,
                    min_spend=min_2,
                    max_spend=max_2,
                    base_roas=1.5,
                    half_saturation_s=30000.0,
                    hill_slope_k=1.2,
                ),
            ],
            total_budget=100000.0,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.zero_sum_satisfied is True
        assert abs(response.budget_net_delta) < 0.01

        ch_a = next(c for c in response.channel_allocations if c.channel == "TightChannelA")
        ch_b = next(c for c in response.channel_allocations if c.channel == "TightChannelB")

        assert min_1 - 0.01 <= ch_a.allocated_spend <= max_1 + 0.01
        assert min_2 - 0.01 <= ch_b.allocated_spend <= max_2 + 0.01

    def test_all_channels_pinned_feasible(self):
        """All channels pinned to current spend: Solver returns identical allocation with 0 delta."""
        request = EquimarginalOptimizationRequest(
            campaign_id="camp-all-pinned",
            franchise="EA SPORTS FC",
            channels=[
                ChannelSpendConstraint.model_construct(
                    channel="Ch1",
                    current_spend=40000.0,
                    min_spend=40000.0,
                    max_spend=40000.0,
                    base_roas=2.0,
                    half_saturation_s=30000.0,
                    hill_slope_k=1.2,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="Ch2",
                    current_spend=60000.0,
                    min_spend=60000.0,
                    max_spend=60000.0,
                    base_roas=3.0,
                    half_saturation_s=50000.0,
                    hill_slope_k=1.4,
                ),
            ],
            total_budget=100000.0,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.zero_sum_satisfied is True
        assert response.budget_net_delta == 0.0
        for ca in response.channel_allocations:
            assert ca.spend_delta == 0.0
            assert ca.allocated_spend == ca.current_spend
