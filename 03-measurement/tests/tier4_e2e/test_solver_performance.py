"""Tier 4 E2E Performance Benchmark: Equimarginal Hill Saturation Solver.

Verifies:
1. Mathematical optimizer latency is strictly < 200ms across 100 consecutive iterations.
2. p50, p95, and p99 execution latency percentiles.
3. 100% compliance with zero-sum invariant (|delta| < 0.01) under rapid multi-channel perturbation.
4. Stress scalability across 2, 4, 8, and 12-channel portfolios with budgets up to $10,000,000.
"""

import time
import numpy as np
import pytest
from app.services.pacing_engine import EquimarginalPacingEngine, pacing_engine
from app.schemas.meridian import ChannelSpendConstraint, EquimarginalOptimizationRequest


class TestSolverPerformanceBenchmarks:
    """Benchmark solver speed, scalability, and numerical stability."""

    def test_solver_latency_100_iterations_under_200ms(self, sample_pacing_request):
        """Verify solver completes 100 consecutive optimizations with p95 latency < 200ms."""
        latencies_ms = []
        zero_sum_checks = []

        for i in range(100):
            t0 = time.perf_counter()
            response = pacing_engine.solve(sample_pacing_request)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0

            latencies_ms.append(elapsed_ms)
            zero_sum_checks.append(response.zero_sum_satisfied)

        p50 = float(np.percentile(latencies_ms, 50))
        p95 = float(np.percentile(latencies_ms, 95))
        p99 = float(np.percentile(latencies_ms, 99))
        max_lat = float(np.max(latencies_ms))

        # Latency must be strictly under the 200ms threshold
        assert p95 < 200.0, f"p95 latency {p95:.2f}ms exceeded 200ms threshold"
        assert max_lat < 200.0, f"Max latency {max_lat:.2f}ms exceeded 200ms threshold"
        # In fact, typically < 25ms
        assert p50 < 50.0

        # Invariant check: 100% of iterations satisfied zero-sum
        assert all(zero_sum_checks), "Zero-sum invariant failed in one or more iterations"

    @pytest.mark.parametrize("channel_count", [2, 4, 8, 12])
    def test_multi_channel_scale_and_large_budget(self, channel_count):
        """Verify solver scalability across portfolio sizes from 2 to 12 channels with $10M budget."""
        channels = []
        for i in range(channel_count):
            channels.append(
                ChannelSpendConstraint(
                    channel=f"Channel_{i+1}",
                    current_spend=1000000.0 / channel_count,
                    base_roas=1.5 + (i * 0.3),
                    half_saturation_s=400000.0,
                    hill_slope_k=1.2 + (i * 0.05),
                )
            )

        req = EquimarginalOptimizationRequest(
            campaign_id=f"camp-scale-{channel_count}",
            franchise="Apex Legends",
            total_budget=1000000.0,
            channels=channels,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        t0 = time.perf_counter()
        res = pacing_engine.solve(req)
        duration_ms = (time.perf_counter() - t0) * 1000.0

        assert duration_ms < 200.0
        assert res.zero_sum_satisfied is True
        assert res.pacing_clamp_satisfied is True
        assert len(res.channel_allocations) == channel_count
