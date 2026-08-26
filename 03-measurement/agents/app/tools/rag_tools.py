"""RAG tools for ADK Agents: Industry ROI Benchmarks, Historical EA Campaign Learnings, and Surface Playbooks."""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger("agents.tools.rag_tools")

# Verified Industry ROI Benchmarks from Executive Research
INDUSTRY_ROI_BENCHMARKS = [
    {
        "publisher": "Netmarble",
        "title": "Solo Leveling: Arise / Seven Knights",
        "benchmark": "+640% ROAS Increase",
        "mechanism": "Shift to Google App Campaigns with tROAS bidding, value-based bidding (VBB), and creative asset experimentation.",
        "relevance_for_ea": "Direct precedent for EA Sports FC and Apex Legends live service acquisition shift to algorithmic value bidding."
    },
    {
        "publisher": "Hitapps",
        "title": "Casual & Puzzle Portfolio",
        "benchmark": "7.7x Daily Revenue Surge, D7 ROAS from 6% to >30%",
        "mechanism": "Predictive AI lifetime value models combined with automated creative cluster exploration.",
        "relevance_for_ea": "Proof that predictive D7 MMM signals eliminate top-of-funnel ad spend waste."
    },
    {
        "publisher": "SuperPlay",
        "title": "Dice Dreams / Domino Dreams",
        "benchmark": ">100% ROAS Profitability on Mature Cohorts, +38% D30 ARPU",
        "mechanism": "AI-driven multi-touch acquisition and creative fatigue pacing.",
        "relevance_for_ea": "Demonstrates why creative saturation detection and 20% daily pacing clamps sustain high ARPU."
    },
    {
        "publisher": "InnoGames",
        "title": "Forge of Empires",
        "benchmark": "-85% Android CPI Reduction",
        "mechanism": "Automated multimodal gameplay feature extraction and dynamic creative iteration across marketing surfaces.",
        "relevance_for_ea": "Blueprint for EA's 6 Core Surfaces taxonomy and automated storybeat tagging."
    }
]

# Historical EA Franchise Feature Learnings
HISTORICAL_FEATURE_LEARNINGS = [
    {
        "franchise": "Apex Legends",
        "feature_name": "Squad Breach & Clear",
        "feature_type": "game_mechanic",
        "historical_roas_impact": 3.85,
        "frequency_band": "LOW",
        "quadrant": "GOLD_MINES",
        "learning": "High adrenaline team-play moments in first 3 seconds produce highest D7 conversion rate in competitive shooter demographics."
    },
    {
        "franchise": "Apex Legends",
        "feature_name": "Character Lore Dialogue",
        "feature_type": "visual_hook",
        "historical_roas_impact": 3.10,
        "frequency_band": "LOW",
        "quadrant": "GOLD_MINES",
        "learning": "Deep Titanfall universe references trigger strong nostalgia in lapsed players without alienating newcomers."
    },
    {
        "franchise": "Apex Legends",
        "feature_name": "Generic Battle Pass Tier Grid",
        "feature_type": "visual_hook",
        "historical_roas_impact": 0.65,
        "frequency_band": "HIGH",
        "quadrant": "MONEY_PITS",
        "learning": "Static cosmetic grids trigger monetisation friction and Reddit backlash. Replace with in-engine dynamic gameplay showcase."
    },
    {
        "franchise": "EA Sports FC",
        "feature_name": "FUT Pack Dynamic Walkout",
        "feature_type": "game_mechanic",
        "historical_roas_impact": 4.20,
        "frequency_band": "MEDIUM",
        "quadrant": "CORE_DRIVERS",
        "learning": "Dynamic player walkout animation drives highest MoFu->BoFu microtransaction intent across mobile and companion apps."
    },
    {
        "franchise": "EA Sports FC",
        "feature_name": "Real Stadium Audio Ambience",
        "feature_type": "audio_cue",
        "historical_roas_impact": 3.45,
        "frequency_band": "MEDIUM",
        "quadrant": "CORE_DRIVERS",
        "learning": "Licensed chant audio increases pause screen click-through by 44% during live weekend broadcasts."
    },
    {
        "franchise": "Battlefield",
        "feature_name": "Destructive Levolution Event",
        "feature_type": "game_mechanic",
        "historical_roas_impact": 3.90,
        "frequency_band": "LOW",
        "quadrant": "GOLD_MINES",
        "learning": "Skyscraper collapse or weather tornado renders dominate YouTube pre-roll engagement."
    },
    {
        "franchise": "The Sims",
        "feature_name": "Custom Building Timelapse",
        "feature_type": "visual_hook",
        "historical_roas_impact": 3.60,
        "frequency_band": "LOW",
        "quadrant": "GOLD_MINES",
        "learning": "Speed-build timelapses in TikTok 9:16 format achieve 3x organic repost multiplier."
    }
]


def query_roi_benchmarks(query: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve industry ROI benchmarks for executive justifications (Netmarble, Hitapps, SuperPlay, InnoGames).
    
    Args:
        query: Optional filter string for publisher or keyword.
    """
    if not query:
        return INDUSTRY_ROI_BENCHMARKS
    q = query.lower()
    return [
        b for b in INDUSTRY_ROI_BENCHMARKS
        if q in b["publisher"].lower() or q in b["title"].lower() or q in b["benchmark"].lower() or q in b["mechanism"].lower()
    ]


def query_feature_knowledge(
    franchise: str = "Apex Legends",
    quadrant: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve historical campaign performance learnings and SHAP attribution insights for creative features.
    
    Args:
        franchise: EA Game Franchise.
        quadrant: Optional quadrant filter (e.g. 'GOLD_MINES', 'MONEY_PITS').
    """
    results = [f for f in HISTORICAL_FEATURE_LEARNINGS if f["franchise"].lower() == franchise.lower()]
    if not results:
        results = HISTORICAL_FEATURE_LEARNINGS
        
    if quadrant:
        results = [f for f in results if f["quadrant"].upper() == quadrant.upper()]
        
    return results
