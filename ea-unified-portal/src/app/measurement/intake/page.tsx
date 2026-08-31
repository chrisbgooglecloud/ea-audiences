'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFranchise } from '@/context';
import { Franchise } from '@/types';
import { EA_FRANCHISES } from '@/lib/constants';
import { simulateCampaignIntake } from '@/lib/api';
import { CoreFindingBanner } from '@/components/measurement/CoreFindingBanner';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowRight,
  RotateCcw,
  BarChart3,
  Bot,
  Calendar,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';


export default function IntakePage() {
  const { currentFranchise, setCurrentFranchise } = useFranchise();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isInputCollapsed, setIsInputCollapsed] = useState<boolean>(false);
  const [campaignName, setCampaignName] = useState<string>('EA FC 27 TOTY Mid-Season Push');
  const [targetCohort, setTargetCohort] = useState<string>('GEN_Z_CORE');
  const [flightStart, setFlightStart] = useState<string>('2026-10-24');
  const [flightEnd, setFlightEnd] = useState<string>('2026-10-27');
  const [totalBudget, setTotalBudget] = useState<number>(1500000);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'YouTube',
    'TikTok',
    'Meta',
    'Twitch',
    'Google Ads',
  ]);
  const [targetCPI, setTargetCPI] = useState<number>(4.12);
  const [targetROAS, setTargetROAS] = useState<number>(3.42);
  const [applyMitigation, setApplyMitigation] = useState<boolean>(false);
  const [simulationCount, setSimulationCount] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastSimulatedTime, setLastSimulatedTime] = useState<string | null>(null);

  const handleRunSimulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSimulating(true);
    setTimeout(() => {
      setSimulationCount((c) => c + 1);
      setIsSimulating(false);
      setLastSimulatedTime(new Date().toLocaleTimeString());
      setIsInputCollapsed(true);
    }, 550);
  };

  // Available options
  const cohortOptions = [
    { id: 'GEN_Z_CORE', label: 'Gen Z Core (Competitive & Social)' },
    { id: 'LAPSED_WHALES', label: 'Lapsed Whales (High Monetization Potential)' },
    { id: 'COMPETITIVE_ESPORTS', label: 'Competitive eSports Grinders' },
    { id: 'CASUAL_SOCIAL', label: 'Casual & Social Players' },
    { id: 'ALL_EA_PLAYERS', label: 'All Unified EA ID Graph' },
  ];

  const availableChannels = ['YouTube', 'TikTok', 'Meta', 'Twitch', 'Google Ads'];

  const toggleChannel = (ch: string) => {
    if (selectedChannels.includes(ch)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter((c) => c !== ch));
      }
    } else {
      setSelectedChannels([...selectedChannels, ch]);
    }
  };

  // Run simulation calculation
  const simulationResult = useMemo(() => {
    return simulateCampaignIntake({
      campaign_id: 'camp-fc27-toty-001',
      campaign_name: campaignName,
      franchise: currentFranchise,
      target_cohort: targetCohort,
      flight_start: flightStart,
      flight_end: flightEnd,
      total_budget: totalBudget,
      channels: selectedChannels,
      target_cpi: targetCPI,
      target_roas: targetROAS,
      apply_mitigation: applyMitigation,
    });
  }, [
    campaignName,
    currentFranchise,
    targetCohort,
    flightStart,
    flightEnd,
    totalBudget,
    selectedChannels,
    targetCPI,
    targetROAS,
    applyMitigation,
    simulationCount,
  ]);

  const { kpi_prediction, conflict_data, channel_breakdown } = simulationResult;
  const isAmberCollision = conflict_data?.status === 'AMBER_COLLISION_DETECTED';
  const isMitigated = conflict_data?.status === 'MITIGATED_COLLISION_CLEARED';

  const handleApplyMitigation = () => {
    setFlightStart('2026-10-27');
    setFlightEnd('2026-11-07');
    setApplyMitigation(true);
    setSimulationCount((c) => c + 1);
  };

  const handleRevertMitigation = () => {
    setFlightStart('2026-10-24');
    setFlightEnd('2026-10-27');
    setApplyMitigation(false);
    setSimulationCount((c) => c + 1);
  };

  const handleResetForm = () => {
    setCampaignName('EA FC 27 TOTY Mid-Season Push');
    setTargetCohort('GEN_Z_CORE');
    setFlightStart('2026-10-24');
    setFlightEnd('2026-10-27');
    setTotalBudget(1500000);
    setSelectedChannels(['YouTube', 'TikTok', 'Meta', 'Twitch', 'Google Ads']);
    setTargetCPI(4.12);
    setTargetROAS(3.42);
    setApplyMitigation(false);
    setSimulationCount((c) => c + 1);
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
      {/* Executive Core Finding Banner */}
      <CoreFindingBanner
        badge="KEY EXECUTIVE FINDING"
        finding={
          isMitigated
            ? 'Flight Shift Applied: +3 Day Offset Eliminated 100% of Collision Risk & Recovered $420k Net Revenue'
            : '42.1% Audience Collision Detected: Oct 24–27 EA FC TOTY Overlaps with Apex S26, Risking $185k in Ad Fatigue'
        }
        purpose="This module ingests media brief parameters, predicts cross-channel returns, and automatically checks for audience overlap against active EA franchise flights to prevent ad fatigue."
        metrics={[
          {
            label: 'Collision Status',
            value: isMitigated ? 'Protected' : 'Overlap Risk',
            isPositive: isMitigated,
          },
          {
            label: 'Projected Net ROAS',
            value: `${kpi_prediction.day7_roas.toFixed(2)}x`,
            isPositive: true,
          },
          {
            label: 'Ad Fatigue Savings',
            value: isMitigated ? '+$185,000' : '-$185,000',
            isPositive: isMitigated,
          },
          {
            label: 'Active Reach',
            value: `${(kpi_prediction.projected_installs * 4.2 / 1000000).toFixed(1)}M Gamers`,
            isPositive: true,
          },
        ]}
        inputToggle={{
          isCollapsed: isInputCollapsed,
          onToggle: () => setIsInputCollapsed(!isInputCollapsed),
          inputLabel: 'Brief Inputs',
        }}
      />

      {/* Main Grid: Form (5 Cols) + Prediction & Mitigation Hub (7 or 12 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Brief Submission Form (5 Cols) */}
        {!isInputCollapsed && (
          <div className="lg:col-span-5 bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#253D5B] pb-3">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-[#0072BC]" />
                <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                  Campaign Brief Intake
                </h2>
              </div>
              <button
                onClick={handleResetForm}
                className="text-[11px] text-[#8FA3BC] hover:text-white flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
            </button>
          </div>

          <form
            onSubmit={handleRunSimulation}
            className="space-y-4 text-xs"
          >
            {/* Campaign Name */}
            <div className="space-y-1">
              <label className="text-white font-medium">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full bg-[#0E1A29] border border-[#253D5B] focus:border-[#0072BC] rounded-md px-3 py-2 text-white font-medium focus:outline-none"
              />
            </div>

            {/* Franchise & Target Cohort */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-white font-medium">Target Franchise</label>
                <select
                  value={currentFranchise}
                  onChange={(e) => setCurrentFranchise(e.target.value as Franchise)}
                  className="w-full bg-[#0E1A29] border border-[#253D5B] focus:border-[#0072BC] rounded-md px-2.5 py-2 text-[#38BDF8] font-semibold focus:outline-none cursor-pointer"
                >
                  {EA_FRANCHISES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white font-medium">Target Cohort</label>
                <select
                  value={targetCohort}
                  onChange={(e) => setTargetCohort(e.target.value)}
                  className="w-full bg-[#0E1A29] border border-[#253D5B] focus:border-[#0072BC] rounded-md px-2.5 py-2 text-white focus:outline-none cursor-pointer"
                >
                  {cohortOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Flight Dates */}
            <div className="space-y-1 bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
              <div className="flex items-center justify-between mb-1">
                <label className="text-white font-medium flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0072BC]" />
                  <span>Flight Schedule</span>
                </label>
                <span className="text-[10px] font-mono text-[#8FA3BC] tabular-nums">
                  {flightStart} → {flightEnd}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#5C728C] block mb-0.5">Start Date</span>
                  <input
                    type="date"
                    value={flightStart}
                    onChange={(e) => {
                      setFlightStart(e.target.value);
                      setApplyMitigation(false);
                    }}
                    className="w-full bg-[#16263A] border border-[#253D5B] text-white rounded-md px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#0072BC]"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#5C728C] block mb-0.5">End Date</span>
                  <input
                    type="date"
                    value={flightEnd}
                    onChange={(e) => {
                      setFlightEnd(e.target.value);
                      setApplyMitigation(false);
                    }}
                    className="w-full bg-[#16263A] border border-[#253D5B] text-white rounded-md px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-[#0072BC]"
                  />
                </div>
              </div>
            </div>

            {/* Total Budget Slider */}
            <div className="space-y-1.5 bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
              <div className="flex items-center justify-between">
                <label className="text-white font-medium flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#0072BC]" />
                  <span>Total Budget</span>
                </label>
                <span className="font-mono text-[#38BDF8] font-bold text-sm tabular-nums">
                  ${(totalBudget / 1000000).toFixed(2)}M
                </span>
              </div>
              <input
                type="range"
                min={100000}
                max={10000000}
                step={50000}
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#5C728C]">
                <span>$100k</span>
                <span>$1.5M (Default)</span>
                <span>$10.0M</span>
              </div>
            </div>

            {/* Target CPI & ROAS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 bg-[#0E1A29] p-2.5 rounded-md border border-[#253D5B]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8FA3BC] text-[11px]">Target CPI:</span>
                  <span className="font-mono font-bold text-white tabular-nums">${targetCPI.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={15.0}
                  step={0.1}
                  value={targetCPI}
                  onChange={(e) => setTargetCPI(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
                />
              </div>

              <div className="space-y-1 bg-[#0E1A29] p-2.5 rounded-md border border-[#253D5B]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8FA3BC] text-[11px]">Target ROAS:</span>
                  <span className="font-mono font-bold text-[#38BDF8] tabular-nums">{targetROAS.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={6.0}
                  step={0.1}
                  value={targetROAS}
                  onChange={(e) => setTargetROAS(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
                />
              </div>
            </div>

            {/* Target Channels Multi-Select */}
            <div className="space-y-2">
              <label className="text-white font-medium block">Allocated Channels</label>
              <div className="flex flex-wrap gap-2">
                {availableChannels.map((ch) => {
                  const isSelected = selectedChannels.includes(ch);
                  return (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#0072BC]/20 text-[#38BDF8] border-[#0072BC] shadow-sm'
                          : 'bg-[#0E1A29] text-[#8FA3BC] border-[#253D5B] hover:border-[#0072BC]'
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Run Simulation CTA */}
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-3 bg-[#0072BC] hover:bg-[#008BE6] disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-[0_0_12px_rgba(0,114,188,0.4)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSimulating ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isSimulating ? 'Simulating Media Campaign...' : 'Run Predictive Intake Simulation'}</span>
            </button>
          </form>
        </div>
        )}

        {/* Right Column: Conflict Banner, KPI Grid, Channel Yield Chart */}
        <div className={isInputCollapsed ? 'lg:col-span-12 space-y-5' : 'lg:col-span-7 space-y-5'}>
          {lastSimulatedTime && (
            <div className="p-3 bg-[#0E1A29] border border-[#0072BC]/50 rounded-md text-xs text-[#38BDF8] flex items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#0072BC]" />
                <span>
                  Simulation updated for <strong className="text-white">{campaignName}</strong> (${(totalBudget / 1000000).toFixed(2)}M budget across {selectedChannels.length} channels).
                </span>
              </div>
              <span className="text-[10px] text-[#8FA3BC] font-mono">Simulated at {lastSimulatedTime}</span>
            </div>
          )}

          {/* Amber Conflict Alert Banner or Emerald Mitigation Banner */}
          {isAmberCollision && conflict_data && (
            <div className="bg-[#16263A] border-2 border-[#FFB800] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-md bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/30 font-bold">
                        High-Risk Collision Detected
                      </span>
                      <span className="text-xs font-semibold text-[#FFB800]">
                        Oct 24–27 Flight Window
                      </span>
                    </div>
                    <h3 className="text-base font-heading font-bold text-white mt-1">
                      Cross-Franchise Audience Collision: EA FC 27 vs Apex Legends Season 26
                    </h3>
                    <p className="text-xs text-[#8FA3BC] mt-1 leading-relaxed">
                      Heavy overlapping EA ID players will receive redundant ad impressions across YouTube & TikTok, triggering severe ad fatigue suppression and cannibalizing net bookings.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conflict Metrics Ribbon */}
              <div className="grid grid-cols-3 gap-3 bg-[#0E1A29] p-3.5 rounded-md border border-[#253D5B] text-xs font-mono">
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Shared EA ID Overlap</span>
                  <span className="text-base font-bold text-[#FFB800] tabular-nums">
                    {conflict_data.shared_ea_id_overlap_pct}%
                  </span>
                  <span className="text-[10px] text-[#5C728C] block">(1,280,000 players)</span>
                </div>
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Fatigue Suppression</span>
                  <span className="text-base font-bold text-[#FF4560] tabular-nums">
                    -{conflict_data.ad_fatigue_suppression_penalty_pct}%
                  </span>
                  <span className="text-[10px] text-[#5C728C] block">Impression Penalty</span>
                </div>
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Net Bookings Risk</span>
                  <span className="text-base font-bold text-[#FF4560] tabular-nums">
                    -${(conflict_data.net_bookings_risk_usd / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[10px] text-[#5C728C] block">Revenue at Risk</span>
                </div>
              </div>

              {/* One-Click Mitigation Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-[#FFB800] flex items-center space-x-1.5">
                  <Bot className="w-4 h-4 text-[#FFB800] shrink-0" />
                  <span>AI Recommended Action: Shift flight +3 days (Oct 27–Nov 07) & suppress heavy Apex players.</span>
                </div>
                <button
                  onClick={handleApplyMitigation}
                  className="w-full sm:w-auto px-4 py-2 bg-[#FFB800] hover:bg-[#FFA500] text-black font-bold text-xs rounded-md shadow-md transition-colors flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Apply AI Recommendation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {isMitigated && (
            <div className="bg-[#16263A] border-2 border-[#00C48C] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4 animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-md bg-[#00C48C]/20 text-[#00C48C] border border-[#00C48C]/40 shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#00C48C]/20 text-[#00C48C] border border-[#00C48C]/30 font-bold">
                        Collision Resolved & Cleared
                      </span>
                      <span className="text-xs font-semibold text-[#00C48C]">
                        Shifted Flight: Oct 27 – Nov 07
                      </span>
                    </div>
                    <h3 className="text-base font-heading font-bold text-white mt-1">
                      Cross-Franchise Audience Isolation Enforced (+3 Day Shift)
                    </h3>
                    <p className="text-xs text-[#8FA3BC] mt-1 leading-relaxed">
                      Fatigue suppression penalty successfully dropped from 14.5% to 0.0%. Overlap audience negative targeting active. Full revenue recovery confirmed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Resolved Metrics Ribbon */}
              <div className="grid grid-cols-3 gap-3 bg-[#0E1A29] p-3.5 rounded-md border border-[#253D5B] text-xs font-mono">
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Suppression Penalty</span>
                  <span className="text-base font-bold text-[#00C48C] tabular-nums">0.0%</span>
                  <span className="text-[10px] text-[#00C48C] block">Cleared</span>
                </div>
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Net Bookings Recovered</span>
                  <span className="text-base font-bold text-[#00C48C] tabular-nums">
                    +${(kpi_prediction.bookings_recovery / 1000).toFixed(0)}k
                  </span>
                  <span className="text-[10px] text-[#00C48C] block">100% Protection</span>
                </div>
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Updated Net Bookings</span>
                  <span className="text-base font-bold text-white tabular-nums">
                    ${(kpi_prediction.current_net_bookings / 1000000).toFixed(2)}M
                  </span>
                  <span className="text-[10px] text-[#8FA3BC] block">Maximized Yield</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#00C48C] font-mono flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Negative audience suppression rules active in Google Ads & TikTok</span>
                </span>
                <button
                  onClick={handleRevertMitigation}
                  className="text-xs text-[#8FA3BC] hover:text-white flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Re-test Collision</span>
                </button>
              </div>
            </div>
          )}

          {/* 4 Core KPI Prediction Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] p-4 rounded-lg shadow-md space-y-1">
              <div className="flex items-center justify-between text-[#8FA3BC]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Projected Installs
                </span>
                <Users className="w-4 h-4 text-[#0072BC]" />
              </div>
              <div className="text-xl font-heading font-bold text-white tabular-nums">
                {(kpi_prediction.projected_installs / 1000).toFixed(0)}k
              </div>
              <span className="text-[10px] text-[#8FA3BC] block font-mono">364,000 installs</span>
            </div>

            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] p-4 rounded-lg shadow-md space-y-1">
              <div className="flex items-center justify-between text-[#8FA3BC]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Blended CPI
                </span>
                <Target className="w-4 h-4 text-[#00C48C]" />
              </div>
              <div className="text-xl font-heading font-bold text-[#00C48C] tabular-nums">
                ${kpi_prediction.blended_cpi.toFixed(2)}
              </div>
              <span className="text-[10px] text-[#00C48C] block font-mono">Target Met</span>
            </div>

            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] p-4 rounded-lg shadow-md space-y-1">
              <div className="flex items-center justify-between text-[#8FA3BC]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Day-7 ROAS
                </span>
                <TrendingUp className="w-4 h-4 text-[#FFB800]" />
              </div>
              <div className="text-xl font-heading font-bold text-[#FFB800] tabular-nums">
                {kpi_prediction.day7_roas.toFixed(2)}x
              </div>
              <span className="text-[10px] text-[#8FA3BC] block font-mono">Benchmark: 2.80x</span>
            </div>

            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] p-4 rounded-lg shadow-md space-y-1">
              <div className="flex items-center justify-between text-[#8FA3BC]">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  Net Bookings
                </span>
                <DollarSign className="w-4 h-4 text-[#00C48C]" />
              </div>
              <div
                className={`text-xl font-heading font-bold tabular-nums ${
                  isAmberCollision ? 'text-[#FF4560]' : 'text-[#00C48C]'
                }`}
              >
                ${(kpi_prediction.current_net_bookings / 1000000).toFixed(2)}M
              </div>
              <span className="text-[10px] text-[#8FA3BC] block font-mono">
                {isAmberCollision
                  ? 'Collision: -$420k Penalty'
                  : isMitigated
                  ? '+$420k Recovered'
                  : 'Baseline: $4.71M'}
              </span>
            </div>
          </div>

          {/* Channel Yield Breakdown Chart */}
          <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-[#0072BC]" />
                  <span>Channel Allocation & Yield Breakdown</span>
                </h3>
                <p className="text-xs text-[#8FA3BC] mt-0.5">
                  Projected spend vs predicted net bookings by channel
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#8FA3BC] bg-[#0E1A29] px-2.5 py-1 rounded-md border border-[#253D5B] tabular-nums">
                Total Spend: ${(totalBudget / 1000000).toFixed(2)}M
              </span>
            </div>

            {/* Recharts Hydration Safety Standard */}
            <div className="w-full h-64 min-w-0 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={channel_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E334D" vertical={false} />
                  <XAxis dataKey="channel" stroke="#8FA3BC" fontSize={11} />
                  <YAxis
                    stroke="#8FA3BC"
                    fontSize={11}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000000',
                      borderColor: '#0072BC',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="spend" name="Allocated Spend" fill="#0072BC" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookings" name="Projected Net Bookings" fill="#00C48C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Channel Metrics Data Table */}
            <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B] overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-[#8FA3BC] border-b border-[#253D5B] uppercase text-[11px] tracking-wider">
                    <th className="pb-2 font-semibold">Channel</th>
                    <th className="pb-2 font-semibold">Spend</th>
                    <th className="pb-2 font-semibold">Share %</th>
                    <th className="pb-2 font-semibold">Est. Installs</th>
                    <th className="pb-2 font-semibold">CPI</th>
                    <th className="pb-2 font-semibold">Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#253D5B]/60 text-white">
                  {channel_breakdown.map((item, idx) => (
                    <tr key={idx} className="ea-table-row">
                      <td className="py-2.5 px-2 font-medium">{item.channel}</td>
                      <td className="py-2.5 px-2 tabular-nums">${(item.spend / 1000).toFixed(0)}k</td>
                      <td className="py-2.5 px-2 text-[#008BE6] tabular-nums">{item.share_pct}%</td>
                      <td className="py-2.5 px-2 tabular-nums">{(item.projected_installs / 1000).toFixed(0)}k</td>
                      <td className="py-2.5 px-2 text-[#00C48C] tabular-nums">${item.cpi.toFixed(2)}</td>
                      <td className="py-2.5 px-2 font-semibold text-[#00C48C] tabular-nums">
                        ${(item.bookings / 1000).toFixed(0)}k
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
