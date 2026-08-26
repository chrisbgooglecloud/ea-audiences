"""Scoring and Lift Estimation Agent."""

import logging
from typing import Dict, List, Any

logger = logging.getLogger("ea.audiences.scoring_agent")


class ScoringAgent:
    """Calculates conversion lift, sentiment decay, and projected revenue lift."""

    def evaluate_offer_lift(
        self,
        offer_type: str,
        price_usd: float,
        target_archetype: str,
        frustration_level: float = 0.5,
    ) -> Dict[str, Any]:
        """Calculates expected lift based on archetype elasticity and situational state."""
        
        # Base elasticity by archetype
        archetype_elasticity = {
            "COMPETITIVE_GRINDER": {"base_cvr": 0.08, "price_sensitivity": 0.85, "tilt_boost": 0.25},
            "ULTIMATE_TEAM_WHALE": {"base_cvr": 0.28, "price_sensitivity": 0.15, "tilt_boost": 0.10},
            "CASUAL_SOCIALIZER": {"base_cvr": 0.15, "price_sensitivity": 0.60, "tilt_boost": 0.05},
            "LORE_SEEKER": {"base_cvr": 0.12, "price_sensitivity": 0.45, "tilt_boost": 0.02},
        }.get(target_archetype, {"base_cvr": 0.12, "price_sensitivity": 0.50, "tilt_boost": 0.10})

        # Price penalty
        price_factor = max(0.2, 1.0 - (price_usd / 100.0) * archetype_elasticity["price_sensitivity"])
        
        # Frustration/Tilt situational bonus (e.g. Pity Pack converts high when frustrated)
        situational_multiplier = 1.0 + (frustration_level * archetype_elasticity["tilt_boost"] * (3.0 if offer_type == "PITY_PACK" else 0.5))

        projected_cvr = min(0.65, archetype_elasticity["base_cvr"] * price_factor * situational_multiplier)
        predicted_lift_pct = round((projected_cvr / max(0.01, archetype_elasticity["base_cvr"]) - 1.0) * 100, 1)

        return {
            "target_archetype": target_archetype,
            "offer_type": offer_type,
            "price_usd": price_usd,
            "projected_cvr": round(projected_cvr, 3),
            "predicted_conversion_lift_pct": predicted_lift_pct,
            "expected_churn_reduction_pct": round(min(35.0, frustration_level * 28.0), 1),
        }


def create_scoring_agent() -> ScoringAgent:
    return ScoringAgent()
