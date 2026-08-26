"""Comprehensive Unit & Acceptance Test Suite for 00-data-foundation."""

import json
import os
import subprocess
import sys
from pathlib import Path
import pytest
import numpy as np

from config import config
from generators.mmm_math_engine import mmm_math_engine
from generators.geospine_generator import geospine_generator, TOP_25_NIELSEN_DMAS
from generators.hybrid_bqml_runner import hybrid_bqml_runner


BASE_DIR = Path(__file__).resolve().parent.parent


def test_remote_model_endpoint_gemini_37():
    """Verify that BigQuery Vertex AI remote model is configured for gemini-3.7-flash."""
    # 1. Check config.py
    assert config.remote_endpoint == "gemini-3.7-flash", (
        f"Expected config.remote_endpoint to be 'gemini-3.7-flash', got '{config.remote_endpoint}'"
    )

    # 2. Check 01_setup_remote_model.sql
    sql_file = BASE_DIR / "sql" / "01_setup_remote_model.sql"
    assert sql_file.exists(), f"Missing {sql_file}"
    sql_content = sql_file.read_text(encoding="utf-8")
    assert "gemini-3.7-flash" in sql_content, "01_setup_remote_model.sql must specify endpoint = 'gemini-3.7-flash'"
    assert "ea_measurement.gemini_flash_model" in sql_content


def test_bigquery_ddl_schemas():
    """Verify that BigQuery DDL defines all required tables and fields."""
    sql_file = BASE_DIR / "sql" / "02_create_datasets_and_tables.sql"
    assert sql_file.exists(), f"Missing {sql_file}"
    sql_content = sql_file.read_text(encoding="utf-8")

    # 1. Verify fct_cross_franchise_fatigue and all 11 fields
    assert "ea_measurement.fct_cross_franchise_fatigue" in sql_content
    fatigue_fields = [
        "campaign_id",
        "target_franchise",
        "conflicting_franchise",
        "flight_start",
        "flight_end",
        "shared_ea_id_overlap_pct",
        "ad_fatigue_suppression_penalty_pct",
        "net_bookings_risk_usd",
        "recommended_timeline_shift_days",
        "projected_net_bookings_recovery_usd",
        "created_at",
    ]
    for field in fatigue_fields:
        assert field in sql_content, f"Missing field '{field}' in fct_cross_franchise_fatigue DDL"

    # 2. Verify fct_creative_shapley_marginal_lift and all 10 fields
    assert "ea_measurement.fct_creative_shapley_marginal_lift" in sql_content
    shapley_fields = [
        "asset_id",
        "franchise",
        "feature_name",
        "feature_category",
        "funnel_tier",
        "marginal_ctr_lift_pct",
        "marginal_cti_lift_pct",
        "marginal_d7_roas_multiplier",
        "confidence_score",
        "updated_at",
    ]
    for field in shapley_fields:
        assert field in sql_content, f"Missing field '{field}' in fct_creative_shapley_marginal_lift DDL"

    # 3. Verify dim_metro_geospine updated fields
    geospine_fields = [
        "dma_code",
        "google_ads_metro_code",
        "metro_name",
        "nielsen_rank",
        "population_weight",
        "esports_cluster_tag",
    ]
    for field in geospine_fields:
        assert field in sql_content, f"Missing field '{field}' in dim_metro_geospine DDL"

    # 4. Verify fct_geospine_daily_metro elasticity & shock fields
    daily_fields = [
        "indoor_gaming_elasticity_multiplier",
        "lead_shock_t3_elasticity",
        "lead_shock_t5_elasticity",
        "lead_shock_t8_elasticity",
        "lead_shock_t15_elasticity",
    ]
    for field in daily_fields:
        assert field in sql_content, f"Missing field '{field}' in fct_geospine_daily_metro DDL"


def test_geospine_25_nielsen_dmas_and_weathernext():
    """Verify 25 Nielsen DMAs, 210 DMA spine, WeatherNext shocks, and bounded elasticity."""
    dmas = geospine_generator.generate_all_210_dmas()
    assert len(dmas) == 210, f"Expected 210 DMAs, got {len(dmas)}"

    dma_codes = {d["dma_code"] for d in dmas}
    assert len(dma_codes) == 210, "DMA codes must be unique"

    top25 = [d for d in dmas if d["nielsen_rank"] <= 25]
    assert len(top25) == 25, f"Expected 25 top Nielsen DMAs, got {len(top25)}"

    # Check top 25 DMA attributes
    for d in top25:
        assert 1 <= d["nielsen_rank"] <= 25
        assert 21140 <= d["google_ads_metro_code"] <= 21190
        assert "metro_name" in d
        assert "esports_cluster_tag" in d
        assert len(d["esports_cluster_tag"]) > 0
        assert 0.01 <= d["population_weight"] <= 0.20
        assert d["population"] > 0
        assert 0.80 <= d["gaming_density_index"] <= 1.50

    # Test calculate_indoor_elasticity bounds [1.0, 1.50]
    # Extreme cold & heavy storm
    e_max = geospine_generator.calculate_indoor_elasticity(temp_anomaly_c=-15.0, precip_mm=100.0, agreement=1.0)
    assert e_max == 1.50, f"Expected 1.50 upper clamp, got {e_max}"

    # Baseline warm/dry
    e_min = geospine_generator.calculate_indoor_elasticity(temp_anomaly_c=5.0, precip_mm=0.0, agreement=0.0)
    assert e_min == 1.00, f"Expected 1.00 lower clamp, got {e_min}"

    # Moderate storm
    e_mod = geospine_generator.calculate_indoor_elasticity(temp_anomaly_c=-6.0, precip_mm=25.0, agreement=0.85)
    assert 1.0 < e_mod < 1.50

    # Test Weather Shock Matrix
    shock_matrix = geospine_generator.generate_weather_shock_matrix()
    assert len(shock_matrix) == 25
    for item in shock_matrix:
        assert "dma_code" in item
        assert "metro_name" in item
        assert "t3_lead_shock" in item
        assert "t5_lead_shock" in item
        assert "t8_lead_shock" in item
        assert "t15_lead_shock" in item
        assert 1.0 <= item["indoor_gaming_elasticity_multiplier"] <= 1.50
        assert "recommended_pacing_action" in item

    # Test Daily metro facts lead shocks
    daily_facts = geospine_generator.generate_daily_metro_facts(dmas, days_count=10)
    assert len(daily_facts) > 0
    for fact in daily_facts[:50]:
        assert 1.0 <= fact["indoor_gaming_elasticity_multiplier"] <= 1.50
        assert 1.0 <= fact["lead_shock_t3_elasticity"] <= 1.50
        assert 1.0 <= fact["lead_shock_t5_elasticity"] <= 1.50
        assert 1.0 <= fact["lead_shock_t8_elasticity"] <= 1.50
        assert 1.0 <= fact["lead_shock_t15_elasticity"] <= 1.50


def test_2d_shapley_marginal_lift_values():
    """Verify 2D Shapley game-theoretic marginal lift values for key creative mechanics."""
    features = hybrid_bqml_runner.generate_creative_shapley_marginal_lift(count=20)
    assert len(features) >= 10

    by_name = {f["feature_name"]: f for f in features}

    # 1. FUT Pack Walkout Jude Bellingham: +4.2% CTR, +32.4% CTI, 3.42x ROAS, LOWER_FUNNEL_MONETIZATION
    assert "FUT Pack Walkout Jude Bellingham" in by_name
    bellingham = by_name["FUT Pack Walkout Jude Bellingham"]
    assert bellingham["franchise"] == "EA Sports FC"
    assert bellingham["marginal_ctr_lift_pct"] == pytest.approx(4.2, abs=0.1)
    assert bellingham["marginal_cti_lift_pct"] == pytest.approx(32.4, abs=0.1)
    assert bellingham["marginal_d7_roas_multiplier"] == pytest.approx(3.42, abs=0.1)
    assert bellingham["feature_category"] == "LOWER_FUNNEL_MONETIZATION"

    # 2. Skill Move / Trick Shot Showcase: +41.0% CTR, -12.1% CTI, 1.85x ROAS, TOP_OF_FUNNEL
    assert "Skill Move / Trick Shot Showcase" in by_name
    trickshots = by_name["Skill Move / Trick Shot Showcase"]
    assert trickshots["franchise"] == "EA Sports FC"
    assert trickshots["marginal_ctr_lift_pct"] == pytest.approx(41.0, abs=0.1)
    assert trickshots["marginal_cti_lift_pct"] == pytest.approx(-12.1, abs=0.1)
    assert trickshots["marginal_d7_roas_multiplier"] == pytest.approx(1.85, abs=0.1)
    assert trickshots["feature_category"] == "TOP_OF_FUNNEL"

    # 3. Apex Mythic Heirloom Inspect: +6.5% CTR, +28.5% CTI, 3.15x ROAS, LOWER_FUNNEL_MONETIZATION
    assert "Apex Mythic Heirloom Inspect" in by_name
    heirloom = by_name["Apex Mythic Heirloom Inspect"]
    assert heirloom["franchise"] == "Apex Legends"
    assert heirloom["marginal_ctr_lift_pct"] == pytest.approx(6.5, abs=0.1)
    assert heirloom["marginal_cti_lift_pct"] == pytest.approx(28.5, abs=0.1)
    assert heirloom["marginal_d7_roas_multiplier"] == pytest.approx(3.15, abs=0.1)
    assert heirloom["feature_category"] == "LOWER_FUNNEL_MONETIZATION"

    # 4. Apex Superglide / Tap-Strafe: +38.0% CTR, -9.0% CTI, 1.92x ROAS, TOP_OF_FUNNEL
    assert "Apex Superglide / Tap-Strafe" in by_name
    superglide = by_name["Apex Superglide / Tap-Strafe"]
    assert superglide["franchise"] == "Apex Legends"
    assert superglide["marginal_ctr_lift_pct"] == pytest.approx(38.0, abs=0.1)
    assert superglide["marginal_cti_lift_pct"] == pytest.approx(-9.0, abs=0.1)
    assert superglide["marginal_d7_roas_multiplier"] == pytest.approx(1.92, abs=0.1)
    assert superglide["feature_category"] == "TOP_OF_FUNNEL"

    # 5. Check 2D Shapley Trade-Off Objects
    bellingham_tradeoff = hybrid_bqml_runner.generate_bellingham_shapley_tradeoff()
    assert bellingham_tradeoff["franchise"] == "EA Sports FC"
    assert 0.0 <= bellingham_tradeoff["funnel_balance_index"] <= 1.0
    assert len(bellingham_tradeoff["features"]) == 2

    apex_tradeoff = hybrid_bqml_runner.generate_apex_shapley_tradeoff()
    assert apex_tradeoff["franchise"] == "Apex Legends"
    assert 0.0 <= apex_tradeoff["funnel_balance_index"] <= 1.0
    assert len(apex_tradeoff["features"]) == 2


def test_cross_franchise_fatigue_collision_scenario():
    """Verify cross-franchise schedule fatigue and the Oct 24-27 collision scenario."""
    scenarios = hybrid_bqml_runner.generate_cross_franchise_fatigue_scenarios()
    assert len(scenarios) >= 1

    collision = hybrid_bqml_runner.generate_collision_scenario_oct24_27()
    assert collision["target_campaign_id"] == "camp-fc27-toty-001"
    assert collision["conflicting_campaign_id"] == "camp-apex-s26-002"
    assert collision["flight_start"] == "2026-10-24"
    assert collision["flight_end"] == "2026-10-27"
    assert collision["shared_ea_id_overlap_pct"] == pytest.approx(42.1, abs=0.1)
    assert collision["ad_fatigue_suppression_penalty_pct"] == pytest.approx(14.5, abs=0.1)
    assert collision["net_bookings_risk_usd"] == pytest.approx(420000.0, abs=1.0)
    assert collision["recommended_timeline_shift_days"] == 3
    assert collision["projected_net_bookings_recovery_usd"] == pytest.approx(420000.0, abs=1.0)
    assert collision["post_mitigation_net_bookings_usd"] == pytest.approx(5130000.0, abs=1.0)
    assert collision["projected_installs"] == 364000
    assert collision["blended_cpi_usd"] == pytest.approx(4.12, abs=0.01)
    assert collision["day7_roas"] == pytest.approx(3.42, abs=0.01)


def test_orchestrator_mock_cli_and_10_exports():
    """Verify orchestrator runs cleanly with --mock and outputs all 10 canonical JSON fixtures."""
    export_dir = BASE_DIR / "exports"
    export_dir.mkdir(parents=True, exist_ok=True)

    # Run orchestrator in mock mode via CLI subprocess
    cmd = [sys.executable, str(BASE_DIR / "orchestrator.py"), "--mock", "--export-dir", str(export_dir)]
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0, f"orchestrator.py failed with output:\nSTDOUT:\n{res.stdout}\nSTDERR:\n{res.stderr}"

    required_fixtures = [
        "dim_metro_geospine.json",
        "fct_weather_shock_matrix.json",
        "fct_cross_franchise_fatigue.json",
        "fct_creative_shapley_marginal_lift.json",
        "fct_collision_scenario_oct24_27.json",
        "fct_channel_performance_daily.json",
        "dim_campaign_taxonomy.json",
        "fct_audience_segments.json",
        "fct_bellingham_shapley_tradeoff.json",
        "fct_apex_shapley_tradeoff.json",
    ]

    for filename in required_fixtures:
        fixture_path = export_dir / filename
        assert fixture_path.exists(), f"Missing required export fixture: {filename}"
        with open(fixture_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert data is not None, f"Empty fixture: {filename}"
        if isinstance(data, list):
            assert len(data) > 0, f"Fixture list {filename} is empty"
        elif isinstance(data, dict):
            assert len(data.keys()) > 0, f"Fixture dict {filename} is empty"


def test_mmm_math_engine_constraints():
    """Verify 3-year MMM spend, Hill saturation response, and portfolio ROAS."""
    spends = mmm_math_engine.generate_3year_daily_spend()
    assert len(spends) == 245280, f"Expected 245,280 spend records, got {len(spends)}"

    total_spend = sum(r["spend_usd"] for r in spends)
    total_rev = sum(r["attributed_revenue_usd"] for r in spends)
    agg_roas = total_rev / total_spend

    # Verify $60M - $120M annual scale (~$98.8M for 3 years)
    assert 60_000_000.0 <= total_spend <= 150_000_000.0
    # Verify portfolio average ROAS strictly within 3.0x - 5.0x
    assert 3.0 <= agg_roas <= 5.0, f"ROAS {agg_roas:.2f}x not in 3.0x - 5.0x range"

    # Verify Hill saturation monotonic property
    s_test = np.array([100.0, 500.0, 2000.0, 10000.0, 50000.0])
    hill_out = mmm_math_engine.hill_saturation(s_test, k=2000.0, s=1.5)
    assert np.all(np.diff(hill_out) > 0), "Hill saturation curve must be monotonically increasing"
    assert hill_out[-1] <= 1.0, "Hill saturation response cannot exceed 1.0"


def test_creative_shap_9grid_quadrants():
    """Verify that all 9 Tactical 9-Grid quadrants are populated."""
    features = hybrid_bqml_runner.generate_creative_shap_attributions(count=120)
    assert len(features) == 120

    quadrants = {f["tactical_quadrant"] for f in features}
    expected_quadrants = {
        "GOLD_MINES", "CORE_DRIVERS", "SATURATED_STARS",
        "UNTAPPED", "WORKHORSES", "EFFICIENCY_RISKS",
        "NOISE", "UNDERPERFORMERS", "MONEY_PITS"
    }
    assert quadrants == expected_quadrants, f"Missing quadrants: {expected_quadrants - quadrants}"


def test_player_telemetry_schema():
    """Verify player telemetry schema and state transitions."""
    events = hybrid_bqml_runner.generate_player_telemetry_events(count=50)
    assert len(events) == 50
    for e in events:
        assert 5.0 <= e["session_length_minutes"] <= 360.0
        assert 20.0 <= e["actions_per_minute"] <= 450.0
        assert 0.0 <= e["churn_probability"] <= 1.0
        assert e["behavioral_state"] in {"High Frustration", "Casual Weekend", "Hardcore Competitor", "Lapsed Whale"}


def test_commerce_3d_dwell_time():
    """Verify IAS camera dwell time distribution is clamped within 0.1s - 8.0s."""
    impressions = hybrid_bqml_runner.generate_commerce_3d_impressions(count=50)
    assert len(impressions) == 50
    for imp in impressions:
        assert 0.1 <= imp["dwell_time_seconds"] <= 8.0
        assert 0.0 <= imp["camera_view_angle_degrees"] <= 75.0
        assert 0.0 <= imp["occlusion_percentage"] <= 100.0
        assert 10.0 <= imp["clearing_cpm_usd"] <= 50.0
        assert 0.80 <= imp["ias_brand_safety_score"] <= 1.0
