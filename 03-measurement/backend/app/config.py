"""Configuration module for the EA Creative Intelligence & Agentic Measurement Engine."""

import os
from typing import List
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "EA Creative Intelligence & Agentic Measurement Engine"
    app_version: str = "1.0.0"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")

    # Google Cloud Platform configuration
    project_id: str = Field(default="eagames-ebc-demo-app", alias="GOOGLE_CLOUD_PROJECT")
    location: str = Field(default="global", alias="GOOGLE_CLOUD_LOCATION")
    gemini_location: str = Field(default="global", alias="GEMINI_LOCATION")

    # Vertex AI / Gemini Models
    gemini_heavy_model: str = Field(default="gemini-3.6-flash", alias="GEMINI_MODEL_HEAVY")
    gemini_fast_model: str = Field(default="gemini-3.5-flash-lite", alias="GEMINI_MODEL_FAST")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")

    # Storage & Databases
    firestore_database: str = Field(default="(default)", alias="FIRESTORE_DATABASE")
    bigquery_dataset: str = Field(default="ea_measurement", alias="BIGQUERY_DATASET")
    gcs_creative_bucket: str = Field(
        default="eagames-ebc-demo-app-creative-assets", alias="GCS_CREATIVE_BUCKET"
    )

    # Server settings
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8080, alias="PORT")
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "*",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
