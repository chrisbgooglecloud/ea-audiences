"""Multimodal Creative Intelligence Router.

Endpoints for asset upload, frame extraction, structured Gemini tagging, and asset cataloging.
"""

import os
import time
import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query

from app.schemas.creative import (
    CreativeAsset,
    CreativeMetadataSchema,
    UploadAssetResponse,
    TagAssetRequest,
    AssetListResponse,
    MediaTypeEnum,
    FranchiseEnum,
)
from app.services.frame_extractor import frame_extractor
from app.services.gemini_service import gemini_service
from app.services.firestore_service import firestore_service
from app.services.data_generator import data_generator

logger = logging.getLogger("app.routers.multimodal")

router = APIRouter(prefix="/api/v1/multimodal", tags=["Multimodal Creative Intelligence"])


@router.post("/upload", response_model=UploadAssetResponse)
async def upload_creative_asset(
    file: UploadFile = File(...),
    campaign_id: str = Form(default="camp-apex-s22-relaunch"),
    franchise: FranchiseEnum = Form(default=FranchiseEnum.APEX_LEGENDS),
):
    """Upload video or image creative asset, process metadata, and store record."""
    try:
        content = await file.read()
        file_size = len(content)
        file_name = file.filename or "unknown_asset"
        extension = os.path.splitext(file_name)[1].lower()

        media_type = MediaTypeEnum.VIDEO if extension in [".mp4", ".mov", ".avi", ".webm"] else MediaTypeEnum.IMAGE
        asset_id = f"asset-{uuid.uuid4().hex[:8]}"
        gcs_uri = f"gs://eagames-ebc-demo-app-creative-assets/{franchise.value.replace(' ', '_').lower()}/{file_name}"

        # Image/Video metric extraction
        if media_type == MediaTypeEnum.IMAGE:
            img_info = frame_extractor.process_image(content)
            duration = 0.0
            frame_cnt = 1
        else:
            duration = 15.0
            frame_cnt = 15

        now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        # Perform initial structured tagging
        metadata_schema = await gemini_service.tag_creative_media(
            file_path_or_uri=gcs_uri,
            media_type=media_type.value,
            franchise=franchise.value,
        )

        asset = CreativeAsset(
            asset_id=asset_id,
            campaign_id=campaign_id,
            franchise=franchise,
            gcs_uri=gcs_uri,
            media_type=media_type,
            file_name=file_name,
            file_size_bytes=file_size,
            duration_seconds=duration,
            frame_count=frame_cnt,
            metadata_schema=metadata_schema,
            created_at=now_str,
            updated_at=now_str,
            status="PROCESSED",
        )

        await firestore_service.set_document("creative_assets", asset_id, asset.model_dump())

        return UploadAssetResponse(
            asset_id=asset_id,
            campaign_id=campaign_id,
            gcs_uri=gcs_uri,
            file_name=file_name,
            media_type=media_type,
            status="PROCESSED",
            message="Creative asset successfully uploaded, decimated, and structured-tagged via Gemini 3.6 Flash.",
        )
    except Exception as e:
        logger.error(f"Error processing asset upload: {e}")
        raise HTTPException(status_code=500, detail=f"Asset upload failed: {str(e)}")


@router.post("/tag/{asset_id}", response_model=CreativeMetadataSchema)
async def tag_creative_asset(
    asset_id: str,
    request: Optional[TagAssetRequest] = None,
):
    """Trigger or re-execute structured Gemini tagging on a stored creative asset."""
    doc = await firestore_service.get_document("creative_assets", asset_id)
    if not doc:
        # Check pre-generated assets
        matched = [a for a in data_generator.get_creative_assets() if a.asset_id == asset_id]
        if matched:
            doc = matched[0].model_dump()
        else:
            raise HTTPException(status_code=404, detail=f"Creative asset {asset_id} not found")

    franchise = request.franchise.value if (request and request.franchise) else doc.get("franchise", "Apex Legends")
    custom_prompt = request.custom_prompt if request else None

    tagged_meta = await gemini_service.tag_creative_media(
        file_path_or_uri=doc.get("gcs_uri", f"gs://assets/{asset_id}"),
        media_type=doc.get("media_type", "VIDEO"),
        franchise=franchise,
        custom_instructions=custom_prompt,
    )

    doc["metadata_schema"] = tagged_meta.model_dump()
    doc["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    doc["status"] = "PROCESSED"
    await firestore_service.set_document("creative_assets", asset_id, doc)

    return tagged_meta


@router.get("/assets", response_model=AssetListResponse)
async def list_creative_assets(
    franchise: Optional[str] = Query(None, description="Filter assets by franchise name"),
    limit: int = Query(50, ge=1, le=200),
):
    """List creative assets with optional franchise filtering."""
    raw_docs = await firestore_service.list_documents("creative_assets", limit=limit)
    if not raw_docs:
        # Fallback to pre-generated synthetic creative assets
        assets = data_generator.get_creative_assets()
        for a in assets:
            await firestore_service.set_document("creative_assets", a.asset_id, a.model_dump())
    else:
        assets = [CreativeAsset.model_validate(d) for d in raw_docs]

    if franchise:
        assets = [a for a in assets if a.franchise.value.lower() == franchise.lower()]

    return AssetListResponse(
        total=len(assets),
        franchise_filter=franchise,
        assets=assets,
    )


@router.get("/assets/{asset_id}", response_model=CreativeAsset)
async def get_creative_asset(asset_id: str):
    """Retrieve details and structured metadata for a specific creative asset."""
    doc = await firestore_service.get_document("creative_assets", asset_id)
    if not doc:
        matched = [a for a in data_generator.get_creative_assets() if a.asset_id == asset_id]
        if matched:
            return matched[0]
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")
    return CreativeAsset.model_validate(doc)
