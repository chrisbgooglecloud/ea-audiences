'use client';

import React, { useState, useEffect } from 'react';
import { useFranchise } from '@/context';
import { AttributionFeature, TacticalQuadrant } from '@/types';
import { MOCK_ATTRIBUTION_SUMMARY } from '@/lib/mock_data';
import { TACTICAL_QUADRANTS } from '@/lib/constants';
import { MathFormula, FormattedText } from '@/components/measurement/MathFormula';
import { CoreFindingBanner } from '@/components/measurement/CoreFindingBanner';
import {
  Grid,
  Sparkles,
  Filter,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Brain,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';


export default function AttributionPage() {
  const { currentFranchise } = useFranchise();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isInputCollapsed, setIsInputCollapsed] = useState<boolean>(false);
  const [selectedFranchise, setSelectedFranchise] = useState<string>(currentFranchise || 'ALL');
  const [selectedFunnel, setSelectedFunnel] = useState<string>('ALL');
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('ALL');
  const [inspectedFeature, setInspectedFeature] = useState<AttributionFeature | null>(
    MOCK_ATTRIBUTION_SUMMARY.features[0]
  );
  const [thinkingTraceOpen, setThinkingTraceOpen] = useState<boolean>(true);

  // Filter features
  const allFeatures = MOCK_ATTRIBUTION_SUMMARY.features;
  const filteredFeatures = allFeatures.filter((f) => {
    if (selectedFranchise !== 'ALL' && f.franchise !== selectedFranchise) return false;
    if (selectedFunnel !== 'ALL' && f.funnel_stage !== selectedFunnel) return false;
    if (selectedQuadrant !== 'ALL' && f.quadrant !== selectedQuadrant) return false;
    return true;
  });

  const getQuadrantMeta = (quadrantId: TacticalQuadrant) => {
    return TACTICAL_QUADRANTS.find((q) => q.id === quadrantId) || TACTICAL_QUADRANTS[0];
  };

  const cot = MOCK_ATTRIBUTION_SUMMARY.gemini_cot_reasoning;

  return (
    <div className="space-y-6">
      {/* Core Executive Finding Banner */}
      <CoreFindingBanner
        badge="KEY EXECUTIVE FINDING"
        finding="Action Combat Hooks are Saturated — Scale Gameplay Walkouts for +2.4x ROAS Headroom"
        purpose="This module maps creative elements on a 3x3 opportunity matrix to identify under-utilized high-yield features (Gold Mines) and flag over-exposed creative elements suffering from ad fatigue."
        metrics={[
          {
            label: 'Top Growth Element',
            value: 'In-Engine Walkout (+2.4x)',
            isPositive: true,
          },
          {
            label: 'Saturated Element',
            value: 'Akimbo Combat Hook (65%)',
            isPositive: false,
          },
          {
            label: 'Model Confidence',
            value: '94.2% (Calibrated)',
            isPositive: true,
          },
          {
            label: 'Tracked Events',
            value: '2.4M Impressions',
            isPositive: true,
          },
        ]}
        inputToggle={{
          isCollapsed: isInputCollapsed,
          onToggle: () => setIsInputCollapsed(!isInputCollapsed),
          inputLabel: 'Matrix Filters',
        }}
      />

      {/* Filters Bar */}
      {!isInputCollapsed && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-heading font-bold text-white uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#0072BC]" />
            <span>Matrix Attribute Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedFranchise}
              onChange={(e) => setSelectedFranchise(e.target.value)}
              className="bg-[#0E1A29] border border-[#253D5B] text-white text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#0072BC] cursor-pointer"
            >
              <option value="ALL">All Franchises</option>
              <option value="Apex Legends">Apex Legends</option>
              <option value="EA Sports FC">EA Sports FC</option>
              <option value="Battlefield">Battlefield</option>
              <option value="The Sims">The Sims</option>
            </select>

            <select
              value={selectedFunnel}
              onChange={(e) => setSelectedFunnel(e.target.value)}
              className="bg-[#0E1A29] border border-[#253D5B] text-white text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#0072BC] cursor-pointer"
            >
              <option value="ALL">All Funnels</option>
              <option value="ToFu_Exploration">ToFu (Exploration)</option>
              <option value="MoFu_Progression">MoFu (Progression)</option>
              <option value="BoFu_Conversion">BoFu (Conversion)</option>
            </select>

            <select
              value={selectedQuadrant}
              onChange={(e) => setSelectedQuadrant(e.target.value)}
              className="bg-[#0E1A29] border border-[#253D5B] text-white text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#0072BC] cursor-pointer"
            >
              <option value="ALL">All 9 Quadrants</option>
              {TACTICAL_QUADRANTS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name} ({q.action})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Grid: Scatter Matrix + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3x3 Tactical Scatter Matrix (7 Cols) */}
        <div className="lg:col-span-7 bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Grid className="w-4 h-4 text-[#0072BC]" />
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                3x3 Tactical Matrix View
              </h2>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[#8FA3BC]">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
                <span>Gold Mines</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#0072BC]" />
                <span>Core Drivers</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#FF4560]" />
                <span>Money Pits</span>
              </span>
            </div>
          </div>

          {/* Interactive Scatter Plot */}
          <div className="h-96 w-full min-w-0 min-h-0 relative">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E334D" />

                  <XAxis
                    type="number"
                    dataKey="frequency_x"
                    name="Occurrence Frequency"
                    unit="%"
                    domain={[0, 100]}
                    stroke="#8FA3BC"
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    dataKey="roas_impact_y"
                    name="Marginal ROAS Impact (SHAP)"
                    unit="x"
                    domain={[-1.5, 3.5]}
                    stroke="#8FA3BC"
                    fontSize={11}
                  />
                  <ZAxis type="number" dataKey="sample_size" range={[60, 260]} />

                  {/* 3x3 Grid Reference Lines */}
                  <ReferenceLine y={0.0} stroke="#253D5B" strokeDasharray="4 4" />
                  <ReferenceLine y={1.8} stroke="#0072BC" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine x={35} stroke="#253D5B" strokeDasharray="3 3" />
                  <ReferenceLine x={70} stroke="#253D5B" strokeDasharray="3 3" />

                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const data = payload[0].payload as AttributionFeature;
                        const qMeta = getQuadrantMeta(data.quadrant);
                        return (
                          <div className="bg-[#000000] border border-[#0072BC] p-3 rounded-md shadow-2xl text-xs space-y-1 z-50">
                            <div className="font-bold text-white">{data.feature_name}</div>
                            <div className="text-[11px] text-[#8FA3BC]">
                              Franchise: <span className="text-white">{data.franchise}</span>
                            </div>
                            <div className="flex items-center space-x-2 pt-1 font-mono">
                              <span className="text-[#00C48C] font-semibold tabular-nums">
                                SHAP: {data.roas_impact_y > 0 ? `+${data.roas_impact_y}` : data.roas_impact_y}x ROAS
                              </span>
                              <span className="text-[#5C728C]">|</span>
                              <span className="text-[#8FA3BC] tabular-nums">Freq: {data.frequency_x}%</span>
                            </div>
                            <div
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mt-1"
                              style={{ backgroundColor: qMeta.badgeBg, color: qMeta.color }}
                            >
                              {qMeta.name} • {qMeta.action}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Scatter
                    name="Attribution Features"
                    data={filteredFeatures}
                    onClick={(node) => setInspectedFeature(node as any)}
                    className="cursor-pointer"
                  >
                    {filteredFeatures.map((entry, index) => {
                      const qMeta = getQuadrantMeta(entry.quadrant);
                      const isSelected = inspectedFeature?.feature_id === entry.feature_id;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={qMeta.color}
                          stroke={isSelected ? '#FFFFFF' : qMeta.borderColor}
                          strokeWidth={isSelected ? 3 : 1.5}
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-[#0E1A29] rounded-md animate-pulse" />
            )}
          </div>

          {/* Quadrant Legend Bar */}
          <div className="grid grid-cols-3 gap-2 text-[10px] pt-2 border-t border-[#253D5B]">
            <div className="bg-[#0E1A29] p-2 rounded-md border border-[#253D5B]">
              <span className="font-bold text-[#00C48C] block">Gold Mines (Scale Up)</span>
              <span className="text-[#8FA3BC]">High ROAS, Low Saturation</span>
            </div>
            <div className="bg-[#0E1A29] p-2 rounded-md border border-[#253D5B]">
              <span className="font-bold text-[#0072BC] block">Core Drivers (Maintain)</span>
              <span className="text-[#8FA3BC]">High ROAS, Steady Flighting</span>
            </div>
            <div className="bg-[#0E1A29] p-2 rounded-md border border-[#253D5B]">
              <span className="font-bold text-[#FF4560] block">Money Pits (Kill)</span>
              <span className="text-[#8FA3BC]">Negative ROAS, High Budget Bleed</span>
            </div>
          </div>
        </div>

        {/* Right Column: Inspected Feature Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {inspectedFeature ? (
            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#0E1A29] text-[#8FA3BC] border border-[#253D5B]">
                  Feature Inspector
                </span>
                {(() => {
                  const qMeta = getQuadrantMeta(inspectedFeature.quadrant);
                  return (
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border"
                      style={{
                        backgroundColor: qMeta.badgeBg,
                        color: qMeta.color,
                        borderColor: qMeta.borderColor,
                      }}
                    >
                      {qMeta.name} • {qMeta.action}
                    </span>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-lg font-heading font-bold text-white">{inspectedFeature.feature_name}</h3>
                <div className="flex items-center space-x-2 text-xs text-[#8FA3BC] mt-1">
                  <span>{inspectedFeature.franchise}</span>
                  <span>•</span>
                  <span>{inspectedFeature.funnel_stage.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>{inspectedFeature.surface.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#0E1A29] p-3 rounded-md border border-[#253D5B] font-mono text-xs">
                <div>
                  <div className="text-[#8FA3BC] text-[11px]">Revenue Impact</div>
                  <div className="text-base font-bold text-[#00C48C] tabular-nums">
                    {inspectedFeature.roas_impact_y > 0
                      ? `+${inspectedFeature.roas_impact_y}`
                      : inspectedFeature.roas_impact_y}
                    x ROAS
                  </div>
                </div>
                <div>
                  <div className="text-[#8FA3BC] text-[11px]">Ad Frequency</div>
                  <div className="text-base font-bold text-white tabular-nums">
                    {inspectedFeature.frequency_x}%
                  </div>
                </div>
                <div>
                  <div className="text-[#8FA3BC] text-[11px]">Model Confidence</div>
                  <div className="text-base font-bold text-white tabular-nums">
                    {Math.round(inspectedFeature.confidence * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-[#8FA3BC] text-[11px]">Tracked Impressions</div>
                  <div className="text-base font-bold text-white tabular-nums">
                    {(inspectedFeature.sample_size / 1000).toFixed(0)}k events
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-white">Creative Description:</div>
                <p className="text-[#8FA3BC] leading-relaxed">{inspectedFeature.description}</p>
              </div>

              <div className="p-3 bg-[#0072BC]/10 border border-[#0072BC]/30 rounded-md text-xs space-y-1">
                <div className="font-bold text-[#00C48C] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recommended Action:</span>
                </div>
                <p className="text-white leading-relaxed">
                  {inspectedFeature.action_recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-6 text-center text-[#8FA3BC] text-xs">
              Select any creative element on the chart to inspect performance details and recommendations.
            </div>
          )}
        </div>
      </div>

      {/* Embedded Gemini 3.6 Flash Chain-of-Thought Reasoning Card */}
      <div className="bg-[#16263A] border border-[#0072BC]/40 rounded-lg p-6 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#253D5B] pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#0072BC]/20 text-[#008BE6] border border-[#0072BC]/40 rounded-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-heading font-bold text-white">
                  Gemini 3.6 Flash Executive CoT Reasoning
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0072BC]/20 text-[#008BE6] border border-[#0072BC]/40 rounded-md">
                  thinking_level=HIGH
                </span>
              </div>
              <p className="text-xs text-[#8FA3BC] mt-0.5">
                Multi-pass Bayesian SHAP decomposition & creative fatigue analysis
              </p>
            </div>
          </div>

          <button
            onClick={() => setThinkingTraceOpen(!thinkingTraceOpen)}
            className="inline-flex items-center space-x-1 text-xs text-[#8FA3BC] hover:text-white px-2.5 py-1.5 rounded-md bg-[#0E1A29] border border-[#253D5B] cursor-pointer"
          >
            <span>{thinkingTraceOpen ? 'Hide Thinking Trace' : 'View Thinking Trace'}</span>
            {thinkingTraceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Executive Summary */}
        <div className="text-xs text-white leading-relaxed bg-[#0E1A29] p-4 rounded-md border border-[#253D5B]">
          <span className="font-bold text-[#00C48C] uppercase tracking-wider block mb-1">
            Executive Synthesis:
          </span>
          {cot.executive_summary}
        </div>

        {/* Thinking Trace Drawer */}
        {thinkingTraceOpen && (
          <div className="bg-[#0A131F] p-4 rounded-md border border-[#253D5B] space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8FA3BC] flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-[#FFB800]" />
              <span>Internal Chain-of-Thought Trace (gemini-3.6-flash):</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-[#8FA3BC]">
              {cot.thinking_trace.map((step, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-[#00C48C] shrink-0">↳</span>
                  <span className="text-white">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drivers & Strategic Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Key Drivers */}
          <div className="bg-[#0E1A29] p-4 rounded-md border border-[#253D5B] space-y-2">
            <div className="font-bold text-[#00C48C] flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Validated Growth Drivers:</span>
            </div>
            <ul className="space-y-1.5 text-[#8FA3BC] list-disc list-inside">
              {cot.key_drivers.map((d, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-white">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Factors */}
          <div className="bg-[#0E1A29] p-4 rounded-md border border-[#253D5B] space-y-2">
            <div className="font-bold text-[#FF4560] flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Creative Fatigue & Backlash Risks:</span>
            </div>
            <ul className="space-y-1.5 text-[#8FA3BC] list-disc list-inside">
              {cot.risk_factors.map((r, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-white">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Plan */}
        <div className="space-y-2">
          <div className="font-heading font-bold text-white text-xs uppercase tracking-wider">
            Prioritized Reallocation Action Plan:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cot.strategic_action_plan.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0E1A29] border border-[#253D5B] rounded-md p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#8FA3BC]">Step {idx + 1}</span>
                  <span className="px-2 py-0.5 rounded bg-[#00C48C]/15 text-[#00C48C] font-bold border border-[#00C48C]/30">
                    {item.expected_lift}
                  </span>
                </div>
                <h4 className="text-xs font-heading font-bold text-white leading-snug">{item.action}</h4>
                <p className="text-[11px] text-[#8FA3BC] leading-relaxed">{item.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
