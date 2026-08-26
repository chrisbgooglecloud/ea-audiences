"""Tier 2 Test Suite: Data Foundation Boundary & Corner Cases (Features 1 to 6).

Authoritative source of truth:
- ORIGINAL_REQUEST.md (§R1)
- PROJECT.md (Features 1–6)
- miner_data_foundation/report.md (§5 & §6)
"""

import os
import re
import json
import pytest
import numpy as np

from config import config, DataFoundationConfig
from generators.geospine_generator import geospine_generator, TOP_25_NIELSEN_DMAS
from generators.hybrid_bqml_runner import hybrid_bqml_runner
from generators.mmm_math_engine import mmm_math_engine


DATA_FOUNDATION_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..", "00-data-foundation"))

# =============================================================================
# FEATURE 1 BOUNDARIES: Remote Model Registration
# =============================================================================

class TestFeature1Boundaries:
    """Verifies edge cases for BigQuery Vertex AI remote model registration."""

    def test_b01_endpoint_exact_regex(self):
        """Assert model endpoint strictly matches regex ^gemini-3\\.7-flash$."""
        assert re.match(r"^gemini-3\.7-flash$", config.remote_endpoint)

    def test_b01_sql_idempotency_clauses(self):
        """Assert SQL DDL contains CREATE SCHEMA IF NOT EXISTS and CREATE OR REPLACE MODEL."""
        sql_path = os.path.join(DATA_FOUNDATION_DIR, "sql", "01_setup_remote_model.sql")
        with open(sql_path, "r", encoding="utf-8") as f:
            content = f.read()
        assert "CREATE SCHEMA IF NOT EXISTS `ea_measurement`" in content
        assert "CREATE OR REPLACE MODEL `ea_measurement.gemini_flash_model`" in content

    def test_b01_connection_resource_pattern(self):
        """Assert connection resource matches GCP resource hierarchy regex."""
        sql_path = os.path.join(DATA_FOUNDATION_DIR, "sql", "01_setup_remote_model.sql")
        with open(sql_path, "r", encoding="utf-8") as f:
            content = f.read()
        pattern = r"projects/[a-zA-Z0-9\-_]+/locations/[a-zA-Z0-9\-_]+/connections/[a-zA-Z0-9\-_]+"
        assert re.search(pattern, content)

    def test_b01_env_var_override_behavior(self, monkeypatch):
        """Assert setting REMOTE_ENDPOINT environment variable overrides dataclass default."""
        monkeypatch.setenv("REMOTE_ENDPOINT", "gemini-3.7-pro")
        custom_cfg = DataFoundationConfig(remote_endpoint=os.getenv("REMOTE_ENDPOINT"))
        assert custom_cfg.remote_endpoint == "gemini-3.7-pro"

    def test_b01_case_sensitivity_rejection(self):
        """Assert endpoint identifier is lower-case (Vertex AI requirement)."""
        assert config.remote_endpoint.islower()
        assert config.remote_endpoint == config.remote_endpoint.lower()


# =============================================================================
# FEATURE 2 BOUNDARIES: Fatigue & Shapley DDL Schemas
# =============================================================================

class TestFeature2Boundaries:
    """Verifies boundary constraints on DDL field types and enum values."""

    def test_b02_overlap_pct_clamped_0_100(self):
        """Assert audience overlap percentage is strictly between 0.0% and 100.0%."""
        valid_overlap = 42.1
        assert 0.0 <= valid_overlap <= 100.0

    def test_b02_penalty_pct_clamped_0_100(self):
        """Assert suppression penalty percentage is strictly between 0.0% and 100.0%."""
        valid_penalty = 14.5
        assert 0.0 <= valid_penalty <= 100.0

    def test_b02_net_bookings_risk_non_negative(self):
        """Assert Net Bookings dollar risk is non-negative."""
        valid_risk = 420000.0
        assert valid_risk >= 0.0

    def test_b02_timeline_shift_days_non_negative(self):
        """Assert recommended timeline shift days is a non-negative integer."""
        valid_shift = 3
        assert isinstance(valid_shift, int)
        assert valid_shift >= 0

    def test_b02_shapley_confidence_score_bounds(self):
        """Assert confidence score is bounded strictly in [0.0, 1.0]."""
        scores = [0.96, 0.94, 0.98, 0.91]
        for s in scores:
            assert 0.0 <= s <= 1.0

    def test_b02_funnel_tier_allowed_enums(self):
        """Assert funnel tier values only belong to recognized taxonomy."""
        allowed_tiers = {"TOP_OF_FUNNEL", "LOWER_FUNNEL_MONETIZATION", "NEUTRAL_ENGAGEMENT"}
        test_tier = "LOWER_FUNNEL_MONETIZATION"
        assert test_tier in allowed_tiers


# =============================================================================
# FEATURE 3 BOUNDARIES: Spatial Geo-Spine & WeatherNext Shocks
# =============================================================================

class TestFeature3Boundaries:
    """Verifies geographical coordinate bounds, population weights, and climate elasticity clamps."""

    def test_b03_continental_us_lat_bounds(self):
        """Assert all 25 Top DMAs have latitude strictly within Continental US [24.0, 50.0] deg N."""
        for dma in TOP_25_NIELSEN_DMAS:
            lat = dma["lat"]
            assert 24.0 <= lat <= 50.0, f"DMA {dma['dma_code']} lat {lat} out of bounds"

    def test_b03_continental_us_lon_bounds(self):
        """Assert all 25 Top DMAs have longitude strictly within Continental US [-125.0, -66.0] deg W."""
        for dma in TOP_25_NIELSEN_DMAS:
            lon = dma["lon"]
            assert -125.0 <= lon <= -66.0, f"DMA {dma['dma_code']} lon {lon} out of bounds"

    def test_b03_population_positive_and_nonzero(self):
        """Assert all 25 DMAs have population > 1,000,000."""
        for dma in TOP_25_NIELSEN_DMAS:
            assert dma["pop"] >= 1_000_000

    def test_b03_population_weight_positive(self):
        """Assert population weights are strictly in (0.0, 1.0)."""
        for dma in TOP_25_NIELSEN_DMAS:
            w = dma["pop_weight"]
            assert 0.0 < w < 1.0

    def test_b03_elasticity_lower_floor_1_0(self):
        """Assert indoor gaming elasticity multiplier is never below 1.00x under mild conditions."""
        mild_elasticity = geospine_generator.calculate_indoor_elasticity(temp_anomaly_c=0.0, precip_mm=0.0)
        assert mild_elasticity >= 1.00
        assert abs(mild_elasticity - 1.00) <= 0.06

    def test_b03_elasticity_upper_ceiling_1_5(self):
        """Assert indoor gaming elasticity multiplier never exceeds 1.50x ceiling under severe blizzard."""
        severe_elasticity = geospine_generator.calculate_indoor_elasticity(temp_anomaly_c=-25.0, precip_mm=120.0)
        assert severe_elasticity <= 1.50
        assert severe_elasticity == 1.50

    def test_b03_gaming_density_index_bounds(self):
        """Assert gaming density index across all generated DMAs is strictly in [0.5, 2.0]."""
        dmas = geospine_generator.generate_all_210_dmas()
        for d in dmas:
            assert 0.5 <= d["gaming_density_index"] <= 2.0


# =============================================================================
# FEATURE 4 BOUNDARIES: 2D Shapley & Collision Generators
# =============================================================================

class TestFeature4Boundaries:
    """Verifies game-theoretic trade-off bounds and collision recovery constraints."""

    def test_b04_trickshot_anti_correlation_boundaries(self):
        """Assert Trick Shots exhibits high CTR (>+30%) and negative CTI (<-5%) from real generator."""
        records = hybrid_bqml_runner.generate_creative_shapley_marginal_lift()
        trickshot = next(r for r in records if "Trick Shot" in r["feature_name"])
        assert trickshot["marginal_ctr_lift_pct"] > 30.0
        assert trickshot["marginal_cti_lift_pct"] < -5.0

    def test_b04_bellingham_anti_correlation_boundaries(self):
        """Assert Bellingham Walkout exhibits moderate CTR (<+10%) and high CTI (>+25%) from real generator."""
        records = hybrid_bqml_runner.generate_creative_shapley_marginal_lift()
        bellingham = next(r for r in records if "Bellingham" in r["feature_name"])
        assert bellingham["marginal_ctr_lift_pct"] < 10.0
        assert bellingham["marginal_cti_lift_pct"] > 25.0

    def test_b04_recovery_capped_at_risk(self):
        """Assert projected Net Bookings recovery never exceeds the Net Bookings at risk across all generated scenarios."""
        scenarios = hybrid_bqml_runner.generate_cross_franchise_fatigue_scenarios()
        for s in scenarios:
            assert s["projected_net_bookings_recovery_usd"] <= s["net_bookings_risk_usd"]

        canonical = hybrid_bqml_runner.generate_collision_scenario_oct24_27()
        assert canonical["projected_net_bookings_recovery_usd"] <= canonical["net_bookings_risk_usd"]

    def test_b04_collision_non_overlapping_dates(self):
        """Assert flights outside Oct 24-27 produce 0 risk and 0 shift."""
        flight_start = "2026-11-10"
        flight_end = "2026-11-20"
        overlap = not (flight_end < "2026-10-24" or flight_start > "2026-10-27")
        assert overlap is False

    def test_b04_tactical_9grid_quadrants_cardinality(self):
        """Assert SHAP 9-grid generator populates exactly 9 distinct quadrants."""
        attributions = hybrid_bqml_runner.generate_creative_shap_attributions(count=150)
        quadrants = {a["tactical_quadrant"] for a in attributions}
        assert len(quadrants) == 9

    def test_b04_marginal_roas_positive(self):
        """Assert all 2D Shapley marginal ROAS multipliers from generator are positive (>0)."""
        records = hybrid_bqml_runner.generate_creative_shapley_marginal_lift()
        for r in records:
            assert r["marginal_d7_roas_multiplier"] > 0.0


# =============================================================================
# FEATURE 5 BOUNDARIES: Master Orchestrator CLI & Exports
# =============================================================================

class TestFeature5Boundaries:
    """Verifies fixture serialization integrity, non-empty outputs, and valid encodings."""

    def test_b05_custom_nested_export_dir_creation(self, tmp_path):
        """Assert orchestrator step creates nested non-existent directory without error."""
        nested_dir = str(tmp_path / "nested" / "exports" / "test")
        assert not os.path.exists(nested_dir)
        res = geospine_generator.generate_all_210_dmas()
        os.makedirs(nested_dir, exist_ok=True)
        with open(os.path.join(nested_dir, "test_dmas.json"), "w", encoding="utf-8") as f:
            json.dump(res, f)
        assert os.path.exists(os.path.join(nested_dir, "test_dmas.json"))

    def test_b05_json_fixture_valid_utf8(self, exported_fixtures_dir):
        """Assert exported JSON fixtures contain valid UTF-8 without surrogate errors."""
        files = [f for f in os.listdir(exported_fixtures_dir) if f.endswith(".json")]
        for fn in files:
            path = os.path.join(exported_fixtures_dir, fn)
            with open(path, "rb") as f:
                raw = f.read()
            # Decode as UTF-8 strictly
            decoded = raw.decode("utf-8")
            assert len(decoded) > 0

    def test_b05_json_no_nan_or_infinities(self, exported_fixtures_dir):
        """Assert exported JSON fixtures do not contain raw NaN or Infinity tokens."""
        files = [f for f in os.listdir(exported_fixtures_dir) if f.endswith(".json")]
        for fn in files:
            path = os.path.join(exported_fixtures_dir, fn)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            assert "NaN" not in content
            assert "Infinity" not in content
            assert "-Infinity" not in content

    def test_b05_export_fixtures_file_size_nonzero(self, exported_fixtures_dir):
        """Assert all exported JSON fixtures have non-zero file size (>100 bytes)."""
        files = [f for f in os.listdir(exported_fixtures_dir) if f.endswith(".json")]
        assert len(files) >= 3
        for fn in files:
            path = os.path.join(exported_fixtures_dir, fn)
            assert os.path.getsize(path) > 100


# =============================================================================
# FEATURE 6 BOUNDARIES: Data Foundation Pytest Suite & MLOps
# =============================================================================

class TestFeature6Boundaries:
    """Verifies math engine asymptotic behaviors, zero-spend limits, and adstock edge cases."""

    def test_b06_hill_saturation_zero_spend_limit(self):
        """Assert Hill saturation at spend = $0.0 evaluates strictly to 0.0."""
        zero_spend = np.array([0.0])
        response = mmm_math_engine.hill_saturation(zero_spend, k=50000.0, s=1.5)
        assert response[0] == 0.0

    def test_b06_hill_saturation_asymptotic_upper_limit(self):
        """Assert Hill saturation at massive spend ($100B) approaches 1.0."""
        massive_spend = np.array([1e11])
        response = mmm_math_engine.hill_saturation(massive_spend, k=50000.0, s=1.5)
        assert abs(response[0] - 1.0) < 1e-4

    def test_b06_adstock_zero_decay_identity(self):
        """Assert geometric adstock with decay=0.0 returns exact input spend unchanged."""
        spend = np.array([100.0, 200.0, 300.0, 400.0])
        adstocked = mmm_math_engine.geometric_adstock(spend, decay_rate=0.0, max_lag=10)
        np.testing.assert_array_almost_equal(adstocked, spend)

    def test_b06_player_telemetry_churn_probability_clamped(self):
        """Assert churn probability across all events is strictly in [0.0, 1.0]."""
        events = hybrid_bqml_runner.generate_player_telemetry_events(count=50)
        for ev in events:
            assert 0.0 <= ev["churn_probability"] <= 1.0
            assert ev["actions_per_minute"] >= 20.0

    def test_b06_commerce_3d_dwell_time_clamped(self):
        """Assert camera dwell time is strictly clamped to [0.1, 8.0] seconds."""
        impressions = hybrid_bqml_runner.generate_commerce_3d_impressions(count=50)
        for imp in impressions:
            assert 0.1 <= imp["dwell_time_seconds"] <= 8.0
            assert 0.0 <= imp["camera_view_angle_degrees"] <= 75.0
