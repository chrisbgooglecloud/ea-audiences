from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class CausalLiftExperiment(_message.Message):
    __slots__ = ("experiment_id", "channel", "spend", "incremental_revenue", "observed_roas", "standard_error", "confidence_interval_lower", "confidence_interval_upper", "sample_size_dmas", "test_period_days")
    EXPERIMENT_ID_FIELD_NUMBER: _ClassVar[int]
    CHANNEL_FIELD_NUMBER: _ClassVar[int]
    SPEND_FIELD_NUMBER: _ClassVar[int]
    INCREMENTAL_REVENUE_FIELD_NUMBER: _ClassVar[int]
    OBSERVED_ROAS_FIELD_NUMBER: _ClassVar[int]
    STANDARD_ERROR_FIELD_NUMBER: _ClassVar[int]
    CONFIDENCE_INTERVAL_LOWER_FIELD_NUMBER: _ClassVar[int]
    CONFIDENCE_INTERVAL_UPPER_FIELD_NUMBER: _ClassVar[int]
    SAMPLE_SIZE_DMAS_FIELD_NUMBER: _ClassVar[int]
    TEST_PERIOD_DAYS_FIELD_NUMBER: _ClassVar[int]
    experiment_id: str
    channel: str
    spend: float
    incremental_revenue: float
    observed_roas: float
    standard_error: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    sample_size_dmas: int
    test_period_days: int
    def __init__(self, experiment_id: _Optional[str] = ..., channel: _Optional[str] = ..., spend: _Optional[float] = ..., incremental_revenue: _Optional[float] = ..., observed_roas: _Optional[float] = ..., standard_error: _Optional[float] = ..., confidence_interval_lower: _Optional[float] = ..., confidence_interval_upper: _Optional[float] = ..., sample_size_dmas: _Optional[int] = ..., test_period_days: _Optional[int] = ...) -> None: ...

class ChannelPrior(_message.Message):
    __slots__ = ("channel", "prior_mean_mu", "prior_std_sigma", "pooled_roas_estimate", "pooled_roas_se", "heterogeneity_tau_sq", "half_saturation_prior_s", "hill_slope_prior_k", "sample_experiments_count")
    CHANNEL_FIELD_NUMBER: _ClassVar[int]
    PRIOR_MEAN_MU_FIELD_NUMBER: _ClassVar[int]
    PRIOR_STD_SIGMA_FIELD_NUMBER: _ClassVar[int]
    POOLED_ROAS_ESTIMATE_FIELD_NUMBER: _ClassVar[int]
    POOLED_ROAS_SE_FIELD_NUMBER: _ClassVar[int]
    HETEROGENEITY_TAU_SQ_FIELD_NUMBER: _ClassVar[int]
    HALF_SATURATION_PRIOR_S_FIELD_NUMBER: _ClassVar[int]
    HILL_SLOPE_PRIOR_K_FIELD_NUMBER: _ClassVar[int]
    SAMPLE_EXPERIMENTS_COUNT_FIELD_NUMBER: _ClassVar[int]
    channel: str
    prior_mean_mu: float
    prior_std_sigma: float
    pooled_roas_estimate: float
    pooled_roas_se: float
    heterogeneity_tau_sq: float
    half_saturation_prior_s: float
    hill_slope_prior_k: float
    sample_experiments_count: int
    def __init__(self, channel: _Optional[str] = ..., prior_mean_mu: _Optional[float] = ..., prior_std_sigma: _Optional[float] = ..., pooled_roas_estimate: _Optional[float] = ..., pooled_roas_se: _Optional[float] = ..., heterogeneity_tau_sq: _Optional[float] = ..., half_saturation_prior_s: _Optional[float] = ..., hill_slope_prior_k: _Optional[float] = ..., sample_experiments_count: _Optional[int] = ...) -> None: ...

class PriorCalibrationRequest(_message.Message):
    __slots__ = ("franchise", "experiments", "channels")
    FRANCHISE_FIELD_NUMBER: _ClassVar[int]
    EXPERIMENTS_FIELD_NUMBER: _ClassVar[int]
    CHANNELS_FIELD_NUMBER: _ClassVar[int]
    franchise: str
    experiments: _containers.RepeatedCompositeFieldContainer[CausalLiftExperiment]
    channels: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, franchise: _Optional[str] = ..., experiments: _Optional[_Iterable[_Union[CausalLiftExperiment, _Mapping]]] = ..., channels: _Optional[_Iterable[str]] = ...) -> None: ...

class PriorCalibrationResponse(_message.Message):
    __slots__ = ("franchise", "calibrated_priors", "status", "method", "total_experiments_used")
    class CalibratedPriorsEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: ChannelPrior
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[ChannelPrior, _Mapping]] = ...) -> None: ...
    FRANCHISE_FIELD_NUMBER: _ClassVar[int]
    CALIBRATED_PRIORS_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    METHOD_FIELD_NUMBER: _ClassVar[int]
    TOTAL_EXPERIMENTS_USED_FIELD_NUMBER: _ClassVar[int]
    franchise: str
    calibrated_priors: _containers.MessageMap[str, ChannelPrior]
    status: str
    method: str
    total_experiments_used: int
    def __init__(self, franchise: _Optional[str] = ..., calibrated_priors: _Optional[_Mapping[str, ChannelPrior]] = ..., status: _Optional[str] = ..., method: _Optional[str] = ..., total_experiments_used: _Optional[int] = ...) -> None: ...

class ChannelSpendConstraint(_message.Message):
    __slots__ = ("channel", "current_spend", "min_spend", "max_spend", "base_roas", "half_saturation_s", "hill_slope_k")
    CHANNEL_FIELD_NUMBER: _ClassVar[int]
    CURRENT_SPEND_FIELD_NUMBER: _ClassVar[int]
    MIN_SPEND_FIELD_NUMBER: _ClassVar[int]
    MAX_SPEND_FIELD_NUMBER: _ClassVar[int]
    BASE_ROAS_FIELD_NUMBER: _ClassVar[int]
    HALF_SATURATION_S_FIELD_NUMBER: _ClassVar[int]
    HILL_SLOPE_K_FIELD_NUMBER: _ClassVar[int]
    channel: str
    current_spend: float
    min_spend: float
    max_spend: float
    base_roas: float
    half_saturation_s: float
    hill_slope_k: float
    def __init__(self, channel: _Optional[str] = ..., current_spend: _Optional[float] = ..., min_spend: _Optional[float] = ..., max_spend: _Optional[float] = ..., base_roas: _Optional[float] = ..., half_saturation_s: _Optional[float] = ..., hill_slope_k: _Optional[float] = ...) -> None: ...

class SCurvePoint(_message.Message):
    __slots__ = ("spend", "roas", "marginal_roas", "projected_revenue")
    SPEND_FIELD_NUMBER: _ClassVar[int]
    ROAS_FIELD_NUMBER: _ClassVar[int]
    MARGINAL_ROAS_FIELD_NUMBER: _ClassVar[int]
    PROJECTED_REVENUE_FIELD_NUMBER: _ClassVar[int]
    spend: float
    roas: float
    marginal_roas: float
    projected_revenue: float
    def __init__(self, spend: _Optional[float] = ..., roas: _Optional[float] = ..., marginal_roas: _Optional[float] = ..., projected_revenue: _Optional[float] = ...) -> None: ...

class ChannelOptimizationResult(_message.Message):
    __slots__ = ("channel", "current_spend", "allocated_spend", "spend_delta", "spend_delta_pct", "marginal_roas", "projected_roas", "projected_revenue", "projected_installs", "s_curve_points")
    CHANNEL_FIELD_NUMBER: _ClassVar[int]
    CURRENT_SPEND_FIELD_NUMBER: _ClassVar[int]
    ALLOCATED_SPEND_FIELD_NUMBER: _ClassVar[int]
    SPEND_DELTA_FIELD_NUMBER: _ClassVar[int]
    SPEND_DELTA_PCT_FIELD_NUMBER: _ClassVar[int]
    MARGINAL_ROAS_FIELD_NUMBER: _ClassVar[int]
    PROJECTED_ROAS_FIELD_NUMBER: _ClassVar[int]
    PROJECTED_REVENUE_FIELD_NUMBER: _ClassVar[int]
    PROJECTED_INSTALLS_FIELD_NUMBER: _ClassVar[int]
    S_CURVE_POINTS_FIELD_NUMBER: _ClassVar[int]
    channel: str
    current_spend: float
    allocated_spend: float
    spend_delta: float
    spend_delta_pct: float
    marginal_roas: float
    projected_roas: float
    projected_revenue: float
    projected_installs: int
    s_curve_points: _containers.RepeatedCompositeFieldContainer[SCurvePoint]
    def __init__(self, channel: _Optional[str] = ..., current_spend: _Optional[float] = ..., allocated_spend: _Optional[float] = ..., spend_delta: _Optional[float] = ..., spend_delta_pct: _Optional[float] = ..., marginal_roas: _Optional[float] = ..., projected_roas: _Optional[float] = ..., projected_revenue: _Optional[float] = ..., projected_installs: _Optional[int] = ..., s_curve_points: _Optional[_Iterable[_Union[SCurvePoint, _Mapping]]] = ...) -> None: ...

class EquimarginalOptimizationRequest(_message.Message):
    __slots__ = ("campaign_id", "franchise", "total_budget", "channels", "max_daily_shift_pct", "enforce_zero_sum", "target_d7_roas", "target_cpi")
    CAMPAIGN_ID_FIELD_NUMBER: _ClassVar[int]
    FRANCHISE_FIELD_NUMBER: _ClassVar[int]
    TOTAL_BUDGET_FIELD_NUMBER: _ClassVar[int]
    CHANNELS_FIELD_NUMBER: _ClassVar[int]
    MAX_DAILY_SHIFT_PCT_FIELD_NUMBER: _ClassVar[int]
    ENFORCE_ZERO_SUM_FIELD_NUMBER: _ClassVar[int]
    TARGET_D7_ROAS_FIELD_NUMBER: _ClassVar[int]
    TARGET_CPI_FIELD_NUMBER: _ClassVar[int]
    campaign_id: str
    franchise: str
    total_budget: float
    channels: _containers.RepeatedCompositeFieldContainer[ChannelSpendConstraint]
    max_daily_shift_pct: float
    enforce_zero_sum: bool
    target_d7_roas: float
    target_cpi: float
    def __init__(self, campaign_id: _Optional[str] = ..., franchise: _Optional[str] = ..., total_budget: _Optional[float] = ..., channels: _Optional[_Iterable[_Union[ChannelSpendConstraint, _Mapping]]] = ..., max_daily_shift_pct: _Optional[float] = ..., enforce_zero_sum: _Optional[bool] = ..., target_d7_roas: _Optional[float] = ..., target_cpi: _Optional[float] = ...) -> None: ...

class EquimarginalOptimizationResponse(_message.Message):
    __slots__ = ("scenario_id", "campaign_id", "franchise", "total_current_budget", "total_allocated_budget", "budget_net_delta", "total_projected_revenue", "portfolio_d7_roas", "portfolio_cpi", "revenue_uplift_pct", "zero_sum_satisfied", "pacing_clamp_satisfied", "max_shift_observed_pct", "channel_allocations", "solver_latency_ms", "convergence_status")
    SCENARIO_ID_FIELD_NUMBER: _ClassVar[int]
    CAMPAIGN_ID_FIELD_NUMBER: _ClassVar[int]
    FRANCHISE_FIELD_NUMBER: _ClassVar[int]
    TOTAL_CURRENT_BUDGET_FIELD_NUMBER: _ClassVar[int]
    TOTAL_ALLOCATED_BUDGET_FIELD_NUMBER: _ClassVar[int]
    BUDGET_NET_DELTA_FIELD_NUMBER: _ClassVar[int]
    TOTAL_PROJECTED_REVENUE_FIELD_NUMBER: _ClassVar[int]
    PORTFOLIO_D7_ROAS_FIELD_NUMBER: _ClassVar[int]
    PORTFOLIO_CPI_FIELD_NUMBER: _ClassVar[int]
    REVENUE_UPLIFT_PCT_FIELD_NUMBER: _ClassVar[int]
    ZERO_SUM_SATISFIED_FIELD_NUMBER: _ClassVar[int]
    PACING_CLAMP_SATISFIED_FIELD_NUMBER: _ClassVar[int]
    MAX_SHIFT_OBSERVED_PCT_FIELD_NUMBER: _ClassVar[int]
    CHANNEL_ALLOCATIONS_FIELD_NUMBER: _ClassVar[int]
    SOLVER_LATENCY_MS_FIELD_NUMBER: _ClassVar[int]
    CONVERGENCE_STATUS_FIELD_NUMBER: _ClassVar[int]
    scenario_id: str
    campaign_id: str
    franchise: str
    total_current_budget: float
    total_allocated_budget: float
    budget_net_delta: float
    total_projected_revenue: float
    portfolio_d7_roas: float
    portfolio_cpi: float
    revenue_uplift_pct: float
    zero_sum_satisfied: bool
    pacing_clamp_satisfied: bool
    max_shift_observed_pct: float
    channel_allocations: _containers.RepeatedCompositeFieldContainer[ChannelOptimizationResult]
    solver_latency_ms: float
    convergence_status: str
    def __init__(self, scenario_id: _Optional[str] = ..., campaign_id: _Optional[str] = ..., franchise: _Optional[str] = ..., total_current_budget: _Optional[float] = ..., total_allocated_budget: _Optional[float] = ..., budget_net_delta: _Optional[float] = ..., total_projected_revenue: _Optional[float] = ..., portfolio_d7_roas: _Optional[float] = ..., portfolio_cpi: _Optional[float] = ..., revenue_uplift_pct: _Optional[float] = ..., zero_sum_satisfied: _Optional[bool] = ..., pacing_clamp_satisfied: _Optional[bool] = ..., max_shift_observed_pct: _Optional[float] = ..., channel_allocations: _Optional[_Iterable[_Union[ChannelOptimizationResult, _Mapping]]] = ..., solver_latency_ms: _Optional[float] = ..., convergence_status: _Optional[str] = ...) -> None: ...

class ScenarioState(_message.Message):
    __slots__ = ("scenario_id", "campaign_id", "title", "franchise", "request", "response", "active_agent_id", "executive_notes", "updated_at_utc")
    SCENARIO_ID_FIELD_NUMBER: _ClassVar[int]
    CAMPAIGN_ID_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    FRANCHISE_FIELD_NUMBER: _ClassVar[int]
    REQUEST_FIELD_NUMBER: _ClassVar[int]
    RESPONSE_FIELD_NUMBER: _ClassVar[int]
    ACTIVE_AGENT_ID_FIELD_NUMBER: _ClassVar[int]
    EXECUTIVE_NOTES_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_UTC_FIELD_NUMBER: _ClassVar[int]
    scenario_id: str
    campaign_id: str
    title: str
    franchise: str
    request: EquimarginalOptimizationRequest
    response: EquimarginalOptimizationResponse
    active_agent_id: str
    executive_notes: str
    updated_at_utc: int
    def __init__(self, scenario_id: _Optional[str] = ..., campaign_id: _Optional[str] = ..., title: _Optional[str] = ..., franchise: _Optional[str] = ..., request: _Optional[_Union[EquimarginalOptimizationRequest, _Mapping]] = ..., response: _Optional[_Union[EquimarginalOptimizationResponse, _Mapping]] = ..., active_agent_id: _Optional[str] = ..., executive_notes: _Optional[str] = ..., updated_at_utc: _Optional[int] = ...) -> None: ...
