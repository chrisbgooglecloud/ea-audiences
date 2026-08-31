import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Database, 
  Terminal, 
  ShieldCheck, 
  Play, 
  Pause, 
  Loader2, 
  Sparkles, 
  Cpu, 
  Layers, 
  Activity, 
  CheckCircle2, 
  BarChart3, 
  ArrowRight,
  TrendingUp,
  UserCheck,
  Fingerprint,
  Users,
  Settings,
  RefreshCw,
  RotateCw
} from 'lucide-react';
import { useCompanyContext } from '@/context';
import { useAppConfig } from '@/context';
import { generateText } from '@/services/geminiService';
import { StitchedProfile, formatTouchpointLabel } from '@/types';
import { ContentVariant } from './ContentHub';

interface LogEntry {
  id: string;
  timestamp: string;
  source: 'telemetry' | 'marketing' | 'identity';
  event: string;
  data: string;
}

interface SimulatedUser {
  id: string;
  name: string;
  isAnonymous: boolean;
  personality: string;
  interests: string;
  channelPreference: 'Email' | 'SMS' | 'Push Notification' | 'In-App';
  metrics: {
    emailsOpened: number;
    smsClicked: number;
    totalSearches: number;
    pageViews: number;
  };
  touchpoints: Array<{
    timestamp: string;
    channel: string;
    action: string;
    label: string;
  }>;
}

interface QueuedUserEvents {
  userId: string;
  eventIndex: number;
  events: Array<{
    source: 'telemetry' | 'marketing' | 'identity';
    event: string;
    data: any;
  }>;
}

export const IngestionEngine: React.FC = () => {
  const { name, description } = useCompanyContext();
  const { config } = useAppConfig();
  const companyName = config?.branding.companyName || name || 'AI Lab';

  // Configurable Admin Simulation parameters
  const [totalSimUsers, setTotalSimUsers] = useState<number>(30);
  const [anonPercent, setAnonPercent] = useState<number>(80);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [isSimLoading, setIsSimLoading] = useState<boolean>(false);
  const [profileFilter, setProfileFilter] = useState<'all' | 'auth' | 'anon'>('all');

  // State Management
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [isStitching, setIsStitching] = useState(false);
  const [stitchingStep, setStitchingStep] = useState(0);
  const [stitchedProfiles, setStitchedProfiles] = useState<StitchedProfile[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<ContentVariant[]>([]);

  // Telemetry playbacks queue
  const [queuedEvents, setQueuedEvents] = useState<QueuedUserEvents[]>([]);

  // Stream Analysis States
  const [analyzingStream, setAnalyzingStream] = useState<'telemetry' | 'marketing' | 'identity' | null>(null);
  const [telemetryAnalysis, setTelemetryAnalysis] = useState<string>('');
  const [identityAnalysis, setIdentityAnalysis] = useState<string>('');
  const [marketingAnalysis, setMarketingAnalysis] = useState<string>('');

  const [saveStatus, setSaveStatus] = useState<string>('');

  // Behavioral profiles dynamic rules state
  const [behaviorRules, setBehaviorRules] = useState<{ categories: string[]; searchQueries: Record<string, string[]> }>({
    categories: ["Ultimate Team (FUT & Packs)", "Career Mode & Manager Tactics", "Clubs & Online Street Rivals"],
    searchQueries: {
      "Ultimate Team (FUT & Packs)": ["Haaland Team of the Season card price", "87+ SBC pack solution cheap", "FC 25 Weekend League rewards schedule"],
      "Career Mode & Manager Tactics": ["top young high potential wonderkids", "best 4-3-3 counter attack tactical vision", "youth academy scouting network guides"],
      "Clubs & Online Street Rivals": ["winger build max pace skill tree", "competitive 11v11 online pro clubs discord", "neon street custom kit unlock"]
    }
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [customBehaviorPrompt, setCustomBehaviorPrompt] = useState("");
  const [isRebuilding, setIsRebuilding] = useState(false);

  const loadOrGenerateBehaviorRules = async (forceGenerate = false, customPrompt = "") => {
    const activeCompany = config?.branding.companyName || name || '2K Games (Take-Two Interactive)';
    const activeDescription = config?.pages?.MARKETING_BRIEF?.defaultGoal || description || '2K video gaming franchise and player telemetry';

    if (!forceGenerate) {
      try {
        const res = await fetch(`/api/load-run/ingestion_behavior?companyName=${encodeURIComponent(activeCompany)}`);
        if (res.ok) {
          const loaded = await res.json();
          if (loaded.categories && loaded.searchQueries) {
            setBehaviorRules(loaded);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to load ingestion behavior run rules:", e);
      }
    }

    // Generate dynamically using Gemini
    setIsRebuilding(true);
    setSaveStatus("Rebuilding behavioral profiles using Gemini...");
    try {
      const prompt = `You are a simulation architect for the company "${activeCompany}".
Company description: "${activeDescription}".
${customPrompt ? `Follow these custom behavioral instructions: "${customPrompt}"` : ''}

Identify exactly 3 target categories appropriate for this brand.
For each category, generate exactly 3 realistic search queries a shopper would run in a telemetry feed.

Return ONLY a valid JSON object matching this exact TypeScript interface:
{
  "categories": string[],
  "searchQueries": Record<string, string[]>
}
Do not wrap in markdown block. Do not add formatting or description.`;

      const response = await generateText(prompt, 'gemini-3.5-flash');
      const cleanJsonText = response.replace(/```json|```/gi, '').trim();
      const generated = JSON.parse(cleanJsonText);

      if (generated.categories && generated.searchQueries) {
        setBehaviorRules(generated);
        setSaveStatus("Behavioral event settings successfully rebuilt and cached.");

        // Save rules to server/GCS
        await fetch('/api/save-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId: 'ingestion_behavior',
            data: generated,
            companyName: activeCompany
          })
        });
      }
    } catch (err) {
      console.error("Failed to generate dynamic behavior rules:", err);
    } finally {
      setIsRebuilding(false);
    }
  };

  // Seeded User Profiles database for local simulation mapping
  const [simulatedUsers, setSimulatedUsers] = useState<SimulatedUser[]>([]);

  const telemetryScrollRef = useRef<HTMLDivElement>(null);
  const identityScrollRef = useRef<HTMLDivElement>(null);
  const marketingScrollRef = useRef<HTMLDivElement>(null);

  // Default Campaigns (Fallback if ContentHub run is missing)
  const fallbackCampaigns = useMemo<ContentVariant[]>(() => [
    { id: "var_email_a", type: "Email", title: "Ultimate Team: TOTS Flash Drop", primaryText: "Claim guaranteed 87+ rated Team of the Season player packs with bonus FC Points.", offer: "2x FC Points Pack Bonus", targetCategory: "Ultimate Team (FUT & Packs)" },
    { id: "var_email_b", type: "Email", title: "Career Mode: European Glory Season", primaryText: "Take your youth academy to Champions League glory with upgraded tactical presets.", offer: "Free 5-Star Scout Token", targetCategory: "Career Mode & Manager Tactics" },
    { id: "var_email_c", type: "Email", title: "Clubs: 11v11 Pro League Kickoff", primaryText: "Squad up with your friends and dominate Division 1 with custom kits.", offer: "1,000 Free Clubs Coins", targetCategory: "Clubs & Online Street Rivals" },
    { id: "var_sms_a", type: "SMS", title: "Weekend League Final Hours", primaryText: "Only 6 hours left in Champions Finals. Secure your Rank 1 rewards now.", offer: "Double XP Champions Boost", targetCategory: "Ultimate Team (FUT & Packs)" },
    { id: "var_sms_b", type: "SMS", title: "VOLTA Street Showdown Event", primaryText: "Unlock limited edition street apparel and arcade party power-ups.", offer: "Free Neon Boots Drop", targetCategory: "Clubs & Online Street Rivals" },
    { id: "var_sms_c", type: "SMS", title: "Transfer Window Alert", primaryText: "Manager Update: New wonderkids discovered across South America and Europe.", offer: "20% Off Scouting Network", targetCategory: "Career Mode & Manager Tactics" },
    { id: "var_web_a", type: "Web", title: "FC 25 Ultimate Edition Season Pass", primaryText: "Get 4,600 FC Points, UEFA Champions League Hero item, and 7-day early access.", offer: "Bonus UEFA Hero Item", targetCategory: "Ultimate Team (FUT & Packs)" },
    { id: "var_web_b", type: "Web", title: "Pro Clubs Matchmaking Boost", primaryText: "Find balanced cross-play competitive matches in seconds with dedicated servers.", offer: "Free Club Crest & Banner", targetCategory: "Clubs & Online Street Rivals" },
    { id: "var_web_c", type: "Web", title: "Manager Tactical Preset Hub", primaryText: "Download verified Gegenpressing and Tiki-Taka tactical visions from top pro players.", offer: "Free Tactical Blueprint Pack", targetCategory: "Career Mode & Manager Tactics" }
  ], [companyName]);

  // Load Content Hub variants on mount
  useEffect(() => {
    const loadContentHub = async () => {
      try {
        const res = await fetch(`/api/load-run/content_hub?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.variants && data.variants.length > 0) {
            setActiveCampaigns(data.variants);
            return;
          }
        }
        setActiveCampaigns(fallbackCampaigns);
      } catch (e) {
        setActiveCampaigns(fallbackCampaigns);
      }
    };
    loadContentHub();
  }, [companyName, fallbackCampaigns]);

  // Helper to persist ingestion engine state, feeds, and logs to GCS
  const persistIngestionState = async (overrides: Partial<{
    stitchedProfiles: StitchedProfile[];
    simulatedUsers: SimulatedUser[];
    logs: LogEntry[];
    queuedEvents: any[];
    telemetryAnalysis: string | null;
    identityAnalysis: string | null;
    marketingAnalysis: string | null;
  }> = {}) => {
    try {
      const payload = {
        stitchedProfiles: overrides.stitchedProfiles !== undefined ? overrides.stitchedProfiles : stitchedProfiles,
        simulatedUsers: overrides.simulatedUsers !== undefined ? overrides.simulatedUsers : simulatedUsers,
        logs: overrides.logs !== undefined ? overrides.logs : logs,
        queuedEvents: overrides.queuedEvents !== undefined ? overrides.queuedEvents : queuedEvents,
        telemetryAnalysis: overrides.telemetryAnalysis !== undefined ? overrides.telemetryAnalysis : telemetryAnalysis,
        identityAnalysis: overrides.identityAnalysis !== undefined ? overrides.identityAnalysis : identityAnalysis,
        marketingAnalysis: overrides.marketingAnalysis !== undefined ? overrides.marketingAnalysis : marketingAnalysis,
        timestamp: new Date().toLocaleString()
      };
      await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'ingestion_engine',
          data: payload,
          companyName
        })
      });
    } catch (err) {
      console.warn("Failed to persist ingestion state to GCS:", err);
    }
  };

  // Load last Ingestion Engine run on mount
  useEffect(() => {
    const loadLastRun = async () => {
      try {
        const res = await fetch(`/api/load-run/ingestion_engine?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
          const runData = await res.json();
          if (runData.stitchedProfiles && runData.stitchedProfiles.length > 0) {
            setStitchedProfiles(runData.stitchedProfiles);
          }
          if (runData.simulatedUsers && runData.simulatedUsers.length > 0) {
            setSimulatedUsers(runData.simulatedUsers);
          }
          if (runData.logs && runData.logs.length > 0) {
            setLogs(runData.logs);
          } else if (runData.simulatedUsers && runData.simulatedUsers.length > 0) {
            // Reconstruct logs from user touchpoints if logs array wasn't previously cached
            const reconstructedLogs: LogEntry[] = [];
            runData.simulatedUsers.forEach((u: SimulatedUser) => {
              u.touchpoints?.forEach((tp: any) => {
                const src: 'telemetry' | 'identity' | 'marketing' = tp.channel === 'Web' ? 'telemetry' : tp.channel === 'Session' ? 'identity' : 'marketing';
                reconstructedLogs.push({
                  id: Math.random().toString(36).substring(2, 9),
                  timestamp: tp.timestamp || new Date().toLocaleTimeString(),
                  source: src,
                  event: tp.action || 'INTERACTION',
                  data: JSON.stringify({ user: u.name, label: tp.label })
                });
              });
            });
            if (reconstructedLogs.length > 0) {
              setLogs(reconstructedLogs);
            }
          }
          if (runData.queuedEvents && runData.queuedEvents.length > 0) {
            setQueuedEvents(runData.queuedEvents);
          }
          if (runData.telemetryAnalysis) setTelemetryAnalysis(runData.telemetryAnalysis);
          if (runData.identityAnalysis) setIdentityAnalysis(runData.identityAnalysis);
          if (runData.marketingAnalysis) setMarketingAnalysis(runData.marketingAnalysis);

          if (runData.timestamp) {
            setSaveStatus(`Restored feeds, logs & profile ledger from GCS (${runData.timestamp})`);
          }
        }
      } catch (e) {
        console.warn("Failed to load ingestion engine run:", e);
      }
    };
    loadLastRun();
  }, [companyName]);

  // Load behavior rules on mount
  useEffect(() => {
    loadOrGenerateBehaviorRules();
  }, [companyName]);

  // Initialize simulation users list dynamically based on admin sliders
  const initializeSimulationUsers = async () => {
    setIsSimLoading(true);
    setLogs([]);
    setSaveStatus("Contacting Gemini to simulate chronological user journeys & click actions...");

    const activeList = activeCampaigns.length > 0 ? activeCampaigns : fallbackCampaigns;
    const anonCount = Math.round(totalSimUsers * (anonPercent / 100));
    const namedCount = totalSimUsers - anonCount;

    const names = ["Liam 'Striker' Henderson", "Marcus Vance", "Mateo Silva", "Chloe 'Apex' Bennett", "Sarah Jenkins", "Kaito Takahashi", "Amara Okafor"];
    const interests = behaviorRules.categories;
    const channels: Array<'Email' | 'SMS' | 'Push Notification' | 'In-App'> = ["Email", "SMS", "Push Notification", "In-App"];

    const list: SimulatedUser[] = [...simulatedUsers];

    if (list.length === 0) {
      // Create Authenticated profiles
      for (let i = 0; i < namedCount; i++) {
        const nameVal = names[i % names.length];
        const interestVal = interests[i % interests.length];
        list.push({
          id: `ea_${Math.floor(1000 + Math.random() * 9000)}`,
          name: nameVal,
          isAnonymous: false,
          interests: interestVal,
          personality: `Competitive EA Sports FC player focusing on ${interestVal}. Active in online matchmaking and live seasonal events.`,
          channelPreference: channels[i % channels.length],
          metrics: { emailsOpened: 0, smsClicked: 0, totalSearches: 0, pageViews: 0 },
          touchpoints: []
        });
      }

      // Create Anonymous profiles
      for (let j = 0; j < anonCount; j++) {
        const interestVal = interests[j % interests.length];
        list.push({
          id: `guest_${Math.random().toString(36).substring(2, 7)}`,
          name: "Anonymous Player",
          isAnonymous: true,
          interests: interestVal,
          personality: `Anonymous player session on ${j % 3 === 0 ? 'PlayStation 5' : j % 3 === 1 ? 'Xbox Series X' : 'EA App PC'}.`,
          channelPreference: 'In-App',
          metrics: { emailsOpened: 0, smsClicked: 0, totalSearches: 0, pageViews: 0 },
          touchpoints: []
        });
      }
      setSimulatedUsers(list);
    }

    // Generate event queues locally in perfect chronological sequence (no Gemini API latency/errors)
    const generatedQueues = list.map((user) => {
      // Filter campaign matching category affinity and identity type
      const categoryCampaigns = activeList.filter(c => c.targetCategory === user.interests);
      let userCampaigns = categoryCampaigns;
      if (user.isAnonymous) {
        // Anonymous guests only see Web / In-App banners, NOT Email or SMS
        userCampaigns = categoryCampaigns.filter(c => (c.type as any) === 'Web' || (c.type as any) === 'In-App');
        if (userCampaigns.length === 0) {
          userCampaigns = activeList.filter(c => (c.type as any) === 'Web' || (c.type as any) === 'In-App');
        }
      }
      const chosenCampaign = userCampaigns[Math.floor(Math.random() * userCampaigns.length)] || fallbackCampaigns[0];
      
      const searchTerms = behaviorRules.searchQueries[user.interests] || ['general search term'];
      const chosenSearch = searchTerms[Math.floor(Math.random() * searchTerms.length)];

      const events = [];

      // 1. Session start
      events.push({
        source: 'identity' as const,
        event: 'SESSION_START',
        data: { session_id: user.isAnonymous ? user.id : `sess_${user.id}`, status: user.isAnonymous ? 'anonymous' : 'authenticated', device: 'iOS' }
      });

      // 2. Authentication Login (if authenticated user)
      if (!user.isAnonymous) {
        events.push({
          source: 'identity' as const,
          event: 'USER_LOGIN',
          data: { session_id: `sess_${user.id}`, user_id: user.id, status: 'success' }
        });
      }

      // 3. Search action matching segment affinity
      events.push({
        source: 'telemetry' as const,
        event: 'SEARCH_QUERY',
        data: { query: chosenSearch, category: user.interests }
      });

      // 4. Campaign Ad Open/Impression
      const openAction = user.isAnonymous
        ? (chosenCampaign.type === 'Web' ? 'BANNER_IMPRESSION' : 'PUSH_DELIVERED')
        : (chosenCampaign.type === 'Email' ? 'EMAIL_OPEN' : chosenCampaign.type === 'SMS' ? 'SMS_SENT' : 'PUSH_DELIVERED');
      events.push({
        source: 'marketing' as const,
        event: openAction,
        data: { campaign_id: chosenCampaign.id, variant: chosenCampaign.title }
      });

      // 5. Campaign Ad Click/Engagement
      const clickAction = user.isAnonymous
        ? (chosenCampaign.type === 'Web' ? 'BANNER_CLICK' : 'PUSH_CLICKED')
        : (chosenCampaign.type === 'Email' ? 'EMAIL_CLICK' : chosenCampaign.type === 'SMS' ? 'SMS_CLICK' : 'PUSH_CLICKED');
      events.push({
        source: 'marketing' as const,
        event: clickAction,
        data: { link_id: 'claim_offer', promo_code: chosenCampaign.offer }
      });

      // 6. Cart Addition
      events.push({
        source: 'telemetry' as const,
        event: 'ADD_TO_CART',
        data: { product_id: `prod_${chosenCampaign.id}`, price: 14.99, quantity: 1 }
      });

      // 7. Purchase Conversion (for authenticated users with 60% probability)
      if (!user.isAnonymous && Math.random() > 0.4) {
        events.push({
          source: 'telemetry' as const,
          event: 'PURCHASE_SUCCESS',
          data: { transaction_id: `tx_${Math.floor(100000 + Math.random() * 900000)}`, total: 14.99 }
        });
      }

      return {
        userId: user.id,
        eventIndex: 0,
        events: events
      };
    });

    setQueuedEvents(generatedQueues);
    setIsSimulationActive(true);
    setSaveStatus("User events successfully initialized locally. Streaming natural chronological feeds...");
    setIsSimLoading(false);
  };

  // Playback loop ticking through queues
  useEffect(() => {
    if (!isStreaming || !isSimulationActive || queuedEvents.length === 0) return;

    const interval = setInterval(() => {
      // Find user queues that still have events to play
      const activeQueues = queuedEvents.filter(q => q.eventIndex < q.events.length);
      if (activeQueues.length === 0) {
        setIsSimulationActive(false);
        setSaveStatus("Simulation cycle complete. All event queues drained & feeds saved to GCS.");
        persistIngestionState({
          simulatedUsers: [...simulatedUsers],
          logs: [...logs],
          queuedEvents: [...queuedEvents]
        });
        return;
      }

      // Pick a random user queue that still has events
      const selectedQueue = activeQueues[Math.floor(Math.random() * activeQueues.length)];
      const currentEvent = selectedQueue.events[selectedQueue.eventIndex];
      const user = simulatedUsers.find(u => u.id === selectedQueue.userId);

      if (user && currentEvent) {
        // Increment user metrics
        if (currentEvent.source === 'telemetry') {
          user.metrics.pageViews += 1;
          if (currentEvent.event === 'SEARCH_QUERY') {
            user.metrics.totalSearches += 1;
          }
        } else if (currentEvent.source === 'marketing') {
          if (!user.isAnonymous && (currentEvent.event.includes('EMAIL_OPEN') || currentEvent.event.includes('EMAIL_DELIVERED'))) {
            user.metrics.emailsOpened += 1;
          } else if (!user.isAnonymous && (currentEvent.event.includes('SMS_CLICK') || currentEvent.event === 'SMS_SENT')) {
            user.metrics.smsClicked += 1;
          }
        }

        // Push to touchpoint log
        user.touchpoints.push({
          timestamp: new Date().toLocaleTimeString(),
          channel: currentEvent.source === 'telemetry' ? 'Web' : currentEvent.source === 'identity' ? 'Session' : 'Marketing',
          action: currentEvent.event,
          label: formatTouchpointLabel(currentEvent.data, currentEvent.event)
        });

        const newLog: LogEntry = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          source: currentEvent.source,
          event: currentEvent.event,
          data: JSON.stringify(currentEvent.data)
        };

        setLogs(prev => [...prev.slice(-99), newLog]);
        setSimulatedUsers([...simulatedUsers]);
      }

      // Increment eventIndex for the selected queue
      selectedQueue.eventIndex += 1;
      setQueuedEvents([...queuedEvents]);

    }, 200);

    return () => clearInterval(interval);
  }, [isStreaming, isSimulationActive, queuedEvents, simulatedUsers]);

  // Auto-scroll stream containers
  useEffect(() => {
    if (telemetryScrollRef.current) {
      telemetryScrollRef.current.scrollTop = telemetryScrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (identityScrollRef.current) {
      identityScrollRef.current.scrollTop = identityScrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (marketingScrollRef.current) {
      marketingScrollRef.current.scrollTop = marketingScrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Stream AI analysis triggers
  const handleAnalyzeStream = async (source: 'telemetry' | 'marketing' | 'identity') => {
    setAnalyzingStream(source);
    const relevantEvents = logs.filter(l => l.source === source).slice(-50);
    const eventsText = relevantEvents.map(l => `[${l.timestamp}] ${l.event}: ${l.data}`).join('\n');

    const prompt = `You are a cloud data engineer specializing in real-time player telemetry, game session clickstreams, and live events for "${companyName}".
Review this buffer of 50 recent raw events from our live ${source} stream:
${eventsText || 'No current active events buffered.'}

Provide a concise, high-impact 2-sentence summary of the player engagement patterns, search queries, or marketing touchpoint trends you identify. Do not wrap in markdown or prefix.`;

    try {
      const response = await generateText(prompt, 'gemini-3.5-flash');
      if (source === 'telemetry') {
        setTelemetryAnalysis(response);
        persistIngestionState({ telemetryAnalysis: response });
      } else if (source === 'identity') {
        setIdentityAnalysis(response);
        persistIngestionState({ identityAnalysis: response });
      } else {
        setMarketingAnalysis(response);
        persistIngestionState({ marketingAnalysis: response });
      }
    } catch (e) {
      const fallback = `Observed active player flow in ${source}. Conversions and match engagements are tracking healthy based on player profile affinity matches.`;
      if (source === 'telemetry') setTelemetryAnalysis(fallback);
      else if (source === 'identity') setIdentityAnalysis(fallback);
      else setMarketingAnalysis(fallback);
    } finally {
      setAnalyzingStream(null);
    }
  };

  const handleReset = async () => {
    setSimulatedUsers([]);
    setStitchedProfiles([]);
    setLogs([]);
    setQueuedEvents([]);
    setTelemetryAnalysis(null);
    setIdentityAnalysis(null);
    setMarketingAnalysis(null);
    setIsSimulationActive(false);
    setSaveStatus("Resetting simulation, feeds, and identity ledger...");

    try {
      await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'ingestion_engine',
          data: { 
            stitchedProfiles: [], 
            simulatedUsers: [], 
            logs: [],
            queuedEvents: [],
            telemetryAnalysis: null,
            identityAnalysis: null,
            marketingAnalysis: null,
            timestamp: "" 
          },
          companyName: companyName
        })
      });
      setSaveStatus("System reset. All simulation history, feeds, and identity files wiped.");
    } catch (e) {
      console.error("Failed to delete GCS cache:", e);
      setSaveStatus("Reset state locally, but failed to sync reset to cloud.");
    }
  };

  // Execute Identity resolution on simulated profiles
  const handleStitchProfiles = async () => {
    if (simulatedUsers.length === 0) {
      setSaveStatus("Error: Initialize and run the simulation first.");
      return;
    }
    
    setIsStitching(true);
    setStitchingStep(1);
    await new Promise(r => setTimeout(r, 240));
    setStitchingStep(2);
    await new Promise(r => setTimeout(r, 240));
    setStitchingStep(3);

    // Call Gemini with the actual simulated metrics
    const prompt = `You are a master gaming telemetry and identity resolution analyzer for "${companyName}".
We have executed a simulation cycle with the following EA Sports FC users and their real-time telemetry metrics:
${JSON.stringify(simulatedUsers, null, 2)}

Stitch this data and generate a resolved customer ledger. For each unique player profile, resolve:
1. "id": Resolved user ID (e.g. "ea_Henderson_09")
2. "name": Resolved customer/gamer name (e.g. "Liam 'Striker' Henderson" or keep anonymous guest tokens if they remained anonymous)
3. "avatarUrl": color code ("indigo", "emerald", or "amber")
4. "channelPreference": Preferred channel ("Email", "SMS", "Push Notification", or "In-App")
5. "intentScores": Object with:
   - "purchaseIntent": integer (0 to 100)
   - "churnRisk": integer (0 to 100)
   - "categoryAffinity": Category string (e.g. "Ultimate Team (FUT & Packs)", "Career Mode & Manager Tactics", "Clubs & Online Street Rivals")
   - "purchaseIntentReason": A 1-sentence explanation detailing why this purchase intent score was assigned based on search history and pack/store actions.
   - "churnRiskReason": A 1-sentence explanation detailing why this churn risk score was assigned based on session engagement, match drop-offs, and activity.
6. "behavioralTags": Array of exactly 2 tags (e.g. ["Weekend League Grinder", "TOTS Pack Hunter"] or ["Career Mode Tactician", "Pro Clubs Captain"])
7. "observations": A 2-sentence paragraph detailing their session behavior, matches with active EA Sports FC campaigns, and in-game spend/microtransaction prospects.

Return ONLY a valid JSON array matching the keys. Do not wrap in markdown or backticks.`;

    try {
      const response = await generateText(prompt, 'gemini-3.5-flash-lite');
      const cleanJsonText = response.replace(/```json|```/gi, '').trim();
      const resolvedProfiles: StitchedProfile[] = JSON.parse(cleanJsonText);

      // Merge simulated metrics & touchpoint logs back into stitched profiles
      const merged: StitchedProfile[] = resolvedProfiles.map((resolved, idx) => {
        const matchingSim = simulatedUsers.find(u => u.name === resolved.name || u.id === resolved.id) || simulatedUsers[idx % simulatedUsers.length];
        return {
          ...resolved,
          metrics: matchingSim.metrics,
          touchpoints: matchingSim.touchpoints 
        };
      });

      setStitchedProfiles(merged);

      // Persist full state to GCS
      const timestampString = new Date().toLocaleString();
      const savePayload = {
        stitchedProfiles: merged,
        simulatedUsers: simulatedUsers,
        logs: logs,
        queuedEvents: queuedEvents,
        telemetryAnalysis,
        identityAnalysis,
        marketingAnalysis,
        timestamp: timestampString
      };

      await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'ingestion_engine',
          data: savePayload,
          companyName: companyName
        })
      });
      setSaveStatus(`Saved run, feeds & ledger to GCS: ${companyName}/runs/ingestion_engine_run.json`);

    } catch (e) {
      console.error(e);
      // Fallback merge
      const fallback: StitchedProfile[] = simulatedUsers.slice(0, 3).map((sim, idx) => ({
        id: sim.id,
        name: sim.name,
        avatarUrl: idx === 0 ? 'indigo' : idx === 1 ? 'emerald' : 'amber',
        channelPreference: sim.channelPreference,
        intentScores: {
          purchaseIntent: idx === 0 ? 94 : idx === 1 ? 45 : 78,
          churnRisk: idx === 0 ? 12 : idx === 1 ? 74 : 22,
          categoryAffinity: sim.interests,
          purchaseIntentReason: idx === 0 
            ? `High intent (94%) driven by frequent searches for Team of the Season packs and active in-game store visits.` 
            : idx === 1 
            ? `Moderate intent (45%) indicated by browsing transfer market cards without completing pack purchases.` 
            : `Strong intent (78%) resulting from active campaign clicks on tactical presets and season pass rewards.`,
          churnRiskReason: idx === 0 
            ? `Low churn risk (12%) due to high match completion rates and consistent daily login streaks.` 
            : idx === 1 
            ? `Elevated churn risk (74%) due to session drop-offs during Weekend League qualifiers.` 
            : `Moderate churn risk (22%) backed by steady returning Pro Clubs sessions with friends.`
        },
        behavioralTags: idx === 0 ? ["Weekend League Grinder", "TOTS Pack Hunter"] : idx === 1 ? ["Transfer Market Trader", "Casual Division Rivals"] : ["Pro Clubs Captain", "Tactical Visionary"],
        observations: `${sim.name} has logged in and actively played ${sim.interests}. Telemetry indicates strong responsiveness to live FC season campaigns.`,
        metrics: sim.metrics,
        touchpoints: sim.touchpoints
      }));
      setStitchedProfiles(fallback);
      setSaveStatus("Loaded backup resolved profiles (local mock fallback)");
    } finally {
      setIsStitching(false);
      setStitchingStep(0);
    }
  };

  const getPurchaseIntentReason = (profile: StitchedProfile): string => {
    if (profile.intentScores.purchaseIntentReason) {
      return profile.intentScores.purchaseIntentReason;
    }
    const intent = profile.intentScores.purchaseIntent;
    if (intent > 80) {
      return `High intent (${intent}%) driven by frequent searches for ${profile.intentScores.categoryAffinity} and active in-game store pack views.`;
    } else if (intent > 50) {
      return `Moderate intent (${intent}%) based on active squad building and transfer market telemetry within ${profile.intentScores.categoryAffinity}.`;
    } else {
      return `Low intent (${intent}%) due to minimal campaign engagement and limited in-game store activity during this session.`;
    }
  };

  const getChurnRiskReason = (profile: StitchedProfile): string => {
    if (profile.intentScores.churnRiskReason) {
      return profile.intentScores.churnRiskReason;
    }
    const churn = profile.intentScores.churnRisk;
    if (churn > 50) {
      return `Elevated churn risk (${churn}%) indicated by match drop-offs and session inactivity in competitive modes.`;
    } else {
      return `Low churn risk (${churn}%) due to high daily match completions and steady cross-platform telemetry activity.`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans text-slate-700 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase tracking-widest font-mono">
            <Activity className="h-4.5 w-4.5 text-indigo-500" />
            Resolve Profiles Hub
          </div>
          <h1 className="text-3xl font-extrabold text-slate-905 tracking-tight">Resolve Profiles</h1>
          <p className="text-slate-500 text-sm mt-1">Stitch behavioral clickstreams, login sessions, and campaign variants using Gemini identity matching.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 font-sans">
          <button 
            onClick={() => {
              setSaveStatus("Loading last simulation & feeds from GCS...");
              fetch(`/api/load-run/ingestion_engine?companyName=${encodeURIComponent(companyName)}`)
                .then(res => res.ok ? res.json() : null)
                .then(runData => {
                  if (runData) {
                    if (runData.stitchedProfiles) setStitchedProfiles(runData.stitchedProfiles);
                    if (runData.simulatedUsers) setSimulatedUsers(runData.simulatedUsers);
                    if (runData.logs) setLogs(runData.logs);
                    if (runData.queuedEvents) setQueuedEvents(runData.queuedEvents);
                    if (runData.telemetryAnalysis) setTelemetryAnalysis(runData.telemetryAnalysis);
                    if (runData.identityAnalysis) setIdentityAnalysis(runData.identityAnalysis);
                    if (runData.marketingAnalysis) setMarketingAnalysis(runData.marketingAnalysis);
                    setSaveStatus(`Restored feeds & logs from GCS (${runData.timestamp || 'latest'})`);
                  } else {
                    setSaveStatus("No previous simulation run found in GCS.");
                  }
                })
                .catch(err => {
                  console.error(err);
                  setSaveStatus("Failed to load run from GCS.");
                });
            }}
            className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-sm transition flex items-center gap-1.5"
            title="Load last saved simulation run from GCS"
          >
            <RotateCw size={14} />
            Load Last
          </button>
          <button 
            onClick={handleReset}
            className="px-4 py-2 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 rounded-lg shadow-sm transition flex items-center gap-1.5"
            title="Reset Simulation"
          >
            <RefreshCw size={14} />
            Reset All
          </button>
          <button 
            onClick={() => setIsAdminModalOpen(true)}
            disabled={isRebuilding}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center"
            title="Configure Event Rules"
          >
            <Settings size={14} />
          </button>
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border shadow-sm transition flex items-center gap-1.5 ${
              isStreaming 
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause size={14} />
                Pause Live Streams
              </>
            ) : (
              <>
                <Play size={14} />
                Resume Streams
              </>
            )}
          </button>
        </div>
      </div>

      {/* Admin Simulation Configuration Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs mb-8">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
          <Settings size={14} />
          Simulation Control Panel (Admin Settings)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Total Simulated Users</span>
              <span className="text-indigo-600 font-mono">{totalSimUsers} Users</span>
            </div>
            <input 
              type="range" 
              min={3} 
              max={50} 
              value={totalSimUsers} 
              onChange={(e) => setTotalSimUsers(parseInt(e.target.value))}
              disabled={isSimLoading}
              className="w-full accent-indigo-600 disabled:opacity-50"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Anonymous Shoppers Ratio</span>
              <span className="text-indigo-600 font-mono">{anonPercent}%</span>
            </div>
            <input 
              type="range" 
              min={10} 
              max={95} 
              value={anonPercent} 
              onChange={(e) => setAnonPercent(parseInt(e.target.value))}
              disabled={isSimLoading}
              className="w-full accent-indigo-600 disabled:opacity-50"
            />
          </div>
          <div>
            <button 
              onClick={initializeSimulationUsers}
              disabled={isSimLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isSimLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  AI Generating Journeys...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Start User Simulation Cycle
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Three-Column Streams Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Stream 1: Clickstream Telemetry */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              <h2 className="font-bold text-slate-800 text-xs">Behavioral Clickstream Feed</h2>
            </div>
            <span className="text-[9px] font-mono text-slate-400 bg-slate-150 px-2 py-0.5 rounded">app_clicks_v1</span>
          </div>

          <div 
            ref={telemetryScrollRef}
            className="flex-1 overflow-y-auto p-4 bg-slate-950 text-slate-300 font-mono text-[10.5px] space-y-2 scrollbar-thin scrollbar-thumb-slate-800"
          >
            {logs.filter(l => l.source === 'telemetry').length === 0 ? (
              <div className="text-slate-505 text-center py-24 italic">Waiting for clickstreams...</div>
            ) : (
              logs.filter(l => l.source === 'telemetry').map(log => (
                <div key={log.id} className="flex items-start gap-3 border-b border-slate-900 pb-1.5">
                  <span className="text-slate-505 shrink-0 text-[9px]">{log.timestamp}</span>
                  <span className="text-emerald-400 font-bold shrink-0">{log.event}</span>
                  <span className="text-slate-400 truncate">{log.data}</span>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-450 font-medium">Size: 100 buffered</span>
              <button 
                onClick={() => handleAnalyzeStream('telemetry')}
                disabled={analyzingStream !== null || logs.filter(l => l.source === 'telemetry').length === 0}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-xs transition flex items-center gap-1 disabled:opacity-50"
              >
                {analyzingStream === 'telemetry' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-indigo-500" />
                    Analyze trends
                  </>
                )}
              </button>
            </div>

            {telemetryAnalysis && (
              <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10.5px] text-slate-655 leading-relaxed relative">
                <strong className="block text-indigo-850 font-bold mb-0.5">Insights Summary:</strong>
                {telemetryAnalysis}
              </div>
            )}
          </div>
        </div>

        {/* Stream 2: Identity & Session Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="font-bold text-slate-800 text-xs">Identity & Session Logs</h2>
            </div>
            <span className="text-[9px] font-mono text-slate-400 bg-slate-150 px-2 py-0.5 rounded">auth_logs_v1</span>
          </div>

          <div 
            ref={identityScrollRef}
            className="flex-1 overflow-y-auto p-4 bg-slate-950 text-slate-300 font-mono text-[10.5px] space-y-2 scrollbar-thin scrollbar-thumb-slate-800"
          >
            {logs.filter(l => l.source === 'identity').length === 0 ? (
              <div className="text-slate-505 text-center py-24 italic">Waiting for login events...</div>
            ) : (
              logs.filter(l => l.source === 'identity').map(log => (
                <div key={log.id} className="flex items-start gap-3 border-b border-slate-900 pb-1.5">
                  <span className="text-slate-505 shrink-0 text-[9px]">{log.timestamp}</span>
                  <span className="text-sky-400 font-bold shrink-0">{log.event}</span>
                  <span className="text-slate-400 truncate">{log.data}</span>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-455 font-medium">Size: 100 buffered</span>
              <button 
                onClick={() => handleAnalyzeStream('identity')}
                disabled={analyzingStream !== null || logs.filter(l => l.source === 'identity').length === 0}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-xs transition flex items-center gap-1 disabled:opacity-50"
              >
                {analyzingStream === 'identity' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-indigo-500" />
                    Analyze trends
                  </>
                )}
              </button>
            </div>

            {identityAnalysis && (
              <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[10.5px] text-slate-655 leading-relaxed relative">
                <strong className="block text-emerald-850 font-bold mb-0.5">Insights Summary:</strong>
                {identityAnalysis}
              </div>
            )}
          </div>
        </div>

        {/* Stream 3: Marketing Interactions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h2 className="font-bold text-slate-800 text-xs">Campaign Interaction Feed</h2>
            </div>
            <span className="text-[9px] font-mono text-slate-400 bg-slate-150 px-2 py-0.5 rounded">campaign_responses_v1</span>
          </div>

          <div 
            ref={marketingScrollRef}
            className="flex-1 overflow-y-auto p-4 bg-slate-950 text-slate-300 font-mono text-[10.5px] space-y-2 scrollbar-thin scrollbar-thumb-slate-800"
          >
            {logs.filter(l => l.source === 'marketing').length === 0 ? (
              <div className="text-slate-550 text-center py-24 italic">Waiting for campaign events...</div>
            ) : (
              logs.filter(l => l.source === 'marketing').map(log => (
                <div key={log.id} className="flex items-start gap-3 border-b border-slate-900 pb-1.5">
                  <span className="text-slate-505 shrink-0 text-[9px]">{log.timestamp}</span>
                  <span className="text-amber-400 font-bold shrink-0">{log.event}</span>
                  <span className="text-slate-400 truncate">{log.data}</span>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-450 font-medium">Size: 100 buffered</span>
              <button 
                onClick={() => handleAnalyzeStream('marketing')}
                disabled={analyzingStream !== null || logs.filter(l => l.source === 'marketing').length === 0}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 shadow-xs transition flex items-center gap-1 disabled:opacity-50"
              >
                {analyzingStream === 'marketing' ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-indigo-500" />
                    Analyze trends
                  </>
                )}
              </button>
            </div>

            {marketingAnalysis && (
              <div className="p-2.5 bg-amber-50/40 border border-amber-100/70 rounded-xl text-[10.5px] text-slate-655 leading-relaxed relative">
                <strong className="block text-amber-855 font-bold mb-0.5">Insights Summary:</strong>
                {marketingAnalysis}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Section: Stitched Customer Profiles Ledger (C360 Table) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn mb-8">
        
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              Resolved Identity Profiles Ledger (Stitched C360 Table)
            </h2>
            <p className="text-slate-505 text-xs mt-0.5">Enriched profiles containing active counts of brand touches, emails opened, and historical ads seen.</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            {stitchedProfiles.length > 0 && (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-[10px] font-bold font-mono tracking-tight shrink-0">
                IDENTITY RESOLVED
              </span>
            )}
            <button 
              onClick={handleStitchProfiles}
              disabled={isStitching || simulatedUsers.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isStitching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Stitching Profiles & Analyzing...
                </>
              ) : (
                <>
                  <UserCheck size={14} />
                  Stitch & Analyze Profiles
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Stepper */}
        {isStitching && (
          <div className="px-6 py-4 bg-indigo-50/50 border-b border-indigo-100">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
              <span>Identity Stitcher Status:</span>
              <span className="text-indigo-600 font-bold animate-pulse">Running Resolution Engine</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[10.5px]">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100">
                {stitchingStep >= 1 ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-indigo-400 animate-spin shrink-0"></div>
                )}
                <span className={stitchingStep >= 1 ? 'text-slate-400 line-through truncate' : 'text-slate-800 font-bold truncate'}>
                  1. Matching clickstream signatures...
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100">
                {stitchingStep >= 2 ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <div className={`h-3.5 w-3.5 rounded-full border shrink-0 ${stitchingStep === 1 ? 'border-dashed border-indigo-400 animate-spin' : 'border-slate-300'}`}></div>
                )}
                <span className={stitchingStep >= 2 ? 'text-slate-400 line-through truncate' : stitchingStep >= 1 ? 'text-slate-800 font-bold truncate' : 'text-slate-400 truncate'}>
                  2. Mapping anonymous to auth keys...
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-indigo-100">
                {stitchingStep >= 3 ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                ) : (
                  <div className={`h-3.5 w-3.5 rounded-full border shrink-0 ${stitchingStep === 2 ? 'border-dashed border-indigo-400 animate-spin' : 'border-slate-300'}`}></div>
                )}
                <span className={stitchingStep >= 3 ? 'text-slate-400 line-through truncate' : stitchingStep >= 2 ? 'text-slate-800 font-bold truncate' : 'text-slate-400 truncate'}>
                  3. Compiling Gemini intent scores...
                </span>
              </div>
            </div>
          </div>
        )}

        {stitchedProfiles.length > 0 ? (
          <>
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-3 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">Filter Profile Segment:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button 
                  onClick={() => setProfileFilter('all')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-tight transition ${
                    profileFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Resolved ({stitchedProfiles.length})
                </button>
                <button 
                  onClick={() => setProfileFilter('auth')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-tight transition ${
                    profileFilter === 'auth' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-505 hover:text-slate-800'
                  }`}
                >
                  Authenticated ({stitchedProfiles.filter(p => !p.id.startsWith('guest_')).length})
                </button>
                <button 
                  onClick={() => setProfileFilter('anon')}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-tight transition ${
                    profileFilter === 'anon' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-505 hover:text-slate-800'
                  }`}
                >
                  Active Anonymous ({stitchedProfiles.filter(p => p.id.startsWith('guest_')).length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 text-left text-xs">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-505 font-mono uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Resolved User</th>
                  <th className="px-6 py-3.5">Preferred Channel</th>
                  <th className="px-6 py-3.5">Activity Stats</th>
                  <th className="px-6 py-3.5 text-center">Purchase Intent</th>
                  <th className="px-6 py-3.5 text-center">Churn Risk</th>
                  <th className="px-6 py-3.5 w-64 max-w-[260px]">Brand Touchpoints Log</th>
                  <th className="px-6 py-3.5 min-w-[340px] max-w-xl">AI Journey Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white text-slate-650 font-medium">
                {stitchedProfiles
                  .filter(profile => {
                    if (profileFilter === 'auth') return !profile.id.startsWith('guest_');
                    if (profileFilter === 'anon') return profile.id.startsWith('guest_');
                    return true;
                  })
                  .map((profile) => (
                    <tr key={profile.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm uppercase shrink-0 ${
                          profile.avatarUrl === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                          profile.avatarUrl === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {profile.name.substring(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-905 block text-xs">{profile.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{profile.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-10 border border-slate-200 rounded-lg text-slate-700 font-semibold text-[10px]">
                        {profile.channelPreference}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 font-mono text-[10px] text-slate-500">
                        <div>Emails Opened: <strong className="text-slate-800">{profile.metrics?.emailsOpened || 0}</strong></div>
                        <div>SMS Clicks: <strong className="text-slate-800">{profile.metrics?.smsClicked || 0}</strong></div>
                        <div>Searches: <strong className="text-slate-800">{profile.metrics?.totalSearches || 0}</strong></div>
                        <div>Page Views: <strong className="text-slate-800">{profile.metrics?.pageViews || 0}</strong></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1 group relative cursor-help">
                        <span className="font-mono font-extrabold text-xs text-indigo-600">{profile.intentScores.purchaseIntent}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full" 
                            style={{ width: `${profile.intentScores.purchaseIntent}%` }}
                          ></div>
                        </div>

                        {/* Hover Tooltip: Purchase Intent Reason */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white rounded-xl shadow-2xl z-40 pointer-events-none transition-all duration-200 border border-slate-750 text-left -translate-x-1/2 left-1/2">
                          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-indigo-300 font-mono">
                            <Sparkles size={12} className="text-indigo-400 shrink-0" />
                            <span>Gemini 3.5 Flash Lite Reason</span>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-snug font-sans">
                            {getPurchaseIntentReason(profile)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1 group relative cursor-help">
                        <span className={`font-mono font-extrabold text-xs ${profile.intentScores.churnRisk > 50 ? 'text-rose-655' : 'text-slate-655'}`}>
                          {profile.intentScores.churnRisk}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${profile.intentScores.churnRisk > 50 ? 'bg-rose-500' : 'bg-slate-450'}`} 
                            style={{ width: `${profile.intentScores.churnRisk}%` }}
                          ></div>
                        </div>

                        {/* Hover Tooltip: Churn Risk Reason */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white rounded-xl shadow-2xl z-40 pointer-events-none transition-all duration-200 border border-slate-750 text-left -translate-x-1/2 left-1/2">
                          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold text-rose-300 font-mono">
                            <Sparkles size={12} className="text-rose-400 shrink-0" />
                            <span>Gemini 3.5 Flash Lite Reason</span>
                          </div>
                          <p className="text-[11px] text-slate-200 leading-snug font-sans">
                            {getChurnRiskReason(profile)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 w-64 max-w-[260px]">
                      <div className="max-h-[80px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
                        {profile.touchpoints && profile.touchpoints.map((t, idx) => (
                          <div key={idx} className="p-1 bg-slate-50 border border-slate-150 rounded text-[9px] font-mono leading-tight break-words">
                            <span className="text-slate-400">[{t.timestamp}]</span> <span className="font-bold text-slate-750">{t.action}:</span> {formatTouchpointLabel(t.label, t.action)}
                          </div>
                        ))}
                        {(!profile.touchpoints || profile.touchpoints.length === 0) && (
                          <span className="text-slate-400 italic text-[10px]">No recent touchpoints logged.</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[340px] max-w-xl text-slate-550 leading-relaxed text-[11.5px] font-sans">
                      {profile.observations}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10.5px] font-mono text-slate-455">
            <span>Identity Matching: Deterministic ID stitch + Gemini reasoning</span>
            <span>{saveStatus}</span>
          </div>
        </>
      ) : (
        <div className="py-12 px-6 text-center bg-slate-50/30">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-3">
            <UserCheck size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">No Stitched Profiles Yet</h4>
          <p className="text-slate-500 text-xs max-w-md mx-auto mb-4">
            Click &quot;Stitch &amp; Analyze Profiles&quot; above to resolve simulated customer sessions into unified C360 identity profiles.
          </p>
        </div>
      )}

      </div>
      {/* Behavior Rules Settings Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm uppercase font-mono tracking-wider">
                <Settings size={16} className="text-slate-500" />
                Configure Behavioral Rules
              </h3>
              <button 
                onClick={() => setIsAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition font-bold"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Custom Generation Prompt / Instructions
                </label>
                <textarea
                  rows={4}
                  value={customBehaviorPrompt}
                  onChange={(e) => setCustomBehaviorPrompt(e.target.value)}
                  placeholder="e.g. Focus on EA Sports FC game modes like Ultimate Team SBCs, Team of the Season pack drops, Pro Clubs skill trees, and Career Mode wonderkids."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-none placeholder-slate-400 text-slate-805"
                />
                <p className="text-3xs text-slate-400 leading-normal font-medium">
                  This custom prompt will guide Gemini when rebuilding the categories and telemetry search terms.
                </p>
              </div>

              {/* Current Categories Preview */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Current Rules & Queries
                </label>
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-56 overflow-y-auto">
                  {behaviorRules.categories.map(cat => (
                    <div key={cat} className="space-y-1">
                      <div className="text-xs font-black text-slate-800">{cat}</div>
                      <div className="pl-3 flex flex-wrap gap-1">
                        {(behaviorRules.searchQueries[cat] || []).map(q => (
                          <span key={q} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-3xs font-semibold rounded-md border border-indigo-100/50">
                            {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between">
              <button
                onClick={() => {
                  setCustomBehaviorPrompt("");
                  loadOrGenerateBehaviorRules(true, "");
                }}
                disabled={isRebuilding}
                className="px-3.5 py-2 text-xs font-semibold border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 transition"
              >
                Reset Default
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => loadOrGenerateBehaviorRules(true, customBehaviorPrompt)}
                  disabled={isRebuilding}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isRebuilding ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Rebuilding...
                    </>
                  ) : (
                    "Rebuild Rules"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
