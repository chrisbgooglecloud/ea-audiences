"""A2UI Protocol Message Generator for Next.js Dynamic UI Widget Streaming."""

import json
import uuid
import time
from typing import Dict, List, Any, Optional
from agents.app.schemas import A2UIComponent, A2UIStreamEvent


class A2UIProtocolGenerator:
    """Generates structured A2UI protocol actions (createSurface, surfaceUpdate, updateDataModel)
    and declarative <a2ui-*> web component payloads targeting the trusted client Widget Catalog.
    """

    @staticmethod
    def create_surface(surface_id: str, title: str, layout: str = "vertical") -> Dict[str, Any]:
        """A2UI createSurface message initializing a visual viewport."""
        return {
            "type": "createSurface",
            "surfaceId": surface_id,
            "title": title,
            "layout": layout,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    @staticmethod
    def surface_update(surface_id: str, components: List[Dict[str, Any]]) -> Dict[str, Any]:
        """A2UI surfaceUpdate message sending component tree definition."""
        return {
            "type": "surfaceUpdate",
            "surfaceId": surface_id,
            "components": components,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    @staticmethod
    def update_data_model(surface_id: str, path: str, value: Any) -> Dict[str, Any]:
        """A2UI updateDataModel message streaming live state updates bound via JSON Pointer."""
        return {
            "type": "updateDataModel",
            "surfaceId": surface_id,
            "path": path,
            "value": value,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    # Widget Catalog Helper Methods
    @staticmethod
    def build_metric_card(
        component_id: str,
        title: str,
        value: str,
        subtitle: Optional[str] = None,
        delta: Optional[str] = None,
        trend: str = "neutral",
        badge: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Builds a declarative <a2ui-metric-card> payload."""
        return {
            "component_type": "a2ui-metric-card",
            "component_id": component_id,
            "title": title,
            "data": {
                "value": value,
                "subtitle": subtitle or "",
                "delta": delta or "",
                "trend": trend,  # 'up', 'down', 'neutral'
                "badge": badge or "",
            },
            "props": {
                "variant": "glassmorphic",
                "accent_color": "#1a73e8",
            }
        }

    @staticmethod
    def build_scurve_chart(
        component_id: str,
        title: str,
        channels: List[Dict[str, Any]],
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Builds a declarative <a2ui-scurve-chart> payload."""
        return {
            "component_type": "a2ui-scurve-chart",
            "component_id": component_id,
            "title": title,
            "description": description or "Meridian MMM Equimarginal Hill Saturation S-Curves",
            "data": {
                "channels": channels,
            },
            "props": {
                "show_tangents": True,
                "enable_crosshair": True,
            }
        }

    @staticmethod
    def build_tactical_9grid_scatter(
        component_id: str,
        title: str,
        points: List[Dict[str, Any]],
        franchise: str = "Apex Legends",
    ) -> Dict[str, Any]:
        """Builds a declarative <a2ui-grid-scatter> payload."""
        return {
            "component_type": "a2ui-grid-scatter",
            "component_id": component_id,
            "title": title,
            "description": f"Tactical 9-Grid Creative Attribution Matrix for {franchise}",
            "data": {
                "franchise": franchise,
                "features": points,
            },
            "props": {
                "x_axis_label": "Exposure Frequency (Count)",
                "y_axis_label": "Marginal ROAS Impact (SHAP)",
                "highlight_gold_mines": True,
            }
        }

    @staticmethod
    def build_recommendation_card(
        component_id: str,
        title: str,
        recommendations: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Builds a declarative <a2ui-recommendation-card> payload."""
        return {
            "component_type": "a2ui-recommendation-card",
            "component_id": component_id,
            "title": title,
            "data": {
                "recommendations": recommendations,
            },
            "props": {
                "collapsible": True,
                "allow_one_click_apply": True,
            }
        }

    @staticmethod
    def build_persona_card(
        component_id: str,
        persona_name: str,
        archetype: str,
        pass1_monologue: str,
        buyer_action: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Builds a declarative <a2ui-persona-card> payload rendering BARE outputs."""
        return {
            "component_type": "a2ui-persona-card",
            "component_id": component_id,
            "title": f"DeepSona Persona Simulation: {persona_name}",
            "data": {
                "persona_name": persona_name,
                "archetype": archetype,
                "pass1_monologue": pass1_monologue,
                "buyer_action": buyer_action,
            },
            "props": {
                "show_friction_radar": True,
                "show_fsm_badge": True,
            }
        }

    @staticmethod
    def build_conflict_card(
        component_id: str = "conflict-fc27-toty-001",
        title: str = "Cross-Franchise Audience Collision Detected",
        severity: str = "AMBER",
        target_campaign_id: str = "camp-fc27-toty-001",
        target_campaign_name: str = "EA FC 27 TOTY Mid-Season Push",
        target_franchise: str = "EA Sports FC",
        conflicting_campaign_id: str = "camp-apex-s26-002",
        conflicting_campaign_name: str = "Apex Legends Season 26 Launch",
        conflicting_franchise: str = "Apex Legends",
        flight_start: str = "2026-10-24",
        flight_end: str = "2026-10-27",
        shared_ea_id_overlap_pct: float = 42.1,
        shared_player_count: int = 1280000,
        ad_fatigue_suppression_penalty_pct: float = 14.5,
        net_bookings_risk_usd: float = 420000.0,
        recommended_timeline_shift_days: int = 3,
        mitigated_flight_start: str = "2026-10-27",
        mitigated_flight_end: str = "2026-11-07",
        projected_net_bookings_recovery_usd: float = 420000.0,
        mitigation_strategy: Optional[str] = None,
        options: Optional[List[Dict[str, Any]]] = None,
        description: Optional[str] = None,
        action_payload: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Builds a declarative <a2ui-conflict-card> payload for cross-franchise audience collision alerts."""
        default_strategy = (
            f"Timeline shift (+{recommended_timeline_shift_days} days) to "
            f"{mitigated_flight_start} - {mitigated_flight_end} & negative audience suppression on heavy {conflicting_franchise} players."
        )
        
        default_options = [
            {
                "option_id": "opt-shift-prune",
                "title": f"Apply AI Recommendation (+{recommended_timeline_shift_days}d Shift & Prune)",
                "description": f"Shift flight to {mitigated_flight_start} - {mitigated_flight_end} and suppress heavy crossover players",
                "projected_recovery_usd": projected_net_bookings_recovery_usd,
                "recommended": True,
            },
            {
                "option_id": "opt-accept-risk",
                "title": "Proceed with Planned Schedule",
                "description": f"Accept {ad_fatigue_suppression_penalty_pct}% suppression penalty and ${net_bookings_risk_usd:,.0f} revenue risk",
                "projected_recovery_usd": 0.0,
                "recommended": False,
            },
        ]

        default_action = {
            "action": "APPLY_COLLISION_MITIGATION",
            "target_campaign_id": target_campaign_id,
            "recommended_shift_days": recommended_timeline_shift_days,
            "mitigated_flight_start": mitigated_flight_start,
            "mitigated_flight_end": mitigated_flight_end,
            "recovery_usd": projected_net_bookings_recovery_usd,
            "label": f"Apply AI Recommendation (+${projected_net_bookings_recovery_usd:,.0f})",
            "secondary_label": "Dismiss Alert",
        }

        return {
            "component_type": "a2ui-conflict-card",
            "component_id": component_id,
            "title": title,
            "description": description or f"Cross-franchise collision between {target_franchise} and {conflicting_franchise}",
            "data": {
                "severity": severity,
                "collision_detected": True,
                "target_campaign_id": target_campaign_id,
                "target_campaign_name": target_campaign_name,
                "target_franchise": target_franchise,
                "conflicting_campaign_id": conflicting_campaign_id,
                "conflicting_campaign_name": conflicting_campaign_name,
                "conflicting_franchise": conflicting_franchise,
                "flight_start": flight_start,
                "flight_end": flight_end,
                "shared_ea_id_overlap_pct": shared_ea_id_overlap_pct,
                "shared_player_count": shared_player_count,
                "ad_fatigue_suppression_penalty_pct": ad_fatigue_suppression_penalty_pct,
                "net_bookings_risk_usd": net_bookings_risk_usd,
                "recommended_timeline_shift_days": recommended_timeline_shift_days,
                "mitigated_flight_start": mitigated_flight_start,
                "mitigated_flight_end": mitigated_flight_end,
                "projected_net_bookings_recovery_usd": projected_net_bookings_recovery_usd,
                "mitigation_strategy": mitigation_strategy or default_strategy,
                "options": options if options is not None else default_options,
                "metrics": {
                    "overlap_pct": shared_ea_id_overlap_pct,
                    "penalty_pct": ad_fatigue_suppression_penalty_pct,
                    "risk_usd": net_bookings_risk_usd,
                    "recovery_usd": projected_net_bookings_recovery_usd,
                },
            },
            "props": {
                "variant": "amber_warning",
                "collapsible": True,
                "allow_one_click_apply": True,
                "action_payload": action_payload or default_action,
            },
        }

    @staticmethod
    def render_conflict_card_markup(
        component_id: str = "conflict-fc27-toty-001",
        title: str = "Cross-Franchise Audience Collision Detected",
        severity: str = "AMBER",
        target_campaign: str = "EA FC 27 TOTY Mid-Season Push",
        conflicting_campaign: str = "Apex Legends Season 26 Launch",
        overlap_pct: float = 42.1,
        penalty_pct: float = 14.5,
        risk_usd: float = 420000.0,
        shift_days: int = 3,
        recovery_usd: float = 420000.0,
    ) -> str:
        """Emits declarative custom HTML web component tag <a2ui-conflict-card>."""
        return (
            f'<a2ui-conflict-card '
            f'id="{component_id}" '
            f'title="{title}" '
            f'severity="{severity}" '
            f'target-campaign="{target_campaign}" '
            f'conflicting-campaign="{conflicting_campaign}" '
            f'overlap-pct="{overlap_pct}" '
            f'penalty-pct="{penalty_pct}" '
            f'risk-usd="{risk_usd}" '
            f'shift-days="{shift_days}" '
            f'recovery-usd="{recovery_usd}"'
            f'></a2ui-conflict-card>'
        )

    @staticmethod
    def build_shapley_chart(
        component_id: str = "shapley-fc27-pretest-001",
        title: str = "2D Creative Shapley CTR vs CTI Marginal Lift Attribution",
        asset_id: str = "asset-fc27-pretest-001",
        asset_title: str = "EA SPORTS FC 27 - Official Gameplay Trailer (15s Pre-Test)",
        franchise: str = "EA Sports FC",
        video_duration_seconds: float = 15.0,
        funnel_balance_index: float = 0.78,
        features: Optional[List[Dict[str, Any]]] = None,
        waterfall_steps: Optional[List[Dict[str, Any]]] = None,
        channel_attribution: Optional[List[Dict[str, Any]]] = None,
        audit_verdict: str = "STRONG_CONVERSION_PROFILE",
        recommendations: Optional[List[str]] = None,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Builds a declarative <a2ui-shapley-chart> payload decomposing video features into 2D Shapley trade-offs."""
        default_features = [
            {
                "feature_id": "feat-fc27-01",
                "feature_name": "Skill Move / Trick Shot Showcase",
                "category": "TOP_OF_FUNNEL",
                "funnel_tier": "TOFU",
                "marginal_ctr_lift_pct": 41.0,
                "marginal_cti_lift_pct": -12.1,
                "marginal_d7_roas_multiplier": 1.85,
                "confidence_score": 0.96,
                "timestamp_start_sec": 0.0,
                "timestamp_end_sec": 4.5,
                "description": "High-intensity viral dribbling and trick shot sequence driving top-of-funnel virality.",
            },
            {
                "feature_id": "feat-fc27-02",
                "feature_name": "Midfield Tactical Build-up Passing",
                "category": "NEUTRAL_ENGAGEMENT",
                "funnel_tier": "MOFU",
                "marginal_ctr_lift_pct": 1.8,
                "marginal_cti_lift_pct": 2.1,
                "marginal_d7_roas_multiplier": 1.05,
                "confidence_score": 0.92,
                "timestamp_start_sec": 4.5,
                "timestamp_end_sec": 10.0,
                "description": "Realistic passing and tactical shape showcase maintaining viewer engagement.",
            },
            {
                "feature_id": "feat-fc27-03",
                "feature_name": "FUT Pack Walkout Jude Bellingham",
                "category": "LOWER_FUNNEL_MONETIZATION",
                "funnel_tier": "BOFU",
                "marginal_ctr_lift_pct": 4.2,
                "marginal_cti_lift_pct": 32.4,
                "marginal_d7_roas_multiplier": 3.42,
                "confidence_score": 0.98,
                "timestamp_start_sec": 10.0,
                "timestamp_end_sec": 15.0,
                "description": "Signature Jude Bellingham walkout animation with golden pack explosion triggering in-game spending intent.",
            },
        ]

        feature_list = features if features is not None else default_features

        # Separate into video breakdown tiers
        top_of_funnel = [f for f in feature_list if f.get("category") == "TOP_OF_FUNNEL" or f.get("marginal_ctr_lift_pct", 0) > 15.0]
        lower_funnel = [f for f in feature_list if f.get("category") == "LOWER_FUNNEL_MONETIZATION" or f.get("marginal_cti_lift_pct", 0) > 15.0]
        neutral = [f for f in feature_list if f not in top_of_funnel and f not in lower_funnel]

        default_waterfall = [
            {"step_name": "Baseline Creative", "ctr_lift": 0.0, "cti_lift": 0.0, "roas_multiplier": 1.00, "tier": "BASELINE"},
            {"step_name": "Trick Shot Hook", "ctr_lift": 41.0, "cti_lift": -12.1, "roas_multiplier": 1.85, "tier": "TOP_OF_FUNNEL"},
            {"step_name": "Tactical Build-up", "ctr_lift": 1.8, "cti_lift": 2.1, "roas_multiplier": 1.05, "tier": "NEUTRAL_ENGAGEMENT"},
            {"step_name": "Bellingham Walkout & CTA", "ctr_lift": 4.2, "cti_lift": 32.4, "roas_multiplier": 3.42, "tier": "LOWER_FUNNEL_MONETIZATION"},
        ]

        default_channels = [
            {"channel": "YouTube Paid", "allocated_weight_pct": 35.0, "blended_roas": 3.65, "marginal_lift_pct": 28.4},
            {"channel": "TikTok", "allocated_weight_pct": 25.0, "blended_roas": 3.40, "marginal_lift_pct": 42.1},
            {"channel": "Meta Ads", "allocated_weight_pct": 20.0, "blended_roas": 3.15, "marginal_lift_pct": 19.8},
            {"channel": "Twitch", "allocated_weight_pct": 12.0, "blended_roas": 2.90, "marginal_lift_pct": 16.5},
            {"channel": "Google Ads", "allocated_weight_pct": 8.0, "blended_roas": 3.80, "marginal_lift_pct": 22.0},
        ]

        default_recs = [
            "Maintain 2-second Trick Shot opening hook for viral TikTok distribution (+41.0% CTR).",
            "Lead with Jude Bellingham walkout sequence for Lower-Funnel YouTube / Meta conversion (+32.4% CTI, 3.42x ROAS).",
            "Deploy 9:16 vertical variant to Curtis Gross's Creative Studio for TikTok and Shorts.",
        ]

        return {
            "component_type": "a2ui-shapley-chart",
            "component_id": component_id,
            "title": title,
            "description": description or f"2D Shapley Trade-Off Attribution for {asset_title}",
            "data": {
                "asset_id": asset_id,
                "asset_title": asset_title,
                "franchise": franchise,
                "video_duration_seconds": video_duration_seconds,
                "funnel_balance_index": funnel_balance_index,
                "features": feature_list,
                "waterfall_steps": waterfall_steps if waterfall_steps is not None else default_waterfall,
                "channel_attribution": channel_attribution if channel_attribution is not None else default_channels,
                "video_breakdown": {
                    "top_of_funnel_features": top_of_funnel,
                    "lower_funnel_monetization_features": lower_funnel,
                    "neutral_features": neutral,
                    "total_features_count": len(feature_list),
                },
                "audit_verdict": audit_verdict,
                "recommendations": recommendations if recommendations is not None else default_recs,
            },
            "props": {
                "chart_type": "2d_tradeoff_waterfall",
                "x_axis_label": "Marginal CTR Lift (%)",
                "y_axis_label": "Marginal CTI Lift (%)",
                "show_fbi_gauge": True,
                "show_pareto_frontier": True,
                "highlight_anchors": ["FUT Pack Walkout Jude Bellingham", "Skill Move / Trick Shot Showcase"],
                "color_palette": {
                    "TOP_OF_FUNNEL": "#00F5D4",
                    "LOWER_FUNNEL_MONETIZATION": "#0066FF",
                    "NEUTRAL_ENGAGEMENT": "#94A3B8",
                },
            },
        }

    @staticmethod
    def render_shapley_chart_markup(
        component_id: str = "shapley-fc27-pretest-001",
        title: str = "2D Creative Shapley CTR vs CTI Marginal Lift",
        asset_id: str = "asset-fc27-pretest-001",
        franchise: str = "EA Sports FC",
        funnel_balance_index: float = 0.78,
        top_ctr_feature: str = "Skill Move / Trick Shot Showcase (+41.0%)",
        top_cti_feature: str = "FUT Pack Walkout Jude Bellingham (+32.4%)",
        duration_seconds: float = 15.0,
    ) -> str:
        """Emits declarative custom HTML web component tag <a2ui-shapley-chart>."""
        return (
            f'<a2ui-shapley-chart '
            f'id="{component_id}" '
            f'title="{title}" '
            f'asset-id="{asset_id}" '
            f'franchise="{franchise}" '
            f'funnel-balance-index="{funnel_balance_index}" '
            f'top-ctr-feature="{top_ctr_feature}" '
            f'top-cti-feature="{top_cti_feature}" '
            f'duration-sec="{duration_seconds}"'
            f'></a2ui-shapley-chart>'
        )

    @staticmethod
    def format_sse_event(event_type: str, agent_name: str, session_id: str, content: Optional[str] = None, component: Optional[Dict[str, Any]] = None, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Encodes an A2UIStreamEvent into a standard SSE string line."""
        payload = {
            "event_type": event_type,
            "agent_name": agent_name,
            "session_id": session_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "content": content,
            "component": component,
            "metadata": metadata or {},
        }
        return f"event: message\ndata: {json.dumps(payload)}\n\n"
