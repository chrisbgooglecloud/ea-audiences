"use client";

import React, { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { CohortContext } from "@/lib/types";

interface OfferBattleArenaProps {
  cohortContext?: CohortContext | null;
  onSelectWinningOffer?: (title: string, spend: number) => void;
}

interface OfferVariant {
  id: string;
  name: string;
  price: number;
  perks: string[];
  conversionLift: number;
  churnMitigation: number;
  projectedRevenue: number;
  sentimentRisk: string;
  votes: Array<{
    persona: string;
    reason: string;
  }>;
}

export default function OfferBattleArena({
  cohortContext,
  onSelectWinningOffer,
}: OfferBattleArenaProps) {
  const [selectedOffer, setSelectedOffer] = useState<"A" | "B">("A");
  const isWhaleCohort = cohortContext?.dominantArchetype === "ULTIMATE_TEAM_WHALE";

  const variantA: OfferVariant = isWhaleCohort
    ? {
        id: "A",
        name: "Offer A: Guaranteed 88+ Campaign Icon Flash Selection",
        price: 49.99,
        perks: ["1 of 3 Prime Icon Player Pick", "500 Bonus FC Points", "Untradeable Trade-In Token"],
        conversionLift: 34.2,
        churnMitigation: 18.5,
        projectedRevenue: 420000,
        sentimentRisk: "5.2%",
        votes: [
          {
            persona: "Icon_Collector_Prime",
            reason: "Guaranteed 88+ selection eliminates pack variance. Instant buy.",
          },
          {
            persona: "Mbappe_Elite_99",
            reason: "Player pick allows targeting meta squad positions for Weekend League.",
          },
        ],
      }
    : {
        id: "A",
        name: "Offer A: FUT Champions Loss Shield & Loan Icon",
        price: 4.99,
        perks: ["1x Loss Re-entry Shield", "10-Match Loan Prime R9", "5x 82+ Rare Gold Players"],
        conversionLift: 28.4,
        churnMitigation: 26.2,
        projectedRevenue: 185000,
        sentimentRisk: "3.8%",
        votes: [
          {
            persona: "Mbappe_Elite_99",
            reason: "After an extra-time defeat, $4.99 is the ideal rage-mitigation price.",
          },
          {
            persona: "Friday_Rush_Squad",
            reason: "Accessible impulse purchase for Friday night sessions.",
          },
        ],
      };

  const variantB: OfferVariant = isWhaleCohort
    ? {
        id: "B",
        name: "Offer B: 5,900 FC Points + 85+ Walkout Megapack",
        price: 39.99,
        perks: ["5,900 FC Points", "1x 85+ Walkout Pack", "2x Evolution Tokens"],
        conversionLift: 22.1,
        churnMitigation: 12.0,
        projectedRevenue: 310000,
        sentimentRisk: "14.2%",
        votes: [
          {
            persona: "Friday_Rush_Squad",
            reason: "Good volume of points, but lacks specific icon guarantees.",
          },
        ],
      }
    : {
        id: "B",
        name: "Offer B: 1,050 FC Points + 84+ Campaign Pack",
        price: 9.99,
        perks: ["1,050 FC Points", "1x 84+ Walkout Pack", "1x Draft Entry Token"],
        conversionLift: 14.5,
        churnMitigation: 11.2,
        projectedRevenue: 130000,
        sentimentRisk: "12.4%",
        votes: [
          {
            persona: "Icon_Collector_Prime",
            reason: "Points are acceptable, but lacks loss-shield mechanics.",
          },
        ],
      };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Offer A */}
        <div
          onClick={() => setSelectedOffer("A")}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            selectedOffer === "A"
              ? "bg-white/10 border-white/40 shadow-xl"
              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
          }`}
        >
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block">
                Offer A (Recommended)
              </span>
              <h4 className="font-semibold text-white text-sm mt-0.5">{variantA.name}</h4>
            </div>
            <span className="text-base font-bold text-white font-mono">${variantA.price.toFixed(2)}</span>
          </div>

          {/* Perks */}
          <div className="py-3 space-y-1.5 text-xs text-gray-300">
            {variantA.perks.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{p}</span>
              </div>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/10 text-center">
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-500 block uppercase">Lift</span>
              <span className="font-semibold text-emerald-400 text-xs">+{variantA.conversionLift}%</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-500 block uppercase">Churn</span>
              <span className="font-semibold text-cyan-400 text-xs">+{variantA.churnMitigation}%</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-500 block uppercase">Net Rev</span>
              <span className="font-semibold text-amber-300 text-xs">${(variantA.projectedRevenue / 1000).toFixed(0)}K</span>
            </div>
          </div>

          {/* Quotes */}
          <div className="space-y-2 pt-2">
            {variantA.votes.map((v, idx) => (
              <div key={idx} className="text-[11px] text-gray-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <strong className="text-white mr-1">{v.persona}:</strong>
                <span className="text-gray-400">&ldquo;{v.reason}&rdquo;</span>
              </div>
            ))}
          </div>
        </div>

        {/* Offer B */}
        <div
          onClick={() => setSelectedOffer("B")}
          className={`rounded-2xl border p-4 cursor-pointer transition-all ${
            selectedOffer === "B"
              ? "bg-white/10 border-white/40 shadow-xl"
              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
          }`}
        >
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider block">
                Offer B (Alternative)
              </span>
              <h4 className="font-semibold text-white text-sm mt-0.5">{variantB.name}</h4>
            </div>
            <span className="text-base font-bold text-white font-mono">${variantB.price.toFixed(2)}</span>
          </div>

          {/* Perks */}
          <div className="py-3 space-y-1.5 text-xs text-gray-300">
            {variantB.perks.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-gray-400" />
                <span>{p}</span>
              </div>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/10 text-center">
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-500 block uppercase">Lift</span>
              <span className="font-semibold text-gray-300 text-xs">+{variantB.conversionLift}%</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-500 block uppercase">Churn</span>
              <span className="font-semibold text-gray-300 text-xs">+{variantB.churnMitigation}%</span>
            </div>
            <div className="p-2 rounded-xl bg-black/40 border border-white/5">
              <span className="text-[10px] text-gray-500 block uppercase">Net Rev</span>
              <span className="font-semibold text-amber-300 text-xs">${(variantB.projectedRevenue / 1000).toFixed(0)}K</span>
            </div>
          </div>

          {/* Quotes */}
          <div className="space-y-2 pt-2">
            {variantB.votes.map((v, idx) => (
              <div key={idx} className="text-[11px] text-gray-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <strong className="text-white mr-1">{v.persona}:</strong>
                <span className="text-gray-400">&ldquo;{v.reason}&rdquo;</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Select Winning Action */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-400">
          Selected: <strong className="text-white">{selectedOffer === "A" ? variantA.name : variantB.name}</strong>
        </span>

        <button
          onClick={() => {
            const v = selectedOffer === "A" ? variantA : variantB;
            onSelectWinningOffer?.(v.name, v.projectedRevenue);
          }}
          className="px-4 py-2 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-semibold transition-all"
        >
          Adopt Selected Offer {selectedOffer}
        </button>
      </div>
    </div>
  );
}
