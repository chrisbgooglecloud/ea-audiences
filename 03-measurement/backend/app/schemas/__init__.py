"""Backend Pydantic Schemas Package."""

from app.schemas.creative import (
    SurfaceEnum,
    FunnelStageEnum,
    MediaTypeEnum,
    FranchiseEnum,
    DetectedMechanic,
    Storybeat,
    CreativeMetadataSchema,
    CreativeAsset,
    UploadAssetResponse,
    TagAssetRequest,
    AssetListResponse,
)
from app.schemas.geospine import (
    DMAMetadata,
    WeatherShock,
    TrendSignal,
    CombinatorialFeatureRecord,
    GeoSpineListResponse,
    WeatherShockResponse,
    CombinatorialFeatureResponse,
)
from app.schemas.meridian import (
    CausalLiftExperiment,
    PriorCalibrationRequest,
    ChannelPrior,
    PriorCalibrationResponse,
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
    SCurvePoint,
    ChannelOptimizationResult,
    EquimarginalOptimizationResponse,
)
from app.schemas.attribution import (
    QuadrantEnum,
    Tactical9GridPoint,
    SHAPFeatureContribution,
    TacticalGridResponse,
    AttributionExplainRequest,
    RecommendationAction,
    AttributionExplainResponse,
)
from app.schemas.protocols import (
    A2AMessage,
    A2UIComponent,
    A2UIStreamEvent,
)
from app.schemas.intake import (
    CohortTargetEnum,
    ChannelAllocationInput,
    CampaignBriefSubmission,
    ConflictFatigueAnalysis,
    CampaignKPIProjection,
    CampaignPredictionResponse,
)
from app.schemas.shapley import (
    FunnelCategoryEnum,
    ShapleyFeatureElement,
    WaterfallStep,
    PreTestVideoAuditRequest,
    PreTestVideoAuditResponse,
)

__all__ = [
    # Creative
    "SurfaceEnum",
    "FunnelStageEnum",
    "MediaTypeEnum",
    "FranchiseEnum",
    "DetectedMechanic",
    "Storybeat",
    "CreativeMetadataSchema",
    "CreativeAsset",
    "UploadAssetResponse",
    "TagAssetRequest",
    "AssetListResponse",
    # GeoSpine
    "DMAMetadata",
    "WeatherShock",
    "TrendSignal",
    "CombinatorialFeatureRecord",
    "GeoSpineListResponse",
    "WeatherShockResponse",
    "CombinatorialFeatureResponse",
    # Meridian MMM & Pacing
    "CausalLiftExperiment",
    "PriorCalibrationRequest",
    "ChannelPrior",
    "PriorCalibrationResponse",
    "ChannelSpendConstraint",
    "EquimarginalOptimizationRequest",
    "SCurvePoint",
    "ChannelOptimizationResult",
    "EquimarginalOptimizationResponse",
    # Attribution
    "QuadrantEnum",
    "Tactical9GridPoint",
    "SHAPFeatureContribution",
    "TacticalGridResponse",
    "AttributionExplainRequest",
    "RecommendationAction",
    "AttributionExplainResponse",
    # Protocols
    "A2AMessage",
    "A2UIComponent",
    "A2UIStreamEvent",
    # Campaign Intake & Fatigue
    "CohortTargetEnum",
    "ChannelAllocationInput",
    "CampaignBriefSubmission",
    "ConflictFatigueAnalysis",
    "CampaignKPIProjection",
    "CampaignPredictionResponse",
    # 2D Shapley Intelligence
    "FunnelCategoryEnum",
    "ShapleyFeatureElement",
    "WaterfallStep",
    "PreTestVideoAuditRequest",
    "PreTestVideoAuditResponse",
]
