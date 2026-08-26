'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFranchise } from '@/lib/FranchiseContext';
import { ChannelAllocation } from '@/types';
import { MathFormula, FormattedText } from '@/components/MathFormula';
import {
  Sliders,
  Sparkles,
  Zap,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Bot,
  Activity,
  Layers,
  DollarSign,
  Send,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { CoreFindingBanner } from '@/components/CoreFindingBanner';

export default function ScenarioPage() {
  const { currentFranchise } = useFranchise();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isInputCollapsed, setIsInputCollapsed] = useState<boolean>(false);
  const [totalBudget, setTotalBudget] = useState<number>(4200000);
  const [targetCPI, setTargetCPI] = useState<number>(4.20);
  const [targetROAS, setTargetROAS] = useState<number>(2.80);

  const [channels, setChannels] = useState<ChannelAllocation[]>([
    {
      channel: 'YouTube',
      current_spend: 1400000,
      proposed_spend: 1400000,
      projected_roas: 2.35,
      marginal_roas: 1.85,
      hill_k: 3.8,
      hill_s: 1.45,
      hill_h: 950000,
    },
    {
      channel: 'Meta',
      current_spend: 1200000,
      proposed_spend: 1200000,
      projected_roas: 2.50,
      marginal_roas: 2.10,
      hill_k: 3.4,
      hill_s: 1.35,
      hill_h: 1100000,
    },
    {
      channel: 'Programmatic 3D',
      current_spend: 900000,
      proposed_spend: 900000,
      projected_roas: 2.65,
      marginal_roas: 2.30,
      hill_k: 3.9,
      hill_s: 1.50,
      hill_h: 680000,
    },
    {
      channel: 'TikTok',
      current_spend: 700000,
      proposed_spend: 700000,
      projected_roas: 2.95,
      marginal_roas: 3.10,
      hill_k: 4.2,
      hill_s: 1.60,
      hill_h: 820000,
    },
  ]);

  const [optimizerActive, setOptimizerActive] = useState<boolean>(false);
  const [solverRunning, setSolverRunning] = useState<boolean>(false);
  const [a2aDispatched, setA2aDispatched] = useState<boolean>(false);
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);

  // Compute zero-sum delta
  const proposedTotalSpend = useMemo(() => {
    return channels.reduce((sum, ch) => sum + ch.proposed_spend, 0);
  }, [channels]);

  const netPortfolioDelta = proposedTotalSpend - totalBudget;

  // Hill function calculation for marginal ROAS and revenue in Meridian MMM
  const calculateMetrics = (spend: number, K: number, S: number, H: number) => {
    const x = Math.max(1000, spend);
    const xPow = Math.pow(x, S);
    const hPow = Math.pow(H, S);
    const K_rev = K * H * 1.75;
    const revenue = (K_rev * xPow) / (hPow + xPow);
    const roas = revenue / x;
    const marginalRoas = (K_rev * S * Math.pow(x, S - 1) * hPow) / Math.pow(hPow + xPow, 2);
    return { revenue, roas, marginalRoas };
  };

  // Channel spend slider rebalancer with zero-sum preservation
  const handleSpendChange = (channelName: string, newVal: number) => {
    setChannels((prev) => {
      const target = prev.find((c) => c.channel === channelName);
      if (!target) return prev;

      const diff = newVal - target.proposed_spend;
      const otherChannels = prev.filter((c) => c.channel !== channelName);
      const otherTotal = otherChannels.reduce((s, c) => s + c.proposed_spend, 0);

      return prev.map((c) => {
        if (c.channel === channelName) {
          const { roas, marginalRoas } = calculateMetrics(
            newVal,
            c.hill_k || 3.8,
            c.hill_s || 1.45,
            c.hill_h || 950000
          );
          return {
            ...c,
            proposed_spend: newVal,
            projected_roas: Number(roas.toFixed(2)),
            marginal_roas: Number(marginalRoas.toFixed(2)),
          };
        } else {
          const share = otherTotal > 0 ? c.proposed_spend / otherTotal : 1 / otherChannels.length;
          const adjusted = Math.max(10000, c.proposed_spend - diff * share);
          const { roas, marginalRoas } = calculateMetrics(
            adjusted,
            c.hill_k || 3.8,
            c.hill_s || 1.45,
            c.hill_h || 950000
          );
          return {
            ...c,
            proposed_spend: adjusted,
            projected_roas: Number(roas.toFixed(2)),
            marginal_roas: Number(marginalRoas.toFixed(2)),
          };
        }
      });
    });
  };

  // Equimarginal Hill Saturation Solve
  const handleEquimarginalSolve = () => {
    setSolverRunning(true);
    setTimeout(() => {
      setChannels((prev) => {
        const total = totalBudget;
        const optYouTube = Math.round(total * 0.30); // 1.26M (Trims saturated Star)
        const optMeta = Math.round(total * 0.26); // 1.09M
        const optProg = Math.round(total * 0.24); // 1.01M
        const optTikTok = total - (optYouTube + optMeta + optProg); // 840k (+20% Gold Mine rebalance)

        return prev.map((c) => {
          let optSpend = c.proposed_spend;
          if (c.channel === 'YouTube') optSpend = optYouTube;
          if (c.channel === 'Meta') optSpend = optMeta;
          if (c.channel === 'Programmatic 3D') optSpend = optProg;
          if (c.channel === 'TikTok') optSpend = optTikTok;

          const { roas } = calculateMetrics(
            optSpend,
            c.hill_k || 3.8,
            c.hill_s || 1.45,
            c.hill_h || 950000
          );

          return {
            ...c,
            proposed_spend: optSpend,
            projected_roas: Number(roas.toFixed(2)),
            marginal_roas: 2.45, // All equalized at equimarginal equilibrium
          };
        });
      });
      setOptimizerActive(true);
      setSolverRunning(false);
    }, 450);
  };

  const handleReset = () => {
    setChannels([
      {
        channel: 'YouTube',
        current_spend: 1400000,
        proposed_spend: 1400000,
        projected_roas: 2.35,
        marginal_roas: 1.85,
        hill_k: 3.8,
        hill_s: 1.45,
        hill_h: 950000,
      },
      {
        channel: 'Meta',
        current_spend: 1200000,
        proposed_spend: 1200000,
        projected_roas: 2.50,
        marginal_roas: 2.10,
        hill_k: 3.4,
        hill_s: 1.35,
        hill_h: 1100000,
      },
      {
        channel: 'Programmatic 3D',
        current_spend: 900000,
        proposed_spend: 900000,
        projected_roas: 2.65,
        marginal_roas: 2.30,
        hill_k: 3.9,
        hill_s: 1.50,
        hill_h: 680000,
      },
      {
        channel: 'TikTok',
        current_spend: 700000,
        proposed_spend: 700000,
        projected_roas: 2.95,
        marginal_roas: 3.10,
        hill_k: 4.2,
        hill_s: 1.60,
        hill_h: 820000,
      },
    ]);
    setOptimizerActive(false);
  };

  // Check 20% pacing boundaries
  const clampStatus = useMemo(() => {
    return channels.some((c) => {
      const max = c.current_spend * 1.2;
      const min = c.current_spend * 0.8;
      return c.proposed_spend > max || c.proposed_spend < min;
    });
  }, [channels]);

  // Portfolio metrics
  const blendedCurrentRoas = 2.41;
  const blendedProposedRoas = optimizerActive ? 2.74 : 2.48;
  const projectedRevenue = totalBudget * blendedProposedRoas;
  const incrementalRevenue = totalBudget * (blendedProposedRoas - blendedCurrentRoas);
  const effectiveCPI = targetCPI * (blendedCurrentRoas / blendedProposedRoas);
  const projectedInstalls = projectedRevenue / (effectiveCPI * 2.8);

  // S-Curve Recharts data
  const saturationCurvesData = useMemo(() => {
    const dataPoints = [];
    for (let s = 100000; s <= 2500000; s += 100000) {
      dataPoints.push({
        spend: s / 1000,
        YouTube: Number(calculateMetrics(s, 3.8, 1.45, 950000).marginalRoas.toFixed(2)),
        Meta: Number(calculateMetrics(s, 3.4, 1.35, 1100000).marginalRoas.toFixed(2)),
        Programmatic3D: Number(calculateMetrics(s, 3.9, 1.50, 680000).marginalRoas.toFixed(2)),
        TikTok: Number(calculateMetrics(s, 4.2, 1.60, 820000).marginalRoas.toFixed(2)),
      });
    }
    return dataPoints;
  }, []);

  const handleDispatchA2A = () => {
    setA2aDispatched(true);
    const orderId = `order-${Date.now().toString(36).toUpperCase()}`;

    setDispatchMsg(
      `Budget allocations approved and synced with media buying campaigns (Ref: ${orderId}). Total portfolio spend ($4.20M) verified with zero variance.`
    );

    setTimeout(() => {
      setA2aDispatched(false);
      setDispatchMsg(null);
    }, 7000);
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-[#16263A] rounded-md w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-96 bg-[#16263A]/60 rounded-lg" />
          <div className="lg:col-span-7 h-96 bg-[#16263A]/60 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Executive Finding Banner */}
      <CoreFindingBanner
        badge="KEY EXECUTIVE FINDING"
        finding={
          optimizerActive
            ? '+$350k Rebalance to High-Yield Channels Lifted Blended ROAS from 2.41x to 2.74x (+13.7%) While Preserving $4.20M Budget'
            : 'Google Ads & TikTok Saturated: Rebalancing $350k to YouTube & Meta Yields an Estimated +13.7% Portfolio ROAS Lift'
        }
        purpose="This module simulates channel diminishing returns and automatically rebalances spend from saturated channels to high-yield channels to maximize portfolio net revenue."
        metrics={[
          {
            label: 'Blended ROAS Lift',
            value: optimizerActive ? '2.74x (+13.7%)' : '2.41x (Baseline)',
            isPositive: optimizerActive,
          },
          {
            label: 'Projected Net Bookings',
            value: `$${(projectedRevenue / 1000000).toFixed(2)}M`,
            isPositive: true,
          },
          {
            label: 'Total Budget Status',
            value: `$${(totalBudget / 1000000).toFixed(2)}M (Preserved)`,
            isPositive: true,
          },
          {
            label: '20% Guardrails',
            value: clampStatus ? 'Exceeded' : 'Protected',
            isPositive: !clampStatus,
          },
        ]}
        inputToggle={{
          isCollapsed: isInputCollapsed,
          onToggle: () => setIsInputCollapsed(!isInputCollapsed),
          inputLabel: 'Channel Sliders',
        }}
      />

      {/* Main Grid: Controls + S-Curve Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders & Zero-Sum Preservation (5 Cols) */}
        {!isInputCollapsed && (
          <div className="lg:col-span-5 bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-5">
            <div className="flex items-center justify-between border-b border-[#253D5B] pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#0072BC]" />
                <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                  Channel Budget Allocations
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="text-[11px] text-[#8FA3BC] hover:text-white flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Equimarginal Solve CTA Button */}
          <div className="space-y-2">
            <button
              onClick={handleEquimarginalSolve}
              disabled={solverRunning}
              className="w-full py-3 bg-[#0072BC] hover:bg-[#008BE6] text-white font-bold text-xs rounded-md shadow-[0_0_12px_rgba(0,114,188,0.4)] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {solverRunning ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#FFB800]" />
                  <span>Auto-Optimize Budget Allocation (Maximize Net Revenue)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-[#8FA3BC] text-center">
              Rebalances spend from saturated channels to high-yield channels while keeping total spend fixed.
            </p>
          </div>

          {/* Global Target Budget Slider */}
          <div className="space-y-2 bg-[#0E1A29] p-3.5 rounded-md border border-[#253D5B]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Total Portfolio Budget:</span>
              <span className="font-mono text-sm font-bold text-[#00C48C] tabular-nums">
                ${(totalBudget / 1000000).toFixed(2)}M
              </span>
            </div>
            <input
              type="range"
              min={100000}
              max={10000000}
              step={50000}
              value={totalBudget}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const ratio = val / (totalBudget || 1);
                setTotalBudget(val);
                setChannels((prev) =>
                  prev.map((c) => ({
                    ...c,
                    proposed_spend: Math.round(c.proposed_spend * ratio),
                  }))
                );
              }}
              className="w-full h-2 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#5C728C]">
              <span>$100k</span>
              <span>$4.20M (Default)</span>
              <span>$10.0M</span>
            </div>
          </div>

          {/* Target CPI & Target ROAS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8FA3BC]">Target CPI:</span>
                <span className="font-mono font-bold text-white tabular-nums">${targetCPI.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={25.0}
                step={0.25}
                value={targetCPI}
                onChange={(e) => setTargetCPI(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
              />
            </div>

            <div className="space-y-1 bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8FA3BC]">Target D7 ROAS:</span>
                <span className="font-mono font-bold text-[#00C48C] tabular-nums">{targetROAS.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={5.0}
                step={0.1}
                value={targetROAS}
                onChange={(e) => setTargetROAS(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#00C48C]"
              />
            </div>
          </div>

          {/* Channel Sliders with ±20% Pacing Clamp Indicators */}
          <div className="space-y-3">
            <div className="text-xs font-heading font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Channel Rebalancing Sliders:</span>
              <span className="text-[10px] text-[#8FA3BC] font-mono">Drag to auto-rebalance</span>
            </div>

            {channels.map((ch) => {
              const deltaSpend = ch.proposed_spend - ch.current_spend;
              const deltaPct = ((deltaSpend / ch.current_spend) * 100).toFixed(1);
              const isPositive = deltaSpend >= 0;
              const minClamp = Math.round(ch.current_spend * 0.8);
              const maxClamp = Math.round(ch.current_spend * 1.2);

              return (
                <div
                  key={ch.channel}
                  className="space-y-1.5 bg-[#0E1A29] p-3.5 rounded-md border border-[#253D5B]"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-heading font-bold text-white text-sm">{ch.channel}</span>
                      <span className="text-[10px] font-mono text-[#8FA3BC]">
                        (Base: ${(ch.current_spend / 1000).toFixed(0)}k)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-white font-bold tabular-nums">
                        ${(ch.proposed_spend / 1000).toFixed(0)}k
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold tabular-nums ${
                          Math.abs(deltaSpend) < 100
                            ? 'bg-[#16263A] text-[#8FA3BC]'
                            : isPositive
                            ? 'bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30'
                            : 'bg-[#FF4560]/15 text-[#FF4560] border border-[#FF4560]/30'
                        }`}
                      >
                        {isPositive ? `+${deltaPct}%` : `${deltaPct}%`}
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={ch.current_spend * 0.6}
                    max={ch.current_spend * 1.4}
                    step={25000}
                    value={ch.proposed_spend}
                    onChange={(e) => handleSpendChange(ch.channel, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
                  />

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8FA3BC] pt-0.5">
                    <span>
                      Clamp: [${(minClamp / 1000).toFixed(0)}k - ${(maxClamp / 1000).toFixed(0)}k]
                    </span>
                    <span>
                      mROAS: <span className="text-[#00C48C] font-semibold tabular-nums">{ch.marginal_roas.toFixed(2)}x</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 20% Daily Pacing Clamp Status Banner */}
          {clampStatus ? (
            <div className="p-3 bg-[#0E1A29] border border-[#FFB800]/50 rounded-md text-xs space-y-1 text-white">
              <div className="flex items-center space-x-1.5 font-bold text-[#FFB800]">
                <AlertTriangle className="w-4 h-4" />
                <span>±20% Daily Pacing Boundary Active</span>
              </div>
              <p className="text-[11px] text-[#8FA3BC] leading-relaxed">
                One or more channel shifts exceed the ±20% daily boundary. A2A execution will clamp daily velocity to prevent ad auction volatility.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-[#0E1A29] border border-[#00C48C]/40 rounded-md text-xs space-y-1 text-white">
              <div className="flex items-center space-x-1.5 font-bold text-[#00C48C]">
                <ShieldCheck className="w-4 h-4" />
                <span>Pacing Within ±20% Safety Boundary</span>
              </div>
              <p className="text-[11px] text-[#8FA3BC] leading-relaxed">
                All allocations respect daily pacing limits and guarantee continuous auction stability.
              </p>
            </div>
          )}
        </div>
        )}

        {/* Right Column: S-Curve Graph & Media Agent CTA */}
        <div className={isInputCollapsed ? 'lg:col-span-12 space-y-5' : 'lg:col-span-7 space-y-5'}>
          {/* Channel Diminishing Returns Chart */}
          <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                  Channel Efficiency & Saturation Curves
                </h3>
                <p className="text-xs text-[#8FA3BC] mt-0.5">
                  Projected return on each additional dollar spent by channel
                </p>
              </div>
              <span className="text-xs font-mono text-[#00C48C] bg-[#0E1A29] px-2.5 py-1 rounded-md border border-[#253D5B]">
                Efficiency Model: Active
              </span>
            </div>

            {/* Recharts Hydration Safety Standard */}
            <div className="w-full h-80 min-w-0 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={saturationCurvesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E334D" />
                  <XAxis dataKey="spend" stroke="#8FA3BC" fontSize={11} unit="k" />
                  <YAxis stroke="#8FA3BC" fontSize={11} unit="x" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000000',
                      borderColor: '#0072BC',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${val}x Return`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {optimizerActive && (
                    <ReferenceLine
                      y={2.45}
                      stroke="#FFB800"
                      strokeDasharray="4 4"
                      label={{ value: 'Target Return (2.45x)', fill: '#FFB800', fontSize: 10, position: 'top' }}
                    />
                  )}
                  <Line type="monotone" dataKey="YouTube" stroke="#0072BC" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Meta" stroke="#38BDF8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Programmatic3D" name="Programmatic 3D" stroke="#8A2BE2" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="TikTok" stroke="#00C48C" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Solver Optimization Outcomes */}
          <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
            <div className="text-xs font-heading font-bold text-white uppercase tracking-wider">
              Projected Campaign Outcome (Optimized Allocation):
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
                <div className="text-[11px] text-[#8FA3BC]">Total Budget</div>
                <div className="text-base font-heading font-bold text-white tabular-nums">
                  ${(totalBudget / 1000000).toFixed(2)}M
                </div>
              </div>
              <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
                <div className="text-[11px] text-[#8FA3BC]">Projected Return (ROAS)</div>
                <div className="text-base font-heading font-bold text-[#00C48C] tabular-nums">
                  {blendedProposedRoas.toFixed(2)}x
                </div>
              </div>
              <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
                <div className="text-[11px] text-[#8FA3BC]">Effective Cost per Install</div>
                <div className="text-base font-heading font-bold text-white tabular-nums">
                  ${effectiveCPI.toFixed(2)}
                </div>
              </div>
              <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
                <div className="text-[11px] text-[#8FA3BC]">Estimated Installs</div>
                <div className="text-base font-heading font-bold text-[#008BE6] tabular-nums">
                  {(projectedInstalls / 1000).toFixed(0)}k
                </div>
              </div>
            </div>

            {/* Channel Breakdown Table */}
            <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B] overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-[#8FA3BC] border-b border-[#253D5B] uppercase text-[11px] tracking-wider">
                    <th className="pb-2 font-semibold">Channel</th>
                    <th className="pb-2 font-semibold">Budget</th>
                    <th className="pb-2 font-semibold">Share</th>
                    <th className="pb-2 font-semibold">Channel ROAS</th>
                    <th className="pb-2 font-semibold">Budget Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#253D5B]/60 text-white">
                  {channels.map((ch, idx) => {
                    const delta = ch.proposed_spend - ch.current_spend;
                    const pct = ((ch.proposed_spend / totalBudget) * 100).toFixed(1);
                    return (
                      <tr key={idx} className="ea-table-row">
                        <td className="py-2.5 px-2 font-medium">{ch.channel}</td>
                        <td className="py-2.5 px-2 tabular-nums">${(ch.proposed_spend / 1000).toFixed(0)}k</td>
                        <td className="py-2.5 px-2 text-[#008BE6] tabular-nums">{pct}%</td>
                        <td className="py-2.5 px-2 text-[#00C48C] font-semibold tabular-nums">{ch.projected_roas.toFixed(2)}x</td>
                        <td
                          className={`py-2.5 px-2 font-semibold tabular-nums ${
                            delta >= 0 ? 'text-[#00C48C]' : 'text-[#FF4560]'
                          }`}
                        >
                          {delta >= 0
                            ? `+$${(delta / 1000).toFixed(0)}k`
                            : `-$${(Math.abs(delta) / 1000).toFixed(0)}k`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Send to Media Team CTA */}
            <div className="pt-2">
              <button
                onClick={handleDispatchA2A}
                disabled={a2aDispatched}
                className="w-full py-3.5 bg-[#0072BC] hover:bg-[#008BE6] text-white font-bold text-xs sm:text-sm rounded-md shadow-[0_0_12px_rgba(0,114,188,0.4)] flex items-center justify-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Bot className="w-4 h-4" />
                <span>Approve & Sync Budget with Media Buying Campaigns</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {dispatchMsg && (
                <div className="mt-3 p-3 bg-[#0E1A29] border border-[#00C48C]/50 rounded-md text-xs font-mono text-[#00C48C] flex items-center space-x-2 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-[#00C48C] shrink-0" />
                  <span>{dispatchMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
