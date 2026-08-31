"use client";

import React, { useState } from "react";
import { TrendingUp, Users, Target, ShieldAlert, Sparkles, Layers, DollarSign, ArrowUpRight } from "lucide-react";
import { GameFranchise, CohortContext } from "@/lib/types";

interface ConversionScoringMatrixProps {
  franchise: string;
  selectedGame: GameFranchise;
  creativeTitle: string;
  cohortContext?: CohortContext | null;
}

export default function ConversionScoringMatrix({
  franchise,
  selectedGame,
  creativeTitle,
  cohortContext,
}: ConversionScoringMatrixProps) {
  const [placementStrategy, setPlacementStrategy] = useState<"situational_milestone" | "store_menu_tile">("situational_milestone");

  const isSituational = placementStrategy === "situational_milestone";

  // Dynamic conversion rates based on strategy
  const casualConversion = isSituational ? 32.4 : 8.2;
  const hardcoreConversion = isSituational ? 46.8 : 24.5;
  const casualLift = ((32.4 - 8.2) / 8.2) * 100;
  const hardcoreLift = ((46.8 - 24.5) / 24.5) * 100;
  const totalAudience = cohortContext?.estimatedTotal || 245000;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* 1. Placement Strategy Selector */}
      <div className="flex items-center justify-between bg-black/40 p-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
            Microtransaction Placement:
          </span>
          <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setPlacementStrategy("situational_milestone")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isSituational
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Post-Milestone / Match Situational Trigger
            </button>

            <button
              onClick={() => setPlacementStrategy("store_menu_tile")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isSituational
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Standard In-Game Store Menu Tile
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span>Target Audience: <strong>{totalAudience.toLocaleString()} Players</strong></span>
        </div>
      </div>

      {/* 2. Side-by-Side Scoring Matrix: Casual vs. Hardcore */}
      <div className="grid grid-cols-2 gap-4">
        {/* Casual Segment Card */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Casual Socializers & Solo Story</h4>
                <span className="text-[10px] text-zinc-500">65% of Total Player Base</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-cyan-400 font-mono">{casualConversion}%</span>
              <span className="text-[10px] text-zinc-500 block">conversion rate</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Strategy Lift</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {isSituational ? `+${casualLift.toFixed(0)}%` : "Baseline"}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Avg WTP</span>
              <span className="text-xs font-bold text-amber-300 font-mono">$4.99 - $9.99</span>
            </div>

            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Friction Point</span>
              <span className="text-xs font-medium text-zinc-300">
                {isSituational ? "Zero Friction" : "High Dropoff"}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
            {isSituational
              ? "Casual players exhibit high impulse response when triggered post-match with affordable starter packs or double XP tokens, bypassing cumbersome in-game store navigation."
              : "Casual players rarely navigate to deep store tabs, resulting in steep 75% discovery dropoff when unprompted."}
          </p>
        </div>

        {/* Hardcore Segment Card */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Hardcore Sweats & High-LTV Whales</h4>
                <span className="text-[10px] text-zinc-500">35% of Total Player Base</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-emerald-400 font-mono">{hardcoreConversion}%</span>
              <span className="text-[10px] text-zinc-500 block">conversion rate</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Strategy Lift</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {isSituational ? `+${hardcoreLift.toFixed(0)}%` : "Baseline"}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Avg WTP</span>
              <span className="text-xs font-bold text-amber-300 font-mono">$49.99 - $160</span>
            </div>

            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-zinc-500 block">Whale Share</span>
              <span className="text-xs font-medium text-zinc-300">
                {isSituational ? "68% Penetration" : "42% Penetration"}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
            {isSituational
              ? "Competitive grinders and whales react immediately to high-tier currency reloads and guaranteed player pick flashes directly on defeat / victory screens."
              : "Hardcore players actively seek store items, but situational triggers still deliver +92% conversion lift by timing the offer to peak session intensity."}
          </p>
        </div>
      </div>

      {/* 3. Aggregate Evaluator Takeaway */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-300">
            Scoring Agent Recommendation: <strong>Situational Post-Match Trigger</strong> delivers aggregate{" "}
            <span className="text-emerald-400 font-bold">+28.5% conversion lift</span> with <strong>3.10x ROAS</strong> across {selectedGame === "ALL" ? "all titles" : selectedGame}.
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
          <span>Vertex AI Gemini Evaluator</span>
        </div>
      </div>
    </div>
  );
}
