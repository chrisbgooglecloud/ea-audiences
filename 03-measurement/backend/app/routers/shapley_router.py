"""Multimodal 2D Creative Shapley Video Intelligence Router.

Deconstructs video trailers into 2D game-theoretic feature lift metrics,
evaluates Top-of-Funnel CTR stopping power vs Lower-Funnel CTI monetization,
computes Funnel Balance Index (FBI), and provides prescriptive sequencing recommendations.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas.shapley import (
    PreTestVideoAuditRequest,
    PreTestVideoAuditResponse,
)
from app.services.shapley_service import shapley_service
from app.services.firestore_service import firestore_service

router = APIRouter(prefix="/api/v1/shapley", tags=["Multimodal 2D Creative Shapley Lab"])


@router.post("/pretest", response_model=PreTestVideoAuditResponse)
async def audit_pretest_video(request: Optional[PreTestVideoAuditRequest] = None):
    """Audit an unreleased video trailer and compute 2D Shapley marginal lift values."""
    if request is None:
        request = PreTestVideoAuditRequest()

    try:
        response = shapley_service.audit_video_asset(request)

        # Store audit in Firestore / in-memory store
        await firestore_service.set_document(
            "shapley_audits", response.audit_id, response.model_dump()
        )

        return response
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Shapley video audit failed: {str(e)}"
        )


@router.get("/benchmarks", response_model=List[PreTestVideoAuditResponse])
async def list_shapley_benchmarks():
    """Retrieve benchmark 2D Shapley video trade-off audits (EA Sports FC & Apex Legends)."""
    benchmarks = shapley_service.get_benchmark_audits()
    return benchmarks


@router.get("/audits/{audit_id}", response_model=PreTestVideoAuditResponse)
async def get_audit(audit_id: str):
    """Retrieve specific video audit by ID."""
    doc = await firestore_service.get_document("shapley_audits", audit_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Shapley audit {audit_id} not found")
    return PreTestVideoAuditResponse.model_validate(doc)
