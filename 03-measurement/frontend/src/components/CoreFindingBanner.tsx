'use client';

import React from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Sliders, Info } from 'lucide-react';

export interface CoreFindingMetric {
  label: string;
  value: string;
  sublabel?: string;
  isPositive?: boolean;
}

export interface CoreFindingBannerProps {
  badge?: string;
  title?: string;
  finding: string;
  purpose: string;
  metrics?: CoreFindingMetric[];
  inputToggle?: {
    isCollapsed: boolean;
    onToggle: () => void;
    inputLabel?: string;
  };
}

export function CoreFindingBanner({
  badge = 'KEY EXECUTIVE FINDING',
  finding,
  purpose,
  metrics,
  inputToggle,
}: CoreFindingBannerProps) {
  return (
    <div className="relative bg-[#16263A] border border-[rgba(255,255,255,0.08)] border-l-4 border-l-[#0072BC] rounded-lg p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#0072BC]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Main Content (Left) */}
        <div className="space-y-3 max-w-4xl">
          {/* Header Row with Badge & Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-[#0072BC]/15 border border-[#0072BC]/30 text-[#38BDF8] text-[11px] font-mono font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#0072BC]" />
              <span>{badge}</span>
            </div>

            {inputToggle && (
              <button
                type="button"
                onClick={inputToggle.onToggle}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-[#0E1A29] hover:bg-[#1E334D] border border-[#253D5B] hover:border-[#0072BC] text-xs font-semibold text-white transition-all shadow-sm cursor-pointer"
                title={inputToggle.isCollapsed ? 'Show Input Panel' : 'Collapse Input Panel'}
              >
                <Sliders className="w-3.5 h-3.5 text-[#0072BC]" />
                <span>
                  {inputToggle.isCollapsed
                    ? `Show ${inputToggle.inputLabel || 'Inputs'} (Expand Controls)`
                    : `Collapse ${inputToggle.inputLabel || 'Inputs'} (Full Width Output)`}
                </span>
                {inputToggle.isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-[#38BDF8]" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-[#8FA3BC]" />
                )}
              </button>
            )}
          </div>

          {/* Finding Headline */}
          <h2 className="text-lg sm:text-xl font-heading font-bold text-white tracking-tight leading-snug">
            {finding}
          </h2>

          {/* Purpose & Context */}
          <div className="flex items-start space-x-2 text-xs sm:text-sm text-[#8FA3BC] leading-relaxed pt-0.5">
            <Info className="w-4 h-4 text-[#0072BC] shrink-0 mt-0.5" />
            <p>
              <span className="text-white font-medium">Page Function: </span>
              {purpose}
            </p>
          </div>
        </div>

        {/* Key Metrics Snapshot (Right) */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3 shrink-0 lg:min-w-[260px] bg-[#0E1A29] border border-[#253D5B] rounded-lg p-3.5">
            {metrics.map((m, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="text-[11px] text-[#5C728C] font-medium">{m.label}</div>
                <div
                  className={`text-lg font-heading font-bold tabular-nums ${
                    m.isPositive === true
                      ? 'text-[#00C48C]'
                      : m.isPositive === false
                      ? 'text-[#FF4560]'
                      : 'text-white'
                  }`}
                >
                  {m.value}
                </div>
                {m.sublabel && (
                  <div className="text-[10px] text-[#8FA3BC] font-mono">{m.sublabel}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
