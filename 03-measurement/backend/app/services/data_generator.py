"""Synthetic Telemetry and Enterprise Data Generator.

Generates realistic 90-day multi-franchise marketing datasets:
- 4 Franchises (Apex Legends, EA Sports FC, Battlefield, The Sims)
- 25 Rich Creative Assets across 6 Surfaces and 3 Funnel Stages
- 250 Cohort Daily Performance Records
- 18 Causal Lift Experiments for Bayesian Meridian Prior Calibration
- 25 DMA Weather Shock Time Series Records
"""

import time
import uuid
from typing import List, Dict, Any
from app.schemas.creative import (
    CreativeAsset,
    CreativeMetadataSchema,
    SurfaceEnum,
    FunnelStageEnum,
    MediaTypeEnum,
    FranchiseEnum,
    DetectedMechanic,
    Storybeat,
)
from app.schemas.meridian import CausalLiftExperiment
from app.schemas.attribution import Tactical9GridPoint, QuadrantEnum


class DataGeneratorService:
    """Generates authentic enterprise synthetic data for EA Marketing Analytics."""

    @staticmethod
    def get_campaigns() -> List[Dict[str, Any]]:
        """Generate 4 flagship EA marketing campaigns."""
        return [
            {
                "campaign_id": "camp-apex-s22-relaunch",
                "title": "Apex Legends: Season 22 Shockwave Global Relaunch",
                "franchise": "Apex Legends",
                "status": "ACTIVE",
                "target_budget": 550000.0,
                "target_cpi": 24.50,
                "target_d7_roas": 2.15,
                "created_at": "2026-06-01T00:00:00Z",
            },
            {
                "campaign_id": "camp-fc25-toty-summit",
                "title": "EA Sports FC 25: Team of the Year Global Acquisition",
                "franchise": "EA Sports FC",
                "status": "ACTIVE",
                "target_budget": 850000.0,
                "target_cpi": 18.20,
                "target_d7_roas": 3.40,
                "created_at": "2026-06-15T00:00:00Z",
            },
            {
                "campaign_id": "camp-bf6-squad-breach",
                "title": "Battlefield 6: Squad Breach & Dynamic Levolution",
                "franchise": "Battlefield",
                "status": "ACTIVE",
                "target_budget": 620000.0,
                "target_cpi": 31.00,
                "target_d7_roas": 1.95,
                "created_at": "2026-07-01T00:00:00Z",
            },
            {
                "campaign_id": "camp-sims4-expansion-pass",
                "title": "The Sims 4: Urban Architecture & Social Stories",
                "franchise": "The Sims",
                "status": "ACTIVE",
                "target_budget": 380000.0,
                "target_cpi": 14.80,
                "target_d7_roas": 2.65,
                "created_at": "2026-07-10T00:00:00Z",
            },
        ]

    @staticmethod
    def get_creative_assets() -> List[CreativeAsset]:
        """Generate 25 diverse, highly detailed creative assets across the 4 franchises."""
        assets: List[CreativeAsset] = []

        definitions = [
            # Apex Legends (1-7)
            (
                "asset-apex-01",
                "camp-apex-s22-relaunch",
                FranchiseEnum.APEX_LEGENDS,
                "Apex_S22_Superglide_Wingman.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.ToFu_Exploration,
                "Kinetic Superglide Movement Hook",
                [SurfaceEnum.STREAMING_OVERLAYS, SurfaceEnum.EA_APP_LAUNCHER],
                [
                    DetectedMechanic(
                        mechanic_name="Superglide Kinetic Slide",
                        funnel_stage=FunnelStageEnum.ToFu_Exploration,
                        confidence_score=0.97,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=3.5,
                        surface_suitability=[SurfaceEnum.STREAMING_OVERLAYS],
                    )
                ],
                ["#FF3366", "#00E5FF", "#18181B"],
            ),
            (
                "asset-apex-02",
                "camp-apex-s22-relaunch",
                FranchiseEnum.APEX_LEGENDS,
                "Apex_S22_Rift_Relic_Gameplay.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.MoFu_Progression,
                "Rift Relic Energy Vortex Showcase",
                [SurfaceEnum.IN_GAME_STORE, SurfaceEnum.PAUSE_SCREENS],
                [
                    DetectedMechanic(
                        mechanic_name="Rift Relic Deployment",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.94,
                        timestamp_start_sec=2.0,
                        timestamp_end_sec=8.0,
                        surface_suitability=[SurfaceEnum.IN_GAME_STORE],
                    )
                ],
                ["#7C3AED", "#06B6D4", "#0F172A"],
            ),
            (
                "asset-apex-03",
                "camp-apex-s22-relaunch",
                FranchiseEnum.APEX_LEGENDS,
                "Apex_S22_Heirloom_Finisher.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.BoFu_Conversion,
                "Mythic Heirloom Execution & Loot Reveal",
                [SurfaceEnum.IN_GAME_STORE, SurfaceEnum.MOBILE_COMPANION],
                [
                    DetectedMechanic(
                        mechanic_name="Heirloom Finisher Animation",
                        funnel_stage=FunnelStageEnum.BoFu_Conversion,
                        confidence_score=0.98,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=5.0,
                        surface_suitability=[SurfaceEnum.IN_GAME_STORE],
                    )
                ],
                ["#F59E0B", "#EF4444", "#1E293B"],
            ),
            (
                "asset-apex-04",
                "camp-apex-s22-relaunch",
                FranchiseEnum.APEX_LEGENDS,
                "Apex_S22_Stadium_Banner.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.ToFu_Exploration,
                "ALGS Stadium Electronic Billboard Splash",
                [SurfaceEnum.STADIUM_BOARDS],
                [
                    DetectedMechanic(
                        mechanic_name="Stadium Brand Anchor",
                        funnel_stage=FunnelStageEnum.ToFu_Exploration,
                        confidence_score=0.91,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.STADIUM_BOARDS],
                    )
                ],
                ["#FF0055", "#00FFFF", "#000000"],
            ),
            (
                "asset-apex-05",
                "camp-apex-s22-relaunch",
                FranchiseEnum.APEX_LEGENDS,
                "Apex_S22_Mobile_Companion_Pass.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.BoFu_Conversion,
                "Mobile Battle Pass Daily Progression Card",
                [SurfaceEnum.MOBILE_COMPANION],
                [
                    DetectedMechanic(
                        mechanic_name="Battle Pass Tier Unlock",
                        funnel_stage=FunnelStageEnum.BoFu_Conversion,
                        confidence_score=0.95,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.MOBILE_COMPANION],
                    )
                ],
                ["#10B981", "#3B82F6", "#1F2937"],
            ),
            (
                "asset-apex-06",
                "camp-apex-s22-relaunch",
                FranchiseEnum.APEX_LEGENDS,
                "Apex_S22_Twitch_Interactive_Overlay.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.MoFu_Progression,
                "Interactive Streamer Squad Loadout Overlay",
                [SurfaceEnum.STREAMING_OVERLAYS],
                [
                    DetectedMechanic(
                        mechanic_name="Live Stream Overlay Voting",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.93,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=10.0,
                        surface_suitability=[SurfaceEnum.STREAMING_OVERLAYS],
                    )
                ],
                ["#9333EA", "#06B6D4", "#030712"],
            ),
            (
                "asset-apex-07",
                "camp-apex-s22-relaunch",
                FranchiseEnum.APEX_LEGENDS,
                "Apex_S22_Pause_Menu_Hero.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.MoFu_Progression,
                "Match Pause Menu Season Progress Teaser",
                [SurfaceEnum.PAUSE_SCREENS],
                [
                    DetectedMechanic(
                        mechanic_name="In-Game Pause Interstitial",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.88,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.PAUSE_SCREENS],
                    )
                ],
                ["#EC4899", "#8B5CF6", "#111827"],
            ),
            # EA Sports FC (8-13)
            (
                "asset-fc-01",
                "camp-fc25-toty-summit",
                FranchiseEnum.EA_SPORTS_FC,
                "FC25_FUT_Pack_Walkout_Gold.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.BoFu_Conversion,
                "99 OVR TOTY Walkout Explosive Flare",
                [SurfaceEnum.IN_GAME_STORE, SurfaceEnum.MOBILE_COMPANION],
                [
                    DetectedMechanic(
                        mechanic_name="FUT Pack Opening Walkout",
                        funnel_stage=FunnelStageEnum.BoFu_Conversion,
                        confidence_score=0.99,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=5.0,
                        surface_suitability=[SurfaceEnum.IN_GAME_STORE],
                    )
                ],
                ["#D4AF37", "#0A192F", "#FFFFFF"],
            ),
            (
                "asset-fc-02",
                "camp-fc25-toty-summit",
                FranchiseEnum.EA_SPORTS_FC,
                "FC25_Hypermotion_Bicycle_Goal.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.ToFu_Exploration,
                "Dynamic Hypermotion Physical Volley Strike",
                [SurfaceEnum.STADIUM_BOARDS, SurfaceEnum.EA_APP_LAUNCHER],
                [
                    DetectedMechanic(
                        mechanic_name="Hypermotion Volley Finish",
                        funnel_stage=FunnelStageEnum.ToFu_Exploration,
                        confidence_score=0.95,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=6.0,
                        surface_suitability=[SurfaceEnum.STADIUM_BOARDS],
                    )
                ],
                ["#00FF66", "#0F172A", "#38BDF8"],
            ),
            (
                "asset-fc-03",
                "camp-fc25-toty-summit",
                FranchiseEnum.EA_SPORTS_FC,
                "FC25_Tactical_Manager_Mastery.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.MoFu_Progression,
                "FC IQ Tactical Preset Real-Time Switch",
                [SurfaceEnum.EA_APP_LAUNCHER, SurfaceEnum.PAUSE_SCREENS],
                [
                    DetectedMechanic(
                        mechanic_name="FC IQ Tactical Formation",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.92,
                        timestamp_start_sec=1.0,
                        timestamp_end_sec=7.0,
                        surface_suitability=[SurfaceEnum.EA_APP_LAUNCHER],
                    )
                ],
                ["#3B82F6", "#1E293B", "#10B981"],
            ),
            (
                "asset-fc-04",
                "camp-fc25-toty-summit",
                FranchiseEnum.EA_SPORTS_FC,
                "FC25_Stadium_AdBoard_Loop.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.ToFu_Exploration,
                "Premier League Pitch-Side LED Ribbon Loop",
                [SurfaceEnum.STADIUM_BOARDS],
                [
                    DetectedMechanic(
                        mechanic_name="Pitch-side LED Integration",
                        funnel_stage=FunnelStageEnum.ToFu_Exploration,
                        confidence_score=0.96,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=8.0,
                        surface_suitability=[SurfaceEnum.STADIUM_BOARDS],
                    )
                ],
                ["#1E3A8A", "#F59E0B", "#FFFFFF"],
            ),
            (
                "asset-fc-05",
                "camp-fc25-toty-summit",
                FranchiseEnum.EA_SPORTS_FC,
                "FC25_Companion_SBC_Solver.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.BoFu_Conversion,
                "Squad Building Challenge Instant Submission",
                [SurfaceEnum.MOBILE_COMPANION],
                [
                    DetectedMechanic(
                        mechanic_name="SBC Rapid Completion",
                        funnel_stage=FunnelStageEnum.BoFu_Conversion,
                        confidence_score=0.94,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.MOBILE_COMPANION],
                    )
                ],
                ["#047857", "#10B981", "#064E3B"],
            ),
            (
                "asset-fc-06",
                "camp-fc25-toty-summit",
                FranchiseEnum.EA_SPORTS_FC,
                "FC25_Broadcast_Stream_HUD.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.MoFu_Progression,
                "Esports Live Stream Stat Broadcast Card",
                [SurfaceEnum.STREAMING_OVERLAYS],
                [
                    DetectedMechanic(
                        mechanic_name="Live Match Stat Overlay",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.90,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.STREAMING_OVERLAYS],
                    )
                ],
                ["#0284C7", "#0F172A", "#F8FAFC"],
            ),
            # Battlefield (14-19)
            (
                "asset-bf-01",
                "camp-bf6-squad-breach",
                FranchiseEnum.BATTLEFIELD,
                "BF6_Skyscraper_Levolution_Breach.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.ToFu_Exploration,
                "128-Player High-Rise Destruction & Base Jump",
                [SurfaceEnum.EA_APP_LAUNCHER, SurfaceEnum.STREAMING_OVERLAYS],
                [
                    DetectedMechanic(
                        mechanic_name="Levolution Environmental Destruction",
                        funnel_stage=FunnelStageEnum.ToFu_Exploration,
                        confidence_score=0.98,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=8.0,
                        surface_suitability=[SurfaceEnum.EA_APP_LAUNCHER],
                    )
                ],
                ["#1F2937", "#F97316", "#0284C7"],
            ),
            (
                "asset-bf-02",
                "camp-bf6-squad-breach",
                FranchiseEnum.BATTLEFIELD,
                "BF6_Thermal_Squad_Night_Infiltration.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.MoFu_Progression,
                "Tactical Squad C4 Flash Infiltration",
                [SurfaceEnum.PAUSE_SCREENS, SurfaceEnum.EA_APP_LAUNCHER],
                [
                    DetectedMechanic(
                        mechanic_name="Tactical Squad Breach",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.96,
                        timestamp_start_sec=1.0,
                        timestamp_end_sec=6.0,
                        surface_suitability=[SurfaceEnum.PAUSE_SCREENS],
                    )
                ],
                ["#111827", "#10B981", "#E5E7EB"],
            ),
            (
                "asset-bf-03",
                "camp-bf6-squad-breach",
                FranchiseEnum.BATTLEFIELD,
                "BF6_Armored_Vehicle_Combat.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.ToFu_Exploration,
                "Heavy Tank Armor Penetration & Airstrike Call",
                [SurfaceEnum.STADIUM_BOARDS, SurfaceEnum.STREAMING_OVERLAYS],
                [
                    DetectedMechanic(
                        mechanic_name="Combined Arms Vehicle Combat",
                        funnel_stage=FunnelStageEnum.ToFu_Exploration,
                        confidence_score=0.93,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=5.0,
                        surface_suitability=[SurfaceEnum.STADIUM_BOARDS],
                    )
                ],
                ["#78350F", "#B45309", "#1E293B"],
            ),
            (
                "asset-bf-04",
                "camp-bf6-squad-breach",
                FranchiseEnum.BATTLEFIELD,
                "BF6_Weapon_Customization_Vault.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.BoFu_Conversion,
                "Gunsmith Caliber & Optical Mod Breakdown",
                [SurfaceEnum.IN_GAME_STORE, SurfaceEnum.MOBILE_COMPANION],
                [
                    DetectedMechanic(
                        mechanic_name="Gunsmith Deep Customization",
                        funnel_stage=FunnelStageEnum.BoFu_Conversion,
                        confidence_score=0.95,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=7.0,
                        surface_suitability=[SurfaceEnum.IN_GAME_STORE],
                    )
                ],
                ["#334155", "#64748B", "#0F172A"],
            ),
            (
                "asset-bf-05",
                "camp-bf6-squad-breach",
                FranchiseEnum.BATTLEFIELD,
                "BF6_Pause_Tactical_Briefing.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.MoFu_Progression,
                "Strategic Battlemap Sector Control Interstitial",
                [SurfaceEnum.PAUSE_SCREENS],
                [
                    DetectedMechanic(
                        mechanic_name="Sector Control Map Overview",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.91,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.PAUSE_SCREENS],
                    )
                ],
                ["#0F172A", "#38BDF8", "#F59E0B"],
            ),
            (
                "asset-bf-06",
                "camp-bf6-squad-breach",
                FranchiseEnum.BATTLEFIELD,
                "BF6_Mobile_Tactical_Ping.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.BoFu_Conversion,
                "Companion Squad Order Real-Time Marker",
                [SurfaceEnum.MOBILE_COMPANION],
                [
                    DetectedMechanic(
                        mechanic_name="Squad Tactical Beacon Ping",
                        funnel_stage=FunnelStageEnum.BoFu_Conversion,
                        confidence_score=0.89,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.MOBILE_COMPANION],
                    )
                ],
                ["#1E1B4B", "#4338CA", "#A5B4FC"],
            ),
            # The Sims (20-25)
            (
                "asset-sims-01",
                "camp-sims4-expansion-pass",
                FranchiseEnum.THE_SIMS,
                "Sims4_Luxury_Villa_SpeedBuild.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.ToFu_Exploration,
                "Timelapse Architectural Villa Transformation",
                [SurfaceEnum.EA_APP_LAUNCHER, SurfaceEnum.MOBILE_COMPANION],
                [
                    DetectedMechanic(
                        mechanic_name="Modular Build Mode",
                        funnel_stage=FunnelStageEnum.ToFu_Exploration,
                        confidence_score=0.99,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=6.0,
                        surface_suitability=[SurfaceEnum.EA_APP_LAUNCHER],
                    )
                ],
                ["#38BDF8", "#F472B6", "#FDE047"],
            ),
            (
                "asset-sims-02",
                "camp-sims4-expansion-pass",
                FranchiseEnum.THE_SIMS,
                "Sims4_Relationship_Drama_Choice.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.BoFu_Conversion,
                "Dramatic Sim Gossip & Romance Dialogue Hook",
                [SurfaceEnum.IN_GAME_STORE, SurfaceEnum.PAUSE_SCREENS],
                [
                    DetectedMechanic(
                        mechanic_name="Storyline Relationship Progression",
                        funnel_stage=FunnelStageEnum.BoFu_Conversion,
                        confidence_score=0.93,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=5.0,
                        surface_suitability=[SurfaceEnum.IN_GAME_STORE],
                    )
                ],
                ["#FB7185", "#C084FC", "#312E81"],
            ),
            (
                "asset-sims-03",
                "camp-sims4-expansion-pass",
                FranchiseEnum.THE_SIMS,
                "Sims4_Custom_Wardrobe_CAS.mp4",
                MediaTypeEnum.VIDEO,
                FunnelStageEnum.MoFu_Progression,
                "Create-A-Sim Dynamic Fashion Showcase",
                [SurfaceEnum.MOBILE_COMPANION, SurfaceEnum.IN_GAME_STORE],
                [
                    DetectedMechanic(
                        mechanic_name="Create-A-Sim Cosmetic Customization",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.96,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=7.0,
                        surface_suitability=[SurfaceEnum.MOBILE_COMPANION],
                    )
                ],
                ["#A78BFA", "#34D399", "#1E293B"],
            ),
            (
                "asset-sims-04",
                "camp-sims4-expansion-pass",
                FranchiseEnum.THE_SIMS,
                "Sims4_Stadium_Cozy_Banner.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.ToFu_Exploration,
                "Warm Pastel Cozy Lifestyle Billboard",
                [SurfaceEnum.STADIUM_BOARDS],
                [
                    DetectedMechanic(
                        mechanic_name="Lifestyle Cozy Atmosphere",
                        funnel_stage=FunnelStageEnum.ToFu_Exploration,
                        confidence_score=0.88,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.STADIUM_BOARDS],
                    )
                ],
                ["#FBBF24", "#F472B6", "#60A5FA"],
            ),
            (
                "asset-sims-05",
                "camp-sims4-expansion-pass",
                FranchiseEnum.THE_SIMS,
                "Sims4_Stream_Decor_Widget.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.MoFu_Progression,
                "Simlish Interactive Chat Reaction Overlay",
                [SurfaceEnum.STREAMING_OVERLAYS],
                [
                    DetectedMechanic(
                        mechanic_name="Interactive Stream Simlish Reactions",
                        funnel_stage=FunnelStageEnum.MoFu_Progression,
                        confidence_score=0.91,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.STREAMING_OVERLAYS],
                    )
                ],
                ["#4ADE80", "#22D3EE", "#0F172A"],
            ),
            (
                "asset-sims-06",
                "camp-sims4-expansion-pass",
                FranchiseEnum.THE_SIMS,
                "Sims4_Expansion_Store_Pack.png",
                MediaTypeEnum.IMAGE,
                FunnelStageEnum.BoFu_Conversion,
                "Expansion DLC Pack Instant Unlock Banner",
                [SurfaceEnum.IN_GAME_STORE],
                [
                    DetectedMechanic(
                        mechanic_name="Expansion DLC Bundle Offer",
                        funnel_stage=FunnelStageEnum.BoFu_Conversion,
                        confidence_score=0.97,
                        timestamp_start_sec=0.0,
                        timestamp_end_sec=0.0,
                        surface_suitability=[SurfaceEnum.IN_GAME_STORE],
                    )
                ],
                ["#E11D48", "#FB923C", "#18181B"],
            ),
        ]

        for aid, cid, fran, fname, mtype, fstage, title, surfs, mechs, colors in definitions:
            meta = CreativeMetadataSchema(
                title=title,
                funnel_stage=fstage,
                primary_visual_hooks=[f"High-impact {fstage.value} hook in {fname}"],
                audio_cues=["Orchestrated dynamic game audio", "Authentic voiceover commentary"],
                detected_mechanics=mechs,
                target_surfaces=surfs,
                storybeats=[
                    Storybeat(
                        beat_number=1,
                        timestamp_sec=0.0,
                        hook_type="Opening Hook",
                        visual_description="Opening gameplay hook.",
                        pacing_intensity=0.85,
                    )
                ],
                dominant_colors=colors,
                call_to_action="Play Now on EA App",
                sentiment_score=0.85,
            )
            assets.append(
                CreativeAsset(
                    asset_id=aid,
                    campaign_id=cid,
                    franchise=fran,
                    gcs_uri=f"gs://eagames-ebc-demo-app-creative-assets/{fran.value.replace(' ', '_').lower()}/{fname}",
                    media_type=mtype,
                    file_name=fname,
                    file_size_bytes=14500000 if mtype == MediaTypeEnum.VIDEO else 2100000,
                    duration_seconds=12.0 if mtype == MediaTypeEnum.VIDEO else 0.0,
                    frame_count=12 if mtype == MediaTypeEnum.VIDEO else 1,
                    metadata_schema=meta,
                    created_at="2026-06-20T10:00:00Z",
                    updated_at="2026-08-01T12:00:00Z",
                    status="PROCESSED",
                )
            )

        return assets

    @staticmethod
    def get_causal_lift_experiments() -> List[CausalLiftExperiment]:
        """Generate 18 robust causal lift trials across 6 channels for Meridian calibration."""
        experiments = [
            # YouTube (3 trials)
            CausalLiftExperiment(
                experiment_id="exp-yt-geo-01",
                channel="YouTube",
                spend=85000.0,
                incremental_revenue=212500.0,
                observed_roas=2.50,
                standard_error=0.18,
                confidence_interval_lower=2.15,
                confidence_interval_upper=2.85,
                sample_size_dmas=28,
                test_period_days=14,
            ),
            CausalLiftExperiment(
                experiment_id="exp-yt-geo-02",
                channel="YouTube",
                spend=120000.0,
                incremental_revenue=288000.0,
                observed_roas=2.40,
                standard_error=0.15,
                confidence_interval_lower=2.10,
                confidence_interval_upper=2.70,
                sample_size_dmas=35,
                test_period_days=21,
            ),
            CausalLiftExperiment(
                experiment_id="exp-yt-geo-03",
                channel="YouTube",
                spend=60000.0,
                incremental_revenue=159000.0,
                observed_roas=2.65,
                standard_error=0.22,
                confidence_interval_lower=2.22,
                confidence_interval_upper=3.08,
                sample_size_dmas=20,
                test_period_days=14,
            ),
            # Meta (3 trials)
            CausalLiftExperiment(
                experiment_id="exp-meta-geo-01",
                channel="Meta",
                spend=95000.0,
                incremental_revenue=247000.0,
                observed_roas=2.60,
                standard_error=0.16,
                confidence_interval_lower=2.29,
                confidence_interval_upper=2.91,
                sample_size_dmas=30,
                test_period_days=14,
            ),
            CausalLiftExperiment(
                experiment_id="exp-meta-geo-02",
                channel="Meta",
                spend=140000.0,
                incremental_revenue=322000.0,
                observed_roas=2.30,
                standard_error=0.14,
                confidence_interval_lower=2.03,
                confidence_interval_upper=2.57,
                sample_size_dmas=40,
                test_period_days=21,
            ),
            CausalLiftExperiment(
                experiment_id="exp-meta-geo-03",
                channel="Meta",
                spend=75000.0,
                incremental_revenue=206250.0,
                observed_roas=2.75,
                standard_error=0.19,
                confidence_interval_lower=2.38,
                confidence_interval_upper=3.12,
                sample_size_dmas=24,
                test_period_days=14,
            ),
            # TikTok (3 trials)
            CausalLiftExperiment(
                experiment_id="exp-tt-geo-01",
                channel="TikTok",
                spend=70000.0,
                incremental_revenue=203000.0,
                observed_roas=2.90,
                standard_error=0.21,
                confidence_interval_lower=2.49,
                confidence_interval_upper=3.31,
                sample_size_dmas=25,
                test_period_days=14,
            ),
            CausalLiftExperiment(
                experiment_id="exp-tt-geo-02",
                channel="TikTok",
                spend=110000.0,
                incremental_revenue=297000.0,
                observed_roas=2.70,
                standard_error=0.17,
                confidence_interval_lower=2.37,
                confidence_interval_upper=3.03,
                sample_size_dmas=32,
                test_period_days=21,
            ),
            CausalLiftExperiment(
                experiment_id="exp-tt-geo-03",
                channel="TikTok",
                spend=50000.0,
                incremental_revenue=157500.0,
                observed_roas=3.15,
                standard_error=0.25,
                confidence_interval_lower=2.66,
                confidence_interval_upper=3.64,
                sample_size_dmas=18,
                test_period_days=14,
            ),
            # Programmatic 3D (3 trials)
            CausalLiftExperiment(
                experiment_id="exp-p3d-geo-01",
                channel="Programmatic 3D",
                spend=40000.0,
                incremental_revenue=72000.0,
                observed_roas=1.80,
                standard_error=0.20,
                confidence_interval_lower=1.41,
                confidence_interval_upper=2.19,
                sample_size_dmas=15,
                test_period_days=14,
            ),
            CausalLiftExperiment(
                experiment_id="exp-p3d-geo-02",
                channel="Programmatic 3D",
                spend=65000.0,
                incremental_revenue=107250.0,
                observed_roas=1.65,
                standard_error=0.18,
                confidence_interval_lower=1.30,
                confidence_interval_upper=2.00,
                sample_size_dmas=22,
                test_period_days=21,
            ),
            CausalLiftExperiment(
                experiment_id="exp-p3d-geo-03",
                channel="Programmatic 3D",
                spend=30000.0,
                incremental_revenue=58500.0,
                observed_roas=1.95,
                standard_error=0.24,
                confidence_interval_lower=1.48,
                confidence_interval_upper=2.42,
                sample_size_dmas=12,
                test_period_days=14,
            ),
            # Twitch Influencers (3 trials)
            CausalLiftExperiment(
                experiment_id="exp-twi-geo-01",
                channel="Twitch Influencers",
                spend=60000.0,
                incremental_revenue=186000.0,
                observed_roas=3.10,
                standard_error=0.28,
                confidence_interval_lower=2.55,
                confidence_interval_upper=3.65,
                sample_size_dmas=20,
                test_period_days=14,
            ),
            CausalLiftExperiment(
                experiment_id="exp-twi-geo-02",
                channel="Twitch Influencers",
                spend=90000.0,
                incremental_revenue=252000.0,
                observed_roas=2.80,
                standard_error=0.22,
                confidence_interval_lower=2.37,
                confidence_interval_upper=3.23,
                sample_size_dmas=28,
                test_period_days=21,
            ),
            CausalLiftExperiment(
                experiment_id="exp-twi-geo-03",
                channel="Twitch Influencers",
                spend=45000.0,
                incremental_revenue=148500.0,
                observed_roas=3.30,
                standard_error=0.32,
                confidence_interval_lower=2.67,
                confidence_interval_upper=3.93,
                sample_size_dmas=16,
                test_period_days=14,
            ),
            # Connected TV (3 trials)
            CausalLiftExperiment(
                experiment_id="exp-ctv-geo-01",
                channel="Connected TV",
                spend=100000.0,
                incremental_revenue=150000.0,
                observed_roas=1.50,
                standard_error=0.14,
                confidence_interval_lower=1.23,
                confidence_interval_upper=1.77,
                sample_size_dmas=30,
                test_period_days=21,
            ),
            CausalLiftExperiment(
                experiment_id="exp-ctv-geo-02",
                channel="Connected TV",
                spend=150000.0,
                incremental_revenue=202500.0,
                observed_roas=1.35,
                standard_error=0.12,
                confidence_interval_lower=1.11,
                confidence_interval_upper=1.59,
                sample_size_dmas=45,
                test_period_days=28,
            ),
            CausalLiftExperiment(
                experiment_id="exp-ctv-geo-03",
                channel="Connected TV",
                spend=75000.0,
                incremental_revenue=123750.0,
                observed_roas=1.65,
                standard_error=0.17,
                confidence_interval_lower=1.32,
                confidence_interval_upper=1.98,
                sample_size_dmas=22,
                test_period_days=14,
            ),
        ]
        return experiments

    @staticmethod
    def get_tactical_9grid_features() -> List[Dict[str, Any]]:
        """Generate 20 creative features spanning all 9 quadrants of the Tactical 9-Grid."""
        return [
            # GOLD_MINES: High ROAS, Low Frequency
            {"feature_name": "Kinetic Superglide Action Hook", "feature_type": "game_mechanic", "frequency_x": 14.0, "roas_impact_y": 1.68, "confidence": 0.96},
            {"feature_name": "FUT Walkout Gold Particle Reveal", "feature_type": "visual_hook", "frequency_x": 18.0, "roas_impact_y": 1.82, "confidence": 0.98},
            {"feature_name": "POV Night Vision Squad Infiltration", "feature_type": "game_mechanic", "frequency_x": 12.0, "roas_impact_y": 1.55, "confidence": 0.94},

            # CORE_DRIVERS: High ROAS, Med Frequency
            {"feature_name": "Hypermotion Physical Volley", "feature_type": "game_mechanic", "frequency_x": 42.0, "roas_impact_y": 1.48, "confidence": 0.95},
            {"feature_name": "128-Player Levolution Collapse", "feature_type": "game_mechanic", "frequency_x": 38.0, "roas_impact_y": 1.42, "confidence": 0.92},
            {"feature_name": "Rift Relic Energy Ability", "feature_type": "game_mechanic", "frequency_x": 48.0, "roas_impact_y": 1.39, "confidence": 0.91},

            # SATURATED_STARS: High ROAS, High Frequency
            {"feature_name": "Cinematic Legend Pose Climax", "feature_type": "visual_hook", "frequency_x": 78.0, "roas_impact_y": 1.38, "confidence": 0.89},
            {"feature_name": "Premier Stadium Brand Billboard", "feature_type": "surface", "frequency_x": 85.0, "roas_impact_y": 1.36, "confidence": 0.90},

            # UNTAPPED: Med ROAS, Low Frequency
            {"feature_name": "Twitch Interactive Vote Overlay", "feature_type": "surface", "frequency_x": 10.0, "roas_impact_y": 1.18, "confidence": 0.88},
            {"feature_name": "Simlish Humorous Quip Audio", "feature_type": "audio_cue", "frequency_x": 16.0, "roas_impact_y": 1.12, "confidence": 0.86},

            # WORKHORSES: Med ROAS, Med Frequency
            {"feature_name": "Modular Architecture Speed-Build", "feature_type": "game_mechanic", "frequency_x": 45.0, "roas_impact_y": 1.15, "confidence": 0.93},
            {"feature_name": "Gunsmith Detailed Mod breakdown", "feature_type": "game_mechanic", "frequency_x": 52.0, "roas_impact_y": 1.08, "confidence": 0.90},
            {"feature_name": "Mobile Companion Squad Builder", "feature_type": "surface", "frequency_x": 40.0, "roas_impact_y": 1.20, "confidence": 0.92},

            # EFFICIENCY_RISKS: Med ROAS, High Frequency
            {"feature_name": "Generic Character Select Carousel", "feature_type": "visual_hook", "frequency_x": 72.0, "roas_impact_y": 0.95, "confidence": 0.85},
            {"feature_name": "Broadcast Stream Lower-Third", "feature_type": "surface", "frequency_x": 80.0, "roas_impact_y": 0.88, "confidence": 0.84},

            # NOISE: Low ROAS, Low Frequency
            {"feature_name": "Slow Intro Logo Fade-In (>4s)", "feature_type": "visual_hook", "frequency_x": 8.0, "roas_impact_y": 0.65, "confidence": 0.80},
            {"feature_name": "Uncalibrated Synth Background Drone", "feature_type": "audio_cue", "frequency_x": 12.0, "roas_impact_y": 0.72, "confidence": 0.78},

            # UNDERPERFORMERS: Low ROAS, Med Frequency
            {"feature_name": "Static In-Game Pause Banner", "feature_type": "surface", "frequency_x": 35.0, "roas_impact_y": 0.70, "confidence": 0.84},
            {"feature_name": "Generic Pre-Rendered Cutscene Loop", "feature_type": "visual_hook", "frequency_x": 50.0, "roas_impact_y": 0.62, "confidence": 0.82},

            # MONEY_PITS: Low ROAS, High Frequency
            {"feature_name": "Static Text-Heavy Legal End-Card", "feature_type": "visual_hook", "frequency_x": 88.0, "roas_impact_y": 0.42, "confidence": 0.95},
        ]

    @staticmethod
    def get_cohort_records(count: int = 250) -> List[Dict[str, Any]]:
        """Generate 250 daily cohort performance records across channels and franchises."""
        records = []
        channels = ["YouTube", "Meta", "TikTok", "Programmatic 3D", "Twitch Influencers", "Connected TV"]
        franchises = ["Apex Legends", "EA Sports FC", "Battlefield", "The Sims"]

        for i in range(count):
            ch = channels[i % len(channels)]
            fran = franchises[i % len(franchises)]
            day_offset = (i // 4) % 90
            spend = 1500.0 + (i * 17.5) % 8500.0
            base_roas_map = {
                "TikTok": 2.85,
                "Meta": 2.55,
                "YouTube": 2.45,
                "Twitch Influencers": 3.05,
                "Programmatic 3D": 1.75,
                "Connected TV": 1.45,
            }
            roas = base_roas_map.get(ch, 2.2) * (0.85 + ((i * 13) % 30) / 100.0)
            rev = spend * roas
            installs = int(spend / (20.0 + (i % 15)))

            records.append(
                {
                    "record_id": f"cohort-{i+1:04d}",
                    "date": f"2026-05-{1 + (day_offset % 28):02d}",
                    "franchise": fran,
                    "channel": ch,
                    "spend_usd": round(spend, 2),
                    "revenue_usd": round(rev, 2),
                    "d7_roas": round(roas, 4),
                    "installs": installs,
                    "cpi_usd": round(spend / max(1, installs), 2),
                    "impressions": installs * 120,
                    "clicks": installs * 6,
                }
            )

        return records


data_generator = DataGeneratorService()
