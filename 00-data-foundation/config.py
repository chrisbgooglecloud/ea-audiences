"""Central Configuration for EA EBC Synthetic Data Foundation."""

import os
from dataclasses import dataclass, field
from typing import List


@dataclass
class DataFoundationConfig:
    """Configuration parameters for the EA EBC Synthetic Data Engine."""

    # GCP Project & Regions
    project_id: str = os.getenv("GOOGLE_CLOUD_PROJECT", "eagames-ebc-demo-app")
    bq_location: str = os.getenv("BQ_LOCATION", "US")
    gcp_region: str = os.getenv("GOOGLE_CLOUD_REGION", "us-central1")

    # BigQuery Target Datasets across the 4 Acts
    dataset_measurement: str = os.getenv("DATASET_MEASUREMENT", "ea_measurement")
    dataset_audiences: str = os.getenv("DATASET_AUDIENCES", "ea_audiences")
    dataset_creative: str = os.getenv("DATASET_CREATIVE", "ea_creative")
    dataset_commerce: str = os.getenv("DATASET_COMMERCE", "ea_commerce")

    # BigQuery Vertex AI Remote Connection & Model Settings
    remote_connection_id: str = os.getenv("REMOTE_CONNECTION_ID", "vertex-ai-connection")
    remote_model_name: str = os.getenv("REMOTE_MODEL_NAME", "gemini_flash_model")
    remote_endpoint: str = os.getenv("REMOTE_ENDPOINT", "gemini-3.7-flash")

    # External Data Sources
    weathernext_table: str = os.getenv(
        "WEATHERNEXT_TABLE", "patrickgrady-dev-machine.weathernext_2.weathernext_2_0_0"
    )
    google_trends_table: str = "bigquery-public-data.google_trends.top_terms"
    worldpop_table: str = "bigquery-public-data.worldpop.pop_grid_2020"

    # Cloud Firestore
    firestore_database: str = os.getenv("FIRESTORE_DATABASE", "(default)")

    # 3-Year Time Horizon Parameters
    start_date: str = "2023-08-01"
    end_date: str = "2026-08-01"
    total_days: int = 1095  # 3 full years / 156 weeks

    # Global Budget & Econometric Constraints
    monthly_budget_min_usd: float = 5_000_000.0
    monthly_budget_max_usd: float = 10_000_000.0
    annual_budget_target_usd: float = 90_000_000.0
    target_roas_min: float = 3.0
    target_roas_max: float = 5.0

    # EA Franchises & Spend Shares
    franchises: List[str] = field(
        default_factory=lambda: [
            "Apex Legends",
            "EA Sports FC",
            "Battlefield 6",
            "The Sims 4",
        ]
    )
    franchise_budget_shares: dict = field(
        default_factory=lambda: {
            "Apex Legends": 0.30,
            "EA Sports FC": 0.35,
            "Battlefield 6": 0.20,
            "The Sims 4": 0.15,
        }
    )

    # Geographic Target Markets & Spend Distribution
    countries: List[str] = field(
        default_factory=lambda: ["US", "UK", "DE", "FR", "JP", "KR", "SA"]
    )
    country_budget_shares: dict = field(
        default_factory=lambda: {
            "US": 0.40,
            "UK": 0.12,
            "DE": 0.10,
            "FR": 0.08,
            "JP": 0.15,
            "KR": 0.08,
            "SA": 0.07,
        }
    )

    # 8 Media Channels with Econometric Ground-Truth Parameters
    channel_parameters: dict = field(
        default_factory=lambda: {
            "Paid Search": {
                "spend_share": 0.18,
                "adstock_decay": 0.15,
                "half_sat_k": 40000.0,
                "hill_shape_s": 1.2,
                "base_roas": 5.2,
            },
            "Paid Social": {
                "spend_share": 0.25,
                "adstock_decay": 0.35,
                "half_sat_k": 120000.0,
                "hill_shape_s": 1.5,
                "base_roas": 4.1,
            },
            "Influencers": {
                "spend_share": 0.15,
                "adstock_decay": 0.25,
                "half_sat_k": 75000.0,
                "hill_shape_s": 2.1,
                "base_roas": 3.8,
            },
            "CTV": {
                "spend_share": 0.14,
                "adstock_decay": 0.65,
                "half_sat_k": 250000.0,
                "hill_shape_s": 1.8,
                "base_roas": 3.3,
            },
            "Linear TV": {
                "spend_share": 0.10,
                "adstock_decay": 0.75,
                "half_sat_k": 400000.0,
                "hill_shape_s": 2.0,
                "base_roas": 2.6,
            },
            "Display": {
                "spend_share": 0.06,
                "adstock_decay": 0.20,
                "half_sat_k": 30000.0,
                "hill_shape_s": 1.1,
                "base_roas": 2.1,
            },
            "DOOH": {
                "spend_share": 0.07,
                "adstock_decay": 0.50,
                "half_sat_k": 150000.0,
                "hill_shape_s": 1.6,
                "base_roas": 2.8,
            },
            "Podcast": {
                "spend_share": 0.05,
                "adstock_decay": 0.40,
                "half_sat_k": 50000.0,
                "hill_shape_s": 1.4,
                "base_roas": 3.6,
            },
        }
    )


config = DataFoundationConfig()
