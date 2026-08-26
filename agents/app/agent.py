"""Root Orchestrator Agent for EA Audiences & DeepSona Multi-Agent Fleet (01-audiences)."""

import os
import json
import logging
from typing import Dict, List, Any, Optional

from agents.app.sub_agents.deepsona_agent import DeepSonaAgent, create_deepsona_agent
from agents.app.sub_agents.audience_agent import AudienceAgent, create_audience_agent
from agents.app.sub_agents.scoring_agent import ScoringAgent, create_scoring_agent
from agents.app.protocols.a2a_protocol import (
    register_agent_handler,
    create_a2a_message,
    route_a2a_message,
    get_conversation_history,
)

logger = logging.getLogger("ea.audiences.agent")


class JamieRootOrchestratorAgent:
    """Master Orchestrator Agent for Act 1: 01-audiences (Jamie Pourturk).
    Coordinates Identity Resolution, NL Audience Building, DeepSona Synthetic Persona Simulation,
    and cross-act A2A negotiation with Curtis (02-creative-insights), Pat (03-measurement), and Surya (04-commerce-media).
    """

    def __init__(self, model_name: str = "gemini-3.6-flash"):
        self.model_name = model_name
        self.deepsona_agent = create_deepsona_agent()
        self.audience_agent = create_audience_agent()
        self.scoring_agent = create_scoring_agent()

        # Register A2A protocol bus handlers
        self._register_a2a_handlers()

    def _register_a2a_handlers(self):
        """Registers inter-agent dispatchers on the A2A bus."""

        def handle_deepsona_simulation(msg: Dict[str, Any]) -> Dict[str, Any]:
            payload = msg.get("payload", {})
            campaign_id = payload.get("campaign_id", "camp-fc26-champs-retention")
            franchise = payload.get("franchise", "EA SPORTS FC 26")
            creative_title = payload.get("creative_title", "FUT Champions Weekend League Retention & Tilt Shield")
            proposed_spend = payload.get("proposed_spend", 120000.0)
            target_roas = payload.get("target_roas", 2.45)
            archetypes = payload.get("archetypes", [
                "COMPETITIVE_GRINDER", "ULTIMATE_TEAM_WHALE", "CASUAL_SOCIALIZER", "LORE_SEEKER"
            ])

            res = self.deepsona_agent.simulate_campaign_reaction(
                campaign_id=campaign_id,
                franchise=franchise,
                creative_title=creative_title,
                proposed_spend=proposed_spend,
                target_roas=target_roas,
                target_archetypes=archetypes,
            )
            return res.model_dump()

        def handle_audience_query(msg: Dict[str, Any]) -> Dict[str, Any]:
            payload = msg.get("payload", {})
            query_str = payload.get("query", "Show high churn risk FUT Champions players")
            franchise = payload.get("franchise", "EA SPORTS FC 26")
            res = self.audience_agent.query_audience(query_str, franchise=franchise)
            return res.model_dump()

        register_agent_handler("Jamie_DeepSonaAgent", handle_deepsona_simulation)
        register_agent_handler("Jamie_AudienceAgent", handle_audience_query)
        logger.info("✅ JamieRootOrchestratorAgent registered A2A handlers successfully.")

    def emit_audience_brief_to_creative_insights(
        self,
        friction_point: str = "FUT Champions Weekend League Extra-Time Loss Tilt",
        target_archetype: str = "COMPETITIVE_GRINDER",
        creative_agent_name: str = "Curtis_CreativeStudioAgent",
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Outbound A2A Contract: Sends AudienceBrief with telemetry churn friction points to Curtis Gross (`02-creative-insights`)."""
        payload = {
            "intent": "AUDIENCE_BRIEF_HANDOFF",
            "friction_point": friction_point,
            "target_archetype": target_archetype,
            "recommended_focus": "Lead with 2s high-intensity action hook highlighting loan R9 Icon and Weekend League re-entry shield.",
            "urgency": "HIGH",
        }
        msg = create_a2a_message(
            sender="Jamie_DeepSonaAgent",
            recipient=creative_agent_name,
            intent="EMIT_AUDIENCE_BRIEF",
            payload=payload,
            correlation_id=correlation_id,
        )
        response = route_a2a_message(msg)
        return {"dispatched_message": msg, "response": response}

    def emit_player_context_to_commerce_media(
        self,
        cohort_id: str = "cohort-fc26-whales",
        ad_server_agent_name: str = "Surya_CommerceMediaAgent",
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Outbound A2A Contract: Passes real-time player telemetry context to Surya Kunju (`04-commerce-media`)."""
        payload = {
            "intent": "PLAYER_CONTEXT_FEED",
            "cohort_id": cohort_id,
            "target_surfaces": ["STADIUM_BOARDS", "PAUSE_SCREENS"],
            "suggested_cpm_floor": 18.50,
        }
        msg = create_a2a_message(
            sender="Jamie_DeepSonaAgent",
            recipient=ad_server_agent_name,
            intent="PUSH_PLAYER_CONTEXT",
            payload=payload,
            correlation_id=correlation_id,
        )
        response = route_a2a_message(msg)
        return {"dispatched_message": msg, "response": response}


# Global agent instance
root_agent = JamieRootOrchestratorAgent()
