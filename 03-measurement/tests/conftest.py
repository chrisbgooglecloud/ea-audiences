"""Shared Pytest Fixtures, Mock Environments, and Sample Payloads for E2E Test Suite.

Provides comprehensive mock environments and rich fixtures for 4-tier validation:
- Tier 1: Schemas, Pacing Engine, Attribution Grid, Protobuf Serialization
- Tier 2: FastAPI Endpoints, A2A Protocols, A2UI Dynamic Streaming
- Tier 3: Cloud Connectors (Firestore Native nam5, BigQuery ea_measurement, GCS, Vertex AI)
- Tier 4: Full Executive Lifecycle Simulation and Performance Benchmarking
"""

import os
import sys
import io
import time
import uuid
import pytest
from typing import Dict, List, Any
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient

# Ensure root and backend directories are on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app
from app.config import settings
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
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
)
from app.schemas.attribution import (
    QuadrantEnum,
    Tactical9GridPoint,
    AttributionExplainRequest,
    RecommendationAction,
)
from app.schemas.protocols import (
    A2AMessage,
    A2UIComponent,
    A2UIStreamEvent,
)


@pytest.fixture(scope="session")
def client() -> TestClient:
    """FastAPI TestClient session fixture."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_detected_mechanics() -> List[DetectedMechanic]:
    """Sample list of detected game mechanics across funnel stages and surfaces."""
    return [
        DetectedMechanic(
            mechanic_name="Squad Breach",
            funnel_stage=FunnelStageEnum.ToFu_Exploration,
            confidence_score=0.96,
            timestamp_start_sec=0.0,
            timestamp_end_sec=3.2,
            surface_suitability=[SurfaceEnum.EA_APP_LAUNCHER, SurfaceEnum.STREAMING_OVERLAYS],
            description="Dynamic squad tactical breach with thermite breach charges.",
        ),
        DetectedMechanic(
            mechanic_name="FUT Pack Opening Animation",
            funnel_stage=FunnelStageEnum.MoFu_Progression,
            confidence_score=0.91,
            timestamp_start_sec=3.5,
            timestamp_end_sec=7.8,
            surface_suitability=[SurfaceEnum.IN_GAME_STORE, SurfaceEnum.MOBILE_COMPANION],
            description="Walkout animation revealing Team of the Season player card.",
        ),
        DetectedMechanic(
            mechanic_name="Battle Pass Tier 100 Unlock",
            funnel_stage=FunnelStageEnum.BoFu_Conversion,
            confidence_score=0.94,
            timestamp_start_sec=8.0,
            timestamp_end_sec=12.0,
            surface_suitability=[SurfaceEnum.PAUSE_SCREENS, SurfaceEnum.IN_GAME_STORE],
            description="Instant unlock CTA for seasonal reactive weapon skin.",
        ),
        DetectedMechanic(
            mechanic_name="Stadium Goal Celebration",
            funnel_stage=FunnelStageEnum.ToFu_Exploration,
            confidence_score=0.88,
            timestamp_start_sec=12.1,
            timestamp_end_sec=15.0,
            surface_suitability=[SurfaceEnum.STADIUM_BOARDS, SurfaceEnum.EA_APP_LAUNCHER],
            description="Crowd roar and volumetric player knee-slide celebration.",
        ),
    ]


@pytest.fixture
def sample_storybeats() -> List[Storybeat]:
    """Sample narrative storybeats sequence."""
    return [
        Storybeat(
            beat_number=1,
            timestamp_sec=0.0,
            hook_type="Action Hook",
            visual_description="High-octane urban traversal and grappling hook launch.",
            pacing_intensity=0.85,
        ),
        Storybeat(
            beat_number=2,
            timestamp_sec=5.0,
            hook_type="Gameplay Reveal",
            visual_description="First-person weapon reload and ultimate ability charge.",
            pacing_intensity=0.65,
        ),
        Storybeat(
            beat_number=3,
            timestamp_sec=10.0,
            hook_type="Climax / Call to Action",
            visual_description="Cinematic squad victory pose with 'Play Free Now' lockup.",
            pacing_intensity=0.95,
        ),
    ]


@pytest.fixture
def sample_creative_metadata(
    sample_detected_mechanics: List[DetectedMechanic],
    sample_storybeats: List[Storybeat],
) -> CreativeMetadataSchema:
    """Sample valid CreativeMetadataSchema instance."""
    return CreativeMetadataSchema(
        title="Apex Legends Season 22 Relaunch - High Intensity Squad Breach",
        funnel_stage=FunnelStageEnum.ToFu_Exploration,
        primary_visual_hooks=["Volumetric smoke explosion", "Grappling hook vault", "Reactive gold weapon glow"],
        audio_cues=["Electronic synth drop", "Character voice line: 'Squad wiped'", "Heavy bass riser"],
        detected_mechanics=sample_detected_mechanics,
        target_surfaces=[
            SurfaceEnum.EA_APP_LAUNCHER,
            SurfaceEnum.IN_GAME_STORE,
            SurfaceEnum.STADIUM_BOARDS,
            SurfaceEnum.PAUSE_SCREENS,
            SurfaceEnum.MOBILE_COMPANION,
            SurfaceEnum.STREAMING_OVERLAYS,
        ],
        storybeats=sample_storybeats,
        dominant_colors=["#FF4500", "#1E1E2F", "#FFD700"],
        call_to_action="Play Free Now - Season 22 Live",
        sentiment_score=0.78,
    )


@pytest.fixture
def sample_video_file_payload() -> tuple:
    """Mock video file tuple for multipart upload testing."""
    # Synthetic small dummy video bytes with MP4 magic header
    fake_mp4_bytes = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom" + b"\x00" * 1024
    return ("battlefield_squad_breach.mp4", io.BytesIO(fake_mp4_bytes), "video/mp4")


@pytest.fixture
def sample_image_file_payload() -> tuple:
    """Mock image file tuple for multipart upload testing."""
    # 1x1 PNG transparent pixel
    fake_png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
        b"\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    return ("apex_season_banner.png", io.BytesIO(fake_png_bytes), "image/png")


@pytest.fixture
def sample_causal_experiments() -> List[CausalLiftExperiment]:
    """Sample causal lift experiments across EA marketing channels."""
    return [
        CausalLiftExperiment(
            experiment_id="exp-yt-geo-01",
            channel="YouTube",
            spend=75000.0,
            incremental_revenue=187500.0,
            observed_roas=2.50,
            standard_error=0.12,
            confidence_interval_lower=2.26,
            confidence_interval_upper=2.74,
            sample_size_dmas=30,
            test_period_days=21,
        ),
        CausalLiftExperiment(
            experiment_id="exp-yt-geo-02",
            channel="YouTube",
            spend=120000.0,
            incremental_revenue=288000.0,
            observed_roas=2.40,
            standard_error=0.15,
            confidence_interval_lower=2.10,
            confidence_interval_upper=2.70,
            sample_size_dmas=45,
            test_period_days=28,
        ),
        CausalLiftExperiment(
            experiment_id="exp-meta-geo-01",
            channel="Meta",
            spend=90000.0,
            incremental_revenue=243000.0,
            observed_roas=2.70,
            standard_error=0.14,
            confidence_interval_lower=2.42,
            confidence_interval_upper=2.98,
            sample_size_dmas=35,
            test_period_days=21,
        ),
        CausalLiftExperiment(
            experiment_id="exp-tiktok-geo-01",
            channel="TikTok",
            spend=60000.0,
            incremental_revenue=192000.0,
            observed_roas=3.20,
            standard_error=0.18,
            confidence_interval_lower=2.84,
            confidence_interval_upper=3.56,
            sample_size_dmas=25,
            test_period_days=14,
        ),
        CausalLiftExperiment(
            experiment_id="exp-p3d-geo-01",
            channel="Programmatic 3D",
            spend=40000.0,
            incremental_revenue=76000.0,
            observed_roas=1.90,
            standard_error=0.20,
            confidence_interval_lower=1.50,
            confidence_interval_upper=2.30,
            sample_size_dmas=20,
            test_period_days=14,
        ),
    ]


@pytest.fixture
def sample_pacing_request() -> EquimarginalOptimizationRequest:
    """Sample budget optimization request across 4 core EA acquisition channels."""
    return EquimarginalOptimizationRequest(
        campaign_id="camp-apex-s22-e2e",
        franchise="Apex Legends",
        total_budget=350000.0,
        channels=[
            ChannelSpendConstraint(
                channel="YouTube",
                current_spend=100000.0,
                min_spend=70000.0,
                max_spend=150000.0,
                base_roas=2.6,
                half_saturation_s=60000.0,
                hill_slope_k=1.35,
            ),
            ChannelSpendConstraint(
                channel="Meta",
                current_spend=110000.0,
                min_spend=80000.0,
                max_spend=160000.0,
                base_roas=2.8,
                half_saturation_s=65000.0,
                hill_slope_k=1.40,
            ),
            ChannelSpendConstraint(
                channel="TikTok",
                current_spend=85000.0,
                min_spend=50000.0,
                max_spend=130000.0,
                base_roas=3.4,
                half_saturation_s=45000.0,
                hill_slope_k=1.50,
            ),
            ChannelSpendConstraint(
                channel="Programmatic 3D",
                current_spend=55000.0,
                min_spend=30000.0,
                max_spend=90000.0,
                base_roas=1.8,
                half_saturation_s=35000.0,
                hill_slope_k=1.20,
            ),
        ],
        max_daily_shift_pct=0.20,
        enforce_zero_sum=True,
        target_d7_roas=2.45,
        target_cpi=25.0,
    )


@pytest.fixture
def sample_9grid_features() -> List[Dict[str, Any]]:
    """Sample features mapping to each of the 9 Tactical Matrix quadrants."""
    return [
        {"feature_name": "Loot Box Walkout Animation", "frequency_x": 15.0, "roas_impact_y": 1.65, "feature_type": "game_mechanic"},      # GOLD_MINES
        {"feature_name": "Squad Tactical Ping System", "frequency_x": 45.0, "roas_impact_y": 1.50, "feature_type": "game_mechanic"},      # CORE_DRIVERS
        {"feature_name": "Grappling Hook Highlight", "frequency_x": 80.0, "roas_impact_y": 1.40, "feature_type": "visual_hook"},         # SATURATED_STARS
        {"feature_name": "Volumetric Weather Transition", "frequency_x": 18.0, "roas_impact_y": 1.10, "feature_type": "visual_hook"},    # UNTAPPED
        {"feature_name": "Mid-Match Scoreboard Overlay", "frequency_x": 40.0, "roas_impact_y": 1.05, "feature_type": "surface"},          # WORKHORSES
        {"feature_name": "Season Logo Title Card", "frequency_x": 75.0, "roas_impact_y": 0.95, "feature_type": "visual_hook"},           # EFFICIENCY_RISKS
        {"feature_name": "Static Copyright Disclaimer", "frequency_x": 10.0, "roas_impact_y": 0.60, "feature_type": "visual_hook"},       # NOISE
        {"feature_name": "Generic Weapon Inspection", "frequency_x": 50.0, "roas_impact_y": 0.70, "feature_type": "game_mechanic"},       # UNDERPERFORMERS
        {"feature_name": "Generic Stock Victory Screams", "frequency_x": 85.0, "roas_impact_y": 0.55, "feature_type": "audio_cue"},      # MONEY_PITS
    ]


@pytest.fixture
def sample_a2a_message() -> A2AMessage:
    """Sample inter-agent A2A message fixture."""
    return A2AMessage(
        message_id="msg-a2a-test-001",
        correlation_id="corr-apex-rebalance-99",
        sender="MediaBuyingAgent",
        recipient="TaggingAgent",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        intent="REVISE_CREATIVE",
        payload={
            "target_quadrant": "GOLD_MINES",
            "recommended_mechanics": ["Squad Breach", "FUT Pack Opening Animation"],
            "trim_mechanics": ["Generic Stock Victory Screams"],
            "target_surface": "EA_APP_LAUNCHER",
            "budget_allocation_shift_usd": 15000.0,
        },
        status="SENT",
    )


@pytest.fixture
def mock_cloud_environment():
    """Mock environment patcher for GCP Firestore, BigQuery, GCS, and Vertex AI."""
    with patch("google.cloud.firestore.AsyncClient") as mock_firestore, \
         patch("google.cloud.bigquery.Client") as mock_bigquery, \
         patch("google.cloud.storage.Client") as mock_storage, \
         patch("google.genai.Client") as mock_genai:

        mock_fs_inst = MagicMock()
        mock_bq_inst = MagicMock()
        mock_gcs_inst = MagicMock()
        mock_genai_inst = MagicMock()

        mock_firestore.return_value = mock_fs_inst
        mock_bigquery.return_value = mock_bq_inst
        mock_storage.return_value = mock_gcs_inst
        mock_genai.return_value = mock_genai_inst

        yield {
            "firestore": mock_fs_inst,
            "bigquery": mock_bq_inst,
            "storage": mock_gcs_inst,
            "genai": mock_genai_inst,
        }
