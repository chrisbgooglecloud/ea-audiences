"""Tier 5 Adversarial Tests: Extreme Hill Slopes ($k < 0.1$, $k > 10$).

Validates:
1. Ultra-flat Hill slopes ($k < 0.1$): $k=0.01, 0.03, 0.05, 0.08$. Tests logarithmic-like near-constant elasticity.
2. Steep Hill slopes ($k > 10$): $k=10.5, 12.0, 15.0, 18.0$. Tests quasi-step function saturation.
3. Heterogeneous portfolio combining $k < 0.1$ and $k > 10$ channels in a single optimization.
4. Numerical derivative stability and zero-sum preservation under extreme curvature.
"""

import pytest
import numpy as np
from app.services.pacing_engine import EquimarginalPacingEngine, pacing_engine
from app.schemas.meridian import ChannelSpendConstraint, EquimarginalOptimizationRequest


class TestExtremeHillSlopesAdversarial:
    """Adversarial stress-testing of Hill slope shape parameter k."""

    @pytest.mark.parametrize("k_val", [0.01, 0.03, 0.05, 0.08, 0.099])
    def test_ultra_flat_slope_k_under_0_1(self, k_val):
        """Slope k < 0.1: Near-flat saturation curve behaves stably without singularity."""
        request = EquimarginalOptimizationRequest(
            campaign_id=f"camp-flat-k-{k_val}",
            franchise="Apex Legends",
            channels=[
                ChannelSpendConstraint.model_construct(
                    channel="FlatChannelA",
                    current_spend=50000.0,
                    base_roas=3.0,
                    half_saturation_s=40000.0,
                    hill_slope_k=k_val,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="FlatChannelB",
                    current_spend=50000.0,
                    base_roas=2.0,
                    half_saturation_s=60000.0,
                    hill_slope_k=k_val,
                ),
            ],
            total_budget=100000.0,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.zero_sum_satisfied is True
        assert abs(response.budget_net_delta) < 0.01
        assert response.pacing_clamp_satisfied is True
        assert response.solver_latency_ms < 200.0
        # Capital should flow to higher base_roas channel
        ch_a = next(c for c in response.channel_allocations if c.channel == "FlatChannelA")
        ch_b = next(c for c in response.channel_allocations if c.channel == "FlatChannelB")
        assert ch_a.allocated_spend >= ch_b.allocated_spend

    @pytest.mark.parametrize("k_val", [10.5, 12.0, 15.0, 18.0])
    def test_ultra_steep_slope_k_over_10(self, k_val):
        """Slope k > 10: Step-function like Hill curve optimizes smoothly within budget bounds."""
        request = EquimarginalOptimizationRequest(
            campaign_id=f"camp-steep-k-{k_val}",
            franchise="EA SPORTS FC",
            channels=[
                ChannelSpendConstraint.model_construct(
                    channel="SteepChannelA",
                    current_spend=60000.0,
                    base_roas=3.2,
                    half_saturation_s=55000.0,
                    hill_slope_k=k_val,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="SteepChannelB",
                    current_spend=40000.0,
                    base_roas=1.8,
                    half_saturation_s=45000.0,
                    hill_slope_k=k_val,
                ),
            ],
            total_budget=100000.0,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.zero_sum_satisfied is True
        assert abs(response.budget_net_delta) < 0.01
        assert response.pacing_clamp_satisfied is True
        assert response.solver_latency_ms < 200.0

    def test_heterogeneous_extreme_slopes_portfolio(self):
        """Heterogeneous portfolio: Mix of k=0.02 (flat), k=1.3 (normal), and k=14.0 (steep)."""
        request = EquimarginalOptimizationRequest(
            campaign_id="camp-heterogeneous-slopes",
            franchise="Apex Legends",
            channels=[
                ChannelSpendConstraint.model_construct(
                    channel="FlatChannel",
                    current_spend=30000.0,
                    base_roas=2.2,
                    half_saturation_s=25000.0,
                    hill_slope_k=0.02,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="NormalChannel",
                    current_spend=40000.0,
                    base_roas=3.0,
                    half_saturation_s=35000.0,
                    hill_slope_k=1.3,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="SteepChannel",
                    current_spend=30000.0,
                    base_roas=4.0,
                    half_saturation_s=32000.0,
                    hill_slope_k=14.0,
                ),
            ],
            total_budget=100000.0,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.zero_sum_satisfied is True
        assert abs(response.budget_net_delta) < 0.01
        assert response.pacing_clamp_satisfied is True
        assert response.solver_latency_ms < 200.0
        assert len(response.channel_allocations) == 3

    def test_marginal_roas_derivative_at_extreme_slopes(self):
        """Verify analytical mROAS remains non-negative and finite across extreme slopes."""
        spends = [10.0, 1000.0, 50000.0, 200000.0]
        for k in [0.01, 0.05, 0.09, 10.0, 15.0, 18.0]:
            for sp in spends:
                mroas = EquimarginalPacingEngine.marginal_roas(
                    spend=sp, base_roas=2.5, s=50000.0, k=k
                )
                assert not np.isnan(mroas), f"mROAS is NaN for spend={sp}, k={k}"
                assert not np.isinf(mroas), f"mROAS is Inf for spend={sp}, k={k}"
                assert mroas >= 0.0, f"mROAS is negative ({mroas}) for spend={sp}, k={k}"
