'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFranchise } from '@/lib/FranchiseContext';
import { EXECUTIVE_BENCHMARKS } from '@/lib/constants';
import { A2UIRenderer } from '@/components/A2UIRenderer';
import { A2UICreateSurfacePayload } from '@/types/a2ui';
import { MathFormula, FormattedText } from '@/components/MathFormula';
import { CoreFindingBanner } from '@/components/CoreFindingBanner';
import {
  TrendingUp,
  Zap,
  Target,
  ShieldCheck,
  Layers,
  MapPin,
  Sliders,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  Activity,
  CheckCircle2,
  Server,
  BarChart3,
  ClipboardList,
  Flame,
} from 'lucide-react';

export default function HomePage() {
  const { currentFranchise } = useFranchise();
  const [a2uiTriggerStatus, setA2uiTriggerStatus] = useState<string | null>(null);

  // Live A2UI surface test payload
  const initialA2UISurface: A2UICreateSurfacePayload = {
    surfaceId: 'surface-exec-kpi-summary',
    title: 'Autonomous Portfolio Optimization Dispatch',
    version: '1.2.0',
    initialModel: {
      totalBudget: '$4,200,000',
      blendedROAS: '2.74x',
      pacingClamp: 'ACTIVE (Max 20% Shift)',
    },
    rootWidget: {
      id: 'root-layout',
      type: 'a2ui-recommendation-card',
      title: 'Budget Rebalancing Opportunity Detected',
      subtitle: `AI analysis has evaluated ${currentFranchise} across 25 target metro areas. Rebalancing $350k from saturated campaigns to high-growth creative hooks will yield an estimated +24.6% return on ad spend (ROAS) while respecting daily pacing guardrails.`,
      actionPayload: {
        label: 'Approve & Sync with Media Buying Campaigns',
        secondaryLabel: 'Review Budget Simulation',
        actionType: 'DISPATCH_A2A_REBALANCE',
        targetSpend: 350000,
      },
    },
  };

  const handleA2UIAction = (payload: any) => {
    if (payload.secondary) {
      window.location.href = '/scenario';
    } else {
      setA2uiTriggerStatus('Campaign budget sync signal dispatched to media buying systems.');
      setTimeout(() => setA2uiTriggerStatus(null), 5000);
    }
  };

  const getBenchmarkIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-[#00C48C]" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-[#0072BC]" />;
      case 'Target':
        return <Target className="w-5 h-5 text-[#FFB800]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-[#8A2BE2]" />;
      default:
        return <Activity className="w-5 h-5 text-[#00C48C]" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <div className="relative bg-gradient-to-br from-[#16263A] via-[#111F30] to-[#0E1A29] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0072BC]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[#00C48C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-4xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0072BC]/15 border border-[#0072BC]/30 text-[#38BDF8] text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#0072BC]" />
              <span>EA Marketing Intelligence • Executive Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading font-bold text-white tracking-tight leading-tight">
              EA Creative Intelligence & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0072BC] via-[#008BE6] to-[#38BDF8]">Campaign Performance</span> Platform
            </h1>
            <p className="text-sm text-[#8FA3BC] leading-relaxed">
              AI-powered marketing intelligence connecting creative scene performance, regional weather and market demand, cross-channel budget optimization, and automated campaign execution.
            </p>
          </div>

          <div className="bg-[#0E1A29] border border-[#253D5B] rounded-lg p-4 shrink-0 min-w-[280px] space-y-3 shadow-md">
            <div className="text-xs font-semibold text-[#8FA3BC] uppercase tracking-wider flex items-center justify-between">
              <span>Active Portfolio Status</span>
              <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-ping" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="text-[11px] text-[#5C728C]">Allocated Budget</div>
                <div className="text-lg font-heading font-bold text-white tabular-nums">$4.20M</div>
              </div>
              <div>
                <div className="text-[11px] text-[#5C728C]">Blended D7 ROAS</div>
                <div className="text-lg font-heading font-bold text-[#00C48C] tabular-nums">2.74x</div>
              </div>
              <div>
                <div className="text-[11px] text-[#5C728C]">Effective CPI</div>
                <div className="text-lg font-heading font-bold text-white tabular-nums">$4.18</div>
              </div>
              <div>
                <div className="text-[11px] text-[#5C728C]">Projected Installs</div>
                <div className="text-lg font-heading font-bold text-[#008BE6] tabular-nums">1.05M</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Core Executive Finding */}
      <CoreFindingBanner
        badge="PORTFOLIO CORE FINDING"
        finding={`$350k Budget Rebalancing in ${currentFranchise} Yields +24.6% Return on Ad Spend (ROAS) While Protecting Audience Overlap`}
        purpose="This platform connects creative scene performance, regional market intelligence, cross-channel budget optimization, and automated campaign sync into a single executive decision engine."
        metrics={[
          { label: 'Portfolio ROAS Lift', value: '+24.6% D7 Lift', isPositive: true },
          { label: 'Rebalance Opportunity', value: '$350,000 Shift', isPositive: true },
          { label: 'Audience Overlap Risk', value: '100% Mitigated', isPositive: true },
          { label: 'Pacing Guardrails', value: '20% Clamp Active', isPositive: true },
        ]}
      />

      {/* Industry ROI Proof Benchmarks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#0072BC]" />
            <h2 className="text-base font-heading font-bold text-white uppercase tracking-wider">
              Executive ROI Proof & Industry Benchmarks
            </h2>
          </div>
          <span className="text-xs text-[#8FA3BC]">
            Validated Enterprise Proof Points
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXECUTIVE_BENCHMARKS.map((bench, idx) => (
            <div
              key={idx}
              className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] hover:border-[#0072BC] transition-all rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8FA3BC]">
                  {bench.company}
                </span>
                <div className="p-2 rounded-md bg-[#0E1A29] border border-[#253D5B]">
                  {getBenchmarkIcon(bench.icon)}
                </div>
              </div>
              <div className="text-2xl font-heading font-bold text-white tracking-tight tabular-nums" style={{ color: bench.color }}>
                {bench.metric}
              </div>
              <div className="text-xs font-semibold text-white mt-1">{bench.subtitle}</div>
              <p className="text-xs text-[#8FA3BC] mt-2 leading-relaxed">{bench.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* A2UI Dynamic Sandbox Demonstration */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#00C48C]" />
            <h2 className="text-base font-heading font-bold text-white uppercase tracking-wider">
              A2UI Streaming Protocol Sandbox (Trusted Widget Catalog)
            </h2>
          </div>
          <span className="text-xs text-[#8FA3BC]">
            Decoupled Dynamic Component Rendering
          </span>
        </div>

        {a2uiTriggerStatus && (
          <div className="p-3 bg-[#0E1A29] border border-[#00C48C]/50 rounded-md text-xs font-mono text-[#00C48C] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
            <span>{a2uiTriggerStatus}</span>
          </div>
        )}

        <A2UIRenderer
          initialSurface={initialA2UISurface}
          onActionTrigger={handleA2UIAction}
        />
      </div>

      {/* Core Navigation Hub - 4 Clean Measurement Workflows */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <Layers className="w-5 h-5 text-[#0072BC]" />
          <h2 className="text-base font-heading font-bold text-white uppercase tracking-wider">
            Explore Executive Measurement Workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            href="/intake"
            className="group bg-[#16263A] border border-[rgba(255,255,255,0.08)] hover:border-[#0072BC] rounded-lg p-5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_0_14px_rgba(0,114,188,0.25)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30">
                  Intake
                </span>
                <ClipboardList className="w-5 h-5 text-[#8FA3BC] group-hover:text-[#00C48C] transition-colors" />
              </div>
              <h3 className="text-base font-heading font-bold text-white group-hover:text-[#008BE6] transition-colors">
                Campaign Intake & Audience Protection
              </h3>
              <p className="text-xs text-[#8FA3BC] mt-2 leading-relaxed">
                Upload campaign briefs with automated cross-franchise audience collision detection (EA FC vs Apex Legends) and one-click timeline mitigation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#253D5B] flex items-center justify-between text-xs text-[#00C48C] font-semibold">
              <span>Open Campaign Intake</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/shapley"
            className="group bg-[#16263A] border border-[rgba(255,255,255,0.08)] hover:border-[#0072BC] rounded-lg p-5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_0_14px_rgba(0,114,188,0.25)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#0072BC]/15 text-[#008BE6] border border-[#0072BC]/30">
                  Creative
                </span>
                <Flame className="w-5 h-5 text-[#8FA3BC] group-hover:text-[#0072BC] transition-colors" />
              </div>
              <h3 className="text-base font-heading font-bold text-white group-hover:text-[#008BE6] transition-colors">
                Creative Storybeat Performance
              </h3>
              <p className="text-xs text-[#8FA3BC] mt-2 leading-relaxed">
                Analyze 15-second video scenes to balance viral hook stopping power (CTR) with high-intent in-game monetization (CTI).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#253D5B] flex items-center justify-between text-xs text-[#00C48C] font-semibold">
              <span>Analyze Creative Scenes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/scenario"
            className="group bg-[#16263A] border border-[rgba(255,255,255,0.08)] hover:border-[#0072BC] rounded-lg p-5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_0_14px_rgba(0,114,188,0.25)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30">
                  Planning
                </span>
                <Sliders className="w-5 h-5 text-[#8FA3BC] group-hover:text-[#FFB800] transition-colors" />
              </div>
              <h3 className="text-base font-heading font-bold text-white group-hover:text-[#008BE6] transition-colors">
                Cross-Channel Budget Optimization
              </h3>
              <p className="text-xs text-[#8FA3BC] mt-2 leading-relaxed">
                Simulate channel returns to optimize spend allocations, lift portfolio revenue, and protect daily pacing guardrails.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#253D5B] flex items-center justify-between text-xs text-[#00C48C] font-semibold">
              <span>Run Budget Optimizer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/geospine"
            className="group bg-[#16263A] border border-[rgba(255,255,255,0.08)] hover:border-[#0072BC] rounded-lg p-5 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_0_14px_rgba(0,114,188,0.25)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#8A2BE2]/15 text-[#8A2BE2] border border-[#8A2BE2]/30">
                  Regional
                </span>
                <MapPin className="w-5 h-5 text-[#8FA3BC] group-hover:text-[#8A2BE2] transition-colors" />
              </div>
              <h3 className="text-base font-heading font-bold text-white group-hover:text-[#008BE6] transition-colors">
                Regional Demand & Weather Intelligence
              </h3>
              <p className="text-xs text-[#8FA3BC] mt-2 leading-relaxed">
                Explore 25 Nielsen metro markets, track 90-day weather forecast impacts on gaming demand, and simulate regional ad boost opportunities.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#253D5B] flex items-center justify-between text-xs text-[#00C48C] font-semibold">
              <span>Explore Regional Markets</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
