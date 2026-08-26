"""Campaign brief intake, cross-franchise fatigue, and predictive measurement schemas."""

import time
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, model_validator


class CohortTargetEnum(str, Enum):
    """Target player cohort segment."""
    GEN_Z_CORE = "GEN_Z_CORE"
    LAPSED_WHALES = "LAPSED_WHALES"
    COMPETITIVE_ESPORTS = "COMPETITIVE_ESPORTS"
    CASUAL_SOCIAL = "CASUAL_SOCIAL"
    ALL_EA_PLAYERS = "ALL_EA_PLAYERS"


class ChannelAllocationInput(BaseModel):
    """Channel allocation parameter in campaign brief."""
    channel: str = Field(..., description="Marketing channel name (e.g. YouTube, TikTok)")
    budget_usd: Optional[float] = Field(None, ge=0.0, description="Allocated spend for channel")
    weight_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Budget weight percentage")


class CampaignBriefSubmission(BaseModel):
    """Executive campaign brief submitted for predictive simulation."""
    campaign_id: str = Field(
        default="camp-fc27-toty-001",
        description="Unique campaign identifier",
    )
    campaign_name: str = Field(
        default="EA FC 27 TOTY Mid-Season Push",
        description="Human-readable campaign title",
    )
    franchise: str = Field(
        default="EA Sports FC",
        description="Target franchise (e.g. EA Sports FC, Apex Legends, Battlefield)",
    )
    target_audience: str = Field(
        default="GEN_Z_CORE",
        description="Target player cohort segment",
    )
    target_cohort: Optional[str] = Field(
        default=None,
        description="Alias for target player cohort segment",
    )
    flight_start: str = Field(
        default="2026-10-24",
        description="Scheduled flight start date (YYYY-MM-DD)",
    )
    flight_end: str = Field(
        default="2026-10-27",
        description="Scheduled flight end date (YYYY-MM-DD)",
    )
    total_budget: float = Field(
        default=1500000.0,
        gt=0.0,
        description="Total planned campaign media budget in USD",
    )
    budget_usd: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Alias for total planned budget in USD",
    )
    channels: Optional[List[str]] = Field(
        default=["YouTube", "TikTok", "Meta", "Twitch", "Google Ads"],
        description="Selected marketing channels for distribution",
    )
    target_channels: Optional[List[str]] = Field(
        default=None,
        description="Alias for target marketing channels",
    )
    target_kpi: Optional[str] = Field(
        default="D7_ROAS",
        description="Primary optimization objective KPI",
    )
    target_cpi: Optional[float] = Field(
        default=4.12,
        gt=0.0,
        description="Target Cost Per Install (CPI) in USD",
    )
    target_roas: Optional[float] = Field(
        default=3.42,
        gt=0.0,
        description="Target Day-7 ROAS multiplier",
    )
    apply_mitigation: bool = Field(
        default=False,
        description="Whether to apply recommended collision mitigation (+3 day shift & player pruning)",
    )
    notes: Optional[str] = Field(
        default=None,
        description="Optional executive strategy notes",
    )

    @model_validator(mode="before")
    @classmethod
    def reconcile_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "budget_usd" in values and values["budget_usd"] is not None and ("total_budget" not in values or values["total_budget"] is None):
                values["total_budget"] = values["budget_usd"]
            elif "total_budget" in values and values["total_budget"] is not None and ("budget_usd" not in values or values["budget_usd"] is None):
                values["budget_usd"] = values["total_budget"]
            if "target_cohort" in values and values["target_cohort"] is not None and ("target_audience" not in values or values["target_audience"] is None):
                values["target_audience"] = values["target_cohort"]
            elif "target_audience" in values and values["target_audience"] is not None and ("target_cohort" not in values or values["target_cohort"] is None):
                values["target_cohort"] = values["target_audience"]
            if "target_channels" in values and values["target_channels"] is not None and ("channels" not in values or values["channels"] is None):
                values["channels"] = values["target_channels"]
            elif "channels" in values and values["channels"] is not None and ("target_channels" not in values or values["target_channels"] is None):
                values["target_channels"] = values["channels"]
        return values


class ChannelPredictionDetail(BaseModel):
    """Per-channel KPI projection."""
    channel: str = Field(..., description="Marketing channel name")
    allocated_spend: float = Field(..., ge=0.0, description="Allocated spend for channel")
    projected_installs: int = Field(default=0, ge=0, description="Projected installs")
    projected_cpi: float = Field(default=4.12, ge=0.0, description="Projected CPI")
    projected_roas: float = Field(default=3.42, ge=0.0, description="Projected ROAS")
    projected_net_bookings: float = Field(default=0.0, ge=0.0, description="Projected net bookings")


class ConflictFatigueAnalysis(BaseModel):
    """Cross-franchise collision detection and ad fatigue analysis."""
    collision_detected: bool = Field(
        default=True,
        description="Whether a cross-franchise audience collision was detected",
    )
    has_conflict: Optional[bool] = Field(
        default=None,
        description="Alias for collision_detected",
    )
    has_collision: Optional[bool] = Field(
        default=None,
        description="Alias for collision_detected",
    )
    target_campaign_id: str = Field(
        default="camp-fc27-toty-001",
        description="Target campaign ID evaluated",
    )
    target_campaign_name: str = Field(
        default="EA FC 27 TOTY Mid-Season Push",
        description="Target campaign name",
    )
    conflicting_campaign_id: Optional[str] = Field(
        default="camp-apex-s26-002",
        description="Conflicting campaign ID causing audience overlap",
    )
    conflicting_campaign_name: Optional[str] = Field(
        default="Apex Legends Season 26 Launch",
        description="Conflicting campaign title",
    )
    target_franchise: str = Field(
        default="EA Sports FC",
        description="Target franchise",
    )
    conflicting_franchise: Optional[str] = Field(
        default="Apex Legends",
        description="Conflicting franchise sharing player base",
    )
    flight_start: str = Field(
        default="2026-10-24",
        description="Target campaign flight start date",
    )
    flight_end: str = Field(
        default="2026-10-27",
        description="Target campaign flight end date",
    )
    conflict_flight_start: Optional[str] = Field(
        default="2026-10-24",
        description="Conflicting campaign flight start date",
    )
    conflict_flight_end: Optional[str] = Field(
        default="2026-10-27",
        description="Conflicting campaign flight end date",
    )
    collision_window_start: Optional[str] = Field(
        default=None,
        description="Alias for conflict_flight_start",
    )
    collision_window_end: Optional[str] = Field(
        default=None,
        description="Alias for conflict_flight_end",
    )
    shared_ea_id_overlap_pct: float = Field(
        default=42.1,
        ge=0.0,
        le=100.0,
        description="Percentage of overlapping unique EA ID accounts",
    )
    shared_player_count: int = Field(
        default=1280000,
        ge=0,
        description="Estimated count of shared active players across both titles",
    )
    ad_fatigue_suppression_penalty_pct: float = Field(
        default=14.5,
        ge=0.0,
        le=100.0,
        description="Ad fatigue conversion suppression penalty percentage",
    )
    net_bookings_risk_usd: float = Field(
        default=420000.0,
        ge=0.0,
        description="Net bookings revenue at risk due to unmitigated fatigue collision",
    )
    recommended_timeline_shift_days: int = Field(
        default=3,
        description="Recommended flight timeline shift in days",
    )
    mitigated_flight_start: Optional[str] = Field(
        default="2026-10-27",
        description="Mitigated flight start date after timeline shift",
    )
    mitigated_flight_end: Optional[str] = Field(
        default="2026-11-07",
        description="Mitigated flight end date after timeline shift",
    )
    recommended_flight_start: Optional[str] = Field(
        default=None,
        description="Alias for mitigated_flight_start",
    )
    recommended_flight_end: Optional[str] = Field(
        default=None,
        description="Alias for mitigated_flight_end",
    )
    projected_net_bookings_recovery_usd: float = Field(
        default=420000.0,
        ge=0.0,
        description="Projected net bookings recovery if mitigation action is applied",
    )
    mitigation_strategy: str = Field(
        default="Timeline shift (+3 days) to Oct 27-Nov 07 & negative audience suppression on heavy Apex players",
        description="Prescriptive mitigation strategy description",
    )
    status: str = Field(
        default="AMBER_COLLISION_DETECTED",
        description="Collision status: AMBER_COLLISION_DETECTED | MITIGATED_COLLISION_CLEARED | NO_COLLISION_DETECTED",
    )

    @model_validator(mode="before")
    @classmethod
    def reconcile_has_conflict(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "has_collision" in values and values["has_collision"] is not None and "collision_detected" not in values:
                values["collision_detected"] = values["has_collision"]
            if "has_conflict" in values and values["has_conflict"] is not None and "collision_detected" not in values:
                values["collision_detected"] = values["has_conflict"]
            if "collision_window_start" in values and values["collision_window_start"] is not None and "conflict_flight_start" not in values:
                values["conflict_flight_start"] = values["collision_window_start"]
            if "collision_window_end" in values and values["collision_window_end"] is not None and "conflict_flight_end" not in values:
                values["conflict_flight_end"] = values["collision_window_end"]
            if "recommended_flight_start" in values and values["recommended_flight_start"] is not None and "mitigated_flight_start" not in values:
                values["mitigated_flight_start"] = values["recommended_flight_start"]
            if "recommended_flight_end" in values and values["recommended_flight_end"] is not None and "mitigated_flight_end" not in values:
                values["mitigated_flight_end"] = values["recommended_flight_end"]
            if "conflict_flight_start" in values and "collision_window_start" not in values:
                values["collision_window_start"] = values["conflict_flight_start"]
            if "conflict_flight_end" in values and "collision_window_end" not in values:
                values["collision_window_end"] = values["conflict_flight_end"]
            if "mitigated_flight_start" in values and "recommended_flight_start" not in values:
                values["recommended_flight_start"] = values["mitigated_flight_start"]
            if "mitigated_flight_end" in values and "recommended_flight_end" not in values:
                values["recommended_flight_end"] = values["mitigated_flight_end"]
            if "collision_detected" in values and "has_collision" not in values:
                values["has_collision"] = values["collision_detected"]
            if "collision_detected" in values and "has_conflict" not in values:
                values["has_conflict"] = values["collision_detected"]
        return values


class CampaignKPIProjection(BaseModel):
    """Forecasted core performance KPIs for the campaign."""
    projected_installs: int = Field(
        default=364000,
        ge=0,
        description="Forecasted total game installs",
    )
    forecasted_installs: Optional[int] = Field(
        default=None,
        description="Alias for projected installs",
    )
    blended_cpi_usd: float = Field(
        default=4.12,
        ge=0.0,
        description="Blended Cost Per Install (CPI) in USD",
    )
    day7_roas: float = Field(
        default=3.42,
        ge=0.0,
        description="Forecasted Day-7 Return On Ad Spend multiplier",
    )
    projected_d7_roas: Optional[float] = Field(
        default=None,
        description="Alias for forecasted Day-7 ROAS",
    )
    baseline_net_bookings_usd: float = Field(
        default=4710000.0,
        ge=0.0,
        description="Baseline unsuppressed net bookings revenue in USD",
    )
    unmitigated_net_bookings_usd: float = Field(
        default=4290000.0,
        ge=0.0,
        description="Effective net bookings if collision penalty is unmitigated in USD",
    )
    post_mitigation_net_bookings_usd: float = Field(
        default=5130000.0,
        ge=0.0,
        description="Post-mitigation recovered net bookings revenue in USD",
    )
    effective_net_bookings_usd: float = Field(
        default=4290000.0,
        ge=0.0,
        description="Current effective net bookings based on whether mitigation is applied",
    )
    penalty_applied_pct: float = Field(
        default=14.5,
        ge=0.0,
        le=100.0,
        description="Active suppression penalty percentage applied to this simulation",
    )

    @model_validator(mode="before")
    @classmethod
    def reconcile_kpi_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "forecasted_installs" in values and values["forecasted_installs"] is not None and "projected_installs" not in values:
                values["projected_installs"] = values["forecasted_installs"]
            elif "projected_installs" in values and "forecasted_installs" not in values:
                values["forecasted_installs"] = values["projected_installs"]

            if "projected_d7_roas" in values and values["projected_d7_roas"] is not None and "day7_roas" not in values:
                values["day7_roas"] = values["projected_d7_roas"]
            elif "day7_roas" in values and "projected_d7_roas" not in values:
                values["projected_d7_roas"] = values["day7_roas"]
        return values


class CampaignPredictionResponse(BaseModel):
    """Complete response envelope for campaign simulation."""
    simulation_id: str = Field(
        default_factory=lambda: f"sim-{int(time.time())}",
        description="Unique simulation execution identifier",
    )
    submission: Optional[CampaignBriefSubmission] = None
    kpi_projection: Optional[CampaignKPIProjection] = None
    fatigue_analysis: Optional[ConflictFatigueAnalysis] = None
    simulation_timestamp: str = Field(
        default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        description="ISO 8601 UTC timestamp of simulation",
    )
    confidence_score: float = Field(
        default=0.94,
        ge=0.0,
        le=1.0,
        description="Statistical confidence score of predictive modeling",
    )
    status: str = Field(default="SUCCESS", description="Simulation status")
    message: str = Field(
        default="Campaign brief simulation and cross-franchise fatigue analysis computed successfully",
        description="Execution message",
    )

    @model_validator(mode="before")
    @classmethod
    def reconcile_flat_inputs(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "submission" not in values:
                camp_id = values.get("campaign_id", f"camp-{int(time.time())}")
                camp_name = values.get("campaign_name", "EA FC 27 TOTY Mid-Season Push")
                fr = values.get("franchise", "EA Sports FC")
                budget = values.get("budget_usd", values.get("total_budget", 1500000.0))
                start = values.get("flight_start", "2026-10-24")
                end = values.get("flight_end", "2026-10-27")
                values["submission"] = CampaignBriefSubmission(
                    campaign_id=camp_id,
                    campaign_name=camp_name,
                    franchise=fr,
                    total_budget=budget,
                    budget_usd=budget,
                    flight_start=start,
                    flight_end=end,
                )
            if "kpi_projection" not in values:
                installs = values.get("predicted_installs", 364000)
                cpi = values.get("predicted_cpi", 4.12)
                roas = values.get("predicted_d7_roas", 3.42)
                baseline = values.get("baseline_net_bookings_usd", 5130000.0)
                penalized = values.get("penalized_net_bookings_usd", 4710000.0)
                post_mit = values.get("net_bookings_post_mitigation_usd", 5130000.0)
                values["kpi_projection"] = CampaignKPIProjection(
                    projected_installs=installs,
                    blended_cpi_usd=cpi,
                    day7_roas=roas,
                    baseline_net_bookings_usd=baseline,
                    unmitigated_net_bookings_usd=penalized,
                    post_mitigation_net_bookings_usd=post_mit,
                    effective_net_bookings_usd=penalized,
                )
            if "fatigue_analysis" not in values:
                conflict = values.get("conflict_analysis")
                if isinstance(conflict, ConflictFatigueAnalysis):
                    values["fatigue_analysis"] = conflict
                elif isinstance(conflict, dict):
                    values["fatigue_analysis"] = ConflictFatigueAnalysis.model_validate(conflict)
                else:
                    values["fatigue_analysis"] = ConflictFatigueAnalysis()
        return values

    @property
    def predicted_installs(self) -> int:
        return self.kpi_projection.projected_installs if self.kpi_projection else 364000

    @property
    def predicted_cpi(self) -> float:
        return self.kpi_projection.blended_cpi_usd if self.kpi_projection else 4.12

    @property
    def predicted_d7_roas(self) -> float:
        return self.kpi_projection.day7_roas if self.kpi_projection else 3.42

    @property
    def baseline_net_bookings_usd(self) -> float:
        return self.kpi_projection.baseline_net_bookings_usd if self.kpi_projection else 5130000.0

    @property
    def penalized_net_bookings_usd(self) -> float:
        return self.kpi_projection.unmitigated_net_bookings_usd if self.kpi_projection else 4710000.0

    @property
    def net_bookings_post_mitigation_usd(self) -> float:
        return self.kpi_projection.post_mitigation_net_bookings_usd if self.kpi_projection else 5130000.0

    @property
    def conflict_analysis(self) -> ConflictFatigueAnalysis:
        return self.fatigue_analysis or ConflictFatigueAnalysis()

    @property
    def channel_breakdown(self) -> List[ChannelPredictionDetail]:
        budget = self.submission.total_budget if self.submission else 1500000.0
        cpi = self.predicted_cpi
        roas = self.predicted_d7_roas
        channels = self.submission.channels if (self.submission and self.submission.channels) else ["Paid Social", "Paid Search", "Influencers", "CTV"]
        num_channels = len(channels)
        weights = [0.35, 0.28, 0.22, 0.15]
        breakdown = []
        for i, ch in enumerate(channels):
            w = weights[i % len(weights)] if num_channels == 4 else (1.0 / num_channels)
            ch_spend = round(budget * w, 2)
            ch_installs = int(round(ch_spend / cpi)) if cpi > 0 else 0
            ch_bookings = round(ch_spend * roas, 2)
            breakdown.append(
                ChannelPredictionDetail(
                    channel=ch,
                    allocated_spend=ch_spend,
                    projected_installs=ch_installs,
                    projected_cpi=cpi,
                    projected_roas=roas,
                    projected_net_bookings=ch_bookings,
                )
            )
        return breakdown

    @property
    def campaign_id(self) -> str:
        return self.submission.campaign_id if self.submission else "camp-001"

    @property
    def campaign_name(self) -> str:
        return self.submission.campaign_name if self.submission else "EA FC 27 TOTY Mid-Season Push"

    @property
    def franchise(self) -> str:
        return self.submission.franchise if self.submission else "EA Sports FC"

    @property
    def budget_usd(self) -> float:
        return self.submission.total_budget if self.submission else 1500000.0
