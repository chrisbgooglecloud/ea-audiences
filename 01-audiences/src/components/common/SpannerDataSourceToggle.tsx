"use client";

import React from "react";
import { Cloud, Zap } from "lucide-react";

export type SpannerDataSource = "live_spanner" | "local";

interface SpannerDataSourceToggleProps {
  dataSource: SpannerDataSource;
  onToggle: (source: SpannerDataSource) => void;
  className?: string;
}

export default function SpannerDataSourceToggle({
  dataSource,
  onToggle,
  className = "",
}: SpannerDataSourceToggleProps) {
  const isLive = dataSource === "live_spanner";

  return (
    <div
      className={`flex items-center bg-black/40 backdrop-blur-xl border border-white/10 p-0.5 rounded-xl text-xs font-mono select-none ${className}`}
      title={
        isLive
          ? "Connected live to Google Cloud Spanner Enterprise (blackrock-spanner / ea_graph_db)"
          : "Using instant in-memory grounded graph cache (0ms demo mode)"
      }
    >
      <button
        onClick={() => onToggle("local")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          !isLive
            ? "bg-white/15 text-cyan-300 font-semibold shadow-xs border border-cyan-400/20"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <Zap className={`w-3 h-3 ${!isLive ? "text-cyan-400 fill-cyan-400" : "text-zinc-500"}`} />
        <span className="hidden sm:inline">Fast Engine</span>
        <span className="sm:hidden">Local</span>
      </button>

      <button
        onClick={() => onToggle("live_spanner")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          isLive
            ? "bg-emerald-500/20 text-emerald-300 font-semibold shadow-xs border border-emerald-400/30"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <div className="relative flex items-center justify-center">
          <Cloud className={`w-3 h-3 ${isLive ? "text-emerald-400" : "text-zinc-500"}`} />
          {isLive && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>
        <span className="hidden sm:inline">Live Spanner</span>
        <span className="sm:hidden">Spanner</span>
      </button>
    </div>
  );
}
