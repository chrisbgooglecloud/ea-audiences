"""Tier 5 Adversarial Tests: Boundary Budgets ($0, $1, $100M+).

Validates:
1. Zero-budget ($0.00) condition: no division by zero, zero allocation, valid response.
2. Micro-budget ($0.10 - $10.00) condition: sub-dollar cent allocation, precision invariant.
3. Mega-budget ($100M - $1B) condition: large-scale numerical stability, zero-sum preservation.
"""

import pytest
import numpy as np
from app.services.pacing_engine import EquimarginalPacingEngine, pacing_engine
from app.schemas.meridian import ChannelSpendConstraint, EquimarginalOptimizationRequest


class TestBoundaryBudgetAdversarial:
    """Stress tests on extreme boundary budgets."""

    def test_zero_budget_boundary(self):
        """Budget $0.00: Solver should handle all-zero current spend without division by zero."""
        request = EquimarginalOptimizationRequest(
            campaign_id="camp-boundary-zero",
            franchise="Apex Legends",
            channels=[
                ChannelSpendConstraint.model_construct(
                    channel="TikTok",
                    current_spend=0.0,
                    base_roas=2.5,
                    half_saturation_s=50000.0,
                    hill_slope_k=1.3,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="YouTube",
                    current_spend=0.0,
                    base_roas=3.0,
                    half_saturation_s=60000.0,
                    hill_slope_k=1.4,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="Search",
                    current_spend=0.0,
                    base_roas=1.8,
                    half_saturation_s=30000.0,
                    hill_slope_k=1.1,
                ),
            ],
            total_budget=0.0,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.total_allocated_budget == 0.0
        assert response.budget_net_delta == 0.0
        assert response.zero_sum_satisfied is True
        assert response.pacing_clamp_satisfied is True
        for ca in response.channel_allocations:
            assert ca.allocated_spend == 0.0
            assert ca.spend_delta == 0.0

    @pytest.mark.parametrize("micro_budget", [0.10, 0.50, 1.00, 5.00, 10.00])
    def test_micro_budget_precision(self, micro_budget):
        """Micro-budgets ($0.10 to $10.00): Invariant preservation under small currency amounts."""
        c1 = round(micro_budget * 0.40, 2)
        c2 = round(micro_budget * 0.35, 2)
        c3 = round(micro_budget - c1 - c2, 2)

        request = EquimarginalOptimizationRequest(
            campaign_id=f"camp-micro-{micro_budget}",
            franchise="EA SPORTS FC",
            channels=[
                ChannelSpendConstraint.model_construct(
                    channel="TikTok",
                    current_spend=c1,
                    base_roas=3.5,
                    half_saturation_s=100.0,
                    hill_slope_k=1.2,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="Meta",
                    current_spend=c2,
                    base_roas=2.2,
                    half_saturation_s=100.0,
                    hill_slope_k=1.1,
                ),
                ChannelSpendConstraint.model_construct(
                    channel="YouTube",
                    current_spend=c3,
                    base_roas=2.8,
                    half_saturation_s=100.0,
                    hill_slope_k=1.3,
                ),
            ],
            total_budget=micro_budget,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.zero_sum_satisfied is True
        assert abs(response.budget_net_delta) < 0.01
        assert response.solver_latency_ms < 200.0

    @pytest.mark.parametrize("mega_budget", [100_000_000.0, 250_000_000.0, 500_000_000.0, 1_000_000_000.0])
    def test_mega_budget_stability(self, mega_budget):
        """Mega-budgets ($100M - $1B): Numerical stability and zero-sum across massive spend portfolios."""
        n_channels = 6
        per_channel = mega_budget / n_channels

        channels = [
            ChannelSpendConstraint.model_construct(
                channel=f"MegaChannel_{i+1}",
                current_spend=per_channel,
                base_roas=2.0 + (i * 0.4),
                half_saturation_s=per_channel * 0.8,
                hill_slope_k=1.2 + (i * 0.1),
            )
            for i in range(n_channels)
        ]

        request = EquimarginalOptimizationRequest(
            campaign_id=f"camp-mega-{int(mega_budget)}",
            franchise="Battlefield",
            channels=channels,
            total_budget=mega_budget,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        response = pacing_engine.solve(request)

        assert response.zero_sum_satisfied is True
        assert abs(response.budget_net_delta) < 0.01
        assert response.pacing_clamp_satisfied is True
        assert response.solver_latency_ms < 200.0
        assert response.total_allocated_budget == pytest.approx(mega_budget, rel=1e-5)
