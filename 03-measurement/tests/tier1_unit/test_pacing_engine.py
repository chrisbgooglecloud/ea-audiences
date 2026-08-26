"""Tier 1 Unit Tests: Equimarginal Hill Saturation Optimization Engine.

Tests:
1. Hill Revenue & Marginal ROAS derivative correctness.
2. Zero-sum portfolio invariant: |sum(allocated_spend) - sum(current_spend)| < 0.01.
3. 20% daily pacing clamp: 0.80 * x_i <= x_i* <= 1.20 * x_i for all channels.
4. S-Curve generation, diminishing returns, and curvature properties.
5. Multi-channel convergence and edge cases.
"""

import pytest
import numpy as np
from app.services.pacing_engine import EquimarginalPacingEngine, pacing_engine
from app.schemas.meridian import (
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
    EquimarginalOptimizationResponse,
)


class TestHillMathematicalFormulas:
    """Validate mathematical correctness of Hill Saturation and Marginal ROAS derivatives."""

    def test_hill_revenue_zero_spend(self):
        """Verify Hill revenue is exactly 0 when spend is 0."""
        rev = EquimarginalPacingEngine.hill_revenue(
            spend=0.0, base_roas=2.5, s=50000.0, k=1.3
        )
        assert rev == 0.0

    def test_hill_revenue_at_half_saturation(self):
        """At spend = s, Hill saturation factor (s^k / (s^k + s^k)) = 0.5.

        Therefore R(s) = base_roas * s * 0.5.
        """
        base_roas = 2.5
        s = 50000.0
        k = 1.4
        rev = EquimarginalPacingEngine.hill_revenue(spend=s, base_roas=base_roas, s=s, k=k)
        expected = base_roas * s * 0.5
        assert pytest.approx(rev, rel=1e-5) == expected

    def test_hill_revenue_monotonicity(self):
        """Verify Hill revenue is strictly monotonically increasing with spend."""
        s = 40000.0
        k = 1.3
        base_roas = 3.0
        spends = [1000.0, 10000.0, 40000.0, 100000.0, 250000.0]
        revenues = [
            EquimarginalPacingEngine.hill_revenue(sp, base_roas, s, k) for sp in spends
        ]

        for i in range(len(revenues) - 1):
            assert revenues[i] < revenues[i + 1], f"Revenue at {spends[i]} not < {spends[i+1]}"

    def test_marginal_roas_derivative_accuracy(self):
        """Verify analytical marginal_roas matches numerical finite difference derivative."""
        base_roas = 2.8
        s = 60000.0
        k = 1.35
        test_spends = [15000.0, 45000.0, 60000.0, 120000.0]
        h = 1e-4

        for sp in test_spends:
            analytical_mroas = EquimarginalPacingEngine.marginal_roas(sp, base_roas, s, k)
            r_plus = EquimarginalPacingEngine.hill_revenue(sp + h, base_roas, s, k)
            r_minus = EquimarginalPacingEngine.hill_revenue(sp - h, base_roas, s, k)
            numerical_mroas = (r_plus - r_minus) / (2 * h)

            assert pytest.approx(analytical_mroas, rel=1e-3) == numerical_mroas, (
                f"Analytical mROAS {analytical_mroas} != Numerical {numerical_mroas} at spend {sp}"
            )

    def test_diminishing_marginal_returns(self):
        """Verify marginal ROAS diminishes at high spend (beyond saturation point)."""
        base_roas = 3.0
        s = 50000.0
        k = 1.2
        mroas_at_s = EquimarginalPacingEngine.marginal_roas(s, base_roas, s, k)
        mroas_at_3s = EquimarginalPacingEngine.marginal_roas(3 * s, base_roas, s, k)
        mroas_at_6s = EquimarginalPacingEngine.marginal_roas(6 * s, base_roas, s, k)

        assert mroas_at_s > mroas_at_3s > mroas_at_6s


class TestEquimarginalSolverInvariants:
    """Validate Equimarginal solver zero-sum and 20% daily pacing invariants."""

    def test_zero_sum_invariant(self, sample_pacing_request):
        """Zero-Sum Invariant: sum(allocated_spend) == sum(current_spend) within $0.01."""
        response = pacing_engine.solve(sample_pacing_request)

        assert response.zero_sum_satisfied is True
        total_curr = sum(c.current_spend for c in sample_pacing_request.channels)
        total_alloc = sum(ca.allocated_spend for ca in response.channel_allocations)

        # Invariant |delta| < 0.01
        assert abs(total_alloc - total_curr) < 0.01
        assert abs(response.budget_net_delta) < 0.01

    def test_twenty_percent_daily_pacing_clamp(self, sample_pacing_request):
        """Pacing Clamp Invariant: for every channel i, 0.80 * x_i <= x_i* <= 1.20 * x_i."""
        response = pacing_engine.solve(sample_pacing_request)

        assert response.pacing_clamp_satisfied is True
        for ca in response.channel_allocations:
            curr = ca.current_spend
            alloc = ca.allocated_spend
            lower_bound = curr * (1.0 - sample_pacing_request.max_daily_shift_pct) - 0.01
            upper_bound = curr * (1.0 + sample_pacing_request.max_daily_shift_pct) + 0.01

            assert lower_bound <= alloc <= upper_bound, (
                f"Channel {ca.channel} allocated {alloc} outside [{lower_bound}, {upper_bound}]"
            )
            # Verify delta pct is within 20%
            assert abs(ca.spend_delta_pct) <= (sample_pacing_request.max_daily_shift_pct + 0.001)

    def test_budget_shift_towards_higher_marginal_roas_channel(self):
        """Verify solver shifts capital from less efficient channel to more efficient channel."""
        request = EquimarginalOptimizationRequest(
            campaign_id="camp-efficiency-test",
            franchise="Apex Legends",
            channels=[
                ChannelSpendConstraint(
                    channel="HighEfficiencyTikTok",
                    current_spend=50000.0,
                    base_roas=3.8,  # Highly efficient
                    half_saturation_s=80000.0,
                    hill_slope_k=1.4,
                ),
                ChannelSpendConstraint(
                    channel="LowEfficiencyDisplay",
                    current_spend=50000.0,
                    base_roas=1.2,  # Low efficiency
                    half_saturation_s=30000.0,
                    hill_slope_k=1.2,
                ),
            ],
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        alloc_tiktok = next(c for c in response.channel_allocations if c.channel == "HighEfficiencyTikTok")
        alloc_display = next(c for c in response.channel_allocations if c.channel == "LowEfficiencyDisplay")

        # TikTok spend should increase (positive delta), Display spend should decrease (negative delta)
        assert alloc_tiktok.spend_delta > 0
        assert alloc_display.spend_delta < 0
        assert pytest.approx(alloc_tiktok.spend_delta, abs=0.01) == -alloc_display.spend_delta
        # Revenue uplift must be positive
        assert response.revenue_uplift_pct > 0

    def test_s_curve_generation(self):
        """Verify S-curve points generation contains valid coordinates and monotonic spend."""
        engine = EquimarginalPacingEngine()
        points = engine.generate_s_curve(
            base_roas=2.5, s=50000.0, k=1.3, current_spend=40000.0, num_points=30
        )

        assert len(points) == 30
        for i in range(len(points) - 1):
            assert points[i].spend < points[i + 1].spend
            assert points[i].projected_revenue <= points[i + 1].projected_revenue
            assert points[i].roas >= 0.0
            assert points[i].marginal_roas >= 0.0

    def test_single_channel_optimization(self):
        """Verify solver handles single-channel edge case without error."""
        request = EquimarginalOptimizationRequest(
            campaign_id="camp-single",
            channels=[
                ChannelSpendConstraint(
                    channel="YouTube",
                    current_spend=100000.0,
                    base_roas=2.5,
                    half_saturation_s=50000.0,
                    hill_slope_k=1.3,
                )
            ],
            enforce_zero_sum=True,
        )
        response = pacing_engine.solve(request)
        assert len(response.channel_allocations) == 1
        assert response.channel_allocations[0].allocated_spend == 100000.0
        assert response.budget_net_delta == 0.0
