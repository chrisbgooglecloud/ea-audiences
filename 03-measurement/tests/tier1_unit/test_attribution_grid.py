"""Tier 1 Unit Tests: Tactical 9-Grid Attribution Matrix & SHAP Engine.

Tests:
1. 9-Grid quadrant assignment logic across all 9 discrete quadrants:
   GOLD_MINES, CORE_DRIVERS, SATURATED_STARS, UNTAPPED, WORKHORSES,
   EFFICIENCY_RISKS, NOISE, UNDERPERFORMERS, MONEY_PITS.
2. Exact boundary condition analysis (Frequency: 25.0, 65.0; ROAS: 0.85, 1.35).
3. Strategic action mapping for each quadrant.
4. SHAP feature attribution calculation & relative importance ranking.
5. Grid aggregation metrics (top driver, top risk, quadrant counts).
"""

import pytest
from app.schemas.attribution import QuadrantEnum, TacticalGridResponse
from app.services.attribution_engine import AttributionEngine, attribution_engine


class TestQuadrantClassification:
    """Validate 9-Grid quadrant classification rules and exact boundary conditions."""

    @pytest.mark.parametrize(
        "freq_x, roas_y, expected_quadrant, action_keyword",
        [
            # High ROAS (>= 1.35)
            (10.0, 1.50, QuadrantEnum.GOLD_MINES, "Scale Up"),
            (40.0, 1.45, QuadrantEnum.CORE_DRIVERS, "Maintain"),
            (75.0, 1.60, QuadrantEnum.SATURATED_STARS, "Monitor"),
            # Medium ROAS (0.85 <= y < 1.35)
            (15.0, 1.10, QuadrantEnum.UNTAPPED, "Test More"),
            (50.0, 1.05, QuadrantEnum.WORKHORSES, "Optimize"),
            (80.0, 0.95, QuadrantEnum.EFFICIENCY_RISKS, "Trim Budget"),
            # Low ROAS (< 0.85)
            (5.0, 0.60, QuadrantEnum.NOISE, "Discard"),
            (35.0, 0.70, QuadrantEnum.UNDERPERFORMERS, "Pivot Creative"),
            (90.0, 0.40, QuadrantEnum.MONEY_PITS, "Kill Immediately"),
        ],
    )
    def test_all_nine_quadrants_classified_correctly(
        self, freq_x, roas_y, expected_quadrant, action_keyword
    ):
        """Verify each of the 9 quadrants is assigned accurately based on (x, y) coordinates."""
        quad, action = AttributionEngine.classify_quadrant(freq_x, roas_y)
        assert quad == expected_quadrant
        assert action_keyword in action

    def test_frequency_boundary_conditions(self):
        """Test boundary conditions for Frequency X thresholds (25.0 and 65.0)."""
        # Just below 25.0 -> LOW
        quad_below_25, _ = AttributionEngine.classify_quadrant(24.99, 1.50)
        assert quad_below_25 == QuadrantEnum.GOLD_MINES

        # Exactly 25.0 -> MED
        quad_at_25, _ = AttributionEngine.classify_quadrant(25.0, 1.50)
        assert quad_at_25 == QuadrantEnum.CORE_DRIVERS

        # Just below 65.0 -> MED
        quad_below_65, _ = AttributionEngine.classify_quadrant(64.99, 1.50)
        assert quad_below_65 == QuadrantEnum.CORE_DRIVERS

        # Exactly 65.0 -> HIGH
        quad_at_65, _ = AttributionEngine.classify_quadrant(65.0, 1.50)
        assert quad_at_65 == QuadrantEnum.SATURATED_STARS

    def test_roas_boundary_conditions(self):
        """Test boundary conditions for ROAS Impact Y thresholds (0.85 and 1.35)."""
        # Just below 0.85 -> LOW
        quad_below_085, _ = AttributionEngine.classify_quadrant(40.0, 0.849)
        assert quad_below_085 == QuadrantEnum.UNDERPERFORMERS

        # Exactly 0.85 -> MED
        quad_at_085, _ = AttributionEngine.classify_quadrant(40.0, 0.85)
        assert quad_at_085 == QuadrantEnum.WORKHORSES

        # Just below 1.35 -> MED
        quad_below_135, _ = AttributionEngine.classify_quadrant(40.0, 1.349)
        assert quad_below_135 == QuadrantEnum.WORKHORSES

        # Exactly 1.35 -> HIGH
        quad_at_135, _ = AttributionEngine.classify_quadrant(40.0, 1.35)
        assert quad_at_135 == QuadrantEnum.CORE_DRIVERS


class TestSHAPAttributions:
    """Validate SHAP additive marginal attribution computation."""

    def test_shap_decomposition(self):
        """Verify SHAP values, directions, and relative importance calculation."""
        features = ["Squad Breach", "FUT Pack Opening", "Generic Audio Cue"]
        activations = {"Squad Breach": 1.0, "FUT Pack Opening": 1.0, "Generic Audio Cue": 1.0}
        weights = {"Squad Breach": 0.45, "FUT Pack Opening": 0.35, "Generic Audio Cue": -0.20}

        shap_list = attribution_engine.calculate_shap_attributions(
            feature_names=features,
            feature_activations=activations,
            weights=weights,
            base_roas=1.0,
        )

        assert len(shap_list) == 3
        # Should be sorted by absolute SHAP value descending
        assert abs(shap_list[0].shap_value) >= abs(shap_list[1].shap_value) >= abs(shap_list[2].shap_value)

        # Check positive/negative direction
        sb = next(s for s in shap_list if s.feature_name == "Squad Breach")
        assert sb.direction == "POSITIVE"
        assert sb.shap_value == 0.45

        ga = next(s for s in shap_list if s.feature_name == "Generic Audio Cue")
        assert ga.direction == "NEGATIVE"
        assert ga.shap_value == -0.20

        # Sum of relative importance should equal 100%
        total_importance = sum(s.relative_importance_pct for s in shap_list)
        assert pytest.approx(total_importance, rel=1e-2) == 100.0


class TestTacticalGridBuilder:
    """Validate full 9-Grid construction and summary metrics."""

    def test_build_tactical_grid(self, sample_9grid_features):
        """Verify grid construction aggregates all 9 quadrants and identifies drivers/risks."""
        response = attribution_engine.build_tactical_grid(
            franchise="Apex Legends",
            campaign_id="camp-apex-test",
            raw_features=sample_9grid_features,
        )

        assert isinstance(response, TacticalGridResponse)
        assert len(response.features) == len(sample_9grid_features)

        # All 9 quadrants should have at least 1 feature in our sample
        for q in QuadrantEnum:
            assert response.quadrant_counts[q.value] >= 1

        # Check top driver (highest ROAS) and top risk (lowest ROAS)
        assert response.top_driver_feature == "Loot Box Walkout Animation"
        assert response.top_risk_feature == "Generic Stock Victory Screams"
        assert response.avg_marginal_roas > 0.0
