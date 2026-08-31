'use client';

import React, { useState } from 'react';
import { useFranchise } from '@/context/FranchiseContext';
import { useCampaign } from '@/context/CampaignContext';
import { useA2AEventBus } from '@/context/A2AEventBusContext';
import {
  Palette,
  Radio,
  Sparkles,
  ShieldCheck,
  Layers,
  MessageSquare,
  Flame,
  CheckCircle2,
  FileText,
  BarChart2,
  Image,
  RefreshCw,
  Send,
  Zap,
} from 'lucide-react';

// Components
import { RunwayAnalysis } from '@/components/creative/RunwayAnalysis';
import { PDPHub } from '@/components/creative/PDPHub';
import { ContentHub } from '@/components/creative/ContentHub';
import { MultiImage } from '@/components/creative/MultiImage';
import { ESpots } from '@/components/creative/ESpots';
import { FullAudit } from '@/components/creative/FullAudit';
import { SyntheticTesting } from '@/components/creative/SyntheticTesting';

export default function CreativeStudioPage() {
  const { currentFranchise, franchiseInfo } = useFranchise();
  const { activeBrief } = useCampaign();
  const { publishMessage, setIsDrawerOpen } = useA2AEventBus();

  const [activeTab, setActiveTab] = useState<'listening' | 'studio' | 'content_hub' | 'audit' | 'synthetic'>('listening');
  const [selectedSurface, setSelectedSurface] = useState<string>('EA_APP_LAUNCHER');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  const handleEmitCreativeProof = async () => {
    setIsGenerating(true);
    await publishMessage({
      correlation_id: `corr-creative-ack-${Date.now()}`,
      sender: 'Curtis_CreativeStudioAgent (Act 2)',
      recipient: 'MediaBuyingAgent (Act 3)',
      intent: 'ACK_REVISE_CREATIVE',
      payload: {
        asset_id: `asset-${currentFranchise.toLowerCase()}-${Date.now()}`,
        franchise: currentFranchise,
        surface: selectedSurface,
        funnel_stage: 'ToFu_Exploration',
        directive: 'Squad Breach 2s Action Hook with verified brand safety',
        gcs_uri: 'gs://eagames-ebc-demo-app-creative-assets/generated_hook.mp4',
        status: 'RENDER_COMPLETE',
      },
    });
    setIsGenerating(false);
    setGenerationNotice('Asset variant rendered to GCS and ACK dispatched to Act 3 Measurement.');
    setTimeout(() => setGenerationNotice(null), 5000);
  };

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Subheader & Brief Context Bar */}
      <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E6FF00]/15 text-[#E6FF00] border border-[#E6FF00]/30">
              ACT 2 • CREATIVE STUDIO
            </span>
            <span className="text-xs text-[#8FA3BC]">
              Community Social Listening & Multi-Surface Generative AI
            </span>
          </div>
          <h1 className="text-xl font-heading font-bold text-white mt-1">
            {franchiseInfo.label} Creative Intelligence Studio
          </h1>
        </div>

        {activeBrief && (
          <div className="bg-[#0E1A29] border border-[#253D5B] rounded-xl p-3 max-w-lg flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-[#00C48C] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active Inbound Brief: {activeBrief.title}
              </div>
              <div className="text-xs text-white truncate mt-0.5">
                Target: {activeBrief.target_segment}
              </div>
            </div>
            <button
              onClick={handleEmitCreativeProof}
              disabled={isGenerating}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0072BC] hover:bg-[#008BE6] text-white text-xs font-semibold shrink-0 transition-all shadow-sm"
            >
              <Send className="w-3 h-3" />
              <span>Emit Variant</span>
            </button>
          </div>
        )}
      </div>

      {generationNotice && (
        <div className="p-3 bg-[#0E1A29] border border-[#00C48C]/50 rounded-xl text-xs font-mono text-[#00C48C] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#00C48C]" />
          <span>{generationNotice}</span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#253D5B] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('listening')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'listening'
              ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
              : 'bg-[#16263A] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span>Social Listening & Anomaly Detection</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'studio'
              ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
              : 'bg-[#16263A] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-[#E6FF00]" />
          <span>Multi-Surface Gen AI Studio (6 Surfaces)</span>
        </button>

        <button
          onClick={() => setActiveTab('content_hub')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'content_hub'
              ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
              : 'bg-[#16263A] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#0AF468]" />
          <span>Personalization & Campaign Assets</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'audit'
              ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
              : 'bg-[#16263A] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#00C48C]" />
          <span>Legal & Monetization Compliance Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('synthetic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'synthetic'
              ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
              : 'bg-[#16263A] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#A855F7]" />
          <span>Synthetic Persona Focus Testing</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="w-full">
        {activeTab === 'listening' && (
          <div className="space-y-4">
            <RunwayAnalysis />
          </div>
        )}

        {activeTab === 'studio' && (
          <div className="space-y-6">
            <PDPHub />
          </div>
        )}

        {activeTab === 'content_hub' && (
          <div className="space-y-4">
            <ContentHub />
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <FullAudit />
          </div>
        )}

        {activeTab === 'synthetic' && (
          <div className="space-y-4">
            <SyntheticTesting />
          </div>
        )}
      </div>
    </div>
  );
}


