"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, ArrowRight, Sparkles, Send, Check, Users, MessageSquare, Target, SlidersHorizontal, Loader2 } from "lucide-react";
import { DeepSonaResult, GraphNode, GraphData, CohortContext, GameFranchise } from "@/lib/types";
import LiftScoreGauge from "./LiftScoreGauge";
import FUTPersonaCard, { PersonaProfile } from "./FUTPersonaCard";
import CommunityDebateSimulator from "./CommunityDebateSimulator";
import ConversionScoringMatrix from "./ConversionScoringMatrix";
import SensitivitySimulator from "./SensitivitySimulator";

interface DeepSonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNode: GraphNode | null;
  cohortContext?: CohortContext | null;
  selectedGame?: GameFranchise;
  graphData?: GraphData | null;
  initialResult?: DeepSonaResult | null;
  initialCreativeTitle?: string;
  initialFranchise?: string;
  isGeneratingBrief?: boolean;
  onGenerateBrief: (result: DeepSonaResult) => void;
}

type DeepSonaTab = "personas" | "community_debate" | "conversion_scoring" | "sensitivity";

function generateDynamicQuote(
  node: GraphNode,
  activeGame: string,
  slotIndex: number,
  reactionQuote?: string
): string {
  if (reactionQuote && reactionQuote.length > 15 && !reactionQuote.includes("...")) {
    return reactionQuote;
  }

  const rawFranchise = (node.franchise || activeGame || "FC26").toUpperCase();
  const isApex = rawFranchise.includes("APEX");
  const isMadden = rawFranchise.includes("MADDEN");
  const isSims = rawFranchise.includes("SIMS");
  const isBF = rawFranchise.includes("BATTLEFIELD") || rawFranchise.includes("BF");
  const isFC = !isApex && !isMadden && !isSims && !isBF;

  const spend = node.spend !== undefined && node.spend > 0 ? node.spend : slotIndex === 1 ? 4200 : slotIndex === 0 ? 450 : slotIndex === 2 ? 140 : 40;
  const lossStreak = node.loss_streak !== undefined && node.loss_streak > 0 ? node.loss_streak : slotIndex === 0 ? 3 : 1;
  const tilt = Math.round((node.tilt !== undefined ? node.tilt : slotIndex === 0 ? 0.85 : slotIndex === 1 ? 0.15 : slotIndex === 2 ? 0.35 : 0.20) * 100);
  const formattedSpend = `$${spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Slot 0: Frustrated Competitive Sweats (Loss Streak / Defeat Trigger)
  if (slotIndex === 0) {
    if (isApex) {
      return `After getting third-partied ${lossStreak} matches in a row (tilt at ${tilt}%), grabbing the $4.99 1,000 Coins starter reload on the defeat screen gets me right back into the queue.`;
    } else if (isMadden) {
      return `Gave up a 4th-quarter turnover in MUT Champions (${lossStreak} game slump, ${tilt}% tilt). A quick 500 Points reload right after defeat helps reset the momentum immediately.`;
    } else if (isBF) {
      return `Tough defeat defending the final sector on Breakthrough. A 2x Squad XP booster lets me push through weapon attachments without grinding all night.`;
    } else if (isSims) {
      return `Building intricate multi-story legacy lots can get tedious when custom content breaks. Modular Creator Kits ready to load keep my build momentum.`;
    } else {
      return `Lost 2 penalty shootouts in Weekend League qualifiers (${lossStreak} losses, tilt ${tilt}%). $4.99 for 500 FC Points to grab contracts and player picks keeps me locked in.`;
    }
  }

  // Slot 1: High-LTV Whales & Collection Event Hunters (Big Spenders)
  if (slotIndex === 1) {
    if (isApex) {
      return `I've invested ${formattedSpend} into my collection. When the Mythic Heirloom Shards unlock event is live, I buy out the full 24-item pack milestone on day one.`;
    } else if (isMadden) {
      return `Lifetime spend of ${formattedSpend} on Ultimate Team. I rip bundles every Saturday morning for Legends releases, so the 12,000 Madden Points Vault is my standard reload.`;
    } else if (isBF) {
      return `Tier 1 armor mastery with ${formattedSpend} invested. The Specialist Elite vehicle and weapon packs give our squad high-visibility battlefield dominance.`;
    } else if (isSims) {
      return `I own all major expansion packs (${formattedSpend} total spend). The $39.99 Lovestruck + For Rent bundle is an instant add to my catalog.`;
    } else {
      return `Lifetime spend of ${formattedSpend} on Ultimate Team. Guaranteed campaign walkouts and 12,000 Points Vault reloads are an automatic Friday purchase for my squad.`;
    }
  }

  // Slot 2: Squad Co-op / Socializers (Team Play & Group Passes)
  if (slotIndex === 2) {
    if (isApex) {
      return `Our 3-stack hops on every Friday night. The Battle Pass Ultimate+ with 10 tier skips and crafting metals is something our whole premade squad buys together.`;
    } else if (isMadden) {
      return `3v3 Superstar Showdown with my squad is our main mode (${formattedSpend} spend). Squad XP passes that boost archetype ratings faster are an easy pick for our group.`;
    } else if (isBF) {
      return `Squad lead for a 4-man assault unit. Squad XP boosters help all 4 of us level our loadouts together during weekend clan ops.`;
    } else if (isSims) {
      return `I love sharing custom builds and room makeover videos with my community. Boutique furniture creator kits under $5 are great impulse buys.`;
    } else {
      return `We run 4-player Rush 5v5 every weekend. Double Rush Points tokens and group evolution slots provide massive team value under $10.`;
    }
  }

  // Slot 3: Value Optimizers & Casual Story Purists (Price-Conscious / Franchise Purist)
  if (isApex) {
    return `I usually stick to the free battle pass track, but a $4.99 starter bundle with a character skin and bonus coins is fair value that bypasses store clutter.`;
  } else if (isMadden) {
    return `Connected Franchise league player (${formattedSpend} spend). Keep microtransactions balanced and don't make online leagues pay-to-win, and the pricing is reasonable.`;
  } else if (isBF) {
    return `Casual conquest player with limited gaming time. Season pass weapon cosmetics under $10 give solid visual upgrades without grinding 50 hours.`;
  } else if (isSims) {
    return `I play legacy storylines across 10 generations. Emotional depth and family dynamic kits add huge sentimental value to my saves.`;
  } else {
    return `Career Mode manager purist (${formattedSpend} spend). As long as monetization stays out of offline tactical modes and offers fair starter value for casuals, I'm supportive.`;
  }
}

export default function DeepSonaModal({
  isOpen,
  onClose,
  targetNode,
  cohortContext,
  selectedGame = "ALL",
  graphData,
  initialResult,
  initialCreativeTitle,
  initialFranchise,
  isGeneratingBrief = false,
  onGenerateBrief,
}: DeepSonaModalProps) {
  const [activeTab, setActiveTab] = useState<DeepSonaTab>("personas");
  const [creativeTitle, setCreativeTitle] = useState(
    initialCreativeTitle || "Contextual Marketing & Retention Intervention"
  );
  const [franchise, setFranchise] = useState(initialFranchise || "EA Live Service");
  const [proposedSpend, setProposedSpend] = useState(120000);
  const [targetRoas, setTargetRoas] = useState(2.45);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DeepSonaResult | null>(initialResult || null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaProfile | null>(null);

  // Debate Stream State
  const [debatePrompt, setDebatePrompt] = useState("");
  const [isDebating, setIsDebating] = useState(false);
  const [debateMessages, setDebateMessages] = useState<
    Array<{ id: string; sender: string; role: string; text: string; wtp: number; fsm: string }>
  >([]);

  // Dynamically Grounded Personas Based on the Selected Game and Cohort (Driven by Active Graph Group)
  const groundedPersonas: PersonaProfile[] = useMemo(() => {
    const game = (targetNode?.franchise || cohortContext?.franchise || selectedGame || "ALL") as GameFranchise;
    const rawPlayerNodes = graphData?.nodes?.filter((n) => n.type === "PLAYER") || [];
    const playerNodes = rawPlayerNodes.filter((n) =>
      game === "ALL" ||
      n.franchise === game ||
      (n.franchise || "").toUpperCase().includes(game === "FC26" ? "FC" : game)
    );
    const arch = cohortContext?.dominantArchetype || targetNode?.archetype || "COMPETITIVE_GRINDER";
    const q = cohortContext?.query?.toLowerCase() || "";

    // 1. If we have actual real player nodes in the active graph slice, sample 4 diverse archetypes from the current graph group!
    if (playerNodes.length >= 4) {
      const competitiveCandidates = playerNodes.filter(
        (n) =>
          (n.loss_streak || 0) >= 2 ||
          (n.tilt || 0) >= 0.6 ||
          (n.archetype || "").includes("SWEAT") ||
          (n.archetype || "").includes("COMPETITIVE")
      );
      const whaleCandidates = [...playerNodes].sort((a, b) => (b.spend || 0) - (a.spend || 0));
      const socialCandidates = playerNodes.filter(
        (n) =>
          (n.archetype || "").includes("SOCIAL") ||
          (n.archetype || "").includes("SQUAD") ||
          (n.archetype || "").includes("CONQUEST") ||
          (n.archetype || "").includes("PREMADE")
      );
      const casualCandidates = [...playerNodes].sort((a, b) => (a.spend || 0) - (b.spend || 0));

      const pickedNodes: GraphNode[] = [];

      // Slot 0: Competitive / Target Node
      if (targetNode && targetNode.type === "PLAYER") {
        pickedNodes.push(targetNode);
      } else {
        pickedNodes.push(competitiveCandidates[0] || playerNodes[0]);
      }

      // Slot 1: Whale (High Spend)
      const whaleNode =
        whaleCandidates.find((n) => !pickedNodes.some((p) => p.id === n.id)) ||
        playerNodes[1 % playerNodes.length];
      pickedNodes.push(whaleNode);

      // Slot 2: Social / Co-op
      const socialNode =
        socialCandidates.find((n) => !pickedNodes.some((p) => p.id === n.id)) ||
        playerNodes[2 % playerNodes.length];
      pickedNodes.push(socialNode);

      // Slot 3: Casual / Story Purist
      const casualNode =
        casualCandidates.find((n) => !pickedNodes.some((p) => p.id === n.id)) ||
        playerNodes[3 % playerNodes.length];
      pickedNodes.push(casualNode);

      const sampled: PersonaProfile[] = pickedNodes.map((node, slotIdx) => {
        const liveReaction = result?.reactions?.[slotIdx];
        const spend =
          node.spend !== undefined && node.spend > 0
            ? node.spend
            : slotIdx === 1
            ? 850
            : slotIdx === 0
            ? 320
            : slotIdx === 2
            ? 140
            : 40;
        const tilt = Math.round(
          (node.tilt !== undefined
            ? node.tilt
            : slotIdx === 0
            ? 0.88
            : slotIdx === 1
            ? 0.15
            : slotIdx === 2
            ? 0.35
            : 0.2) * 100
        );
        const lossStreak =
          node.loss_streak !== undefined
            ? node.loss_streak
            : slotIdx === 0
            ? 3
            : slotIdx === 1
            ? 0
            : slotIdx === 2
            ? 1
            : 0;

        const nodeFranchise = (node.franchise || game || "FC26").toUpperCase();
        const isApex = nodeFranchise.includes("APEX");
        const isMadden = nodeFranchise.includes("MADDEN");
        const isSims = nodeFranchise.includes("SIMS");
        const isBF = nodeFranchise.includes("BATTLEFIELD") || nodeFranchise.includes("BF");

        let pArch =
          slotIdx === 0
            ? "COMPETITIVE_GRINDER"
            : slotIdx === 1
            ? "ULTIMATE_TEAM_WHALE"
            : slotIdx === 2
            ? "CASUAL_SOCIALIZER"
            : "LORE_SEEKER";

        if (isApex) {
          pArch =
            slotIdx === 0
              ? "RANKED_SWEAT"
              : slotIdx === 1
              ? "HEIRLOOM_WHALE"
              : slotIdx === 2
              ? "CASUAL_SOCIALIZER"
              : "CASUAL_WARRIOR";
        } else if (isMadden) {
          pArch =
            slotIdx === 0
              ? "COMPETITIVE_GRINDER"
              : slotIdx === 1
              ? "MUT_WHALE"
              : slotIdx === 2
              ? "CASUAL_SOCIALIZER"
              : "LORE_SEEKER";
        } else if (isSims) {
          pArch =
            slotIdx === 0
              ? "BUILDER_CREATOR"
              : slotIdx === 1
              ? "SIMS_COLLECTOR"
              : slotIdx === 2
              ? "CASUAL_WARRIOR"
              : "LORE_SEEKER";
        } else if (isBF) {
          pArch =
            slotIdx === 0
              ? "CONQUEST_LEADER"
              : slotIdx === 1
              ? "ICON_COMMANDER"
              : slotIdx === 2
              ? "CASUAL_SOCIALIZER"
              : "LORE_SEEKER";
        }

        const cardTier: PersonaProfile["cardTier"] =
          slotIdx === 1 ? "ICON" : slotIdx === 0 ? "GOLD_RARE" : slotIdx === 2 ? "HERO" : "MANAGER";
        const ovrRating = slotIdx === 1 ? 98 : slotIdx === 0 ? 94 : slotIdx === 2 ? 89 : 85;

        const wtp =
          liveReaction?.willingness_to_pay_usd !== undefined
            ? liveReaction.willingness_to_pay_usd
            : slotIdx === 1
            ? spend >= 2000
              ? 99.99
              : 49.99
            : slotIdx === 0
            ? 4.99
            : slotIdx === 2
            ? 9.99
            : 0.0;

        const fsmState =
          liveReaction?.final_fsm_state || (wtp > 0 ? "PURCHASED" : "ENGAGED_FREE");

        const franchiseName = isMadden
          ? "Madden NFL 25"
          : isApex
          ? "Apex Legends"
          : isSims
          ? "The Sims 4"
          : isBF
          ? "Battlefield 2042"
          : "EA SPORTS FC 26";

        const division =
          slotIdx === 0
            ? `${franchiseName} • ${isMadden ? "All-Madden Div 1" : isApex ? "Apex Predator (Rank 42)" : isSims ? "Architectural Master" : isBF ? "Breakthrough Tier 1" : "FUT Champs Elite"}`
            : slotIdx === 1
            ? `${franchiseName} • ${isMadden ? "MUT Legends Whale" : isApex ? "Heirloom Collector" : isSims ? "All 18 DLCs Owned" : isBF ? "Tier 1 Armor Ace" : "Icon Collector ($3.5k+)"}`
            : slotIdx === 2
            ? `${franchiseName} • ${isMadden ? "Superstar 3v3 Squad" : isApex ? "Trios Pre-made Stack" : isSims ? "Stream Community Builder" : isBF ? "4-Man Assault Lead" : "Rush 5v5 Captain"}`
            : `${franchiseName} • ${isMadden ? "Connected Franchise Commish" : isApex ? "Casual Mixtape Solo" : isSims ? "10-Gen Legacy Story" : isBF ? "Portal MilSim Purist" : "Career Mode Tactician"}`;

        return {
          id: node.id,
          name: node.name,
          gamerTag: node.name,
          archetype: pArch,
          cardTier,
          ovrRating,
          division,
          matchesPlayed: Math.floor(200 + spend * 1.5),
          spendLtv: spend,
          tiltLevel: tilt,
          wtp,
          fsmState,
          recentLossStreak: lossStreak,
          quote: generateDynamicQuote(node, node.franchise || game, slotIdx, liveReaction?.verbatim_quote),
        };
      });

      return sampled;
    }

    // 2. APEX LEGENDS PERSONAS FALLBACK
    if (game === "APEX" || q.includes("apex") || q.includes("predator") || q.includes("heirloom")) {
      return [
        {
          id: "Apex_Pred_Wraith99",
          name: "Kai 'Pred' Tanaka",
          gamerTag: "Wraith_Pred_99",
          archetype: "RANKED_SWEAT",
          cardTier: "ICON",
          ovrRating: 99,
          division: "Apex Predator (Rank 42)",
          matchesPlayed: 2450,
          spendLtv: 850.0,
          tiltLevel: 88,
          wtp: 4.99,
          fsmState: "PURCHASED",
          recentLossStreak: 3,
          quote: "After getting third-partied 3 matches in a row, grabbing the $4.99 1,000 Apex Coins starter pack with the bonus character skin got me right back into the queue.",
        },
        {
          id: "Heirloom_Sniper_Octane",
          name: "Austin 'Vault' Miller",
          gamerTag: "Heirloom_Octane_Prime",
          archetype: "HEIRLOOM_WHALE",
          cardTier: "TOTY",
          ovrRating: 98,
          division: "Collection Event Whale",
          matchesPlayed: 1800,
          spendLtv: 3400.0,
          tiltLevel: 15,
          wtp: 160.00,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "150 Mythic Heirloom Shards guaranteed for finishing the 24-item event collection? I'll buy out the entire pack event day one.",
        },
        {
          id: "Trios_Squad_Conduit",
          name: "Chloe & Premade",
          gamerTag: "Conduit_Shield_Squad",
          archetype: "CASUAL_SOCIALIZER",
          cardTier: "HERO",
          ovrRating: 89,
          division: "Diamond Trios Pre-made",
          matchesPlayed: 620,
          spendLtv: 120.0,
          tiltLevel: 30,
          wtp: 19.99,
          fsmState: "PURCHASED",
          recentLossStreak: 1,
          quote: "The Battle Pass Ultimate+ Edition gives our entire squad instant Legend access, 10 tier skips, and 1,200 Crafting Metals. Easy buy.",
        },
        {
          id: "Mixtape_Demon_R99",
          name: "Liam 'GunRun' S.",
          gamerTag: "Mixtape_Grinder_XI",
          archetype: "CASUAL_WARRIOR",
          cardTier: "GOLD_RARE",
          ovrRating: 86,
          division: "Gun Run / Control Casual",
          matchesPlayed: 410,
          spendLtv: 40.0,
          tiltLevel: 20,
          wtp: 4.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "The 1,000 Apex Coins starter bundle is great value for unlocking featured weapon skins without sweating.",
        },
      ];
    }

    // 3. MADDEN NFL PERSONAS FALLBACK
    else if (game === "MADDEN25" || q.includes("madden") || q.includes("mut")) {
      return [
        {
          id: "MUT_Whale_Mahomes",
          name: "Travis B.",
          gamerTag: "Mahomes_MUT_Whale",
          archetype: "MUT_WHALE",
          cardTier: "ICON",
          ovrRating: 97,
          division: "MUT Champions Top 100",
          matchesPlayed: 1400,
          spendLtv: 6200.0,
          tiltLevel: 25,
          wtp: 99.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "12,000 Madden Points Vault for ripping Saturday morning Legends Fantasy bundles is an instant reload.",
        },
        {
          id: "MUT_Champs_Sweat",
          name: "DeAndre 'Blitz' Cole",
          gamerTag: "Cover3_Beater_XI",
          archetype: "COMPETITIVE_GRINDER",
          cardTier: "GOLD_RARE",
          ovrRating: 94,
          division: "MUT Weekend League",
          matchesPlayed: 920,
          spendLtv: 480.0,
          tiltLevel: 85,
          wtp: 4.99,
          fsmState: "PURCHASED",
          recentLossStreak: 3,
          quote: "A $4.99 500 Madden Points starter reload gave me the quick pack and stamina I needed to get right back in.",
        },
        {
          id: "Superstar_Showdown_3v3",
          name: "Malik & Squad",
          gamerTag: "Superstar_Showdown_3v3",
          archetype: "CASUAL_SOCIALIZER",
          cardTier: "HERO",
          ovrRating: 88,
          division: "3v3 Arcade Football",
          matchesPlayed: 340,
          spendLtv: 60.0,
          tiltLevel: 20,
          wtp: 9.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "Squad XP passes that boost our WR archetype ratings faster are great for Friday night sessions with the boys.",
        },
        {
          id: "Franchise_Gaffer_Purist",
          name: "Coach Greg M.",
          gamerTag: "Lombardi_Chaser_07",
          archetype: "LORE_SEEKER",
          cardTier: "MANAGER",
          ovrRating: 86,
          division: "32-User Connected Franchise",
          matchesPlayed: 520,
          spendLtv: 0.0,
          tiltLevel: 10,
          wtp: 0.0,
          fsmState: "ENGAGED_FREE",
          recentLossStreak: 0,
          quote: "Keep pay-to-win microtransactions out of our Connected Franchise league and we're happy.",
        },
      ];
    }

    // 4. THE SIMS 4 PERSONAS FALLBACK
    else if (game === "SIMS4" || q.includes("sims") || q.includes("expansion")) {
      return [
        {
          id: "Sims_DLC_Whale",
          name: "Elena 'SulSul' Vance",
          gamerTag: "Plumbob_Queen_AllDLC",
          archetype: "SIMS_COLLECTOR",
          cardTier: "ICON",
          ovrRating: 98,
          division: "All 18 Expansion Packs Owned",
          matchesPlayed: 3200,
          spendLtv: 1150.0,
          tiltLevel: 5,
          wtp: 39.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "The Lovestruck + For Rent Expansion bundle for $39.99 is a 30% discount. Buying immediately for the new world builds.",
        },
        {
          id: "CC_Builder_Architect",
          name: "Maya 'BuildMode' Lin",
          gamerTag: "Modern_Mansions_CC",
          archetype: "BUILDER_CREATOR",
          cardTier: "HERO",
          ovrRating: 94,
          division: "Architectural Creator",
          matchesPlayed: 1800,
          spendLtv: 320.0,
          tiltLevel: 8,
          wtp: 4.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "$4.99 Creator Kits with modular windows and modern furniture textures save me dozens of hours of custom content modding.",
        },
        {
          id: "Legacy_Generations_Purist",
          name: "Sarah 'Legacy' T.",
          gamerTag: "10_Gen_Legacy_Story",
          archetype: "LORE_SEEKER",
          cardTier: "MANAGER",
          ovrRating: 90,
          division: "Legacy Storyteller (10 Gens)",
          matchesPlayed: 1400,
          spendLtv: 180.0,
          tiltLevel: 10,
          wtp: 19.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "I love expansions that deepen family dynamics and life stages. High emotional value for legacy gameplay.",
        },
        {
          id: "Casual_Townie_Makeover",
          name: "Jessica W.",
          gamerTag: "SulSul_Casual_Gamer",
          archetype: "CASUAL_WARRIOR",
          cardTier: "GOLD_RARE",
          ovrRating: 84,
          division: "Casual Life Simulator",
          matchesPlayed: 350,
          spendLtv: 40.0,
          tiltLevel: 12,
          wtp: 4.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "Boutique fashion and furniture kits for $4.99 are easy impulse buys.",
        },
      ];
    }

    // 5. BATTLEFIELD PERSONAS FALLBACK
    else if (game === "BATTLEFIELD" || q.includes("battlefield") || q.includes("conquest")) {
      return [
        {
          id: "Conquest_Leader_TankAce",
          name: "Sgt. Viktor 'Panzer' Hess",
          gamerTag: "TankCommander_64v64",
          archetype: "CONQUEST_LEADER",
          cardTier: "ICON",
          ovrRating: 96,
          division: "Tier 1 Armor Mastery (850 SPM)",
          matchesPlayed: 1600,
          spendLtv: 420.0,
          tiltLevel: 45,
          wtp: 29.99,
          fsmState: "PURCHASED",
          recentLossStreak: 1,
          quote: "The Specialist Elite Weapon & Vehicle bundle gives our squad high-visibility tactical armor. High immersion value.",
        },
        {
          id: "Medic_Squad_Lead",
          name: "Marcus 'Defib' Ross",
          gamerTag: "Breakthrough_Squad_Lead",
          archetype: "CASUAL_SOCIALIZER",
          cardTier: "HERO",
          ovrRating: 91,
          division: "Breakthrough 4-Stack Lead",
          matchesPlayed: 780,
          spendLtv: 110.0,
          tiltLevel: 30,
          wtp: 4.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "Squad 2x XP Boosters for $4.99 help all 4 of our squadmates unlock weapons together during weekend operations.",
        },
        {
          id: "MilSim_Veteran_Recon",
          name: "David 'Overwatch' Chen",
          gamerTag: "MilSim_Sniper_Overwatch",
          archetype: "LORE_SEEKER",
          cardTier: "MANAGER",
          ovrRating: 88,
          division: "Hardcore Tactical Portal",
          matchesPlayed: 540,
          spendLtv: 60.0,
          tiltLevel: 20,
          wtp: 0.0,
          fsmState: "ENGAGED_FREE",
          recentLossStreak: 0,
          quote: "As long as weapons stay balanced and grounded in authentic military tactics, I support the seasonal content.",
        },
        {
          id: "Casual_AllOutWar",
          name: "Tyler B.",
          gamerTag: "Assault_Frontline_XI",
          archetype: "CASUAL_WARRIOR",
          cardTier: "GOLD_RARE",
          ovrRating: 85,
          division: "Casual All-Out Warfare",
          matchesPlayed: 320,
          spendLtv: 20.0,
          tiltLevel: 35,
          wtp: 9.99,
          fsmState: "PURCHASED",
          recentLossStreak: 1,
          quote: "Season Battle Pass has good cosmetics and vehicle skins for $9.99.",
        },
      ];
    }

    // 6. DEFAULT / EA SPORTS FC 26 PERSONAS FALLBACK
    else {
      return [
        {
          id: "Marcus_ChampsSweat_94",
          name: "Marcus T.",
          gamerTag: "Marcus_ChampsSweat_94",
          archetype: "COMPETITIVE_GRINDER",
          cardTier: "GOLD_RARE",
          ovrRating: 94,
          division: "Elite Division (Rank 1)",
          matchesPlayed: 890,
          spendLtv: 480.0,
          tiltLevel: 88,
          wtp: 4.99,
          fsmState: "PURCHASED",
          recentLossStreak: 3,
          quote: "After losing in 120th minute extra-time, $4.99 for 500 FC Points to open a quick booster pack gets me right back into the next match.",
        },
        {
          id: "Alexander_IconWhale_99",
          name: "Alexander V.",
          gamerTag: "Alexander_IconWhale_99",
          archetype: "ULTIMATE_TEAM_WHALE",
          cardTier: "ICON",
          ovrRating: 98,
          division: "Division 1 (Icon Collector)",
          matchesPlayed: 1650,
          spendLtv: 11200.0,
          tiltLevel: 12,
          wtp: 49.99,
          fsmState: "PURCHASED",
          recentLossStreak: 0,
          quote: "Guaranteed 88+ Campaign Icon selection with 4,800 FC Points? That's an immediate reload for my First Owner prime squad.",
        },
        {
          id: "Liam_ClubCaptain_10",
          name: "Liam T.",
          gamerTag: "Liam_ClubCaptain_10",
          archetype: "CASUAL_SOCIALIZER",
          cardTier: "HERO",
          ovrRating: 91,
          division: "Pro Clubs Div 1 Captain",
          matchesPlayed: 450,
          spendLtv: 140.0,
          tiltLevel: 28,
          wtp: 7.99,
          fsmState: "PURCHASED",
          recentLossStreak: 1,
          quote: "Our whole 4-player Rush squad logs in Friday night. The Squad Double XP Pass was bought by all 4 of us immediately.",
        },
        {
          id: "WeekendWarrior_UK",
          name: "Harry M.",
          gamerTag: "WeekendWarrior_UK",
          archetype: "COMPETITIVE_GRINDER",
          cardTier: "GOLD_RARE",
          ovrRating: 91,
          division: "FUT Champions (London)",
          matchesPlayed: 560,
          spendLtv: 520.0,
          tiltLevel: 76,
          wtp: 9.99,
          fsmState: "PURCHASED",
          recentLossStreak: 2,
          quote: "1,050 FC Points for $9.99 is an easy buy before jumping into Friday night Weekend League qualifiers.",
        },
      ];
    }
  }, [cohortContext, targetNode, selectedGame, graphData, result]);



  useEffect(() => {
    const activeFranchise =
      selectedGame === "ALL"
        ? (cohortContext?.franchise && cohortContext.franchise !== "ALL" ? cohortContext.franchise : "EA Live Service")
        : selectedGame === "FC26"
        ? "EA SPORTS FC 26"
        : selectedGame === "APEX"
        ? "Apex Legends"
        : selectedGame === "MADDEN25"
        ? "Madden NFL 25"
        : selectedGame === "BATTLEFIELD"
        ? "Battlefield 2042"
        : "The Sims 4";
    setFranchise(activeFranchise);

    if (cohortContext?.query) {
      setCreativeTitle(`${cohortContext.query} — Real-Time Intervention`);
    } else if (targetNode) {
      setCreativeTitle(`${targetNode.name} • ${targetNode.archetype || "Player"} Direct Contextual Offer`);
    } else if (selectedGame === "APEX") {
      setCreativeTitle("Apex Legends Battle Pass Ultimate+ & 1,000 Coins Starter ($4.99 - $19.99)");
      setProposedSpend(180000);
    } else if (selectedGame === "MADDEN25") {
      setCreativeTitle("Madden NFL 25 MUT Field Pass & 500 Points Starter ($4.99 - $9.99)");
      setProposedSpend(150000);
    } else if (selectedGame === "SIMS4") {
      setCreativeTitle("The Sims 4: Lovestruck & Riviera Creator Kits ($4.99 - $39.99)");
      setProposedSpend(140000);
    } else if (selectedGame === "BATTLEFIELD") {
      setCreativeTitle("Battlefield 2042 Elite Edition Upgrade & 500 BFC Starter ($4.99 - $39.99)");
      setProposedSpend(110000);
    } else {
      setCreativeTitle("EA SPORTS FC 26 Ultimate Edition & 500 FC Points Starter ($4.99 - $99.99)");
      setProposedSpend(120000);
    }
  }, [selectedGame, cohortContext, targetNode]);

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/synthetic/deepsona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: `camp-ea-${Date.now()}`,
          franchise,
          creative_title: creativeTitle,
          proposed_spend: proposedSpend,
          target_roas: targetRoas,
          cohort_context: {
            ...cohortContext,
            franchise: selectedGame,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
    }
  }, [initialResult]);

  useEffect(() => {
    if (initialCreativeTitle) {
      setCreativeTitle(initialCreativeTitle);
    }
  }, [initialCreativeTitle]);

  useEffect(() => {
    if (initialFranchise) {
      setFranchise(initialFranchise);
    }
  }, [initialFranchise]);

  useEffect(() => {
    if (isOpen && !initialResult && !result) {
      runSimulation();
    }
  }, [isOpen, initialResult, cohortContext, selectedGame]);

  const handleAskPersonas = async (customPrompt?: string) => {
    const p = customPrompt || debatePrompt;
    if (!p.trim()) return;
    setDebatePrompt("");
    setIsDebating(true);

    try {
      const res = await fetch("/api/synthetic/deepsona/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: p,
          campaign_title: creativeTitle,
          franchise,
          cohort_context: cohortContext,
          sampled_players: groundedPersonas,
          price: 4.99,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const turns = data.debate_turns || [];

        const newItems = turns.map((t: any, idx: number) => ({
          id: `feed-turn-${Date.now()}-${idx}`,
          sender: t.persona_id,
          role: t.name || t.persona_id,
          text: t.message,
          wtp: t.wtp,
          fsm: t.fsm_state,
        }));

        setDebateMessages((prev) => [...prev, ...newItems]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDebating(false);
    }
  };

  if (!isOpen) return null;

  const currentAudienceSize =
    cohortContext?.estimatedTotal ||
    (graphData?.nodes ? graphData.nodes.filter((n) => n.type === "PLAYER").length * 12 : 245000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-6 animate-fade-in font-sans">
      <div className="w-full max-w-5xl bg-[#0E1015]/95 border border-white/10 rounded-3xl p-6 space-y-4 max-h-[92vh] flex flex-col justify-between shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                AI Focus Group • Player Testing
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-400">{franchise}</span>
            </div>
            <h2 className="text-base font-semibold text-white mt-1 tracking-tight">
              {creativeTitle}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Testing with <strong>{currentAudienceSize.toLocaleString()}</strong> players in {selectedGame === "ALL" ? "cross-franchise" : selectedGame} segment
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Scorecard Metrics Row */}
        {result && (
          <LiftScoreGauge
            conversionLift={result.predicted_conversion_lift}
            churnMitigation={result.churn_mitigation_lift}
            revenueImpact={result.projected_revenue_impact_usd}
            sentimentDecay={result.sentiment_decay_index}
          />
        )}

        {/* 2. Simplified Tab Navigation */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab("personas")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "personas"
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>1. Player Profiles</span>
            </button>

            <button
              onClick={() => setActiveTab("community_debate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "community_debate"
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>2. Community Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("conversion_scoring")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "conversion_scoring"
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>3. Purchase Likelihood</span>
            </button>

            <button
              onClick={() => setActiveTab("sensitivity")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "sensitivity"
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>4. Price & Triggers</span>
            </button>
          </div>
        </div>

        {/* 3. Tab Content View Area */}
        <div className="min-h-[350px]">
          {/* TAB 1: Grounded Personas + Live Persona Debate Feed */}
          {activeTab === "personas" && (
            <div className="grid grid-cols-12 gap-4">
              {/* Left: 4 Persona Cards (7 Columns) */}
              <div className="col-span-7 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                    Simulated Players ({groundedPersonas.length} Archetypes)
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Sampled from Active Audience
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {groundedPersonas.map((persona) => (
                    <FUTPersonaCard
                      key={persona.id}
                      persona={persona}
                      isSelected={selectedPersona?.id === persona.id}
                      onSelect={() => setSelectedPersona(persona)}
                    />
                  ))}
                </div>
              </div>

              {/* Right: Live Multi-Agent AI Debate Stream (5 Columns) */}
              <div className="col-span-5 flex flex-col justify-between bg-black/40 p-3.5 rounded-2xl border border-white/5 h-[340px]">
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        Live Chat with Players
                      </span>
                      {debateMessages.length > 0 && (
                        <button
                          onClick={() => setDebateMessages([])}
                          className="text-[9px] text-zinc-400 hover:text-white font-mono px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">Simulated Reactions</span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px] pr-1">
                    {debateMessages.length === 0 ? (
                      /* Clean Pristine Empty State */
                      <div className="h-full flex flex-col items-center justify-center text-center p-3 space-y-2 text-zinc-400">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-400">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white block">Chat is Clear</span>
                          <p className="text-[10px] text-zinc-500 max-w-[210px] leading-tight">
                            Ask players a question to trigger live Vertex AI reactions from all 4 archetypes.
                          </p>
                        </div>
                        {/* Quick Starter Chips */}
                        <div className="flex flex-col gap-1 w-full pt-1">
                          {[
                            "Would you buy this for $4.99?",
                            "How does defeat tilt affect your spend?",
                            "Is $49.99 fair for guaranteed walkouts?",
                          ].map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                handleAskPersonas(chip);
                              }}
                              disabled={isDebating}
                              className="w-full text-left text-[10px] text-zinc-300 hover:text-white px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/10 border border-white/5 truncate transition-all"
                            >
                              💬 {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      debateMessages.map((msg) => (
                        <div key={msg.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-[11px]">{msg.sender}</span>
                            <span className="text-amber-300 text-[10px] font-mono">${msg.wtp.toFixed(2)}</span>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed">&ldquo;{msg.text}&rdquo;</p>
                        </div>
                      ))
                    )}

                    {isDebating && (
                      <div className="text-[11px] text-cyan-400 italic py-1 flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Players are typing their reactions...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    value={debatePrompt}
                    onChange={(e) => setDebatePrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAskPersonas()}
                    placeholder="Ask players (e.g. 'Would you buy this for $4.99?')..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    onClick={() => handleAskPersonas()}
                    disabled={isDebating || !debatePrompt.trim()}
                    className="px-3 py-1.5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    Ask
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Community Debate Simulator (Reddit & Discord) */}
          {activeTab === "community_debate" && (
            <CommunityDebateSimulator
              franchise={franchise}
              selectedGame={selectedGame}
              creativeTitle={creativeTitle}
              cohortContext={cohortContext}
            />
          )}

          {/* TAB 3: Conversion Scoring Matrix (Casual vs Hardcore) */}
          {activeTab === "conversion_scoring" && (
            <ConversionScoringMatrix
              franchise={franchise}
              selectedGame={selectedGame}
              creativeTitle={creativeTitle}
              cohortContext={cohortContext}
            />
          )}

          {/* TAB 4: Sensitivity & Situational Rules */}
          {activeTab === "sensitivity" && (
            <SensitivitySimulator
              cohortContext={cohortContext}
              baseSpend={proposedSpend}
              baseRoas={targetRoas}
            />
          )}
        </div>

        {/* 4. Footer: Clear Summary & Step 4 CTA */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3.5">
          <div className="flex items-center gap-2 max-w-[65%]">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-300 line-clamp-1">
              Focus Group Summary: <strong>+{result?.predicted_conversion_lift || 28.5}% sales boost estimated</strong> across {selectedGame === "ALL" ? "all titles" : selectedGame}.
            </span>
          </div>

          <button
            onClick={() => result && onGenerateBrief(result)}
            disabled={isGeneratingBrief || !result}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg active:scale-95 ${
              isGeneratingBrief
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-wait shadow-neon-green"
                : "bg-white hover:bg-gray-200 text-black"
            }`}
          >
            {isGeneratingBrief ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Creating Campaign Plan...</span>
              </>
            ) : (
              <>
                <span>Approve & Export Campaign Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
