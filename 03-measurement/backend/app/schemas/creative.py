"""Creative intelligence schemas for multimodal ingestion, frame tagging, and surfaces."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SurfaceEnum(str, Enum):
    """EA Core 6 Marketing & Engagement Surfaces."""
    EA_APP_LAUNCHER = "EA_APP_LAUNCHER"
    IN_GAME_STORE = "IN_GAME_STORE"
    STADIUM_BOARDS = "STADIUM_BOARDS"
    PAUSE_SCREENS = "PAUSE_SCREENS"
    MOBILE_COMPANION = "MOBILE_COMPANION"
    STREAMING_OVERLAYS = "STREAMING_OVERLAYS"


class FunnelStageEnum(str, Enum):
    """Marketing Funnel Stages."""
    ToFu_Exploration = "ToFu_Exploration"
    MoFu_Progression = "MoFu_Progression"
    BoFu_Conversion = "BoFu_Conversion"


class MediaTypeEnum(str, Enum):
    """Media types for creative assets."""
    VIDEO = "VIDEO"
    IMAGE = "IMAGE"


class FranchiseEnum(str, Enum):
    """EA Game Franchises."""
    APEX_LEGENDS = "Apex Legends"
    EA_SPORTS_FC = "EA Sports FC"
    BATTLEFIELD = "Battlefield"
    THE_SIMS = "The Sims"


class DetectedMechanic(BaseModel):
    """Detailed game mechanic or gameplay feature detected in creative media."""
    mechanic_name: str = Field(
        ..., description="Name of the mechanic, e.g., 'Squad Breach', 'FUT Pack Opening', 'Building Mode'"
    )
    funnel_stage: FunnelStageEnum = Field(
        ..., description="Funnel stage associated with this mechanic"
    )
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Model confidence score between 0.0 and 1.0"
    )
    timestamp_start_sec: float = Field(
        default=0.0, ge=0.0, description="Start timestamp in seconds"
    )
    timestamp_end_sec: float = Field(
        default=0.0, ge=0.0, description="End timestamp in seconds"
    )
    surface_suitability: List[SurfaceEnum] = Field(
        default_factory=list, description="Surfaces best suited for this mechanic"
    )
    description: Optional[str] = Field(
        default=None, description="Detailed explanation of how this mechanic manifests visually"
    )


class Storybeat(BaseModel):
    """Narrative storybeat in creative video sequence."""
    beat_number: int = Field(..., ge=1)
    timestamp_sec: float = Field(..., ge=0.0)
    hook_type: str = Field(..., description="E.g., Action Hook, Emotional Hook, Gameplay Reveal")
    visual_description: str
    pacing_intensity: float = Field(default=0.5, ge=0.0, le=1.0)


class CreativeMetadataSchema(BaseModel):
    """Enforced Pydantic schema for structured output from Gemini multimodal tagging."""
    title: str = Field(..., description="Descriptive title of the creative asset")
    funnel_stage: FunnelStageEnum = Field(
        ..., description="Primary funnel classification (ToFu_Exploration, MoFu_Progression, BoFu_Conversion)"
    )
    primary_visual_hooks: List[str] = Field(
        default_factory=list, description="Key visual hooks identified in the opening and climax frames"
    )
    audio_cues: List[str] = Field(
        default_factory=list, description="Audio features, music genre, voiceover pacing, SFX cues"
    )
    detected_mechanics: List[DetectedMechanic] = Field(
        default_factory=list, description="List of fine-grained gameplay mechanics detected"
    )
    target_surfaces: List[SurfaceEnum] = Field(
        default_factory=list, description="Recommended EA surfaces from the 6 core surfaces"
    )
    storybeats: List[Storybeat] = Field(
        default_factory=list, description="Sequential narrative storybeats"
    )
    dominant_colors: List[str] = Field(
        default_factory=list, description="Hex codes or color names dominating the palette"
    )
    call_to_action: Optional[str] = Field(
        default=None, description="Identified Call to Action, e.g., 'Pre-Order Now', 'Play Free'"
    )
    sentiment_score: float = Field(
        default=0.5, ge=-1.0, le=1.0, description="Sentiment valence score"
    )


class CreativeAsset(BaseModel):
    """Complete representation of a creative asset stored in Firestore / returned via API."""
    asset_id: str
    campaign_id: str
    franchise: FranchiseEnum = FranchiseEnum.APEX_LEGENDS
    gcs_uri: str
    media_type: MediaTypeEnum = MediaTypeEnum.VIDEO
    file_name: str
    file_size_bytes: int = 0
    duration_seconds: float = 0.0
    frame_count: int = 0
    metadata_schema: Optional[CreativeMetadataSchema] = None
    created_at: str
    updated_at: str
    status: str = "PROCESSED"  # PENDING, PROCESSING, PROCESSED, FAILED


class UploadAssetResponse(BaseModel):
    """Response returned upon uploading a new creative asset."""
    asset_id: str
    campaign_id: str
    gcs_uri: str
    file_name: str
    media_type: MediaTypeEnum
    status: str
    message: str


class TagAssetRequest(BaseModel):
    """Request to trigger or re-run multimodal tagging on an existing asset."""
    asset_id: str
    franchise: Optional[FranchiseEnum] = None
    focus_surface: Optional[SurfaceEnum] = None
    custom_prompt: Optional[str] = None


class AssetListResponse(BaseModel):
    """List of creative assets with summary metadata."""
    total: int
    franchise_filter: Optional[str] = None
    assets: List[CreativeAsset]
