"""Pydantic schemas and types for the ADK Multi-Agent Fleet."""

from enum import Enum
from typing import List, Dict, Optional, Any, Union
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


class FranchiseEnum(str, Enum):
    """EA Game Franchises."""
    APEX_LEGENDS = "Apex Legends"
    EA_SPORTS_FC = "EA Sports FC"
    BATTLEFIELD = "Battlefield"
    THE_SIMS = "The Sims"


class GamerArchetypeEnum(str, Enum):
    """DeepSona synthetic gamer persona archetypes."""
    COMPETITIVE_GRINDER = "COMPETITIVE_GRINDER"
    LORE_SEEKER = "LORE_SEEKER"
    CASUAL_SOCIALIZER = "CASUAL_SOCIALIZER"
    ULTIMATE_TEAM_WHALE = "ULTIMATE_TEAM_WHALE"


class FSMBuyerStateEnum(str, Enum):
    """Finite State Machine states for buyer purchase decision."""
    AWARE = "AWARE"
    EVALUATING = "EVALUATING"
    PURCHASED = "PURCHASED"
    ABANDONED = "ABANDONED"
    ENGAGED_FREE = "ENGAGED_FREE"
    BOYCOTT = "BOYCOTT"


class QuadrantEnum(str, Enum):
    """Tactical 9-Grid Attribution Matrix Quadrants."""
    GOLD_MINES = "GOLD_MINES"
    CORE_DRIVERS = "CORE_DRIVERS"
    SATURATED_STARS = "SATURATED_STARS"
    UNTAPPED = "UNTAPPED"
    WORKHORSES = "WORKHORSES"
    EFFICIENCY_RISKS = "EFFICIENCY_RISKS"
    NOISE = "NOISE"
    UNDERPERFORMERS = "UNDERPERFORMERS"
    MONEY_PITS = "MONEY_PITS"


class DetectedMechanic(BaseModel):
    """Game mechanic detected in multimodal asset."""
    mechanic_name: str = Field(..., description="Name of mechanic (e.g. 'Squad Breach', 'FUT Pack Opening')")
    funnel_stage: FunnelStageEnum = Field(..., description="Funnel classification")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Detection confidence")
    timestamp_start_sec: float = Field(default=0.0, ge=0.0)
    timestamp_end_sec: float = Field(default=0.0, ge=0.0)
    surface_suitability: List[SurfaceEnum] = Field(default_factory=list)
    description: Optional[str] = None


class Storybeat(BaseModel):
    """Narrative storybeat in video sequence."""
    beat_number: int = Field(..., ge=1)
    timestamp_sec: float = Field(..., ge=0.0)
    hook_type: str = Field(..., description="E.g. Action Hook, Lore Hook, Social Hook")
    visual_description: str
    pacing_intensity: float = Field(default=0.5, ge=0.0, le=1.0)


class CreativeMetadataSchema(BaseModel):
    """Enforced Pydantic schema for structured output from Gemini multimodal tagging."""
    title: str = Field(..., description="Descriptive title of creative asset")
    funnel_stage: FunnelStageEnum = Field(..., description="Primary marketing funnel stage")
    primary_visual_hooks: List[str] = Field(default_factory=list)
    audio_cues: List[str] = Field(default_factory=list)
    detected_mechanics: List[DetectedMechanic] = Field(default_factory=list)
    target_surfaces: List[SurfaceEnum] = Field(default_factory=list)
    storybeats: List[Storybeat] = Field(default_factory=list)
    dominant_colors: List[str] = Field(default_factory=list)
    call_to_action: Optional[str] = None
    sentiment_score: float = Field(default=0.5, ge=-1.0, le=1.0)


class BuyerAction(BaseModel):
    """Pydantic validated buyer decision output from BARE Refine Pass."""
    persona_id: str
    archetype: GamerArchetypeEnum
    final_fsm_state: FSMBuyerStateEnum = Field(..., description="Final state in Buyer FSM")
    willingness_to_pay_usd: float = Field(default=0.0, ge=0.0)
    churn_risk_score: float = Field(..., ge=0.0, le=1.0, description="0.0 = completely loyal, 1.0 = immediate churn")
    sentiment_score: float = Field(..., ge=-1.0, le=1.0)
    authenticity_rating: float = Field(..., ge=0.0, le=1.0, description="How authentic the ad feels to player")
    primary_friction_factor: str = Field(..., description="Core resistance point (e.g. price, predatory monetization, sweatiness)")
    verbatim_quote: str = Field(..., description="Raw memorable persona reaction quote")
    action_confidence: float = Field(default=0.90, ge=0.0, le=1.0)


class PersonaSimulationResult(BaseModel):
    """Complete BARE two-pass persona simulation outcome."""
    simulation_id: str
    campaign_id: str
    franchise: FranchiseEnum
    creative_title: str
    archetype: GamerArchetypeEnum
    persona_name: str
    demographic_profile: str
    pass1_raw_monologue: str = Field(..., description="High-entropy raw friction monologue (Pass 1)")
    pass2_buyer_action: BuyerAction = Field(..., description="Validated Pydantic action (Pass 2)")
    created_at: str


class Tactical9GridPoint(BaseModel):
    """Coordinate for Tactical 9-Grid Attribution Matrix."""
    feature_name: str
    feature_type: str
    frequency_x: float
    roas_impact_y: float
    quadrant: QuadrantEnum
    strategic_action: str
    confidence: float = 0.92
    sample_campaigns_count: int = 12
    franchise: str = "Apex Legends"


class RecommendationAction(BaseModel):
    """Recommendation item generated by Analytics Agent."""
    action_type: str = Field(..., description="'CREATIVE_REVISION', 'BUDGET_REALLOCATION', 'CHANNEL_TEST'")
    feature_name: str
    quadrant: QuadrantEnum
    priority: str = Field(..., description="'P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM'")
    recommendation_text: str
    expected_roas_delta: float


class A2AMessage(BaseModel):
    """A2A inter-agent structured message envelope."""
    message_id: str
    correlation_id: str
    sender: str
    recipient: str
    timestamp: str
    intent: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    status: str = "SENT"


class A2UIComponent(BaseModel):
    """A2UI dynamic web component structure."""
    component_type: str
    component_id: str
    title: str
    description: Optional[str] = None
    data: Any = Field(default_factory=dict)
    props: Dict[str, Any] = Field(default_factory=dict)


class A2UIStreamEvent(BaseModel):
    """SSE stream event for A2UI client."""
    event_type: str
    agent_name: str
    session_id: str
    timestamp: str
    content: Optional[str] = None
    component: Optional[A2UIComponent] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
