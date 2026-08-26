"""Media Buying Micro-Agent: Equimarginal Pacing, Budget Solver & A2A Negotiation Runtime."""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from agents.app.tools.meridian_tools import solve_equimarginal_allocation
from agents.app.protocols.a2a_protocol import create_a2a_message, route_a2a_message

logger = logging.getLogger("agents.sub_agents.media_buying_agent")


class MediaBuyingAgent:
    """ADK Media Buying Micro-Agent powered by gemini-3.5-flash-lite, Equimarginal Solvers,
    and A2A protocol dispatchers to Jamie (Audiences), Curtis (Creative Studio), and Surya (Commerce Media).
    """

    def __init__(self, model_name: str = "gemini-3.5-flash-lite"):
        self.model_name = model_name
        self.client = None
        self._init_genai_client()

    def _init_genai_client(self):
        try:
            from google import genai
            api_key = os.getenv("GEMINI_API_KEY")
            project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "eagames-ebc-demo-app")
            location = os.getenv("GEMINI_LOCATION", "global")
            
            if api_key:
                self.client = genai.Client(api_key=api_key)
            elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or project_id:
                self.client = genai.Client(vertexai=True, project=project_id, location=location)
        except Exception as e:
            logger.warning(f"Google GenAI SDK initialization deferred in MediaBuyingAgent: {e}")
            self.client = None

    def execute_budget_reallocation(
        self,
        channels: List[Dict[str, Any]],
        total_budget: Optional[float] = None,
        max_daily_shift_pct: float = 0.20,
        enforce_zero_sum: bool = True,
    ) -> Dict[str, Any]:
        """Calculates optimal budget reallocations across channels using the Equimarginal Hill Saturation solver."""
        logger.info(f"MediaBuyingAgent executing optimization across {len(channels)} channels...")
        return solve_equimarginal_allocation(
            channels=channels,
            total_budget=total_budget,
            max_daily_shift_pct=max_daily_shift_pct,
            enforce_zero_sum=enforce_zero_sum,
        )

    def negotiate_creative_revision(
        self,
        creative_agent_name: str = "Curtis_CreativeStudioAgent",
        recommended_feature: str = "Squad Breach & Clear",
        target_channel: str = "YouTube Paid",
        budget_allocated: float = 85000.0,
        directive: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Sends an outbound A2A message to Curtis Gross's Creative Studio Agent (`03-creative-insights`)
        requesting creative cuts optimized for high marginal ROAS Gold Mine features.
        """
        payload = {
            "intent": "REVISE_CREATIVE",
            "feature_name": recommended_feature,
            "quadrant": "GOLD_MINES",
            "target_channel": target_channel,
            "budget_allocated": budget_allocated,
            "directive": directive or f"Lead with 2-second high-intensity ToFu action hook featuring {recommended_feature}.",
        }
        message = create_a2a_message(
            sender="MediaBuyingAgent",
            recipient=creative_agent_name,
            intent="REVISE_CREATIVE",
            payload=payload,
            correlation_id=correlation_id,
        )
        response = route_a2a_message(message)
        return {
            "dispatched_message": message,
            "negotiation_response": response,
            "status": "NEGOTIATION_COMPLETED",
        }

    def request_persona_simulation(
        self,
        persona_agent_name: str = "Jamie_DeepSonaAgent",
        campaign_id: str = "camp-apex-s22-relaunch",
        target_roas: float = 2.45,
        creative_title: str = "Apex Season 22 Squad Breach Cut",
        franchise: str = "Apex Legends",
        proposed_spend: float = 120000.0,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Sends an outbound A2A message to Jamie Pourturk's DeepSona Service (`01-audiences`)
        requesting pre-flight gamer persona reaction simulations before deploying capital.
        """
        payload = {
            "campaign_id": campaign_id,
            "franchise": franchise,
            "creative_title": creative_title,
            "proposed_spend": proposed_spend,
            "target_roas": target_roas,
            "archetypes": ["COMPETITIVE_GRINDER", "LORE_SEEKER", "CASUAL_SOCIALIZER", "ULTIMATE_TEAM_WHALE"],
        }
        message = create_a2a_message(
            sender="MediaBuyingAgent",
            recipient=persona_agent_name,
            intent="SIMULATE_PERSONA_REACTION",
            payload=payload,
            correlation_id=correlation_id,
        )
        response = route_a2a_message(message)
        return {
            "dispatched_message": message,
            "simulation_response": response,
            "status": "PERSONA_SIMULATION_DISPATCHED",
        }

    def allocate_programmatic_spend(
        self,
        ad_server_agent_name: str = "Surya_CommerceMediaAgent",
        campaign_id: str = "camp-fc26-launch",
        franchise: str = "EA Sports FC",
        stadium_board_budget: float = 85000.0,
        dma_focus: Optional[List[int]] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Sends an outbound A2A message to Surya Kunju's Commerce Media Ad Server Agent (`04-commerce-media`)
        passing programmatic budget weights and target DMAs.
        """
        payload = {
            "campaign_id": campaign_id,
            "franchise": franchise,
            "channel": "Programmatic 3D",
            "stadium_board_budget": stadium_board_budget,
            "target_surfaces": ["STADIUM_BOARDS", "PAUSE_SCREENS"],
            "dma_focus": dma_focus or [501, 803, 602],
        }
        message = create_a2a_message(
            sender="MediaBuyingAgent",
            recipient=ad_server_agent_name,
            intent="ALLOCATE_PROGRAMMATIC_SPEND",
            payload=payload,
            correlation_id=correlation_id,
        )
        response = route_a2a_message(message)
        return {
            "dispatched_message": message,
            "allocation_response": response,
            "status": "PROGRAMMATIC_SPEND_ALLOCATED",
        }

    def detect_cti_decay(
        self,
        performance_metrics: Dict[str, Any],
        decay_threshold_pct: float = 0.0,
        fbi_threshold: float = 0.50,
    ) -> Dict[str, Any]:
        """Evaluates campaign or asset creative performance for lower-funnel CTI decay.
        
        Args:
            performance_metrics: Dict containing 'marginal_cti_lift_pct', 'marginal_ctr_lift_pct',
                                 'funnel_balance_index', 'franchise', 'asset_id'.
            decay_threshold_pct: CTI lift floor below which decay is flagged (default <= 0.0%).
            fbi_threshold: Funnel Balance Index floor (default < 0.50).
            
        Returns:
            Dict with 'decay_detected' (bool), 'trigger_reasons' (List[str]),
            and 'prescriptive_recommendation' (Dict[str, Any]).
        """
        cti_lift = float(performance_metrics.get("marginal_cti_lift_pct", 0.0))
        ctr_lift = float(performance_metrics.get("marginal_ctr_lift_pct", 0.0))
        fbi = float(performance_metrics.get("funnel_balance_index", 1.0))
        franchise = performance_metrics.get("franchise", "EA Sports FC")
        
        decay_detected = False
        reasons = []
        
        if cti_lift < decay_threshold_pct:
            decay_detected = True
            reasons.append(f"Marginal CTI lift ({cti_lift:+.1f}%) is below threshold ({decay_threshold_pct}%)")
            
        if ctr_lift >= 20.0 and cti_lift <= 0.0:
            decay_detected = True
            reasons.append(f"Severe CTR/CTI divergence: High CTR ({ctr_lift:+.1f}%) with negative CTI ({cti_lift:+.1f}%)")
            
        if fbi < fbi_threshold:
            decay_detected = True
            reasons.append(f"Funnel Balance Index ({fbi:.2f}) below minimum healthy threshold ({fbi_threshold:.2f})")
            
        # Prescriptive recommendations
        is_fc = "FC" in franchise or "FIFA" in franchise or "EA Sports FC" in franchise or "EA_SPORTS_FC" in franchise
        if is_fc:
            prescriptive_feature = "FUT Pack Walkout Jude Bellingham"
            creative_direction = "Jude Bellingham 9:16 vertical walkout"
            expected_cti_recovery = 32.4
            expected_roas = 3.42
        else:
            prescriptive_feature = "Apex Mythic Heirloom Inspect"
            creative_direction = "Apex Mythic Heirloom 9:16 vertical inspect"
            expected_cti_recovery = 28.5
            expected_roas = 3.15
            
        return {
            "decay_detected": decay_detected,
            "franchise": franchise,
            "asset_id": performance_metrics.get("asset_id", "asset-unknown"),
            "trigger_reasons": reasons,
            "observed_metrics": {
                "marginal_ctr_lift_pct": ctr_lift,
                "marginal_cti_lift_pct": cti_lift,
                "funnel_balance_index": fbi,
            },
            "prescriptive_recommendation": {
                "feature_name": prescriptive_feature,
                "creative_direction": creative_direction,
                "aspect_ratio": "9:16",
                "expected_marginal_cti_lift_pct": expected_cti_recovery,
                "expected_marginal_roas_multiplier": expected_roas,
                "budget_allocated": 85000.0,
                "target_channels": ["TikTok", "Meta Ads", "YouTube Shorts"],
            } if decay_detected else None
        }

    def dispatch_creative_revision_on_cti_decay(
        self,
        performance_metrics: Dict[str, Any],
        creative_agent_name: str = "Curtis_CreativeStudioAgent",
        campaign_id: str = "camp-fc27-toty-001",
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Automated A2A dispatch to Curtis Gross's Creative Studio (`02-creative-insights`)
        triggering a REVISE_CREATIVE event when lower-funnel CTI decay is detected.
        """
        audit = self.detect_cti_decay(performance_metrics)
        
        if not audit["decay_detected"]:
            return {
                "status": "NO_DECAY_DETECTED",
                "audit": audit,
                "dispatched_message": None,
                "negotiation_response": None,
            }
            
        rec = audit["prescriptive_recommendation"]
        franchise = audit["franchise"]
        asset_id = audit["asset_id"]
        
        payload = {
            "action": "REVISE_CREATIVE",
            "campaign_id": campaign_id,
            "asset_id": asset_id,
            "franchise": franchise,
            "trigger_reason": "LOWER_FUNNEL_CTI_DECAY",
            "decay_metrics": audit["observed_metrics"],
            "creative_direction": rec["creative_direction"],
            "feature_name": rec["feature_name"],
            "feature_category": "LOWER_FUNNEL_MONETIZATION",
            "funnel_tier": "BOFU",
            "aspect_ratio": rec["aspect_ratio"],
            "target_surfaces": ["MOBILE_COMPANION", "STREAMING_OVERLAYS", "IN_GAME_STORE"],
            "target_channels": rec["target_channels"],
            "budget_allocated": rec["budget_allocated"],
            "expected_marginal_cti_lift_pct": rec["expected_marginal_cti_lift_pct"],
            "expected_marginal_roas_multiplier": rec["expected_marginal_roas_multiplier"],
            "rationale": f"Lower-funnel CTI decay mitigation: replace decaying hook with {rec['creative_direction']}",
            "directive": f"Lead with {rec['creative_direction']} to recover lower-funnel CTI to +{rec['expected_marginal_cti_lift_pct']}%.",
        }
        
        message = create_a2a_message(
            sender="MediaBuyingAgent",
            recipient=creative_agent_name,
            intent="REVISE_CREATIVE",
            payload=payload,
            correlation_id=correlation_id,
        )
        
        response = route_a2a_message(message)
        return {
            "status": "REVISION_DISPATCHED",
            "audit": audit,
            "dispatched_message": message,
            "negotiation_response": response,
        }


def create_media_buying_agent() -> MediaBuyingAgent:
    """Factory function for creating MediaBuyingAgent instance."""
    return MediaBuyingAgent()
