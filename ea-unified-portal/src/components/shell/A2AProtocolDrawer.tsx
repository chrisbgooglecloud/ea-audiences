'use client';

import React, { useState } from 'react';
import { useA2AEventBus } from '@/context/A2AEventBusContext';
import { useCampaign } from '@/context/CampaignContext';
import { useFranchise } from '@/context/FranchiseContext';
import {
  X,
  Radio,
  Send,
  Sparkles,
  ArrowRight,
  Code,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';

export function A2AProtocolDrawer() {
  const { messages, publishMessage, isDrawerOpen, setIsDrawerOpen, clearMessages } = useA2AEventBus();
  const { activeBrief, activeCohort } = useCampaign();
  const { currentFranchise } = useFranchise();

  const [customIntent, setCustomIntent] = useState<'DISPATCH_AUDIENCE_BRIEF' | 'REVISE_CREATIVE' | 'SIMULATE_PERSONA_REACTION' | 'ALLOCATE_PROGRAMMATIC_SPEND'>('DISPATCH_AUDIENCE_BRIEF');
  const [sender, setSender] = useState('Jamie_DeepSonaAgent (Act 1)');
  const [recipient, setRecipient] = useState('Curtis_CreativeStudioAgent (Act 2)');
  const [isSending, setIsSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  if (!isDrawerOpen) return null;

  const handleSendA2A = async () => {
    setIsSending(true);
    let payload: any = {};

    if (customIntent === 'DISPATCH_AUDIENCE_BRIEF') {
      payload = {
        brief_id: activeBrief?.brief_id || 'brief-live-001',
        title: activeBrief?.title || 'Contextual Loss-Streak Shield',
        franchise: currentFranchise,
        dominant_archetype: activeCohort?.dominantArchetype || 'COMPETITIVE_GRINDER',
        audience_size: activeCohort?.estimatedTotal || 245000,
        trigger_rules: ['Loss Streak >= 3', 'Tilt Index > 75%'],
        recommended_mechanic: 'Squad Breach & Clear Action Hook',
      };
    } else if (customIntent === 'REVISE_CREATIVE') {
      payload = {
        campaign_id: 'camp-rebalance-01',
        franchise: currentFranchise,
        feature_name: 'Squad Breach & Clear',
        quadrant: 'GOLD_MINES',
        marginal_roas_multiplier: 3.85,
        target_channel: 'TikTok',
        target_surface: 'STREAMING_OVERLAYS',
        directive: 'Lead with 2-second high-intensity ToFu action hook featuring Squad Breach.',
      };
    } else if (customIntent === 'ALLOCATE_PROGRAMMATIC_SPEND') {
      payload = {
        campaign_id: 'camp-prog-3d-01',
        channel: 'Programmatic 3D',
        allocated_budget: 85000,
        target_surfaces: ['STADIUM_BOARDS', 'PAUSE_SCREENS'],
        target_dmas: [501, 803, 602, 506],
        pacing_daily_limit: 17000,
        ias_dwell_threshold_ms: 1500,
      };
    } else {
      payload = {
        query: 'Pre-flight budget simulation validation',
        franchise: currentFranchise,
        proposed_spend: 350000,
      };
    }

    await publishMessage({
      correlation_id: `corr-${Date.now()}`,
      sender,
      recipient,
      intent: customIntent,
      payload,
    });

    setIsSending(false);
  };

  return (
    <>
      {/* Apple-style Backdrop Scrim with Blur */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
      />

      {/* Floating Translucent Drawer Sheet */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[540px] apple-glass-dock border-l border-white/[0.12] shadow-[-16px_0_48px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-spring animate-slideInRight">
        {/* Physical Grab Handle / Dismiss Indicator */}
        <div className="w-full flex items-center justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Drawer Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00C48C]/15 border border-[#00C48C]/30 text-[#00C48C] shadow-sm">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="apple-title text-sm font-bold text-white tracking-tight">
                Agent-to-Agent (A2A) Protocol Bus
              </h2>
              <p className="text-[11px] text-[#8FA3BC] apple-subhead">
                Autonomous Inter-Act Negotiation & Event Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDrawerOpen(false)}
            className="apple-press p-2 rounded-xl text-[#8FA3BC] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Dispatch Panel */}
        <div className="p-4 bg-white/[0.03] border-b border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-[#00F0FF] flex items-center gap-1.5 font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Dispatch Agent Negotiation Event
            </span>
            <span className="text-[10px] text-[#8FA3BC] font-mono">JSON-RPC / SSE</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-[#8FA3BC] mb-1 font-mono uppercase tracking-wider font-semibold">Sender Agent</label>
              <select
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full apple-glass-pill rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0072BC]"
              >
                <option value="Jamie_DeepSonaAgent (Act 1)">Jamie_DeepSonaAgent (Act 1)</option>
                <option value="Curtis_CreativeStudioAgent (Act 2)">Curtis_CreativeStudioAgent (Act 2)</option>
                <option value="MediaBuyingAgent (Act 3)">MediaBuyingAgent (Act 3)</option>
                <option value="Surya_CommerceMediaAgent (Act 4)">Surya_CommerceMediaAgent (Act 4)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#8FA3BC] mb-1 font-mono uppercase tracking-wider font-semibold">Recipient Agent</label>
              <select
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full apple-glass-pill rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0072BC]"
              >
                <option value="Curtis_CreativeStudioAgent (Act 2)">Curtis_CreativeStudioAgent (Act 2)</option>
                <option value="MediaBuyingAgent (Act 3)">MediaBuyingAgent (Act 3)</option>
                <option value="Surya_CommerceMediaAgent (Act 4)">Surya_CommerceMediaAgent (Act 4)</option>
                <option value="Jamie_DeepSonaAgent (Act 1)">Jamie_DeepSonaAgent (Act 1)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={customIntent}
              onChange={(e) => setCustomIntent(e.target.value as any)}
              className="flex-1 apple-glass-pill rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0072BC] font-mono"
            >
              <option value="DISPATCH_AUDIENCE_BRIEF">DISPATCH_AUDIENCE_BRIEF (Act 1 → 2)</option>
              <option value="REVISE_CREATIVE">REVISE_CREATIVE (Act 3 → 2)</option>
              <option value="ALLOCATE_PROGRAMMATIC_SPEND">ALLOCATE_PROGRAMMATIC_SPEND (Act 3 → 4)</option>
              <option value="SIMULATE_PERSONA_REACTION">SIMULATE_PERSONA_REACTION (Act 3 → 1)</option>
            </select>

            <button
              onClick={handleSendA2A}
              disabled={isSending}
              className="apple-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0072BC] to-[#008BE6] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-[#0072BC]/20 transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Emit</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#8FA3BC] px-1">
            <span className="font-semibold">Live Protocol Messages ({messages.length})</span>
            <button
              onClick={clearMessages}
              className="apple-press-subtle text-[10px] text-[#8FA3BC] hover:text-white font-mono uppercase tracking-wider"
            >
              Clear Log
            </button>
          </div>

          {messages.map((msg, idx) => (
            <div
              key={msg.message_id || idx}
              onClick={() => setSelectedMessage(selectedMessage?.message_id === msg.message_id ? null : msg)}
              className={`apple-glass-card p-4 rounded-2xl border transition-all duration-spring cursor-pointer ${
                selectedMessage?.message_id === msg.message_id
                  ? 'border-[#00F0FF]/50 shadow-[0_0_24px_rgba(0,240,255,0.15)] bg-white/[0.08]'
                  : 'border-white/[0.08] hover:border-white/[0.18]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0072BC]/20 text-[#38BDF8] border border-[#0072BC]/40 font-bold">
                  {msg.intent}
                </span>
                <span className="text-[10px] text-[#8FA3BC] font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-white/40" />
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-white font-medium mb-2.5">
                <span className="text-[#00C48C] font-semibold">{msg.sender}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[#00F0FF] font-semibold">{msg.recipient}</span>
              </div>

              <div className="bg-black/40 rounded-xl p-3 text-[11px] font-mono text-slate-300 overflow-x-auto border border-white/[0.06]">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(msg.payload, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
