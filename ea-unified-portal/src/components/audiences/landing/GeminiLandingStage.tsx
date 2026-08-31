"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Globe,
  Radio,
  Database,
  Search,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Activity,
  Crosshair,
  Flame,
  Layers,
  Shield,
  Loader2,
  Users,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";
import { GameFranchise } from "@/lib/types";
import SpannerDataSourceToggle, { SpannerDataSource } from "@/components/audiences/common/SpannerDataSourceToggle";


interface GeminiLandingStageProps {
  onSearchQuery: (query: string, game: GameFranchise) => void;
  onExploreFullGraph: (game: GameFranchise) => void;
  onOpenA2A: () => void;
  onOpenGeoMap: () => void;
  onOpenMarketingJourney?: () => void;
  isLoading?: boolean;
  dataSource?: SpannerDataSource;
  onDataSourceChange?: (source: SpannerDataSource) => void;
}

const FRANCHISES: { id: GameFranchise; label: string; dotColor: string }[] = [
  { id: "ALL", label: "All 2K Titles", dotColor: "#E51B24" },
  { id: "NBA2K26", label: "NBA 2K26", dotColor: "#FF2E38" },
  { id: "BORDERLANDS4", label: "Borderlands 4", dotColor: "#FFD200" },
  { id: "CIV7", label: "Civilization VII", dotColor: "#38BDF8" },
  { id: "WWE2K25", label: "WWE 2K25", dotColor: "#F59E0B" },
  { id: "PGATOUR2K", label: "PGA TOUR 2K25", dotColor: "#10B981" },
];

const AURA_THEMES: Record<GameFranchise, { primary: string; secondary: string; pulse: string }> = {
  ALL: {
    primary: "rgba(229, 27, 36, 0.16)",     // 2K Red
    secondary: "rgba(255, 46, 56, 0.14)",   // Crimson
    pulse: "rgba(255, 210, 0, 0.10)",       // Gold
  },
  NBA2K26: {
    primary: "rgba(255, 46, 56, 0.18)",     // 2K Crimson
    secondary: "rgba(255, 165, 0, 0.14)",   // Court Gold
    pulse: "rgba(229, 27, 36, 0.12)",       // Red accent
  },
  BORDERLANDS4: {
    primary: "rgba(255, 210, 0, 0.18)",     // Cel-shade Yellow
    secondary: "rgba(255, 69, 0, 0.14)",    // Mayhem Orange
    pulse: "rgba(168, 85, 247, 0.10)",      // Eridium Purple
  },
  CIV7: {
    primary: "rgba(56, 189, 248, 0.18)",    // Discovery Cyan
    secondary: "rgba(212, 175, 55, 0.14)",  // Imperial Gold
    pulse: "rgba(16, 185, 129, 0.10)",      // Earth Green
  },
  WWE2K25: {
    primary: "rgba(245, 158, 11, 0.18)",    // Championship Gold
    secondary: "rgba(229, 27, 36, 0.14)",   // Ring Red
    pulse: "rgba(255, 46, 56, 0.10)",       // Crimson
  },
  PGATOUR2K: {
    primary: "rgba(16, 185, 129, 0.18)",    // Fairway Green
    secondary: "rgba(6, 95, 70, 0.14)",     // Deep Forest
    pulse: "rgba(56, 189, 248, 0.10)",      // Water Blue
  },
  // Legacy aliases for backward compatibility
  FC26: {
    primary: "rgba(255, 46, 56, 0.18)",
    secondary: "rgba(255, 165, 0, 0.14)",
    pulse: "rgba(229, 27, 36, 0.12)",
  },
  APEX: {
    primary: "rgba(255, 210, 0, 0.18)",
    secondary: "rgba(255, 69, 0, 0.14)",
    pulse: "rgba(168, 85, 247, 0.10)",
  },
  MADDEN25: {
    primary: "rgba(245, 158, 11, 0.18)",
    secondary: "rgba(229, 27, 36, 0.14)",
    pulse: "rgba(255, 46, 56, 0.10)",
  },
  BATTLEFIELD: {
    primary: "rgba(255, 210, 0, 0.18)",
    secondary: "rgba(255, 69, 0, 0.14)",
    pulse: "rgba(168, 85, 247, 0.10)",
  },
  SIMS4: {
    primary: "rgba(56, 189, 248, 0.18)",
    secondary: "rgba(212, 175, 55, 0.14)",
    pulse: "rgba(16, 185, 129, 0.10)",
  },
};


interface MasterFunctionPillar {
  id: "audiences" | "creative" | "measurement" | "advertising" | "insights";
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgAccent: string;
  coreFinding: {
    title: string;
    metricPill: string;
    pillColor: string;
    base: string;
    summary: string;
    caveats: string[];
    actionLabel: string;
    queryToRun: string;
    franchise: GameFranchise;
  };
  prompts: {
    title: string;
    query: string;
    franchise: GameFranchise;
    tag: string;
    highlight: string;
  }[];
}

const MASTER_PILLARS: MasterFunctionPillar[] = [
  {
    id: "audiences",
    label: "01. Audiences & Graph",
    shortLabel: "Audiences",
    badge: "Spanner Property Graph",
    description: "Query 5,000+ players & cross-franchise identities via Spanner GQL",
    icon: Users,
    iconColor: "text-cyan-400",
    bgAccent: "bg-cyan-500/10",
    coreFinding: {
      title: "High-Frustration Drop-Off in Competitive Queues",
      metricPill: "78.4% Churn Risk",
      pillColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      base: "5,000 Master Players • Spanner Property Graph (Live)",
      summary: "Players on 3+ consecutive Weekend League losses exhibit an 8.2x surge in 14-day churn risk. 68% of drop-offs happen within 120 minutes of defeat without an in-game recovery bridge.",
      caveats: [
        "Telemetry window: 90-day real-time Spanner property graph session streams (FC 26 FUT Champs & Apex Ranked).",
        "Lapse velocity: Churn probability doubles after match defeat #3 compared to match defeat #2.",
        "Monetization elasticity: Willingness-to-pay for $4.99 recovery shields peaks within 15 minutes of session end.",
      ],
      actionLabel: "Load High-Tilt Cohort in Spanner Graph",
      queryToRun: "FUT Champions players with 3+ loss streaks & high tilt in London Metro",
      franchise: "FC26",
    },
    prompts: [
      {
        title: "FUT Champs High-Tilt in London",
        query: "FUT Champions players with 3+ loss streaks & high tilt in London Metro",
        franchise: "FC26",
        tag: "FC 26",
        highlight: "3+ Losses",
      },
      {
        title: "NickRTFM & Castro Audiences",
        query: "FUT Champions players following NickRTFM and Castro1021 with spend over $1,000",
        franchise: "FC26",
        tag: "FC Creators",
        highlight: "Nick & Castro",
      },
      {
        title: "Active Clubs Rush 5v5 Squads",
        query: "Social Squad Warriors active in Clubs Rush 5v5 and Apex Trios",
        franchise: "FC26",
        tag: "FC 26",
        highlight: "Social Squads",
      },
    ],
  },
  {
    id: "creative",
    label: "02. Creative Insights",
    shortLabel: "Creative",
    badge: "Google Veo & Imagen 3",
    description: "Generate personalized 4K posters and 5-second cinematic Veo videos",
    icon: Sparkles,
    iconColor: "text-amber-400",
    bgAccent: "bg-amber-500/10",
    coreFinding: {
      title: "Personalized Club Kits Drive Video Engagement",
      metricPill: "+41.2% CTR Lift",
      pillColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      base: "Google Veo & Imagen 3 Multi-Modal Pipeline",
      summary: "Personalized 5-second Google Veo stadium recovery videos featuring the player's favorite club kit and gamer tag drove a +41.2% CTR over generic static store banners.",
      caveats: [
        "Asset Generation: Vertex AI Gemini 3.7 Pro selects gamer tag + favorite club from Spanner telemetry.",
        "Render Latency: Google Veo video generation completes in sub-8 seconds for companion app delivery.",
        "Fatigue Rate: Personalized dynamic video creative retains effectiveness 3.2x longer than static assets.",
      ],
      actionLabel: "Inspect AI Video Hooks for FC 26",
      queryToRun: "Extract 5 high-tilt FC 26 players for personalized Veo stadium video generation",
      franchise: "FC26",
    },
    prompts: [
      {
        title: "Personalized Veo Stadium Video",
        query: "Extract 5 high-tilt FC 26 players for personalized Veo stadium video generation",
        franchise: "FC26",
        tag: "Google Veo",
        highlight: "5s Video Hook",
      },
      {
        title: "4K Imagen Match Posters",
        query: "Generate 4K Imagen match posters with player gamer tags in Bayern Munich kit",
        franchise: "FC26",
        tag: "Imagen 3",
        highlight: "4K Render",
      },
      {
        title: "Dynamic Ad Variant Testing",
        query: "Generate personalized recovery copy hooks for tilted Division 1 competitors",
        franchise: "FC26",
        tag: "Creative Studio",
        highlight: "Copy Generator",
      },
    ],
  },
  {
    id: "measurement",
    label: "03. Measurement & Lift",
    shortLabel: "Measurement",
    badge: "DeepSona 6-Agent Simulator",
    description: "Pre-test campaigns against simulated player personas before spend",
    icon: TrendingUp,
    iconColor: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    coreFinding: {
      title: "Post-Match Defeat Shields Prevent Churn",
      metricPill: "+28.5% Net Revenue Lift",
      pillColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      base: "DeepSona 6-Agent Multi-Agent Simulation Engine",
      summary: "Multi-agent debate across 1,000 synthetic player personas predicts a +28.5% conversion lift and 34.2% churn reduction when offering a $4.99 recovery pack immediately post-defeat.",
      caveats: [
        "Simulation Fidelity: Grounded in real Spanner historical purchase behaviors and loss sensitivity.",
        "Price Elasticity: Conversion rate drops 48% when price is increased from $4.99 to $9.99.",
        "Cohort Consensus: 84% synthetic agent consensus achieved across Grinder, Whale, and Social personas.",
      ],
      actionLabel: "Launch DeepSona Focus Group Simulation",
      queryToRun: "Simulate +28.5% sales lift for $4.99 post-match starter pack in DeepSona",
      franchise: "FC26",
    },
    prompts: [
      {
        title: "Defeat Shield +28.5% Lift",
        query: "Simulate +28.5% sales lift for $4.99 post-match starter pack in DeepSona",
        franchise: "FC26",
        tag: "DeepSona",
        highlight: "+28.5% Lift",
      },
      {
        title: "14-Day Retention Recovery",
        query: "Simulate 14-day retention recovery when loss-mitigation shields are active",
        franchise: "ALL",
        tag: "Attribution",
        highlight: "+34.2% Ret.",
      },
      {
        title: "Price Elasticity Simulation",
        query: "Simulate purchase conversion rates at $4.99 vs $9.99 price points",
        franchise: "FC26",
        tag: "DeepSona",
        highlight: "WTP Curve",
      },
    ],
  },
  {
    id: "advertising",
    label: "04. EA Advertising",
    shortLabel: "Advertising",
    badge: "Situational Triggers & Media",
    description: "Trigger in-game offers and companion app hero banners in real time",
    icon: Radio,
    iconColor: "text-pink-400",
    bgAccent: "bg-pink-500/10",
    coreFinding: {
      title: "Companion App Inactivity Window Opportunity",
      metricPill: "3.4x Open Surge",
      pillColor: "bg-pink-500/15 text-pink-300 border-pink-500/30",
      base: "LiveOps Situational Event Bus & Telemetry",
      summary: "Social squad players check the EA Companion App within 15 minutes of session completion on Friday evenings. Dynamic hero banners delivered here capture 3.4x higher conversion than in-game popups.",
      caveats: [
        "Trigger Pipeline: Sub-50ms JSON-RPC event notification from game client to Companion App ad server.",
        "Social Multiplier: Squad captains who purchase starter packs trigger 2.1x follow-on purchases within their squad.",
        "Ad Fatigue Guard: Strict 1-offer per 72-hour cap prevents user perception of aggressive monetization.",
      ],
      actionLabel: "Deploy Companion App Hero Banner Trigger",
      queryToRun: "Deploy targeted companion app hero banner for Friday night Rush socializers",
      franchise: "FC26",
    },
    prompts: [
      {
        title: "Companion App Hero Banner",
        query: "Deploy targeted companion app hero banner for Friday night Rush socializers",
        franchise: "FC26",
        tag: "In-Game Ad",
        highlight: "Rush 5v5",
      },
      {
        title: "Extra-Time Defeat Trigger",
        query: "Schedule dynamic in-game offer triggers upon extra-time match losses",
        franchise: "FC26",
        tag: "LiveOps",
        highlight: "Auto-Trigger",
      },
      {
        title: "Weekend League Ad Optimization",
        query: "Optimize programmatic ad bids and sponsored rewards for Weekend League",
        franchise: "FC26",
        tag: "Ad Server",
        highlight: "Bidding",
      },
    ],
  },
  {
    id: "insights",
    label: "05. Player Insights",
    shortLabel: "Insights",
    badge: "Cross-Game Telemetry",
    description: "Diagnose churn drop-offs, platform migration, and rage-quit trends",
    icon: Crosshair,
    iconColor: "text-purple-400",
    bgAccent: "bg-purple-500/10",
    coreFinding: {
      title: "Multi-Title Whale Liquidity Spillover",
      metricPill: "$3,850 Avg LTV",
      pillColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      base: "Cross-Franchise Identity Graph (5 Core Titles)",
      summary: "12.4% of top-tier FUT Champions spenders actively migrate to Apex Legends during seasonal content lulls, spending an additional $1,200+ on Heirloom events when cross-promoted.",
      caveats: [
        "Identity Resolution: 15,663 linked gamer tags unified via EA Account ID graph edges.",
        "Migration Timing: Apex playtime surges 65% during FC 26 Team of the Season (TOTS) transition gaps.",
        "Cross-Reward Strategy: Cross-game cosmetic loyalty rewards boost retention across both franchises by 22%.",
      ],
      actionLabel: "Explore Cross-Franchise Whale Graph",
      queryToRun: "Cross-title Whales with spend over $3,500 across FC and Apex",
      franchise: "ALL",
    },
    prompts: [
      {
        title: "Apex Demotion Rage-Quits",
        query: "Apex Ranked Predators with 3+ RP demotion losses and high churn risk",
        franchise: "APEX",
        tag: "Apex Legends",
        highlight: "Predators",
      },
      {
        title: "Sims 4 DLC Whales (10+ Packs)",
        query: "DLC Whales with 10+ Expansion Packs owned across PC and Console",
        franchise: "SIMS4",
        tag: "The Sims 4",
        highlight: "10+ Packs",
      },
      {
        title: "Madden MUT Churn Intervention",
        query: "MUT Champions players with 3+ loss streaks and high spend",
        franchise: "MADDEN25",
        tag: "Madden NFL",
        highlight: "MUT Champs",
      },
    ],
  },
];

export default function GeminiLandingStage({
  onSearchQuery,
  onExploreFullGraph,
  onOpenA2A,
  onOpenGeoMap,
  onOpenMarketingJourney,
  isLoading = false,
  dataSource = "live_spanner",
  onDataSourceChange,
}: GeminiLandingStageProps) {
  const [query, setQuery] = useState("");
  const [selectedFranchise, setSelectedFranchise] = useState<GameFranchise>("ALL");
  const [activePillarId, setActivePillarId] = useState<"audiences" | "creative" | "measurement" | "advertising" | "insights">("audiences");
  const [activeLoadingQuery, setActiveLoadingQuery] = useState<string | null>(null);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState<boolean>(false);

  const activeAura = AURA_THEMES[selectedFranchise] || AURA_THEMES.ALL;
  const currentPillar = MASTER_PILLARS.find((p) => p.id === activePillarId) || MASTER_PILLARS[0];

  const handleRunSearch = (customQ?: string, customFranchise?: GameFranchise) => {
    if (isLoading) return;
    const q = customQ !== undefined ? customQ : query;
    const f = customFranchise || selectedFranchise;
    if (!q.trim()) {
      onExploreFullGraph(f);
      return;
    }
    setActiveLoadingQuery(q);
    onSearchQuery(q, f);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090D] text-white font-sans flex flex-col justify-between antialiased select-none">
      {/* 🌟 1. Subtle Multi-Layer Floating Aura Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-[10%] left-[20%] w-[580px] h-[580px] rounded-full blur-[140px] animate-aura-1 transition-colors duration-1000"
          style={{ backgroundColor: activeAura.primary }}
        />
        <div
          className="absolute top-[15%] right-[18%] w-[640px] h-[540px] rounded-full blur-[150px] animate-aura-2 transition-colors duration-1000"
          style={{ backgroundColor: activeAura.secondary }}
        />
        <div
          className="absolute top-[35%] left-[35%] w-[480px] h-[480px] rounded-full blur-[160px] animate-aura-pulse transition-colors duration-1000"
          style={{ backgroundColor: activeAura.pulse }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#07090D_85%)] opacity-80" />
      </div>

      {/* 2. Top Minimalist Translucent Header */}
      <header className="relative z-20 flex items-center justify-between px-8 py-3.5 bg-black/30 backdrop-blur-2xl border-b border-white/5 animate-spring-in">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <img
              src="/ea_logo.webp"
              alt="Electronic Arts"
              className="h-5 sm:h-6 w-auto object-contain brightness-110"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-normal">/</span>
            <span className="text-xs text-gray-300 font-medium tracking-tight">Gemini Enterprise Master Control Panel</span>
          </div>
        </div>

        {/* Right Navigation & Engine Toggle */}
        <div className="flex items-center gap-2.5">
          {onDataSourceChange && (
            <SpannerDataSourceToggle
              dataSource={dataSource}
              onToggle={onDataSourceChange}
            />
          )}

          {onOpenMarketingJourney && (
            <button
              onClick={onOpenMarketingJourney}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Player Journeys (Sankey)</span>
            </button>
          )}

          <button
            onClick={onOpenGeoMap}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>DMA Map</span>
          </button>

          <button
            onClick={onOpenA2A}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
          >
            <Radio className="w-3.5 h-3.5 text-pink-400" />
            <span>A2A Protocol</span>
          </button>

          <button
            onClick={() => onExploreFullGraph("ALL")}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-black" />
            <span>Launch Galaxy</span>
          </button>
        </div>
      </header>

      {/* 3. Center Stage (Spacious, Minimalist, Apple-Grade Master Control Panel) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-4xl w-full mx-auto space-y-3.5 my-auto animate-spring-in">
        {/* Hero Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
            EA Engagement &amp; Marketing Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Unified multi-agent intelligence across 500M+ players, Spanner Property Graph, and Google Cloud AI.
          </p>
        </div>

        {/* Universal Search Island */}
        <div className="w-full bg-[#111318]/90 backdrop-blur-3xl border border-white/10 hover:border-white/20 focus-within:border-white/30 rounded-3xl p-3 shadow-2xl transition-all space-y-2.5">
          <div className="relative">
            <textarea
              rows={2}
              value={query}
              disabled={isLoading}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRunSearch();
                }
              }}
              placeholder="Ask anything across EA's ecosystem (e.g. 'Whales with spend over $3,500 across FC and Apex' or 'FUT Champions players with high tilt')..."
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none px-3 pt-1 resize-none font-normal leading-relaxed disabled:opacity-60"
            />
          </div>

          {/* Controls Bottom Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 px-1">
            {/* Franchise Micro-Segmented Control */}
            <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/10">
              {FRANCHISES.map((f) => {
                const isSelected = selectedFranchise === f.id;
                return (
                  <button
                    key={f.id}
                    disabled={isLoading}
                    onClick={() => setSelectedFranchise(f.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                      isSelected
                        ? "bg-white/20 text-white font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full transition-transform"
                      style={{
                        backgroundColor: f.dotColor,
                        transform: isSelected ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dual Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onExploreFullGraph(selectedFranchise)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
                title="Load full property graph without filtering"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Load Graph</span>
              </button>

              <button
                onClick={() => handleRunSearch()}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-lg active:scale-95 ${
                  isLoading
                    ? "bg-white/80 text-black cursor-wait"
                    : "bg-white hover:bg-zinc-200 text-black"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <span>Explore Cohort</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Gemini Enterprise Master Control Panel (Sleek Segmented Pillar Explorer) */}
        <div className="w-full space-y-2.5">
          {/* 5-Pillar Segmented Tabs */}
          <div className="flex items-center justify-between bg-black/40 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
            {MASTER_PILLARS.map((pillar) => {
              const isSelected = activePillarId === pillar.id;
              const IconComponent = pillar.icon;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActivePillarId(pillar.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-white/15 text-white font-semibold shadow-sm border border-white/10"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${isSelected ? pillar.iconColor : "text-zinc-500"}`} />
                  <span className="hidden sm:inline">{pillar.label}</span>
                  <span className="sm:hidden">{pillar.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* 🌟 The Core Finding Executive Callout Card */}
          <div
            onClick={() => setIsBriefModalOpen(true)}
            className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 backdrop-blur-2xl transition-all space-y-1.5 cursor-pointer shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  The Core Finding
                </span>
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                  • {currentPillar.coreFinding.base}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-cyan-400 group-hover:text-cyan-300 font-medium transition-colors">
                <span>View Opportunity Brief</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="text-sm sm:text-[15px] font-semibold text-white tracking-tight flex items-center gap-1.5">
                <span>📣 {currentPillar.coreFinding.title}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentPillar.coreFinding.pillColor}`}>
                {currentPillar.coreFinding.metricPill}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
              {currentPillar.coreFinding.summary}
            </p>
          </div>

          {/* 3 Spacious Prompt Cards in a clean 1x3 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {currentPillar.prompts.map((p, pIdx) => {
              const isThisCardLoading = isLoading && activeLoadingQuery === p.query;
              return (
                <div
                  key={pIdx}
                  onClick={() => {
                    if (isLoading) return;
                    setQuery(p.query);
                    setSelectedFranchise(p.franchise);
                    handleRunSearch(p.query, p.franchise);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 group ${
                    isThisCardLoading
                      ? "bg-white/10 border-cyan-400/50 shadow-sm scale-[1.01]"
                      : "bg-black/30 hover:bg-white/[0.06] border-white/5 hover:border-white/15 active:scale-98"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono">
                      {p.tag}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                      {p.highlight}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-white line-clamp-1 transition-colors">
                      {p.title}
                    </div>
                    <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 line-clamp-1 mt-0.5">
                      {p.query}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-zinc-500 group-hover:text-zinc-300">
                    <span>Click to explore</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 5. Bottom Telemetry Ticker (Subtle, Clean) */}
      <footer className="relative z-20 flex items-center justify-between px-8 py-3 bg-black/20 backdrop-blur-xl border-t border-white/5 text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-3">
          <span>5,000 Master Players</span>
          <span>•</span>
          <span>15,663 Linked Identities</span>
          <span>•</span>
          <span>5 Core Franchises</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span>Google Cloud Spanner Property Graph Engine</span>
        </div>
      </footer>

      {/* 🌟 6. Opportunity Brief Executive Detail Modal (Faithful to Reference Image) */}
      {isBriefModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto"
          onClick={() => setIsBriefModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0E1117] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 animate-spring-in text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${currentPillar.bgAccent} border border-white/10 flex items-center justify-center`}>
                  <currentPillar.icon className={`w-4 h-4 ${currentPillar.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">
                    Opportunity Brief — {currentPillar.label}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    {currentPillar.coreFinding.base}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBriefModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* The Core Finding Box in Modal */}
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
              <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                The Core Finding
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  📣 {currentPillar.coreFinding.title}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${currentPillar.coreFinding.pillColor}`}>
                  {currentPillar.coreFinding.metricPill}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {currentPillar.coreFinding.summary}
              </p>
            </div>

            {/* Read this first — Data Caveats & Grounding */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-300 tracking-tight">
                Read this first — data caveats that shape every number below:
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400">
                {currentPillar.coreFinding.caveats.map((c, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Action Plan & Exploration Buttons */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-400 font-mono">
                Grounded on Google Cloud Spanner Property Graph
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBriefModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsBriefModalOpen(false);
                    handleRunSearch(currentPillar.coreFinding.queryToRun, currentPillar.coreFinding.franchise);
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-semibold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <span>{currentPillar.coreFinding.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
