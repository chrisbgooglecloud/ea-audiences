"""Integration Tests for FastAPI Endpoints and Microservices Routers."""

import pytest
from fastapi.testclient import TestClient


def test_intake_simulate_endpoint(client: TestClient):
    """Test POST /api/v1/intake/simulate with standard FC 27 collision payload."""
    payload = {
        "campaign_id": "camp-fc27-toty-001",
        "campaign_name": "EA FC 27 TOTY Mid-Season Push",
        "franchise": "EA Sports FC",
        "flight_start": "2026-10-24",
        "flight_end": "2026-10-27",
        "total_budget": 1500000.0,
        "apply_mitigation": False,
    }
    response = client.post("/api/v1/intake/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["kpi_projection"]["projected_installs"] == 364000
    assert data["fatigue_analysis"]["collision_detected"] is True
    assert data["fatigue_analysis"]["shared_ea_id_overlap_pct"] == 42.1
    assert data["fatigue_analysis"]["ad_fatigue_suppression_penalty_pct"] == 14.5


def test_intake_simulate_mitigated_endpoint(client: TestClient):
    """Test POST /api/v1/intake/simulate with apply_mitigation=True."""
    payload = {
        "campaign_id": "camp-fc27-toty-001",
        "campaign_name": "EA FC 27 TOTY Mid-Season Push",
        "franchise": "EA Sports FC",
        "flight_start": "2026-10-27",
        "flight_end": "2026-11-07",
        "total_budget": 1500000.0,
        "apply_mitigation": True,
    }
    response = client.post("/api/v1/intake/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["fatigue_analysis"]["status"] == "MITIGATED_COLLISION_CLEARED"
    assert data["kpi_projection"]["effective_net_bookings_usd"] == 5130000.0


def test_intake_collision_scenarios_and_lookup(client: TestClient):
    """Test GET /api/v1/intake/collision-scenarios and simulation ID lookup."""
    scenarios_res = client.get("/api/v1/intake/collision-scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()
    assert len(scenarios) >= 3

    # Post simulation and retrieve by ID
    sim_res = client.post("/api/v1/intake/simulate", json={})
    assert sim_res.status_code == 200
    sim_id = sim_res.json()["simulation_id"]

    lookup_res = client.get(f"/api/v1/intake/simulations/{sim_id}")
    assert lookup_res.status_code == 200
    assert lookup_res.json()["simulation_id"] == sim_id


def test_shapley_pretest_endpoint(client: TestClient):
    """Test POST /api/v1/shapley/pretest returns 2D lift metrics and FBI."""
    payload = {
        "asset_title": "EA SPORTS FC 27 - Official Gameplay Trailer (15s Pre-Test)",
        "franchise": "EA Sports FC",
        "video_duration_seconds": 15.0,
    }
    response = client.post("/api/v1/shapley/pretest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert 0.0 <= data["funnel_balance_index"] <= 1.0
    assert len(data["features"]) >= 2
    assert len(data["waterfall_breakdown"]) >= 2


def test_shapley_benchmarks_and_lookup(client: TestClient):
    """Test GET /api/v1/shapley/benchmarks and audit ID lookup."""
    bench_res = client.get("/api/v1/shapley/benchmarks")
    assert bench_res.status_code == 200
    benchmarks = bench_res.json()
    assert len(benchmarks) >= 2

    # Post pretest audit and retrieve by ID
    audit_res = client.post("/api/v1/shapley/pretest", json={})
    assert audit_res.status_code == 200
    audit_id = audit_res.json()["audit_id"]

    lookup_res = client.get(f"/api/v1/shapley/audits/{audit_id}")
    assert lookup_res.status_code == 200
    assert lookup_res.json()["audit_id"] == audit_id


def test_meridian_solve_endpoint(client: TestClient):
    """Test POST /api/v1/meridian/solve satisfies zero-sum and returns fast."""
    payload = {
        "campaign_id": "camp-fc27-toty-001",
        "franchise": "EA Sports FC",
        "total_budget": 1500000.0,
        "channels": [
            {"channel": "YouTube", "current_spend": 500000.0, "base_roas": 3.5, "half_saturation_s": 600000.0, "hill_slope_k": 1.3},
            {"channel": "TikTok", "current_spend": 500000.0, "base_roas": 3.8, "half_saturation_s": 500000.0, "hill_slope_k": 1.4},
            {"channel": "Meta", "current_spend": 500000.0, "base_roas": 2.8, "half_saturation_s": 400000.0, "hill_slope_k": 1.2},
        ],
        "max_daily_shift_pct": 0.20,
        "enforce_zero_sum": True,
    }
    response = client.post("/api/v1/meridian/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["zero_sum_satisfied"] is True
    assert data["pacing_clamp_satisfied"] is True
    assert "X-Process-Time-Ms" in response.headers


def test_meridian_solve_pacing_alias(client: TestClient):
    """Test POST /api/v1/meridian/solve-pacing alias returns 200."""
    payload = {
        "campaign_id": "camp-apex-001",
        "franchise": "Apex Legends",
        "channels": [
            {"channel": "Twitch", "current_spend": 200000.0, "base_roas": 3.0, "half_saturation_s": 300000.0, "hill_slope_k": 1.3},
            {"channel": "YouTube", "current_spend": 300000.0, "base_roas": 3.2, "half_saturation_s": 400000.0, "hill_slope_k": 1.35},
        ],
    }
    response = client.post("/api/v1/meridian/solve-pacing", json=payload)
    assert response.status_code == 200


def test_health_check_endpoints(client: TestClient):
    """Test /healthz and /api/health include all active services."""
    for path in ["/healthz", "/api/health"]:
        response = client.get(path)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "UP"
        assert data["services"]["pacing_engine"] == "ACTIVE"
        assert data["services"]["campaign_intake_service"] == "ACTIVE"
        assert data["services"]["shapley_service"] == "ACTIVE"
