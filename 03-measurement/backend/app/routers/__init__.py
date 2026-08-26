"""Backend API Routers Package."""

from app.routers.multimodal_router import router as multimodal_router
from app.routers.mlops_router import router as mlops_router
from app.routers.meridian_router import router as meridian_router
from app.routers.attribution_router import router as attribution_router
from app.routers.agents_router import router as agents_router
from app.routers.intake_router import router as intake_router
from app.routers.shapley_router import router as shapley_router

__all__ = [
    "multimodal_router",
    "mlops_router",
    "meridian_router",
    "attribution_router",
    "agents_router",
    "intake_router",
    "shapley_router",
]
