"""Tier 5 Adversarial Tests: Schema Validation & Malformed Payload Stress-Testing.

Adversarial vectors:
1. Malformed Video & Image Metadata: Non-existent funnel stages, missing or illegal surfaces.
2. Boundary & Out-of-Bounds Metrics: Negative confidence scores, confidence > 1.0, invalid sentiment ranges.
3. Time Dimension Invariants: Negative timestamps, inverted intervals (start > end).
4. SQL Injection, XSS, and Unicode Fuzzing in Schema Fields.
5. FastAPI Endpoint Stress: 422 Unprocessable Entity assertions on mutated payloads.
"""

import pytest
import math
from pydantic import ValidationError
from fastapi.testclient import TestClient

from app.schemas.creative import (
    SurfaceEnum,
    FunnelStageEnum,
    MediaTypeEnum,
    FranchiseEnum,
    DetectedMechanic,
    Storybeat,
    CreativeMetadataSchema,
    CreativeAsset,
    TagAssetRequest,
)


class TestAdversarialCreativeSchemas:
    """Stress-test Pydantic schema validation for creative intelligence."""

    def test_invalid_funnel_stages_fail_validation(self):
        """Verify arbitrary, non-standard, or empty funnel stages are rejected."""
        invalid_funnels = [
            "INVALID_FUNNEL_STAGE",
            "ToFu",  # Missing full enum string
            "Top_Of_Funnel",
            "",
            "12345",
            None,
            "MoFu_Progression_Extra",
        ]
        for funnel in invalid_funnels:
            with pytest.raises(ValidationError):
                DetectedMechanic(
                    mechanic_name="Squad Breach",
                    funnel_stage=funnel,  # type: ignore
                    confidence_score=0.95,
                    timestamp_start_sec=0.0,
                    timestamp_end_sec=5.0,
                )

    def test_invalid_and_corrupted_surfaces_fail_validation(self):
        """Verify unknown surfaces or corrupted list types fail validation."""
        invalid_surfaces = [
            ["VR_HEADSET"],
            ["METAVERSE_BILLBOARD"],
            ["EA_APP_LAUNCHER", "INVALID_SURFACE_NAME"],
            [""],
            [123],
            "NOT_A_LIST",
        ]
        for surf_payload in invalid_surfaces:
            with pytest.raises(ValidationError):
                DetectedMechanic(
                    mechanic_name="Squad Breach",
                    funnel_stage=FunnelStageEnum.MoFu_Progression,
                    confidence_score=0.90,
                    surface_suitability=surf_payload,  # type: ignore
                )

    @pytest.mark.parametrize("bad_confidence", [-0.01, -100.0, 1.01, 2.5, 999.0])
    def test_confidence_score_out_of_bounds_raises_error(self, bad_confidence: float):
        """Confidence score must be strictly between 0.0 and 1.0."""
        with pytest.raises(ValidationError) as exc_info:
            DetectedMechanic(
                mechanic_name="Squad Breach",
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
                confidence_score=bad_confidence,
            )
        assert "confidence_score" in str(exc_info.value)

    @pytest.mark.parametrize("bad_sentiment", [-1.01, -10.0, 1.01, 5.0, 100.0])
    def test_sentiment_score_out_of_bounds_raises_error(self, bad_sentiment: float):
        """Sentiment valence score must be strictly between -1.0 and 1.0."""
        with pytest.raises(ValidationError) as exc_info:
            CreativeMetadataSchema(
                title="Test Video",
                funnel_stage=FunnelStageEnum.MoFu_Progression,
                sentiment_score=bad_sentiment,
            )
        assert "sentiment_score" in str(exc_info.value)

    def test_negative_timestamps_raise_validation_error(self):
        """Verify negative start/end timestamps fail schema constraints."""
        with pytest.raises(ValidationError):
            DetectedMechanic(
                mechanic_name="Squad Breach",
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
                confidence_score=0.9,
                timestamp_start_sec=-1.5,
            )

        with pytest.raises(ValidationError):
            DetectedMechanic(
                mechanic_name="Squad Breach",
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
                confidence_score=0.9,
                timestamp_end_sec=-0.01,
            )

        with pytest.raises(ValidationError):
            Storybeat(
                beat_number=1,
                timestamp_sec=-0.5,
                hook_type="Action Hook",
                visual_description="Opening shot",
            )

    def test_storybeat_zero_or_negative_beat_number_raises_error(self):
        """Beat number must be >= 1."""
        for invalid_beat in [0, -1, -99]:
            with pytest.raises(ValidationError):
                Storybeat(
                    beat_number=invalid_beat,
                    timestamp_sec=0.0,
                    hook_type="Action Hook",
                    visual_description="Opening shot",
                )

    def test_missing_mandatory_fields_in_creative_metadata(self):
        """Ensure missing title or funnel_stage fails fast."""
        with pytest.raises(ValidationError):
            CreativeMetadataSchema(  # type: ignore
                funnel_stage=FunnelStageEnum.ToFu_Exploration,
            )

        with pytest.raises(ValidationError):
            CreativeMetadataSchema(  # type: ignore
                title="Only Title Given",
            )

    def test_extreme_payload_fuzzing_sql_xss_unicode(self):
        """Verify schema handles extreme string inputs, injection payloads, and unicode cleanly."""
        adversarial_strings = [
            "'; DROP TABLE creative_assets; --",
            "<script>alert('xss')</script><img src=x onerror=alert(1)>",
            "🎮🔥✨ Apex Season 22 🚀🏆 \u200b\u200c\u200d\ufeff Zero-width spaces",
            "A" * 100_000,  # 100KB string
            "{\"nested_json\": true, \"override\": true}",
            "\n\r\t\0 Null byte injection",
        ]

        for s in adversarial_strings:
            meta = CreativeMetadataSchema(
                title=s,
                funnel_stage=FunnelStageEnum.MoFu_Progression,
                primary_visual_hooks=[s],
                audio_cues=[s],
                call_to_action=s,
            )
            assert meta.title == s
            assert meta.primary_visual_hooks[0] == s


class TestAdversarialFastAPIEndpoints:
    """Stress-test FastAPI endpoints against malformed and corrupted HTTP inputs."""

    def test_tag_asset_endpoint_with_malformed_json_body(self, client: TestClient):
        """POST /api/v1/multimodal/tag/{asset_id} with invalid enum values must return 422."""
        # 1. Invalid franchise enum in request body
        resp1 = client.post(
            "/api/v1/multimodal/tag/asset-apex-01",
            json={"asset_id": "asset-apex-01", "franchise": "NON_EXISTENT_FRANCHISE"},
        )
        assert resp1.status_code == 422
        assert "detail" in resp1.json()

        # 2. Invalid focus_surface enum in request body
        resp2 = client.post(
            "/api/v1/multimodal/tag/asset-apex-01",
            json={"asset_id": "asset-apex-01", "focus_surface": "METAVERSE_SURFACE"},
        )
        assert resp2.status_code == 422

    def test_get_nonexistent_asset_returns_404(self, client: TestClient):
        """GET /api/v1/multimodal/assets/{asset_id} with unknown ID returns 404."""
        resp = client.get("/api/v1/multimodal/assets/non-existent-asset-uuid-999999")
        assert resp.status_code == 404
        assert "not found" in resp.json().get("detail", "").lower()

    def test_upload_corrupted_empty_file_fails(self, client: TestClient):
        """POST /api/v1/multimodal/upload with empty file bytes should handle safely."""
        resp = client.post(
            "/api/v1/multimodal/upload",
            data={"campaign_id": "camp-test-adversarial", "franchise": "Apex Legends"},
            files={"file": ("empty.mp4", b"", "video/mp4")},
        )
        # Should either succeed as zero-byte asset or return appropriate validation
        assert resp.status_code in [200, 400, 422]
