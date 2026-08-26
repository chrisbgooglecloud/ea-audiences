import json
import random
import os

random.seed(42)

# Gamer prefixes and suffixes across EA's 5 major titles
GAMER_PREFIXES = {
    "FC26": [
        "Mbappe", "Vini", "Bellingham", "Zidane", "Cruyff", "R9", "Pele", "Haaland", "Saka", "Palmer",
        "Foden", "Rodri", "DeBruyne", "VanDijk", "Gullit", "Vieira", "FutChamps", "EliteRank", "WeekendWarrior",
        "TikiTaka", "TrivelaKing", "FUTWhale", "PackRipper", "WalkoutHunter", "ProClubsCapt", "RushDemon",
        "EvoMaster", "CareerGaffer", "SBCSolver", "SilverLounge"
    ],
    "APEX": [
        "Wraith", "Octane", "Pathfinder", "Horizon", "Conduit", "Bangalore", "Bloodhound", "Gibby",
        "Predator", "MasterRank", "ApexGod", "Wingman", "Peacekeeper", "R99Sweat", "TapStrafe", "SuperGlide",
        "HeirloomWhale", "SkullTown", "HotDropper", "TriosCaptain", "RankedGrinder", "ShieldSwap",
        "MixtapeKing", "FlatlineAce", "HavocLaser", "SoloQDemon"
    ],
    "MADDEN25": [
        "Mahomes", "Lamar", "Jefferson", "Tyreek", "Chase", "McCaffrey", "Parsons", "Kelce", "Burrow",
        "MUTChamps", "WeekendLeague", "MUTWhale", "Cover3Beater", "BlitzGod", "FranchiseGaffer", "SuperstarQB",
        "PlatinumPacker", "GridironKing", "LombardiChaser", "RedZoneDemon", "CapSpecialist", "UserLurker"
    ],
    "BATTLEFIELD": [
        "ConquestLeader", "TankCommander", "ChopperAce", "BreakthroughSquad", "MedicMain", "ReconSniper",
        "AssaultSweat", "64v64General", "PortalHost", "MilSimVeteran", "TacticalDeploy", "VehicleGod",
        "FrontlineHero", "Tier1Armor", "ReviveKing", "DogfightAce"
    ],
    "SIMS4": [
        "SimsArchitect", "LegacyBuilder", "SulSul", "ModernMansions", "PlumbobQueen", "StoryCrafter",
        "CCCollector", "ModEnthusiast", "GenerationsGamer", "TinyHomeBuilder", "TownieMakeover", "SimlishMaster",
        "FamilyTree", "CottageLiving", "RivieraDesigner", "AlphaCCQueen"
    ]
}

GAMER_SUFFIXES = [
    "99", "10", "07", "XI", "Prime", "TOTY", "Apex", "Pred", "MUT", "Elite", "Pro",
    "Captain", "Boss", "God", "King", "Maestro", "Beast", "Sniper", "Grinder", "Streamer",
    "YT", "UK", "US", "EU", "BR", "SA", "FR", "DE", "JP"
]

CITIES = [
    {"dma": "New York DMA", "country": "United States", "region": "us-nyc", "lat": 40.7128, "lng": -74.0060},
    {"dma": "Los Angeles DMA", "country": "United States", "region": "us-lax", "lat": 34.0522, "lng": -118.2437},
    {"dma": "Dallas / Fort Worth DMA", "country": "United States", "region": "us-dfw", "lat": 32.7767, "lng": -96.7970},
    {"dma": "Chicago DMA", "country": "United States", "region": "us-chi", "lat": 41.8781, "lng": -87.6298},
    {"dma": "London Metro", "country": "United Kingdom", "region": "uk-lon", "lat": 51.5074, "lng": -0.1278},
    {"dma": "Manchester", "country": "United Kingdom", "region": "uk-lon", "lat": 53.4808, "lng": -2.2426},
    {"dma": "Paris Île-de-France", "country": "France", "region": "fr-par", "lat": 48.8566, "lng": 2.3522},
    {"dma": "Madrid", "country": "Spain", "region": "es-mad", "lat": 40.4168, "lng": -3.7038},
    {"dma": "Berlin & DACH", "country": "Germany", "region": "de-ber", "lat": 52.5200, "lng": 13.4050},
    {"dma": "São Paulo", "country": "Brazil", "region": "br-sao", "lat": -23.5505, "lng": -46.6333},
    {"dma": "Riyadh & GCC", "country": "Saudi Arabia", "region": "sa-ruh", "lat": 24.7136, "lng": 46.6753},
    {"dma": "Tokyo", "country": "Japan", "region": "jp-tyo", "lat": 35.6762, "lng": 139.6503}
]

FRANCHISE_CATALOGS = {
    "FC26": [
        {"title": "12,000 FC Points Vault", "price": 99.99, "category": "FUT In-Game Store", "type": "CURRENCY_VAULT"},
        {"title": "FC 26 Ultimate Edition Upgrade", "price": 99.99, "category": "Major Game Edition DLC", "type": "EDITION_UPGRADE"},
        {"title": "5,900 FC Points Pack", "price": 49.99, "category": "FUT In-Game Store", "type": "CURRENCY_PACK"},
        {"title": "TOTY Campaign Hero Pack", "price": 29.99, "category": "FUT Promo Event", "type": "CAMPAIGN_PACK"},
        {"title": "2,800 FC Points Pack", "price": 24.99, "category": "FUT In-Game Store", "type": "CURRENCY_PACK"},
        {"title": "Season 2 Premium Pass + Evo Slot", "price": 19.99, "category": "Progression & Season", "type": "SEASON_PASS"},
        {"title": "1,050 FC Points Pack", "price": 9.99, "category": "FUT In-Game Store", "type": "CURRENCY_PACK"},
        {"title": "500 FC Points Starter Pack", "price": 4.99, "category": "FUT In-Game Store", "type": "STARTER_PACK"},
        {"title": "Ultimate Draft Entry Token", "price": 2.99, "category": "FUT Draft Mode", "type": "DRAFT_TOKEN"},
    ],
    "APEX": [
        {"title": "Mythic Heirloom Event (24 Packs)", "price": 160.00, "category": "Apex Store Collection Event", "type": "MYTHIC_EVENT"},
        {"title": "10,000 (+1,500 Bonus) Apex Coins Vault", "price": 99.99, "category": "Apex Store Currency", "type": "CURRENCY_VAULT"},
        {"title": "6,000 (+750 Bonus) Apex Coins Pack", "price": 49.99, "category": "Apex Store Currency", "type": "CURRENCY_PACK"},
        {"title": "Battle Pass Ultimate+ Edition", "price": 19.99, "category": "Major DLC & Progression", "type": "BATTLE_PASS"},
        {"title": "2,000 (+150 Bonus) Apex Coins", "price": 19.99, "category": "Apex Store Currency", "type": "CURRENCY_PACK"},
        {"title": "Legendary Legend Skin Bundle", "price": 18.00, "category": "Featured Character Skin", "type": "CHARACTER_SKIN"},
        {"title": "Standard Split Battle Pass", "price": 9.99, "category": "Seasonal Progression", "type": "BATTLE_PASS"},
        {"title": "1,000 Apex Coins Starter Pack", "price": 4.99, "category": "Apex Store Starter", "type": "STARTER_PACK"},
    ],
    "MADDEN25": [
        {"title": "Madden NFL 25 Deluxe Upgrade", "price": 99.99, "category": "Major Game Edition DLC", "type": "EDITION_UPGRADE"},
        {"title": "12,000 Madden Points Vault", "price": 99.99, "category": "MUT In-Game Store", "type": "CURRENCY_VAULT"},
        {"title": "5,850 Madden Points Pack", "price": 49.99, "category": "MUT In-Game Store", "type": "CURRENCY_PACK"},
        {"title": "Legends Fantasy Bundle (4x Packs)", "price": 49.99, "category": "MUT Legends Drop", "type": "MUT_BUNDLE"},
        {"title": "2,800 Madden Points Pack", "price": 24.99, "category": "MUT In-Game Store", "type": "CURRENCY_PACK"},
        {"title": "MUT Season Field Pass Premium", "price": 9.99, "category": "MUT Progression Pass", "type": "FIELD_PASS"},
        {"title": "1,050 Madden Points Pack", "price": 9.99, "category": "MUT In-Game Store", "type": "CURRENCY_PACK"},
        {"title": "500 Madden Points Starter Pack", "price": 4.99, "category": "MUT In-Game Store", "type": "STARTER_PACK"},
    ],
    "SIMS4": [
        {"title": "Lovestruck & For Rent Bundle", "price": 59.99, "category": "Expansion Bundle", "type": "EXPANSION_BUNDLE"},
        {"title": "Lovestruck Expansion Pack", "price": 39.99, "category": "Major Expansion DLC", "type": "EXPANSION_PACK"},
        {"title": "For Rent Expansion Pack", "price": 39.99, "category": "Major Expansion DLC", "type": "EXPANSION_PACK"},
        {"title": "Horse Ranch Expansion Pack", "price": 39.99, "category": "Major Expansion DLC", "type": "EXPANSION_PACK"},
        {"title": "Growing Together Expansion Pack", "price": 39.99, "category": "Major Expansion DLC", "type": "EXPANSION_PACK"},
        {"title": "Home Chef Hustle Stuff Pack", "price": 9.99, "category": "Stuff Pack DLC", "type": "STUFF_PACK"},
        {"title": "Riviera Retreat Creator Kit", "price": 4.99, "category": "Boutique Creator Kit", "type": "CREATOR_KIT"},
        {"title": "Cozy Bistro Creator Kit", "price": 4.99, "category": "Boutique Creator Kit", "type": "CREATOR_KIT"},
        {"title": "Urban Homage Fashion Kit", "price": 4.99, "category": "Fashion Creator Kit", "type": "CREATOR_KIT"},
    ],
    "BATTLEFIELD": [
        {"title": "Battlefield 2042 Elite Edition Upgrade", "price": 39.99, "category": "Game Edition Upgrade", "type": "EDITION_UPGRADE"},
        {"title": "5,000 Battlefield Coins (BFC) Vault", "price": 39.99, "category": "BFC Store Vault", "type": "CURRENCY_VAULT"},
        {"title": "Specialist Elite Armor & Vehicle Pack", "price": 29.99, "category": "Specialist Bundle", "type": "SPECIALIST_BUNDLE"},
        {"title": "2,400 Battlefield Coins (BFC) Pack", "price": 19.99, "category": "BFC Store Pack", "type": "CURRENCY_PACK"},
        {"title": "Season 7 Turning Point Battle Pass", "price": 9.99, "category": "Seasonal Progression", "type": "BATTLE_PASS"},
        {"title": "1,100 Battlefield Coins (BFC) Pack", "price": 9.99, "category": "BFC Store Pack", "type": "CURRENCY_PACK"},
        {"title": "500 BFC Starter Pack + 2x Squad XP", "price": 4.99, "category": "Starter Tactical Pack", "type": "STARTER_PACK"},
    ]
}

def generate_purchase_history(franchise: str, spend: float):
    catalog = FRANCHISE_CATALOGS.get(franchise, FRANCHISE_CATALOGS["FC26"])
    items = []
    
    if spend <= 0:
        return [{
            "title": f"{franchise} Free Track / EA Play Subscription",
            "price": 0.00,
            "date": "2024-09-27",
            "category": "Free-to-Play Tier",
            "type": "FREE_TIER"
        }]
    
    if spend <= 70:
        if random.random() > 0.5:
            return [{
                "title": f"{franchise} Standard Retail Edition",
                "price": round(spend, 2),
                "date": "2024-09-27",
                "category": "Retail Game Purchase",
                "type": "RETAIL_BASE"
            }]
        else:
            starter = [c for c in catalog if c["price"] <= 9.99]
            chosen = random.sample(starter, min(len(starter), random.randint(1, 2)))
            for c in chosen:
                items.append({
                    "title": c["title"],
                    "price": c["price"],
                    "date": "2024-11-14",
                    "category": c["category"],
                    "type": c["type"]
                })
            return items

    current_spent = 0.0
    if spend >= 1000:
        vault = next((c for c in catalog if c["price"] >= 99.0), catalog[0])
        count = max(1, min(12, int(spend / vault["price"])))
        for k in range(count):
            items.append({
                "title": f"{vault['title']} #{k+1}" if count > 1 else vault["title"],
                "price": vault["price"],
                "date": f"2024-{random.randint(9, 12):02d}-{random.randint(1, 28):02d}",
                "category": vault["category"],
                "type": vault["type"]
            })
            current_spent += vault["price"]

    attempts = 0
    while current_spent < (spend * 0.85) and len(items) < 8 and attempts < 20:
        attempts += 1
        rem = spend - current_spent
        available = [c for c in catalog if c["price"] <= rem + 15]
        if not available:
            break
        chosen = random.choice(available)
        items.append({
            "title": chosen["title"],
            "price": chosen["price"],
            "date": f"2024-{random.randint(9, 12):02d}-{random.randint(1, 28):02d}",
            "category": chosen["category"],
            "type": chosen["type"]
        })
        current_spent += chosen["price"]

    if not items:
        chosen = random.choice(catalog)
        items.append({
            "title": chosen["title"],
            "price": chosen["price"],
            "date": "2024-10-15",
            "category": chosen["category"],
            "type": chosen["type"]
        })

    return items

FRANCHISE_DIST = [
    ("FC26", 0.38),
    ("APEX", 0.28),
    ("MADDEN25", 0.16),
    ("BATTLEFIELD", 0.10),
    ("SIMS4", 0.08)
]

TOTAL_PLAYERS = 5000

master_players = []
platform_identities = []
has_identity_edges = []
played_game_edges = []
member_of_clan_edges = []

GAME_MODES = {
    "FC26": ["game-fc26-ultimate-team", "game-fc26-clubs-rush", "game-fc26-career-mode", "game-fc26-online-seasons"],
    "APEX": ["game-apex-ranked-br", "game-apex-trios-squads", "game-apex-mixtape"],
    "MADDEN25": ["game-madden25-mut", "game-madden25-franchise", "game-madden25-superstar"],
    "BATTLEFIELD": ["game-bf-conquest", "game-bf-breakthrough"],
    "SIMS4": ["game-sims4-expansion-dlc", "game-sims4-build-buy"]
}

for i in range(1, TOTAL_PLAYERS + 1):
    pid = f"ea-usr-{i:05d}"
    
    r_franchise = random.random()
    cum = 0
    primary_franchise = "FC26"
    for f_code, p in FRANCHISE_DIST:
        cum += p
        if r_franchise <= cum:
            primary_franchise = f_code
            break
            
    prefix_list = GAMER_PREFIXES[primary_franchise]
    prefix = random.choice(prefix_list)
    suffix = random.choice(GAMER_SUFFIXES)
    num = random.randint(1, 999)
    name = f"{prefix}_{suffix}_{num}" if random.random() > 0.25 else f"{prefix}_{num}"

    city = random.choice(CITIES)

    r_tier = random.random()
    
    if primary_franchise == "FC26":
        if r_tier < 0.06:
            arch = "ULTIMATE_TEAM_WHALE"
            spend = round(random.uniform(3500, 12500), 2)
            tilt = round(random.uniform(0.10, 0.35), 2)
            churn = round(random.uniform(0.04, 0.18), 2)
            loss_streak = random.choice([0, 0, 1, 1, 2])
            hours = random.randint(800, 2800)
            division = "Division 1 (Icon Collector)"
        elif r_tier < 0.30:
            arch = "COMPETITIVE_GRINDER"
            spend = round(random.uniform(150, 950), 2)
            tilt = round(random.uniform(0.65, 0.98), 2)
            churn = round(random.uniform(0.40, 0.85), 2)
            loss_streak = random.choice([1, 2, 3, 3, 4, 5])
            hours = random.randint(400, 2000)
            division = "Elite Division (Rank 1)" if loss_streak <= 2 else "Weekend League Qualifiers"
        elif r_tier < 0.65:
            arch = "CASUAL_SOCIALIZER"
            spend = round(random.uniform(15, 280), 2)
            tilt = round(random.uniform(0.15, 0.45), 2)
            churn = round(random.uniform(0.15, 0.50), 2)
            loss_streak = random.choice([0, 1, 2])
            hours = random.randint(120, 800)
            division = "Pro Clubs & Rush 5v5"
        elif r_tier < 0.85:
            arch = "LORE_SEEKER"
            spend = round(random.uniform(0, 70), 2)
            tilt = round(random.uniform(0.05, 0.20), 2)
            churn = round(random.uniform(0.10, 0.30), 2)
            loss_streak = 0
            hours = random.randint(100, 950)
            division = "Manager Career Purist"
        else:
            arch = "CASUAL_WARRIOR"
            spend = 0.00
            tilt = round(random.uniform(0.10, 0.35), 2)
            churn = round(random.uniform(0.20, 0.45), 2)
            loss_streak = random.choice([0, 1])
            hours = random.randint(30, 300)
            division = "Free Track Seasons"

        fc_clubs = ["Real Madrid", "Manchester City", "Arsenal", "Paris Saint-Germain", "Liverpool", "Bayern Munich", "FC Barcelona", "Chelsea", "Juventus", "Inter Miami"]
        fc_players = ["Kylian Mbappé", "Erling Haaland", "Jude Bellingham", "Vinícius Jr.", "Kevin De Bruyne", "Bukayo Saka", "Cole Palmer", "Lionel Messi", "Zinedine Zidane", "R9 Ronaldo"]
        fc_formations = ["4-3-3 Attack", "4-2-3-1 Balanced", "4-4-2 Flat", "3-5-2 Direct Counter", "5-2-1-2 Wingback"]
        fc_playstyles = ["Tiki-Taka High Press", "Trivela Cutback Winger", "Direct Counter-Attack", "Power Shot Specialist", "Relentless Midfield Engine"]
        fc_rewards = ["88+ Campaign Hero Evo Pick", "TOTY Loan Player Pick", "Draft Entry Token", "Jumbo Rare Players Pack", "Double Rush Points Booster"]

        telemetry_meta = {
            "squad_ovr": random.randint(89, 97) if "WHALE" in arch or "GRINDER" in arch else random.randint(82, 88),
            "division": division,
            "loss_streak": loss_streak,
            "favorite_club": random.choice(fc_clubs),
            "favorite_player": random.choice(fc_players),
            "favorite_formation": random.choice(fc_formations),
            "primary_playstyle": random.choice(fc_playstyles),
            "preferred_reward_type": random.choice(fc_rewards),
        }

    elif primary_franchise == "APEX":
        if r_tier < 0.05:
            arch = "HEIRLOOM_WHALE"
            spend = round(random.uniform(1500, 5200), 2)
            tilt = round(random.uniform(0.10, 0.30), 2)
            churn = round(random.uniform(0.04, 0.15), 2)
            loss_streak = random.choice([0, 1])
            hours = random.randint(800, 3000)
            rank_tier = "Diamond II (Collection Whale)"
        elif r_tier < 0.32:
            arch = "RANKED_SWEAT"
            spend = round(random.uniform(80, 650), 2)
            tilt = round(random.uniform(0.65, 0.96), 2)
            churn = round(random.uniform(0.35, 0.75), 2)
            loss_streak = random.choice([1, 2, 3, 3, 4])
            hours = random.randint(500, 2400)
            rank_tier = "Apex Predator" if loss_streak <= 1 else "Master Tier (RP Demotion)"
        elif r_tier < 0.68:
            arch = "CASUAL_SOCIALIZER"
            spend = round(random.uniform(10, 180), 2)
            tilt = round(random.uniform(0.20, 0.50), 2)
            churn = round(random.uniform(0.20, 0.55), 2)
            loss_streak = random.choice([0, 1, 2])
            hours = random.randint(100, 750)
            rank_tier = "Platinum / Gold Trios"
        elif r_tier < 0.88:
            arch = "CASUAL_WARRIOR"
            spend = round(random.uniform(0, 40), 2)
            tilt = round(random.uniform(0.10, 0.30), 2)
            churn = round(random.uniform(0.15, 0.40), 2)
            loss_streak = 0
            hours = random.randint(50, 450)
            rank_tier = "Mixtape Pub Stomper"
        else:
            arch = "LORE_SEEKER"
            spend = 0.00
            tilt = round(random.uniform(0.05, 0.20), 2)
            churn = round(random.uniform(0.15, 0.35), 2)
            loss_streak = 0
            hours = random.randint(20, 250)
            rank_tier = "Free Legend Unlocker"

        telemetry_meta = {
            "rank_tier": rank_tier,
            "kd_ratio": round(random.uniform(2.0, 4.5), 2) if "SWEAT" in arch or "WHALE" in arch else round(random.uniform(0.7, 1.6), 2),
            "main_legend": random.choice(["Wraith", "Octane", "Pathfinder", "Horizon", "Conduit", "Bangalore", "Bloodhound"]),
            "heirloom_unlocked": True if "WHALE" in arch else (random.random() > 0.85)
        }

    elif primary_franchise == "MADDEN25":
        if r_tier < 0.06:
            arch = "MUT_WHALE"
            spend = round(random.uniform(2800, 9500), 2)
            tilt = round(random.uniform(0.10, 0.35), 2)
            churn = round(random.uniform(0.04, 0.18), 2)
            loss_streak = random.choice([0, 1])
            hours = random.randint(600, 2200)
        elif r_tier < 0.35:
            arch = "COMPETITIVE_GRINDER"
            spend = round(random.uniform(120, 850), 2)
            tilt = round(random.uniform(0.60, 0.94), 2)
            churn = round(random.uniform(0.35, 0.70), 2)
            loss_streak = random.choice([1, 2, 3, 4])
            hours = random.randint(300, 1600)
        elif r_tier < 0.68:
            arch = "CASUAL_SOCIALIZER"
            spend = round(random.uniform(10, 220), 2)
            tilt = round(random.uniform(0.15, 0.45), 2)
            churn = round(random.uniform(0.20, 0.50), 2)
            loss_streak = 0
            hours = random.randint(80, 600)
        elif r_tier < 0.88:
            arch = "LORE_SEEKER"
            spend = round(random.uniform(0, 70), 2)
            tilt = round(random.uniform(0.05, 0.20), 2)
            churn = round(random.uniform(0.10, 0.30), 2)
            loss_streak = 0
            hours = random.randint(100, 850)
        else:
            arch = "CASUAL_WARRIOR"
            spend = 0.00
            tilt = round(random.uniform(0.10, 0.30), 2)
            churn = round(random.uniform(0.20, 0.40), 2)
            loss_streak = 0
            hours = random.randint(30, 250)

        telemetry_meta = {
            "mut_ovr": random.randint(91, 98) if "WHALE" in arch or "GRINDER" in arch else random.randint(83, 89),
            "superstar_role": random.choice(["Field General QB", "Deep Threat WR", "Lockdown CB", "Pass Rusher EDGE"]),
            "loss_streak": loss_streak
        }

    elif primary_franchise == "BATTLEFIELD":
        if r_tier < 0.07:
            arch = "ICON_COMMANDER"
            spend = round(random.uniform(450, 1650), 2)
            tilt = round(random.uniform(0.20, 0.50), 2)
            churn = round(random.uniform(0.10, 0.30), 2)
            loss_streak = random.choice([0, 1])
            hours = random.randint(700, 2400)
        elif r_tier < 0.40:
            arch = "CONQUEST_LEADER"
            spend = round(random.uniform(60, 420), 2)
            tilt = round(random.uniform(0.40, 0.78), 2)
            churn = round(random.uniform(0.25, 0.55), 2)
            loss_streak = random.choice([0, 1, 2])
            hours = random.randint(300, 1600)
        elif r_tier < 0.75:
            arch = "CASUAL_SOCIALIZER"
            spend = round(random.uniform(10, 140), 2)
            tilt = round(random.uniform(0.15, 0.40), 2)
            churn = round(random.uniform(0.20, 0.45), 2)
            loss_streak = 0
            hours = random.randint(80, 550)
        else:
            arch = "LORE_SEEKER"
            spend = round(random.uniform(0, 60), 2)
            tilt = round(random.uniform(0.05, 0.25), 2)
            churn = round(random.uniform(0.15, 0.35), 2)
            loss_streak = 0
            hours = random.randint(80, 700)

        telemetry_meta = {
            "favorite_class": random.choice(["Assault", "Engineer", "Recon", "Support"]),
            "spm_score": random.randint(450, 880),
            "vehicle_mastery_tier": random.choice(["Tier 1 Tank", "Tier 1 Attack Chopper", "Tier 2 Jet", "Infantry Only", "Gunship Specialist"])
        }

    else:
        if r_tier < 0.12:
            arch = "SIMS_COLLECTOR"
            spend = round(random.uniform(650, 1450), 2)
            tilt = round(random.uniform(0.02, 0.10), 2)
            churn = round(random.uniform(0.04, 0.15), 2)
            loss_streak = 0
            hours = random.randint(800, 3600)
            packs = random.randint(14, 18)
        elif r_tier < 0.48:
            arch = "BUILDER_CREATOR"
            spend = round(random.uniform(120, 520), 2)
            tilt = round(random.uniform(0.02, 0.12), 2)
            churn = round(random.uniform(0.08, 0.25), 2)
            loss_streak = 0
            hours = random.randint(400, 2200)
            packs = random.randint(6, 13)
        elif r_tier < 0.80:
            arch = "LORE_SEEKER"
            spend = round(random.uniform(40, 240), 2)
            tilt = round(random.uniform(0.02, 0.10), 2)
            churn = round(random.uniform(0.10, 0.30), 2)
            loss_streak = 0
            hours = random.randint(200, 1400)
            packs = random.randint(3, 7)
        else:
            arch = "CASUAL_WARRIOR"
            spend = round(random.uniform(0, 40), 2)
            tilt = round(random.uniform(0.02, 0.08), 2)
            churn = round(random.uniform(0.15, 0.35), 2)
            loss_streak = 0
            hours = random.randint(50, 500)
            packs = random.randint(0, 2)

        telemetry_meta = {
            "expansion_packs_owned": packs,
            "cc_mods_active": random.choice([True, True, False]),
            "primary_focus": "Architectural Design" if "BUILDER" in arch else ("All DLC Catalog" if "COLLECTOR" in arch else "Generations Legacy Storytelling")
        }

    franchises_played = [primary_franchise]
    if primary_franchise == "FC26":
        if random.random() < 0.38: franchises_played.append("APEX")
        if random.random() < 0.28: franchises_played.append("BATTLEFIELD")
    elif primary_franchise == "APEX":
        if random.random() < 0.52: franchises_played.append("BATTLEFIELD")
        if random.random() < 0.32: franchises_played.append("FC26")
    elif primary_franchise == "MADDEN25":
        if random.random() < 0.44: franchises_played.append("APEX")
        if random.random() < 0.25: franchises_played.append("FC26")
    elif primary_franchise == "BATTLEFIELD":
        if random.random() < 0.58: franchises_played.append("APEX")
        if random.random() < 0.22: franchises_played.append("FC26")
    elif primary_franchise == "SIMS4":
        if random.random() < 0.28: franchises_played.append("FC26")
        if random.random() < 0.22: franchises_played.append("APEX")

    purchased_items = generate_purchase_history(primary_franchise, spend)

    player = {
        "player_id": pid,
        "display_name": name,
        "primary_email": f"{name.lower()}@example.com",
        "primary_franchise": primary_franchise,
        "franchises_played": franchises_played,
        "country": city["country"],
        "dma_market": city["dma"],
        "lat": city["lat"] + random.uniform(-0.5, 0.5),
        "lng": city["lng"] + random.uniform(-0.5, 0.5),
        "lifetime_spend_usd": spend,
        "primary_archetype": arch,
        "churn_risk_score": churn,
        "tilt_sensitivity": tilt,
        "recent_loss_streak": loss_streak,
        "total_play_hours": hours,
        "purchased_items": purchased_items,
        "game_telemetry": telemetry_meta,
        "last_active_at": "2026-08-17T14:30:00Z"
    }
    master_players.append(player)

    platforms = [("EA_ACCOUNT", 0.99)]
    if random.random() > 0.25: platforms.append(("PLAYSTATION_PSN", round(random.uniform(0.92, 0.98), 2)))
    if random.random() > 0.40: platforms.append(("XBOX_XUID", round(random.uniform(0.90, 0.96), 2)))
    if random.random() > 0.55: platforms.append(("STEAM_ID", round(random.uniform(0.85, 0.94), 2)))
    if primary_franchise in ["FC26", "MADDEN25"] and spend > 300:
        platforms.append(("COMPANION_APP", round(random.uniform(0.95, 0.99), 2)))
    elif primary_franchise == "APEX" and random.random() > 0.70:
        platforms.append(("NINTENDO_SWITCH", round(random.uniform(0.82, 0.90), 2)))

    for plat_name, conf in platforms:
        ident_id = f"ident-{plat_name.lower()}-{pid}-{random.randint(100, 999)}"
        handle = f"{name}_{plat_name.split('_')[0].lower()}"
        platform_identities.append({
            "identity_id": ident_id,
            "player_id": pid,
            "platform": plat_name,
            "platform_handle": handle,
            "confidence_score": conf
        })
        has_identity_edges.append({
            "player_id": pid,
            "identity_id": ident_id,
            "confidence": conf
        })

    for f in franchises_played:
        modes = GAME_MODES.get(f, [])
        if modes:
            primary_mode = modes[0]
            played_game_edges.append({
                "player_id": pid,
                "game_id": primary_mode,
                "hours_played": hours if f == primary_franchise else int(hours * random.uniform(0.2, 0.4)),
                "total_spend_usd": spend if f == primary_franchise else round(spend * random.uniform(0.1, 0.3), 2),
                "is_primary": f == primary_franchise
            })
            if len(modes) > 1 and random.random() > 0.45:
                sec_mode = random.choice(modes[1:])
                played_game_edges.append({
                    "player_id": pid,
                    "game_id": sec_mode,
                    "hours_played": int(hours * random.uniform(0.15, 0.35)),
                    "total_spend_usd": round(spend * random.uniform(0.05, 0.20), 2),
                    "is_primary": False
                })

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

with open(os.path.join(DATA_DIR, "master_players.json"), "w") as f:
    json.dump(master_players, f, indent=2)

with open(os.path.join(DATA_DIR, "platform_identities.json"), "w") as f:
    json.dump(platform_identities, f, indent=2)

with open(os.path.join(DATA_DIR, "has_identity_edges.json"), "w") as f:
    json.dump(has_identity_edges, f, indent=2)

with open(os.path.join(DATA_DIR, "played_game_edges.json"), "w") as f:
    json.dump(played_game_edges, f, indent=2)

print(f"Generated {len(master_players)} Master Players across 5 Top EA Titles with Broad Purchase Histories.")
