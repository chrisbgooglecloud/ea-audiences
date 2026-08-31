import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { GraphData, GraphNode, GraphLink } from "@/lib/types";

function loadJson(filename: string) {
  const filepath = path.join(process.cwd(), "data", filename);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  }
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "audience-cohorts";
  const selectedPlayerId = searchParams.get("playerId") || "2k-usr-00001";
  const gameFilter = searchParams.get("game") || "ALL";
  const archetypeFilter = searchParams.get("archetype") || "ALL";

  const masterPlayers = loadJson("master_players.json");
  const platformIdentities = loadJson("platform_identities.json");
  const hasIdentityEdges = loadJson("has_identity_edges.json");
  const games = loadJson("games.json");
  const playedEdges = loadJson("played_game_edges.json");
  const offers = loadJson("marketing_offers.json");

  let nodes: GraphNode[] = [];
  let links: GraphLink[] = [];

  // ==========================================
  // VIEW 1: SINGLE PLAYER IDENTITY RESOLUTION
  // ==========================================
  if (view === "single-identity") {
    const player = masterPlayers.find((p: any) => p.player_id === selectedPlayerId) || masterPlayers[0];
    
    if (player) {
      nodes.push({
        id: player.player_id,
        name: player.display_name,
        type: "PLAYER",
        franchise: player.primary_franchise,
        archetype: player.primary_archetype,
        spend: player.lifetime_spend_usd,
        churn_risk: player.churn_risk_score,
        tilt: player.tilt_sensitivity,
        val: 28,
        color: "#00F0FF",
        fx: 0,
        fy: 0,
      });

      const pEdges = hasIdentityEdges.filter((e: any) => e.player_id === player.player_id);
      for (const e of pEdges) {
        const ident = platformIdentities.find((i: any) => i.identity_id === e.identity_id);
        if (ident) {
          let identColor = "#00F0FF";
          if (ident.platform.includes("2K")) identColor = "#E51B24";
          else if (ident.platform.includes("MYNBA")) identColor = "#FFB800";
          else if (ident.platform.includes("PLAY")) identColor = "#0070D1";
          else if (ident.platform.includes("XBOX")) identColor = "#107C10";
          else if (ident.platform.includes("STEAM")) identColor = "#9146FF";
          else if (ident.platform.includes("SWITCH")) identColor = "#E60012";

          nodes.push({
            id: ident.identity_id,
            name: `${ident.platform}: ${ident.platform_handle}`,
            type: "IDENTITY",
            platform: ident.platform,
            confidence: ident.confidence_score,
            val: 15,
            color: identColor,
          });

          links.push({
            source: player.player_id,
            target: ident.identity_id,
            label: `CONFIDENCE: ${(ident.confidence_score * 100).toFixed(0)}%`,
            value: 3,
          });
        }
      }
    }
  }

  // ==========================================
  // VIEW 2: MULTI-FRANCHISE & GAME-SPECIFIC COHORTS
  // ==========================================
  else {
    let targetPlayers = masterPlayers;
    let targetGames = games;
    let targetOffers = offers;

    // 1. Filter by Game Franchise if not ALL
    if (gameFilter !== "ALL") {
      targetPlayers = masterPlayers.filter(
        (p: any) => p.primary_franchise === gameFilter || (p.franchises_played && p.franchises_played.includes(gameFilter))
      );
      targetGames = games.filter((g: any) => g.franchise === gameFilter);
      targetOffers = offers.filter((o: any) => o.target_franchise === gameFilter);
    }

    // 2. Filter by Archetype if specified
    if (archetypeFilter !== "ALL") {
      targetPlayers = targetPlayers.filter((p: any) => p.primary_archetype === archetypeFilter);
    }

    const sample = targetPlayers.slice(0, 450);

    // 3. Anchor Coordinates Calculation
    if (gameFilter === "ALL") {
      // 5 Grand Franchise Hubs
      const macroHubPositions: Record<string, { fx: number; fy: number; color: string }> = {
        "game-nba2k26": { fx: 0, fy: 0, color: "#E51B24" },            // 2K Crimson Red (Centerpiece)
        "game-borderlands4": { fx: -380, fy: -200, color: "#FFD200" }, // Borderlands Yellow
        "game-civ7": { fx: 380, fy: -200, color: "#38BDF8" },         // Civ Sky Blue
        "game-wwe2k25": { fx: -380, fy: 200, color: "#F59E0B" },       // WWE Amber Gold
        "game-pgatour2k": { fx: 380, fy: 200, color: "#10B981" },     // PGA Emerald Green
      };

      const parentGames = games.filter((g: any) => g.is_parent_hub);
      for (const g of parentGames) {
        const pos = macroHubPositions[g.game_id];
        nodes.push({
          id: g.game_id,
          name: g.title,
          type: "GAME",
          franchise: g.franchise,
          val: 36,
          color: pos?.color || "#00F0FF",
          fx: pos?.fx,
          fy: pos?.fy,
        });
      }

      // Macro Top Major DLC & Monetization Wells (2K Digital Goods)
      const macroOfferPositions: Record<string, { fx: number; fy: number }> = {
        "dlc-nba2k26-hof-edition": { fx: -140, fy: -140 },
        "item-nba2k26-vc-450000": { fx: 140, fy: -140 },
        "offer-nba2k26-rec-streak-shield": { fx: -140, fy: 140 },
        "offer-nba2k26-propass-season4": { fx: 140, fy: 140 },
        "offer-nba2k26-myteam-darkmatter-box": { fx: 0, fy: -220 },
        "item-nba2k26-vc-200000": { fx: 0, fy: 220 },
        "dlc-borderlands4-deluxe-season-pass": { fx: -540, fy: -280 },
        "item-bl4-legendary-booster": { fx: -520, fy: -100 },
        "dlc-civ7-founders-edition": { fx: 540, fy: -280 },
        "dlc-pgatour2k-clubhouse-pass": { fx: 540, fy: 280 },
        "item-wwe-myfaction-diamond-pack": { fx: -540, fy: 280 },
      };

      for (let oIdx = 0; oIdx < offers.length; oIdx++) {
        const o = offers[oIdx];
        const isMajorDlc = o.offer_type.includes("MAJOR_DLC") || o.price_usd >= 60;
        let fx = macroOfferPositions[o.offer_id]?.fx;
        let fy = macroOfferPositions[o.offer_id]?.fy;

        // If not in macro positions, place organically near franchise hub
        if (fx === undefined || fy === undefined) {
          const parentHub = macroHubPositions[`game-${o.target_franchise?.toLowerCase().replace(/[^a-z0-9]/g, "")}`] || { fx: 0, fy: 0 };
          const angle = (oIdx / offers.length) * 2 * Math.PI;
          fx = parentHub.fx + Math.round(Math.cos(angle) * 140);
          fy = parentHub.fy + Math.round(Math.sin(angle) * 140);
        }

        nodes.push({
          id: o.offer_id,
          name: `${o.offer_title} ($${o.price_usd})`,
          type: "OFFER",
          franchise: o.target_franchise,
          spend: o.price_usd,
          val: isMajorDlc ? 34 : 26,
          color: isMajorDlc ? "#FFB800" : o.price_usd >= 30 ? "#A855F7" : "#EC4899",
          offer_data: o,
          fx,
          fy,
        });
      }
    } else {
      // Specific Game Selected -> Sub-modes and All Game Offers & Major DLCs
      const subGames = targetGames.filter((g: any) => !g.is_parent_hub);
      const activeGames = subGames.length > 0 ? subGames : targetGames;

      activeGames.forEach((g: any, idx: number) => {
        const angle = (idx / activeGames.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 220;
        const fx = Math.round(Math.cos(angle) * radius);
        const fy = Math.round(Math.sin(angle) * radius);

        nodes.push({
          id: g.game_id,
          name: g.title,
          type: "GAME",
          franchise: g.franchise,
          val: 32,
          color: g.franchise === "NBA2K26" ? "#E51B24" : g.franchise === "BORDERLANDS4" ? "#FFD200" : g.franchise === "CIV7" ? "#38BDF8" : g.franchise === "WWE2K25" ? "#F59E0B" : "#10B981",
          fx,
          fy,
        });
      });

      // Position Major DLCs and In-Game Offers in Outer Orbit
      targetOffers.forEach((o: any, idx: number) => {
        const angle = (idx / targetOffers.length) * 2 * Math.PI;
        const radius = 390;
        const fx = Math.round(Math.cos(angle) * radius);
        const fy = Math.round(Math.sin(angle) * radius);

        const isMajorDlc = o.offer_type.includes("MAJOR_DLC") || o.price_usd >= 60;
        const itemColor = isMajorDlc ? "#FFB800" : o.price_usd >= 30 ? "#A855F7" : o.price_usd <= 5 ? "#FF4757" : "#EC4899";

        nodes.push({
          id: o.offer_id,
          name: `${o.offer_title} ($${o.price_usd})`,
          type: "OFFER",
          franchise: o.target_franchise,
          spend: o.price_usd,
          val: isMajorDlc ? 32 : o.price_usd >= 30 ? 28 : 22,
          color: itemColor,
          offer_data: o,
          fx,
          fy,
        });
      });
    }

    // 4. Player Nodes Generation
    for (let idx = 0; idx < sample.length; idx++) {
      const p = sample[idx];
      let nodeColor = "#00FF88";

      if (p.primary_archetype === "MYCAREER_HOOPER" || p.primary_archetype === "COMPETITIVE_GRINDER") {
        nodeColor = "#FF4757"; // Sweat / Tilt Red
      } else if (p.primary_archetype === "MYTEAM_WHALE" || p.primary_archetype === "ULTIMATE_TEAM_WHALE") {
        nodeColor = "#FFB800"; // Whale Gold
      } else if (p.primary_archetype === "VAULT_HUNTER_SQUAD" || p.primary_archetype === "LORE_SEEKER") {
        nodeColor = "#00F0FF"; // Cyan / Siren
      } else if (p.primary_archetype === "4X_GRAND_STRATEGIST") {
        nodeColor = "#38BDF8"; // Sky Blue
      } else if (p.primary_archetype === "PROPASS_GRINDER") {
        nodeColor = "#A855F7"; // Purple
      }

      const size = p.lifetime_spend_usd >= 2000 ? 14 : p.lifetime_spend_usd >= 400 ? 9 : 6;

      nodes.push({
        id: p.player_id,
        name: p.display_name,
        type: "PLAYER",
        franchise: p.primary_franchise,
        archetype: p.primary_archetype,
        spend: p.lifetime_spend_usd,
        churn_risk: p.churn_risk_score,
        tilt: p.tilt_sensitivity,
        loss_streak: p.recent_loss_streak || 0,
        game_telemetry: p.game_telemetry,
        purchased_items: (p as any).purchased_items || [],
        val: size,
        color: nodeColor,
      });
    }

    // 5. Connect Links with Realistic User Purchase Diversity
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.type === "PLAYER") {
        const rawPlayer = sample.find((p: any) => p.player_id === n.id);
        if (!rawPlayer) continue;
        const playerSpend = n.spend || 0;
        const isWhale = playerSpend >= 1000;
        const isMidSpender = playerSpend >= 100 && playerSpend < 1000;
        const isLowSpender = playerSpend > 0 && playerSpend < 100;
        const isBaseGameOnly = playerSpend === 0 || (playerSpend <= 70 && rawPlayer.primary_archetype === "4X_GRAND_STRATEGIST");

        // A. Primary Game Ownership / Play Connection
        if (gameFilter === "ALL") {
          const primFranchiseCode = rawPlayer.primary_franchise.toLowerCase().replace(/[^a-z0-9]/g, "");
          const parentHubId = `game-${primFranchiseCode}`;
          if (nodes.some((item) => item.id === parentHubId)) {
            links.push({
              source: n.id,
              target: parentHubId,
              label: isBaseGameOnly ? "BASE_GAME_RETAIL_PURCHASER" : "PRIMARY_FRANCHISE_PLAYER",
              value: 2,
            });
          }

          // Cross-Franchise Play Edges (e.g. 2K Hooper playing Borderlands 4 on weekends)
          if (rawPlayer.franchises_played && rawPlayer.franchises_played.length > 1) {
            for (let j = 1; j < rawPlayer.franchises_played.length; j++) {
              const secCode = rawPlayer.franchises_played[j].toLowerCase().replace(/[^a-z0-9]/g, "");
              const secHubId = `game-${secCode}`;
              if (nodes.some((item) => item.id === secHubId)) {
                links.push({
                  source: n.id,
                  target: secHubId,
                  label: "CROSS_FRANCHISE_PLAY",
                  value: 1,
                  isTriggerStream: i % 4 === 0,
                });
              }
            }
          }
        } else {
          // Specific Game Mode Linking
          const matchedModes = nodes.filter((item) => item.type === "GAME");
          if (matchedModes.length > 0) {
            links.push({
              source: n.id,
              target: matchedModes[i % matchedModes.length].id,
              label: isBaseGameOnly ? "BASE_GAME_RETAIL_OWNER" : "ACTIVE_MODE_PLAYER",
              value: 2,
            });
          }
        }

        // B. Tiered In-Game Purchases & DLC Ownership Connections
        const availableOffers = nodes.filter((item) => item.type === "OFFER");

        // Category 1: Whales ($1,000+ LTV) -> Connect to Major DLC Upgrades & Currency Vaults
        if (isWhale) {
          const whaleOffers = availableOffers.filter(
            (off) =>
              off.spend &&
              off.spend >= 45 &&
              (off.offer_data?.affinity_archetype === n.archetype || off.franchise === n.franchise)
          );
          if (whaleOffers.length > 0) {
            const targetOffer = whaleOffers[i % whaleOffers.length];
            links.push({
              source: n.id,
              target: targetOffer.id,
              label: targetOffer.offer_data?.offer_type?.includes("MAJOR_DLC") ? "MAJOR_DLC_PURCHASE" : "MONETIZATION_GRAVITY",
              value: 3,
              isTriggerStream: true,
            });
          }
        }

        // Category 2: Mid-Tier Spenders ($100 - $999 LTV) -> Connect to Cap Breakers, ProPASS, and Packs
        else if (isMidSpender) {
          const midOffers = availableOffers.filter(
            (off) =>
              off.spend &&
              off.spend >= 10 &&
              off.spend <= 50 &&
              (off.franchise === n.franchise || off.offer_data?.affinity_archetype === n.archetype)
          );
          if (midOffers.length > 0) {
            const targetOffer = midOffers[i % midOffers.length];
            links.push({
              source: n.id,
              target: targetOffer.id,
              label: targetOffer.offer_data?.offer_type?.includes("EXPANSION") ? "EXPANSION_DLC_OWNER" : "PROPASS_HOLDER",
              value: 2,
            });
          }
        }

        // Category 3: Low-Tier & Social Spenders ($10 - $90 LTV) -> Connect to Small VC Bundles & Creator Collabs
        else if (isLowSpender) {
          const lowOffers = availableOffers.filter((off) => off.spend && off.spend <= 20 && off.franchise === n.franchise);
          if (lowOffers.length > 0) {
            const targetOffer = lowOffers[i % lowOffers.length];
            links.push({
              source: n.id,
              target: targetOffer.id,
              label: "STARTER_BUNDLE_PURCHASE",
              value: 1.5,
            });
          }
        }

        // Category 4: Entry Tier / Situational Offers (Loss-streak or high tilt players)
        if ((n.tilt && n.tilt >= 0.55) || (n.loss_streak && n.loss_streak >= 2)) {
          const situationalOffer = availableOffers.find(
            (off) =>
              (off.offer_data?.offer_type === "SITUATIONAL_TRIGGER_PACK" || (off.spend !== undefined && off.spend <= 10)) &&
              off.franchise === n.franchise
          );
          if (situationalOffer) {
            links.push({
              source: n.id,
              target: situationalOffer.id,
              label: "TILT_SHIELD_TRIGGER",
              value: 2,
              isTriggerStream: true,
            });
          }
        }
      }
    }
  }

  const payload: GraphData = { nodes, links };
  return NextResponse.json(payload);
}
