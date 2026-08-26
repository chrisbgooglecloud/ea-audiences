"""Unit Tests for Equimarginal Hill Saturation Budget Pacing Engine."""

import time
import pytest
from app.services.pacing_engine import pacing_engine


def test_zero_sum_preservation(sample_pacing_request):
    """Verify strict portfolio zero-sum budget preservation (sum(delta spend) == 0.00)."""
    response = pacing_engine.solve(sample_pacing_request)

    assert response.zero_sum_satisfied is True
    assert abs(response.budget_net_delta) < 0.10
    assert abs(response.total_allocated_budget - response.total_current_budget) < 0.10


def test_pacing_clamp_strictness(sample_pacing_request):
    """Verify 20% daily pacing shift clamp (0.80 * Spend_t-1 <= Spend_t <= 1.20 * Spend_t-1)."""
    response = pacing_engine.solve(sample_pacing_request)

    assert response.pacing_clamp_satisfied is True
    for ch in response.channel_allocations:
        max_allowed = ch.current_spend * 1.20
        min_allowed = ch.current_spend * 0.80
        assert min_allowed - 0.01 <= ch.allocated_spend <= max_allowed + 0.01


def test_solver_latency_under_150ms(sample_pacing_request):
    """Verify closed-form SLSQP solver converges in under 150ms."""
    start = time.perf_counter()
    response = pacing_engine.solve(sample_pacing_request)
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    assert elapsed_ms < 150.0
    assert response.solver_latency_ms < 150.0
    assert response.convergence_status in ["OPTIMAL_CONVERGED", "APPROX_CONVERGED"]


def test_revenue_uplift_positive(sample_pacing_request):
    """Verify optimized allocation yields equal or superior projected revenue."""
    response = pacing_engine.solve(sample_pacing_request)
    assert response.revenue_uplift_pct >= 0.0
    assert response.portfolio_d7_roas > 0.0


def test_s_curve_points_generation(sample_pacing_request):
    """Verify high-resolution S-curve points are populated for each channel."""
    response = pacing_engine.solve(sample_pacing_request)
    for ch in response.channel_allocations:
        assert len(ch.s_curve_points) >= 20
        assert ch.s_curve_points[0].spend < ch.s_curve_points[-1].spend
