'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { A2AMessageType } from '@/types';

interface A2AEventBusContextType {
  messages: A2AMessageType[];
  publishMessage: (message: Omit<A2AMessageType, 'message_id' | 'timestamp' | 'status'>) => Promise<A2AMessageType>;
  clearMessages: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  unreadCount: number;
}

const INITIAL_MOCK_MESSAGES: A2AMessageType[] = [
  {
    message_id: "msg-001",
    correlation_id: "corr-fc26-brief-01",
    sender: "Jamie_DeepSonaAgent (Act 1)",
    recipient: "Curtis_CreativeStudioAgent (Act 2)",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    intent: "DISPATCH_AUDIENCE_BRIEF",
    payload: {
      cohort: "Competitive Grinders on 3+ Loss Streak",
      franchise: "EA SPORTS FC 26",
      dominant_archetype: "COMPETITIVE_GRINDER",
      churn_risk: 0.48,
      recommended_mechanic: "Squad Breach & Clear Action Hook",
      predicted_lift: "+34.2% Retention",
    },
    status: "DELIVERED",
  },
  {
    message_id: "msg-002",
    correlation_id: "corr-fc26-brief-01",
    sender: "Curtis_CreativeStudioAgent (Act 2)",
    recipient: "MediaBuyingAgent (Act 3)",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    intent: "ACK_REVISE_CREATIVE",
    payload: {
      asset_id: "asset-fc26-squad-breach",
      title: "FC 26 FUT Champions Tilt Shield (15s Action Hook)",
      surfaces: ["EA_APP_LAUNCHER", "STADIUM_BOARDS", "STREAMING_OVERLAYS"],
      funnel_stage: "ToFu_Exploration",
      cloud_storage_uri: "gs://eagames-ebc-demo-app-creative-assets/fc26_hook.mp4",
    },
    status: "DELIVERED",
  },
  {
    message_id: "msg-003",
    correlation_id: "corr-fc26-brief-01",
    sender: "MediaBuyingAgent (Act 3)",
    recipient: "Surya_CommerceMediaAgent (Act 4)",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    intent: "ALLOCATE_PROGRAMMATIC_SPEND",
    payload: {
      campaign_id: "camp-fc26-rebalance-01",
      channel: "Programmatic 3D In-Game",
      allocated_budget_usd: 85000,
      target_surfaces: ["STADIUM_BOARDS", "PAUSE_SCREENS"],
      target_dmas: [501, 803, 602, 506, 819],
      ias_dwell_threshold_sec: 1.5,
      pacing_daily_limit_usd: 17000,
    },
    status: "DELIVERED",
  },
  {
    message_id: "msg-004",
    correlation_id: "corr-fc26-brief-01",
    sender: "Surya_CommerceMediaAgent (Act 4)",
    recipient: "MediaBuyingAgent (Act 3)",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    intent: "ACK_ALLOCATE_PROGRAMMATIC_SPEND",
    payload: {
      status: "ACTIVE_SERVING",
      active_matches_serving: 420,
      delivered_impressions: 128450,
      ias_brand_safety_score: 0.98,
      avg_camera_dwell_sec: 3.4,
      clearing_cpm_usd: 28.5,
    },
    status: "DELIVERED",
  },
];

const A2AEventBusContext = createContext<A2AEventBusContextType | undefined>(undefined);

export function A2AEventBusProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<A2AMessageType[]>(INITIAL_MOCK_MESSAGES);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const publishMessage = async (
    msg: Omit<A2AMessageType, 'message_id' | 'timestamp' | 'status'>
  ): Promise<A2AMessageType> => {
    const newMessage: A2AMessageType = {
      ...msg,
      message_id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
    };

    setMessages((prev) => [newMessage, ...prev]);
    if (!isDrawerOpen) {
      setUnreadCount((c) => c + 1);
    }

    try {
      await fetch('/api/a2a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage),
      });
    } catch (e) {
      console.warn('A2A backend sync skipped, local event bus updated.');
    }

    return newMessage;
  };

  const clearMessages = () => {
    setMessages([]);
    setUnreadCount(0);
  };

  const handleOpenDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
    if (open) setUnreadCount(0);
  };

  return (
    <A2AEventBusContext.Provider
      value={{
        messages,
        publishMessage,
        clearMessages,
        isDrawerOpen,
        setIsDrawerOpen: handleOpenDrawer,
        unreadCount,
      }}
    >
      {children}
    </A2AEventBusContext.Provider>
  );
}

export function useA2AEventBus() {
  const context = useContext(A2AEventBusContext);
  if (!context) {
    throw new Error('useA2AEventBus must be used within an A2AEventBusProvider');
  }
  return context;
}
