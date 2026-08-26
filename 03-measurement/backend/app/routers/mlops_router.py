"""Geo-Spine and Spatial MLOps Feature Pipeline Router.

Endpoints for DMAs, WeatherNext shocks, Trends, and Combinatorial Feature Matrix.
"""

from typing import Optional, List
from fastapi import APIRouter, Query

from app.schemas.geospine import (
    GeoSpineListResponse,
    WeatherShockResponse,
    CombinatorialFeatureResponse,
    TrendSignal,
)
from app.services.geospine_service import geospine_service

router = APIRouter(prefix="/api/v1/mlops", tags=["Geo-Spine & Spatial MLOps"])


@router.get("/geospine/metros", response_model=GeoSpineListResponse)
@router.get("/geospine", response_model=GeoSpineListResponse)
async def get_geospine_metros():
    """Retrieve 210 Google Ads Metro DMAs with coordinates and population demographics."""
    return geospine_service.get_all_dmas()


@router.get("/geospine/weather-shocks", response_model=WeatherShockResponse)
@router.get("/weather-shocks", response_model=WeatherShockResponse)
async def get_weather_shocks():
    """Retrieve active WeatherNext 2 climate shocks and indoor entertainment elasticity factors."""
    return geospine_service.get_weather_shocks()


@router.get("/geospine/trends", response_model=List[TrendSignal])
async def get_trend_signals(
    franchise: str = Query("Apex Legends", description="Franchise to query Google Trends for")
):
    """Retrieve search zeitgeist index and 7-day velocity from Google Trends."""
    return geospine_service.get_trend_signals(franchise=franchise)


@router.post("/geospine/combinatorial", response_model=CombinatorialFeatureResponse)
@router.get("/geospine/features", response_model=CombinatorialFeatureResponse)
async def get_combinatorial_features(
    franchise: str = Query("Apex Legends", description="Franchise for combinatorial matrix")
):
    """Compute combinatorial feature matrix: Feature_Combined = Tag * Trend * Climate."""
    return geospine_service.compute_combinatorial_features(franchise=franchise)
