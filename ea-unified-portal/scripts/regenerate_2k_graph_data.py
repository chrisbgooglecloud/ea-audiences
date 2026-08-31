import json
import random

random.seed(42)

FRANCHISES = ["NBA2K26", "BORDERLANDS4", "CIV7", "WWE2K25", "PGATOUR2K"]
FRANCHISE_WEIGHTS = [0.45, 0.25, 0.15, 0.10, 0.05]

GAMES_MAP = {
    "NBA2K26": ["game-nba2k26", "game-nba2k26-thecity", "game-nba2k26-myteam", "game-nba2k26-mynba-eras"],
    "BORDERLANDS4": ["game-borderlands4", "game-borderlands4-mayhem"],
    "CIV7": ["game-civ7", "game-civ7-multiplayer"],
    "WWE2K25": ["game-wwe2k25", "game-wwe2k25-myfaction"],
    "PGATOUR2K": ["game-pgatour2k", "game-pgatour2k-societies"]
}

ARCHETYPES = {
    "NBA2K26": ["MYCAREER_HOOPER", "MYTEAM_WHALE", "CASUAL_SOCIALIZER", "PROPASS_GRINDER"],
    "BORDERLANDS4": ["VAULT_HUNTER_SQUAD", "LORE_SEEKER", "CASUAL_SOCIALIZER"],
    "CIV7": ["4X_GRAND_STRATEGIST", "LORE_SEEKER"],
    "WWE2K25": ["MYTEAM_WHALE", "CASUAL_SOCIALIZER", "PROPASS_GRINDER"],
    "PGATOUR2K": ["CASUAL_SOCIALIZER", "4X_GRAND_STRATEGIST"]
}

CREATORS = [
    "creator-chris-smoove", "creator-troydan", "creator-agent00", "creator-joltzdude", 
    "creator-potatomcwhiskey", "creator-flight", "creator-mancubus", "creator-gregthebuilder"
]

CLANS = [
    "crew-0001", "crew-0002", "crew-0003", "guild-bl4-001", "guild-bl4-002", 
    "league-civ-001", "faction-wwe-001", "society-pga-001"
]

DMA_MARKETS = [
    ("New York DMA", 40.7128, -74.0060, "US"),
    ("Los Angeles DMA", 34.0522, -118.2437, "US"),
    ("Chicago DMA", 41.8781, -87.6298, "US"),
    ("Dallas-Ft. Worth DMA", 32.7767, -96.7970, "US"),
    ("Atlanta DMA", 33.7490, -84.3880, "US"),
    ("Houston DMA", 29.7604, -95.3698, "US"),
    ("Philadelphia DMA", 39.9526, -75.1652, "US"),
    ("Washington DC DMA", 38.9072, -77.0369, "US"),
    ("San Francisco-Oakland DMA", 37.7749, -122.4194, "US"),
    ("Boston DMA", 42.3601, -71.0589, "US"),
    ("London DMA", 51.5074, -0.1278, "GB"),
    ("Toronto DMA", 43.6532, -79.3832, "CA")
]

OFFER_PURCHASES = {
    "MYTEAM_WHALE": [
        {"title": "450,000 Virtual Currency (VC) Vault", "price": 99.99, "category": "Currency Vault", "type": "CURRENCY_VAULT"},
        {"title": "NBA 2K26 Hall of Fame Edition Upgrade", "price": 99.99, "category": "Major Game Edition", "type": "MAJOR_DLC_EXPANSION"},
        {"title": "MyTEAM 100 OVR Holo Dark Matter 10-Pack Box", "price": 19.99, "category": "Pack Market", "type": "PROMO_CARD_BOX"},
        {"title": "WWE 2K25 MyFACTION Diamond Tier Box", "price": 49.99, "category": "Card Pack", "type": "CURRENCY_PACK"}
    ],
    "MYCAREER_HOOPER": [
        {"title": "200,000 VC Cap Breaker Pack", "price": 49.99, "category": "In-Game Store", "type": "CURRENCY_PACK"},
        {"title": "The REC Loss-Streak Tilt Shield & Boost Pack", "price": 4.99, "category": "Situational Trigger", "type": "SITUATIONAL_TRIGGER_PACK"},
        {"title": "ProPASS Season 4 All-Star Access Pass", "price": 9.99, "category": "Season Pass", "type": "SEASONAL_BATTLE_PASS"},
        {"title": "75,000 VC Pro Hooper Bundle", "price": 19.99, "category": "In-Game Store", "type": "CURRENCY_PACK"}
    ],
    "VAULT_HUNTER_SQUAD": [
        {"title": "Borderlands 4 Deluxe Season Pass Bundle", "price": 49.99, "category": "Season Pass", "type": "SEASONAL_BATTLE_PASS"},
        {"title": "Legendary Loot Drop Booster Pack", "price": 9.99, "category": "Booster Pack", "type": "CURRENCY_PACK"}
    ],
    "4X_GRAND_STRATEGIST": [
        {"title": "Civilization VII Founders Edition Upgrade", "price": 69.99, "category": "Expansion Bundle", "type": "MAJOR_DLC_EXPANSION"},
        {"title": "PGA TOUR 2K25 Clubhouse Pass Season 2", "price": 9.99, "category": "Clubhouse Pass", "type": "SEASONAL_BATTLE_PASS"}
    ],
    "CASUAL_SOCIALIZER": [
        {"title": "75,000 VC Pro Hooper Bundle", "price": 19.99, "category": "In-Game Store", "type": "CURRENCY_PACK"},
        {"title": "The REC Loss-Streak Tilt Shield & Boost Pack", "price": 4.99, "category": "Situational Trigger", "type": "SITUATIONAL_TRIGGER_PACK"}
    ],
    "PROPASS_GRINDER": [
        {"title": "ProPASS Season 4 All-Star Access Pass", "price": 9.99, "category": "Season Pass", "type": "SEASONAL_BATTLE_PASS"},
        {"title": "200,000 VC Cap Breaker Pack", "price": 49.99, "category": "In-Game Store", "type": "CURRENCY_PACK"}
    ]
}

players = []
platform_identities = []
has_identity_edges = []
played_edges = []
member_clan_edges = []

gamer_tags = ["IsoKing", "GreenBean", "DimeDropper", "LockdownClamps", "AnkleBreaker", "Sniper99", "VaultHunter", "SirenFury", "CaesarPrime", "Imperator", "TribalChief", "RumbleChamp", "FairwayPro", "Albatross", "HoopGod", "RecSweat", "CityMayor", "DarkMatterGod", "SplashBrother", "CapBreaker", "ShotCreator", "EuroStepper", "Posterizer", "Skyhook", "CornerSniper"]

for i in range(1, 5001):
    player_id = f"2k-usr-{i:05d}"
    tag = f"{random.choice(gamer_tags)}_{random.randint(10, 999)}"
    franchise = random.choices(FRANCHISES, weights=FRANCHISE_WEIGHTS)[0]
    
    other_franchises = [f for f in FRANCHISES if f != franchise]
    num_sec = random.choices([0, 1, 2], weights=[0.4, 0.45, 0.15])[0]
    sec_franchises = random.sample(other_franchises, num_sec)
    franchises_played = [franchise] + sec_franchises

    archetype = random.choice(ARCHETYPES[franchise])
    
    if archetype == "MYTEAM_WHALE":
        spend = round(random.uniform(1200.0, 6500.0), 2)
        hours = random.randint(400, 2200)
        tilt = round(random.uniform(0.3, 0.85), 2)
        churn = round(random.uniform(0.05, 0.35), 2)
    elif archetype == "MYCAREER_HOOPER":
        spend = round(random.uniform(150.0, 1200.0), 2)
        hours = random.randint(300, 1800)
        tilt = round(random.uniform(0.4, 0.95), 2)
        churn = round(random.uniform(0.1, 0.45), 2)
    elif archetype == "VAULT_HUNTER_SQUAD":
        spend = round(random.uniform(70.0, 350.0), 2)
        hours = random.randint(150, 900)
        tilt = round(random.uniform(0.1, 0.4), 2)
        churn = round(random.uniform(0.1, 0.5), 2)
    elif archetype == "4X_GRAND_STRATEGIST":
        spend = round(random.uniform(70.0, 250.0), 2)
        hours = random.randint(200, 1500)
        tilt = round(random.uniform(0.05, 0.25), 2)
        churn = round(random.uniform(0.05, 0.3), 2)
    else:
        spend = round(random.uniform(20.0, 180.0), 2)
        hours = random.randint(50, 400)
        tilt = round(random.uniform(0.2, 0.6), 2)
        churn = round(random.uniform(0.2, 0.6), 2)

    market, base_lat, base_lng, ccode = random.choice(DMA_MARKETS)
    lat = base_lat + random.uniform(-0.15, 0.15)
    lng = base_lng + random.uniform(-0.15, 0.15)

    avail_items = OFFER_PURCHASES.get(archetype, OFFER_PURCHASES["CASUAL_SOCIALIZER"])
    num_items = random.randint(1, len(avail_items))
    purchased = random.sample(avail_items, num_items)

    if franchise == "NBA2K26":
        game_telemetry = {
            "overall_rating": random.randint(85, 99) if spend > 200 else random.randint(70, 84),
            "archetype_build": random.choice(["3-Level Scoring Threat", "2-Way Inside-Out Playmaker", "Floor-Spacing Slasher", "Diming Paint Beast"]),
            "city_affiliation": random.choice(["Elite", "Rise", "Sunset Beach", "Rivet City"]),
            "rec_win_rate": round(random.uniform(0.45, 0.88), 2),
            "favorite_club": random.choice(["Oklahoma City Thunder", "Dallas Mavericks", "Boston Celtics", "Minnesota Timberwolves", "Denver Nuggets"]),
            "favorite_player": "Shai Gilgeous-Alexander",
            "favorite_formation": "5-Out Motion Pace"
        }
    elif franchise == "BORDERLANDS4":
        game_telemetry = {
            "vault_hunter": random.choice(["Siren", "Exo-Commando", "Beastmaster", "Shadow-Stalker"]),
            "mayhem_level": random.randint(1, 10),
            "legendaries_looted": random.randint(50, 850),
            "raid_bosses_defeated": random.randint(5, 60)
        }
    elif franchise == "CIV7":
        game_telemetry = {
            "favorite_civ": random.choice(["Rome", "Egypt", "Songhai", "Japan", "Greece"]),
            "preferred_victory": random.choice(["Science", "Cultural", "Economic", "Domination"]),
            "ages_completed": random.randint(10, 180)
        }
    elif franchise == "WWE2K25":
        game_telemetry = {
            "favorite_superstar": random.choice(["Cody Rhodes", "Roman Reigns", "Rhea Ripley", "CM Punk", "Seth Rollins"]),
            "myfaction_tier": random.choice(["Ruby", "Amethyst", "Diamond", "Pink Diamond"]),
            "championships_won": random.randint(5, 45)
        }
    else:
        game_telemetry = {
            "handicap": round(random.uniform(-8.0, 12.0), 1),
            "favorite_course": random.choice(["TPC Sawgrass", "Pebble Beach", "Augusta National", "St Andrews"]),
            "clubhouse_level": random.randint(5, 50)
        }

    creator = random.choice(CREATORS)

    player_record = {
        "player_id": player_id,
        "display_name": tag,
        "primary_email": f"{tag.lower()}@2k.sample.com",
        "primary_franchise": franchise,
        "franchises_played": franchises_played,
        "country": "United States" if ccode == "US" else ("United Kingdom" if ccode == "GB" else "Canada"),
        "dma_market": market,
        "lat": lat,
        "lng": lng,
        "lifetime_spend_usd": spend,
        "primary_archetype": archetype,
        "churn_risk_score": churn,
        "tilt_sensitivity": tilt,
        "recent_loss_streak": random.randint(0, 6) if tilt > 0.5 else 0,
        "total_play_hours": hours,
        "purchased_items": purchased,
        "game_telemetry": game_telemetry,
        "last_active_at": "2026-08-30T18:00:00Z",
        "primary_creator_influence": creator,
        "followed_creators": [creator],
        "country_code": ccode,
        "country_flag": "🇺🇸" if ccode == "US" else ("🇬🇧" if ccode == "GB" else "🇨🇦")
    }
    players.append(player_record)

    platforms = ["2K_ACCOUNT", "PLAYSTATION_PSN", "XBOX_XUID", "STEAM_ID"]
    if franchise == "NBA2K26":
        platforms.append("MYNBA_APP")
    
    num_identities = random.randint(2, len(platforms))
    chosen_platforms = random.sample(platforms, num_identities)
    for p_idx, plat in enumerate(chosen_platforms):
        ident_id = f"ident-{plat.lower()}-{player_id}-{p_idx+1}"
        conf = 0.99 if plat == "2K_ACCOUNT" else round(random.uniform(0.85, 0.98), 2)
        plat_prefix = plat.split("_")[0].lower()
        platform_identities.append({
            "identity_id": ident_id,
            "player_id": player_id,
            "platform": plat,
            "platform_handle": f"{tag}_{plat_prefix}",
            "confidence_score": conf
        })
        has_identity_edges.append({
            "player_id": player_id,
            "identity_id": ident_id,
            "confidence": conf
        })

    for f_idx, f_item in enumerate(franchises_played):
        game_modes = GAMES_MAP.get(f_item, [f"game-{f_item.lower()}"])
        for g_id in game_modes:
            is_prim = (f_idx == 0 and g_id == game_modes[0])
            mode_hours = hours if is_prim else max(10, int(hours * random.uniform(0.1, 0.4)))
            mode_spend = spend if is_prim else round(spend * random.uniform(0.0, 0.3), 2)
            played_edges.append({
                "player_id": player_id,
                "game_id": g_id,
                "hours_played": mode_hours,
                "total_spend_usd": mode_spend,
                "is_primary": is_prim
            })

    if random.random() < 0.45:
        clan = random.choice(CLANS)
        member_clan_edges.append({
            "player_id": player_id,
            "clan_id": clan,
            "role": random.choice(["CAPTAIN", "STARTER", "ROTATION", "RECRUIT"]),
            "matches_together": random.randint(10, 150)
        })

with open("data/master_players.json", "w") as f:
    json.dump(players, f, indent=2)
with open("data/platform_identities.json", "w") as f:
    json.dump(platform_identities, f, indent=2)
with open("data/has_identity_edges.json", "w") as f:
    json.dump(has_identity_edges, f, indent=2)
with open("data/played_game_edges.json", "w") as f:
    json.dump(played_edges, f, indent=2)
with open("data/member_of_clan_edges.json", "w") as f:
    json.dump(member_clan_edges, f, indent=2)

print(f"Generated {len(players)} players, {len(platform_identities)} identities, {len(played_edges)} played edges, and {len(member_clan_edges)} clan edges.")
