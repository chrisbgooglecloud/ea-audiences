"""Tier 5 Adversarial Tests: 1,000+ Iteration Randomized Fuzz Harness.

Validates across 1,000+ randomized parameter permutations:
1. Zero-sum portfolio invariant: |sum(allocated_spend) - sum(current_spend)| < 0.01.
2. 20% daily pacing clamp: 0.80 * x_i <= x_i* <= 1.20 * x_i for every channel i.
3. Solver execution latency strictly < 200ms per iteration.
4. Robustness against combinations of boundary budgets, extreme slopes, and tight caps.
"""

import time
import random
import pytest
import numpy as np
from app.services.pacing_engine import EquimarginalPacingEngine, pacing_engine
from app.schemas.meridian import ChannelSpendConstraint, EquimarginalOptimizationRequest


class TestEquimarginalFuzzAdversarial:
    """1,000+ randomized adversarial stress-test iterations."""

    def test_1000_randomized_fuzz_iterations(self):
        """Run 1,000 randomized optimization scenarios and assert invariants NEVER fail."""
        np.random.seed(42)
        random.seed(42)

        n_iterations = 1000
        latencies = []
        zero_sum_checks = []
        pacing_clamp_checks = []

        for iteration in range(n_iterations):
            num_channels = random.randint(2, 8)

            # Sample budget category
            b_type = random.random()
            if b_type < 0.05:
                total_budget = 0.0
            elif b_type < 0.10:
                total_budget = round(random.uniform(1.0, 100.0), 2)
            elif b_type < 0.15:
                total_budget = round(random.uniform(10_000_000.0, 100_000_000.0), 2)
            else:
                total_budget = round(random.uniform(10_000.0, 5_000_000.0), 2)

            if total_budget == 0.0:
                current_spends = [0.0] * num_channels
            else:
                raw_weights = np.random.exponential(1.0, num_channels)
                current_spends = (raw_weights / np.sum(raw_weights)) * total_budget
                current_spends = [round(float(s), 2) for s in current_spends]
                diff = total_budget - sum(current_spends)
                current_spends[-1] = round(current_spends[-1] + diff, 2)

            channels = []
            for c_idx in range(num_channels):
                c_spend = max(0.0, current_spends[c_idx])

                # Sample slope k (including extreme slopes)
                s_type = random.random()
                if s_type < 0.10:
                    k = random.uniform(0.01, 0.099)  # Ultra-flat slope k < 0.1
                elif s_type < 0.20:
                    k = random.uniform(10.1, 16.0)   # Ultra-steep slope k > 10
                else:
                    k = random.uniform(0.6, 2.5)     # Standard slope

                base_roas = random.uniform(0.5, 5.0)
                half_s = max(1.0, c_spend * random.uniform(0.3, 2.5)) if c_spend > 0 else 50000.0

                # Channel caps
                use_caps = random.random() < 0.25
                min_spend = None
                max_spend = None
                if use_caps and c_spend > 10.0:
                    tightness = random.uniform(0.02, 0.10)
                    min_spend = round(c_spend * (1.0 - tightness), 2)
                    max_spend = round(c_spend * (1.0 + tightness), 2)

                channels.append(
                    ChannelSpendConstraint.model_construct(
                        channel=f"Channel_{c_idx+1}",
                        current_spend=c_spend,
                        base_roas=base_roas,
                        half_saturation_s=half_s,
                        hill_slope_k=k,
                        min_spend=min_spend,
                        max_spend=max_spend,
                    )
                )

            max_shift = 0.20
            request = EquimarginalOptimizationRequest(
                campaign_id=f"fuzz-iter-{iteration}",
                franchise="Apex Legends",
                channels=channels,
                total_budget=total_budget if total_budget > 0 else None,
                max_daily_shift_pct=max_shift,
                enforce_zero_sum=True,
            )

            t0 = time.perf_counter()
            response = pacing_engine.solve(request)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0

            latencies.append(elapsed_ms)

            # Invariant 1: Zero-Sum Preservation (|budget_net_delta| < 0.01)
            assert response.zero_sum_satisfied is True, (
                f"Iteration {iteration}: zero_sum_satisfied is False"
            )
            assert abs(response.budget_net_delta) < 0.01, (
                f"Iteration {iteration}: net_delta {response.budget_net_delta} >= 0.01"
            )
            zero_sum_checks.append(True)

            # Invariant 2: 20% Daily Pacing Clamp
            assert response.pacing_clamp_satisfied is True, (
                f"Iteration {iteration}: pacing_clamp_satisfied is False"
            )
            assert response.max_shift_observed_pct <= (max_shift * 100.0 + 0.5), (
                f"Iteration {iteration}: max_shift {response.max_shift_observed_pct}% exceeded 20%"
            )
            pacing_clamp_checks.append(True)

            # Invariant 3: Solver Latency < 200ms
            assert elapsed_ms < 200.0, (
                f"Iteration {iteration}: solver latency {elapsed_ms:.2f}ms exceeded 200ms threshold"
            )

        # Aggregate Statistics
        assert len(latencies) == n_iterations
        assert all(zero_sum_checks)
        assert all(pacing_clamp_checks)

        p50 = float(np.percentile(latencies, 50))
        p95 = float(np.percentile(latencies, 95))
        p99 = float(np.percentile(latencies, 99))
        max_lat = float(np.max(latencies))

        assert p95 < 50.0, f"p95 latency {p95:.2f}ms higher than expected"
        assert max_lat < 200.0, f"Max latency {max_lat:.2f}ms exceeded 200ms"
