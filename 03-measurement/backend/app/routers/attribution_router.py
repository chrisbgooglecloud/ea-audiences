"""Feature Attribution and Tactical 9-Grid Analysis Router.

Provides SHAP marginal contributions, 3x3 tactical grid coordinates, and Gemini 3.6 Flash CoT insights.
"""

from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

from app.schemas.attribution import (
    TacticalGridResponse,
    AttributionExplainRequest,
    AttributionExplainResponse,
    SHAPFeatureContribution,
)
from app.services.attribution_engine import attribution_engine
from app.services.gemini_service import gemini_service
from app.services.firestore_service import firestore_service
from app.services.data_generator import data_generator

router = APIRouter(prefix="/api/v1/attribution", tags=["Attribution & Tactical 9-Grid"])


@router.get("/tactical-grid", response_model=TacticalGridResponse)
@router.get("/9grid", response_model=TacticalGridResponse)
async def get_tactical_grid(
    franchise: str = Query("Apex Legends", description="Franchise name"),
    campaign_id: str = Query("camp-apex-s22-relaunch", description="Campaign identifier"),
):
    """Retrieve features positioned across the 9 quadrants of the Tactical 9-Grid."""
    raw_features = data_generator.get_tactical_9grid_features()
    response = attribution_engine.build_tactical_grid(
        franchise=franchise,
        campaign_id=campaign_id,
        raw_features=raw_features,
    )

    # Persist attribution model in Firestore
    await firestore_service.set_document(
        "attribution_models", response.model_id, response.model_dump()
    )

    return response


@router.post("/explain", response_model=AttributionExplainResponse)
@router.post("/reasoning", response_model=AttributionExplainResponse)
async def explain_attribution(request: AttributionExplainRequest):
    """Generate deep Chain-of-Thought attribution reasoning using Gemini 3.6 Flash (thinking_level=HIGH)."""
    return await gemini_service.generate_attribution_explanation(request)


@router.get("/shap/{campaign_id}", response_model=List[SHAPFeatureContribution])
async def get_shap_contributions(
    campaign_id: str,
    franchise: str = Query("Apex Legends", description="Franchise name"),
):
    """Retrieve decomposed SHAP value contributions for creative features."""
    raw_features = data_generator.get_tactical_9grid_features()
    feature_names = [f["feature_name"] for f in raw_features]
    activations = {f["feature_name"]: 1.0 for f in raw_features}
    weights = {f["feature_name"]: (f["roas_impact_y"] - 1.0) for f in raw_features}

    return attribution_engine.calculate_shap_attributions(
        feature_names=feature_names,
        feature_activations=activations,
        weights=weights,
        base_roas=1.0,
    )
