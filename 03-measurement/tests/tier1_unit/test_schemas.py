"""Tier 1 Unit Tests: Schema Validation & Domain Invariants.

Tests Pydantic CreativeMetadataSchema, DetectedMechanic, SurfaceEnum (6 surfaces),
FunnelStageEnum (3 funnels), FranchiseEnum, and bounds validation.
"""

import pytest
from pydantic import ValidationError

from app.schemas.creative import (
    SurfaceEnum,
    FunnelStageEnum,
    MediaTypeEnum,
    FranchiseEnum,
    DetectedMechanic,
    Storybeat,
    CreativeMetadataSchema,
    CreativeAsset,
)
from app.schemas.meridian import (
    CausalLiftExperiment,
    PriorCalibrationRequest,
    ChannelPrior,
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
)
from app.schemas.attribution import (
    QuadrantEnum,
    Tactical9GridPoint,
    SHAPFeatureContribution,
)
from app.schemas.protocols import (
    A2AMessage,
    A2UIComponent,
    A2UIStreamEvent,
)


class TestSurfaceEnum:
    """Validate EA 6 Core Marketing Surfaces."""

    def test_all_six_surfaces_present(self):
        """Verify exactly the 6 required EA core marketing surfaces are defined."""
        expected_surfaces = {
            "EA_APP_LAUNCHER",
            "IN_GAME_STORE",
            "STADIUM_BOARDS",
            "PAUSE_SCREENS",
            "MOBILE_COMPANION",
            "STREAMING_OVERLAYS",
        }
        actual_surfaces = {s.value for s in SurfaceEnum}
        assert actual_surfaces == expected_surfaces
        assert len(SurfaceEnum) == 6

    @pytest.mark.parametrize(
        "surface_val",
        [
            "EA_APP_LAUNCHER",
            "IN_GAME_STORE",
            "STADIUM_BOARDS",
            "PAUSE_SCREENS",
            "MOBILE_COMPANION",
            "STREAMING_OVERLAYS",
        ],
    )
    def test_surface_enum_instantiation(self, surface_val):
        """Verify instantiation of each surface enum member."""
        enum_member = SurfaceEnum(surface_val)
        assert enum_member.value == surface_val

    def test_invalid_surface_raises_error(self):
        """Verify unknown surface values raise ValueError."""
        with pytest.raises(ValueError):
            SurfaceEnum("INVALID_BILLBOARD")


class TestFunnelStageEnum:
    """Validate 3 Marketing Funnel Stages."""

    def test_all_three_funnels_present(self):
        """Verify exactly the 3 required marketing funnel stages are defined."""
        expected_funnels = {
            "ToFu_Exploration",
            "MoFu_Progression",
            "BoFu_Conversion",
        }
        actual_funnels = {f.value for f in FunnelStageEnum}
        assert actual_funnels == expected_funnels
        assert len(FunnelStageEnum) == 3

    @pytest.mark.parametrize(
        "funnel_val",
        [
            "ToFu_Exploration",
            "MoFu_Progression",
            "BoFu_Conversion",
        ],
    )
    def test_funnel_enum_instantiation(self, funnel_val):
        """Verify instantiation of each funnel stage enum member."""
        enum_member = FunnelStageEnum(funnel_val)
        assert enum_member.value == funnel_val

    def test_invalid_funnel_raises_error(self):
        """Verify unknown funnel values raise ValueError."""
        with pytest.raises(ValueError):
            FunnelStageEnum("Bottom_Of_Funnel")


class TestDetectedMechanicSchema:
    """Validate DetectedMechanic schema and numerical bounds."""

    def test_valid_detected_mechanic(self):
        """Verify happy-path mechanic creation with surface suitability."""
        mech = DetectedMechanic(
            mechanic_name="Squad Breach",
            funnel_stage=FunnelStageEnum.ToFu_Exploration,
            confidence_score=0.95,
            timestamp_start_sec=1.5,
            timestamp_end_sec=4.5,
            surface_suitability=[SurfaceEnum.EA_APP_LAUNCHER, SurfaceEnum.STREAMING_OVERLAYS],
            description="High intensity squad breach",
        )
        assert mech.mechanic_name == "Squad Breach"
        assert mech.confidence_score == 0.95
        assert mech.timestamp_end_sec == 4.5
        assert len(mech.surface_suitability) == 2

    def test_confidence_score_bounds(self):
        """Verify confidence_score strictly bounded in [0.0, 1.0]."""
        # Valid boundary 0.0
        m_low = DetectedMechanic(
            mechanic_name="Test",
            funnel_stage=FunnelStageEnum.ToFu_Exploration,
            confidence_score=0.0,
        )
        assert m_low.confidence_score == 0.0

        # Valid boundary 1.0
        m_high = DetectedMechanic(
            mechanic_name="Test",
            funnel_stage=FunnelStageEnum.ToFu_Exploration,
            confidence_score=1.0,
        )
        assert m_high.confidence_score == 1.0

        # Invalid > 1.0
        with pytest.raises(ValidationError):
            DetectedMechanic(
                mechanic_name="Test",
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
                confidence_score=1.05,
            )

        # Invalid < 0.0
        with pytest.raises(ValidationError):
            DetectedMechanic(
                mechanic_name="Test",
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
                confidence_score=-0.1,
            )

    def test_negative_timestamps_raise_error(self):
        """Verify negative timestamps raise ValidationError."""
        with pytest.raises(ValidationError):
            DetectedMechanic(
                mechanic_name="Test",
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
                confidence_score=0.8,
                timestamp_start_sec=-1.0,
            )


class TestCreativeMetadataSchema:
    """Validate CreativeMetadataSchema Pydantic enforcement."""

    def test_valid_creative_metadata(self, sample_creative_metadata):
        """Verify full metadata validation, JSON serialization and dictionary conversion."""
        assert sample_creative_metadata.title.startswith("Apex Legends")
        assert sample_creative_metadata.funnel_stage == FunnelStageEnum.ToFu_Exploration
        assert len(sample_creative_metadata.target_surfaces) == 6
        assert len(sample_creative_metadata.detected_mechanics) == 4

        # Roundtrip JSON serialization
        json_data = sample_creative_metadata.model_dump_json()
        restored = CreativeMetadataSchema.model_validate_json(json_data)
        assert restored.title == sample_creative_metadata.title
        assert len(restored.detected_mechanics) == len(sample_creative_metadata.detected_mechanics)

    def test_sentiment_score_bounds(self):
        """Verify sentiment_score bounded in [-1.0, 1.0]."""
        # Valid -1.0
        meta_neg = CreativeMetadataSchema(
            title="Test",
            funnel_stage=FunnelStageEnum.ToFu_Exploration,
            sentiment_score=-1.0,
        )
        assert meta_neg.sentiment_score == -1.0

        # Valid 1.0
        meta_pos = CreativeMetadataSchema(
            title="Test",
            funnel_stage=FunnelStageEnum.ToFu_Exploration,
            sentiment_score=1.0,
        )
        assert meta_pos.sentiment_score == 1.0

        # Invalid > 1.0
        with pytest.raises(ValidationError):
            CreativeMetadataSchema(
                title="Test",
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
                sentiment_score=1.5,
            )

        # Invalid < -1.0
        with pytest.raises(ValidationError):
            CreativeMetadataSchema(
                title="Test",
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
                sentiment_score=-1.5,
            )

    def test_missing_required_fields_raises_validation_error(self):
        """Verify omitting title or funnel_stage raises ValidationError."""
        with pytest.raises(ValidationError):
            CreativeMetadataSchema(
                # title omitted
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
            )

        with pytest.raises(ValidationError):
            CreativeMetadataSchema(
                title="Test Title",
                # funnel_stage omitted
            )


class TestMeridianAndAttributionSchemas:
    """Validate Meridian MMM and 9-Grid Attribution schemas."""

    def test_causal_lift_experiment_constraints(self):
        """Verify CausalLiftExperiment bounds and positive spend."""
        exp = CausalLiftExperiment(
            experiment_id="exp-01",
            channel="YouTube",
            spend=50000.0,
            incremental_revenue=125000.0,
            observed_roas=2.5,
            standard_error=0.15,
            confidence_interval_lower=2.2,
            confidence_interval_upper=2.8,
        )
        assert exp.spend == 50000.0
        assert exp.observed_roas == 2.5

        # Invalid spend <= 0
        with pytest.raises(ValidationError):
            CausalLiftExperiment(
                experiment_id="exp-01",
                channel="YouTube",
                spend=0.0,
                incremental_revenue=0.0,
                observed_roas=0.0,
                standard_error=0.1,
                confidence_interval_lower=0.0,
                confidence_interval_upper=0.0,
            )

    def test_tactical_9grid_point_and_quadrant_enum(self):
        """Verify Tactical9GridPoint structure and 9 exact quadrants."""
        all_quadrants = {
            "GOLD_MINES",
            "CORE_DRIVERS",
            "SATURATED_STARS",
            "UNTAPPED",
            "WORKHORSES",
            "EFFICIENCY_RISKS",
            "NOISE",
            "UNDERPERFORMERS",
            "MONEY_PITS",
        }
        assert {q.value for q in QuadrantEnum} == all_quadrants
        assert len(QuadrantEnum) == 9

        point = Tactical9GridPoint(
            feature_name="Loot Box Opening",
            feature_type="game_mechanic",
            frequency_x=12.5,
            roas_impact_y=1.85,
            quadrant=QuadrantEnum.GOLD_MINES,
            strategic_action="Scale Up",
            confidence=0.95,
        )
        assert point.quadrant == QuadrantEnum.GOLD_MINES
        assert point.frequency_x == 12.5
        assert point.roas_impact_y == 1.85
