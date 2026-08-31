'use client';

import React, { useState } from 'react';
import { useFranchise } from '@/context/FranchiseContext';
import { useCampaign } from '@/context/CampaignContext';
import { useA2AEventBus } from '@/context/A2AEventBusContext';
import { Frostbite3DStadiumCanvas } from '@/components/commerce/Frostbite3DStadiumCanvas';
import { TOP_25_NIELSEN_DMAS } from '@/lib/constants';
import {
  Box,
  Radio,
  Sparkles,
  ShieldCheck,
  Eye,
  Sliders,
  DollarSign,
  Send,
  CheckCircle2,
  Activity,
  Layers,
  MapPin,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

export default function CommerceMediaPage() {
  const { currentFranchise, franchiseInfo } = useFranchise();
  const { proposedSpend } = useCampaign();
  const { publishMessage, setIsDrawerOpen } = useA2AEventBus();

  const [activeSponsor, setActiveSponsor] = useState<string>('Nike');
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>(['THE_CITY_BILLBOARDS', 'ARENA_JUMBOTRON']);
  const [targetDmas, setTargetDmas] = useState<number[]>([501, 803, 602, 506]);
  const [bidCpm, setBidCpm] = useState<number>(28.5);
  const [allocatedBudget, setAllocatedBudget] = useState<number>(85000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  // Live telemetry state
  const [liveDwell, setLiveDwell] = useState<number>(3.4);
  const [liveAngle, setLiveAngle] = useState<number>(24.5);
  const [liveOcclusion, setLiveOcclusion] = useState<number>(4.2);

  const sponsors = ['Nike', 'Gatorade', 'Jordan Brand', 'Ruffles', 'State Farm', 'PlayStation'];

  const handleToggleSurface = (surface: string) => {
    if (selectedSurfaces.includes(surface)) {
      setSelectedSurfaces(selectedSurfaces.filter((s) => s !== surface));
    } else {
      setSelectedSurfaces([...selectedSurfaces, surface]);
    }
  };

  const handleToggleDma = (dmaCode: number) => {
    if (targetDmas.includes(dmaCode)) {
      setTargetDmas(targetDmas.filter((d) => d !== dmaCode));
    } else {
      setTargetDmas([...targetDmas, dmaCode]);
    }
  };

  const handleSubmitFlight = async () => {
    setIsSubmitting(true);
    await publishMessage({
      correlation_id: `corr-commerce-spend-${Date.now()}`,
      sender: 'TwoK_CommerceMediaAgent (Act 4)',
      recipient: 'MediaBuyingAgent (Act 3)',
      intent: 'ACK_ALLOCATE_PROGRAMMATIC_SPEND',
      payload: {
        campaign_id: `camp-prog-${activeSponsor.toLowerCase()}-${Date.now()}`,
        sponsor: activeSponsor,
        franchise: currentFranchise,
        allocated_budget_usd: allocatedBudget,
        target_surfaces: selectedSurfaces,
        target_dmas: targetDmas,
        clearing_cpm_usd: bidCpm,
        ias_verified_dwell_sec: liveDwell,
        ias_brand_safety_score: 0.98,
        active_matches_serving: 420,
        status: 'FLIGHT_ACTIVE_SERVING',
      },
    });
    setIsSubmitting(false);
    setSubmissionNotice(
      `Flight submitted for ${activeSponsor}! 420 2K live server matches serving across ${targetDmas.length} DMAs.`
    );
    setTimeout(() => setSubmissionNotice(null), 6000);
  };

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E51B24]/15 text-[#FF2E38] border border-[#E51B24]/30">
              ACT 4 • COMMERCE MEDIA NETWORK
            </span>
            <span className="text-xs text-[#8FA3BC]">
              2K Dynamic 3D In-Game Ad Engine & The City Media
            </span>
          </div>
          <h1 className="text-xl font-heading font-bold text-white mt-1">
            {franchiseInfo.label} Dynamic 3D In-Game Ads & IAS Verification
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-[#8FA3BC] font-mono">Active Sponsor:</div>
          <div className="flex items-center gap-1 bg-[#0E1A29] p-1 rounded-xl border border-[#253D5B] flex-wrap">
            {sponsors.map((sp) => (
              <button
                key={sp}
                onClick={() => setActiveSponsor(sp)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeSponsor === sp
                    ? 'bg-[#E51B24] text-white shadow-md'
                    : 'text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {submissionNotice && (
        <div className="p-3.5 bg-[#0E1A29] border border-[#00C48C]/50 rounded-xl text-xs font-mono text-[#00C48C] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
          <span>{submissionNotice}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D The City & Arena Canvas (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-[#FF2E38]" />
              <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Live 3D The City & Arena Courtside LED Ribbons
              </h2>
            </div>
            <span className="text-xs text-[#8FA3BC] font-mono">
              Real-time WebGL Simulation
            </span>
          </div>


          <Frostbite3DStadiumCanvas
            activeSponsor={activeSponsor}
            onDwellUpdate={(dwell, angle, occ) => {
              setLiveDwell(dwell);
              setLiveAngle(angle);
              setLiveOcclusion(occ);
            }}
          />

          {/* Real-time IAS Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] font-mono text-[#8FA3BC] uppercase">
                IAS Camera Dwell
              </div>
              <div className="text-xl font-heading font-bold text-[#00C48C] tabular-nums">
                {liveDwell}s
              </div>
              <div className="text-[10px] text-[#8FA3BC]">&gt;1.5s Threshold Passed</div>
            </div>

            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] font-mono text-[#8FA3BC] uppercase">
                Camera Angle
              </div>
              <div className="text-xl font-heading font-bold text-white tabular-nums">
                {liveAngle}°
              </div>
              <div className="text-[10px] text-[#8FA3BC]">Direct Sightline</div>
            </div>

            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] font-mono text-[#8FA3BC] uppercase">
                Occlusion Rate
              </div>
              <div className="text-xl font-heading font-bold text-[#38BDF8] tabular-nums">
                {liveOcclusion}%
              </div>
              <div className="text-[10px] text-[#8FA3BC]">&lt;20% Brand Safe</div>
            </div>

            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] font-mono text-[#8FA3BC] uppercase">
                Brand Safety Score
              </div>
              <div className="text-xl font-heading font-bold text-[#00C48C] tabular-nums">
                0.98
              </div>
              <div className="text-[10px] text-[#8FA3BC]">IAS Verified 100%</div>
            </div>
          </div>
        </div>

        {/* Right: Self-Serve Advertiser Campaign Builder (5 Cols) */}
        <div className="lg:col-span-5 bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#253D5B] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0072BC]" />
                <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                  Self-Serve Advertiser Campaign Flight
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0072BC]/20 text-[#38BDF8] border border-[#0072BC]/40 font-semibold">
                Programmatic DSP
              </span>
            </div>

            {/* Target Surfaces */}
            <div>
              <label className="block text-xs font-semibold text-white mb-2">
                Target In-Game 3D Surfaces
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['STADIUM_BOARDS', 'PAUSE_SCREENS', 'ROAD_BILLBOARDS'].map((surf) => (
                  <button
                    key={surf}
                    onClick={() => handleToggleSurface(surf)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                      selectedSurfaces.includes(surf)
                        ? 'bg-[#0072BC]/20 border-[#0072BC] text-[#38BDF8] font-bold'
                        : 'bg-[#0E1A29] border-[#253D5B] text-[#8FA3BC] hover:text-white'
                    }`}
                  >
                    {surf.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Spend & Bid Sliders */}
            <div className="space-y-3 bg-[#0E1A29] p-3.5 rounded-xl border border-[#253D5B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8FA3BC]">Allocated 3D Flight Budget</span>
                <span className="font-heading font-bold text-white tabular-nums">
                  ${allocatedBudget.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="20000"
                max="250000"
                step="5000"
                value={allocatedBudget}
                onChange={(e) => setAllocatedBudget(Number(e.target.value))}
                className="w-full h-1.5 bg-[#253D5B] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
              />

              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-[#8FA3BC]">First-Price Clearing CPM Bid</span>
                <span className="font-heading font-bold text-[#00C48C] tabular-nums">
                  ${bidCpm.toFixed(2)} CPM
                </span>
              </div>
              <input
                type="range"
                min="12.0"
                max="45.0"
                step="0.5"
                value={bidCpm}
                onChange={(e) => setBidCpm(Number(e.target.value))}
                className="w-full h-1.5 bg-[#253D5B] rounded-lg appearance-none cursor-pointer accent-[#00C48C]"
              />
            </div>

            {/* Target Nielsen DMAs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-white">
                  Target Nielsen Regional DMAs ({targetDmas.length} Selected)
                </label>
                <span className="text-[10px] text-[#8FA3BC]">From Act 3 Geo-Spine</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {TOP_25_NIELSEN_DMAS.slice(0, 10).map((dma) => {
                  const isSelected = targetDmas.includes(dma.dma_code);
                  return (
                    <button
                      key={dma.dma_code}
                      onClick={() => handleToggleDma(dma.dma_code)}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg text-[11px] border transition-all ${
                        isSelected
                          ? 'bg-[#00C48C]/15 border-[#00C48C]/50 text-[#00C48C] font-semibold'
                          : 'bg-[#0E1A29] border-[#253D5B] text-[#8FA3BC] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{dma.metro_name}</span>
                      <span className="font-mono text-[10px]">#{dma.nielsen_rank}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-[#253D5B]">
            <button
              onClick={handleSubmitFlight}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0072BC] hover:bg-[#008BE6] text-white text-xs font-bold shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Submit & Dispatch Programmatic 3D Flight</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time BigQuery Telemetry Table (ea_commerce.fct_3d_ad_impressions_ias) */}
      <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0072BC]" />
            <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              Delivered Telemetry Feed (`ea_commerce.fct_3d_ad_impressions_ias`)
            </h2>
          </div>
          <span className="text-xs text-[#8FA3BC] font-mono">
            BQML AI.GENERATE_TABLE Synthetic Stream
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0E1A29] text-[#8FA3BC] uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Impression ID</th>
                <th className="p-3">Franchise</th>
                <th className="p-3">Surface</th>
                <th className="p-3">DMA Code</th>
                <th className="p-3">Dwell Time</th>
                <th className="p-3">View Angle</th>
                <th className="p-3">Clearing CPM</th>
                <th className="p-3">IAS Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)] text-gray-200">
              <tr className="hover:bg-[#1E334D]">
                <td className="p-3 font-mono text-[#38BDF8]">imp-fc26-0819-01</td>
                <td className="p-3 font-semibold text-white">EA SPORTS FC 26</td>
                <td className="p-3 font-mono">STADIUM_BOARDS</td>
                <td className="p-3 font-mono">501 (New York)</td>
                <td className="p-3 font-mono text-[#00C48C]">3.8s</td>
                <td className="p-3 font-mono">18.2°</td>
                <td className="p-3 font-mono">$28.50</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-[#00C48C]/15 text-[#00C48C] font-mono font-bold text-[10px]">
                    VIEWABLE_PASSED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#1E334D]">
                <td className="p-3 font-mono text-[#38BDF8]">imp-apex-0819-02</td>
                <td className="p-3 font-semibold text-white">Apex Legends</td>
                <td className="p-3 font-mono">PAUSE_SCREENS</td>
                <td className="p-3 font-mono">803 (Los Angeles)</td>
                <td className="p-3 font-mono text-[#00C48C]">4.2s</td>
                <td className="p-3 font-mono">12.0°</td>
                <td className="p-3 font-mono">$32.00</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-[#00C48C]/15 text-[#00C48C] font-mono font-bold text-[10px]">
                    VIEWABLE_PASSED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#1E334D]">
                <td className="p-3 font-mono text-[#38BDF8]">imp-madden-0819-03</td>
                <td className="p-3 font-semibold text-white">Madden NFL 25</td>
                <td className="p-3 font-mono">STADIUM_BOARDS</td>
                <td className="p-3 font-mono">602 (Chicago)</td>
                <td className="p-3 font-mono text-[#00C48C]">2.9s</td>
                <td className="p-3 font-mono">24.5°</td>
                <td className="p-3 font-mono">$26.00</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-[#00C48C]/15 text-[#00C48C] font-mono font-bold text-[10px]">
                    VIEWABLE_PASSED
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#1E334D]">
                <td className="p-3 font-mono text-[#38BDF8]">imp-bf-0819-04</td>
                <td className="p-3 font-semibold text-white">Battlefield 2042</td>
                <td className="p-3 font-mono">ROAD_BILLBOARDS</td>
                <td className="p-3 font-mono">506 (Boston)</td>
                <td className="p-3 font-mono text-[#00C48C]">3.1s</td>
                <td className="p-3 font-mono">31.2°</td>
                <td className="p-3 font-mono">$22.50</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-[#00C48C]/15 text-[#00C48C] font-mono font-bold text-[10px]">
                    VIEWABLE_PASSED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
