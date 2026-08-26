"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

interface LiftScoreGaugeProps {
  conversionLift: number;
  churnMitigation: number;
  revenueImpact: number;
  sentimentDecay: number;
}

export default function LiftScoreGauge({
  conversionLift,
  churnMitigation,
  revenueImpact,
  sentimentDecay,
}: LiftScoreGaugeProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-4 gap-3 font-sans relative">
      {/* Metric 1: Sales Boost */}
      <div
        onMouseEnter={() => setActiveTooltip("lift")}
        onMouseLeave={() => setActiveTooltip(null)}
        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all relative cursor-pointer"
      >
        <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
          <span>Sales Boost</span>
          <Info className="w-3 h-3 text-gray-500 opacity-60" />
        </div>
        <div className="text-xl font-semibold text-emerald-400 mt-1 tracking-tight">
          +{conversionLift.toFixed(1)}%
        </div>
        <span className="text-[11px] text-gray-400 block mt-0.5">more players buying</span>

        {activeTooltip === "lift" && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 p-2.5 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 text-[11px] text-gray-200 shadow-2xl animate-fade-in pointer-events-none">
            <strong className="text-emerald-400 block mb-0.5">What this means:</strong>
            Simulated increase in store purchases compared to normal baseline.
          </div>
        )}
      </div>

      {/* Metric 2: Player Retention */}
      <div
        onMouseEnter={() => setActiveTooltip("churn")}
        onMouseLeave={() => setActiveTooltip(null)}
        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all relative cursor-pointer"
      >
        <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
          <span>Player Retention</span>
          <Info className="w-3 h-3 text-gray-500 opacity-60" />
        </div>
        <div className="text-xl font-semibold text-cyan-400 mt-1 tracking-tight">
          +{churnMitigation.toFixed(1)}%
        </div>
        <span className="text-[11px] text-gray-400 block mt-0.5">keeps players active</span>

        {activeTooltip === "churn" && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 p-2.5 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 text-[11px] text-gray-200 shadow-2xl animate-fade-in pointer-events-none">
            <strong className="text-cyan-400 block mb-0.5">What this means:</strong>
            Reduces rage-quits by offering timely help right after tough match losses.
          </div>
        )}
      </div>

      {/* Metric 3: Expected Earnings */}
      <div
        onMouseEnter={() => setActiveTooltip("rev")}
        onMouseLeave={() => setActiveTooltip(null)}
        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all relative cursor-pointer"
      >
        <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
          <span>Expected Earnings</span>
          <Info className="w-3 h-3 text-gray-500 opacity-60" />
        </div>
        <div className="text-xl font-semibold text-amber-300 mt-1 tracking-tight">
          ${(revenueImpact / 1000).toFixed(0)}K
        </div>
        <span className="text-[11px] text-gray-400 block mt-0.5">projected new revenue</span>

        {activeTooltip === "rev" && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 p-2.5 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 text-[11px] text-gray-200 shadow-2xl animate-fade-in pointer-events-none">
            <strong className="text-amber-300 block mb-0.5">What this means:</strong>
            Total estimated new revenue from players purchasing this offer.
          </div>
        )}
      </div>

      {/* Metric 4: Community Risk */}
      <div
        onMouseEnter={() => setActiveTooltip("sentiment")}
        onMouseLeave={() => setActiveTooltip(null)}
        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all relative cursor-pointer"
      >
        <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
          <span>Community Risk</span>
          <Info className="w-3 h-3 text-gray-500 opacity-60" />
        </div>
        <div className="text-xl font-semibold text-gray-200 mt-1 tracking-tight">
          Low ({sentimentDecay.toFixed(1)}%)
        </div>
        <span className="text-[11px] text-emerald-400 block mt-0.5">safe from player backlash</span>

        {activeTooltip === "sentiment" && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 p-2.5 rounded-xl bg-black/90 backdrop-blur-xl border border-white/20 text-[11px] text-gray-200 shadow-2xl animate-fade-in pointer-events-none">
            <strong className="text-gray-200 block mb-0.5">What this means:</strong>
            Monitors Reddit & Discord sentiment to make sure prices feel fair.
          </div>
        )}
      </div>
    </div>
  );
}
