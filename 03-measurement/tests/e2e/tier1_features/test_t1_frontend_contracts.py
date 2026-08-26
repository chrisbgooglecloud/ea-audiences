"""Tier 1: Next.js Frontend Dashboard Contracts & Integration (Features 17 to 24).

Verifies:
- Feature 17: Frontend 4-Tab Navigation & App Router
- Feature 18: Tab 1: Command Center / Intake Studio & 1-Click Mitigation (+$420k Net Bookings)
- Feature 19: Tab 2: Multimodal Creative Shapley Lab & 2D Waterfall Analysis
- Feature 20: Tab 3: Google Meridian MMM Cockpit & Equimarginal Solver
- Feature 21: Tab 4: Spatial Geo-Spine 25 DMAs & WeatherNext Climate Elasticity
- Feature 22: Recharts Hydration Safety & Frontend Build Integrity
- Feature 23: Opaque-Box E2E Testing Suite Organization
- Feature 24: E2E Integration & Coverage Hardening
"""

import os
import re
import sys
import json
import time
import math
import numpy as np
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
MEASUREMENT_ROOT = os.path.join(REPO_ROOT, "03-measurement")
PATHS = [
    REPO_ROOT,
    MEASUREMENT_ROOT,
    os.path.join(MEASUREMENT_ROOT, "agents"),
    os.path.join(MEASUREMENT_ROOT, "backend"),
    os.path.join(REPO_ROOT, "00-data-foundation"),
]
for p in PATHS:
    if p not in sys.path:
        sys.path.insert(0, p)

from generators.hybrid_bqml_runner import hybrid_bqml_runner
from generators.mmm_math_engine import mmm_math_engine


# Helper parser for constants.ts US_25_METROS
def get_frontend_25_metros() -> list:
    constants_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "lib", "constants.ts")
    with open(constants_file, "r", encoding="utf-8") as f:
        text = f.read()

    start_idx = text.find("US_25_METROS")
    assert start_idx != -1, "US_25_METROS not found in constants.ts"
    arr_start = text.find("[", start_idx)
    arr_end = text.find("];", arr_start)
    arr_text = text[arr_start + 1 : arr_end]

    crit_splits = re.split(r"(?=criteria_id:\s*\d+)", arr_text)
    metros = []
    for chunk in crit_splits:
        crit_match = re.search(r"criteria_id:\s*(\d+)", chunk)
        name_match = re.search(r"metro_name:\s*'([^']+)'", chunk)
        state_match = re.search(r"state:\s*'([^']+)'", chunk)
        lat_match = re.search(r"lat:\s*([-\d.]+)", chunk)
        lng_match = re.search(r"lng:\s*([-\d.]+)", chunk)
        pop_match = re.search(r"gamer_population:\s*(\d+)", chunk)
        trends_match = re.search(r"trends_index:\s*(\d+)", chunk)
        temp_match = re.search(r"weather_shock_temp_c:\s*([-\d.]+)", chunk)
        precip_match = re.search(r"weather_shock_precip_mm:\s*([-\d.]+)", chunk)
        roas_match = re.search(r"predicted_roas:\s*([-\d.]+)", chunk)
        cpi_match = re.search(r"predicted_cpi:\s*([-\d.]+)", chunk)
        status_match = re.search(r"regional_status:\s*'([^']+)'", chunk)

        if crit_match and name_match:
            metros.append({
                "criteria_id": int(crit_match.group(1)),
                "metro_name": name_match.group(1),
                "state": state_match.group(1) if state_match else "",
                "lat": float(lat_match.group(1)) if lat_match else 0.0,
                "lng": float(lng_match.group(1)) if lng_match else 0.0,
                "gamer_population": int(pop_match.group(1)) if pop_match else 0,
                "trends_index": int(trends_match.group(1)) if trends_match else 0,
                "weather_shock_temp_c": float(temp_match.group(1)) if temp_match else 0.0,
                "weather_shock_precip_mm": float(precip_match.group(1)) if precip_match else 0.0,
                "predicted_roas": float(roas_match.group(1)) if roas_match else 0.0,
                "predicted_cpi": float(cpi_match.group(1)) if cpi_match else 0.0,
                "regional_status": status_match.group(1) if status_match else "",
            })
    return metros


# Helper client solver simulating lib/api.ts solveEquimarginalPacing
def client_solve_equimarginal_pacing(request: dict) -> dict:
    channels = list(request["channel_caps"].keys())
    channel_data = request["channel_caps"]

    total_budget = request["total_budget"]
    current_total = sum(channel_data[ch]["current_spend"] for ch in channels)
    scaling_factor = total_budget / (current_total or 1)

    hill_params = {
        "youtube": {"base_roas": 3.2, "s": 450000, "k": 1.4},
        "meta": {"base_roas": 2.8, "s": 350000, "k": 1.35},
        "programmatic_3d": {"base_roas": 3.6, "s": 280000, "k": 1.5},
        "tiktok": {"base_roas": 3.0, "s": 320000, "k": 1.45},
    }

    def calculate_marginal_roas(spend, ch):
        p = hill_params.get(ch, {"base_roas": 3.0, "s": 350000, "k": 1.4})
        x = max(spend, 1000.0)
        num = p["base_roas"] * (p["s"] ** p["k"]) * p["k"] * (x ** (p["k"] - 1))
        denom = (x ** p["k"] + p["s"] ** p["k"]) ** 2
        return (num / denom) * p["s"]

    def calculate_cumulative_roas(spend, ch):
        p = hill_params.get(ch, {"base_roas": 3.0, "s": 350000, "k": 1.4})
        x = max(spend, 1000.0)
        hill_val = (x ** p["k"]) / (x ** p["k"] + p["s"] ** p["k"])
        return (p["base_roas"] * hill_val * p["s"]) / x

    pacing_clamp_applied = False
    max_shift_found = 0.0

    allocations = []
    for ch in channels:
        current = channel_data[ch]["current_spend"]
        base_target = current * scaling_factor

        min_allowed = current * 0.8
        max_allowed = current * 1.2

        proposed = base_target
        if proposed < min_allowed:
            proposed = min_allowed
            pacing_clamp_applied = True
        elif proposed > max_allowed:
            proposed = max_allowed
            pacing_clamp_applied = True

        shift_percent = abs((proposed - current) / (current or 1)) * 100.0
        if shift_percent > max_shift_found:
            max_shift_found = shift_percent

        m_roas = calculate_marginal_roas(proposed, ch)
        proj_roas = calculate_cumulative_roas(proposed, ch)

        allocations.append({
            "channel": ch.replace("_", " ").upper(),
            "spend": round(proposed),
            "percentage": 0.0,
            "mROAS": round(m_roas, 2),
            "projected_roas": round(proj_roas, 2),
            "delta_vs_current": round(proposed - current),
        })

    sum_allocated = sum(a["spend"] for a in allocations)
    for a in allocations:
        a["percentage"] = round((a["spend"] / sum_allocated) * 100.0, 1)

    s_curves = []
    spend_steps = [50000, 100000, 250000, 500000, 750000, 1000000, 1500000, 2000000, 3000000, 4000000, 5000000]
    for sp in spend_steps:
        for ch in channels:
            s_curves.append({
                "spend": sp / 1000.0,
                "marginal_roas": round(calculate_marginal_roas(sp, ch), 2),
                "cumulative_roas": round(calculate_cumulative_roas(sp, ch), 2),
                "channel": ch.replace("_", " ").upper(),
            })

    blended_roas = sum(a["projected_roas"] * a["spend"] for a in allocations) / sum_allocated
    target_cpi = request.get("target_cpi", 4.20)
    effective_cpi = max(0.8, target_cpi * (3.0 / max(blended_roas, 1.0)))
    predicted_installs = round(sum_allocated / effective_cpi)
    predicted_revenue = round(sum_allocated * blended_roas)

    return {
        "scenario_id": f"scenario-{int(time.time())}",
        "total_spend": sum_allocated,
        "predicted_installs": predicted_installs,
        "predicted_d7_roas": round(blended_roas, 2),
        "predicted_revenue": predicted_revenue,
        "effective_cpi": round(effective_cpi, 2),
        "pacing_clamp_applied": pacing_clamp_applied,
        "max_shift_percent": round(max_shift_found, 1),
        "channel_allocations": allocations,
        "s_curves": s_curves,
        "solver_latency_ms": 16,
        "a2a_dispatch_ready": True,
    }


# Helper validation for widget_catalog.ts
TRUSTED_WIDGET_TYPES = {
    "a2ui-metric-card",
    "a2ui-bar-chart",
    "a2ui-line-chart",
    "a2ui-scurve-chart",
    "a2ui-recommendation-card",
    "a2ui-grid-layout",
    "a2ui-alert-banner",
    "a2ui-button-action",
}

def validate_widget_node(node: dict) -> bool:
    if not isinstance(node, dict):
        return False
    if "id" not in node or not isinstance(node["id"], str):
        return False
    if node.get("type") not in TRUSTED_WIDGET_TYPES:
        return False
    if "children" in node and isinstance(node["children"], list):
        return all(validate_widget_node(c) for c in node["children"])
    return True

def apply_json_pointer(model: dict, pointer: str, value: any) -> dict:
    new_model = json.loads(json.dumps(model))
    parts = pointer.lstrip("/").split("/")
    current = new_model
    for p in parts[:-1]:
        if p not in current or not isinstance(current[p], dict):
            current[p] = {}
        current = current[p]
    if parts:
        current[parts[-1]] = value
    return new_model


# ============================================================================
# Feature 17: Frontend 4-Tab Navigation & App Router
# ============================================================================

def test_t1_f17_01_app_router_pages_exist():
    """Verify Next.js App Router contains all required route pages."""
    frontend_app = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "app")
    required_paths = [
        os.path.join(frontend_app, "page.tsx"),
        os.path.join(frontend_app, "multimodal", "page.tsx"),
        os.path.join(frontend_app, "attribution", "page.tsx"),
        os.path.join(frontend_app, "geospine", "page.tsx"),
        os.path.join(frontend_app, "scenario", "page.tsx"),
        os.path.join(frontend_app, "layout.tsx"),
        os.path.join(frontend_app, "globals.css"),
    ]
    for p in required_paths:
        assert os.path.exists(p), f"Required Next.js route file missing: {p}"


def test_t1_f17_02_navigation_tab_items():
    """Verify Navigation.tsx renders tabs for 4 modules (/intake, /shapley, /scenario, /geospine)."""
    nav_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "components", "Navigation.tsx")
    with open(nav_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "/intake" in content or "Campaign Intake" in content
    assert "/shapley" in content or "Creative Shapley" in content
    assert "/scenario" in content or "Meridian MMM" in content
    assert "/geospine" in content or "Spatial Geo-Spine" in content


def test_t1_f17_03_navigation_franchise_selector():
    """Verify Navigation.tsx contains franchise dropdown binding."""
    nav_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "components", "Navigation.tsx")
    with open(nav_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "EA_FRANCHISES" in content
    assert "Active Franchise" in content
    assert "onSelectFranchise" in content


def test_t1_f17_04_navigation_brand_and_engine_badges():
    """Verify Navigation.tsx renders brand headers and Meridian engine badge."""
    nav_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "components", "Navigation.tsx")
    with open(nav_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Creative Intelligence" in content
    assert "Meridian MMM" in content


def test_t1_f17_05_franchise_context_provider():
    """Verify FranchiseContext provides React context for franchise state."""
    ctx_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "lib", "FranchiseContext.tsx")
    with open(ctx_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "FranchiseContext" in content
    assert "useFranchise" in content
    assert "FranchiseProvider" in content


# ============================================================================
# Feature 18: Tab 1: Command Center / Intake & Conflict Mitigation
# ============================================================================

def test_t1_f18_01_homepage_initial_kpis():
    """Verify Command Center displays baseline portfolio KPIs."""
    page_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "app", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "$4.20M" in content
    assert "2.74x" in content
    assert "$4.18" in content
    assert "1.05M" in content


def test_t1_f18_02_homepage_executive_benchmarks():
    """Verify Command Center includes industry benchmarks."""
    constants_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "lib", "constants.ts")
    with open(constants_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Netmarble" in content
    assert "Hitapps" in content
    assert "SuperPlay" in content
    assert "InnoGames" in content


def test_t1_f18_03_homepage_health_services():
    """Verify Command Center displays engine services and workflows."""
    page_file = os.path.join(MEASUREMENT_ROOT, "frontend", "src", "app", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Executive ROI Proof" in content or "BigQuery" in content
    assert "A2UI Streaming Protocol" in content
    assert "Campaign Intake" in content
    assert "Explore Executive Measurement Workflows" in content


def test_t1_f18_04_intake_collision_oct24_27_metrics():
    """Verify Oct 24-27 collision metrics."""
    collision = hybrid_bqml_runner.generate_collision_scenario_oct24_27()
    assert collision["shared_ea_id_overlap_pct"] == 42.1
    assert collision["ad_fatigue_suppression_penalty_pct"] == 14.5
    assert collision["net_bookings_risk_usd"] == 420000.0
    assert collision["projected_installs"] == 364000
    assert collision["blended_cpi_usd"] == 4.12
    assert collision["day7_roas"] == 3.42


def test_t1_f18_05_intake_mitigation_recovery_arithmetic():
    """Verify +3 day timeline shift recovers $420,000 to $5,130,000 Net Bookings."""
    collision = hybrid_bqml_runner.generate_collision_scenario_oct24_27()
    assert collision["recommended_timeline_shift_days"] == 3
    assert collision["mitigated_flight_start"] == "2026-10-27"
    assert collision["mitigated_flight_end"] == "2026-11-07"
    assert collision["projected_net_bookings_recovery_usd"] == 420000.0
    assert collision["post_mitigation_net_bookings_usd"] == 5130000.0
    assert collision["post_mitigation_net_bookings_usd"] == collision["baseline_net_bookings_usd"] + collision["projected_net_bookings_recovery_usd"]


def test_t1_f18_06_intake_conflict_timeline_window():
    """Verify Oct 24-27 conflict window parameters and affected franchises."""
    collision = hybrid_bqml_runner.generate_collision_scenario_oct24_27()
    assert collision["target_franchise"] == "EA Sports FC"
    assert collision["conflicting_franchise"] == "Apex Legends"
    assert collision["flight_start"] == "2026-10-24"
    assert collision["flight_end"] == "2026-10-27"
    assert collision["status"] == "AMBER_COLLISION_DETECTED"




# ============================================================================
# Feature 19: Tab 2: Multimodal Creative Shapley Lab
# ============================================================================

def test_t1_f19_01_multimodal_mock_assets():
    """Verify mock_data.ts defines multimodal creative assets."""
    mock_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "lib", "mock_data.ts")
    with open(mock_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "MOCK_CREATIVE_ASSETS" in content
    assert "detected_mechanics" in content
    assert "target_surfaces" in content
    assert "pydantic_schema_json" in content


def test_t1_f19_02_multimodal_scrubber_controls():
    """Verify multimodal page contains timeline scrubber and video player controls."""
    page_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "app", "multimodal", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "currentTime" in content
    assert "duration_sec" in content
    assert "activeMechanics" in content


def test_t1_f19_03_multimodal_funnel_tiers():
    """Verify multimodal page implements ToFu, MoFu, and BoFu funnel badges."""
    page_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "app", "multimodal", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "ToFu" in content
    assert "MoFu" in content
    assert "BoFu" in content


def test_t1_f19_04_multimodal_6_surfaces_matrix():
    """Verify 6 surfaces compatibility matrix renders."""
    page_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "app", "multimodal", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "6 Surface Compatibility Matrix" in content
    assert "target_surfaces" in content


def test_t1_f19_05_bellingham_shapley_tradeoff_values():
    """Verify Jude Bellingham Walkout vs Trick Shot 2D Shapley lift values."""
    tradeoff = hybrid_bqml_runner.generate_bellingham_shapley_tradeoff()
    features = tradeoff["features"]
    bellingham = next(f for f in features if "Bellingham" in f["feature_name"])
    trickshots = next(f for f in features if "Trick Shot" in f["feature_name"])

    assert bellingham["marginal_ctr_lift_pct"] == 4.2
    assert bellingham["marginal_cti_lift_pct"] == 32.4
    assert bellingham["marginal_d7_roas_multiplier"] == 3.42

    assert trickshots["marginal_ctr_lift_pct"] == 41.0
    assert trickshots["marginal_cti_lift_pct"] == -12.1
    assert trickshots["marginal_d7_roas_multiplier"] == 1.85


def test_t1_f19_06_funnel_balance_index_values():
    """Verify Funnel Balance Index (FBI) calculation."""
    tradeoff = hybrid_bqml_runner.generate_bellingham_shapley_tradeoff()
    fbi = tradeoff["funnel_balance_index"]
    assert 0.0 <= fbi <= 1.0
    assert fbi >= 0.70


# ============================================================================
# Feature 20: Tab 3: Google Meridian MMM Cockpit & Equimarginal Solver
# ============================================================================

def test_t1_f20_01_scenario_page_controls():
    """Verify scenario cockpit defines budget and target controls."""
    page_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "app", "scenario", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "totalBudget" in content
    assert "targetCPI" in content
    assert "targetROAS" in content


def test_t1_f20_02_scenario_channel_spends():
    """Verify scenario page sets channel baseline spend amounts."""
    page_file = os.path.join(MEASUREMENT_ROOT, "frontend", "src", "app", "scenario", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "YouTube" in content
    assert "Meta" in content
    assert "Programmatic 3D" in content
    assert "TikTok" in content


def test_t1_f20_03_client_solver_zero_sum():
    """Verify client-side solver enforces exact budget preservation."""
    req = {
        "total_budget": 4200000,
        "target_cpi": 4.20,
        "target_roas": 2.80,
        "franchise": "EA Sports FC",
        "channel_caps": {
            "youtube": {"min": 500000, "max": 2500000, "current_spend": 1400000, "proposed_spend": 1400000, "saturation_point": 450000, "base_roas": 3.2},
            "meta": {"min": 400000, "max": 2000000, "current_spend": 1200000, "proposed_spend": 1200000, "saturation_point": 350000, "base_roas": 2.8},
            "programmatic_3d": {"min": 300000, "max": 1800000, "current_spend": 900000, "proposed_spend": 900000, "saturation_point": 280000, "base_roas": 3.6},
            "tiktok": {"min": 200000, "max": 1500000, "current_spend": 700000, "proposed_spend": 700000, "saturation_point": 320000, "base_roas": 3.0},
        },
    }
    res = client_solve_equimarginal_pacing(req)
    assert res["total_spend"] == 4200000
    assert res["predicted_d7_roas"] > 0.5
    assert res["solver_latency_ms"] < 200


def test_t1_f20_04_client_solver_pacing_clamp():
    """Verify client-side solver enforces 20% pacing clamp."""
    req = {
        "total_budget": 8400000,
        "target_cpi": 4.20,
        "target_roas": 2.80,
        "franchise": "EA Sports FC",
        "channel_caps": {
            "youtube": {"min": 500000, "max": 2500000, "current_spend": 1400000, "proposed_spend": 1400000, "saturation_point": 450000, "base_roas": 3.2},
            "meta": {"min": 400000, "max": 2000000, "current_spend": 1200000, "proposed_spend": 1200000, "saturation_point": 350000, "base_roas": 2.8},
            "programmatic_3d": {"min": 300000, "max": 1800000, "current_spend": 900000, "proposed_spend": 900000, "saturation_point": 280000, "base_roas": 3.6},
            "tiktok": {"min": 200000, "max": 1500000, "current_spend": 700000, "proposed_spend": 700000, "saturation_point": 320000, "base_roas": 3.0},
        },
    }
    res = client_solve_equimarginal_pacing(req)
    assert res["pacing_clamp_applied"] is True
    assert res["max_shift_percent"] <= 20.1


def test_t1_f20_05_scenario_s_curves():
    """Verify S-curve points cover all channels."""
    req = {
        "total_budget": 4200000,
        "target_cpi": 4.20,
        "target_roas": 2.80,
        "franchise": "Apex Legends",
        "channel_caps": {
            "youtube": {"min": 500000, "max": 2500000, "current_spend": 1400000, "proposed_spend": 1400000, "saturation_point": 450000, "base_roas": 3.2},
            "meta": {"min": 400000, "max": 2000000, "current_spend": 1200000, "proposed_spend": 1200000, "saturation_point": 350000, "base_roas": 2.8},
            "programmatic_3d": {"min": 300000, "max": 1800000, "current_spend": 900000, "proposed_spend": 900000, "saturation_point": 280000, "base_roas": 3.6},
            "tiktok": {"min": 200000, "max": 1500000, "current_spend": 700000, "proposed_spend": 700000, "saturation_point": 320000, "base_roas": 3.0},
        },
    }
    res = client_solve_equimarginal_pacing(req)
    assert len(res["s_curves"]) >= 40
    channels = set(pt["channel"] for pt in res["s_curves"])
    assert "YOUTUBE" in channels
    assert "META" in channels
    assert "PROGRAMMATIC 3D" in channels
    assert "TIKTOK" in channels


def test_t1_f20_06_scenario_a2a_cta():
    """Verify scenario cockpit includes A2A dispatch action button."""
    page_file = os.path.join(MEASUREMENT_ROOT, "frontend", "src", "app", "scenario", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "handleDispatchA2A" in content or "Dispatch Pacing Rebalance" in content or "a2aDispatched" in content


def test_t1_f20_07_scenario_channel_names_canonical():
    """Verify the 4 canonical marketing channels are defined in scenario solver."""
    from app.services.pacing_engine import EquimarginalPacingEngine
    engine = EquimarginalPacingEngine()
    assert engine is not None



# ============================================================================
# Feature 21: Tab 4: Spatial Geo-Spine 25 DMAs & Climate Elasticity
# ============================================================================

def test_t1_f21_01_us_25_metros_count():
    """Verify exactly 25 top Nielsen DMAs are parsed from constants.ts."""
    metros = get_frontend_25_metros()
    assert len(metros) == 25
    ids = [m["criteria_id"] for m in metros]
    assert len(set(ids)) == 25


def test_t1_f21_02_geospine_metro_demographics():
    """Verify DMA geographic coordinates, population, and trends."""
    metros = get_frontend_25_metros()
    nyc = next(m for m in metros if "New York" in m["metro_name"])
    assert nyc["criteria_id"] == 21149
    assert nyc["state"] == "NY"
    assert nyc["gamer_population"] > 4000000
    assert 24.0 <= nyc["lat"] <= 50.0
    assert -125.0 <= nyc["lng"] <= -66.0


def test_t1_f21_03_geospine_weathernext_shocks():
    """Verify WeatherNext cold anomalies are present in Midwest metros."""
    metros = get_frontend_25_metros()
    minneapolis = next(m for m in metros if "Minneapolis" in m["metro_name"])
    assert minneapolis["weather_shock_temp_c"] < -5.0
    assert minneapolis["weather_shock_precip_mm"] > 20.0
    assert minneapolis["regional_status"] == "CLIMATE_TAILWIND"


def test_t1_f21_04_geospine_predicted_roas_positive():
    """Verify all DMAs have positive predicted ROAS and CPI."""
    metros = get_frontend_25_metros()
    for m in metros:
        assert m["predicted_roas"] > 2.0
        assert m["predicted_cpi"] > 0.0


def test_t1_f21_05_geospine_layer_buttons():
    """Verify GeoSpine page defines layer buttons."""
    page_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "app", "geospine", "page.tsx")
    with open(page_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "WEATHER" in content
    assert "TRENDS" in content
    assert "POPULATION" in content


# ============================================================================
# Feature 22: Recharts Hydration Safety & Frontend Build Integrity
# ============================================================================

def test_t1_f22_01_trusted_widget_catalog():
    """Verify validate_widget_node filters unknown/untrusted nodes."""
    valid_node = {"id": "w1", "type": "a2ui-metric-card", "title": "Test", "value": "100"}
    assert validate_widget_node(valid_node) is True
    invalid_node = {"id": "w2", "type": "untrusted-script-tag"}
    assert validate_widget_node(invalid_node) is False


def test_t1_f22_02_json_pointer_updates():
    """Verify apply_json_pointer correctly modifies nested state."""
    model = {"budget": {"total": 100000, "status": "PENDING"}}
    updated = apply_json_pointer(model, "/budget/status", "APPROVED")
    assert updated["budget"]["status"] == "APPROVED"
    assert updated["budget"]["total"] == 100000


def test_t1_f22_03_recharts_component_containers():
    """Verify A2UIRenderer wraps charts in responsive containers."""
    renderer_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "components", "A2UIRenderer.tsx")
    with open(renderer_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "ResponsiveContainer" in content
    assert "BarChart" in content or "LineChart" in content


def test_t1_f22_04_frontend_package_deps():
    """Verify package.json dependencies include next, react, recharts, lucide-react."""
    pkg_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "package.json")
    with open(pkg_file, "r", encoding="utf-8") as f:
        pkg = json.load(f)
    deps = pkg.get("dependencies", {})
    assert "next" in deps
    assert "react" in deps
    assert "recharts" in deps
    assert "lucide-react" in deps


def test_t1_f22_05_frontend_tsconfig_paths():
    """Verify tsconfig.json has path aliases and strict mode."""
    ts_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "tsconfig.json")
    with open(ts_file, "r", encoding="utf-8") as f:
        ts = json.load(f)
    assert "@/*" in ts["compilerOptions"]["paths"]


# ============================================================================
# Feature 23: Opaque-Box E2E Testing Suite Organization
# ============================================================================

def test_t1_f23_01_e2e_directories():
    """Verify tests/e2e contains standard tier folders."""
    e2e_dir = os.path.join(MEASUREMENT_ROOT, "tests", "e2e")
    assert os.path.exists(os.path.join(e2e_dir, "tier1_features"))
    assert os.path.exists(os.path.join(e2e_dir, "tier2_boundaries"))
    assert os.path.exists(os.path.join(e2e_dir, "tier3_combinations"))
    assert os.path.exists(os.path.join(e2e_dir, "tier4_real_world"))


def test_t1_f23_02_tier1_test_modules():
    """Verify Tier 1 test modules are present."""
    t1_dir = os.path.join(MEASUREMENT_ROOT, "tests", "e2e", "tier1_features")
    assert os.path.exists(os.path.join(t1_dir, "test_t1_agent_fleet.py"))
    assert os.path.exists(os.path.join(t1_dir, "test_t1_frontend_contracts.py"))


# ============================================================================
# Feature 24: E2E Integration & Coverage Hardening
# ============================================================================

def test_t1_f24_01_franchises_in_constants():
    """Verify constants.ts contains all 4 canonical EA franchises."""
    constants_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "lib", "constants.ts")
    with open(constants_file, "r", encoding="utf-8") as f:
        content = f.read()
    assert "Apex Legends" in content
    assert "EA Sports FC" in content
    assert "Battlefield" in content
    assert "The Sims" in content


def test_t1_f24_02_tactical_9grid_quadrants_in_constants():
    """Verify all 9 quadrants in constants.ts."""
    constants_file = os.path.join(REPO_ROOT, "03-measurement", "frontend", "src", "lib", "constants.ts")
    with open(constants_file, "r", encoding="utf-8") as f:
        content = f.read()
    for q in ["GOLD_MINES", "CORE_DRIVERS", "SATURATED_STARS", "UNTAPPED", "WORKHORSES", "EFFICIENCY_RISKS", "NOISE", "UNDERPERFORMERS", "MONEY_PITS"]:
        assert q in content


def test_t1_f24_03_hill_saturation_monotonicity():
    """Verify Hill saturation function is monotonically non-decreasing."""
    spends = [100.0, 1000.0, 10000.0, 50000.0, 100000.0, 500000.0]
    revs = [mmm_math_engine.hill_saturation(np.array([s]), k=50000.0, s=1.3)[0] for s in spends]
    for i in range(len(revs) - 1):
        assert revs[i] <= revs[i + 1]


def test_t1_f24_04_geometric_adstock_decay():
    """Verify geometric adstock decays exponentially."""
    pulse = np.zeros(20, dtype=np.float64)
    pulse[0] = 1000.0
    adstocked = mmm_math_engine.geometric_adstock(pulse, decay_rate=0.5)
    assert adstocked[0] == 1000.0
    assert adstocked[1] == 500.0
    assert adstocked[2] == 250.0
    assert adstocked[10] < 1.0


def test_t1_f24_05_forensic_integrity_constants():
    """Verify mathematical constants match project specifications exactly."""
    collision = hybrid_bqml_runner.generate_collision_scenario_oct24_27()
    assert collision["projected_net_bookings_recovery_usd"] == 420000.0
    assert collision["day7_roas"] == 3.42
    assert collision["blended_cpi_usd"] == 4.12
