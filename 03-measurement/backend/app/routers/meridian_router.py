"""Meridian MMM Prior Calibration and Equimarginal Pacing Engine Router.

Provides high-speed mathematical budget optimization with strict 20% pacing clamp
and zero-sum portfolio constraints (<200ms solver latency).
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query

from app.schemas.meridian import (
    PriorCalibrationRequest,
    PriorCalibrationResponse,
    EquimarginalOptimizationRequest,
    EquimarginalOptimizationResponse,
)
from app.services.meridian_prior_tuner import prior_tuner
from app.services.pacing_engine import pacing_engine
from app.services.firestore_service import firestore_service
from app.services.data_generator import data_generator

router = APIRouter(prefix="/api/v1/meridian", tags=["Meridian MMM & Pacing Engine"])


@router.post("/prior-tune", response_model=PriorCalibrationResponse)
@router.post("/tune-priors", response_model=PriorCalibrationResponse)
async def calibrate_meridian_priors(request: Optional[PriorCalibrationRequest] = None):
    """Calibrate Bayesian log-normal prior distributions from causal lift experiments."""
    if not request or not request.experiments:
        default_experiments = data_generator.get_causal_lift_experiments()
        request = PriorCalibrationRequest(
            franchise="Apex Legends",
            experiments=default_experiments,
        )

    response = prior_tuner.calibrate(request)
    return response


@router.post("/solve", response_model=EquimarginalOptimizationResponse)
@router.post("/solve-pacing", response_model=EquimarginalOptimizationResponse)
async def solve_equimarginal_pacing(request: EquimarginalOptimizationRequest):
    """Execute Equimarginal Hill Saturation solver with 20% pacing clamp & zero-sum constraint."""
    try:
        response = pacing_engine.solve(request)

        # Store scenario in Firestore
        await firestore_service.set_document(
            "scenarios", response.scenario_id, response.model_dump()
        )

        return response
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Equimarginal solver failed: {str(e)}"
        )


@router.get("/scenarios", response_model=List[EquimarginalOptimizationResponse])
async def list_scenarios(limit: int = Query(20, ge=1, le=100)):
    """List historical optimization scenarios."""
    docs = await firestore_service.list_documents("scenarios", limit=limit)
    return [EquimarginalOptimizationResponse.model_validate(d) for d in docs]


@router.get("/scenarios/{scenario_id}", response_model=EquimarginalOptimizationResponse)
async def get_scenario(scenario_id: str):
    """Retrieve specific optimization scenario by ID."""
    doc = await firestore_service.get_document("scenarios", scenario_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")
    return EquimarginalOptimizationResponse.model_validate(doc)
