"use client";

import React from "react";
import { ContextualViewType, GameFranchise } from "@/lib/types";

interface GraphControlsProps {
  currentView: ContextualViewType;
  onViewChange: (view: ContextualViewType) => void;
  selectedGame: GameFranchise;
  onGameChange: (game: GameFranchise) => void;
  archetypeFilter: string;
  onArchetypeChange: (archetype: string) => void;
  is3D: boolean;
  onToggle3D: () => void;
  nodeCount: number;
  edgeCount: number;
}

const GAME_OPTIONS: { id: GameFranchise; label: string; icon: string }[] = [
  { id: "ALL", label: "All 2K Franchises", icon: "🌐" },
  { id: "NBA2K26", label: "NBA 2K26", icon: "🏀" },
  { id: "BORDERLANDS4", label: "Borderlands 4", icon: "💥" },
  { id: "CIV7", label: "Civilization VII", icon: "🏛️" },
  { id: "WWE2K25", label: "WWE 2K25", icon: "🤼" },
  { id: "PGATOUR2K", label: "PGA TOUR 2K25", icon: "⛳" },
];

const COHORT_FILTERS_BY_GAME: Record<GameFranchise, { value: string; label: string }[]> = {
  ALL: [
    { value: "ALL", label: "All 2K Players (Macro Galaxy)" },
    { value: "MYTEAM_WHALE", label: "Cross-Title Whales ($3,500+ spend)" },
    { value: "MYCAREER_HOOPER", label: "Competitive Sweat Grinders" },
    { value: "CASUAL_SOCIALIZER", label: "Social Squad Warriors" },
    { value: "4X_GRAND_STRATEGIST", label: "Strategy & Franchise Purists" },
  ],
  NBA2K26: [
    { value: "ALL", label: "All NBA 2K26 Cohorts" },
    { value: "MYCAREER_HOOPER", label: "The City Streetballers (99 OVR)" },
    { value: "MYTEAM_WHALE", label: "MyTEAM Dark Matter Whales" },
    { value: "PROPASS_GRINDER", label: "ProPASS Season Grinders" },
    { value: "CASUAL_SOCIALIZER", label: "The REC & Pro-Am Squads" },
  ],
  BORDERLANDS4: [
    { value: "ALL", label: "All Borderlands 4 Cohorts" },
    { value: "VAULT_HUNTER_SQUAD", label: "Mayhem 10 Vault Hunters" },
    { value: "CASUAL_SOCIALIZER", label: "4-Player Co-Op Squads" },
    { value: "LORE_SEEKER", label: "Legendary Weapon Collectors" },
  ],
  CIV7: [
    { value: "ALL", label: "All Civilization VII Cohorts" },
    { value: "4X_GRAND_STRATEGIST", label: "Diety Grand Strategists" },
    { value: "LORE_SEEKER", label: "Historical Age Purists" },
    { value: "CASUAL_SOCIALIZER", label: "Turn-Based Multiplayer Guilds" },
  ],
  WWE2K25: [
    { value: "ALL", label: "All WWE 2K25 Cohorts" },
    { value: "WWE_UNIVERSE_CREATOR", label: "Universe Mode Architects" },
    { value: "MYTEAM_WHALE", label: "MyFACTION Card Whales" },
  ],
  PGATOUR2K: [
    { value: "ALL", label: "All PGA TOUR 2K25 Cohorts" },
    { value: "CLUBHOUSE_GOLFER", label: "Clubhouse Pass Champions" },
    { value: "BUILDER_CREATOR", label: "Course Designers" },
  ],
  // Legacy mappings for backwards compatibility
  FC26: [
    { value: "ALL", label: "All FC 26 Cohorts" },
    { value: "COMPETITIVE_GRINDER", label: "FUT Champions Grinders" },
  ],
  APEX: [
    { value: "ALL", label: "All Apex Legends Cohorts" },
    { value: "RANKED_SWEAT", label: "Ranked Predator Sweats" },
  ],
  MADDEN25: [
    { value: "ALL", label: "All Madden NFL Cohorts" },
    { value: "COMPETITIVE_GRINDER", label: "MUT Champions & WL Sweats" },
  ],
  BATTLEFIELD: [
    { value: "ALL", label: "All Battlefield Cohorts" },
    { value: "CONQUEST_LEADER", label: "Conquest Squad Leaders" },
  ],
  SIMS4: [
    { value: "ALL", label: "All The Sims 4 Cohorts" },
    { value: "SIMS_COLLECTOR", label: "DLC Pack Whales" },
  ],
};


export default function GraphControls({
  currentView,
  onViewChange,
  selectedGame,
  onGameChange,
  archetypeFilter,
  onArchetypeChange,
  is3D,
  onToggle3D,
  nodeCount,
  edgeCount,
}: GraphControlsProps) {
  const views: { id: ContextualViewType; label: string }[] = [
    { id: "audience-cohorts", label: "Cohorts Graph" },
    { id: "marketing-journey", label: "Marketing Journeys (Sankey)" },
    { id: "geo-map", label: "Geographic DMA Map" },
  ];

  const currentFilters = COHORT_FILTERS_BY_GAME[selectedGame] || COHORT_FILTERS_BY_GAME.ALL;

  return (
    <div className="flex flex-wrap items-center gap-2.5 font-sans">
      {/* 1. Apple-Style Segmented Control: 2-Way View Switcher */}
      <div className="flex items-center bg-black/50 backdrop-blur-2xl p-1 rounded-xl border border-white/10 shadow-lg">
        {views.map((v) => {
          const isActive = currentView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-white/20 text-white shadow-sm font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {/* 2. Sleek Game Franchise Selector */}
      <div className="flex items-center bg-black/50 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-white/10 text-xs">
        <span className="text-gray-500 mr-2 text-[11px]">Title:</span>
        <select
          value={selectedGame}
          onChange={(e) => {
            onGameChange(e.target.value as GameFranchise);
            onArchetypeChange("ALL");
          }}
          className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
        >
          {GAME_OPTIONS.map((g) => (
            <option key={g.id} value={g.id} className="bg-[#121212] text-white">
              {g.icon} {g.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Dynamic Cohort Filters Dropdown (Adapts to Selected Title) */}
      {currentView === "audience-cohorts" && (
        <div className="flex items-center bg-black/50 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-white/10 text-xs">
          <span className="text-gray-500 mr-2 text-[11px]">Cohort:</span>
          <select
            value={archetypeFilter}
            onChange={(e) => onArchetypeChange(e.target.value)}
            className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
          >
            {currentFilters.map((f) => (
              <option key={f.value} value={f.value} className="bg-[#121212] text-white">
                {f.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 4. 2D / 3D Switcher */}
      {currentView === "audience-cohorts" && (
        <button
          onClick={onToggle3D}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-2xl border transition-all ${
            is3D
              ? "bg-white text-black border-white font-semibold"
              : "bg-black/50 text-gray-400 border-white/10 hover:text-white"
          }`}
        >
          {is3D ? "3D" : "2D"}
        </button>
      )}

      {/* 5. Clean Telemetry Counter */}
      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-white/10 text-[11px] text-gray-400 font-mono">
        {currentView === "geo-map" ? (
          <span>12 Global DMAs Connected</span>
        ) : (
          <>
            <span>{nodeCount} Nodes</span>
            <span className="text-gray-600">•</span>
            <span>{edgeCount} Edges</span>
          </>
        )}
      </div>
    </div>
  );
}
