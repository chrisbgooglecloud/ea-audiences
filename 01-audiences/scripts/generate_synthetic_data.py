#!/usr/bin/env python3
"""
EA SPORTS FC - Engagement Intelligence Engine Synthetic Data Generator
Generates comprehensive synthetic player identities, EA FC game modes,
FUT Clubs, Pro Clubs, time-series telemetry events, and contextual FUT marketing offers.
"""

import os
import json
import random
import math
from datetime import datetime, timedelta

# Seed for reproducibility
random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# CONSTANTS & METADATA FOR EA SPORTS FC
# -------------------------------------------------------------
FRANCHISES = [
    {
        "game_id": "game-fc26-ultimate-team",
        "title": "FC 26 Ultimate Team (FUT)",
        "genre": "Competitive Card & Squad Building",
        "platforms": ["EA_ACCOUNT", "PLAYSTATION_PSN", "XBOX_XUID", "COMPANION_APP", "STEAM_ID"],
        "base_hours": (100, 2200),
        "base_spend": (50, 4500),
    },
    {
        "game_id": "game-fc26-clubs-rush",
        "title": "FC 26 Clubs & Rush 5v5",
        "genre": "Team Social & 11v11 / 5v5",
        "platforms": ["EA_ACCOUNT", "PLAYSTATION_PSN", "XBOX_XUID", "STEAM_ID"],
        "base_hours": (50, 1200),
        "base_spend": (0, 350),
    },
    {
        "game_id": "game-fc26-career-mode",
        "title": "FC 26 Manager & Player Career",
        "genre": "Tactical Management Simulation",
        "platforms": ["EA_ACCOUNT", "PLAYSTATION_PSN", "XBOX_XUID", "STEAM_ID"],
        "base_hours": (40, 900),
        "base_spend": (0, 70),
    },
    {
        "game_id": "game-fc26-online-seasons",
        "title": "FC 26 Online Seasons",
        "genre": "Head-to-Head Competitive",
        "platforms": ["EA_ACCOUNT", "PLAYSTATION_PSN", "XBOX_XUID"],
        "base_hours": (20, 600),
        "base_spend": (0, 50),
    },
    {
        "game_id": "game-fc24-legacy",
        "title": "EA SPORTS FC 24 (Legacy)",
        "genre": "Historical Franchise Migration",
        "platforms": ["EA_ACCOUNT", "PLAYSTATION_PSN", "XBOX_XUID"],
        "base_hours": (80, 1500),
        "base_spend": (0, 1800),
    },
]

ARCHETYPES = [
    {
        "name": "COMPETITIVE_GRINDER",
        "display_name": "FUT Champions Weekend League Grinder",
        "weight": 0.32,
        "avg_spend": (80, 650),
        "avg_hours": (500, 2200),
        "churn_risk_range": (0.35, 0.88),
        "tilt_sensitivity_range": (0.70, 0.98),
        "embedding_bias": [0.9, -0.3, 0.85, -0.2],
    },
    {
        "name": "ULTIMATE_TEAM_WHALE",
        "display_name": "FUT Icon & Promo Pack Whale",
        "weight": 0.16,
        "avg_spend": (1200, 5500),
        "avg_hours": (400, 1800),
        "churn_risk_range": (0.10, 0.55),
        "tilt_sensitivity_range": (0.30, 0.65),
        "embedding_bias": [0.3, 0.98, 0.4, 0.90],
    },
    {
        "name": "CASUAL_SOCIALIZER",
        "display_name": "Pro Clubs & Rush Weekend Warrior",
        "weight": 0.38,
        "avg_spend": (20, 300),
        "avg_hours": (80, 600),
        "churn_risk_range": (0.15, 0.50),
        "tilt_sensitivity_range": (0.10, 0.45),
        "embedding_bias": [-0.5, 0.3, -0.2, 0.8],
    },
    {
        "name": "LORE_SEEKER",
        "display_name": "Tactical Career Mode Purist",
        "weight": 0.14,
        "avg_spend": (0, 120),
        "avg_hours": (120, 850),
        "churn_risk_range": (0.20, 0.45),
        "tilt_sensitivity_range": (0.05, 0.30),
        "embedding_bias": [-0.4, -0.3, -0.9, 0.1],
    },
]

METROS = [
    {"dma": 501, "name": "New York, NY", "weight": 0.12},
    {"dma": 803, "name": "Los Angeles, CA", "weight": 0.10},
    {"dma": 602, "name": "Chicago, IL", "weight": 0.08},
    {"dma": 623, "name": "Dallas-Ft. Worth, TX", "weight": 0.07},
    {"dma": 524, "name": "Atlanta, GA", "weight": 0.06},
    {"dma": 819, "name": "Seattle-Tacoma, WA", "weight": 0.06},
    {"dma": 807, "name": "San Francisco-Oak-San Jose, CA", "weight": 0.07},
    {"dma": 506, "name": "Boston, MA", "weight": 0.05},
    {"dma": 504, "name": "Philadelphia, PA", "weight": 0.05},
    {"dma": 753, "name": "Phoenix, AZ", "weight": 0.04},
    {"dma": 528, "name": "Miami-Ft. Lauderdale, FL", "weight": 0.05},
    {"dma": 618, "name": "Houston, TX", "weight": 0.05},
    {"dma": 751, "name": "Denver, CO", "weight": 0.04},
    {"dma": 630, "name": "Minneapolis-St. Paul, MN", "weight": 0.04},
    {"dma": 820, "name": "Portland, OR", "weight": 0.03},
    {"dma": 511, "name": "Washington, DC", "weight": 0.05},
    {"dma": 517, "name": "Charlotte, NC", "weight": 0.04},
]

CLAN_PREFIXES = [
    "RedDevils", "Galacticos", "TikiTaka", "TotalFootball", "ApexFC", "JogaBonito",
    "SambaKings", "IconsXI", "Vanguard", "FutChamps", "Kopites", "Catalan", "Gunners",
    "Azzurri", "Bavaria", "Inter", "Real", "Athletic", "Dynasty", "PrimeXI"
]
CLAN_SUFFIXES = [
    "FC", "Clubs", "United", "Esports", "Squad", "Brigade", "Alliance", "Division",
    "Legion", "Warriors", "Syndicate", "Elite", "Pro", "XI", "Kings", "Academy"
]

PLAYER_NAME_PREFIXES = [
    "Mbappe", "Bellingham", "Haaland", "Vini", "Saka", "Zidane", "Ronaldo", "Messi",
    "Cruyff", "Gullit", "Pele", "Henry", "Kaka", "Neymar", "Modric", "Pedri",
    "Foden", "Yamal", "Musiala", "Saliba", "VanDijk", "Alisson", "DeBruyne", "Palmer"
]
PLAYER_NAME_SUFFIXES = [
    "FUT", "FC", "Champs", "Elite", "Prime", "99", "Pro", "R10", "CR7", "Skills",
    "Meta", "Dribbler", "Striker", "Goalie", "Manager", "Tactics", "Squad", "Captain"
]

MARKETING_OFFERS = [
    {
        "offer_id": "offer-fc26-champs-pity-pack",
        "offer_title": "FUT Champions Weekend League Loss-Mitigation Pity Pack",
        "target_franchise": "EA SPORTS FC 26",
        "offer_type": "PITY_PACK",
        "price_usd": 4.99,
        "discount_percent": 65.0,
        "trigger_condition": "CONSECUTIVE_LOSS_STREAK >= 3 IN_CHAMPS",
        "description": "500 FC Points + 10-Game Loan R9 Icon + 2x Extra Weekend League Entry Tokens triggered upon consecutive Champs losses to prevent rage quitting.",
    },
    {
        "offer_id": "offer-fc26-whale-promo-flash",
        "offer_title": "Ultimate Team Guaranteed 88+ Campaign Icon Flash Pack",
        "target_franchise": "EA SPORTS FC 26",
        "offer_type": "WHALE_FLASH",
        "price_usd": 49.99,
        "discount_percent": 25.0,
        "trigger_condition": "HIGH_SPEND_WHALE_SESSION_DECAY >= 4_DAYS",
        "description": "Exclusive 4,800 FC Points bundle with guaranteed walkout Icon selection for high-LTV FUT whales.",
    },
    {
        "offer_id": "offer-fc26-friday-boost",
        "offer_title": "Friday 6PM FUT Promo Drop & Weekend League Prep Pack",
        "target_franchise": "EA SPORTS FC 26",
        "offer_type": "WEEKEND_BOOST",
        "price_usd": 14.99,
        "discount_percent": 40.0,
        "trigger_condition": "FRIDAY_1800_SQUAD_LOGIN",
        "description": "1,500 FC Points + 1x 85+ x5 Rare Gold Players Pack for active weekend warriors entering Weekend League.",
    },
    {
        "offer_id": "offer-fc26-rush-evolution",
        "offer_title": "Rush 5v5 Squad Double XP & Premium Evolution Token",
        "target_franchise": "EA SPORTS FC 26",
        "offer_type": "RUSH_EVOLUTION",
        "price_usd": 7.99,
        "discount_percent": 50.0,
        "trigger_condition": "RUSH_SQUAD_CO_PLAY_WINDOW",
        "description": "Instant player rating boost evolution slot + 2x Squad Rush Points multiplier for Pro Clubs squads.",
    },
    {
        "offer_id": "offer-fc26-preorder-loyalty",
        "offer_title": "EA SPORTS FC 26 Cross-Edition Loyalty Pre-Order Bundle",
        "target_franchise": "EA SPORTS FC 26",
        "offer_type": "CROSS_EDITION_LOYALTY",
        "price_usd": 19.99,
        "discount_percent": 45.0,
        "trigger_condition": "VETERAN_FUT_FOUNDER_RETENTION",
        "description": "4,600 FC Points + FC 26 Untradeable Hero Card pre-order incentive for multi-year FUT Founders.",
    },
]

# -------------------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------------------
def generate_embedding(bias: list, dim: int = 64) -> list:
    """Generates a synthetic normalized embedding with archetype bias."""
    raw = [random.gauss(0, 1.0) for _ in range(dim)]
    for i, b in enumerate(bias):
        if i < len(raw):
            raw[i] += b * 3.0
    norm = math.sqrt(sum(x * x for x in raw))
    return [round(x / norm, 6) for x in raw]

def weighted_choice(items_with_weights):
    weights = [item["weight"] for item in items_with_weights]
    return random.choices(items_with_weights, weights=weights, k=1)[0]

# -------------------------------------------------------------
# MAIN GENERATION LOGIC FOR EA SPORTS FC
# -------------------------------------------------------------
def generate_dataset(num_players: int = 2500, num_clans: int = 80, days_of_telemetry: int = 7):
    print(f"⚽ Generating synthetic EA SPORTS FC dataset: {num_players} players, {num_clans} clubs...")

    # 1. Generate EA FC Clubs & Pro Clubs
    clans = []
    clan_ids = []
    for i in range(num_clans):
        c_id = f"club-{i+1:04d}"
        prefix = random.choice(CLAN_PREFIXES)
        suffix = random.choice(CLAN_SUFFIXES)
        clans.append({
            "clan_id": c_id,
            "clan_name": f"{prefix} {suffix}",
            "game_id": "game-fc26-clubs-rush" if random.random() < 0.6 else "game-fc26-ultimate-team",
            "member_count": 0,
            "activity_level": random.choice(["EXTREME", "HIGH", "MODERATE", "CASUAL"]),
        })
        clan_ids.append(c_id)

    # 2. Generate Players & Platform Identities
    master_players = []
    platform_identities = []
    has_identity_edges = []
    played_game_edges = []
    member_of_clan_edges = []
    fct_player_identity_graph = []

    used_names = set()

    for i in range(num_players):
        player_id = f"ea-fc-{i+1:05d}"
        
        while True:
            dname = f"{random.choice(PLAYER_NAME_PREFIXES)}_{random.choice(PLAYER_NAME_SUFFIXES)}_{random.randint(10, 999)}"
            if dname not in used_names:
                used_names.add(dname)
                break

        archetype_obj = weighted_choice(ARCHETYPES)
        archetype_name = archetype_obj["name"]
        
        spend = round(random.uniform(*archetype_obj["avg_spend"]), 2)
        hours = round(random.uniform(*archetype_obj["avg_hours"]), 1)
        churn_risk = round(random.uniform(*archetype_obj["churn_risk_range"]), 3)
        tilt_sens = round(random.uniform(*archetype_obj["tilt_sensitivity_range"]), 3)
        metro = weighted_choice(METROS)
        
        embedding = generate_embedding(archetype_obj["embedding_bias"], dim=64)

        player_record = {
            "player_id": player_id,
            "display_name": dname,
            "primary_email": f"{dname.lower()}@fut.ea.com",
            "country": "US",
            "lifetime_spend_usd": spend,
            "primary_archetype": archetype_name,
            "churn_risk_score": churn_risk,
            "tilt_sensitivity": tilt_sens,
            "archetype_embedding": embedding,
            "created_at": (datetime.now() - timedelta(days=random.randint(60, 720))).isoformat() + "Z",
        }
        master_players.append(player_record)

        # Generate linked identities (EA Account, Companion App, PSN, Xbox, Twitch)
        linked_platforms = ["EA_ACCOUNT", "COMPANION_APP"]
        available_extra = ["PLAYSTATION_PSN", "XBOX_XUID", "STEAM_ID", "TWITCH"]
        extra_count = random.choices([1, 2, 3], weights=[0.5, 0.35, 0.15])[0]
        linked_platforms.extend(random.sample(available_extra, extra_count))

        resolved_identities = []
        for plat in linked_platforms:
            ident_id = f"ident-{plat.lower()}-{player_id}"
            handle = f"{dname}_{plat[:3].lower()}" if plat != "EA_ACCOUNT" else dname
            conf = round(random.uniform(0.94, 0.99) if plat in ["EA_ACCOUNT", "COMPANION_APP", "PLAYSTATION_PSN"] else random.uniform(0.80, 0.92), 3)

            platform_identities.append({
                "identity_id": ident_id,
                "platform": plat,
                "platform_handle": handle,
                "confidence_score": conf,
                "linked_at": (datetime.now() - timedelta(days=random.randint(10, 300))).isoformat() + "Z",
            })

            has_identity_edges.append({
                "player_id": player_id,
                "identity_id": ident_id,
                "verification_source": "OAUTH_LINKED" if conf > 0.9 else "COMPANION_DEVICE_MATCH",
            })

            resolved_identities.append({
                "platform": plat,
                "handle": handle,
                "confidence_score": conf,
            })

        # Assign Played Modes (FC 26 FUT, Clubs, Career Mode, FC 24)
        num_modes = random.choices([1, 2, 3, 4], weights=[0.40, 0.40, 0.15, 0.05])[0]
        played_modes = random.sample(FRANCHISES, num_modes)
        mode_names = []

        for m in played_modes:
            mode_names.append(m["title"])
            m_hours = round(hours * random.uniform(0.3, 0.9), 1)
            m_spend = round(spend * random.uniform(0.2, 0.8), 2)
            div_rating = random.randint(1, 10) # Division 10 to Division 1

            played_game_edges.append({
                "player_id": player_id,
                "game_id": m["game_id"],
                "hours_played": m_hours,
                "total_spend_usd": m_spend,
                "skill_rating": div_rating,
                "last_played_at": (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat() + "Z",
            })

        # Club / Pro Club membership
        assigned_clan_id = None
        assigned_clan_name = None
        if random.random() < 0.65:
            chosen_clan = random.choice(clans)
            chosen_clan["member_count"] += 1
            assigned_clan_id = chosen_clan["clan_id"]
            assigned_clan_name = chosen_clan["clan_name"]
            member_of_clan_edges.append({
                "player_id": player_id,
                "clan_id": chosen_clan["clan_id"],
                "role": random.choice(["CAPTAIN", "VICE_CAPTAIN", "STRIKER", "MIDFIELDER", "DEFENDER"]),
                "joined_at": (datetime.now() - timedelta(days=random.randint(5, 180))).isoformat() + "Z",
            })

        # Flat BigQuery record
        fct_player_identity_graph.append({
            "player_id": player_id,
            "display_name": dname,
            "primary_archetype": archetype_name,
            "churn_risk_score": churn_risk,
            "tilt_sensitivity": tilt_sens,
            "lifetime_spend_usd": spend,
            "total_play_hours": hours,
            "franchises_played": mode_names,
            "linked_identities": resolved_identities,
            "active_clan_id": assigned_clan_id,
            "active_clan_name": assigned_clan_name,
            "dma_code": metro["dma"],
            "metro_name": metro["name"],
            "last_active_at": (datetime.now() - timedelta(hours=random.randint(1, 48))).isoformat() + "Z",
        })

    # 3. Generate Time-Series Telemetry Events (FUT Champs & Friday Drops)
    telemetry_events = []
    base_time = datetime.now() - timedelta(days=days_of_telemetry)
    
    print("⏱️ Generating EA SPORTS FC time-series telemetry events for simulation...")
    event_counter = 1

    for day in range(days_of_telemetry):
        day_date = base_time + timedelta(days=day)
        is_weekend = day_date.weekday() in [4, 5, 6] # Friday, Saturday, Sunday (Weekend League!)

        active_sample = random.sample(master_players, int(num_players * (0.75 if is_weekend else 0.45)))

        for p in active_sample:
            num_matches = random.randint(2, 6 if is_weekend else 3)
            
            curr_loss_streak = 0
            for m_idx in range(num_matches):
                match_hour = random.randint(18, 23) if is_weekend else random.randint(19, 22)
                match_time = day_date.replace(hour=match_hour, minute=random.randint(0, 59), second=random.randint(0, 59))
                
                # FUT Outcome
                outcome = random.choices(["VICTORY", "DEFEAT", "CRUSHING_LOSS"], weights=[0.42, 0.43, 0.15])[0]
                if outcome in ["DEFEAT", "CRUSHING_LOSS"]:
                    curr_loss_streak += 1
                else:
                    curr_loss_streak = 0

                frustration = min(1.0, round((curr_loss_streak * 0.30) + (p["tilt_sensitivity"] * 0.35) + random.uniform(0.0, 0.15), 3))
                tilt = round(frustration * p["tilt_sensitivity"], 3)

                is_rage_quit = (outcome == "CRUSHING_LOSS" and curr_loss_streak >= 3 and random.random() < 0.50)
                event_type = "RAGE_QUIT" if is_rage_quit else ("MATCH_COMPLETE" if random.random() < 0.88 else "PURCHASE")
                spend_val = round(random.uniform(14.99, 99.99), 2) if event_type == "PURCHASE" else 0.0

                telemetry_events.append({
                    "event_id": f"evt-fc-{event_counter:07d}",
                    "player_id": p["player_id"],
                    "game_id": "game-fc26-ultimate-team",
                    "session_id": f"sess-fc-{p['player_id']}-{day}-{m_idx}",
                    "event_timestamp": match_time.isoformat() + "Z",
                    "event_type": event_type,
                    "match_outcome": outcome,
                    "loss_streak_count": curr_loss_streak,
                    "session_duration_minutes": round(random.uniform(15.0, 25.0), 1),
                    "frustration_score": frustration,
                    "tilt_index": tilt,
                    "spend_amount_usd": spend_val,
                    "dma_code": 501,
                    "metro_name": "New York, NY",
                    "metadata_json": {
                        "mode": "FUT_CHAMPIONS" if is_weekend else "DIVISION_RIVALS",
                        "goals_scored": random.randint(0, 5) if outcome == "VICTORY" else random.randint(0, 2),
                        "goals_conceded": random.randint(3, 7) if outcome == "CRUSHING_LOSS" else random.randint(0, 2),
                        "possession_pct": random.randint(40, 65),
                    }
                })
                event_counter += 1

    telemetry_events.sort(key=lambda x: x["event_timestamp"])

    # 4. Save JSON Artifacts
    print(f"💾 Saving generated EA SPORTS FC dataset to {OUTPUT_DIR}...")
    
    with open(os.path.join(OUTPUT_DIR, "master_players.json"), "w") as f:
        json.dump(master_players, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "platform_identities.json"), "w") as f:
        json.dump(platform_identities, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "has_identity_edges.json"), "w") as f:
        json.dump(has_identity_edges, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "games.json"), "w") as f:
        json.dump(FRANCHISES, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "played_game_edges.json"), "w") as f:
        json.dump(played_game_edges, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "clans.json"), "w") as f:
        json.dump(clans, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "member_of_clan_edges.json"), "w") as f:
        json.dump(member_of_clan_edges, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "marketing_offers.json"), "w") as f:
        json.dump(MARKETING_OFFERS, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "fct_player_identity_graph.json"), "w") as f:
        json.dump(fct_player_identity_graph, f, indent=2)

    with open(os.path.join(OUTPUT_DIR, "telemetry_match_events.json"), "w") as f:
        json.dump(telemetry_events, f, indent=2)

    print(f"✅ Generated {len(master_players)} EA FC players, {len(platform_identities)} identities, {len(clans)} clubs, {len(telemetry_events)} telemetry events.")

if __name__ == "__main__":
    generate_dataset()
