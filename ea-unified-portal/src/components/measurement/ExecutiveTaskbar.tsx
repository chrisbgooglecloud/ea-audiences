'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ExecutiveTaskbar() {
  const [query, setQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const router = useRouter();

  const QUICK_PROMPTS = [
    { text: 'Detect Oct 24-27 Audience Overlaps', target: '/intake' },
    { text: 'Analyze Scene Performance (EA FC vs Apex)', target: '/shapley' },
    { text: 'Auto-Optimize Budget Allocation ($4.2M spend)', target: '/scenario' },
    { text: 'Scan Weather Demand Boosts (25 Markets)', target: '/geospine' },
  ];

  const handleExecute = (targetUrl?: string, customText?: string) => {
    const activeText = customText || query;
    if (!activeText.trim() && !targetUrl) return;

    setIsProcessing(true);
    setAgentResponse('AI Copilot: Analyzing campaign performance and loading insights...');

    setTimeout(() => {
      setIsProcessing(false);
      if (targetUrl) {
        router.push(targetUrl);
      } else {
        const lower = activeText.toLowerCase();
        if (lower.includes('intake') || lower.includes('collision') || lower.includes('fatigue') || lower.includes('brief')) {
          router.push('/intake');
        } else if (lower.includes('shapley') || lower.includes('creative') || lower.includes('bellingham') || lower.includes('heirloom') || lower.includes('fbi')) {
          router.push('/shapley');
        } else if (lower.includes('budget') || lower.includes('pacing') || lower.includes('spend') || lower.includes('curve') || lower.includes('meridian') || lower.includes('scenario')) {
          router.push('/scenario');
        } else if (lower.includes('weather') || lower.includes('dma') || lower.includes('geo') || lower.includes('map') || lower.includes('climate')) {
          router.push('/geospine');
        } else {
          router.push('/intake');
        }
      }
      setAgentResponse(null);
      setQuery('');
    }, 800);
  };

  return (
    <div className="bg-gradient-to-r from-[#111F30] via-[#16263A] to-[#111F30] border-b border-[#253D5B] py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Main Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute();
            }}
            className="flex-1 w-full flex items-center relative"
          >
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#FFB800]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'Optimize budget allocation across 25 markets under 20% guardrails'"
              className="w-full bg-[#0E1A29] border border-[#253D5B] focus:border-[#0072BC] text-white placeholder-[#8FA3BC] text-xs sm:text-sm rounded-md pl-10 pr-24 py-2 focus:outline-none shadow-inner shadow-black/40 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              className="absolute right-1.5 px-3 py-1 bg-[#0072BC] hover:bg-[#008BE6] disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-all flex items-center space-x-1 shadow-[0_0_12px_rgba(0,114,188,0.35)] cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Dispatch</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </form>

          {/* Quick Action Pills */}
          <div className="hidden xl:flex items-center space-x-2">
            <span className="text-[11px] uppercase tracking-wider text-[#8FA3BC] font-semibold">
              Fast Insights:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleExecute(prompt.target, prompt.text)}
                className="px-2.5 py-1 bg-[#0E1A29] hover:bg-[#1E334D] hover:text-white hover:border-[#0072BC] text-[#8FA3BC] border border-[#253D5B] rounded-md text-[11px] transition-all whitespace-nowrap cursor-pointer"
              >
                {prompt.text}
              </button>
            ))}
          </div>
        </div>

        {agentResponse && (
          <div className="mt-2 text-xs text-[#00C48C] font-mono flex items-center space-x-2 animate-pulse">
            <Bot className="w-3.5 h-3.5 text-[#00C48C]" />
            <span>{agentResponse}</span>
          </div>
        )}
      </div>
    </div>
  );
}
