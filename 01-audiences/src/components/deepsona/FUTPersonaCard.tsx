"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export interface PersonaProfile {
  id: string;
  name: string;
  gamerTag: string;
  archetype: string;
  cardTier: "ICON" | "TOTY" | "GOLD_RARE" | "HERO" | "MANAGER";
  ovrRating: number;
  division: string;
  matchesPlayed: number;
  spendLtv: number;
  tiltLevel: number; // 0 - 100
  wtp: number;
  fsmState: string;
  recentLossStreak: number;
  quote: string;
  reactionEmoji?: string;
}

interface FUTPersonaCardProps {
  persona: PersonaProfile;
  isSelected?: boolean;
  onSelect?: () => void;
  onInterrogate?: () => void;
}

export default function FUTPersonaCard({
  persona,
  isSelected,
  onSelect,
  onInterrogate,
}: FUTPersonaCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between font-sans ${
        isSelected
          ? "bg-white/10 border-white/40 shadow-xl"
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
      }`}
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-white text-xs tracking-tight">
              {persona.gamerTag}
            </div>
            <span className="text-[11px] text-gray-400 block mt-0.5">{persona.division}</span>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-white font-mono">{persona.ovrRating}</span>
          </div>
        </div>

        {/* Persona Quote */}
        <p className="mt-3 text-xs text-gray-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5 line-clamp-3">
          &ldquo;{persona.quote}&rdquo;
        </p>
      </div>

      {/* Stats Footer */}
      <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-400 text-[10px] block uppercase">Willing to spend</span>
          <span className="font-semibold text-amber-300 font-mono">${persona.wtp.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {persona.fsmState.toLowerCase().includes("purchase") ? "Will Buy" : "Interested"}
          </span>
          {onInterrogate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInterrogate();
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
              title="Interview 1-on-1"
            >
              <MessageSquare className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
