"""Unit tests for agent Pydantic schemas and enums."""

import pytest
from agents.app.schemas import (
    SurfaceEnum,
    FunnelStageEnum,
    FranchiseEnum,
    QuadrantEnum,
    DetectedMechanic,
    Storybeat,
    CreativeMetadataSchema,
    Tactical9GridPoint,
    A2AMessage,
    A2UIComponent,
)


def test_surface_enum():
    """Verify all 6 EA core surfaces exist."""
    assert len(SurfaceEnum) == 6
    assert SurfaceEnum.EA_APP_LAUNCHER.value == "EA_APP_LAUNCHER"
    assert SurfaceEnum.IN_GAME_STORE.value == "IN_GAME_STORE"
    assert SurfaceEnum.STADIUM_BOARDS.value == "STADIUM_BOARDS"
    assert SurfaceEnum.PAUSE_SCREENS.value == "PAUSE_SCREENS"
    assert SurfaceEnum.MOBILE_COMPANION.value == "MOBILE_COMPANION"
    assert SurfaceEnum.STREAMING_OVERLAYS.value == "STREAMING_OVERLAYS"


def test_funnel_stages():
    """Verify 3 marketing funnel stages."""
    assert len(FunnelStageEnum) == 3
    assert FunnelStageEnum.ToFu_Exploration.value == "ToFu_Exploration"
    assert FunnelStageEnum.MoFu_Progression.value == "MoFu_Progression"
    assert FunnelStageEnum.BoFu_Conversion.value == "BoFu_Conversion"


def test_franchise_enum():
    """Verify EA franchise enum."""
    assert FranchiseEnum.APEX_LEGENDS.value == "Apex Legends"
    assert FranchiseEnum.EA_SPORTS_FC.value == "EA Sports FC"
    assert FranchiseEnum.BATTLEFIELD.value == "Battlefield"
    assert FranchiseEnum.THE_SIMS.value == "The Sims"


def test_tactical_9grid_quadrants():
    """Verify all 9 quadrants in Tactical Matrix."""
    assert len(QuadrantEnum) == 9
    assert QuadrantEnum.GOLD_MINES.value == "GOLD_MINES"
    assert QuadrantEnum.CORE_DRIVERS.value == "CORE_DRIVERS"
    assert QuadrantEnum.MONEY_PITS.value == "MONEY_PITS"


def test_creative_metadata_schema_validation():
    """Verify strict validation of CreativeMetadataSchema."""
    schema = CreativeMetadataSchema(
        title="Apex S22 Squad Breach",
        funnel_stage=FunnelStageEnum.MoFu_Progression,
        primary_visual_hooks=["Wraith Portal", "Kraber Headshot"],
        audio_cues=["Electronic drop", "Shield crack"],
        detected_mechanics=[
            DetectedMechanic(
                mechanic_name="Squad Breach & Clear",
                funnel_stage=FunnelStageEnum.MoFu_Progression,
                confidence_score=0.95,
                surface_suitability=[SurfaceEnum.EA_APP_LAUNCHER, SurfaceEnum.STREAMING_OVERLAYS],
            )
        ],
        target_surfaces=[SurfaceEnum.EA_APP_LAUNCHER, SurfaceEnum.IN_GAME_STORE],
        storybeats=[
            Storybeat(beat_number=1, timestamp_sec=0.0, hook_type="Combat Hook", visual_description="Squad breach"),
        ],
        dominant_colors=["#FF0000", "#000000"],
        call_to_action="Play Free Now",
        sentiment_score=0.85,
    )
    assert schema.title == "Apex S22 Squad Breach"
    assert len(schema.detected_mechanics) == 1
    assert schema.detected_mechanics[0].confidence_score == 0.95
