"""Hybrid BQML Runner & High-Throughput Structured Data Generator.

Provides:
1. Live BigQuery Execution: Runs BQML `AI.GENERATE_TABLE` queries with `OUTPUT_SCHEMA` parameter.
2. Local High-Throughput Deterministic Generation: Generates 10M player telemetry events,
   500k community sentiment stream, 100k 3D ad impressions, SHAP 9-grid attributions,
   2D Shapley game-theoretic marginal lift, and cross-franchise schedule fatigue scenarios.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
import numpy as np

try:
    from ..config import config
except (ImportError, ValueError):
    from config import config


class HybridBQMLRunner:
    """Orchestrates BQML AI.GENERATE_TABLE and local structured dataset generation."""

    def __init__(self):
        self.rng = np.random.default_rng(seed=2026)

    def execute_bqml_sql_file(self, sql_file_path: str, project_id: Optional[str] = None) -> bool:
        """Execute a SQL script containing AI.GENERATE_TABLE or DDL on BigQuery."""
        proj = project_id or config.project_id
        try:
            from google.cloud import bigquery

            client = bigquery.Client(project=proj)
            with open(sql_file_path, "r", encoding="utf-8") as f:
                query_text = f.read()

            print(f"Executing BigQuery script: {os.path.basename(sql_file_path)}...")
            query_job = client.query(query_text)
            query_job.result()  # Wait for completion
            print(f"✓ Successfully executed {os.path.basename(sql_file_path)} on BigQuery project '{proj}'.")
            return True
        except Exception as e:
            print(f"Notice: Live BigQuery execution for {os.path.basename(sql_file_path)} encountered: {e}")
            return False

    def generate_creative_shapley_marginal_lift(self, count: int = 20) -> List[Dict[str, Any]]:
        """Generate 2D Shapley marginal lift values separating Top-of-Funnel CTR from Lower-Funnel CTI."""
        canonical_features = [
            {
                "asset_id": "asset-fc27-bellingham-001",
                "franchise": "EA Sports FC",
                "feature_name": "FUT Pack Walkout Jude Bellingham",
                "feature_category": "LOWER_FUNNEL_MONETIZATION",
                "funnel_tier": "LOWER_FUNNEL_MONETIZATION",
                "marginal_ctr_lift_pct": 4.2,
                "marginal_cti_lift_pct": 32.4,
                "marginal_d7_roas_multiplier": 3.42,
                "confidence_score": 0.96,
            },
            {
                "asset_id": "asset-fc27-trickshots-002",
                "franchise": "EA Sports FC",
                "feature_name": "Skill Move / Trick Shot Showcase",
                "feature_category": "TOP_OF_FUNNEL",
                "funnel_tier": "TOP_OF_FUNNEL",
                "marginal_ctr_lift_pct": 41.0,
                "marginal_cti_lift_pct": -12.1,
                "marginal_d7_roas_multiplier": 1.85,
                "confidence_score": 0.94,
            },
            {
                "asset_id": "asset-apex-heirloom-003",
                "franchise": "Apex Legends",
                "feature_name": "Apex Mythic Heirloom Inspect",
                "feature_category": "LOWER_FUNNEL_MONETIZATION",
                "funnel_tier": "LOWER_FUNNEL_MONETIZATION",
                "marginal_ctr_lift_pct": 6.5,
                "marginal_cti_lift_pct": 28.5,
                "marginal_d7_roas_multiplier": 3.15,
                "confidence_score": 0.95,
            },
            {
                "asset_id": "asset-apex-superglide-004",
                "franchise": "Apex Legends",
                "feature_name": "Apex Superglide / Tap-Strafe",
                "feature_category": "TOP_OF_FUNNEL",
                "funnel_tier": "TOP_OF_FUNNEL",
                "marginal_ctr_lift_pct": 38.0,
                "marginal_cti_lift_pct": -9.0,
                "marginal_d7_roas_multiplier": 1.92,
                "confidence_score": 0.92,
            },
            {
                "asset_id": "asset-apex-ping-005",
                "franchise": "Apex Legends",
                "feature_name": "Tactical Map Ping Coordination",
                "feature_category": "NEUTRAL_ENGAGEMENT",
                "funnel_tier": "MOFU",
                "marginal_ctr_lift_pct": 12.0,
                "marginal_cti_lift_pct": 8.5,
                "marginal_d7_roas_multiplier": 2.45,
                "confidence_score": 0.91,
            },
            {
                "asset_id": "asset-fc27-weather-006",
                "franchise": "EA Sports FC",
                "feature_name": "Dynamic Stadium Weather Transition",
                "feature_category": "NEUTRAL_ENGAGEMENT",
                "funnel_tier": "MOFU",
                "marginal_ctr_lift_pct": 15.2,
                "marginal_cti_lift_pct": 4.1,
                "marginal_d7_roas_multiplier": 2.20,
                "confidence_score": 0.90,
            },
            {
                "asset_id": "asset-bf6-battlepass-007",
                "franchise": "Battlefield 6",
                "feature_name": "Cinematic Battle Pass Teaser",
                "feature_category": "TOP_OF_FUNNEL",
                "funnel_tier": "TOFU",
                "marginal_ctr_lift_pct": 22.5,
                "marginal_cti_lift_pct": -2.4,
                "marginal_d7_roas_multiplier": 2.05,
                "confidence_score": 0.89,
            },
            {
                "asset_id": "asset-sims4-build-008",
                "franchise": "The Sims 4",
                "feature_name": "Lobby Squad Customization",
                "feature_category": "LOWER_FUNNEL_MONETIZATION",
                "funnel_tier": "BOFU",
                "marginal_ctr_lift_pct": 3.8,
                "marginal_cti_lift_pct": 14.2,
                "marginal_d7_roas_multiplier": 2.65,
                "confidence_score": 0.93,
            },
            {
                "asset_id": "asset-apex-synergy-009",
                "franchise": "Apex Legends",
                "feature_name": "Hero Ability Synergy Combo",
                "feature_category": "NEUTRAL_ENGAGEMENT",
                "funnel_tier": "MOFU",
                "marginal_ctr_lift_pct": 18.4,
                "marginal_cti_lift_pct": 10.8,
                "marginal_d7_roas_multiplier": 2.75,
                "confidence_score": 0.92,
            },
            {
                "asset_id": "asset-fc27-beatdrop-010",
                "franchise": "EA Sports FC",
                "feature_name": "Audio Signature Beat Drop",
                "feature_category": "TOP_OF_FUNNEL",
                "funnel_tier": "TOFU",
                "marginal_ctr_lift_pct": 29.0,
                "marginal_cti_lift_pct": -6.5,
                "marginal_d7_roas_multiplier": 1.95,
                "confidence_score": 0.91,
            },
        ]

        records = []
        now_str = datetime.now(timezone.utc).isoformat()

        for item in canonical_features:
            record = dict(item)
            record["updated_at"] = now_str
            records.append(record)

        # Synthesize additional if count > len(canonical_features)
        franchises = config.franchises
        categories = ["TOP_OF_FUNNEL", "LOWER_FUNNEL_MONETIZATION", "NEUTRAL_ENGAGEMENT"]
        funnels = {"TOP_OF_FUNNEL": "TOFU", "LOWER_FUNNEL_MONETIZATION": "BOFU", "NEUTRAL_ENGAGEMENT": "MOFU"}

        for i in range(len(canonical_features), count):
            franchise = str(self.rng.choice(franchises))
            cat = str(self.rng.choice(categories))
            tier = funnels[cat]
            if cat == "TOP_OF_FUNNEL":
                ctr = round(float(self.rng.uniform(20.0, 45.0)), 1)
                cti = round(float(self.rng.uniform(-15.0, -1.0)), 1)
                roas = round(float(self.rng.uniform(1.70, 2.10)), 2)
            elif cat == "LOWER_FUNNEL_MONETIZATION":
                ctr = round(float(self.rng.uniform(2.0, 8.0)), 1)
                cti = round(float(self.rng.uniform(15.0, 35.0)), 1)
                roas = round(float(self.rng.uniform(2.80, 3.80)), 2)
            else:
                ctr = round(float(self.rng.uniform(8.0, 20.0)), 1)
                cti = round(float(self.rng.uniform(3.0, 15.0)), 1)
                roas = round(float(self.rng.uniform(2.20, 2.90)), 2)

            records.append({
                "asset_id": f"asset-gen-{i+1:03d}",
                "franchise": franchise,
                "feature_name": f"Synthetic Creative Mechanic {i+1}",
                "feature_category": cat,
                "funnel_tier": tier,
                "marginal_ctr_lift_pct": ctr,
                "marginal_cti_lift_pct": cti,
                "marginal_d7_roas_multiplier": roas,
                "confidence_score": round(float(self.rng.uniform(0.88, 0.97)), 2),
                "updated_at": now_str,
            })

        return records

    def generate_cross_franchise_fatigue_scenarios(self) -> List[Dict[str, Any]]:
        """Generate cross-franchise schedule fatigue scenarios with the canonical Oct 24-27 collision."""
        now_str = datetime.now(timezone.utc).isoformat()
        scenarios = [
            {
                "campaign_id": "camp-fc27-toty-001",
                "target_franchise": "EA Sports FC",
                "conflicting_franchise": "Apex Legends",
                "flight_start": "2026-10-24",
                "flight_end": "2026-10-27",
                "shared_ea_id_overlap_pct": 42.1,
                "ad_fatigue_suppression_penalty_pct": 14.5,
                "net_bookings_risk_usd": 420000.0,
                "recommended_timeline_shift_days": 3,
                "projected_net_bookings_recovery_usd": 420000.0,
                "created_at": now_str,
            },
            {
                "campaign_id": "camp-bf6-beta-002",
                "target_franchise": "Battlefield 6",
                "conflicting_franchise": "Apex Legends",
                "flight_start": "2026-11-12",
                "flight_end": "2026-11-16",
                "shared_ea_id_overlap_pct": 28.4,
                "ad_fatigue_suppression_penalty_pct": 9.2,
                "net_bookings_risk_usd": 185000.0,
                "recommended_timeline_shift_days": 2,
                "projected_net_bookings_recovery_usd": 185000.0,
                "created_at": now_str,
            },
            {
                "campaign_id": "camp-sims4-expansion-003",
                "target_franchise": "The Sims 4",
                "conflicting_franchise": "EA Sports FC",
                "flight_start": "2026-09-18",
                "flight_end": "2026-09-22",
                "shared_ea_id_overlap_pct": 12.1,
                "ad_fatigue_suppression_penalty_pct": 3.8,
                "net_bookings_risk_usd": 65000.0,
                "recommended_timeline_shift_days": 0,
                "projected_net_bookings_recovery_usd": 65000.0,
                "created_at": now_str,
            },
        ]
        return scenarios

    def generate_collision_scenario_oct24_27(self) -> Dict[str, Any]:
        """Generate canonical collision scenario object for Oct 24-27 EA FC vs Apex."""
        return {
            "target_campaign_id": "camp-fc27-toty-001",
            "target_campaign_name": "EA FC 27 TOTY Mid-Season Push",
            "conflicting_campaign_id": "camp-apex-s26-002",
            "conflicting_campaign_name": "Apex Legends Season 26 Launch",
            "target_franchise": "EA Sports FC",
            "conflicting_franchise": "Apex Legends",
            "flight_start": "2026-10-24",
            "flight_end": "2026-10-27",
            "shared_ea_id_overlap_pct": 42.1,
            "ad_fatigue_suppression_penalty_pct": 14.5,
            "net_bookings_risk_usd": 420000.0,
            "recommended_timeline_shift_days": 3,
            "mitigated_flight_start": "2026-10-27",
            "mitigated_flight_end": "2026-11-07",
            "projected_net_bookings_recovery_usd": 420000.0,
            "baseline_net_bookings_usd": 4710000.0,
            "unmitigated_net_bookings_usd": 4290000.0,
            "post_mitigation_net_bookings_usd": 5130000.0,
            "projected_installs": 364000,
            "blended_cpi_usd": 4.12,
            "day7_roas": 3.42,
            "shared_player_count": 1280000,
            "mitigation_strategy": "Timeline shift (+3 days) to Oct 27-Nov 07 & negative audience suppression on heavy Apex players",
            "status": "AMBER_COLLISION_DETECTED",
        }

    def generate_bellingham_shapley_tradeoff(self) -> Dict[str, Any]:
        """Generate Jude Bellingham Walkout vs Trick Shots 2D Shapley Trade-off."""
        return {
            "franchise": "EA Sports FC",
            "asset_title": "EA SPORTS FC 27 - Official Gameplay Trailer (15s Pre-Test)",
            "comparison_pair": "FUT Pack Walkout Jude Bellingham vs Skill Move / Trick Shot Showcase",
            "features": [
                {
                    "feature_name": "FUT Pack Walkout Jude Bellingham",
                    "category": "LOWER_FUNNEL_MONETIZATION",
                    "funnel_tier": "BOFU",
                    "marginal_ctr_lift_pct": 4.2,
                    "marginal_cti_lift_pct": 32.4,
                    "marginal_d7_roas_multiplier": 3.42,
                    "confidence_score": 0.96,
                    "description": "High intent, high-converting walkout animation hook driving direct in-game store conversions."
                },
                {
                    "feature_name": "Skill Move / Trick Shot Showcase",
                    "category": "TOP_OF_FUNNEL",
                    "funnel_tier": "TOFU",
                    "marginal_ctr_lift_pct": 41.0,
                    "marginal_cti_lift_pct": -12.1,
                    "marginal_d7_roas_multiplier": 1.85,
                    "confidence_score": 0.94,
                    "description": "Viral stopping power and high click-through rate, but lower day-7 conversion efficiency."
                }
            ],
            "funnel_balance_index": 0.74,
            "prescriptive_action": "Deploy Trick Shot hook in 0:00-0:03 for viral thumb-stop, transition to Jude Bellingham Walkout at 0:08 for high CTI monetization.",
            "recommended_edit": "Sequence 9:16 vertical cut with trick-shot intro into Bellingham gold walkout climax."
        }

    def generate_apex_shapley_tradeoff(self) -> Dict[str, Any]:
        """Generate Apex Mythic Heirloom vs Superglide 2D Shapley Trade-off."""
        return {
            "franchise": "Apex Legends",
            "asset_title": "Apex Legends Season 26 - Launch Trailer (15s Pre-Test)",
            "comparison_pair": "Apex Mythic Heirloom Inspect vs Apex Superglide / Tap-Strafe",
            "features": [
                {
                    "feature_name": "Apex Mythic Heirloom Inspect",
                    "category": "LOWER_FUNNEL_MONETIZATION",
                    "funnel_tier": "BOFU",
                    "marginal_ctr_lift_pct": 6.5,
                    "marginal_cti_lift_pct": 28.5,
                    "marginal_d7_roas_multiplier": 3.15,
                    "confidence_score": 0.95,
                    "description": "Premium cosmetic showcase driving high-tier pack purchases and immediate monetization."
                },
                {
                    "feature_name": "Apex Superglide / Tap-Strafe",
                    "category": "TOP_OF_FUNNEL",
                    "funnel_tier": "TOFU",
                    "marginal_ctr_lift_pct": 38.0,
                    "marginal_cti_lift_pct": -9.0,
                    "marginal_d7_roas_multiplier": 1.92,
                    "confidence_score": 0.92,
                    "description": "High-velocity movement mechanics capturing immediate gamer attention and driving top-of-funnel CTR."
                }
            ],
            "funnel_balance_index": 0.76,
            "prescriptive_action": "Open with Superglide movement clip in first 3 seconds, close with Heirloom Inspect and event CTA.",
            "recommended_edit": "Combine high-octane movement gameplay hook with mythic heirloom inspect payoff."
        }

    def generate_channel_performance_daily(self, count: int = 120) -> List[Dict[str, Any]]:
        """Generate daily channel performance metrics across media channels and franchises."""
        channels = list(config.channel_parameters.keys())
        franchises = config.franchises
        start_dt = datetime.strptime("2026-05-01", "%Y-%m-%d")
        records = []

        for i in range(count):
            dt = start_dt + timedelta(days=(i % 90))
            channel = channels[i % len(channels)]
            franchise = franchises[i % len(franchises)]

            params = config.channel_parameters[channel]
            base_roas = params["base_roas"]

            spend = round(float(self.rng.uniform(5000.0, 45000.0)), 2)
            cpm = 12.0 if channel in ("Paid Social", "DOOH") else 20.0
            impressions = int((spend / cpm) * 1000)
            ctr = 0.022 if channel == "Paid Search" else 0.012
            clicks = int(impressions * ctr)
            cvr = 0.05 if channel == "Paid Search" else 0.03
            conversions = int(clicks * cvr)
            cpi = round(spend / max(1, conversions), 2)
            roas = round(base_roas * float(self.rng.uniform(0.85, 1.15)), 2)

            records.append({
                "date": dt.strftime("%Y-%m-%d"),
                "channel": channel,
                "franchise": franchise,
                "spend_usd": spend,
                "impressions": impressions,
                "clicks": clicks,
                "conversions": conversions,
                "cpi": cpi,
                "cvr": round(conversions / max(1, clicks), 4),
                "roas": roas,
            })
        return records

    def generate_dim_campaign_taxonomy(self) -> List[Dict[str, Any]]:
        """Generate campaign taxonomy metadata records."""
        return [
            {
                "campaign_id": "camp-fc27-toty-001",
                "campaign_name": "EA FC 27 TOTY Mid-Season Push",
                "franchise": "EA Sports FC",
                "flight_start": "2026-10-24",
                "flight_end": "2026-11-07",
                "target_budget_usd": 2500000.0,
                "primary_channel": "Paid Social",
                "target_cohort": "Active Ultimate Team Players & Lapsed FC26 Gamers",
            },
            {
                "campaign_id": "camp-apex-s26-002",
                "campaign_name": "Apex Legends Season 26 Launch",
                "franchise": "Apex Legends",
                "flight_start": "2026-10-24",
                "flight_end": "2026-11-14",
                "target_budget_usd": 3200000.0,
                "primary_channel": "Influencers",
                "target_cohort": "Competitive FPS Players & Battle Pass Grinders",
            },
            {
                "campaign_id": "camp-bf6-launch-003",
                "campaign_name": "Battlefield 6 Global Launch",
                "franchise": "Battlefield 6",
                "flight_start": "2026-11-01",
                "flight_end": "2026-12-01",
                "target_budget_usd": 4000000.0,
                "primary_channel": "CTV",
                "target_cohort": "Tactical Shooter Fans & Mil-Sim Communities",
            },
            {
                "campaign_id": "camp-sims4-life-004",
                "campaign_name": "The Sims 4 Life Stories Expansion",
                "franchise": "The Sims 4",
                "flight_start": "2026-09-15",
                "flight_end": "2026-10-15",
                "target_budget_usd": 1500000.0,
                "primary_channel": "Paid Social",
                "target_cohort": "Casual & Creative Sandbox Gamers",
            },
        ]

    def generate_audience_segments(self) -> List[Dict[str, Any]]:
        """Generate high-level audience segment profiles."""
        return [
            {
                "segment_id": "seg-fc-whales",
                "segment_name": "Ultimate Team High-LTV Monetizers",
                "franchise": "EA Sports FC",
                "player_archetype": "ULTIMATE_TEAM_WHALE",
                "active_user_count": 450000,
                "mean_willingness_to_pay_usd": 145.0,
                "churn_risk_rate": 0.08,
            },
            {
                "segment_id": "seg-apex-competitors",
                "segment_name": "Apex Ranked Grinders & Scrimmers",
                "franchise": "Apex Legends",
                "player_archetype": "COMPETITIVE_GRINDER",
                "active_user_count": 820000,
                "mean_willingness_to_pay_usd": 38.0,
                "churn_risk_rate": 0.15,
            },
            {
                "segment_id": "seg-bf-tactical",
                "segment_name": "Battlefield Squad Veterans",
                "franchise": "Battlefield 6",
                "player_archetype": "COMPETITIVE_GRINDER",
                "active_user_count": 610000,
                "mean_willingness_to_pay_usd": 42.0,
                "churn_risk_rate": 0.12,
            },
            {
                "segment_id": "seg-sims-creators",
                "segment_name": "Sims Sandbox Architects",
                "franchise": "The Sims 4",
                "player_archetype": "CASUAL_SOCIALIZER",
                "active_user_count": 950000,
                "mean_willingness_to_pay_usd": 28.0,
                "churn_risk_rate": 0.06,
            },
        ]

    def generate_community_sentiment_stream(self, count: int = 1000) -> List[Dict[str, Any]]:
        """Local generator conforming to BQML AI.GENERATE_TABLE OUTPUT_SCHEMA for community sentiment."""
        platforms = ["Steam", "Reddit", "Discord", "Twitch Chat", "EA Forums"]
        franchises = config.franchises
        issues = ["BATTLE_PASS_GRIND", "WEAPON_BALANCE", "SERVER_LAG", "STORE_PRICING", "AUDIO_BUG", "AUDIO_PRAISE", "NONE"]
        archetypes = ["COMPETITIVE_GRINDER", "LORE_SEEKER", "CASUAL_SOCIALIZER", "ULTIMATE_TEAM_WHALE"]

        sample_verbatims = {
            "BATTLE_PASS_GRIND": [
                "Tier 15 unlock requirement is way too high. Need 40 hours just for one skin.",
                "Battle pass progression feels so much slower this season, please buff XP.",
                "Grinding 8 hours a day and barely moving through the reward track.",
            ],
            "WEAPON_BALANCE": [
                "The new energy rifle is totally broken in ranked lobbies, nerf velocity ASAP.",
                "Shotgun spread feels consistent now after the patch, great tuning update.",
                "R-301 and Flatline balance is in a great spot right now.",
            ],
            "SERVER_LAG": [
                "Getting 20hz tickrate drops and no-reg hits during final ring.",
                "Packet loss in Dallas servers is making tournament scrims unplayable.",
                "Rubberbanding during weekend peak hours is getting frustrating.",
            ],
            "STORE_PRICING": [
                "2400 Apex coins for a recolor? Monetization team is out of touch.",
                "Event packs need bad luck protection. $160 for an heirloom is wild.",
                "The new bundle pricing is much fairer than last season.",
            ],
            "AUDIO_BUG": [
                "Zero footstep audio when enemy team pushes from behind on zip line.",
                "Gunshot volume is deafening while enemy mantle audio is silent.",
            ],
            "AUDIO_PRAISE": [
                "The new spatial audio mix in Battlefield 6 is mind-blowing with headphones.",
                "Crowd chants in FC 26 dynamic audio atmosphere feel like a real match.",
            ],
            "NONE": [
                "Having a blast with the new squad composition meta!",
                "Great weekend session with the squad, won 4 matches in a row.",
            ],
        }

        start_dt = datetime.strptime("2026-06-01", "%Y-%m-%d")
        records = []

        for i in range(count):
            franchise = str(self.rng.choice(franchises))
            platform = str(self.rng.choice(platforms))
            issue = str(self.rng.choice(issues))
            archetype = str(self.rng.choice(archetypes))

            if issue in ("BATTLE_PASS_GRIND", "SERVER_LAG", "STORE_PRICING", "AUDIO_BUG"):
                polarity = round(float(self.rng.uniform(-0.85, -0.20)), 2)
                friction = round(float(self.rng.uniform(0.60, 0.95)), 2)
            elif issue == "AUDIO_PRAISE":
                polarity = round(float(self.rng.uniform(0.60, 0.95)), 2)
                friction = round(float(self.rng.uniform(0.0, 0.15)), 2)
            else:
                polarity = round(float(self.rng.uniform(-0.30, 0.70)), 2)
                friction = round(float(self.rng.uniform(0.10, 0.50)), 2)

            verbatim_list = sample_verbatims.get(issue, ["Solid patch update."])
            raw_text = str(self.rng.choice(verbatim_list))
            dt = start_dt + timedelta(seconds=int(self.rng.integers(0, 5184000)))

            records.append({
                "message_id": f"msg-{uuid.uuid4()}",
                "timestamp": dt.isoformat() + "Z",
                "platform": platform,
                "franchise": franchise,
                "sentiment_polarity": polarity,
                "detected_issue": issue,
                "player_archetype": archetype,
                "friction_intensity": friction,
                "raw_text": raw_text,
            })

        return records

    def generate_player_telemetry_events(self, count: int = 1000) -> List[Dict[str, Any]]:
        """Local generator conforming to BQML AI.GENERATE_TABLE OUTPUT_SCHEMA for player telemetry."""
        franchises = config.franchises
        states = ["High Frustration", "Casual Weekend", "Hardcore Competitor", "Lapsed Whale"]
        reasons = ["UNLOCK_FATIGUE", "WIN_STREAK_EUPHORIA", "COSMETIC_FOMO", "MATCHMAKING_IMBALANCE"]

        start_dt = datetime.strptime("2026-07-01", "%Y-%m-%d")
        records = []

        for i in range(count):
            franchise = str(self.rng.choice(franchises))
            state = str(self.rng.choice(states))
            reason = str(self.rng.choice(reasons))

            if state == "Hardcore Competitor":
                session_len = round(float(self.rng.uniform(90.0, 300.0)), 1)
                apm = round(float(self.rng.uniform(180.0, 380.0)), 1)
                loss_streak = int(self.rng.integers(0, 4))
                churn_prob = round(float(self.rng.uniform(0.05, 0.20)), 3)
            elif state == "High Frustration":
                session_len = round(float(self.rng.uniform(15.0, 60.0)), 1)
                apm = round(float(self.rng.uniform(80.0, 220.0)), 1)
                loss_streak = int(self.rng.integers(4, 12))
                churn_prob = round(float(self.rng.uniform(0.65, 0.95)), 3)
            else:
                session_len = round(float(self.rng.uniform(30.0, 120.0)), 1)
                apm = round(float(self.rng.uniform(60.0, 160.0)), 1)
                loss_streak = int(self.rng.integers(0, 5))
                churn_prob = round(float(self.rng.uniform(0.20, 0.50)), 3)

            store_visits = int(self.rng.integers(0, 6))
            dt = start_dt + timedelta(seconds=int(self.rng.integers(0, 2592000)))

            records.append({
                "event_id": f"evt-{uuid.uuid4()}",
                "session_id": f"sess-{uuid.uuid4()}",
                "xuid": f"xuid-{self.rng.integers(100000, 999999)}",
                "ea_id": f"ea-user-{self.rng.integers(100000, 999999)}",
                "franchise": franchise,
                "timestamp": dt.isoformat() + "Z",
                "session_length_minutes": session_len,
                "actions_per_minute": apm,
                "loss_streak_count": loss_streak,
                "store_page_visits": store_visits,
                "churn_probability": churn_prob,
                "behavioral_state": state,
                "state_transition_reason": reason,
            })

        return records

    def generate_commerce_3d_impressions(self, count: int = 1000) -> List[Dict[str, Any]]:
        """Local generator conforming to BQML AI.GENERATE_TABLE OUTPUT_SCHEMA for 3D in-game ads."""
        franchises = ["EA Sports FC", "Apex Legends", "Battlefield 6"]
        surfaces = ["STADIUM_BOARDS", "PAUSE_SCREENS", "ROAD_BILLBOARDS"]
        dma_pool = [501, 803, 602, 506, 504, 623, 511, 524, 618]
        statuses = ["VIEWABLE_PASSED", "VIEWABLE_PASSED", "VIEWABLE_PASSED", "OCCLUSION_FAILED", "DWELL_UNDER_THRESHOLD"]

        start_dt = datetime.strptime("2026-08-01", "%Y-%m-%d")
        records = []

        for i in range(count):
            franchise = str(self.rng.choice(franchises))
            surface = str(self.rng.choice(surfaces))
            dma = int(self.rng.choice(dma_pool))
            status = str(self.rng.choice(statuses))

            raw_beta = float(self.rng.beta(a=2.0, b=5.0))
            dwell_sec = round(0.1 + raw_beta * 7.9, 2)
            if status == "DWELL_UNDER_THRESHOLD":
                dwell_sec = round(float(self.rng.uniform(0.1, 0.9)), 2)

            angle = round(float(self.rng.uniform(5.0, 65.0)), 1)
            occlusion = round(float(self.rng.uniform(0.0, 15.0)), 1) if status != "OCCLUSION_FAILED" else round(float(self.rng.uniform(42.0, 85.0)), 1)
            clearing_cpm = round(float(self.rng.uniform(14.50, 38.00)), 2)
            brand_safety = round(float(self.rng.uniform(0.92, 0.99)), 3)

            dt = start_dt + timedelta(seconds=int(self.rng.integers(0, 864000)))

            records.append({
                "impression_id": f"imp-{uuid.uuid4()}",
                "match_id": f"match-{self.rng.integers(10000, 99999)}",
                "franchise": franchise,
                "dma_code": dma,
                "surface": surface,
                "timestamp": dt.isoformat() + "Z",
                "dwell_time_seconds": dwell_sec,
                "camera_view_angle_degrees": angle,
                "occlusion_percentage": occlusion,
                "clearing_cpm_usd": clearing_cpm,
                "ias_brand_safety_score": brand_safety,
                "ias_viewability_status": status,
            })

        return records

    def generate_creative_shap_attributions(self, count: int = 100) -> List[Dict[str, Any]]:
        """Local generator conforming to BQML AI.GENERATE_TABLE OUTPUT_SCHEMA for SHAP 9-grid."""
        franchises = config.franchises
        surfaces = ["EA_APP_LAUNCHER", "IN_GAME_STORE", "STADIUM_BOARDS", "PAUSE_SCREENS", "MOBILE_COMPANION", "STREAMING_OVERLAYS"]
        stages = ["ToFu_Exploration", "MoFu_Progression", "BoFu_Conversion"]

        features_pool = [
            ("Squad Breach & Clear", "GAMEPLAY_MECHANIC", "GOLD_MINES", "Scale Up", 12, 3.85, 0.62),
            ("Kinetic Superglide Hook", "GAMEPLAY_MECHANIC", "GOLD_MINES", "Scale Up", 14, 3.60, 0.58),
            ("Dynamic Storm Drop", "VISUAL_HOOK", "CORE_DRIVERS", "Maintain", 28, 2.95, 0.44),
            ("Finessed Bicycle Kick", "GAMEPLAY_MECHANIC", "CORE_DRIVERS", "Maintain", 32, 2.80, 0.41),
            ("Cinematic Holo Spray", "VISUAL_HOOK", "SATURATED_STARS", "Monitor / Retire", 55, 2.65, 0.35),
            ("Architect Mode Speedbuild", "GAMEPLAY_MECHANIC", "UNTAPPED", "Test More", 8, 2.15, 0.22),
            ("Weapon Inspection Flourish", "VISUAL_HOOK", "WORKHORSES", "Optimize", 24, 1.95, 0.18),
            ("Celebration Emote Reel", "AUDIO_CUE", "EFFICIENCY_RISKS", "Trim Budget", 48, 1.45, 0.05),
            ("Static Logo Splash", "VISUAL_HOOK", "MONEY_PITS", "Kill Immediately", 62, 0.95, -0.28),
            ("Generic Teaser Fade", "AUDIO_CUE", "MONEY_PITS", "Kill Immediately", 50, 0.88, -0.32),
            ("Lobby Music Theme", "AUDIO_CUE", "NOISE", "Discard", 10, 1.05, -0.05),
            ("Inventory Crafting HUD", "GAMEPLAY_MECHANIC", "UNDERPERFORMERS", "Pivot Creative", 22, 1.12, -0.02),
        ]

        records = []
        for i in range(count):
            feat_idx = i % len(features_pool)
            name, cat, quad, rec, base_freq, base_roas, base_shap = features_pool[feat_idx]

            franchise = str(self.rng.choice(franchises))
            surface = str(self.rng.choice(surfaces))
            stage = str(self.rng.choice(stages))

            freq = int(max(1, base_freq + self.rng.integers(-3, 4)))
            roas_impact = round(max(0.7, base_roas + float(self.rng.uniform(-0.15, 0.15))), 2)
            shap_val = round(base_shap + float(self.rng.uniform(-0.04, 0.04)), 3)

            records.append({
                "attribution_id": f"attr-{uuid.uuid4()}",
                "snapshot_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "campaign_id": f"camp-{self.rng.integers(1, 10)}",
                "franchise": franchise,
                "feature_name": name,
                "feature_category": cat,
                "funnel_stage": stage,
                "surface": surface,
                "frequency_count": freq,
                "mean_shap_value": shap_val,
                "marginal_roas_impact": roas_impact,
                "tactical_quadrant": quad,
                "strategic_recommendation": rec,
                "creative_reasoning": f"Mechanic '{name}' drives direct player intent ({stage}) on {surface} with {roas_impact}x marginal ROAS.",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })

        return records


hybrid_bqml_runner = HybridBQMLRunner()
