"""Tier 1 Unit Tests: Protobuf Serialization & Deserialization Engine.

Tests mmm.proto schema compilation, binary serialization, deserialization roundtrips,
and field preservation across Meridian MMM data types.
"""

import pytest
from proto import mmm_pb2


class TestProtobufRoundtrips:
    """Validate protobuf serialization and deserialization across all Meridian message types."""

    def test_causal_lift_experiment_roundtrip(self):
        """Verify CausalLiftExperiment serialization and field fidelity."""
        exp = mmm_pb2.CausalLiftExperiment(
            experiment_id="exp-meta-001",
            channel="Meta",
            spend=85000.50,
            incremental_revenue=212501.25,
            observed_roas=2.50,
            standard_error=0.14,
            confidence_interval_lower=2.22,
            confidence_interval_upper=2.78,
            sample_size_dmas=28,
            test_period_days=21,
        )

        binary_data = exp.SerializeToString()
        assert len(binary_data) > 0

        restored = mmm_pb2.CausalLiftExperiment()
        restored.ParseFromString(binary_data)

        assert restored.experiment_id == "exp-meta-001"
        assert restored.channel == "Meta"
        assert pytest.approx(restored.spend, rel=1e-5) == 85000.50
        assert pytest.approx(restored.observed_roas, rel=1e-5) == 2.50
        assert restored.sample_size_dmas == 28
        assert restored.test_period_days == 21

    def test_channel_prior_roundtrip(self):
        """Verify ChannelPrior serialization and Bayesian prior parameters."""
        prior = mmm_pb2.ChannelPrior(
            channel="YouTube",
            prior_mean_mu=0.8542,
            prior_std_sigma=0.3211,
            pooled_roas_estimate=2.45,
            pooled_roas_se=0.12,
            heterogeneity_tau_sq=0.035,
            half_saturation_prior_s=55000.0,
            hill_slope_prior_k=1.35,
            sample_experiments_count=4,
        )

        binary_data = prior.SerializeToString()
        restored = mmm_pb2.ChannelPrior()
        restored.ParseFromString(binary_data)

        assert restored.channel == "YouTube"
        assert pytest.approx(restored.prior_mean_mu, rel=1e-4) == 0.8542
        assert pytest.approx(restored.prior_std_sigma, rel=1e-4) == 0.3211
        assert pytest.approx(restored.half_saturation_prior_s, rel=1e-2) == 55000.0
        assert restored.sample_experiments_count == 4

    def test_prior_calibration_response_map_roundtrip(self):
        """Verify PriorCalibrationResponse map<string, ChannelPrior> serialization."""
        resp = mmm_pb2.PriorCalibrationResponse(
            franchise="Apex Legends",
            status="SUCCESS",
            method="Empirical Bayes",
            total_experiments_used=12,
        )

        resp.calibrated_priors["YouTube"].CopyFrom(
            mmm_pb2.ChannelPrior(
                channel="YouTube",
                prior_mean_mu=0.85,
                prior_std_sigma=0.30,
                pooled_roas_estimate=2.4,
                pooled_roas_se=0.1,
                half_saturation_prior_s=50000.0,
                hill_slope_prior_k=1.3,
                sample_experiments_count=3,
            )
        )
        resp.calibrated_priors["TikTok"].CopyFrom(
            mmm_pb2.ChannelPrior(
                channel="TikTok",
                prior_mean_mu=1.12,
                prior_std_sigma=0.38,
                pooled_roas_estimate=3.1,
                pooled_roas_se=0.15,
                half_saturation_prior_s=42000.0,
                hill_slope_prior_k=1.45,
                sample_experiments_count=4,
            )
        )

        binary_data = resp.SerializeToString()
        restored = mmm_pb2.PriorCalibrationResponse()
        restored.ParseFromString(binary_data)

        assert restored.franchise == "Apex Legends"
        assert len(restored.calibrated_priors) == 2
        assert "YouTube" in restored.calibrated_priors
        assert "TikTok" in restored.calibrated_priors
        assert pytest.approx(restored.calibrated_priors["TikTok"].pooled_roas_estimate, rel=1e-4) == 3.1

    def test_equimarginal_optimization_response_nested_roundtrip(self):
        """Verify full EquimarginalOptimizationResponse with nested channel allocations and S-curves."""
        opt_resp = mmm_pb2.EquimarginalOptimizationResponse(
            scenario_id="scen-e2e-001",
            campaign_id="camp-apex-001",
            franchise="Apex Legends",
            total_current_budget=300000.0,
            total_allocated_budget=300000.0,
            budget_net_delta=0.0,
            total_projected_revenue=765000.0,
            portfolio_d7_roas=2.55,
            portfolio_cpi=22.50,
            revenue_uplift_pct=14.2,
            zero_sum_satisfied=True,
            pacing_clamp_satisfied=True,
            max_shift_observed_pct=18.5,
            solver_latency_ms=12.4,
            convergence_status="OPTIMAL_CONVERGED",
        )

        # Add channel result
        ch_res = opt_resp.channel_allocations.add()
        ch_res.channel = "YouTube"
        ch_res.current_spend = 100000.0
        ch_res.allocated_spend = 115000.0
        ch_res.spend_delta = 15000.0
        ch_res.spend_delta_pct = 0.15
        ch_res.marginal_roas = 2.45
        ch_res.projected_roas = 2.65
        ch_res.projected_revenue = 304750.0
        ch_res.projected_installs = 4200

        # Add S-curve points
        for sp in [25000.0, 50000.0, 100000.0, 150000.0]:
            pt = ch_res.s_curve_points.add()
            pt.spend = sp
            pt.roas = 2.6
            pt.marginal_roas = 2.4
            pt.projected_revenue = sp * 2.6

        binary_data = opt_resp.SerializeToString()
        restored = mmm_pb2.EquimarginalOptimizationResponse()
        restored.ParseFromString(binary_data)

        assert restored.scenario_id == "scen-e2e-001"
        assert restored.zero_sum_satisfied is True
        assert len(restored.channel_allocations) == 1
        assert restored.channel_allocations[0].channel == "YouTube"
        assert len(restored.channel_allocations[0].s_curve_points) == 4
        assert restored.channel_allocations[0].s_curve_points[2].spend == 100000.0

    def test_empty_message_roundtrip(self):
        """Verify empty message serialization produces valid 0-byte string and restores cleanly."""
        empty_exp = mmm_pb2.CausalLiftExperiment()
        binary_data = empty_exp.SerializeToString()
        assert binary_data == b""

        restored = mmm_pb2.CausalLiftExperiment()
        restored.ParseFromString(binary_data)
        assert restored.experiment_id == ""
        assert restored.spend == 0.0
