"""Multimodal 2D Creative Shapley game-theoretic intelligence schemas."""

import time
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, model_validator


class FunnelCategoryEnum(str, Enum):
    """Classification tier for creative mechanics."""
    TOP_OF_FUNNEL = "TOP_OF_FUNNEL"
    LOWER_FUNNEL_MONETIZATION = "LOWER_FUNNEL_MONETIZATION"
    NEUTRAL_ENGAGEMENT = "NEUTRAL_ENGAGEMENT"


# Alias for backwards compatibility with tests
ShapleyCategoryEnum = FunnelCategoryEnum


class ShapleyFeatureElement(BaseModel):
    """Individual creative feature element with 2D marginal lift values."""
    feature_id: Optional[str] = Field(default=None, description="Feature ID identifier")
    feature_name: str = Field(..., description="Name of the detected mechanic or feature hook")
    category: FunnelCategoryEnum = Field(..., description="TOP_OF_FUNNEL | LOWER_FUNNEL_MONETIZATION | NEUTRAL_ENGAGEMENT")
    feature_category: Optional[str] = Field(default=None, description="Alias for category")
    funnel_tier: str = Field(default="MOFU", description="Funnel tier tag: TOFU | MOFU | BOFU")
    marginal_ctr_lift_pct: float = Field(..., description="Marginal Click-Through Rate lift percentage (e.g. +41.0% or +4.2%)")
    marginal_cti_lift_pct: float = Field(..., description="Marginal Click-to-Install lift percentage (e.g. -12.1% or +32.4%)")
    marginal_d7_roas_multiplier: float = Field(..., description="Marginal Day-7 ROAS multiplier (e.g. 1.85 or 3.42)")
    confidence_score: float = Field(default=0.95, ge=0.0, le=1.0, description="Statistical attribution confidence score")
    description: Optional[str] = Field(None, description="Detailed tactical description of the mechanic")
    timestamp_start_sec: Optional[float] = Field(None, ge=0.0, description="Video timestamp start in seconds")
    timestamp_end_sec: Optional[float] = Field(None, ge=0.0, description="Video timestamp end in seconds")

    @model_validator(mode="before")
    @classmethod
    def reconcile_feature_category(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "feature_category" in values and values["feature_category"] is not None and "category" not in values:
                values["category"] = values["feature_category"]
            elif "category" in values and "feature_category" not in values:
                values["feature_category"] = values["category"]
        return values


class WaterfallStep(BaseModel):
    """Step in the 2D Shapley CTR vs CTI trade-off waterfall chart."""
    step_name: str = Field(..., description="Feature or sequencing step name")
    ctr_lift: float = Field(..., description="Marginal CTR lift contribution")
    cti_lift: float = Field(..., description="Marginal CTI lift contribution")
    roas_multiplier: float = Field(..., description="Associated Day-7 ROAS multiplier")
    tier: str = Field(..., description="Funnel category tier")


class PreTestVideoAuditRequest(BaseModel):
    """Request to audit and score an unreleased creative video trailer."""
    asset_id: Optional[str] = Field(default="asset-fc27-pretest-001", description="Asset ID if registered")
    video_asset_id: Optional[str] = Field(default=None, description="Alias for asset_id")
    asset_title: str = Field(
        default="EA SPORTS FC 27 - Official Gameplay Trailer (15s Pre-Test)",
        description="Creative video title",
    )
    video_title: Optional[str] = Field(
        default=None,
        description="Alias for asset_title",
    )
    video_name: Optional[str] = Field(
        default=None,
        description="Alias for asset_title",
    )
    franchise: str = Field(
        default="EA Sports FC",
        description="Franchise (e.g. EA Sports FC, Apex Legends, Battlefield 6)",
    )
    target_surface: Optional[str] = Field(
        default="IN_GAME_STORE",
        description="Target surface",
    )
    video_duration_seconds: float = Field(
        default=15.0,
        gt=0.0,
        le=300.0,
        description="Video duration in seconds",
    )
    duration_seconds: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Alias for video_duration_seconds",
    )
    duration_sec: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Alias for video_duration_seconds",
    )
    features: Optional[List[ShapleyFeatureElement]] = Field(
        default=None,
        description="Custom feature list (if omitted, extracted automatically via benchmark models)",
    )
    custom_features: Optional[List[str]] = Field(
        default=None,
        description="Custom feature tags",
    )
    target_audience: Optional[str] = Field(
        default="GEN_Z_CORE",
        description="Target audience segment",
    )
    comparison_pair: Optional[str] = Field(
        default=None,
        description="Named trade-off comparison pair (e.g. Bellingham Walkout vs Trick Shots)",
    )
    video_url: Optional[str] = Field(
        default=None,
        description="Optional video asset storage URL",
    )

    @model_validator(mode="before")
    @classmethod
    def reconcile_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "video_asset_id" in values and values["video_asset_id"] is not None and "asset_id" not in values:
                values["asset_id"] = values["video_asset_id"]
            if "asset_id" in values and "video_asset_id" not in values:
                values["video_asset_id"] = values["asset_id"]
            if "video_name" in values and values["video_name"] is not None and "asset_title" not in values:
                values["asset_title"] = values["video_name"]
            if "video_title" in values and values["video_title"] is not None and "asset_title" not in values:
                values["asset_title"] = values["video_title"]
            if "duration_seconds" in values and values["duration_seconds"] is not None and "video_duration_seconds" not in values:
                values["video_duration_seconds"] = values["duration_seconds"]
            if "duration_sec" in values and values["duration_sec"] is not None and "video_duration_seconds" not in values:
                values["video_duration_seconds"] = values["duration_sec"]
            if "video_duration_seconds" in values and "duration_seconds" not in values:
                values["duration_seconds"] = values["video_duration_seconds"]
        return values


class PreTestVideoAuditResponse(BaseModel):
    """Complete 2D Shapley audit response for pre-test video simulation."""
    audit_id: str = Field(
        default_factory=lambda: f"audit-{int(time.time())}",
        description="Unique video audit identifier",
    )
    asset_id: str = Field(..., description="Evaluated asset identifier")
    video_asset_id: Optional[str] = Field(None, description="Alias for asset_id")
    asset_title: str = Field(..., description="Video asset title")
    video_name: Optional[str] = Field(None, description="Alias for asset_title")
    franchise: str = Field(..., description="Evaluated franchise")
    video_duration_seconds: float = Field(..., description="Video duration in seconds")
    duration_sec: Optional[float] = Field(None, description="Alias for video duration in seconds")
    duration_seconds: Optional[float] = Field(None, description="Alias for video duration in seconds")
    funnel_balance_index: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Funnel Balance Index (FBI) score between 0.0 and 1.0",
    )
    top_of_funnel_score: float = Field(
        ...,
        description="Aggregated Top-of-Funnel stopping power score",
    )
    top_of_funnel_aggregate_ctr_lift: Optional[float] = Field(
        default=None,
        description="Aggregated Top-of-Funnel CTR lift",
    )
    ctr_lift_aggregate_pct: Optional[float] = Field(
        default=None,
        description="Alias for aggregated Top-of-Funnel CTR lift",
    )
    lower_funnel_score: float = Field(
        ...,
        description="Aggregated Lower-Funnel monetization conversion score",
    )
    lower_funnel_aggregate_cti_lift: Optional[float] = Field(
        default=None,
        description="Aggregated Lower-Funnel CTI lift",
    )
    cti_lift_aggregate_pct: Optional[float] = Field(
        default=None,
        description="Alias for aggregated Lower-Funnel CTI lift",
    )
    predicted_d7_roas: Optional[float] = Field(
        default=None,
        description="Predicted Day-7 ROAS",
    )
    features: List[ShapleyFeatureElement] = Field(
        ...,
        description="List of detected 2D Shapley features",
    )
    waterfall_breakdown: List[WaterfallStep] = Field(
        ...,
        description="Waterfall sequence coordinates for chart rendering",
    )
    comparison_pair: Optional[str] = Field(
        None,
        description="Primary trade-off comparison pair evaluated",
    )
    prescriptive_action: str = Field(
        ...,
        description="Prescriptive creative sequencing action recommendation",
    )
    prescriptive_recommendations: Optional[List[str]] = Field(
        default=None,
        description="List of prescriptive recommendations",
    )
    recommended_edit: str = Field(
        ...,
        description="Tactical video editing directive for creative team",
    )
    audit_verdict: str = Field(
        default="BALANCED_HIGH_POTENTIAL",
        description="Audit verdict classification: BALANCED_HIGH_POTENTIAL | NEEDS_LOWER_FUNNEL_MONETIZATION | NEEDS_TOP_OF_FUNNEL_STOPPING_POWER",
    )
    verdict: Optional[str] = Field(
        default=None,
        description="Alias for audit_verdict",
    )
    audit_timestamp: str = Field(
        default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        description="ISO 8601 UTC timestamp of audit",
    )
    status: str = Field(default="SUCCESS", description="Audit execution status")

    @model_validator(mode="before")
    @classmethod
    def populate_composite_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "video_duration_seconds" in values and "duration_sec" not in values:
                values["duration_sec"] = values["video_duration_seconds"]
            if "video_duration_seconds" in values and "duration_seconds" not in values:
                values["duration_seconds"] = values["video_duration_seconds"]
            if "top_of_funnel_score" in values and "top_of_funnel_aggregate_ctr_lift" not in values:
                values["top_of_funnel_aggregate_ctr_lift"] = values["top_of_funnel_score"]
            if "top_of_funnel_score" in values and "ctr_lift_aggregate_pct" not in values:
                values["ctr_lift_aggregate_pct"] = values["top_of_funnel_score"]
            if "lower_funnel_score" in values and "lower_funnel_aggregate_cti_lift" not in values:
                values["lower_funnel_aggregate_cti_lift"] = values["lower_funnel_score"]
            if "lower_funnel_score" in values and "cti_lift_aggregate_pct" not in values:
                values["cti_lift_aggregate_pct"] = values["lower_funnel_score"]
            if "audit_verdict" in values and "verdict" not in values:
                values["verdict"] = values["audit_verdict"]
            if "asset_id" in values and "video_asset_id" not in values:
                values["video_asset_id"] = values["asset_id"]
            if "asset_title" in values and "video_name" not in values:
                values["video_name"] = values["asset_title"]
            if "prescriptive_action" in values and "prescriptive_recommendations" not in values:
                values["prescriptive_recommendations"] = [values["prescriptive_action"]]
                if "recommended_edit" in values and values["recommended_edit"]:
                    values["prescriptive_recommendations"].append(values["recommended_edit"])
        return values
