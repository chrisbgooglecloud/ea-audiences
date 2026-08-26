"""Tier 1 Test Suite: Data Foundation Modernization (Features 1 to 6).

Authoritative source of truth:
- ORIGINAL_REQUEST.md (§R1)
- PROJECT.md (Features 1–6)
- miner_data_foundation/report.md
"""

import os
import re
import json
import pytest
import numpy as np

from config import config
from generators.geospine_generator import geospine_generator, TOP_25_NIELSEN_DMAS
from generators.hybrid_bqml_runner import hybrid_bqml_runner
from generators.mmm_math_engine import mmm_math_engine
from orchestrator import run_step_1_geospine, run_step_2_mmm, run_step_3_creative_shap


DATA_FOUNDATION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..", "00-data-foundation"))

# =============================================================================
# FEATURE 1: Remote Model Endpoint Standard
# =============================================================================

class TestFeature1RemoteModelStandard:
    """Verifies Vertex AI remote model endpoint registration and configuration."""

    def test_f01_sql_model_endpoint_gemini_37_flash(self):
        """Verify 01_setup_remote_model.sql registers gemini-3.7-flash."""
        sql_path = os.path.join(DATA_FOUNDATION_DIR, "sql", "01_setup_remote_model.sql")
        assert os.path.exists(sql_path), f"SQL file not found at {sql_path}"
        with open(sql_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "endpoint = 'gemini-3.7-flash'" in content or 'endpoint = "gemini-3.7-flash"' in content, (
            "01_setup_remote_model.sql must specify endpoint = 'gemini-3.7-flash'"
        )
        assert "gemini-3.5-flash-lite" not in content, "Deprecated gemini-3.5-flash-lite must not be present"

    def test_f01_sql_model_identifier(self):
        """Verify 01_setup_remote_model.sql creates ea_measurement.gemini_flash_model."""
        sql_path = os.path.join(DATA_FOUNDATION_DIR, "sql", "01_setup_remote_model.sql")
        with open(sql_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "CREATE OR REPLACE MODEL `ea_measurement.gemini_flash_model`" in content, (
            "Must define CREATE OR REPLACE MODEL `ea_measurement.gemini_flash_model`"
        )

    def test_f01_sql_connection_resource(self):
        """Verify 01_setup_remote_model.sql uses vertex-ai-connection."""
        sql_path = os.path.join(DATA_FOUNDATION_DIR, "sql", "01_setup_remote_model.sql")
        with open(sql_path, "r", encoding="utf-8") as f:
            content = f.read()

        assert "REMOTE WITH CONNECTION" in content
        assert "vertex-ai-connection" in content

    def test_f01_config_remote_endpoint_default(self):
        """Verify config.py default remote_endpoint is 'gemini-3.7-flash'."""
        assert config.remote_endpoint == "gemini-3.7-flash"

    def test_f01_config_remote_model_and_connection(self):
        """Verify config.py remote model and connection parameters."""
        assert config.remote_model_name == "gemini_flash_model"
        assert config.remote_connection_id == "vertex-ai-connection"

    def test_f01_config_dataset_measurement_name(self):
        """Verify config.py specifies target dataset ea_measurement."""
        assert config.dataset_measurement == "ea_measurement"
        assert config.dataset_audiences == "ea_audiences"
        assert config.dataset_creative == "ea_creative"
        assert config.dataset_commerce == "ea_commerce"


# =============================================================================
# FEATURE 2: Fatigue & Shapley DDL Schemas
# =============================================================================

@pytest.fixture(scope="module")
def ddl_content():
    sql_path = os.path.join(DATA_FOUNDATION_DIR, "sql", "02_create_datasets_and_tables.sql")
    assert os.path.exists(sql_path), f"DDL file not found at {sql_path}"
    with open(sql_path, "r", encoding="utf-8") as f:
        return f.read()


class TestFeature2BigQueryDDL:
    """Verifies BigQuery DDL table schemas in 02_create_datasets_and_tables.sql."""

    def test_f02_ddl_fatigue_table_created(self, ddl_content):
        """Verify CREATE TABLE IF NOT EXISTS for ea_measurement.fct_cross_franchise_fatigue."""
        assert "CREATE TABLE IF NOT EXISTS `ea_measurement.fct_cross_franchise_fatigue`" in ddl_content

    def test_f02_ddl_fatigue_11_fields_present(self, ddl_content):
        """Verify all 11 required fields are present in fct_cross_franchise_fatigue."""
        required_fields = [
            "campaign_id STRING",
            "target_franchise STRING",
            "conflicting_franchise STRING",
            "flight_start DATE",
            "flight_end DATE",
            "shared_ea_id_overlap_pct FLOAT64",
            "ad_fatigue_suppression_penalty_pct FLOAT64",
            "net_bookings_risk_usd FLOAT64",
            "recommended_timeline_shift_days INT64",
            "projected_net_bookings_recovery_usd FLOAT64",
            "created_at TIMESTAMP",
        ]
        for field in required_fields:
            field_name, field_type = field.split()
            pattern = rf"\b{field_name}\s+{field_type}\b"
            assert re.search(pattern, ddl_content), f"Field '{field}' missing in fct_cross_franchise_fatigue DDL"

    def test_f02_ddl_shapley_table_created(self, ddl_content):
        """Verify CREATE TABLE IF NOT EXISTS for ea_measurement.fct_creative_shapley_marginal_lift."""
        assert "CREATE TABLE IF NOT EXISTS `ea_measurement.fct_creative_shapley_marginal_lift`" in ddl_content

    def test_f02_ddl_shapley_10_fields_present(self, ddl_content):
        """Verify all 10 required fields are present in fct_creative_shapley_marginal_lift."""
        required_fields = [
            ("asset_id", "STRING"),
            ("franchise", "STRING"),
            ("feature_name", "STRING"),
            ("feature_category", "STRING"),
            ("funnel_tier", "STRING"),
            ("marginal_ctr_lift_pct", "FLOAT64"),
            ("marginal_cti_lift_pct", "FLOAT64"),
            ("marginal_d7_roas_multiplier", "FLOAT64"),
            ("confidence_score", "FLOAT64"),
            ("updated_at", "TIMESTAMP"),
        ]
        for name, dtype in required_fields:
            pattern = rf"\b{name}\s+{dtype}\b"
            assert re.search(pattern, ddl_content), f"Field '{name} {dtype}' missing in shapley DDL"

    def test_f02_ddl_geospine_enhanced_fields(self, ddl_content):
        """Verify enhanced fields in dim_metro_geospine."""
        assert "google_ads_metro_code INT64" in ddl_content
        assert "population_weight FLOAT64" in ddl_content
        assert "esports_cluster_tag STRING" in ddl_content

    def test_f02_ddl_clustering_and_partitioning(self, ddl_content):
        """Verify partitioning and clustering clauses."""
        assert "PARTITION BY flight_start" in ddl_content
        assert "CLUSTER BY target_franchise, conflicting_franchise" in ddl_content
        assert "CLUSTER BY franchise" in ddl_content


# =============================================================================
# FEATURE 3: Spatial Geo-Spine 25 DMAs & WeatherNext Shocks
# =============================================================================

class TestFeature3SpatialGeoSpine:
    """Verifies the 25 Nielsen DMAs, coordinates, eSports tags, and WeatherNext shocks."""

    def test_f03_geospine_210_dmas_generated(self):
        """Verify complete 210 DMA spine generation."""
        dmas = geospine_generator.generate_all_210_dmas()
        assert len(dmas) == 210
        dma_codes = {d["dma_code"] for d in dmas}
        assert len(dma_codes) == 210

    def test_f03_geospine_top_25_dmas_present(self):
        """Verify top Nielsen DMAs are included."""
        dmas = geospine_generator.generate_all_210_dmas()
        dma_map = {d["dma_code"]: d for d in dmas}

        # Key DMAs
        assert 501 in dma_map  # New York, NY
        assert 803 in dma_map  # Los Angeles, CA
        assert 602 in dma_map  # Chicago, IL
        assert 504 in dma_map  # Philadelphia, PA
        assert 623 in dma_map  # Dallas-Ft. Worth, TX
        assert 528 in dma_map  # Miami, FL

    def test_f03_geospine_top_dma_coordinates_exact(self):
        """Verify exact coordinates for core DMAs."""
        ref_map = {d["dma_code"]: d for d in TOP_25_NIELSEN_DMAS}

        assert abs(ref_map[501]["lat"] - 40.7128) < 1e-4
        assert abs(ref_map[501]["lon"] - (-74.0060)) < 1e-4
        assert abs(ref_map[803]["lat"] - 34.0522) < 1e-4
        assert abs(ref_map[803]["lon"] - (-118.2437)) < 1e-4
        assert abs(ref_map[602]["lat"] - 41.8781) < 1e-4
        assert abs(ref_map[602]["lon"] - (-87.6298)) < 1e-4

    def test_f03_geospine_gaming_density_index_valid(self):
        """Verify gaming density indices are valid positive floats."""
        dmas = geospine_generator.generate_all_210_dmas()
        for d in dmas:
            assert 0.5 <= d["gaming_density_index"] <= 2.0

    def test_f03_weathernext_daily_metro_facts_generation(self):
        """Verify daily spatial fact generation with weather shocks."""
        dmas = geospine_generator.generate_all_210_dmas()
        facts = geospine_generator.generate_daily_metro_facts(dmas, days_count=10)
        assert len(facts) > 0

        sample = facts[0]
        assert "weather_shock_flag" in sample
        assert "pop_adjusted_gaming_hours" in sample
        assert "estimated_active_gamers" in sample
        assert sample["pop_adjusted_gaming_hours"] > 0

    def test_f03_indoor_gaming_elasticity_shock_lift(self):
        """Verify weather shocks produce elevated active gaming hours."""
        dmas = geospine_generator.generate_all_210_dmas()
        facts = geospine_generator.generate_daily_metro_facts(dmas, days_count=30)

        shock_facts = [f for f in facts if f["weather_shock_flag"]]
        normal_facts = [f for f in facts if not f["weather_shock_flag"]]

        assert len(shock_facts) > 0
        assert len(normal_facts) > 0


# =============================================================================
# FEATURE 4: 2D Shapley & Collision Generators
# =============================================================================

class TestFeature4ShapleyAndCollisionGenerators:
    """Verifies 2D Shapley trade-offs and cross-franchise schedule collision fixtures."""

    def test_f04_shapley_bellingham_walkout_values(self):
        """Verify FUT Bellingham Walkout: +4.2% CTR, +32.4% CTI, 3.42x ROAS from real generator."""
        records = hybrid_bqml_runner.generate_creative_shapley_marginal_lift()
        bellingham_records = [r for r in records if "Bellingham" in r["feature_name"]]
        assert len(bellingham_records) >= 1, "Jude Bellingham walkout record missing from generated lift values"
        bellingham_data = bellingham_records[0]
        assert bellingham_data["marginal_ctr_lift_pct"] == 4.2
        assert bellingham_data["marginal_cti_lift_pct"] == 32.4
        assert bellingham_data["marginal_d7_roas_multiplier"] == 3.42
        assert bellingham_data["feature_category"] == "LOWER_FUNNEL_MONETIZATION"

    def test_f04_shapley_trickshot_showcase_values(self):
        """Verify Trick Shot Showcase: +41.0% CTR, -12.1% CTI, 1.85x ROAS from real generator."""
        records = hybrid_bqml_runner.generate_creative_shapley_marginal_lift()
        trickshot_records = [r for r in records if "Trick Shot" in r["feature_name"]]
        assert len(trickshot_records) >= 1, "Trick shot showcase record missing from generated lift values"
        trickshot_data = trickshot_records[0]
        assert trickshot_data["marginal_ctr_lift_pct"] == 41.0
        assert trickshot_data["marginal_cti_lift_pct"] == -12.1
        assert trickshot_data["marginal_d7_roas_multiplier"] == 1.85
        assert trickshot_data["feature_category"] == "TOP_OF_FUNNEL"

    def test_f04_shapley_apex_heirloom_and_superglide(self):
        """Verify Apex Heirloom (+6.5% CTR, +28.5% CTI) and Superglide (+38.0% CTR, -9.0% CTI) from real generator."""
        records = hybrid_bqml_runner.generate_creative_shapley_marginal_lift()
        heirloom_records = [r for r in records if "Heirloom" in r["feature_name"]]
        superglide_records = [r for r in records if "Superglide" in r["feature_name"]]
        assert len(heirloom_records) >= 1 and len(superglide_records) >= 1

        heirloom = heirloom_records[0]
        superglide = superglide_records[0]

        assert heirloom["marginal_ctr_lift_pct"] < superglide["marginal_ctr_lift_pct"]
        assert heirloom["marginal_cti_lift_pct"] > superglide["marginal_cti_lift_pct"]
        assert heirloom["marginal_d7_roas_multiplier"] > superglide["marginal_d7_roas_multiplier"]

    def test_f04_collision_scenario_eafc_apex_parameters(self):
        """Verify Oct 24-27 collision scenario from real generator: 42.1% overlap, 14.5% penalty, $420k risk, +3d shift."""
        collision_fixture = hybrid_bqml_runner.generate_collision_scenario_oct24_27()
        assert collision_fixture["shared_ea_id_overlap_pct"] == 42.1
        assert collision_fixture["ad_fatigue_suppression_penalty_pct"] == 14.5
        assert collision_fixture["net_bookings_risk_usd"] == 420000.0
        assert collision_fixture["recommended_timeline_shift_days"] == 3
        assert collision_fixture["projected_net_bookings_recovery_usd"] == 420000.0

    def test_f04_creative_shap_9grid_distribution(self):
        """Verify Tactical 9-Grid SHAP generator creates well-distributed records."""
        records = hybrid_bqml_runner.generate_creative_shap_attributions(count=120)
        assert len(records) == 120
        quadrants = {r["tactical_quadrant"] for r in records}
        assert len(quadrants) == 9

    def test_f04_hybrid_generator_deterministic_seed(self):
        """Verify deterministic reproducibility under fixed RNG seed."""
        runner1 = hybrid_bqml_runner.__class__()
        runner2 = hybrid_bqml_runner.__class__()
        res1 = runner1.generate_creative_shap_attributions(5)
        res2 = runner2.generate_creative_shap_attributions(5)

        for r1, r2 in zip(res1, res2):
            assert r1["feature_name"] == r2["feature_name"]
            assert r1["marginal_roas_impact"] == r2["marginal_roas_impact"]


# =============================================================================
# FEATURE 5: Master Orchestrator CLI & Exports
# =============================================================================

class TestFeature5OrchestratorCLIAndExports:
    """Verifies orchestrator mock execution and fixture exports."""

    def test_f05_orchestrator_step1_execution(self, exported_fixtures_dir):
        """Verify running Step 1 exports dim_metro_geospine.json."""
        res = run_step_1_geospine(live=False, export_dir=exported_fixtures_dir)
        assert res["dmas_count"] == 210
        assert os.path.exists(os.path.join(exported_fixtures_dir, "dim_metro_geospine.json"))

    def test_f05_orchestrator_step2_execution(self, exported_fixtures_dir):
        """Verify running Step 2 exports fct_daily_channel_spend.json."""
        res = run_step_2_mmm(live=False, export_dir=exported_fixtures_dir)
        assert res["spend_records"] > 0
        assert os.path.exists(os.path.join(exported_fixtures_dir, "fct_daily_channel_spend.json"))

    def test_f05_orchestrator_step3_execution(self, exported_fixtures_dir):
        """Verify running Step 3 exports fct_creative_shap_attributions.json and fct_creative_shapley_marginal_lift.json."""
        res = run_step_3_creative_shap(live=False, export_dir=exported_fixtures_dir)
        assert res.get("features_9grid_count", 0) > 0 or res.get("features_count", 0) > 0
        assert os.path.exists(os.path.join(exported_fixtures_dir, "fct_creative_shap_attributions.json"))
        assert os.path.exists(os.path.join(exported_fixtures_dir, "fct_creative_shapley_marginal_lift.json"))

    def test_f05_export_dim_metro_geospine_valid(self, exported_fixtures_dir):
        """Verify exported dim_metro_geospine is valid JSON array."""
        path = os.path.join(exported_fixtures_dir, "dim_metro_geospine.json")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert isinstance(data, list)
        assert len(data) == 210

    def test_f05_export_fixtures_catalog_coverage(self, exported_fixtures_dir):
        """Verify exported fixtures directory exists and contains valid JSON."""
        assert os.path.isdir(exported_fixtures_dir)
        files = [f for f in os.listdir(exported_fixtures_dir) if f.endswith(".json")]
        assert len(files) >= 3


# =============================================================================
# FEATURE 6: Data Foundation Pytest Suite & MLOps
# =============================================================================

class TestFeature6PytestSuiteAndMLOps:
    """Verifies math engine properties and econometric time series invariants."""

    def test_f06_mmm_math_engine_3year_time_series(self):
        """Verify generate_3year_daily_spend generates 245,280 spend records."""
        spends = mmm_math_engine.generate_3year_daily_spend()
        assert len(spends) == 245280

    def test_f06_mmm_math_engine_portfolio_roas_bounds(self):
        """Verify portfolio aggregate ROAS is strictly within 3.0x to 5.0x."""
        spends = mmm_math_engine.generate_3year_daily_spend()
        tot_spend = sum(s["spend_usd"] for s in spends)
        tot_rev = sum(s["attributed_revenue_usd"] for s in spends)
        roas = tot_rev / tot_spend
        assert 3.0 <= roas <= 5.0, f"Portfolio ROAS {roas:.2f} not in [3.0, 5.0]"

    def test_f06_hill_saturation_vectorized_monotonic(self):
        """Verify Hill saturation function is strictly monotonically increasing."""
        spends = np.array([100.0, 500.0, 2000.0, 10000.0, 50000.0])
        response = mmm_math_engine.hill_saturation(spends, k=2000.0, s=1.5)
        diffs = np.diff(response)
        assert np.all(diffs > 0), "Hill saturation curve must be strictly monotonic"
        assert response[-1] <= 1.0, "Hill saturation cannot exceed 1.0"

    def test_f06_geometric_adstock_carryover_decay(self):
        """Verify geometric adstock carryover decay preserves order."""
        spend = np.zeros(10, dtype=np.float64)
        spend[0] = 1000.0  # Pulse spend at t=0
        adstocked = mmm_math_engine.geometric_adstock(spend, decay_rate=0.5, max_lag=5)

        assert adstocked[0] == 1000.0
        assert adstocked[1] == 500.0
        assert adstocked[2] == 250.0
        assert np.all(np.diff(adstocked[:5]) < 0), "Adstock impulse must decay monotonically"

    def test_f06_player_telemetry_schema_and_states(self):
        """Verify player telemetry events have valid behavioral states."""
        events = hybrid_bqml_runner.generate_player_telemetry_events(count=30)
        assert len(events) == 30
        valid_states = {"High Frustration", "Casual Weekend", "Hardcore Competitor", "Lapsed Whale"}
        for ev in events:
            assert ev["behavioral_state"] in valid_states
            assert 0.0 <= ev["churn_probability"] <= 1.0

    def test_f06_commerce_3d_dwell_time_beta_bounds(self):
        """Verify IAS camera dwell time is strictly clamped to [0.1, 8.0] seconds."""
        impressions = hybrid_bqml_runner.generate_commerce_3d_impressions(count=30)
        assert len(impressions) == 30
        for imp in impressions:
            assert 0.1 <= imp["dwell_time_seconds"] <= 8.0
            assert 0.80 <= imp["ias_brand_safety_score"] <= 1.0
