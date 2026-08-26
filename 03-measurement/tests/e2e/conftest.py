"""Shared Fixtures, Schemas, and Test Harness for E2E Test Suite.

Authoritative source of truth:
- ORIGINAL_REQUEST.md
- PROJECT.md
- TEST_INFRA.md
- miner_data_foundation/report.md
- miner_backend/report.md
"""

import os
import sys
import json
import time
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Any
import numpy as np
import pytest
from pydantic import BaseModel, Field
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

# -----------------------------------------------------------------------------
# 1. Path Configuration
# -----------------------------------------------------------------------------
MEASUREMENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ROOT_DIR = os.path.abspath(os.path.join(MEASUREMENT_DIR, ".."))
DATA_FOUNDATION_DIR = os.path.join(ROOT_DIR, "00-data-foundation")
BACKEND_DIR = os.path.join(MEASUREMENT_DIR, "backend")
AGENTS_DIR = os.path.join(MEASUREMENT_DIR, "agents")
FRONTEND_SRC_DIR = os.path.join(MEASUREMENT_DIR, "frontend", "src")

for path in [MEASUREMENT_DIR, ROOT_DIR, DATA_FOUNDATION_DIR, BACKEND_DIR, AGENTS_DIR, FRONTEND_SRC_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)


# -----------------------------------------------------------------------------
# 2. Authoritative Pydantic Schemas from Backend Modules
# -----------------------------------------------------------------------------

# --- Intake & Collision Schemas ---
from app.schemas.intake import (
    CampaignBriefSubmission,
    ConflictFatigueAnalysis,
    CampaignKPIProjection,
    CampaignPredictionResponse,
    ChannelAllocationInput,
    ChannelPredictionDetail,
    CohortTargetEnum,
)

# --- Shapley Creative Schemas ---
from app.schemas.shapley import (
    FunnelCategoryEnum,
    ShapleyFeatureElement,
    WaterfallStep,
    PreTestVideoAuditRequest,
    PreTestVideoAuditResponse,
)

# Backwards-compatible alias for tests referencing ShapleyCategoryEnum
ShapleyCategoryEnum = FunnelCategoryEnum

# --- Meridian Pacing Schemas & Services ---
from app.schemas.meridian import (
    ChannelSpendConstraint,
    EquimarginalOptimizationRequest,
    EquimarginalOptimizationResponse,
    ChannelOptimizationResult,
    SCurvePoint,
)
from app.services.pacing_engine import EquimarginalPacingEngine, pacing_engine
from app.services.campaign_intake_service import CampaignIntakeService, campaign_intake_service
from app.services.shapley_service import ShapleyService, shapley_service

# --- Real FastAPI App ---
from app.main import app as real_fastapi_app


# -----------------------------------------------------------------------------
# 3. Real FastAPI Test App
# -----------------------------------------------------------------------------

def create_e2e_test_app() -> FastAPI:
    """Returns the real FastAPI backend application directly."""
    return real_fastapi_app


# -----------------------------------------------------------------------------
# 4. Shared Pytest Fixtures
# -----------------------------------------------------------------------------

@pytest.fixture(scope="session")
def test_client() -> TestClient:
    """FastAPI TestClient fixture with real application and all endpoints mounted."""
    app = create_e2e_test_app()
    with TestClient(app) as client:
        yield client


@pytest.fixture
def standard_eafc_brief() -> CampaignBriefSubmission:
    """Standard EA FC 27 brief fixture matching the collision scenario."""
    return CampaignBriefSubmission(
        campaign_id="camp-fc27-toty-001",
        campaign_name="EA FC 27 TOTY Mid-Season Push",
        franchise="EA Sports FC",
        target_audience="Core Gamers & Lapsed Whales",
        channels=["Paid Social", "Paid Search", "Influencers", "CTV"],
        total_budget=1500000.0,
        budget_usd=1500000.0,
        flight_start="2026-10-24",
        flight_end="2026-11-04",
        target_cpi=4.12,
        target_roas=3.42,
        apply_mitigation=False,
    )


@pytest.fixture
def non_colliding_brief() -> CampaignBriefSubmission:
    """Brief scheduled outside the Oct 24-27 collision window."""
    return CampaignBriefSubmission(
        campaign_id="camp-fc27-post-holiday",
        campaign_name="EA FC 27 Post-Holiday Push",
        franchise="EA Sports FC",
        target_audience="Core Gamers",
        channels=["Paid Social", "Paid Search"],
        total_budget=1000000.0,
        budget_usd=1000000.0,
        flight_start="2026-11-10",
        flight_end="2026-11-20",
        apply_mitigation=False,
    )


@pytest.fixture
def standard_pacing_request() -> EquimarginalOptimizationRequest:
    """Standard 4-channel Meridian pacing optimization request."""
    return EquimarginalOptimizationRequest(
        campaign_id="camp-fc27-toty-push",
        franchise="EA Sports FC",
        total_budget=1500000.0,
        channels=[
            ChannelSpendConstraint(
                channel="Paid Social",
                current_spend=525000.0,
                base_roas=4.1,
                half_saturation_s=120000.0,
                hill_slope_k=1.5,
            ),
            ChannelSpendConstraint(
                channel="Paid Search",
                current_spend=420000.0,
                base_roas=5.2,
                half_saturation_s=40000.0,
                hill_slope_k=1.2,
            ),
            ChannelSpendConstraint(
                channel="Influencers",
                current_spend=330000.0,
                base_roas=3.8,
                half_saturation_s=75000.0,
                hill_slope_k=2.1,
            ),
            ChannelSpendConstraint(
                channel="CTV",
                current_spend=225000.0,
                base_roas=3.3,
                half_saturation_s=250000.0,
                hill_slope_k=1.8,
            ),
        ],
        max_daily_shift_pct=0.20,
        enforce_zero_sum=True,
    )


@pytest.fixture
def video_audit_request() -> PreTestVideoAuditRequest:
    """Standard 15s unreleased video audit request."""
    return PreTestVideoAuditRequest(
        asset_id="asset-fc27-toty-cut-01",
        asset_title="EA Sports FC 27 - TOTY Trick Shots & Pack Openings",
        franchise="EA Sports FC",
        video_duration_seconds=15.0,
    )


@pytest.fixture
def exported_fixtures_dir() -> str:
    """Path to the exported 00-data-foundation/exports directory."""
    export_path = os.path.join(DATA_FOUNDATION_DIR, "exports")
    os.makedirs(export_path, exist_ok=True)
    return export_path
