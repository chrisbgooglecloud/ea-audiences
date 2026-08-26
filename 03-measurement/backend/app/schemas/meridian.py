"""Meridian MMM prior calibration, Hill Saturation, and Equimarginal pacing schemas."""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class CausalLiftExperiment(BaseModel):
    """Causal lift experiment trial data used to calibrate Bayesian priors."""
    experiment_id: str
    channel: str
    spend: float = Field(..., gt=0.0, description="Spend during the trial in USD")
    incremental_revenue: float = Field(..., description="Observed incremental revenue in USD")
    observed_roas: float = Field(..., description="Observed trial ROAS (revenue / spend)")
    standard_error: float = Field(..., gt=0.0, description="Standard error of the observed ROAS")
    confidence_interval_lower: float
    confidence_interval_upper: float
    sample_size_dmas: int = Field(default=20, ge=1)
    test_period_days: int = Field(default=14, ge=1)


class PriorCalibrationRequest(BaseModel):
    """Request to calibrate Bayesian priors from causal lift experiments."""
    franchise: str = Field(default="Apex Legends")
    experiments: List[CausalLiftExperiment]
    channels: Optional[List[str]] = None


class ChannelPrior(BaseModel):
    """Calibrated Bayesian prior parameters for a marketing channel."""
    channel: str
    prior_mean_mu: float = Field(..., description="Log-normal prior mean mu")
    prior_std_sigma: float = Field(..., description="Log-normal prior standard deviation sigma")
    pooled_roas_estimate: float = Field(..., description="Inverse-variance weighted pooled ROAS")
    pooled_roas_se: float = Field(..., description="Standard error of pooled ROAS estimate")
    heterogeneity_tau_sq: float = Field(default=0.0, description="DerSimonian-Laird tau squared")
    half_saturation_prior_s: float = Field(..., description="Calibrated Hill half-saturation parameter S")
    hill_slope_prior_k: float = Field(..., description="Calibrated Hill shape parameter K")
    sample_experiments_count: int


class PriorCalibrationResponse(BaseModel):
    """Response containing calibrated priors for all requested channels."""
    franchise: str
    calibrated_priors: Dict[str, ChannelPrior]
    status: str = "SUCCESS"
    method: str = "Empirical Bayes Log-Normal Calibration with Inverse-Variance Weighting"
    total_experiments_used: int


class ChannelSpendConstraint(BaseModel):
    """Spend constraints and Hill saturation parameters for a single channel."""
    channel: str
    current_spend: float = Field(..., ge=0.0, description="Current daily or campaign spend in USD")
    min_spend: Optional[float] = Field(None, description="Absolute lower spend bound (optional)")
    max_spend: Optional[float] = Field(None, description="Absolute upper spend bound (optional)")
    base_roas: float = Field(default=2.5, gt=0.0, description="Theoretical maximum base ROAS coefficient")
    half_saturation_s: float = Field(
        default=50000.0, gt=0.0, description="Spend level achieving 50% saturation"
    )
    hill_slope_k: float = Field(
        default=1.3, gt=0.5, le=3.0, description="Hill slope parameter determining curve steepness"
    )


class EquimarginalOptimizationRequest(BaseModel):
    """Request for budget optimization under Equimarginal Hill Saturation."""
    campaign_id: str = Field(default="camp-apex-s22-relaunch")
    franchise: str = Field(default="Apex Legends")
    total_budget: Optional[float] = Field(
        None, description="Target total budget. If None, sum of current spends is used."
    )
    channels: List[ChannelSpendConstraint]
    max_daily_shift_pct: float = Field(
        default=0.20, ge=0.01, le=0.50, description="Maximum allowable daily pacing shift (default 20%)"
    )
    enforce_zero_sum: bool = Field(
        default=True, description="Strictly enforce zero-sum reallocation across portfolio"
    )
    target_d7_roas: Optional[float] = None
    target_cpi: Optional[float] = None


class SCurvePoint(BaseModel):
    """Coordinate along the Hill Saturation response curve."""
    spend: float
    roas: float
    marginal_roas: float
    projected_revenue: float


class ChannelOptimizationResult(BaseModel):
    """Optimal allocation and S-curve for a specific channel."""
    channel: str
    current_spend: float
    allocated_spend: float
    spend_delta: float
    spend_delta_pct: float
    marginal_roas: float
    projected_roas: float
    projected_revenue: float
    projected_installs: int
    s_curve_points: List[SCurvePoint]


class EquimarginalOptimizationResponse(BaseModel):
    """Results from Equimarginal Hill Saturation solver."""
    scenario_id: str
    campaign_id: str
    franchise: str
    total_current_budget: float
    total_allocated_budget: float
    budget_net_delta: float = Field(
        ..., description="Sum of delta spends. Should be exactly 0.0 under zero-sum constraint."
    )
    total_projected_revenue: float
    portfolio_d7_roas: float
    portfolio_cpi: float
    revenue_uplift_pct: float
    zero_sum_satisfied: bool
    pacing_clamp_satisfied: bool
    max_shift_observed_pct: float
    channel_allocations: List[ChannelOptimizationResult]
    solver_latency_ms: float
    convergence_status: str
