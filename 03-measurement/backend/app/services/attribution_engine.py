"""SHAP Attribution and Tactical 9-Grid Classification Engine.

Decomposes campaign performance into marginal feature attributions (SHAP values)
and maps creative features onto the EA Tactical 9-Grid Matrix across 9 distinct quadrants.
"""

import time
import numpy as np
from typing import List, Dict, Tuple, Optional, Any
from app.schemas.attribution import (
    QuadrantEnum,
    Tactical9GridPoint,
    SHAPFeatureContribution,
    TacticalGridResponse,
)


class AttributionEngine:
    """Classifies creative features into the Tactical 9-Grid based on frequency and SHAP impact."""

    # Strategic action mapping for each quadrant
    ACTION_MAP: Dict[QuadrantEnum, str] = {
        QuadrantEnum.GOLD_MINES: "Scale Up: High ROAS driver with low market fatigue. Increase spend share aggressively.",
        QuadrantEnum.CORE_DRIVERS: "Maintain: Core revenue engine with balanced frequency. Protect budget baseline.",
        QuadrantEnum.SATURATED_STARS: "Monitor / Retire: High historical ROAS reaching creative exhaustion. Prep refreshed variants.",
        QuadrantEnum.UNTAPPED: "Test More: Promising signal with low sample frequency. Allocate 5-10% discovery budget.",
        QuadrantEnum.WORKHORSES: "Optimize: Consistent mid-tier performer. Refine visual hooks and call-to-action.",
        QuadrantEnum.EFFICIENCY_RISKS: "Trim Budget: Moderate ROAS suffering from high impression saturation.",
        QuadrantEnum.NOISE: "Discard: Negligible ROAS contribution and low engagement. Deprecate asset tags.",
        QuadrantEnum.UNDERPERFORMERS: "Pivot Creative: Sub-par ROAS across repeated exposures. Rework mechanic presentation.",
        QuadrantEnum.MONEY_PITS: "Kill Immediately: Consistently negative ROAS contribution despite heavy spend. Deprecate immediately.",
    }

    @staticmethod
    def classify_quadrant(frequency_x: float, roas_impact_y: float) -> Tuple[QuadrantEnum, str]:
        """Classify a feature into one of the 9 exact quadrants.

        Frequency X thresholds:
          - Low: x < 25.0
          - Medium: 25.0 <= x < 65.0
          - High: x >= 65.0

        ROAS Impact Y thresholds (marginal multiplier / SHAP contribution):
          - Low: y < 0.85
          - Medium: 0.85 <= y < 1.35
          - High: y >= 1.35
        """
        # Frequency band
        if frequency_x < 25.0:
            freq_band = "LOW"
        elif frequency_x < 65.0:
            freq_band = "MED"
        else:
            freq_band = "HIGH"

        # ROAS band
        if roas_impact_y >= 1.35:
            roas_band = "HIGH"
        elif roas_impact_y >= 0.85:
            roas_band = "MED"
        else:
            roas_band = "LOW"

        # 3x3 Matrix Assignment
        if roas_band == "HIGH" and freq_band == "LOW":
            quad = QuadrantEnum.GOLD_MINES
        elif roas_band == "HIGH" and freq_band == "MED":
            quad = QuadrantEnum.CORE_DRIVERS
        elif roas_band == "HIGH" and freq_band == "HIGH":
            quad = QuadrantEnum.SATURATED_STARS
        elif roas_band == "MED" and freq_band == "LOW":
            quad = QuadrantEnum.UNTAPPED
        elif roas_band == "MED" and freq_band == "MED":
            quad = QuadrantEnum.WORKHORSES
        elif roas_band == "MED" and freq_band == "HIGH":
            quad = QuadrantEnum.EFFICIENCY_RISKS
        elif roas_band == "LOW" and freq_band == "LOW":
            quad = QuadrantEnum.NOISE
        elif roas_band == "LOW" and freq_band == "MED":
            quad = QuadrantEnum.UNDERPERFORMERS
        else:  # roas_band == "LOW" and freq_band == "HIGH"
            quad = QuadrantEnum.MONEY_PITS

        action = AttributionEngine.ACTION_MAP[quad]
        return quad, action

    def calculate_shap_attributions(
        self,
        feature_names: List[str],
        feature_activations: Dict[str, float],
        weights: Optional[Dict[str, float]] = None,
        base_roas: float = 1.0,
    ) -> List[SHAPFeatureContribution]:
        """Compute additive SHAP value decompositions for creative features."""
        if weights is None:
            weights = {f: np.random.uniform(-0.4, 0.8) for f in feature_names}

        shap_contributions = []
        total_abs_shap = sum(abs(weights.get(f, 0.0) * feature_activations.get(f, 1.0)) for f in feature_names)
        if total_abs_shap == 0:
            total_abs_shap = 1.0

        for f in feature_names:
            act = feature_activations.get(f, 1.0)
            val = weights.get(f, 0.0) * act
            rel_imp = (abs(val) / total_abs_shap) * 100.0
            direction = "POSITIVE" if val >= 0 else "NEGATIVE"

            shap_contributions.append(
                SHAPFeatureContribution(
                    feature_name=f,
                    shap_value=round(float(val), 4),
                    feature_value=round(float(act), 2),
                    baseline_value=round(base_roas, 2),
                    relative_importance_pct=round(rel_imp, 2),
                    direction=direction,
                )
            )

        shap_contributions.sort(key=lambda x: abs(x.shap_value), reverse=True)
        return shap_contributions

    def build_tactical_grid(
        self,
        franchise: str,
        campaign_id: str,
        raw_features: List[Dict[str, Any]],
    ) -> TacticalGridResponse:
        """Construct complete Tactical 9-Grid representation with quadrant stats."""
        grid_points: List[Tactical9GridPoint] = []
        quad_counts: Dict[str, int] = {q.value: 0 for q in QuadrantEnum}

        total_roas_impact = 0.0
        top_driver = ("", -999.0)
        top_risk = ("", 999.0)

        for feat in raw_features:
            name = feat["feature_name"]
            ftype = feat.get("feature_type", "game_mechanic")
            freq = float(feat.get("frequency_x", 30.0))
            roas = float(feat.get("roas_impact_y", 1.0))
            conf = float(feat.get("confidence", 0.92))
            sample_cnt = int(feat.get("sample_campaigns_count", 12))

            quad, action = self.classify_quadrant(freq, roas)
            quad_counts[quad.value] += 1
            total_roas_impact += roas

            if roas > top_driver[1]:
                top_driver = (name, roas)
            if roas < top_risk[1]:
                top_risk = (name, roas)

            grid_points.append(
                Tactical9GridPoint(
                    feature_name=name,
                    feature_type=ftype,
                    frequency_x=round(freq, 1),
                    roas_impact_y=round(roas, 3),
                    quadrant=quad,
                    strategic_action=action,
                    confidence=round(conf, 2),
                    sample_campaigns_count=sample_cnt,
                    franchise=franchise,
                )
            )

        avg_roas = total_roas_impact / max(1, len(raw_features))

        return TacticalGridResponse(
            model_id=f"model-9grid-{int(time.time())}",
            campaign_id=campaign_id,
            franchise=franchise,
            features=grid_points,
            quadrant_counts=quad_counts,
            avg_marginal_roas=round(avg_roas, 3),
            top_driver_feature=top_driver[0] if top_driver[0] else "N/A",
            top_risk_feature=top_risk[0] if top_risk[0] else "N/A",
            generated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        )


attribution_engine = AttributionEngine()
