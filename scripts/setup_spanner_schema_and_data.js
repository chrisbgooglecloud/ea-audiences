const { Spanner } = require("@google-cloud/spanner");
const fs = require("fs");
const path = require("path");

const PROJECT_ID = process.env.GCP_PROJECT_ID || "jamie-bq-test";
const INSTANCE_ID = process.env.SPANNER_INSTANCE_ID || "blackrock-spanner";
const DATABASE_ID = process.env.SPANNER_DATABASE_ID || "ea_graph_db";

async function main() {
  console.log(`[Spanner Migration] Initializing for ${PROJECT_ID} / ${INSTANCE_ID} / ${DATABASE_ID}...`);
  const spanner = new Spanner({ projectId: PROJECT_ID });
  const instance = spanner.instance(INSTANCE_ID);
  const database = instance.database(DATABASE_ID);

  // 1. Create Tables
  const statements = [
    `CREATE TABLE IF NOT EXISTS Players (
      player_id STRING(64) NOT NULL,
      display_name STRING(128) NOT NULL,
      gamer_tag STRING(128) NOT NULL,
      primary_franchise STRING(64) NOT NULL,
      primary_archetype STRING(64) NOT NULL,
      lifetime_spend_usd FLOAT64 NOT NULL,
      churn_risk_score FLOAT64 NOT NULL,
      tilt_sensitivity FLOAT64 NOT NULL,
      recent_loss_streak INT64 NOT NULL,
      dma_market STRING(128),
      country STRING(64),
      favorite_club STRING(64),
      favorite_player STRING(64),
      favorite_formation STRING(64),
      telemetry_json JSON,
      purchased_items_json JSON
    ) PRIMARY KEY (player_id)`,

    `CREATE TABLE IF NOT EXISTS Games (
      game_id STRING(64) NOT NULL,
      title STRING(128) NOT NULL,
      genre STRING(64) NOT NULL,
      current_season STRING(64),
      active_players_count INT64
    ) PRIMARY KEY (game_id)`,

    `CREATE TABLE IF NOT EXISTS PlaysGame (
      player_id STRING(64) NOT NULL,
      game_id STRING(64) NOT NULL,
      hours_played FLOAT64,
      skill_rating INT64
    ) PRIMARY KEY (player_id, game_id)`,

    `CREATE TABLE IF NOT EXISTS Clubs (
      club_id STRING(64) NOT NULL,
      name STRING(128) NOT NULL,
      league STRING(128)
    ) PRIMARY KEY (club_id)`,

    `CREATE TABLE IF NOT EXISTS Creators (
      creator_id STRING(64) NOT NULL,
      handle STRING(128) NOT NULL,
      name STRING(128) NOT NULL,
      platform STRING(128) NOT NULL,
      subscribers STRING(64) NOT NULL,
      content_type STRING(256),
      primary_archetype STRING(64),
      color STRING(32),
      avatar STRING(256),
      country STRING(64),
      preferred_formation STRING(64),
      sponsorship_angle STRING(256)
    ) PRIMARY KEY (creator_id)`,

    `ALTER TABLE Creators ADD COLUMN IF NOT EXISTS avatar STRING(256)`,
    `ALTER TABLE Creators ADD COLUMN IF NOT EXISTS country STRING(64)`,

    `CREATE TABLE IF NOT EXISTS FollowsCreator (
      player_id STRING(64) NOT NULL,
      creator_id STRING(64) NOT NULL,
      affinity_level STRING(32)
    ) PRIMARY KEY (player_id, creator_id)`
  ];

  try {
    const [operation] = await database.updateSchema(statements);
    await operation.promise();
  } catch (err) {}

  // 2. Create Property Graph DDL
  const propertyGraphStatement = `
    CREATE OR REPLACE PROPERTY GRAPH EAPlayerGraph
      NODE TABLES (
        Players,
        Games,
        Clubs,
        Creators
      )
      EDGE TABLES (
        PlaysGame
          SOURCE KEY (player_id) REFERENCES Players (player_id)
          DESTINATION KEY (game_id) REFERENCES Games (game_id)
          LABEL PLAYS_GAME,
        FollowsCreator
          SOURCE KEY (player_id) REFERENCES Players (player_id)
          DESTINATION KEY (creator_id) REFERENCES Creators (creator_id)
          LABEL FOLLOWS_CREATOR
      )
  `;

  try {
    const [graphOp] = await database.updateSchema([propertyGraphStatement]);
    await graphOp.promise();
  } catch (err) {}

  // 3. Populate Games
  const gamesTable = database.table("Games");
  const gamesData = [
    { game_id: "FC26", title: "EA SPORTS FC 26", genre: "Sports Simulation", current_season: "Season 4", active_players_count: 24000000 },
    { game_id: "APEX", title: "Apex Legends", genre: "Battle Royale", current_season: "Season 23", active_players_count: 18000000 },
    { game_id: "MADDEN25", title: "Madden NFL 25", genre: "Sports Simulation", current_season: "Super Bowl Road", active_players_count: 8500000 },
    { game_id: "BATTLEFIELD", title: "Battlefield 2042", genre: "Tactical FPS", current_season: "Season 7", active_players_count: 6200000 },
    { game_id: "SIMS4", title: "The Sims 4", genre: "Life Simulation", current_season: "Life & Death Expansion", active_players_count: 31000000 }
  ];
  await gamesTable.upsert(gamesData);

  // 4. Populate Clubs
  const clubsTable = database.table("Clubs");
  const clubsData = [
    { club_id: "REAL_MADRID", name: "Real Madrid CF", league: "LaLiga" },
    { club_id: "ARSENAL", name: "Arsenal FC", league: "Premier League" },
    { club_id: "BAYERN_MUNICH", name: "FC Bayern Munich", league: "Bundesliga" },
    { club_id: "MAN_CITY", name: "Manchester City", league: "Premier League" },
    { club_id: "FC_BARCELONA", name: "FC Barcelona", league: "LaLiga" },
    { club_id: "JUVENTUS", name: "Juventus", league: "Serie A" }
  ];
  await clubsTable.upsert(clubsData);

  // 5. Populate Creators
  const creatorsTable = database.table("Creators");
  const creatorsPath = path.join(__dirname, "../data/creators.json");
  const creatorsData = JSON.parse(fs.readFileSync(creatorsPath, "utf-8"));
  await creatorsTable.upsert(creatorsData);
  console.log(`[Spanner Migration] Seeded ${creatorsData.length} prominent FC Content Creators into Spanner Creators table.`);

  // 6. Populate Players, PlaysGame & FollowsCreator in batches
  const playersPath = path.join(__dirname, "../data/master_players.json");
  const rawPlayers = JSON.parse(fs.readFileSync(playersPath, "utf-8"));
  console.log(`[Spanner Migration] Seeding ${rawPlayers.length} Players with rich FC clubs, telemetry & creator links...`);

  const playersTable = database.table("Players");
  const playsGameTable = database.table("PlaysGame");
  const followsCreatorTable = database.table("FollowsCreator");

  const BATCH_SIZE = 250;
  for (let i = 0; i < rawPlayers.length; i += BATCH_SIZE) {
    const chunk = rawPlayers.slice(i, i + BATCH_SIZE);
    
    const playerRows = chunk.map((p) => {
      const telem = p.game_telemetry || p.telemetry || {};
      return {
        player_id: String(p.player_id),
        display_name: String(p.display_name || p.gamer_tag),
        gamer_tag: String(p.gamer_tag || p.display_name),
        primary_franchise: String(p.primary_franchise),
        primary_archetype: String(p.primary_archetype),
        lifetime_spend_usd: Spanner.float(parseFloat(p.lifetime_spend_usd) || 0.0),
        churn_risk_score: Spanner.float(parseFloat(p.churn_risk_score) || 0.0),
        tilt_sensitivity: Spanner.float(parseFloat(p.tilt_sensitivity) || 0.0),
        recent_loss_streak: parseInt(p.recent_loss_streak, 10) || 0,
        dma_market: String(p.dma_market || ""),
        country: String(p.country || ""),
        favorite_club: String(telem.favorite_club || ""),
        favorite_player: String(telem.favorite_player || ""),
        favorite_formation: String(telem.favorite_formation || ""),
        telemetry_json: JSON.stringify(telem),
        purchased_items_json: JSON.stringify(p.purchased_items || [])
      };
    });

    const edgeRows = [];
    chunk.forEach((p) => {
      const franchises = p.franchises_played || [p.primary_franchise];
      const telem = p.game_telemetry || p.telemetry || {};
      franchises.forEach((g) => {
        edgeRows.push({
          player_id: String(p.player_id),
          game_id: String(g),
          hours_played: Spanner.float(parseFloat(telem.hours_last_30d) || 25.0),
          skill_rating: parseInt(telem.squad_ovr, 10) || 85
        });
      });
    });

    const creatorEdgeRows = [];
    chunk.forEach((p) => {
      const creators = p.followed_creators || [p.primary_creator_influence || "creator-nickrtfm"];
      creators.forEach((cId) => {
        creatorEdgeRows.push({
          player_id: String(p.player_id),
          creator_id: String(cId),
          affinity_level: cId === p.primary_creator_influence ? "PRIMARY_INFLUENCE" : "FOLLOWER"
        });
      });
    });

    await playersTable.upsert(playerRows);
    await playsGameTable.upsert(edgeRows);
    await followsCreatorTable.upsert(creatorEdgeRows);
  }

  console.log(`\n🎉 [Spanner Migration Complete]: Seeded 5,000 players with full creator affiliations & Property Graph edges in Cloud Spanner!`);
}

main().catch((e) => {
  console.error("[Spanner Migration Fatal Error]:", e);
  process.exit(1);
});
