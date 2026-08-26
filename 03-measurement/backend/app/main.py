"""FastAPI Main Application Entrypoint for EA Creative Intelligence & Agentic Measurement Engine.

Integrates multimodal creative understanding, spatial-temporal MLOps,
Bayesian Meridian MMM prior calibration, Equimarginal Hill Saturation optimization,
2D Creative Shapley game-theoretic intelligence, cross-franchise audience fatigue,
Tactical 9-Grid attribution, and Gemini Enterprise ADK multi-agent protocols.
"""

import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import (
    multimodal_router,
    mlops_router,
    meridian_router,
    attribution_router,
    agents_router,
    intake_router,
    shapley_router,
)
from app.services.firestore_service import firestore_service
from app.services.data_generator import data_generator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan events."""
    logger.info("Initializing EA Measurement Engine Backend...")

    # Seed initial in-memory data for instant startup (<10ms)
    campaigns = data_generator.get_campaigns()
    for c in campaigns:
        firestore_service._memory_store["campaigns"][c["campaign_id"]] = c

    assets = data_generator.get_creative_assets()
    for a in assets:
        firestore_service._memory_store["creative_assets"][a.asset_id] = a.model_dump()

    logger.info(f"Loaded {len(campaigns)} campaigns and {len(assets)} creative assets into memory store.")
    yield
    logger.info("Shutting down EA Measurement Engine Backend...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Production-grade microservices for the EA Creative Intelligence & Agentic Measurement Engine. "
        "Provides Multimodal Tagging, Geo-Spine MLOps, Meridian Prior Tuning, Equimarginal Hill Saturation, "
        "2D Creative Shapley Intelligence, Cross-Franchise Fatigue Engine, Tactical 9-Grid SHAP Attribution, "
        "and A2A / A2UI protocols."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add X-Process-Time-Ms header to all responses for performance tracking."""
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
    return response


# Register API Routers
app.include_router(multimodal_router)
app.include_router(mlops_router)
app.include_router(meridian_router)
app.include_router(attribution_router)
app.include_router(agents_router)
app.include_router(intake_router)
app.include_router(shapley_router)


@app.get("/", tags=["System"])
async def root():
    """Root metadata endpoint."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "status": "HEALTHY",
        "docs": "/docs",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.get("/healthz", tags=["System"])
@app.get("/api/health", tags=["System"])
async def health_check():
    """Kubernetes / Cloud Run liveness and readiness probe."""
    return {
        "status": "UP",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "services": {
            "pacing_engine": "ACTIVE",
            "campaign_intake_service": "ACTIVE",
            "shapley_service": "ACTIVE",
            "meridian_prior_tuner": "ACTIVE",
            "attribution_engine": "ACTIVE",
            "geospine_service": "ACTIVE",
            "firestore_service": "ACTIVE",
            "gemini_service": "ACTIVE",
        },
    }


@app.get("/api/v1/campaigns", tags=["Campaigns"])
async def list_campaigns():
    """Retrieve list of active EA marketing campaigns."""
    docs = await firestore_service.list_documents("campaigns")
    if not docs:
        return data_generator.get_campaigns()
    return docs
