'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFranchise } from '@/context/FranchiseContext';
import { useCampaign } from '@/context/CampaignContext';
import { useA2AEventBus } from '@/context/A2AEventBusContext';
import {
  Sparkles,
  TrendingUp,
  Users,
  Palette,
  BarChart3,
  ArrowRight,
  Radio,
  CheckCircle2,
  Play,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function MissionControlPage() {
  const { currentFranchise, franchiseInfo } = useFranchise();
  const { activeBrief, activeCohort } = useCampaign();
  const { publishMessage, setIsDrawerOpen } = useA2AEventBus();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  const workspaces = [
    {
      act: 'Act 1',
      tag: 'Audiences & Personas',
      title: 'Audience Discovery',
      description:
        'Explore 2K player communities and segment cohorts with natural language. Test campaign messaging against synthetic player archetypes before launch.',
      href: '/audiences',
      icon: Users,
      color: '#00F0FF',
      accentBg: 'bg-[#00F0FF]/10',
      borderColor: 'border-[#00F0FF]/30',
      badge: 'Spanner & DeepSona',
      kpi: '5,000+ 2K Profiles Mapped',
      intent: 'DISPATCH_AUDIENCE_BRIEF',
    },
    {
      act: 'Act 2',
      tag: 'Creative Studio',
      title: 'Generative Creative',
      description:
        'Monitor live community sentiment and generate multi-format marketing assets from audience briefs with automated 2K brand and VC compliance checks.',
      href: '/creative',
      icon: Palette,
      color: '#FFD200',
      accentBg: 'bg-[#FFD200]/10',
      borderColor: 'border-[#FFD200]/30',
      badge: 'Gemini Multi-Surface',
      kpi: '6 Formats Supported',
      intent: 'ACK_REVISE_CREATIVE',
    },
    {
      act: 'Act 3',
      tag: 'Measurement & MMM',
      title: 'Performance & Optimization',
      description:
        'Analyze creative storybeat impact with video intelligence and automatically optimize budget allocation across media channels to maximize ROAS.',
      href: '/measurement',
      icon: BarChart3,
      color: '#00C48C',
      accentBg: 'bg-[#00C48C]/10',
      borderColor: 'border-[#00C48C]/30',
      badge: 'Meridian MMM & SHAP',
      kpi: '+24.6% Projected Lift',
      intent: 'ALLOCATE_PROGRAMMATIC_SPEND',
    },
    {
      act: 'Act 4',
      tag: 'In-Game Commerce',
      title: 'The City & Arena Ads',
      description:
        'Deploy dynamic virtual billboard placements and courtside LED media takeovers inside NBA 2K and 2K live service titles in real-time.',
      href: '/commerce',
      icon: Layers,
      color: '#FF2E38',
      accentBg: 'bg-[#FF2E38]/10',
      borderColor: 'border-[#FF2E38]/30',
      badge: 'Dynamic 3D Media',
      kpi: 'Sub-100ms Ad Delivery',
      intent: 'DEPLOY_INGAME_ADS',
    },
  ];

  const handleSimulateHandoff = async (idx: number) => {
    setActiveStep(idx);
    setHasSimulated(true);
    const item = workspaces[idx];
    await publishMessage({
      correlation_id: `sim-step-${idx + 1}-${Date.now()}`,
      sender: `2KExecutiveOrchestrator (${item.act})`,
      recipient: 'GlobalExecutiveConsole',
      intent: item.intent,
      payload: {
        act: item.act,
        title: item.title,
        franchise: currentFranchise,
        status: 'DISPATCHED_TO_STUDIO',
      },
    });
  };

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-8 space-y-10 relative">
      {/* Ambient lighting */}
      <div className="apple-ambient-glow -top-20 -left-20 bg-[#E51B24]" />
      <div className="apple-ambient-glow top-1/2 -right-20 bg-[#FF2E38]" />

      {/* Hero Section */}
      <div className="relative apple-glass-card rounded-3xl p-8 sm:p-10 overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3.5 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.12] text-white text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#FF2E38]" />
              <span>2K Marketing Platform • {franchiseInfo.label}</span>
            </div>
            <h1 className="apple-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Intelligent Marketing,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4B53] via-[#E51B24] to-[#FFA500]">
                Powered by 2K AI
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#8FA3BC] apple-subhead leading-relaxed">
              Discover player insights, create on-brand campaigns, audit monetization compliance, and continuously optimize marketing performance across every channel.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="apple-glass rounded-2xl p-5 shrink-0 min-w-[300px] space-y-3.5 shadow-xl border border-white/[0.1]">
            <div className="text-xs font-semibold text-[#8FA3BC] flex items-center justify-between">
              <span className="text-white font-bold">{franchiseInfo.shortName} Performance</span>
              <span className="flex items-center gap-1.5 text-[11px] text-[#00C48C] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-pulse" />
                Live Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div>
                <div className="text-[11px] text-[#8FA3BC]">Active Budget</div>
                <div className="text-2xl font-black text-white tabular-nums">$4.20M</div>
              </div>
              <div>
                <div className="text-[11px] text-[#8FA3BC]">Blended ROAS</div>
                <div className="text-2xl font-black text-[#00C48C] tabular-nums">2.74x</div>
              </div>
              <div>
                <div className="text-[11px] text-[#8FA3BC]">Effective CPI</div>
                <div className="text-2xl font-black text-white tabular-nums">$4.18</div>
              </div>
              <div>
                <div className="text-[11px] text-[#8FA3BC]">Audience Reach</div>
                <div className="text-2xl font-black text-[#00F0FF] tabular-nums">1.05M</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Interactive Workspaces */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="apple-title text-base sm:text-lg font-bold text-white">
              Marketing Workspaces
            </h2>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="apple-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs text-white font-semibold transition-all"
          >
            <Radio className="w-3.5 h-3.5 text-[#00C48C]" />
            <span>Agent Activity Feed</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workspaces.map((ws, idx) => {
            const Icon = ws.icon;
            return (
              <div
                key={ws.act}
                className="apple-glass-card group rounded-2xl p-6 transition-all duration-spring flex flex-col justify-between hover:border-white/[0.25] shadow-lg relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border font-mono"
                      style={{
                        backgroundColor: `${ws.color}15`,
                        color: ws.color,
                        borderColor: `${ws.color}40`,
                      }}
                    >
                      {ws.act} • {ws.tag}
                    </span>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${ws.color}15`, color: ws.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="apple-title text-lg font-bold text-white mb-2 group-hover:text-white">
                    {ws.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8FA3BC] leading-relaxed apple-subhead">
                    {ws.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="text-xs font-mono font-medium text-gray-400">
                    {ws.kpi}
                  </div>

                  <Link
                    href={ws.href}
                    className="apple-press flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-md group-hover:brightness-110"
                    style={{
                      backgroundColor: '#E51B24',
                    }}
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Outcomes */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-white">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h2 className="apple-title text-base sm:text-lg font-bold text-white">
            Demonstrated Impact
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="apple-glass-card rounded-2xl p-5 space-y-2">
            <div className="text-xs font-semibold text-[#8FA3BC]">Audience Retention</div>
            <div className="text-3xl font-black text-[#00F0FF] tabular-nums">+34.2%</div>
            <p className="text-xs text-[#8FA3BC] apple-subhead leading-relaxed">
              Reduction in churn risk through synthetic persona pre-testing and personalized offers.
            </p>
          </div>

          <div className="apple-glass-card rounded-2xl p-5 space-y-2">
            <div className="text-xs font-semibold text-[#8FA3BC]">Production Speed</div>
            <div className="text-3xl font-black text-[#FFD200] tabular-nums">10x</div>
            <p className="text-xs text-[#8FA3BC] apple-subhead leading-relaxed">
              Faster multi-format creative production with automated brand and VC compliance checks.
            </p>
          </div>

          <div className="apple-glass-card rounded-2xl p-5 space-y-2">
            <div className="text-xs font-semibold text-[#8FA3BC]">Media Efficiency</div>
            <div className="text-3xl font-black text-[#00C48C] tabular-nums">+24.6%</div>
            <p className="text-xs text-[#8FA3BC] apple-subhead leading-relaxed">
              Portfolio ROAS lift via video storybeat attribution and Meridian budget optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

