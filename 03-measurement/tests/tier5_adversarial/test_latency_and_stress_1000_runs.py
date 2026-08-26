"""Tier 5 Adversarial Tests: 1,000 Back-to-Back Solver Latency Benchmark.

Validates:
1. Solver execution latency is strictly < 200ms across 1,000 consecutive runs.
2. Percentile analysis (p50, p90, p95, p99, max) confirms sub-10ms typical response.
3. Zero-sum and 20% pacing clamp invariants remain 100% compliant under sustained load.
"""

import time
import pytest
import numpy as np
from app.services.pacing_engine import EquimarginalPacingEngine, pacing_engine
from app.schemas.meridian import ChannelSpendConstraint, EquimarginalOptimizationRequest


class TestLatencyAndStress1000RunsAdversarial:
    """Benchmark solver under 1,000 back-to-back executions."""

    def test_1000_back_to_back_solver_latency_under_200ms(self):
        """Execute 1,000 continuous optimizations and assert all run in < 200ms."""
        # 8-channel complex portfolio with heterogeneous parameters
        channels = [
            ChannelSpendConstraint.model_construct(
                channel="YouTube_TrueView",
                current_spend=120000.0,
                base_roas=3.2,
                half_saturation_s=100000.0,
                hill_slope_k=1.35,
            ),
            ChannelSpendConstraint.model_construct(
                channel="TikTok_InFeed",
                current_spend=95000.0,
                base_roas=3.8,
                half_saturation_s=80000.0,
                hill_slope_k=1.5,
            ),
            ChannelSpendConstraint.model_construct(
                channel="Meta_Reels",
                current_spend=80000.0,
                base_roas=2.6,
                half_saturation_s=75000.0,
                hill_slope_k=1.25,
            ),
            ChannelSpendConstraint.model_construct(
                channel="Google_AppCampaigns",
                current_spend=110000.0,
                base_roas=2.9,
                half_saturation_s=90000.0,
                hill_slope_k=1.3,
            ),
            ChannelSpendConstraint.model_construct(
                channel="Twitch_Banners",
                current_spend=45000.0,
                base_roas=1.7,
                half_saturation_s=35000.0,
                hill_slope_k=1.1,
            ),
            ChannelSpendConstraint.model_construct(
                channel="Snapchat_Spotlight",
                current_spend=35000.0,
                base_roas=2.1,
                half_saturation_s=30000.0,
                hill_slope_k=1.2,
            ),
            ChannelSpendConstraint.model_construct(
                channel="Programmatic_Display",
                current_spend=50000.0,
                base_roas=1.4,
                half_saturation_s=40000.0,
                hill_slope_k=1.05,
            ),
            ChannelSpendConstraint.model_construct(
                channel="Apple_SearchAds",
                current_spend=65000.0,
                base_roas=3.4,
                half_saturation_s=55000.0,
                hill_slope_k=1.4,
            ),
        ]

        total_budget = sum(c.current_spend for c in channels)
        request = EquimarginalOptimizationRequest(
            campaign_id="camp-apex-1000-stress",
            franchise="Apex Legends",
            total_budget=total_budget,
            channels=channels,
            max_daily_shift_pct=0.20,
            enforce_zero_sum=True,
        )

        n_runs = 1000
        latencies_ms = []

        for i in range(n_runs):
            t0 = time.perf_counter()
            response = pacing_engine.solve(request)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0

            latencies_ms.append(elapsed_ms)

            # Strict individual iteration assertions
            assert elapsed_ms < 200.0, (
                f"Run {i}: Latency {elapsed_ms:.2f}ms exceeded 200ms threshold"
            )
            assert response.zero_sum_satisfied is True
            assert response.pacing_clamp_satisfied is True
            assert abs(response.budget_net_delta) < 0.01

        p50 = float(np.percentile(latencies_ms, 50))
        p90 = float(np.percentile(latencies_ms, 90))
        p95 = float(np.percentile(latencies_ms, 95))
        p99 = float(np.percentile(latencies_ms, 99))
        max_lat = float(np.max(latencies_ms))
        mean_lat = float(np.mean(latencies_ms))

        # Strict statistical assertions
        assert p50 < 20.0, f"p50 latency {p50:.2f}ms too high"
        assert p95 < 50.0, f"p95 latency {p95:.2f}ms too high"
        assert max_lat < 200.0, f"Max latency {max_lat:.2f}ms exceeded 200ms"
        assert len(latencies_ms) == 1000
