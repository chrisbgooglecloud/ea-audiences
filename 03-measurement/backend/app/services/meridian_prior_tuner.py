"""Meridian Bayesian Prior Calibration Service.

Implements meta-analytic log-normal Bayesian prior calibration from causal lift trials
and randomized geo-experiments to seed Google Meridian Marketing Mix Models.
"""

import math
import numpy as np
from typing import List, Dict, Optional
from app.schemas.meridian import (
    CausalLiftExperiment,
    PriorCalibrationRequest,
    ChannelPrior,
    PriorCalibrationResponse,
)


class MeridianPriorTuner:
    """Calibrates Bayesian log-normal prior distributions from causal experimentation data."""

    def calibrate_channel_prior(
        self, channel: str, experiments: List[CausalLiftExperiment]
    ) -> ChannelPrior:
        """Perform meta-analytic inverse-variance weighted calibration for a single channel."""
        ch_exps = [e for e in experiments if e.channel.lower() == channel.lower()]
        if not ch_exps:
            # Fallback default empirical prior for EA live services
            return ChannelPrior(
                channel=channel,
                prior_mean_mu=math.log(1.85),
                prior_std_sigma=0.35,
                pooled_roas_estimate=1.85,
                pooled_roas_se=0.15,
                heterogeneity_tau_sq=0.04,
                half_saturation_prior_s=45000.0,
                hill_slope_prior_k=1.35,
                sample_experiments_count=0,
            )

        m = len(ch_exps)
        roas_values = np.array([e.observed_roas for e in ch_exps], dtype=np.float64)
        se_values = np.array([max(1e-4, e.standard_error) for e in ch_exps], dtype=np.float64)
        spends = np.array([e.spend for e in ch_exps], dtype=np.float64)

        # Inverse-variance fixed effect weights
        weights = 1.0 / (se_values ** 2)
        sum_w = float(np.sum(weights))
        sum_w_sq = float(np.sum(weights ** 2))

        # Pooled effect estimate
        pooled_roas = float(np.sum(weights * roas_values) / sum_w)
        pooled_se_fixed = math.sqrt(1.0 / sum_w)

        # Cochran's Q statistic for heterogeneity
        q_stat = float(np.sum(weights * ((roas_values - pooled_roas) ** 2)))

        # DerSimonian-Laird estimator for between-trial heterogeneity tau^2
        if m > 1 and sum_w > 0:
            denom = sum_w - (sum_w_sq / sum_w)
            tau_sq = max(0.0, (q_stat - (m - 1)) / max(1e-6, denom))
        else:
            tau_sq = 0.0

        # Random-effects pooled variance
        random_weights = 1.0 / (se_values ** 2 + tau_sq)
        sum_rw = float(np.sum(random_weights))
        if sum_rw > 0:
            pooled_roas_re = float(np.sum(random_weights * roas_values) / sum_rw)
            pooled_se_re = math.sqrt(1.0 / sum_rw)
        else:
            pooled_roas_re = pooled_roas
            pooled_se_re = pooled_se_fixed

        # Ensure positive expected value for log-normal distribution
        mean_theta = max(0.1, pooled_roas_re)
        # Total variance including between-study variance and estimation uncertainty
        var_theta = max(0.01, (pooled_se_re ** 2) + tau_sq)

        # Log-Normal parameter transformation:
        # If X ~ LogNormal(mu, sigma^2), then:
        # sigma^2 = ln(1 + Var(X) / E[X]^2)
        # mu = ln(E[X]) - sigma^2 / 2
        sigma_sq = math.log(1.0 + (var_theta / (mean_theta ** 2)))
        sigma = math.sqrt(sigma_sq)
        mu = math.log(mean_theta) - (sigma_sq / 2.0)

        # Estimate half-saturation S as median spend of high-confidence trials scaled by ROAS efficiency
        median_spend = float(np.median(spends))
        # Channels with higher ROAS saturate at higher spend thresholds
        half_sat_s = max(10000.0, median_spend * (mean_theta / 1.5))

        # Slope K typically between 1.1 and 1.8 for digital gaming media
        hill_k = round(float(np.clip(1.2 + (0.1 * (mean_theta - 1.0)), 0.8, 2.2)), 2)

        return ChannelPrior(
            channel=channel,
            prior_mean_mu=round(mu, 4),
            prior_std_sigma=round(sigma, 4),
            pooled_roas_estimate=round(mean_theta, 4),
            pooled_roas_se=round(pooled_se_re, 4),
            heterogeneity_tau_sq=round(tau_sq, 4),
            half_saturation_prior_s=round(half_sat_s, 2),
            hill_slope_prior_k=hill_k,
            sample_experiments_count=m,
        )

    def calibrate(self, request: PriorCalibrationRequest) -> PriorCalibrationResponse:
        """Calibrate priors for all unique channels in the request."""
        target_channels = request.channels
        if not target_channels:
            # Extract distinct channels from experiment list
            target_channels = list({e.channel for e in request.experiments})

        if not target_channels:
            # Standard EA digital acquisition channels
            target_channels = [
                "YouTube",
                "Meta",
                "TikTok",
                "Programmatic 3D",
                "Twitch Influencers",
                "Connected TV",
            ]

        calibrated: Dict[str, ChannelPrior] = {}
        for ch in target_channels:
            calibrated[ch] = self.calibrate_channel_prior(ch, request.experiments)

        return PriorCalibrationResponse(
            franchise=request.franchise,
            calibrated_priors=calibrated,
            status="SUCCESS",
            total_experiments_used=len(request.experiments),
        )


prior_tuner = MeridianPriorTuner()
