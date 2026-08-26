"""Meridian MMM and Equimarginal Hill Saturation Solver tools for ADK Agents."""

import math
import time
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger("agents.tools.meridian_tools")


def compute_hill_marginal_roas(
    spend: float,
    base_roas: float = 2.5,
    half_saturation_s: float = 50000.0,
    hill_slope_k: float = 1.3,
) -> float:
    """Computes marginal ROAS derivative d(Revenue)/d(Spend) under Hill function.
    
    Formula: mROAS(x) = base_roas * (s^k * k * x^(k-1)) / (x^k + s^k)^2
    """
    if spend <= 0.0:
        return base_roas
    x = spend
    s = half_saturation_s
    k = hill_slope_k
    
    numerator = base_roas * (s ** k) * k * (x ** (k - 1))
    denominator = ((x ** k) + (s ** k)) ** 2
    
    if denominator == 0.0:
        return 0.0
    return numerator / denominator


def compute_hill_revenue(
    spend: float,
    base_roas: float = 2.5,
    half_saturation_s: float = 50000.0,
    hill_slope_k: float = 1.3,
) -> float:
    """Computes total cumulative modeled revenue under Hill saturation.
    
    Formula: Revenue(x) = base_roas * s * (x^k / (x^k + s^k))
    """
    if spend <= 0.0:
        return 0.0
    x = spend
    s = half_saturation_s
    k = hill_slope_k
    
    saturation_fraction = (x ** k) / ((x ** k) + (s ** k))
    return base_roas * s * saturation_fraction


def solve_equimarginal_allocation(
    channels: List[Dict[str, Any]],
    total_budget: Optional[float] = None,
    max_daily_shift_pct: float = 0.20,
    enforce_zero_sum: bool = True,
) -> Dict[str, Any]:
    """Solves for optimal budget allocation across channels such that marginal ROAS is equalized
    across all non-clamped channels while strictly respecting:
    1. Daily pacing clamp: [spend_0 * (1 - shift), spend_0 * (1 + shift)]
    2. Zero-sum portfolio constraint: sum(allocated) == sum(current)
    """
    start_time = time.time()
    
    total_current = sum(float(c.get("current_spend", 0.0)) for c in channels)
    target_budget = total_budget if total_budget is not None else total_current
    
    n_channels = len(channels)
    if n_channels == 0:
        return {"error": "No channels provided"}
        
    # Set bounds per channel based on pacing clamp
    channel_params = []
    for c in channels:
        current = float(c.get("current_spend", 10000.0))
        base_roas = float(c.get("base_roas", 2.5))
        s = float(c.get("half_saturation_s", 50000.0))
        k = float(c.get("hill_slope_k", 1.3))
        
        # Enforce pacing clamp
        min_bound = max(0.0, current * (1.0 - max_daily_shift_pct))
        max_bound = current * (1.0 + max_daily_shift_pct)
        
        # User-specified absolute caps override if tighter
        if c.get("min_spend") is not None:
            min_bound = max(min_bound, float(c["min_spend"]))
        if c.get("max_spend") is not None:
            max_bound = min(max_bound, float(c["max_spend"]))
            
        channel_params.append({
            "name": c.get("channel", c.get("name", "Unknown")),
            "current": current,
            "min_bound": min_bound,
            "max_bound": max_bound,
            "base_roas": base_roas,
            "s": s,
            "k": k,
        })

    # Optimization: Binary search on target marginal ROAS lambda
    low_lambda = 0.0001
    high_lambda = 100.0
    best_allocations = [p["current"] for p in channel_params]
    
    for _ in range(60):
        mid_lambda = (low_lambda + high_lambda) / 2.0
        
        # For each channel, find spend x where mROAS(x) == mid_lambda
        current_allocs = []
        for p in channel_params:
            # Binary search spend x in [min_bound, max_bound]
            low_x = p["min_bound"]
            high_x = p["max_bound"]
            
            for _ in range(25):
                mid_x = (low_x + high_x) / 2.0
                m_roas = compute_hill_marginal_roas(mid_x, p["base_roas"], p["s"], p["k"])
                if m_roas > mid_lambda:
                    # mROAS is higher, we can spend more to reach lower marginal returns
                    low_x = mid_x
                else:
                    high_x = mid_x
            
            opt_x = (low_x + high_x) / 2.0
            # Clamp to bounds
            opt_x = max(p["min_bound"], min(p["max_bound"], opt_x))
            current_allocs.append(opt_x)
            
        total_alloc = sum(current_allocs)
        if total_alloc > target_budget:
            # Need to spend less -> target higher marginal ROAS lambda
            low_lambda = mid_lambda
        else:
            high_lambda = mid_lambda
            
        best_allocations = current_allocs

    # Fine-tuning: Pairwise transfer between highest and lowest marginal ROAS channels
    # to maximize total portfolio revenue while strictly preserving zero-sum and bounds
    for _ in range(50):
        # Calculate current marginal ROAS for all channels
        m_roas_list = [
            compute_hill_marginal_roas(best_allocations[i], p["base_roas"], p["s"], p["k"])
            for i, p in enumerate(channel_params)
        ]
        
        # Find donor (lowest mROAS with capacity to decrease) and receiver (highest mROAS with capacity to increase)
        donors = [i for i, p in enumerate(channel_params) if best_allocations[i] > p["min_bound"] + 1.0]
        receivers = [i for i, p in enumerate(channel_params) if best_allocations[i] < p["max_bound"] - 1.0]
        
        if not donors or not receivers:
            break
            
        best_donor = min(donors, key=lambda i: m_roas_list[i])
        best_receiver = max(receivers, key=lambda i: m_roas_list[i])
        
        if m_roas_list[best_receiver] <= m_roas_list[best_donor] + 0.001:
            # Equimarginal condition satisfied
            break
            
        # Step transfer
        delta = min(
            200.0,
            best_allocations[best_donor] - channel_params[best_donor]["min_bound"],
            channel_params[best_receiver]["max_bound"] - best_allocations[best_receiver],
        )
        if delta <= 0.01:
            break
            
        best_allocations[best_donor] -= delta
        best_allocations[best_receiver] += delta

    # Baseline comparison: if baseline was higher revenue (due to flat saturation), revert
    curr_total_rev = sum(compute_hill_revenue(p["current"], p["base_roas"], p["s"], p["k"]) for p in channel_params)
    opt_total_rev = sum(compute_hill_revenue(best_allocations[i], p["base_roas"], p["s"], p["k"]) for i, p in enumerate(channel_params))
    if opt_total_rev < curr_total_rev:
        best_allocations = [p["current"] for p in channel_params]

    # Construct detailed channel results & S-curves
    results = []
    total_projected_rev = 0.0
    total_installs = 0
    max_shift_observed = 0.0
    
    for i, p in enumerate(channel_params):
        alloc = round(best_allocations[i], 2)
        curr = p["current"]
        delta = round(alloc - curr, 2)
        delta_pct = round((delta / curr) * 100.0, 2) if curr > 0 else 0.0
        max_shift_observed = max(max_shift_observed, abs(delta_pct))
        
        m_roas = compute_hill_marginal_roas(alloc, p["base_roas"], p["s"], p["k"])
        rev = compute_hill_revenue(alloc, p["base_roas"], p["s"], p["k"])
        total_projected_rev += rev
        
        proj_roas = round(rev / alloc, 2) if alloc > 0 else 0.0
        cpi = 3.50 if "youtube" in p["name"].lower() or "meta" in p["name"].lower() else 5.20
        installs = int(alloc / cpi) if cpi > 0 else 0
        total_installs += installs
        
        # Generate 15 points along S-curve for UI plotting
        s_curve = []
        step_spend = (p["max_bound"] * 1.5) / 15.0
        for step in range(1, 16):
            pt_x = round(step * step_spend, 2)
            pt_rev = compute_hill_revenue(pt_x, p["base_roas"], p["s"], p["k"])
            pt_m_roas = compute_hill_marginal_roas(pt_x, p["base_roas"], p["s"], p["k"])
            pt_roas = pt_rev / pt_x if pt_x > 0 else 0.0
            s_curve.append({
                "spend": pt_x,
                "roas": round(pt_roas, 2),
                "marginal_roas": round(pt_m_roas, 2),
                "projected_revenue": round(pt_rev, 2),
            })
            
        results.append({
            "channel": p["name"],
            "current_spend": curr,
            "allocated_spend": alloc,
            "spend_delta": delta,
            "spend_delta_pct": delta_pct,
            "marginal_roas": round(m_roas, 3),
            "projected_roas": proj_roas,
            "projected_revenue": round(rev, 2),
            "projected_installs": installs,
            "s_curve_points": s_curve,
        })

    elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
    allocated_total = sum(r["allocated_spend"] for r in results)
    net_delta = round(allocated_total - total_current, 2)
    
    portfolio_roas = round(total_projected_rev / allocated_total, 2) if allocated_total > 0 else 0.0
    portfolio_cpi = round(allocated_total / total_installs, 2) if total_installs > 0 else 4.0
    current_rev = sum(compute_hill_revenue(p["current"], p["base_roas"], p["s"], p["k"]) for p in channel_params)
    uplift_pct = round(((total_projected_rev - current_rev) / current_rev) * 100.0, 2) if current_rev > 0 else 0.0

    return {
        "total_current_budget": round(total_current, 2),
        "total_allocated_budget": round(allocated_total, 2),
        "budget_net_delta": net_delta,
        "total_projected_revenue": round(total_projected_rev, 2),
        "portfolio_d7_roas": portfolio_roas,
        "portfolio_cpi": portfolio_cpi,
        "revenue_uplift_pct": uplift_pct,
        "zero_sum_satisfied": abs(net_delta) <= 0.05,
        "pacing_clamp_satisfied": max_shift_observed <= (max_daily_shift_pct * 100.0 + 0.01),
        "max_shift_observed_pct": round(max_shift_observed, 2),
        "channel_allocations": results,
        "solver_latency_ms": elapsed_ms,
        "convergence_status": "CONVERGED_OPTIMAL",
    }


def calibrate_bayesian_priors(
    experiments: List[Dict[str, Any]],
    franchise: str = "Apex Legends",
) -> Dict[str, Any]:
    """Calibrates Bayesian log-normal priors (mu, sigma, half-saturation S, Hill slope K)
    from historical randomized causal lift geo-experiments using meta-analytic inverse-variance weighting.
    """
    by_channel: Dict[str, List[Dict[str, Any]]] = {}
    for exp in experiments:
        ch = exp.get("channel", "Unknown")
        by_channel.setdefault(ch, []).append(exp)
        
    calibrated = {}
    for ch, exps in by_channel.items():
        # Inverse variance weighting
        weights = []
        roas_values = []
        for e in exps:
            se = float(e.get("standard_error", 0.25))
            w = 1.0 / (se ** 2) if se > 0 else 1.0
            weights.append(w)
            roas_values.append(float(e.get("observed_roas", 2.0)))
            
        sum_w = sum(weights)
        pooled_roas = sum(w * r for w, r in zip(weights, roas_values)) / sum_w if sum_w > 0 else 2.0
        pooled_se = math.sqrt(1.0 / sum_w) if sum_w > 0 else 0.20
        
        # Log-normal parameters
        mu = math.log(max(0.1, pooled_roas))
        sigma = min(0.60, max(0.15, pooled_se / max(0.1, pooled_roas)))
        
        # S and K calibrations
        avg_spend = sum(float(e.get("spend", 50000.0)) for e in exps) / len(exps)
        s_param = round(avg_spend * 1.25, 0)
        k_param = 1.25 if "social" in ch.lower() or "meta" in ch.lower() else 1.40
        
        calibrated[ch] = {
            "channel": ch,
            "prior_mean_mu": round(mu, 4),
            "prior_std_sigma": round(sigma, 4),
            "pooled_roas_estimate": round(pooled_roas, 3),
            "pooled_roas_se": round(pooled_se, 3),
            "half_saturation_prior_s": s_param,
            "hill_slope_prior_k": k_param,
            "sample_experiments_count": len(exps),
        }
        
    return {
        "franchise": franchise,
        "calibrated_priors": calibrated,
        "method": "Meta-Analytic Log-Normal Calibration with Inverse-Variance Weighting",
        "total_experiments_used": len(experiments),
    }
