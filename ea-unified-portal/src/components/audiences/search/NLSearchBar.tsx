"use client";

import React, { useState } from "react";
import { Sparkles, Code, ArrowRight, CheckCircle, Users, Loader2, X, RefreshCw } from "lucide-react";
import { GraphData, GameFranchise } from "@/lib/types";

interface NLSearchBarProps {
  selectedGame?: GameFranchise;
  onSearchResults: (graphData: GraphData, summary: string, gql: string, metrics: any, queryPrompt?: string) => void;
  onLaunchDeepSona: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isDeepSonaLoading?: boolean;
  onResetToMacro?: () => void;
  dataSource?: "live_spanner" | "local";
}

const SAMPLE_PROMPTS_BY_GAME: Record<GameFranchise, string[]> = {
  ALL: [
    "Cross-title Whales with spend over $3,500 across FC and Apex",
    "Competitive players with 3+ loss streaks & high frustration",
    "Social Squad Warriors active in Clubs and Apex Trios",
    "Legacy players who migrated across multiple EA franchises",
  ],
  FC26: [
    "FUT Champions players with 3+ loss streaks & high tilt in London",
    "Ultimate Team Whales ($3,500+ spend)",
    "Pro Clubs and Rush 5v5 active squads",
    "Career Mode purists who migrated from FC 24",
  ],
  APEX: [
    "Apex Ranked Predators with 3+ RP demotion losses",
    "Heirloom Whales with spend over $1,000",
    "Active Trios premade squads playing Friday nights",
    "Casual Mixtape players with high churn risk",
  ],
  MADDEN25: [
    "MUT Champions players with 3+ loss streaks",
    "Madden Ultimate Team Whales ($2,000+ spend)",
    "Superstar Showdown 3v3 active players",
    "Connected Franchise league managers",
  ],
  BATTLEFIELD: [
    "Conquest squad leaders with 500+ hours",
    "Vehicle specialists with Tier 1 tank mastery",
    "Breakthrough attack squad veterans",
    "Hardcore tactical players seeking XP boosters",
  ],
  SIMS4: [
    "DLC Whales with 10+ Expansion Packs owned",
    "Architectural & Custom Content (CC) builders",
    "Legacy Generations storycrafters with 1000+ hours",
    "Casual players who haven't bought Lovestruck DLC",
  ],
};

export default function NLSearchBar({
  selectedGame = "ALL",
  onSearchResults,
  onLaunchDeepSona,
  isLoading,
  setIsLoading,
  isDeepSonaLoading = false,
  onResetToMacro,
  dataSource = "live_spanner",
}: NLSearchBarProps) {
  const [query, setQuery] = useState<string>("");
  const [showGql, setShowGql] = useState<boolean>(false);
  const [currentGql, setCurrentGql] = useState<string>("");
  const [summaryText, setSummaryText] = useState<string>("");
  const [metrics, setMetrics] = useState<any>(null);

  const currentPrompts = SAMPLE_PROMPTS_BY_GAME[selectedGame] || SAMPLE_PROMPTS_BY_GAME.ALL;

  const handleSearch = async (searchPrompt?: string) => {
    const q = searchPrompt || query;
    if (!q.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/audiences/nl-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, game: selectedGame, dataSource }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentGql(data.generated_gql);
        setSummaryText(data.natural_language_summary);
        setMetrics(data.aggregate_metrics);
        onSearchResults(
          { nodes: data.nodes, links: data.links },
          data.natural_language_summary,
          data.generated_gql,
          data.aggregate_metrics,
          q
        );
      }
    } catch (e) {
      console.error("NL Query error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSummaryText("");
    setCurrentGql("");
    setMetrics(null);
    if (onResetToMacro) {
      onResetToMacro();
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-20 w-[92%] sm:w-[560px] max-w-[560px] flex flex-col items-start gap-2 font-sans">
      {/* Sleek Segment Summary Banner */}
      {summaryText && (
        <div className="w-full bg-black/80 backdrop-blur-2xl p-3 px-4 rounded-2xl border border-white/10 shadow-2xl flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Cohort Isolated:</span>
                <span className="text-emerald-400 font-mono">
                  {metrics?.matched_count || 0} Nodes • {metrics?.estimated_total?.toLocaleString() || 0} Addressable Players
                </span>
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                {summaryText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onLaunchDeepSona}
              disabled={isDeepSonaLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-lg ${
                isDeepSonaLoading
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {isDeepSonaLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-black" />
                  <span>Test Focus Group</span>
                  <ArrowRight className="w-3 h-3 text-black" />
                </>
              )}
            </button>

            {onResetToMacro && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                title="Reset to Macro Galaxy"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* GQL Preview Accordion */}
      {showGql && currentGql && (
        <div className="w-full bg-black/85 backdrop-blur-2xl p-3.5 rounded-2xl border border-white/10 text-left font-mono text-xs text-gray-300 animate-fade-in">
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2 border-b border-white/10 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-gray-400" />
              <span>Spanner Graph GQL</span>
            </span>
            <span className="text-gray-400">Vertex AI Gemini</span>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap py-1 text-gray-300 text-[11px] max-h-32">{currentGql}</pre>
        </div>
      )}

      {/* Minimalist Search Input Bar */}
      <div className="w-full relative flex items-center bg-black/70 backdrop-blur-2xl rounded-2xl border border-white/15 p-1.5 shadow-2xl focus-within:border-white/40 transition-all">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={`Describe an audience (e.g. 'Whales with spend over $1,000' in ${selectedGame === "ALL" ? "any title" : selectedGame})...`}
          className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none px-3.5 font-normal"
        />

        <div className="flex items-center gap-1.5 pr-1">
          {currentGql && (
            <button
              onClick={() => setShowGql(!showGql)}
              className={`p-2 rounded-xl text-xs transition-all ${
                showGql
                  ? "bg-white/20 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              title="Inspect GQL"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Segmenting...</span>
              </span>
            ) : (
              <>
                <span>Segment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Preset Chips per Title */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 no-scrollbar">
        {currentPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(p);
              handleSearch(p);
            }}
            className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xl hover:bg-white/10 border border-white/10 text-[11px] text-gray-400 hover:text-white whitespace-nowrap transition-all"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
