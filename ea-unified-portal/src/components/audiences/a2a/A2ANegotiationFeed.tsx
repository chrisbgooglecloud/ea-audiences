"use client";

import React, { useState, useEffect } from "react";
import { A2AMessageType } from "@/lib/types";
import { ArrowRight, RefreshCw, X, Radio } from "lucide-react";

interface A2ANegotiationFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function A2ANegotiationFeed({ isOpen, onClose }: A2ANegotiationFeedProps) {
  const [messages, setMessages] = useState<A2AMessageType[]>([]);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/a2a");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-[420px] bg-[#0E1015]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-4 space-y-3 font-sans text-xs animate-spring-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-white tracking-tight">A2A Protocol Event Stream</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchMessages}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5"
          >
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-white">{m.sender}</span>
                <ArrowRight className="w-3 h-3 text-gray-500" />
                <span className="text-gray-300">{m.recipient}</span>
              </div>
              <span className="text-gray-500">{new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="text-[11px] font-semibold text-emerald-400">{m.intent}</div>

            <pre className="text-[10px] text-gray-300 bg-white/[0.02] p-2 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono">
              {JSON.stringify(m.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
