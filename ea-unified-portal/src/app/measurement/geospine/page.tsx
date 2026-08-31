'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFranchise } from '@/context';
import { NielsenDMA } from '@/types';
import { TOP_25_NIELSEN_DMAS, WEATHER_TRAJECTORY_DATA } from '@/lib/constants';
import { MathFormula, FormattedText } from '@/components/measurement/MathFormula';
import { CoreFindingBanner } from '@/components/measurement/CoreFindingBanner';
import {
  MapPin,
  CloudRain,
  TrendingUp,
  Users,
  Zap,
  Compass,
  Table as TableIcon,
  Map as MapIcon,
  Sliders,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  Layers,
  Thermometer,
  CloudLightning,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';


type ActiveLayer = 'ALL' | 'WEATHER' | 'TRENDS' | 'POPULATION';
type ViewMode = 'MAP' | 'TABLE';

export default function GeoSpinePage() {
  const { currentFranchise } = useFranchise();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isInputCollapsed, setIsInputCollapsed] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('MAP');
  const [selectedDMA, setSelectedDMA] = useState<NielsenDMA>(TOP_25_NIELSEN_DMAS[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Climate Elasticity Simulation Controls
  const [simTempAnom, setSimTempAnom] = useState<number>(-6.5);
  const [simPrecip, setSimPrecip] = useState<number>(28.0);
  const [simEnsembleAgreement, setSimEnsembleAgreement] = useState<number>(92);

  // Filtered DMAs
  const filteredDMAs = useMemo(() => {
    return TOP_25_NIELSEN_DMAS.filter(
      (d) =>
        d.metro_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.esports_cluster_tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Compute live elasticity multiplier based on simulation inputs
  const simulatedElasticity = useMemo(() => {
    const tempEffect = 0.25 * Math.max(0, -simTempAnom / 6.0);
    const precipEffect = 0.20 * Math.max(0, (simPrecip - 5.0) / 25.0);
    const agreementEffect = 0.05 * (simEnsembleAgreement / 100.0);
    const raw = 1.0 + tempEffect + precipEffect + agreementEffect;
    return Number(Math.min(1.5, Math.max(1.0, raw)).toFixed(2));
  }, [simTempAnom, simPrecip, simEnsembleAgreement]);

  const isSurgeActive = simulatedElasticity >= 1.15;
  const popGamerHoursUplift = Math.round(
    (selectedDMA.population * selectedDMA.population_weight * (simulatedElasticity - 1.0) * 14.5) / 10
  );

  // SVG Coordinate mapping
  const mapWidth = 800;
  const mapHeight = 480;

  const projectLatLng = (lat: number, lng: number) => {
    const minLat = 24;
    const maxLat = 50;
    const minLng = -125;
    const maxLng = -66;

    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
    return { x, y };
  };

  const getMarkerColor = (dma: NielsenDMA) => {
    if (activeLayer === 'WEATHER') {
      return dma.indoor_elasticity_multiplier >= 1.25
        ? '#38BDF8'
        : dma.weather_temp_anom_c < 0
        ? '#00C48C'
        : '#FFB800';
    }
    if (activeLayer === 'TRENDS') {
      return dma.gaming_density_index >= 1.2 ? '#0072BC' : '#8A2BE2';
    }
    if (activeLayer === 'POPULATION') {
      return dma.population > 5000000 ? '#8A2BE2' : '#00C48C';
    }
    return dma.t3_lead_shock ? '#00C48C' : '#0072BC';
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-[#16263A] rounded-md w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 bg-[#16263A]/60 rounded-lg" />
          <div className="lg:col-span-4 h-96 bg-[#16263A]/60 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Executive Finding Banner */}
      <CoreFindingBanner
        badge="KEY EXECUTIVE FINDING"
        finding="Severe Cold Snap Across Midwest (Chicago, Detroit, Minneapolis) Drives +38% Regional Gaming Demand & Ad Response Lift"
        purpose="This module tracks 25 major US Nielsen media markets enriched with 90-day severe weather forecasts to capture localized spikes in indoor gaming activity and ad responsiveness."
        metrics={[
          {
            label: 'Top Opportunity',
            value: 'Chicago (+38% Lift)',
            isPositive: true,
          },
          {
            label: 'Weather Trigger',
            value: 'Winter Storm Warning',
            isPositive: true,
          },
          {
            label: 'Projected Net Gain',
            value: '+$140,000',
            isPositive: true,
          },
          {
            label: 'Markets Tracked',
            value: '25 Metro DMAs',
            isPositive: true,
          },
        ]}
        inputToggle={{
          isCollapsed: isInputCollapsed,
          onToggle: () => setIsInputCollapsed(!isInputCollapsed),
          inputLabel: 'Weather Simulator Controls',
        }}
      />

        {/* View Switcher & Layer Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Map vs Table Toggle */}
          <div className="flex items-center space-x-1 bg-[#0E1A29] border border-[#253D5B] p-1 rounded-md">
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'MAP'
                  ? 'bg-[#0072BC] text-white shadow-sm'
                  : 'text-[#8FA3BC] hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-[#0072BC] text-white shadow-sm'
                  : 'text-[#8FA3BC] hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>25 DMAs Table</span>
            </button>
          </div>

          {/* Layer Filter Buttons */}
          <div className="flex items-center space-x-1 bg-[#0E1A29] border border-[#253D5B] p-1 rounded-md">
            <button
              onClick={() => setActiveLayer('ALL')}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeLayer === 'ALL'
                  ? 'bg-[#16263A] text-[#38BDF8] font-bold border border-[#253D5B]'
                  : 'text-[#8FA3BC] hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveLayer('WEATHER')}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                activeLayer === 'WEATHER'
                  ? 'bg-[#0072BC]/20 text-[#008BE6] border border-[#0072BC]/40 font-bold'
                  : 'text-[#8FA3BC] hover:text-white'
              }`}
            >
              <CloudRain className="w-3 h-3" />
              <span>Weather</span>
            </button>
            <button
              onClick={() => setActiveLayer('TRENDS')}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                activeLayer === 'TRENDS'
                  ? 'bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 font-bold'
                  : 'text-[#8FA3BC] hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Trends</span>
            </button>
            <button
              onClick={() => setActiveLayer('POPULATION')}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                activeLayer === 'POPULATION'
                  ? 'bg-[#8A2BE2]/20 text-[#8A2BE2] border border-[#8A2BE2]/40 font-bold'
                  : 'text-[#8FA3BC] hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Density</span>
            </button>
          </div>
        </div>

      {/* Main Section: Map or Table View */}
      {viewMode === 'MAP' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive SVG Map (8 Cols) */}
          <div className="lg:col-span-8 bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#0072BC]" />
                <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                  Interactive 25 Nielsen DMAs Geo-Spine
                </h2>
              </div>
              <div className="text-xs text-[#8FA3BC] font-mono">
                Click any DMA node to inspect local elasticity telemetry
              </div>
            </div>

            {/* Map Canvas */}
            <div className="relative w-full aspect-[16/10] bg-[#0A131F] rounded-md border border-[#253D5B] overflow-hidden flex items-center justify-center p-2">
              <svg
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                className="w-full h-full"
                style={{ filter: 'drop-shadow(0 0 12px rgba(0, 114, 188, 0.12))' }}
              >
                {/* US Continental Outline Simulation */}
                <path
                  d="M 120 100 L 250 80 L 400 90 L 520 85 L 680 70 L 730 110 L 760 140 L 740 220 L 710 280 L 660 380 L 600 410 L 480 390 L 380 430 L 280 410 L 180 380 L 100 280 L 80 180 Z"
                  fill="#0E1A29"
                  stroke="#253D5B"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* State Grid & Latitude Guides */}
                <line x1="50" y1="120" x2="750" y2="120" stroke="#16263A" strokeWidth="1" />
                <line x1="50" y1="240" x2="750" y2="240" stroke="#16263A" strokeWidth="1" />
                <line x1="50" y1="360" x2="750" y2="360" stroke="#16263A" strokeWidth="1" />

                {/* 25 DMA Plot Nodes */}
                {TOP_25_NIELSEN_DMAS.map((dma) => {
                  const { x, y } = projectLatLng(dma.lat, dma.lon);
                  const isSelected = selectedDMA.dma_code === dma.dma_code;
                  const markerColor = getMarkerColor(dma);
                  const radius = Math.max(6, Math.min(16, (dma.population / 20000000) * 16));

                  return (
                    <g
                      key={dma.dma_code}
                      className="cursor-pointer transition-all duration-300 group"
                      onClick={() => setSelectedDMA(dma)}
                    >
                      {/* Pulsing ring for selected */}
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r={radius + 8}
                          fill="none"
                          stroke={markerColor}
                          strokeWidth="2"
                          className="animate-ping opacity-60"
                        />
                      )}

                      {/* Outer Glow */}
                      <circle
                        cx={x}
                        cy={y}
                        r={radius + 2}
                        fill={markerColor}
                        opacity={isSelected ? 0.4 : 0.15}
                      />

                      {/* Core Dot */}
                      <circle
                        cx={x}
                        cy={y}
                        r={radius}
                        fill={markerColor}
                        stroke={isSelected ? '#FFFFFF' : '#0E1A29'}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />

                      {/* Text Label */}
                      <text
                        x={x}
                        y={y - radius - 4}
                        textAnchor="middle"
                        fill={isSelected ? '#FFFFFF' : '#8FA3BC'}
                        fontSize={isSelected ? '11px' : '9px'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        className="select-none font-sans"
                      >
                        {dma.metro_name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* In-Map Floating Legend */}
              <div className="absolute bottom-3 left-3 bg-[#0E1A29]/90 backdrop-blur-md p-3 rounded-md border border-[#253D5B] text-[10px] space-y-1">
                <div className="font-bold text-white uppercase tracking-wider">Spatial Layer Legend</div>
                <div className="flex items-center space-x-2 text-[#8FA3BC]">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C]" />
                  <span>T-3 Nowcast Lead Shock (Storm / Severe Cold)</span>
                </div>
                <div className="flex items-center space-x-2 text-[#8FA3BC]">
                  <span className="w-2 h-2 rounded-full bg-[#0072BC]" />
                  <span>Baseline Acquisition DMA</span>
                </div>
              </div>
            </div>

            {/* Quick Search */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter 25 DMAs by metro name, state, or eSports cluster tag..."
                className="flex-1 bg-[#0E1A29] border border-[#253D5B] rounded-md px-3 py-2 text-xs text-white placeholder-[#8FA3BC] focus:outline-none focus:border-[#0072BC]"
              />
              <span className="text-xs text-[#8FA3BC] font-mono">
                Showing {filteredDMAs.length} of 25 DMAs
              </span>
            </div>
          </div>

          {/* Right Column: Selected DMA Detail & Climate Card (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#0E1A29] text-[#8FA3BC] border border-[#253D5B]">
                  DMA #{selectedDMA.dma_code} (Rank #{selectedDMA.nielsen_rank})
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    selectedDMA.indoor_elasticity_multiplier >= 1.2
                      ? 'bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30'
                      : 'bg-[#0E1A29] text-[#8FA3BC] border border-[#253D5B]'
                  }`}
                >
                  {selectedDMA.recommended_pacing_action}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-heading font-bold text-white">{selectedDMA.metro_name}</h3>
                <p className="text-xs text-[#00C48C] font-mono mt-0.5">
                  Google Ads Metro Code: {selectedDMA.google_ads_metro_code}
                </p>
                <p className="text-xs text-[#8FA3BC] mt-1">
                  eSports Cluster: <span className="text-white font-medium">{selectedDMA.esports_cluster_tag}</span>
                </p>
              </div>

              {/* External Signals Grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#0E1A29] p-3.5 rounded-md border border-[#253D5B] text-xs">
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Population Weight</span>
                  <span className="text-sm font-bold text-white font-mono tabular-nums">
                    {(selectedDMA.population_weight * 100).toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-[#5C728C] block font-mono tabular-nums">
                    {(selectedDMA.population / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Gaming Density Index</span>
                  <span className="text-sm font-bold text-[#FFB800] font-mono tabular-nums">
                    {selectedDMA.gaming_density_index}x
                  </span>
                  <span className="text-[10px] text-[#5C728C] block font-mono">National Avg: 1.00</span>
                </div>
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Weather Anomaly</span>
                  <span
                    className={`text-sm font-bold font-mono tabular-nums ${
                      selectedDMA.weather_temp_anom_c < 0 ? 'text-[#38BDF8]' : 'text-[#FFB800]'
                    }`}
                  >
                    {selectedDMA.weather_temp_anom_c > 0
                      ? `+${selectedDMA.weather_temp_anom_c}`
                      : selectedDMA.weather_temp_anom_c}
                    °C
                  </span>
                  <span className="text-[10px] text-[#5C728C] block font-mono tabular-nums">
                    Precip: +{selectedDMA.weather_precip_mm}mm
                  </span>
                </div>
                <div>
                  <span className="text-[#8FA3BC] text-[10px] block">Elasticity Multiplier</span>
                  <span className="text-sm font-bold text-[#00C48C] font-mono tabular-nums">
                    {selectedDMA.indoor_elasticity_multiplier.toFixed(2)}x
                  </span>
                  <span className="text-[10px] text-[#00C48C] block font-mono">
                    {selectedDMA.t3_lead_shock ? 'T-3 Active' : 'Normal Pacing'}
                  </span>
                </div>
              </div>

              {/* Lead Shock Horizon Flags */}
              <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B] space-y-2">
                <span className="text-xs font-heading font-bold text-white uppercase tracking-wider block">
                  Lead Shock Status Matrix:
                </span>
                <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                  <div
                    className={`p-2 rounded border ${
                      selectedDMA.t3_lead_shock
                        ? 'bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/30'
                        : 'bg-[#16263A] text-[#5C728C] border-[#253D5B]'
                    }`}
                  >
                    <span className="block font-bold">T-3</span>
                    <span>{selectedDMA.t3_lead_shock ? 'SHOCK' : 'CLEAR'}</span>
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      selectedDMA.t5_lead_shock
                        ? 'bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/30'
                        : 'bg-[#16263A] text-[#5C728C] border-[#253D5B]'
                    }`}
                  >
                    <span className="block font-bold">T-5</span>
                    <span>{selectedDMA.t5_lead_shock ? 'SHOCK' : 'CLEAR'}</span>
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      selectedDMA.t8_lead_shock
                        ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30'
                        : 'bg-[#16263A] text-[#5C728C] border-[#253D5B]'
                    }`}
                  >
                    <span className="block font-bold">T-8</span>
                    <span>{selectedDMA.t8_lead_shock ? 'SHOCK' : 'CLEAR'}</span>
                  </div>
                  <div
                    className={`p-2 rounded border ${
                      selectedDMA.t15_lead_shock
                        ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30'
                        : 'bg-[#16263A] text-[#5C728C] border-[#253D5B]'
                    }`}
                  >
                    <span className="block font-bold">T-15</span>
                    <span>{selectedDMA.t15_lead_shock ? 'SHOCK' : 'CLEAR'}</span>
                  </div>
                </div>
              </div>

              {/* Regional Multiplier Summary */}
              <div className="bg-[#0A131F] p-3 rounded-md border border-[#253D5B] text-xs font-mono text-[#8FA3BC] space-y-1">
                <span className="text-[#FFB800] font-bold block">
                  Regional Opportunity Score:
                </span>
                <div className="text-white font-medium">
                  {selectedDMA.metro_name} combines high gamer density ({selectedDMA.gaming_density_index}x) with strong indoor weather demand ({selectedDMA.indoor_elasticity_multiplier}x).
                </div>
                <div className="text-[#00C48C] font-bold tabular-nums">
                  Projected Ad Response Boost: +{(((selectedDMA.gaming_density_index * selectedDMA.indoor_elasticity_multiplier) - 1) * 100).toFixed(0)}% Lift
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full 25 DMAs Interactive Sortable Table View */
        <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TableIcon className="w-4 h-4 text-[#0072BC]" />
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Complete 25 Nielsen DMAs Spatial Dataset
              </h2>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, state, or eSports hub..."
              className="bg-[#0E1A29] border border-[#253D5B] rounded-md px-3 py-1.5 text-xs text-white placeholder-[#8FA3BC] focus:outline-none focus:border-[#0072BC] w-64"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-[#253D5B]">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#0E1A29] text-[#8FA3BC] border-b border-[#253D5B] uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Rank</th>
                  <th className="py-2.5 px-3 font-semibold">DMA Code</th>
                  <th className="py-2.5 px-3 font-semibold">Google Ads Code</th>
                  <th className="py-2.5 px-3 font-semibold">Metro Area</th>
                  <th className="py-2.5 px-3 font-semibold">State</th>
                  <th className="py-2.5 px-3 font-semibold">Pop. Weight</th>
                  <th className="py-2.5 px-3 font-semibold">Gaming Idx</th>
                  <th className="py-2.5 px-3 font-semibold">eSports Hub</th>
                  <th className="py-2.5 px-3 font-semibold">T-3/5/8/15</th>
                  <th className="py-2.5 px-3 font-semibold">Elasticity</th>
                  <th className="py-2.5 px-3 font-semibold">Pacing Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#253D5B]/60 text-white">
                {filteredDMAs.map((dma) => (
                  <tr
                    key={dma.dma_code}
                    onClick={() => setSelectedDMA(dma)}
                    className={`ea-table-row cursor-pointer transition-colors ${
                      selectedDMA.dma_code === dma.dma_code ? 'bg-[#0072BC]/15' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-white tabular-nums">#{dma.nielsen_rank}</td>
                    <td className="py-2.5 px-3 text-[#8FA3BC] tabular-nums">{dma.dma_code}</td>
                    <td className="py-2.5 px-3 text-[#008BE6] tabular-nums">{dma.google_ads_metro_code}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{dma.metro_name}</td>
                    <td className="py-2.5 px-3">{dma.state}</td>
                    <td className="py-2.5 px-3 tabular-nums">{(dma.population_weight * 100).toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-[#FFB800] tabular-nums">{dma.gaming_density_index}x</td>
                    <td className="py-2.5 px-3 truncate max-w-[150px]">{dma.esports_cluster_tag}</td>
                    <td className="py-2.5 px-3">
                      <span className="flex items-center space-x-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dma.t3_lead_shock ? 'bg-[#00C48C]' : 'bg-[#253D5B]'
                          }`}
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dma.t5_lead_shock ? 'bg-[#00C48C]' : 'bg-[#253D5B]'
                          }`}
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dma.t8_lead_shock ? 'bg-[#FFB800]' : 'bg-[#253D5B]'
                          }`}
                        />
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dma.t15_lead_shock ? 'bg-[#FFB800]' : 'bg-[#253D5B]'
                          }`}
                        />
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#00C48C] tabular-nums">
                      {dma.indoor_elasticity_multiplier.toFixed(2)}x
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          dma.indoor_elasticity_multiplier >= 1.2
                            ? 'bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30'
                            : 'bg-[#0E1A29] text-[#8FA3BC] border border-[#253D5B]'
                        }`}
                      >
                        {dma.recommended_pacing_action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WeatherNext 2.0 90-Day Lead Trajectory Section */}
      <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#253D5B] pb-3">
          <div>
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <CloudRain className="w-4 h-4 text-[#0072BC]" />
              <span>WeatherNext 2.0 90-Day Multi-Lead Trajectory</span>
            </h3>
            <p className="text-xs text-[#8FA3BC] mt-0.5">
              Dual-axis forecast tracking Lead Shocks (T-3, T-5, T-8, T-15) and indoor climate elasticity triggers
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 font-bold">
              Surge Line: 1.15x
            </span>
          </div>
        </div>

        {/* Recharts Hydration Safety Standard */}
        <div className="w-full h-80 min-w-0 min-h-0 relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <ComposedChart data={WEATHER_TRAJECTORY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E334D" />
              <XAxis dataKey="date_label" stroke="#8FA3BC" fontSize={10} interval={6} />
              <YAxis
                yAxisId="elasticity"
                domain={[0.95, 1.55]}
                stroke="#00C48C"
                fontSize={11}
                unit="x"
              />
              <YAxis
                yAxisId="weather"
                orientation="right"
                stroke="#38BDF8"
                fontSize={11}
                unit="°C"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000000',
                  borderColor: '#0072BC',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '11px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <ReferenceLine
                yAxisId="elasticity"
                y={1.15}
                stroke="#FFB800"
                strokeDasharray="4 4"
                label={{ value: '20% Surge Trigger (1.15x)', fill: '#FFB800', fontSize: 10 }}
              />
              <Bar
                yAxisId="weather"
                dataKey="precip_mm"
                name="Precipitation (mm)"
                fill="#0072BC"
                opacity={0.3}
              />
              <Line
                yAxisId="weather"
                type="monotone"
                dataKey="temp_anomaly_c"
                name="Temp Anomaly (°C)"
                stroke="#38BDF8"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                yAxisId="elasticity"
                type="monotone"
                dataKey="t3_elasticity"
                name="T-3 Nowcast (95% Conf)"
                stroke="#00C48C"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                yAxisId="elasticity"
                type="monotone"
                dataKey="t5_elasticity"
                name="T-5 Tactical (90% Conf)"
                stroke="#8A2BE2"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
              <Line
                yAxisId="elasticity"
                type="monotone"
                dataKey="t8_elasticity"
                name="T-8 Sub-seasonal (85% Conf)"
                stroke="#FFB800"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                yAxisId="elasticity"
                type="monotone"
                dataKey="t15_elasticity"
                name="T-15 Trend Lead (80% Conf)"
                stroke="#8FA3BC"
                strokeWidth={1.5}
                strokeDasharray="6 6"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weather & Seasonal Demand Simulation Studio */}
      <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
        <div className="flex items-center justify-between border-b border-[#253D5B] pb-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-[#FFB800]" />
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              Weather & Regional Demand Impact Simulator
            </h3>
          </div>
          <span className="text-xs font-mono text-[#00C48C] bg-[#0E1A29] px-2.5 py-1 rounded-md border border-[#253D5B]">
            Estimated Lift Range: +0% to +50%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sliders (7 Cols) */}
          {!isInputCollapsed && (
            <div className="lg:col-span-7 space-y-4">
              {/* Temperature Anomaly */}
            <div className="space-y-1.5 bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-medium">
                  Simulated Temperature Shift:
                </span>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    simTempAnom < 0 ? 'text-[#38BDF8]' : 'text-[#FFB800]'
                  }`}
                >
                  {simTempAnom > 0 ? `+${simTempAnom}` : simTempAnom}°C
                </span>
              </div>
              <input
                type="range"
                min={-15}
                max={10}
                step={0.5}
                value={simTempAnom}
                onChange={(e) => setSimTempAnom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#5C728C]">
                <span>-15°C (Polar Vortex)</span>
                <span>0°C</span>
                <span>+10°C (Heatwave)</span>
              </div>
            </div>

            {/* Precipitation */}
            <div className="space-y-1.5 bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-medium">Precipitation Anomaly:</span>
                <span className="font-mono font-bold text-[#0072BC] tabular-nums">{simPrecip} mm</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={simPrecip}
                onChange={(e) => setSimPrecip(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#5C728C]">
                <span>0 mm (Clear)</span>
                <span>25 mm</span>
                <span>50 mm (Severe Storm)</span>
              </div>
            </div>

            {/* Ensemble Model Agreement */}
            <div className="space-y-1.5 bg-[#0E1A29] p-3 rounded-md border border-[#253D5B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-medium">WeatherNext Ensemble Agreement:</span>
                <span className="font-mono font-bold text-[#00C48C] tabular-nums">{simEnsembleAgreement}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={simEnsembleAgreement}
                onChange={(e) => setSimEnsembleAgreement(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#00C48C]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#5C728C]">
                <span>50% (High Variance)</span>
                <span>80%</span>
                <span>100% (Absolute Consensus)</span>
              </div>
            </div>
          </div>
          )}

          {/* Real-time Elasticity Output */}
          <div className={isInputCollapsed ? 'lg:col-span-12 bg-[#0A131F] p-4 rounded-md border border-[#253D5B] flex flex-col justify-between space-y-3' : 'lg:col-span-5 bg-[#0A131F] p-4 rounded-md border border-[#253D5B] flex flex-col justify-between space-y-3'}>
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#8FA3BC] mb-2">
                <span>Real-Time Elasticity Yield:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    isSurgeActive
                      ? 'bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30'
                      : 'bg-[#16263A] text-white border border-[#253D5B]'
                  }`}
                >
                  {isSurgeActive ? '20% Surge Pacing Boost' : 'Baseline Pacing'}
                </span>
              </div>

              <div className="text-3xl font-heading font-bold text-[#00C48C] tabular-nums">
                {simulatedElasticity.toFixed(2)}x
              </div>
              <span className="text-xs text-[#8FA3BC] mt-1 block">
                Indoor gaming conversion elasticity relative to baseline.
              </span>
            </div>

            <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B] text-xs font-mono space-y-1">
              <span className="text-[#8FA3BC] text-[10px] block">
                Pop-Adjusted Gamer Hours Uplift:
              </span>
              <div className="text-sm font-bold text-white tabular-nums">
                +{popGamerHoursUplift.toLocaleString()} hrs / day
              </div>
              <div className="text-[10px] text-[#5C728C]">
                Applied to selected DMA: {selectedDMA.metro_name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
