"""Geo-Spine and spatial-temporal MLOps schemas for DMAs, WeatherNext shocks, and Trends."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DMAMetadata(BaseModel):
    """Google Ads Metro DMA Area metadata."""
    dma_code: int = Field(..., description="Google Ads Criteria ID / DMA Code (e.g. 501 for NYC)")
    dma_name: str = Field(..., description="Designated Market Area Name (e.g. 'New York, NY')")
    state: str = Field(..., description="Primary 2-letter state code")
    latitude: float
    longitude: float
    population: int
    metro_rank: int = Field(..., ge=1, le=210)
    gaming_enthusiast_index: float = Field(
        default=100.0, description="WorldPop demographic affinity index (baseline = 100)"
    )


class WeatherShock(BaseModel):
    """Weather anomaly data record representing WeatherNext 2 signals."""
    dma_code: int
    dma_name: str
    date: str
    temperature_celsius: float
    temp_anomaly_14d_celsius: float = Field(
        ..., description="Temperature anomaly vs 14-day trailing mean (+/- deg C)"
    )
    precipitation_mm: float
    precip_anomaly_14d_pct: float = Field(
        ..., description="Precipitation shock percentage vs 14-day normal"
    )
    is_indoor_catalyst: bool = Field(
        default=False, description="True if precipitation/cold drives indoor entertainment surges"
    )
    indoor_gaming_lift_factor: float = Field(
        default=1.0, description="Calculated elasticity multiplier on engagement"
    )


class TrendSignal(BaseModel):
    """Search zeitgeist momentum from Google Trends."""
    dma_code: int
    dma_name: str
    franchise: str
    date: str
    search_interest_index: float = Field(..., ge=0.0, le=100.0, description="0-100 search volume index")
    trend_velocity_7d: float = Field(
        ..., description="7-day rate of change in search volume (% growth)"
    )
    zeitgeist_topic: str = Field(
        ..., description="Top associated search query or viral topic"
    )


class CombinatorialFeatureRecord(BaseModel):
    """Combined feature interaction record: Tag × Trend × Climate."""
    dma_code: int
    dma_name: str
    state: str
    franchise: str
    creative_tag: str
    funnel_stage: str
    trend_multiplier: float
    weather_multiplier: float
    population_weight: float
    combinatorial_lift_score: float = Field(
        ..., description="Result of Tag_Creative * Trend_Zeitgeist * Metric_Climate * Pop_Weight"
    )
    recommended_action: str


class GeoSpineListResponse(BaseModel):
    """Response containing list of DMAs with current signals."""
    total_dmas: int
    dmas: List[DMAMetadata]


class WeatherShockResponse(BaseModel):
    """Response containing weather shocks across DMAs."""
    total_records: int
    active_shocks_count: int
    shocks: List[WeatherShock]


class CombinatorialFeatureResponse(BaseModel):
    """Response containing combinatorial feature expansion records."""
    franchise: str
    total_features: int
    records: List[CombinatorialFeatureRecord]
