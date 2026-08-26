"""Root Orchestrator Agent for EA Creative Intelligence & Agentic Measurement Fleet."""

import os
import json
import logging
from typing import Dict, List, Any, Optional

from agents.app.sub_agents.tagging_agent import TaggingAgent, create_tagging_agent
from agents.app.sub_agents.analytics_agent import AnalyticsAgent, create_analytics_agent
from agents.app.sub_agents.media_buying_agent import MediaBuyingAgent, create_media_buying_agent
from agents.app.tools.bq_tools import query_geospine_metro, query_weather_shocks
from agents.app.tools.firestore_tools import get_campaign, save_agent_state
from agents.app.tools.meridian_tools import solve_equimarginal_allocation, calibrate_bayesian_priors
from agents.app.tools.rag_tools import query_roi_benchmarks, query_feature_knowledge
from agents.app.protocols.a2a_protocol import register_agent_handler, create_a2a_message, route_a2a_message
from agents.app.protocols.a2ui_protocol import A2UIProtocolGenerator

logger = logging.getLogger("agents.app.agent")


class RootOrchestratorAgent:
    """Master Orchestrator Agent coordinating Tagging, Analytics, and Media Buying sub-agents,
    with outbound A2A protocol dispatchers to Jamie (01-audiences), Curtis (03-creative-insights),
    and Surya (04-commerce-media).
    """

    def __init__(self, model_name: str = "gemini-3.6-flash"):
        self.model_name = model_name
        self.tagging_agent = create_tagging_agent()
        self.analytics_agent = create_analytics_agent()
        self.media_buying_agent = create_media_buying_agent()
        
        # Register A2A bus handlers
        self._register_a2a_handlers()

    def _register_a2a_handlers(self):
        """Registers inter-agent dispatchers on the A2A protocol bus."""
        
        def handle_tagging(msg: Dict[str, Any]) -> Dict[str, Any]:
            payload = msg.get("payload", {})
            franchise = payload.get("franchise", "Apex Legends")
            res = self.tagging_agent.analyze_creative(
                asset_id=payload.get("asset_id", "asset-a2a-req"),
                franchise=franchise,
                custom_instructions=payload.get("action_required"),
            )
            return {"status": "SUCCESS", "creative_metadata": res.model_dump()}

        def handle_media_buying(msg: Dict[str, Any]) -> Dict[str, Any]:
            payload = msg.get("payload", {})
            channels = payload.get("channels", [
                {"channel": "YouTube Paid", "current_spend": 120000.0, "base_roas": 3.2},
                {"channel": "Meta Ads", "current_spend": 90000.0, "base_roas": 2.8},
                {"channel": "TikTok", "current_spend": 70000.0, "base_roas": 2.4},
                {"channel": "Programmatic 3D", "current_spend": 40000.0, "base_roas": 1.9},
            ])
            res = self.media_buying_agent.execute_budget_reallocation(channels)
            return {"status": "SUCCESS", "optimization": res}

        def handle_analytics(msg: Dict[str, Any]) -> Dict[str, Any]:
            payload = msg.get("payload", {})
            insights = self.analytics_agent.explain_attribution_insights(
                franchise=payload.get("franchise", "Apex Legends")
            )
            return {"status": "SUCCESS", "insights": insights}

        register_agent_handler("TaggingAgent", handle_tagging)
        register_agent_handler("MediaBuyingAgent", handle_media_buying)
        register_agent_handler("AnalyticsAgent", handle_analytics)

    def route_request(self, user_prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Routes natural language user request to appropriate sub-agent or coordinates multi-agent workflow."""
        prompt_lower = user_prompt.lower()
        ctx = context or {}
        franchise = ctx.get("franchise", "Apex Legends")
        
        # 1. Gamer Persona Outbound A2A Check (Routes to Jamie's DeepSona Agent)
        if any(w in prompt_lower for w in ["persona", "deepsona", "bare", "friction", "focus group", "player reaction"]):
            sim_res = self.media_buying_agent.request_persona_simulation(
                campaign_id=ctx.get("campaign_id", "camp-apex-s22-relaunch"),
                target_roas=ctx.get("target_roas", 2.45),
                creative_title=ctx.get("creative_title", "Apex Season 22 Squad Breach Cut"),
                franchise=franchise,
                proposed_spend=ctx.get("proposed_spend", 120000.0),
            )
            return {
                "route": "MediaBuyingAgent->Jamie_DeepSonaAgent",
                "message": f"Dispatched outbound A2A simulation request to Jamie's DeepSona Service for '{franchise}'.",
                "results": sim_res,
            }

        # 2. Multimodal Tagging & Ingestion
        elif any(w in prompt_lower for w in ["tag", "multimodal", "video", "mechanic", "surface", "storybeat"]):
            res = self.tagging_agent.analyze_creative(
                asset_id=ctx.get("asset_id", "asset-sample-01"),
                franchise=franchise,
                custom_instructions=user_prompt,
            )
            return {
                "route": "TaggingAgent",
                "message": f"Extracted {len(res.detected_mechanics)} mechanics and {len(res.target_surfaces)} surfaces.",
                "results": res.model_dump(),
            }

        # 3. Media Buying & Equimarginal Budget Reallocation
        elif any(w in prompt_lower for w in ["budget", "allocate", "pacing", "meridian", "reallocate", "s-curve", "hill"]):
            channels = ctx.get("channels", [
                {"channel": "YouTube Paid", "current_spend": 120000.0, "base_roas": 3.2},
                {"channel": "Meta Ads", "current_spend": 90000.0, "base_roas": 2.8},
                {"channel": "TikTok", "current_spend": 70000.0, "base_roas": 2.4},
                {"channel": "Programmatic 3D", "current_spend": 40000.0, "base_roas": 1.9},
            ])
            res = self.media_buying_agent.execute_budget_reallocation(
                channels=channels,
                total_budget=ctx.get("total_budget"),
            )
            return {
                "route": "MediaBuyingAgent",
                "message": f"Equimarginal optimization complete with zero-sum net delta ${res['budget_net_delta']}.",
                "results": res,
            }

        # 4. Analytics, SHAP Explainability & 9-Grid Attribution
        elif any(w in prompt_lower for w in ["attribution", "shap", "9-grid", "matrix", "explain", "roi", "netmarble", "benchmark"]):
            insights = self.analytics_agent.explain_attribution_insights(franchise=franchise)
            return {
                "route": "AnalyticsAgent",
                "message": f"Tactical 9-Grid attribution analysis completed for {franchise}.",
                "results": insights,
            }

        # Default: Full Composite Autonomous Workflow
        else:
            # Multi-agent composite pipeline
            tags = self.tagging_agent.analyze_creative("asset-sample-01", franchise=franchise)
            grid = self.analytics_agent.generate_tactical_grid(franchise=franchise)
            insights = self.analytics_agent.explain_attribution_insights(franchise=franchise, points=grid)
            return {
                "route": "OrchestratorComposite",
                "message": f"EA Multi-Agent Fleet composite intelligence summary for '{franchise}'.",
                "tagging_summary": tags.model_dump(),
                "insights": insights,
            }


# Module instance
root_agent = RootOrchestratorAgent()
