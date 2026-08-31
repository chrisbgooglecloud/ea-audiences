"use client";

import React from "react";

interface PlaystyleRadarProps {
  spend?: number;
  churnRisk?: number;
  tilt?: number;
  archetype?: string;
}

export default function PlaystyleRadar({
  spend = 850,
  churnRisk = 0.45,
  tilt = 0.65,
  archetype = "COMPETITIVE_GRINDER",
}: PlaystyleRadarProps) {
  const safeSpend = typeof spend === "number" && !isNaN(spend) ? spend : 850;
  const safeChurn = typeof churnRisk === "number" && !isNaN(churnRisk) ? churnRisk : 0.45;
  const safeTilt = typeof tilt === "number" && !isNaN(tilt) ? tilt : 0.65;
  const safeArch = typeof archetype === "string" ? archetype : "COMPETITIVE_GRINDER";

  const isComp = safeArch.toUpperCase().includes("COMPETITIVE") || safeArch.toUpperCase().includes("WHALE") || safeArch.toUpperCase().includes("GRINDER");
  const isSocial = safeArch.toUpperCase().includes("CASUAL") || safeArch.toUpperCase().includes("SOCIAL");

  const metrics = [
    {
      label: "LTV / Spend",
      value: Math.min(100, Math.max(5, Math.round((safeSpend / 1500) * 100))),
      raw: `$${safeSpend.toFixed(0)}`,
      color: "bg-amber-400",
    },
    {
      label: "Tilt Sensitivity",
      value: Math.min(100, Math.max(5, Math.round(safeTilt * 100))),
      raw: `${Math.round(safeTilt * 100)}%`,
      color: "bg-rose-500",
    },
    {
      label: "Churn Risk Score",
      value: Math.min(100, Math.max(5, Math.round(safeChurn * 100))),
      raw: `${Math.round(safeChurn * 100)}%`,
      color: "bg-amber-500",
    },
    {
      label: "Session APM",
      value: isComp ? 88 : 45,
      raw: isComp ? "185 APM" : "95 APM",
      color: "bg-cyan-400",
    },
    {
      label: "Social Co-Play",
      value: isSocial ? 92 : 35,
      raw: isSocial ? "High (Squad)" : "Solo / Pro-Am",
      color: "bg-emerald-400",
    },
  ];

  return (
    <div className="space-y-2.5 font-mono text-xs">
      <div className="text-[11px] text-gray-400 uppercase tracking-wider">Playstyle & Behavioral Profile</div>
      <div className="space-y-2">
        {metrics.map((m, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-300">{m.label}</span>
              <span className="font-bold text-white">{m.raw}</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <div
                className={`h-full ${m.color} rounded-full transition-all duration-500`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
