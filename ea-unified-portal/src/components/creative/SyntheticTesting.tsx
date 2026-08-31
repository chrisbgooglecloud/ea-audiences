'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFranchise } from '@/context/FranchiseContext';
import { useCampaign } from '@/context/CampaignContext';
import {
  Users,
  User,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Target,
  DollarSign,
  BarChart3,
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Radio,
  Sliders,
  ChevronRight,
  MessageCircle
} from 'lucide-react';

interface PersonaReaction {
  id: string;
  name: string;
  avatar: string;
  archetype: string;
  division: string;
  ltv: number;
  tilt: number;
  lossStreak: number;
  resonanceScore: number; // 0-100
  wtp: number; // willingness to pay in USD
  action: 'CONVERT' | 'CONSIDER' | 'CHURN_RISK' | 'ABANDON';
  sentiment: 'HYPED' | 'FAIR_VALUE' | 'SKEPTICAL' | 'ANTI_P2W';
  radar: {
    gameplayExcitement: number;
    visualFidelity: number;
    pricingFairness: number;
    fomoIntensity: number;
    communityTrust: number;
  };
  feedback: string;
  quote: string;
}

interface DebateTurn {
  persona_id: string;
  archetype: string;
  avatar: string;
  name: string;
  message: string;
  wtp: number;
  fsm_state: string;
  sentiment_delta: string;
}

const DEFAULT_EA_PERSONAS: PersonaReaction[] = [
  {
    id: 'marcus_vance',
    name: 'Marcus Vance',
    avatar: '⚡',
    archetype: 'Competitive Grinder',
    division: 'FUT Champions Elite (Rank II)',
    ltv: 1250,
    tilt: 88,
    lossStreak: 3,
    resonanceScore: 94,
    wtp: 7.99,
    action: 'CONVERT',
    sentiment: 'HYPED',
    radar: {
      gameplayExcitement: 92,
      visualFidelity: 85,
      pricingFairness: 78,
      fomoIntensity: 95,
      communityTrust: 80,
    },
    feedback: 'If I just lost 3 Weekend League games to 90th-minute bouncebacks, dropping $4.99 to immediately reset tilt with a loan Icon card and 500 FC points is an absolute no-brainer.',
    quote: '"I need momentum back right after a loss streak. Make the purchase frictionless on the defeat screen."'
  },
  {
    id: 'kaito_takahashi',
    name: 'Kaito Takahashi',
    avatar: '🎯',
    archetype: 'Esports Hardware Sweat',
    division: 'PC Competitive / 240Hz Grinder',
    ltv: 680,
    tilt: 45,
    lossStreak: 1,
    resonanceScore: 82,
    wtp: 4.99,
    action: 'CONSIDER',
    sentiment: 'FAIR_VALUE',
    radar: {
      gameplayExcitement: 88,
      visualFidelity: 96,
      pricingFairness: 70,
      fomoIntensity: 75,
      communityTrust: 72,
    },
    feedback: 'The visual execution in 4K looks clean, but highlight frame pacing and input latency benefits. Don’t make it look like a pay-to-win microtransaction gimmick.',
    quote: '"Focus on competitive fairness and skill-based responsiveness over pure cosmetic RNG."'
  },
  {
    id: 'chloe_bennett',
    name: 'Chloe Bennett',
    avatar: '🧠',
    archetype: 'Career Mode Tactician',
    division: 'Single Player & Manager Tactician',
    ltv: 140,
    tilt: 15,
    lossStreak: 0,
    resonanceScore: 68,
    wtp: 2.99,
    action: 'CONSIDER',
    sentiment: 'SKEPTICAL',
    radar: {
      gameplayExcitement: 65,
      visualFidelity: 80,
      pricingFairness: 85,
      fomoIntensity: 40,
      communityTrust: 88,
    },
    feedback: 'I rarely buy points packs, but if the creative emphasizes deep tactical realism (FC IQ manager playbooks or youth scouting upgrades), I would consider expanding my campaign.',
    quote: '"Give me depth, strategic storyline progression, and authentic club mechanics."'
  },
  {
    id: 'alexandre_silva',
    name: 'Alexandre Silva',
    avatar: '🎮',
    archetype: 'Clubs & Street Socializer',
    division: '11v11 Clubs Division 1 & VOLTA',
    ltv: 420,
    tilt: 35,
    lossStreak: 1,
    resonanceScore: 89,
    wtp: 5.99,
    action: 'CONVERT',
    sentiment: 'HYPED',
    radar: {
      gameplayExcitement: 90,
      visualFidelity: 92,
      pricingFairness: 82,
      fomoIntensity: 85,
      communityTrust: 75,
    },
    feedback: 'Our squad plays every Friday on Discord. Having licensed streetwear drops, custom club crests, and Rush 5v5 XP boosters bundled in the creative is instant squad purchase fuel.',
    quote: '"If my whole squad can flex custom kits in Rush 5v5, we will all grab it immediately."'
  }
];

export function SyntheticTesting() {
  const { currentFranchise, franchiseInfo } = useFranchise();
  const { activeBrief } = useCampaign();

  const [activeTab, setActiveTab] = useState<'creative' | 'debate' | 'interview' | 'offers'>('creative');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('marcus_vance');
  const [isSimulating, setIsSimulating] = useState(false);

  // Creative test form state
  const [testDirective, setTestDirective] = useState<string>(
    'Squad Breach 2s Action Hook with Defeat-Streak Tilt Shield ($4.99 Micro-Vault Reload)'
  );
  const [testPrice, setTestPrice] = useState<number>(4.99);
  const [personaReactions, setPersonaReactions] = useState<PersonaReaction[]>(DEFAULT_EA_PERSONAS);

  // Live debate state
  const [debateQuestion, setDebateQuestion] = useState<string>(
    'Would you purchase a $4.99 Loss-Shield reset pack after losing 3 Weekend League matches in a row?'
  );
  const [isDebating, setIsDebating] = useState<boolean>(false);
  const [debateHistory, setDebateHistory] = useState<
    Array<{
      question: string;
      turns: DebateTurn[];
      takeaway: string;
    }>
  >([]);

  // 1-on-1 Interview state
  const [interviewMessages, setInterviewMessages] = useState<
    Array<{ sender: 'user' | 'persona'; text: string; time: string }>
  >([
    {
      sender: 'persona',
      text: "Yo! Marcus Vance here. Currently grinding FUT Champions Division 1. What creative or offer are we testing today?",
      time: 'Just now'
    }
  ]);
  const [interviewInput, setInterviewInput] = useState<string>('');
  const [isInterviewing, setIsInterviewing] = useState<boolean>(false);

  // Offer sensitivity state
  const [simulatedPrice, setSimulatedPrice] = useState<number>(4.99);

  // Sync with activeBrief on change
  useEffect(() => {
    if (activeBrief?.title) {
      setTestDirective(`${activeBrief.title} (${activeBrief.target_segment || 'Targeted Persona Flight'})`);
    }
  }, [activeBrief]);

  // Aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const totalResonance = personaReactions.reduce((acc, p) => acc + p.resonanceScore, 0);
    const avgResonance = Math.round(totalResonance / personaReactions.length);
    const avgWTP = (personaReactions.reduce((acc, p) => acc + p.wtp, 0) / personaReactions.length).toFixed(2);
    const convertCount = personaReactions.filter(p => p.action === 'CONVERT').length;
    const conversionRate = Math.round((convertCount / personaReactions.length) * 100);
    const churnMitigation = Math.round(avgResonance * 0.88);

    return {
      avgResonance,
      avgWTP,
      conversionRate,
      churnMitigation
    };
  }, [personaReactions]);

  // Handle running creative simulation
  const handleRunCreativeSimulation = async () => {
    setIsSimulating(true);
    try {
      // Simulate slight response variation based on test directive and price
      await new Promise(r => setTimeout(r, 1200));

      const updated = personaReactions.map(p => {
        const pricePenalty = testPrice > 9.99 ? -15 : testPrice > 5.99 ? -5 : 5;
        const newResonance = Math.min(99, Math.max(35, p.resonanceScore + (Math.random() * 8 - 4) + pricePenalty));
        const newWTP = +(testPrice * (0.8 + Math.random() * 0.4)).toFixed(2);
        const newAction: PersonaReaction['action'] =
          newResonance > 85 ? 'CONVERT' : newResonance > 70 ? 'CONSIDER' : newResonance > 50 ? 'CHURN_RISK' : 'ABANDON';

        return {
          ...p,
          resonanceScore: Math.round(newResonance),
          wtp: newWTP,
          action: newAction
        };
      });

      setPersonaReactions(updated);
    } catch (e) {
      console.error('Simulation error', e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Handle live debate
  const handleTriggerDebate = async (customQ?: string) => {
    const q = customQ || debateQuestion;
    if (!q.trim()) return;

    setIsDebating(true);
    try {
      const res = await fetch('/api/synthetic/deepsona/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q,
          campaign_title: testDirective,
          franchise: currentFranchise || 'EA SPORTS FC 26',
          price: testPrice,
          platform: 'discord'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.debate_turns && data.debate_turns.length > 0) {
          setDebateHistory(prev => [
            {
              question: q,
              turns: data.debate_turns,
              takeaway: data.synthesis || `Consensus: High interest from competitive cohorts with strong sensitivity to price points above $${testPrice}.`
            },
            ...prev
          ]);
          setDebateQuestion('');
          return;
        }
      }

      // Fallback if network or endpoint fails
      const fallbackTurns: DebateTurn[] = [
        {
          persona_id: 'marcus_vance',
          archetype: 'FUT Competitor',
          avatar: '⚡',
          name: 'Marcus Vance',
          message: `At $${testPrice.toFixed(2)}, this is an instant buy for me if it resets tilt on the defeat screen. Just don't gate loan players behind 30-game grinds.`,
          wtp: testPrice,
          fsm_state: 'CONVERT',
          sentiment_delta: '+18% Willingness'
        },
        {
          persona_id: 'kaito_takahashi',
          archetype: 'Esports Sweat',
          avatar: '🎯',
          name: 'Kaito Takahashi',
          message: `Agreed on the pricing, but make sure the UI displays the exact pack probabilities upfront. We care about competitive parity.`,
          wtp: testPrice * 0.9,
          fsm_state: 'CONSIDER',
          sentiment_delta: '+12% Trust'
        },
        {
          persona_id: 'alexandre_silva',
          archetype: 'Clubs Socializer',
          avatar: '🎮',
          name: 'Alexandre Silva',
          message: `Throw in a team vanity kit for Rush 5v5 and our entire Discord squad will pick this up before Friday night kick-off!`,
          wtp: testPrice * 1.2,
          fsm_state: 'CONVERT',
          sentiment_delta: '+24% Squad Buy'
        }
      ];

      setDebateHistory(prev => [
        {
          question: q,
          turns: fallbackTurns,
          takeaway: `Consensus across ${currentFranchise}: High willingness to adopt at $${testPrice.toFixed(2)} when paired with immediate defeat-screen trigger rules.`
        },
        ...prev
      ]);
      setDebateQuestion('');
    } catch (e) {
      console.warn('Debate execution error', e);
    } finally {
      setIsDebating(false);
    }
  };

  // Handle 1-on-1 Interview Send
  const handleSendInterview = async () => {
    if (!interviewInput.trim() || isInterviewing) return;

    const userText = interviewInput.trim();
    const activePersona = personaReactions.find(p => p.id === selectedPersonaId) || personaReactions[0];

    const newMsgs = [
      ...interviewMessages,
      { sender: 'user' as const, text: userText, time: 'Just now' }
    ];
    setInterviewMessages(newMsgs);
    setInterviewInput('');
    setIsInterviewing(true);

    try {
      const res = await fetch('/api/synthetic/deepsona/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `As ${activePersona.name} (${activePersona.archetype}, ${activePersona.division}): Answer this direct question from the EA creative director: "${userText}"`,
          campaign_title: testDirective,
          franchise: currentFranchise || 'EA SPORTS FC 26',
          price: testPrice,
          platform: 'focus_group'
        })
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        if (data.debate_turns && data.debate_turns[0]?.message) {
          replyText = data.debate_turns[0].message;
        } else if (data.synthesis) {
          replyText = data.synthesis;
        }
      }

      if (!replyText) {
        replyText = `From my perspective as a ${activePersona.archetype}, "${userText}" makes sense if it respects my time and skill. At $${testPrice.toFixed(2)}, I want transparent drop rates and immediate in-game payoff.`;
      }

      setInterviewMessages([
        ...newMsgs,
        { sender: 'persona', text: replyText, time: 'Just now' }
      ]);
    } catch (e) {
      setInterviewMessages([
        ...newMsgs,
        {
          sender: 'persona',
          text: `Honestly, looking at the current ${currentFranchise} meta, I'd say that delivers solid value as long as it's not locked behind excessive grind.`,
          time: 'Just now'
        }
      ]);
    } finally {
      setIsInterviewing(false);
    }
  };

  const selectedPersona = personaReactions.find(p => p.id === selectedPersonaId) || personaReactions[0];

  return (
    <div className="space-y-6">
      {/* Studio Header Card */}
      <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30">
                SYNTHETIC FOCUS TESTING
              </span>
              <span className="text-xs text-[#8FA3BC]">
                Multimodal Pre-Flight Creative Validation across EA Cohorts
              </span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-white">
              {franchiseInfo.label} Synthetic Persona Focus Group
            </h2>
            <p className="text-xs text-[#8FA3BC] mt-1 max-w-3xl">
              Pre-test marketing copy hooks, promotional price elasticity, and 3D visual assets against generative synthetic personas derived from telemetry and live-service spend clusters.
            </p>
          </div>

          {/* Top Aggregate KPI Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0E1A29] border border-[#253D5B] rounded-xl p-3 text-center">
              <div className="text-[10px] text-[#8FA3BC] font-mono uppercase">Resonance Index</div>
              <div className="text-xl font-mono font-bold text-[#E6FF00] mt-0.5">{aggregateMetrics.avgResonance}%</div>
              <div className="text-[9px] text-[#00C48C] mt-0.5">High Conviction</div>
            </div>
            <div className="bg-[#0E1A29] border border-[#253D5B] rounded-xl p-3 text-center">
              <div className="text-[10px] text-[#8FA3BC] font-mono uppercase">Conversion Rate</div>
              <div className="text-xl font-mono font-bold text-[#00F0FF] mt-0.5">{aggregateMetrics.conversionRate}%</div>
              <div className="text-[9px] text-[#8FA3BC] mt-0.5">Simulated Cohort</div>
            </div>
            <div className="bg-[#0E1A29] border border-[#253D5B] rounded-xl p-3 text-center">
              <div className="text-[10px] text-[#8FA3BC] font-mono uppercase">Avg Willingness</div>
              <div className="text-xl font-mono font-bold text-[#00C48C] mt-0.5">${aggregateMetrics.avgWTP}</div>
              <div className="text-[9px] text-[#8FA3BC] mt-0.5">Optimal Pricing</div>
            </div>
            <div className="bg-[#0E1A29] border border-[#253D5B] rounded-xl p-3 text-center">
              <div className="text-[10px] text-[#8FA3BC] font-mono uppercase">Churn Recovery</div>
              <div className="text-xl font-mono font-bold text-[#A855F7] mt-0.5">+{aggregateMetrics.churnMitigation}%</div>
              <div className="text-[9px] text-[#00C48C] mt-0.5">Tilt Mitigation</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#253D5B] overflow-x-auto">
          <button
            onClick={() => setActiveTab('creative')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'creative'
                ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
                : 'bg-[#0E1A29] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E6FF00]" />
            <span>Creative Hook Pre-Testing</span>
          </button>

          <button
            onClick={() => setActiveTab('debate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'debate'
                ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
                : 'bg-[#0E1A29] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Live Persona Debate Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'interview'
                ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
                : 'bg-[#0E1A29] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>1-on-1 Qualitative Interrogation</span>
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'offers'
                ? 'bg-[#0072BC] text-white shadow-[0_0_12px_rgba(0,114,188,0.5)]'
                : 'bg-[#0E1A29] text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-[#00C48C]" />
            <span>Price Elasticity & Offer Battle</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Creative Directive & Hook Pre-Testing */}
      {activeTab === 'creative' && (
        <div className="space-y-6">
          {/* Directive Input Control Bar */}
          <div className="bg-[#16263A] border border-[#253D5B] rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8FA3BC] mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00F0FF]" />
              Active Creative Directive Under Test
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-8">
                <input
                  type="text"
                  value={testDirective}
                  onChange={(e) => setTestDirective(e.target.value)}
                  placeholder="e.g. 2s Action Hook with Defeat-Streak Shield ($4.99 Starter Reload)"
                  className="w-full bg-[#0E1A29] border border-[#253D5B] rounded-xl px-4 py-3 text-xs text-white placeholder-[#8FA3BC]/50 focus:outline-none focus:border-[#00F0FF] transition-all font-sans"
                />
              </div>
              <div className="lg:col-span-2 flex items-center gap-2 bg-[#0E1A29] border border-[#253D5B] rounded-xl px-3 py-2">
                <DollarSign className="w-4 h-4 text-[#00C48C] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] text-[#8FA3BC] font-mono uppercase">Price Point</div>
                  <input
                    type="number"
                    step="0.50"
                    value={testPrice}
                    onChange={(e) => setTestPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="lg:col-span-2">
                <button
                  onClick={handleRunCreativeSimulation}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0072BC] hover:bg-[#008BE6] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,114,188,0.4)] disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Simulating...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-[#E6FF00] fill-current" />
                      <span>Simulate Cohorts</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Persona Feedback Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personaReactions.map((p) => {
              const isSelected = selectedPersonaId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPersonaId(p.id)}
                  className={`bg-[#16263A] border rounded-2xl p-5 transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)] bg-[#192B42]'
                      : 'border-[#253D5B] hover:border-[#3D5E88]'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0E1A29] border border-[#253D5B] flex items-center justify-center text-xl shadow-inner">
                        {p.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{p.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                            {p.archetype}
                          </span>
                        </div>
                        <div className="text-xs text-[#8FA3BC] mt-0.5">{p.division}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-mono font-bold text-[#E6FF00]">
                        {p.resonanceScore}%
                      </div>
                      <div className="text-[9px] text-[#8FA3BC] font-mono uppercase">Resonance</div>
                    </div>
                  </div>

                  {/* Telemetry Chips */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0E1A29] border border-[#253D5B] text-[#8FA3BC]">
                      LTV: ${p.ltv}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0E1A29] border border-[#253D5B] text-[#FF7A00]">
                      Loss Streak: {p.lossStreak}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0E1A29] border border-[#253D5B] text-[#A855F7]">
                      Tilt: {p.tilt}%
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ml-auto ${
                        p.action === 'CONVERT'
                          ? 'bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/30'
                          : p.action === 'CONSIDER'
                          ? 'bg-[#E6FF00]/15 text-[#E6FF00] border-[#E6FF00]/30'
                          : 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/30'
                      }`}
                    >
                      {p.action} (${p.wtp})
                    </span>
                  </div>

                  {/* Qualitative Feedback */}
                  <p className="text-xs text-slate-300 leading-relaxed italic bg-[#0E1A29]/70 rounded-xl p-3 border border-[#253D5B]/60 mb-4">
                    {p.feedback}
                  </p>

                  {/* Radar Resonance Sub-Scores */}
                  <div className="space-y-1.5 pt-2 border-t border-[#253D5B]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#8FA3BC]">Gameplay Excitement</span>
                      <span className="font-mono text-white">{p.radar.gameplayExcitement}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#0E1A29] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E6FF00] transition-all"
                        style={{ width: `${p.radar.gameplayExcitement}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-[#8FA3BC]">Pricing Fairness (${testPrice})</span>
                      <span className="font-mono text-white">{p.radar.pricingFairness}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#0E1A29] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00C48C] transition-all"
                        style={{ width: `${p.radar.pricingFairness}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Live Persona Debate Arena */}
      {activeTab === 'debate' && (
        <div className="space-y-6">
          {/* Debate Trigger Prompt Card */}
          <div className="bg-[#16263A] border border-[#253D5B] rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8FA3BC] mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#00F0FF]" />
              Inter-Persona Live Debate Simulator
            </h3>
            <p className="text-xs text-[#8FA3BC] mb-4">
              Trigger an autonomous multi-turn debate between high-spend whales, competitive sweats, and casual socializers reacting in real-time to your proposed marketing campaign.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                value={debateQuestion}
                onChange={(e) => setDebateQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTriggerDebate()}
                placeholder="Ask a question or prompt (e.g. Would you buy a $4.99 Loss-Shield reset pack after 3 defeats?)"
                className="flex-1 bg-[#0E1A29] border border-[#253D5B] rounded-xl px-4 py-3 text-xs text-white placeholder-[#8FA3BC]/50 focus:outline-none focus:border-[#00F0FF] transition-all font-sans"
              />
              <button
                onClick={() => handleTriggerDebate()}
                disabled={isDebating || !debateQuestion.trim()}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0072BC] hover:bg-[#008BE6] text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,114,188,0.4)] disabled:opacity-50 shrink-0"
              >
                {isDebating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Debating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Launch Debate</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Preset Questions */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#253D5B]">
              <span className="text-[10px] text-[#8FA3BC] uppercase font-mono mr-1">Presets:</span>
              {[
                "What if we lower the price to $2.99?",
                "Would you prefer 10-Game Loan R9 Icon or 500 FC Points?",
                "How does Weekend League loss tilt affect your willingness to buy?",
                "Should we include a 4-player Rush 5v5 Squad Evolution token?"
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDebateQuestion(preset);
                    handleTriggerDebate(preset);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#0E1A29] border border-[#253D5B] text-[11px] text-[#8FA3BC] hover:text-white hover:border-[#00F0FF] transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Debate History Feed */}
          <div className="space-y-4">
            {debateHistory.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#16263A] border border-[#253D5B] rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#253D5B] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                      DEBATE THREAD
                    </span>
                    <span className="text-xs font-bold text-white">"{item.question}"</span>
                  </div>
                  <span className="text-[10px] text-[#8FA3BC] font-mono">Gemini Flash Reasoning</span>
                </div>

                {/* Turns */}
                <div className="space-y-3">
                  {item.turns.map((turn, tIdx) => (
                    <div
                      key={tIdx}
                      className="bg-[#0E1A29] border border-[#253D5B] rounded-xl p-4 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#16263A] border border-[#253D5B] flex items-center justify-center text-base shrink-0">
                        {turn.avatar || '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{turn.name}</span>
                            <span className="text-[10px] text-[#8FA3BC] font-mono">
                              ({turn.archetype})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#00C48C] font-semibold">
                            {turn.sentiment_delta || `WTP: $${turn.wtp?.toFixed(2)}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{turn.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Synthesis Box */}
                {item.takeaway && (
                  <div className="bg-[#0072BC]/10 border border-[#0072BC]/30 rounded-xl p-3.5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#00F0FF] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase text-[#00F0FF]">
                        Strategic Synthesis
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5">{item.takeaway}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: 1-on-1 Persona Interrogation */}
      {activeTab === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Persona Selector Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8FA3BC] mb-2">
              Select Persona to Interrogate
            </h3>
            {personaReactions.map((p) => {
              const isSelected = selectedPersonaId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPersonaId(p.id);
                    setInterviewMessages([
                      {
                        sender: 'persona',
                        text: `Hey! I'm ${p.name} (${p.archetype}). Ask me anything about what makes me buy or churn in ${currentFranchise}.`,
                        time: 'Just now'
                      }
                    ]);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#192B42] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'bg-[#16263A] border-[#253D5B] hover:border-[#3D5E88]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0E1A29] border border-[#253D5B] flex items-center justify-center text-xl shrink-0">
                    {p.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{p.name}</div>
                    <div className="text-[10px] text-[#8FA3BC] truncate">{p.archetype}</div>
                    <div className="text-[10px] font-mono text-[#00C48C] mt-0.5">
                      LTV: ${p.ltv} • Tilt: {p.tilt}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Chat Console */}
          <div className="lg:col-span-8 bg-[#16263A] border border-[#253D5B] rounded-2xl p-6 shadow-xl flex flex-col h-[580px]">
            <div className="flex items-center justify-between border-b border-[#253D5B] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0E1A29] border border-[#253D5B] flex items-center justify-center text-lg">
                  {selectedPersona.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedPersona.name}</h4>
                  <div className="text-[10px] text-[#8FA3BC]">
                    {selectedPersona.division} • {selectedPersona.archetype}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30 font-semibold">
                LIVE INTERROGATION
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {interviewMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0072BC] text-white rounded-br-none shadow-md'
                        : 'bg-[#0E1A29] border border-[#253D5B] text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="text-[9px] text-[#8FA3BC] mb-1 font-mono">
                      {msg.sender === 'user' ? 'You (Creative Director)' : selectedPersona.name}
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isInterviewing && (
                <div className="flex justify-start">
                  <div className="bg-[#0E1A29] border border-[#253D5B] rounded-2xl rounded-bl-none p-3 text-xs text-[#8FA3BC] flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F0FF]" />
                    <span>{selectedPersona.name} is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="mt-4 pt-3 border-t border-[#253D5B] flex gap-2">
              <input
                type="text"
                value={interviewInput}
                onChange={(e) => setInterviewInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendInterview()}
                placeholder={`Ask ${selectedPersona.name} about creative resonance, pricing, or game mechanics...`}
                className="flex-1 bg-[#0E1A29] border border-[#253D5B] rounded-xl px-4 py-3 text-xs text-white placeholder-[#8FA3BC]/50 focus:outline-none focus:border-[#00F0FF] transition-all font-sans"
              />
              <button
                onClick={handleSendInterview}
                disabled={isInterviewing || !interviewInput.trim()}
                className="px-4 py-3 bg-[#0072BC] hover:bg-[#008BE6] text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Price Elasticity & Offer Battle */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="bg-[#16263A] border border-[#253D5B] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#00C48C] flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Live Price Elasticity & Conversion Curve
                </h3>
                <p className="text-xs text-[#8FA3BC] mt-1">
                  Adjust the price point slider to simulate cohort conversion drop-offs and revenue optimization for defeat-screen micro-vault reloads.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-[#0E1A29] border border-[#253D5B] rounded-xl p-3">
                <div>
                  <div className="text-[10px] text-[#8FA3BC] font-mono uppercase">Simulated Price</div>
                  <div className="text-2xl font-mono font-bold text-[#E6FF00]">
                    ${simulatedPrice.toFixed(2)}
                  </div>
                </div>
                <input
                  type="range"
                  min="0.99"
                  max="29.99"
                  step="0.50"
                  value={simulatedPrice}
                  onChange={(e) => setSimulatedPrice(parseFloat(e.target.value))}
                  className="w-40 accent-[#00F0FF]"
                />
              </div>
            </div>

            {/* Offer Comparison Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Tier 1: Tilt Reset Micro-Shield',
                  price: simulatedPrice,
                  offer: '500 FC Points + 10-Game Loan Hero Pick',
                  conversion: Math.max(12, Math.round(92 - simulatedPrice * 3.8)),
                  revenueYield: +(Math.max(12, Math.round(92 - simulatedPrice * 3.8)) * simulatedPrice * 24.5).toFixed(0),
                  dominantCohort: 'Competitive Grinder (Rank II+)'
                },
                {
                  title: 'Tier 2: Squad Rush 5v5 Booster',
                  price: simulatedPrice * 1.8,
                  offer: '1,050 FC Points + Rush 2x Squad XP Token',
                  conversion: Math.max(8, Math.round(75 - simulatedPrice * 2.9)),
                  revenueYield: +(Math.max(8, Math.round(75 - simulatedPrice * 2.9)) * simulatedPrice * 1.8 * 24.5).toFixed(0),
                  dominantCohort: 'Clubs & Social Squads'
                },
                {
                  title: 'Tier 3: Ultimate Season Pass Vault',
                  price: simulatedPrice * 4.2,
                  offer: '4,600 FC Points + Guaranteed Walkout Pack',
                  conversion: Math.max(4, Math.round(48 - simulatedPrice * 1.8)),
                  revenueYield: +(Math.max(4, Math.round(48 - simulatedPrice * 1.8)) * simulatedPrice * 4.2 * 24.5).toFixed(0),
                  dominantCohort: 'High-Spend Ultimate Team Whale'
                }
              ].map((tier, idx) => (
                <div
                  key={idx}
                  className="bg-[#0E1A29] border border-[#253D5B] rounded-xl p-5 relative overflow-hidden"
                >
                  <div className="text-xs font-bold text-white mb-1">{tier.title}</div>
                  <div className="text-[11px] text-[#8FA3BC] mb-4">{tier.offer}</div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8FA3BC]">Projected Conversion</span>
                        <span className="font-mono font-bold text-[#00F0FF]">{tier.conversion}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#16263A] rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-[#00F0FF] transition-all duration-300"
                          style={{ width: `${tier.conversion}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#253D5B]">
                      <span className="text-[#8FA3BC]">Expected Revenue Yield</span>
                      <span className="font-mono font-bold text-[#00C48C]">
                        ${tier.revenueYield.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-[#E6FF00] bg-[#16263A] rounded-lg p-2 text-center">
                      Primary Fit: {tier.dominantCohort}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default SyntheticTesting;
