import React, { useState, useEffect, useRef, useMemo } from 'react';
import { simulateMarketingFocusGroup, simulateAcquisitionFocusGroup, generateWildcardAudience, generateAudienceFromCriteria, generateSyntheticPersona, generateImageFromPrompt, simulateCreativeFocusGroup, generateMarketingCampaignAssets, simulateVideoFocusGroup } from '../services/geminiService';
import { brandConfig } from '../config';
import { SimulationResult, MarketingBriefData, AcquisitionResult, SavedSimulation, Persona, ABTestResult } from '../types';
import { Users, User, BarChart2, Save, Download, Play, ShoppingCart, Mail, MessageSquare, Settings, X, ChevronDown, ChevronUp, Sparkles, UserPlus, Zap, Trash2, Edit2, History, MessageCircle, Plus, Info, ShoppingBag, Image, CheckCircle2, XCircle, Loader2, Mic, Volume2, FileText, Video } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SyntheticChat } from './SyntheticChat';
import { SyntheticInterview } from './SyntheticInterview';
import { SIMULATION_PRODUCTS } from '../data/simulationData';
import { useCompanyContext } from '../context/CompanyContext';
import { GeminiLiveClient } from '../lib/GeminiLiveClient';
import { useAppConfig } from '../context/AppConfigContext';

const getVoiceForName = (name: string): string => {
  const femaleNames = ['Sarah', 'Elena', 'Olivia', 'Chloe', 'Linda', 'Mary', 'Karen', 'Susan'];
  
  const firstName = name.split(' ')[0];
  if (femaleNames.includes(firstName)) return 'Aoede';
  
  // Specific mapping for the current personas to ensure different voices
  if (firstName === 'David') return 'Charon';
  if (firstName === 'Miguel') return 'Fenrir';
  
  // Fallback for titles
  if (name.includes('Officer')) return 'Charon';
  if (name.includes('Veteran')) return 'Fenrir';
  if (name.includes('Professional')) return 'Aoede';
  
  return 'Zephyr'; // Default fallback
};

export const SyntheticTesting: React.FC = () => {
    const { name, description } = useCompanyContext();
    const { config } = useAppConfig();
    // --- Global State ---
    const [standardAudiences, setStandardAudiences] = useState<any[]>([]);
    const [personas, setPersonas] = useState<any[]>([]);
    const [brief, setBrief] = useState<MarketingBriefData | null>(null);
    const [activeTab, setActiveTab] = useState<'ACQUISITION' | 'CHAT' | 'EMAIL' | 'BRIEF' | 'PURCHASE' | 'CREATIVE' | 'AB_TEST' | 'LIVE' | 'TEST_VIDEO'>('CREATIVE');
    const [savedHistory, setSavedHistory] = useState<SavedSimulation[]>([]);
    const [marketingMessages, setMarketingMessages] = useState<string[]>([
        "Elevate your home and self-care routine with iconic, long-lasting fragrances",
        "Indulge in 24-hour hydration with nourishing shea butter and essential oils",
        "Create an inviting atmosphere with room-filling 3-wick seasonal candles",
        "Exclusive rewards, early access, and fragrance drops for loyalty VIPs"
    ]);
    const [newMessage, setNewMessage] = useState("");
    const [isGeneratingWildcard, setIsGeneratingWildcard] = useState(false);
    const [status, setStatus] = useState("");
    const [isAddAudienceModalOpen, setIsAddAudienceModalOpen] = useState(false);
    const [audienceCriteria, setAudienceCriteria] = useState("");
    const [selectedAudience, setSelectedAudience] = useState<any | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [interviewPersona, setInterviewPersona] = useState<{ persona: Persona; result: any } | null>(null);
    const historyDropdownRef = useRef<HTMLDivElement>(null);
    const [selectedVideoForTest, setSelectedVideoForTest] = useState<any | null>(null);
    const [videoTestResults, setVideoTestResults] = useState<any[]>([]);
    const [isVideoTesting, setIsVideoTesting] = useState(false);

    const [videoList, setVideoList] = useState<{id: string, url: string, title: string}[]>([]);

    const getVideoId = (url: string) => {
        if (!url) return '';
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];
        if (url.length === 11 && !url.includes('/')) return url;
        return url.replace(/^ad_analysis_/, '').replace(/^creator_partner_/, '');
    };

    useEffect(() => {
        const fetchVideos = async () => {
            const activeCompany = config?.branding?.companyName || name || 'Bath & Body Works';
            const loadedVids: { id: string; url: string; title: string }[] = [];
            const addedIds = new Set<string>();

            // 1. Fetch all analyzed videos from the Insights page (/api/insights/analyses-all)
            try {
                const res = await fetch(`/api/insights/analyses-all?companyName=${encodeURIComponent(activeCompany)}`);
                if (res.ok) {
                    const analyses = await res.json();
                    if (Array.isArray(analyses)) {
                        analyses.forEach((a: any) => {
                            const rawUrl = a.videoUrl || a.url || a.video_url || (a.id && a.id.length === 11 ? `https://www.youtube.com/watch?v=${a.id}` : '');
                            const ytId = getVideoId(rawUrl) || getVideoId(a.id);
                            if (ytId && !addedIds.has(ytId)) {
                                addedIds.add(ytId);
                                const title = a.creator_info?.video_title || a.title || a.metadata?.campaign_name || a.summary?.substring(0, 50) || `Video ${ytId}`;
                                loadedVids.push({
                                    id: ytId,
                                    url: rawUrl || `https://www.youtube.com/watch?v=${ytId}`,
                                    title: title.length > 60 ? title.substring(0, 60) + '...' : title
                                });
                            }
                        });
                    }
                }
            } catch (err) {
                console.warn("Failed loading analyses-all in SyntheticTesting:", err);
            }

            // 2. Fetch from insights table as secondary fallback
            try {
                const tableRes = await fetch(`/api/insights/table?companyName=${encodeURIComponent(activeCompany)}`);
                if (tableRes.ok) {
                    const tableData = await tableRes.json();
                    if (Array.isArray(tableData)) {
                        tableData.forEach((row: any) => {
                            if (Array.isArray(row.videos)) {
                                row.videos.forEach((vid: string) => {
                                    const id = getVideoId(vid);
                                    if (id && !addedIds.has(id)) {
                                        addedIds.add(id);
                                        loadedVids.push({
                                            id,
                                            url: vid,
                                            title: `Video (${id})`
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
            } catch (err) {
                console.warn("Failed loading insights table in SyntheticTesting:", err);
            }

            setVideoList(loadedVids);
            if (loadedVids.length > 0 && !selectedVideoForTest) {
                setSelectedVideoForTest(loadedVids[0]);
            }
        };

        fetchVideos();
    }, [name, config]);

    // Live Session State
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [liveSession, setLiveSession] = useState<GeminiLiveClient | null>(null);
    const [liveTranscription, setLiveTranscription] = useState("");
    const [livePersona, setLivePersona] = useState<any | null>(null);
    const [livePlan, setLivePlan] = useState<any[]>([]); // Added for Universal Guide pattern

    // Close history dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
                setIsHistoryOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // --- Tab Specific State ---
    // Member Simulation
    const [syntheticUsers, setSyntheticUsers] = useState<any[]>([]);
    const [memberResults, setMemberResults] = useState<SimulationResult[]>([]);
    const [isMemberLoading, setIsMemberLoading] = useState(false);
    const [showMemberSettings, setShowMemberSettings] = useState(false);
    const [showProducts, setShowProducts] = useState(false);
    const [emailBodies, setEmailBodies] = useState<{ [key: string]: string }>({});
    const [emailDrafts, setEmailDrafts] = useState<{ subject: string, body: string }[]>([]);
    const [isEmailEditorOpen, setIsEmailEditorOpen] = useState(false);
    const [editingEmailIndex, setEditingEmailIndex] = useState<number | null>(null);
    const [editingEmailSubject, setEditingEmailSubject] = useState("");
    const [editingEmailBody, setEditingEmailBody] = useState("");
    const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);

    // New Modal States
    const [selectedCartResult, setSelectedCartResult] = useState<SimulationResult | null>(null);
    const [selectedEmailStats, setSelectedEmailStats] = useState<{ subject: string, openRate: number, clickRate: number, body: string } | null>(null);
    
    // Purchase Products
    const [simulationProducts, setSimulationProducts] = useState<string[]>(SIMULATION_PRODUCTS);
    const [newProduct, setNewProduct] = useState("");

    // A/B Test 
    const [abTestResults, setAbTestResults] = useState<ABTestResult[]>([]);
    const [isABTestingLoading, setIsABTestingLoading] = useState(false);
    const [regionalVariants, setRegionalVariants] = useState<{ region: string, imagePrompt: string, image: string | null }[]>([]);

    // Creative Testing
    const [creativeResults, setCreativeResults] = useState<any[]>([]);
    const [isCreativeLoading, setIsCreativeLoading] = useState(false);
    const [selectedCreativeAudience, setSelectedCreativeAudience] = useState<string>("");
    const [contentHubVariants, setContentHubVariants] = useState<any[]>([]);

    const activeCreativeAssets = useMemo(() => {
        // Priority 1: If contentHubVariants is present, resolve the selected variant from contentHubVariants
        if (contentHubVariants && contentHubVariants.length > 0) {
            const selectedVariant = (selectedCreativeAudience && contentHubVariants.find(v => v.title === selectedCreativeAudience || v.id === selectedCreativeAudience))
                || contentHubVariants[0];

            if (selectedVariant) {
                // Find image for this variant or fallback gracefully
                const variantImage = selectedVariant.image 
                    || (brief?.campaignAssetsMap && selectedCreativeAudience && brief.campaignAssetsMap[selectedCreativeAudience]?.image)
                    || brief?.campaignAssets?.image
                    || brief?.infographicUrl
                    || contentHubVariants.find(v => v.image)?.image
                    || null;

                return {
                    image: variantImage,
                    social: {
                        caption: selectedVariant.primaryText || brief?.messaging?.primaryHook?.en || brief?.campaignGoal || '',
                        hashtags: [selectedVariant.type || 'Campaign', (selectedVariant.targetCategory || 'Retail').replace(/\s+/g, '')]
                    },
                    search: {
                        headline: selectedVariant.title || brief?.productName || 'Featured Product',
                        description: selectedVariant.offer || brief?.valueProp?.main?.en || 'Special Offer',
                        url: "https://example.com"
                    },
                    email: {
                        subject: selectedVariant.title || brief?.productName || 'Campaign Update',
                        preheader: selectedVariant.offer || '',
                        body: selectedVariant.primaryText || ''
                    },
                    youtube: {
                        title: selectedVariant.title || '',
                        script: selectedVariant.primaryText || ''
                    },
                    website: { recommendations: [] }
                };
            }
        }

        // Priority 2: If brief.campaignAssetsMap has a matching selected audience
        if (brief?.campaignAssetsMap && selectedCreativeAudience && brief.campaignAssetsMap[selectedCreativeAudience]) {
            const asset = brief.campaignAssetsMap[selectedCreativeAudience];
            if (asset) return asset;
        }

        // Priority 3: First entry in brief.campaignAssetsMap
        if (brief?.campaignAssetsMap && Object.keys(brief.campaignAssetsMap).length > 0) {
            const firstWithImage = Object.values(brief.campaignAssetsMap).find(a => a && a.image);
            if (firstWithImage) return firstWithImage;
            const firstAud = Object.values(brief.campaignAssetsMap)[0];
            if (firstAud) return firstAud;
        }

        // Priority 4: Direct brief.campaignAssets
        if (brief?.campaignAssets) {
            return brief.campaignAssets;
        }

        // Priority 5: Fallback to brief infographic
        if (brief?.infographicUrl) {
            return {
                image: brief.infographicUrl,
                social: { caption: brief.campaignGoal || 'Featured Campaign', hashtags: ['#Marketing', '#Campaign'] },
                search: { headline: brief.productName || 'Featured Product', description: brief.valueProp?.main?.en || 'Top Quality', url: 'https://example.com' },
                email: { subject: brief.title || 'Campaign Update', preheader: '', body: brief.campaignGoal || '' },
                youtube: { title: brief.title || '', script: '' },
                website: { recommendations: [] }
            };
        }

        return null;
    }, [brief, selectedCreativeAudience, contentHubVariants]);

    // Acquisition Simulation
    const [acquisitionResults, setAcquisitionResults] = useState<AcquisitionResult[]>([]);
    const [acquisitionOffers, setAcquisitionOffers] = useState<string[]>([
        "My Bath & Body Works Rewards: $10 Off Next Purchase",
        "Signature 3-Wick Candle Buy 3, Get 1 Free Promo",
        "Semi-Annual Sale Early Access VIP Pass",
        "Wallflowers Scent-of-the-Month Starter Kit with Free Plug",
        "Complete Body Care Layering Bundle: 20% Off Routine"
    ]);
    const [newOffer, setNewOffer] = useState("");
    const [isAcquisitionLoading, setIsAcquisitionLoading] = useState(false);

    // Chat
    // Chat state is mostly internal to SyntheticChat, but duplicate saving logic might be needed if SyntheticChat doesn't export it.
    // For this V1 Hub, we will render SyntheticChat directly.

    const [emailHeadlines, setEmailHeadlines] = useState<string[]>([
        `Welcome to ${name} Fragrance & Care Ecosystem`,
        "Your VIP Rewards & Signature Scent Tier Benefits",
        "Transform Your Home with 3-Wick Seasonal Candles",
        "Exclusive Fragrance Notes & Scent Trend Drops",
        "Unlock Free Full-Size Body Care with Points"
    ]);

    const refreshBriefData = async () => {
        const companyName = config?.branding.companyName || name || 'AI Lab';
        try {
            // Try Server First
            const res = await fetch(`/api/load-run/marketing_brief?companyName=${encodeURIComponent(companyName)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && (data.title || data.productName || data.campaignGoal)) {
                    console.log("Refreshed Brief Data:", data);
                    setBrief(data);
                    if (data.campaignAssetsMap && Object.keys(data.campaignAssetsMap).length > 0) {
                        const firstAud = Object.keys(data.campaignAssetsMap)[0];
                        setSelectedCreativeAudience(prev => prev || firstAud);
                    } else if (data.audiences && data.audiences.length > 0) {
                        setSelectedCreativeAudience(prev => prev || data.audiences[0].name);
                    }
                }
            }
        } catch (e) { console.error("Server refresh failed for brief", e); }

        try {
            const contentRes = await fetch(`/api/load-run/content_hub?companyName=${encodeURIComponent(companyName)}`);
            if (contentRes.ok) {
                const contentData = await contentRes.json();
                if (contentData && contentData.variants && contentData.variants.length > 0) {
                    console.log("Loaded Content Hub Variants:", contentData.variants);
                    setContentHubVariants(contentData.variants);
                    setSelectedCreativeAudience(prev => {
                        if (!prev || !contentData.variants.some((v: any) => v.title === prev || v.id === prev)) {
                            return contentData.variants[0].title;
                        }
                        return prev;
                    });
                }
            }
        } catch (e) { console.error("Failed to load content hub variants", e); }
    };

    useEffect(() => {
        // Load datasets from JSON configuration
        fetch('/data/configuration/focus_group_acquisition.json')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setAcquisitionOffers(data.map((d: any) => d.title || d.offer).filter(Boolean)); })
            .catch(() => console.warn("Could not load acquisition datasets"));

        fetch('/data/configuration/focus_group_email.json')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setEmailHeadlines(data.map((d: any) => d.subject).filter(Boolean)); })
            .catch(() => console.warn("Could not load email datasets"));

        fetch('/data/configuration/focus_group_products.json')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setSimulationProducts(data.map((d: any) => `${d.name || d.productName}: ${d.description}`)); })
            .catch(() => console.warn("Could not load products datasets"));

        fetch('/data/configuration/focus_group_marketing.json')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setMarketingMessages(data.map((d: any) => d.message).filter(Boolean)); })
            .catch(() => console.warn("Could not load marketing datasets"));

        refreshBriefData();
        fetch('/api/load-run/audience_generator')
            .then(res => res.json())
            .then(data => {
                if (data && data.personas) {
                    setPersonas(data.personas);
                } else if (Array.isArray(data) && data.length > 0) {
                    // Backwards compatibility if data is just the array
                    setPersonas(data);
                }
            })
            .catch(() => {
                console.warn("Could not load personas from server.");
            });

        fetch('/api/load-run/synthetic_users')
            .then(res => res.json())
            .then(data => {
                if (data && data.generatedUsers) {
                    setSyntheticUsers(data.generatedUsers);
                }
            })
            .catch(() => {
                console.warn("Could not load users from server.");
            });

        fetch('/data/configuration/synthetic_standard_audiences.json')
            .then(res => res.json())
            .then(data => setStandardAudiences(data))
            .catch(() => console.warn("Could not load standard audiences"));

        // Load History (Server Only)
        fetch('/api/load-run/synthetic_focus_group')
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data)) {
                    setSavedHistory(data);
                }
            })
            .catch(e => console.log("No server history found"));

        // Load Synthetic Users
        fetch('/api/load-run/synthetic_users')
            .then(res => res.json())
            .then(data => {
                if (data && data.generatedUsers) {
                    setSyntheticUsers(data.generatedUsers);
                }
            })
            .catch(e => console.log("No synthetic users found"));
    }, []);

    // Auto-refresh when switching to Creative tab
    useEffect(() => {
        if (activeTab === 'CREATIVE') {
            refreshBriefData();
        }
    }, [activeTab]);

    // --- Persistence Helper ---
    const autoSaveRun = (run: SavedSimulation) => {
        const newHistory = [run, ...savedHistory];
        setSavedHistory(newHistory);

        // Save to Server
        fetch('/api/save-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featureId: 'synthetic_focus_group', data: newHistory })
        }).catch(err => console.error("Failed to save history to server:", err));
    };

    const loadRun = (run: SavedSimulation) => {
        if (run.type === 'MEMBER_SIMULATION') {
            setMemberResults(run.results);
            if (run.emailBodies) {
                setEmailBodies(run.emailBodies);
            }
        } else if (run.type === 'ACQUISITION_SIMULATION') {
            setAcquisitionResults(run.results);
        } else if (run.type === 'CREATIVE_SIMULATION') {
            setCreativeResults(run.results);
        } else if (run.type === 'AB_TEST_SIMULATION') {
            setAbTestResults(run.results);
            setRegionalVariants(run.variants as any);
        }
        // Chat sessions loading implies switching context, which we might handle if chat history was unified.
        // For now, we just restore the sim tabs.
    };

    const handleClearHistory = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to clear all simulation history? This cannot be undone.")) return;

        setSavedHistory([]);
        try {
            await fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureId: 'synthetic_focus_group', data: [] })
            });
        } catch (err) {
            console.error("Failed to clear history:", err);
            alert("Failed to clear history on server.");
        }
    };

    // --- Live Mode Logic ---
    const toggleLive = async (persona: any) => {
        if (isLiveActive) {
            liveSession?.disconnect();
            setLiveSession(null);
            setIsLiveActive(false);
            setLiveTranscription("");
            setLivePersona(null);
            return;
        }

        try {
            const keyRes = await fetch('/api/key');
            const { apiKey } = await keyRes.json();

            if (!apiKey) {
                alert("Gemini API Key is missing. Please check your .env file.");
                return;
            }

            const personaName = persona.personaName || persona.name;
            setLivePersona(persona);
            setStatus(`Connecting to ${personaName} live...`);

            const systemInstruction = `You are ${personaName} (representing the audience: ${persona.name}). 
            Your Bio: ${persona.bio}
            Your Demographics: ${persona.demographics || "Not specified"}
            Your Preferred Brands: ${persona.preferred_brands?.join(', ') || "Not specified"}
            Your Job: ${persona.job_title || "Target Audience"}
            Your Pain Points: ${persona.pain_points?.join(', ') || "None"}
            Your Goals: ${persona.goals?.join(', ') || "None"}
            
            Context: You are talking to a marketing researcher from ${name}. ${description}.
            Stay deeply in character. Be authentic, opinionated, and realistic. 
            Do NOT mention being an AI. Speak as if you are a real person in a live conversation.
            Keep your responses concise and conversational, suitable for voice interaction.`;

            // Define Tools for Bath & Body Works Live Consultation
            const tools = [
                {
                    name: "recommend_fragrance_routine",
                    description: "Save a tailored Bath & Body Works fragrance layering routine and seasonal candle pairing.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            scentFamily: { type: "STRING", description: "e.g. Floral, Gourmand, Woody, Fresh, Aromatherapy" },
                            targetOccasion: { type: "STRING", description: "e.g. Evening Unwind, Morning Clarity, Entertaining Guests" },
                            recommendedProducts: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        productName: { type: "STRING" },
                                        category: { type: "STRING" },
                                        fragranceNotes: { type: "STRING" },
                                        usageTip: { type: "STRING" }
                                    }
                                }
                            }
                        },
                        required: ["scentFamily", "recommendedProducts"]
                    }
                }
            ];

            const voiceName = getVoiceForName(personaName);
            console.log(`[Live Voice] Actively using voice: ${voiceName} for persona: ${personaName}`);

            const client = new GeminiLiveClient({
                apiKey: apiKey,
                systemInstruction: systemInstruction,
                model: 'gemini-3.1-flash-live-preview',
                tools: tools,
                voiceName: voiceName
            }, (msg) => {
                if (msg.type === 'connected') {
                    setIsLiveActive(true);
                    setStatus("");
                } else if (msg.type === 'disconnected') {
                    setIsLiveActive(false);
                    setLiveSession(null);
                    setLivePersona(null);
                } else if (msg.type === 'error') {
                    alert(msg.error);
                    setIsLiveActive(false);
                    setLiveSession(null);
                } else if (msg.type === 'tool_call') {
                    const calls = msg.data.functionCalls;
                    const responses = [];
                    
                    for (const call of calls) {
                        const { name, args, id } = call;
                        let result = { success: true };
                        
                        if (name === "create_itinerary") {
                            setLivePlan(args.itinerary);
                            result = { success: true, message: "Plan updated" };
                        }
                        responses.push({ functionCall: { name, result, id } });
                    }
                    client.sendToolResponse(responses);
                } else if (msg.type === 'raw' && msg.data?.serverContent?.modelTurn?.parts) {
                    // Collect transcription if available
                    const parts = msg.data.serverContent.modelTurn.parts;
                    parts.forEach((p: any) => {
                        if (p.text) {
                            setLiveTranscription(prev => prev + p.text);
                        }
                    });
                }
            });

            await client.connect();
            setLiveSession(client);

        } catch (e) {
            console.error(e);
            setIsLiveActive(false);
            setStatus("Connection failed.");
        }
    };

    const handleSendData = (type: 'brief' | 'email') => {
        if (!liveSession || !isLiveActive) return;
        
        if (type === 'brief' && brief) {
            const briefText = `Here is the current Marketing Brief for your review:\n${JSON.stringify(brief)}`;
            liveSession.sendClientContent(briefText);
            setLiveTranscription(prev => prev + "\n[System: Sent Marketing Brief]");
        } else if (type === 'email' && emailDrafts.length > 0) {
            const emailText = `Here is the current Email Copy for your review:\n${JSON.stringify(emailDrafts)}`;
            liveSession.sendClientContent(emailText);
            setLiveTranscription(prev => prev + "\n[System: Sent Email Copy]");
        }
    };

    const handleLoadLast = (type: 'ACQUISITION_SIMULATION' | 'MEMBER_SIMULATION' | 'CREATIVE_SIMULATION' | 'AB_TEST_SIMULATION') => {
        const lastRun = savedHistory.find(r => r.type === type);
        if (lastRun) {
            loadRun(lastRun);
        } else {
            alert("No previous run found for this type.");
        }
    };

    // --- Audience Management ---
    const handleAddAudience = async (criteria?: string) => {
        setIsAddAudienceModalOpen(false); // Close modal if open
        setIsGeneratingWildcard(true);
        setStatus(criteria ? "Generating audience from your criteria..." : "Brainstorming a completely new 'Wildcard' audience...");

        try {
            let seedAudience;
            if (criteria) {
                seedAudience = await generateAudienceFromCriteria(name, criteria);
            } else {
                const existingNames = personas.map(p => p.name);
                seedAudience = await generateWildcardAudience(name, existingNames);
            }

            if (seedAudience) {
                setStatus(`Developing profile for: ${seedAudience.name}...`);
                const details = await generateSyntheticPersona(seedAudience.personaName, seedAudience.name, `${brandConfig.companyName} - ${seedAudience.bio || ""}`);
                let imageUrl = "";
                try {
                    imageUrl = await generateImageFromPrompt(seedAudience.imagePrompt + " professional portrait, high quality, studio lighting");
                } catch (e) { console.error(e); }

                const newPersona = { ...seedAudience, details, imageUrl, isWildcard: !criteria }; // If criteria provided, it's specific, not wildcard
                const updated = [...personas, newPersona];
                setPersonas(updated);
                fetch('/api/save-run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ featureId: 'audience_generator', data: { personas: updated } })
                }).catch(err => console.error("Failed to save updated personas to server:", err));
            }
        } catch (error) { console.error(error); alert("Failed to generate audience."); }
        finally { setIsGeneratingWildcard(false); setStatus(""); }
    };

    const deletePersona = (index: number) => {
        const updated = personas.filter((_, i) => i !== index);
        setPersonas(updated);
        fetch('/api/save-run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featureId: 'audience_generator', data: { personas: updated } })
        }).catch(err => console.error("Failed to save updated personas to server:", err));
    };

    // --- Acquisition Logic ---
    const handleRunAcquisition = async () => {
        setIsAcquisitionLoading(true);
        setStatus("Simulating Net-New Acquisition...");
        try {
            let pool = [...syntheticUsers];
            const results = await simulateAcquisitionFocusGroup(pool, acquisitionOffers, name, description);
            setAcquisitionResults(results);

            // Auto Save
            autoSaveRun({
                type: 'ACQUISITION_SIMULATION',
                id: `acq_${Date.now()}`,
                name: `Acquisition Test - ${new Date().toLocaleTimeString()}`,
                timestamp: new Date().toISOString(),
                results: results,
                stats: {} // Calculate stats if needed for summary
            });
        } catch (e) { console.error(e); }
        finally { setIsAcquisitionLoading(false); setStatus(""); }
    };

    // Load saved campaigns on mount
    useEffect(() => {
        fetch('/api/load-email-campaigns')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setEmailDrafts(data);
                }
            })
            .catch(err => console.error("Failed to load email campaigns:", err));
    }, []);

    const updateEmailDrafts = (newDrafts: { subject: string, body: string }[]) => {
        setEmailDrafts(newDrafts);
        fetch('/api/save-email-campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDrafts)
        }).catch(err => console.error("Failed to save email campaigns:", err));
    };

    // --- Member Simulation Logic ---
    const handleRunVideoTest = async () => {
        if (!selectedVideoForTest || syntheticUsers.length === 0) return;
        setIsVideoTesting(true);
        try {
            const results = await simulateVideoFocusGroup(syntheticUsers, selectedVideoForTest.title, selectedVideoForTest.url, selectedVideoForTest.analysisContext);
            setVideoTestResults(results);
            
            // Save results
            const session = {
                type: 'VIDEO_TEST_SESSION',
                id: `video_test_${Date.now()}`,
                videoId: selectedVideoForTest.id,
                videoTitle: selectedVideoForTest.title,
                timestamp: new Date().toISOString(),
                results: results
            };
            
            await fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    featureId: 'video_test',
                    data: session
                })
            });
        } catch (e) {
            console.error(e);
            alert("Failed to run video test.");
        } finally {
            setIsVideoTesting(false);
        }
    };

    const handleLoadLastVideoTest = async () => {
        try {
            const res = await fetch('/api/load-run/video_test');
            if (!res.ok) throw new Error("No saved video test found");
            const data = await res.json();
            if (data && data.results) {
                const vid = config?.adAnalysisVideos?.find((v: any) => v.id === data.videoId) || videoList.find((v: any) => v.id === data.videoId);
                if (vid) {
                    setSelectedVideoForTest(vid);
                } else {
                    setSelectedVideoForTest({ id: data.videoId, title: data.videoTitle });
                }
                setVideoTestResults(data.results);
            }
        } catch (error) {
            console.warn(error);
            alert("No previous video test session found.");
        }
    };

    const handleRunMemberSim = async () => {
        if (!brief || syntheticUsers.length === 0) return;
        setIsMemberLoading(true);
        setStatus("Preparing Member Simulation...");
        try {
            const { generateEmailBodies } = await import('../services/geminiService');
            let bodies = emailBodies;
            let campaigns = emailDrafts;

            // Generate initial drafts if empty
            if (campaigns.length === 0) {
                if (Object.keys(bodies).length === 0) {
                    bodies = await generateEmailBodies(emailHeadlines, brief);
                    setEmailBodies(bodies);
                }
                campaigns = emailHeadlines.map(h => ({ subject: h, body: bodies[h] || "Loading..." }));
                updateEmailDrafts(campaigns);
            }

            const emailCampaigns = campaigns;

            let pool = [...syntheticUsers];

            setStatus(`Simulating ${pool.length} members...`);
            const results = await simulateMarketingFocusGroup(pool, brief, simulationProducts, emailCampaigns, marketingMessages);
            setMemberResults(results);

            // Auto Save
            autoSaveRun({
                type: 'MEMBER_SIMULATION',
                id: `mem_${Date.now()}`,
                name: `Member Sim - ${new Date().toLocaleTimeString()}`,
                timestamp: new Date().toISOString(),
                results: results,
                emailBodies: bodies
            });
        } catch (e) { console.error(e); }
        finally { setIsMemberLoading(false); setStatus(""); }
    };

    // --- Creative Simulation Logic ---
    const handleRunCreativeSim = async () => {
        console.log("handleRunCreativeSim clicked");
        if (syntheticUsers.length === 0) { console.error("No syntheticUsers found"); alert("No syntheticUsers found. Please go to Create Personas first."); return; }

        setIsCreativeLoading(true);
        setStatus("Preparing campaign assets...");
        try {
            setStatus("Simulating focus group reactions...");

            let allResults: any[] = [];
            let testQueue: { name: string, assets: any }[] = [];

            if (contentHubVariants.length > 0) {
                contentHubVariants.forEach(v => {
                    const assets = {
                        image: v.image || null,
                        social: {
                            caption: v.primaryText,
                            hashtags: [v.type, v.targetCategory.replace(/\s+/g, '')]
                        },
                        search: {
                            headline: v.title,
                            description: v.offer,
                            url: "https://example.com"
                        },
                        email: {
                            subject: v.title,
                            body: v.primaryText
                        }
                    };
                    testQueue.push({ name: v.title, assets });
                });
            } else if (brief && (brief.campaignAssetsMap || brief.campaignAssets)) {
                if (brief.campaignAssetsMap) {
                    Object.entries(brief.campaignAssetsMap).forEach(([name, assets]) => {
                        testQueue.push({ name, assets });
                    });
                } else if (brief.campaignAssets) {
                    testQueue.push({ name: 'Default', assets: brief.campaignAssets });
                }
            }

            if (testQueue.length === 0) {
                alert("No campaign assets or content variants found. Please generate them in Create Content first.");
                setIsCreativeLoading(false);
                setStatus("");
                return;
            }

            // Loop through each creative variant
            for (const { name, assets } of testQueue) {
                setStatus(`Testing variant for: ${name}...`);

                let pool = syntheticUsers.map((u, i) => ({
                    ...u,
                    id: `${u.id}_creative_${name}_${i}`
                }));

                // Run Sim
                const results = await simulateCreativeFocusGroup(pool, assets);

                // Tag results with the audience group
                const taggedResults = results.map(r => ({ ...r, audienceGroup: name }));
                allResults.push(...taggedResults);
            }

            setCreativeResults(allResults);

            // Auto Save
            autoSaveRun({
                type: 'CREATIVE_SIMULATION',
                id: `creative_${Date.now()}`,
                name: `Creative Test (${testQueue.length} variants) - ${new Date().toLocaleTimeString()}`,
                timestamp: new Date().toISOString(),
                results: allResults
            });
        } catch (error) {
            console.error("Creative sim failed:", error);
            alert("Failed to run campaign image testing.");
        } finally {
            setIsCreativeLoading(false);
            setStatus("");
        }
    };

    // --- A/B Test Logic ---
    const handleRunABTestSim = async () => {
        let currentBrief = brief;
        if (!currentBrief) {
            const companyName = config?.branding.companyName || name || 'AI Lab';
            try {
                const res = await fetch(`/api/load-run/marketing_brief?companyName=${encodeURIComponent(companyName)}`);
                if (res.ok) {
                    const loadedBrief = await res.json();
                    if (loadedBrief && (loadedBrief.title || loadedBrief.productName || loadedBrief.campaignGoal)) {
                        currentBrief = loadedBrief;
                        setBrief(loadedBrief);
                    }
                }
            } catch (e) {}
        }

        if (!currentBrief) {
            alert("No marketing brief found. Please generate a brief in Create Brief tab first.");
            return;
        }

        let userPool = syntheticUsers;
        if (userPool.length === 0) {
            try {
                const uRes = await fetch('/api/load-run/synthetic_users');
                if (uRes.ok) {
                    const uData = await uRes.json();
                    if (uData?.generatedUsers?.length) {
                        userPool = uData.generatedUsers;
                        setSyntheticUsers(userPool);
                    }
                }
            } catch (e) {}
        }
        if (userPool.length === 0 && personas.length > 0) {
            userPool = personas.map((p, i) => ({
                id: p.id || `persona_${i}`,
                name: p.name,
                demographics: p.demographics || `${p.age || 30} years old, ${p.location || 'US'}`,
                bio: p.bio || p.personality || '',
                sentiment: 'Neutral'
            }));
        }
        if (userPool.length === 0 && standardAudiences.length > 0) {
            userPool = standardAudiences;
        }

        if (userPool.length === 0) {
            alert("No synthetic audience pool found. Please generate personas or users first.");
            return;
        }

        setIsABTestingLoading(true);
        setStatus("Generating 5 Strategic Ad Variants. This will take a moment...");
        try {
            const { generateRegionalVariants, simulateABTestFocusGroup } = await import('../services/geminiService');

            // Generate Variants based on the current brief and campaign goals
            const assetContext = activeCreativeAssets?.social?.caption 
                || currentBrief.messaging?.primaryHook?.en 
                || currentBrief.campaignGoal 
                || '';
            const basePrompt = `Product: ${currentBrief.productName || name}. Goal: ${currentBrief.campaignGoal}. Value Prop: ${currentBrief.valueProp?.main?.en || 'Premium Quality'}. Asset Context: ${assetContext}`;

            const variants = await generateRegionalVariants(basePrompt, name, description);
            setRegionalVariants(variants);

            setStatus("Simulating A/B Test focus group...");

            let pool = userPool.map((u, i) => ({
                ...u,
                id: `${u.id || i}_ab_${i}`
            }));

            // Simulate A/B Test
            const results = await simulateABTestFocusGroup(pool, variants.map(v => ({ region: v.region, image: v.image })), name, description);
            setAbTestResults(results);

            // Auto Save
            autoSaveRun({
                type: 'AB_TEST_SIMULATION',
                id: `ab_${Date.now()}`,
                name: `A/B Test - ${new Date().toLocaleTimeString()}`,
                timestamp: new Date().toISOString(),
                results: results,
                variants: variants.map(v => ({ region: v.region, image: v.image || "" }))
            });

        } catch (error) {
            console.error(error);
            alert("A/B test simulation failed.");
        } finally {
            setIsABTestingLoading(false);
            setStatus("");
        }
    };

    // Filter results for display based on selection
    // If no selection, we might default to the first group found in results, or show all? 
    // Usually showing stats for mixed variants is confusing. Let's filter to selection, or first available if selection is empty/invalid.
    const getFilteredCreativeResults = () => {
        if (!creativeResults.length) return [];

        // If we have a selection and it exists in results
        if (selectedCreativeAudience) {
            const filtered = creativeResults.filter(r => r.audienceGroup === selectedCreativeAudience);
            if (filtered.length > 0) return filtered;
        }

        // Fallback: If map exists, try first key
        if (brief?.campaignAssetsMap) {
            const firstKey = Object.keys(brief.campaignAssetsMap)[0];
            const filtered = creativeResults.filter(r => r.audienceGroup === firstKey);
            if (filtered.length > 0) return filtered;
        }

        // Fallback: Return all (legacy behavior for single runs)
        return creativeResults;
    };

    const displayedCreativeResults = getFilteredCreativeResults();

    // --- Stats Helpers ---
    const getAcquisitionStats = () => {
        if (!acquisitionResults.length) return null;
        const total = acquisitionResults.length;
        const joined = acquisitionResults.filter(r => r.likelihoodToJoin > 70).length;
        const winningOffers: Record<string, number> = {};
        acquisitionResults.forEach(r => { if (r.winningOffer && r.winningOffer !== "None") winningOffers[r.winningOffer] = (winningOffers[r.winningOffer] || 0) + 1; });
        const topOffer = Object.entries(winningOffers).sort((a, b) => b[1] - a[1])[0];
        return {
            conversion: (joined / total) * 100,
            avgValue: acquisitionResults.reduce((acc, r) => acc + r.perceivedValue, 0) / total,
            topOffer
        };
    };
    const acqStats = getAcquisitionStats();

    const getEmailStats = () => {
        if (!memberResults.length) return [];
        const total = memberResults.length;

        // Group by subject line
        const stats: Record<string, { opens: number, clicks: number }> = {};

        memberResults.forEach(r => {
            r.emailEngagement.forEach(e => {
                if (!stats[e.subjectLine]) stats[e.subjectLine] = { opens: 0, clicks: 0 };
                if (e.opened) stats[e.subjectLine].opens++;
                if (e.clicked) stats[e.subjectLine].clicks++;
            });
        });

        return Object.entries(stats).map(([subject, counts]) => {
            const draft = emailDrafts.find(d => d.subject === subject);
            const bodies = emailBodies[subject];
            return {
                subject,
                openRate: Math.round((counts.opens / total) * 100),
                clickRate: Math.round((counts.clicks / total) * 100),
                body: draft?.body || bodies || "Loading..."
            };
        }).sort((a, b) => b.openRate - a.openRate);
    };
    const emailStats = getEmailStats();

    const getPurchasedStats = () => {
        if (!memberResults.length) return [];
        const counts: Record<string, number> = {};
        memberResults.forEach(r => {
            r.cart.forEach(c => {
                if (c.purchased) {
                    counts[c.productName] = (counts[c.productName] || 0) + 1;
                }
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    };
    const purchasedStats = getPurchasedStats();


    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* --- Top Section: Audience & Context Manager --- */}
            {/* --- Top Section: Audience & Context Manager --- */}
            <div className="page-header">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <Users className="text-[#0077C8]" />
                            <h1 className="page-title">Test Messaging</h1>
                        </div>
                        <div className="flex gap-2">
                            {/* History Dropdown */}
                            <div className="relative" ref={historyDropdownRef}>
                                <button
                                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isHistoryOpen ? 'bg-gray-100 text-heading' : 'text-subtext hover:bg-gray-50 hover:text-heading'}`}
                                >
                                    <History size={16} /> History
                                </button>
                                {isHistoryOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-2 max-h-96 overflow-y-auto z-50">
                                        <div className="flex justify-between items-center px-2 mb-2">
                                            <div className="text-xs font-bold text-gray-500 uppercase">Recent Runs</div>
                                            {savedHistory.length > 0 && (
                                                <button
                                                    onClick={handleClearHistory}
                                                    className="text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1"
                                                >
                                                    <Trash2 size={10} /> Clear All
                                                </button>
                                            )}
                                        </div>
                                        {savedHistory.length === 0 && <div className="text-xs text-gray-500 px-2">No history yet</div>}
                                        {savedHistory.map((run, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { loadRun(run); setIsHistoryOpen(false); }}
                                                className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex items-center gap-2 text-gray-600 hover:text-gray-900"
                                            >
                                                {run.type === 'MEMBER_SIMULATION' ? <Users size={12} className="text-blue-500" /> : run.type === 'ACQUISITION_SIMULATION' ? <UserPlus size={12} className="text-green-500" /> : <MessageCircle size={12} />}
                                                <div className="truncate flex-1">{run.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Tabs */}
                    <div className="tab-scroll-container">
                        <button onClick={() => setActiveTab('CREATIVE')} className={`tab-button ${activeTab === 'CREATIVE' ? 'active' : 'inactive'}`}>
                            <Sparkles size={18} className={activeTab === 'CREATIVE' ? 'text-[#0077C8]' : ''} /> Creative
                        </button>
                        <button onClick={() => setActiveTab('BRIEF')} className={`tab-button ${activeTab === 'BRIEF' ? 'active' : 'inactive'}`}>
                            <MessageCircle size={18} className={activeTab === 'BRIEF' ? 'text-[#0077C8]' : ''} /> Test Brief
                        </button>
                        <button onClick={() => setActiveTab('CHAT')} className={`tab-button ${activeTab === 'CHAT' ? 'active' : 'inactive'}`}>
                            <MessageSquare size={18} className={activeTab === 'CHAT' ? 'text-[#0077C8]' : ''} /> Chat
                        </button>
                        <button onClick={() => setActiveTab('LIVE')} className={`tab-button ${activeTab === 'LIVE' ? 'active' : 'inactive'}`}>
                            <Mic size={18} className={activeTab === 'LIVE' ? 'text-[#0077C8]' : ''} /> Go Live
                        </button>
                        <button onClick={() => setActiveTab('TEST_VIDEO')} className={`tab-button ${activeTab === 'TEST_VIDEO' ? 'active' : 'inactive'}`}>
                            <Video size={18} className={activeTab === 'TEST_VIDEO' ? 'text-[#0077C8]' : ''} /> Test Video
                        </button>
                        <button onClick={() => setActiveTab('ACQUISITION')} className={`tab-button ${activeTab === 'ACQUISITION' ? 'active' : 'inactive'}`}>
                            <UserPlus size={18} className={activeTab === 'ACQUISITION' ? 'text-[#0077C8]' : ''} /> Acquisition
                        </button>
                        <button onClick={() => setActiveTab('EMAIL')} className={`tab-button ${activeTab === 'EMAIL' ? 'active' : 'inactive'}`}>
                            <Mail size={18} className={activeTab === 'EMAIL' ? 'text-[#0077C8]' : ''} /> Email
                        </button>
                        <button onClick={() => setActiveTab('PURCHASE')} className={`tab-button ${activeTab === 'PURCHASE' ? 'active' : 'inactive'}`}>
                            <ShoppingBag size={18} className={activeTab === 'PURCHASE' ? 'text-[#0077C8]' : ''} /> Purchase
                        </button>
                        <button onClick={() => setActiveTab('AB_TEST')} className={`tab-button ${activeTab === 'AB_TEST' ? 'active' : 'inactive'}`}>
                            <BarChart2 size={18} className={activeTab === 'AB_TEST' ? 'text-[#0077C8]' : ''} /> A/B Test
                        </button>
                    </div>

                    {/* Audience List (Inside Header for Context) */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100 mt-2">
                        <div className="flex-shrink-0 text-xs font-bold text-subtext uppercase tracking-wider mr-2">Audience Context</div>
                        {[...personas, ...standardAudiences].map((p, i) => (
                            <div key={i} onClick={() => setSelectedAudience(p)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer hover:shadow-md transition-shadow ${p.isWildcard ? 'bg-blue-50 border-blue-100 text-[#0077C8]' : 'bg-white border-gray-100 text-subtext hover:text-heading'}`}>
                                <div className="w-5 h-5 rounded-full bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100">
                                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Users size={12} />}
                                </div>
                                <span className="font-bold">{p.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); deletePersona(i); }} className="text-gray-400 hover:text-red-500 transition-colors"><X size={12} /></button>
                            </div>
                        ))}

                        <button
                            onClick={() => setIsAddAudienceModalOpen(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-gray-200 text-subtext hover:bg-white hover:text-heading text-sm whitespace-nowrap transition-colors"
                        >
                            <Plus size={12} />
                            <span className="font-bold">Add Audience</span>
                        </button>
                    </div>
                </div>
            </div>




            {/* --- Content Area --- */}
            <div className={`flex-1 bg-gray-50 p-6 ${activeTab === 'CHAT' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'}`}>
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'ACQUISITION' && (
                        <div className="space-y-6">
                            {/* Acquisition Controls - Top */}
                            <div className="content-card flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-heading">Acquisition Simulation</h3>
                                    <p className="text-sm text-subtext">Test offers against {syntheticUsers.length} non-member prospects.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                        <span className="text-xs font-bold text-subtext uppercase">Users Tested</span>
                                        <span className="bg-transparent font-bold text-heading">{syntheticUsers.length}</span>
                                    </div>
                                    <button
                                        onClick={() => handleLoadLast('ACQUISITION_SIMULATION')}
                                        disabled={isAcquisitionLoading}
                                        className="btn-secondary flex items-center gap-2"
                                        title="Load Last Run"
                                    >
                                        <History size={18} />
                                    </button>
                                    <button
                                        onClick={handleRunAcquisition}
                                        disabled={isAcquisitionLoading || syntheticUsers.length === 0}
                                        className="btn-primary flex items-center gap-2"
                                        title={syntheticUsers.length === 0 ? "You must generate users in the Synthetic Users tab first." : ""}
                                    >
                                        {isAcquisitionLoading ? <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full" /> : <Play size={20} />}
                                        Run Simulation
                                    </button>
                                </div>
                            </div>

                            {/* Acquisition Config & Results */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Config */}
                                <div className="content-card">
                                    <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2"><Zap size={20} className="text-yellow-500" /> Acquisition Offers</h3>
                                    <div className="space-y-4 mb-6">
                                        <div className="flex gap-2">
                                            <input className="flex-1 border border-gray-100 bg-gray-50 text-heading rounded px-3 py-2 text-sm placeholder-subtext outline-none focus:border-[#0077C8] transition-colors" placeholder="e.g. Free Shipping" value={newOffer} onChange={e => setNewOffer(e.target.value)} />
                                            <button onClick={() => { setAcquisitionOffers([...acquisitionOffers, newOffer]); setNewOffer("") }} className="bg-heading text-white px-4 py-2 rounded font-bold text-sm hover:opacity-90 transition-opacity">Add</button>
                                        </div>
                                        <div className="space-y-2">
                                            {acquisitionOffers.map((o, i) => (
                                                <div key={i} className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100 text-sm text-heading">
                                                    <span>{o}</span>
                                                    <button onClick={() => setAcquisitionOffers(acquisitionOffers.filter(x => x !== o))} className="text-subtext hover:text-red-500 transition-colors"><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Results */}
                                <div className="lg:col-span-2 space-y-6">
                                    {acqStats && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="content-card text-center">
                                                <div className="text-4xl font-bold text-heading mb-1">{Math.round(acqStats.conversion)}%</div>
                                                <div className="text-xs font-bold text-subtext uppercase">Conversion Rate</div>
                                            </div>
                                            <div className="content-card text-center relative group cursor-help">
                                                <div className="text-4xl font-bold text-heading mb-1">{Math.round(acqStats.avgValue)}</div>
                                                <div className="text-xs font-bold text-subtext uppercase flex items-center justify-center gap-1">
                                                    Perceived Value <Info size={12} />
                                                </div>
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-heading text-white text-xs font-medium p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                    The average monetary value the audience assigns to this offer based on psychological benefits and utility.
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-heading"></div>
                                                </div>
                                            </div>
                                            <div className="content-card text-center">
                                                {acqStats.topOffer ? (
                                                    <>
                                                        <div className="text-lg font-bold text-[#0077C8] mb-1 truncate px-2" title={acqStats.topOffer[0]}>"{acqStats.topOffer[0]}"</div>
                                                        <div className="text-xs font-bold text-yellow-500 uppercase">Winning Offer</div>
                                                    </>
                                                ) : <div className="text-subtext py-4">No Data</div>}
                                            </div>
                                        </div>
                                    )}

                                    {acquisitionResults.length > 0 && (
                                        <div className="content-card p-0 overflow-hidden shadow-xl border-blue-100">
                                            <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-lg">
                                                        <MessageSquare className="text-[#0077C8]" size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-heading uppercase tracking-widest text-sm">Prospect Feedback Loop</h3>
                                                        <p className="text-[10px] text-subtext font-bold">In-depth sentiment analysis from {acquisitionResults.length} simulated interactions</p>
                                                    </div>
                                                </div>
                                                <div className="badge badge-blue">{acquisitionResults.length} participants</div>
                                            </div>
                                            <div className="max-h-[600px] overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/30">
                                                {acquisitionResults.map((r, i) => (
                                                    <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
                                                        <div className={`w-1.5 h-16 rounded-full flex-shrink-0 transition-colors ${r.likelihoodToJoin > 75 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : r.likelihoodToJoin > 45 ? 'bg-yellow-500' : 'bg-red-400'}`} />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <div className="font-black text-heading text-sm uppercase tracking-wider">{r.personaName}</div>
                                                                    <div className="text-[10px] font-bold text-subtext opacity-60">Gen-Z / Millennial Prospect</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-lg font-black text-heading leading-none">{r.likelihoodToJoin}%</div>
                                                                    <div className="text-[8px] font-black text-subtext uppercase tracking-widest">Likelihood</div>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-heading italic font-medium leading-relaxed mb-4 border-l-2 border-gray-100 pl-3">"{r.feedback}"</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {r.barriers && r.barriers !== "None" && (
                                                                    <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black border border-red-100 flex items-center gap-1">
                                                                        <XCircle size={12} /> {r.barriers}
                                                                    </span>
                                                                )}
                                                                {r.winningOffer && r.winningOffer !== "None" && (
                                                                    <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-[10px] font-black border border-green-100 flex items-center gap-1 shadow-sm">
                                                                        <CheckCircle2 size={12} /> Won by: {r.winningOffer}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CHAT' && (
                        <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <SyntheticChat />
                        </div>
                    )}

                    {activeTab === 'TEST_VIDEO' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="content-card">
                                <h3 className="text-lg font-bold text-heading mb-4 flex items-center gap-2"><Video size={20} className="text-[#0077C8]" /> Test Video against Focus Group</h3>
                                <p className="text-sm text-subtext mb-6">Select a video from the insights page and simulate feedback from all synthetic users in this cohort.</p>
                                
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left: Video Selector & Player */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-subtext uppercase mb-1">Select Video</label>
                                            <select 
                                                value={selectedVideoForTest?.id || ''} 
                                                onChange={(e) => {
                                                    const vid = videoList.find(v => v.id === e.target.value);
                                                    setSelectedVideoForTest(vid || null);
                                                    setVideoTestResults([]);
                                                }}
                                                className="p-2 border border-gray-300 rounded-lg w-full bg-white text-gray-900"
                                            >
                                                <option value="">-- Select a Video --</option>
                                                {videoList.map(v => (
                                                    <option key={v.id} value={v.id}>{v.title || v.url || v.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        {selectedVideoForTest && (
                                            <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 bg-white">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${selectedVideoForTest.id}`}
                                                    title={selectedVideoForTest.title}
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Right: Controls & Quick Stats */}
                                    <div className="w-full md:w-1/3 space-y-4">
                                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="font-medium text-subtext uppercase tracking-wider">Focus Group Size</span>
                                                <span className="font-bold text-gray-900">{syntheticUsers.length} Users</span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={handleLoadLastVideoTest}
                                            className="w-full btn-secondary py-2 rounded-xl flex items-center justify-center gap-3 font-bold shadow-sm hover:shadow-md transition-all mb-2"
                                            title="Load Last Run"
                                        >
                                            <History size={18} /> Load Last
                                        </button>
                                        
                                        <button
                                            onClick={handleRunVideoTest}
                                            disabled={isVideoTesting || !selectedVideoForTest || syntheticUsers.length === 0}
                                            className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-sm hover:shadow-md transition-all"
                                        >
                                            {isVideoTesting ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                                            Run Video Test
                                        </button>
                                        
                                        {videoTestResults.length > 0 && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="content-card text-center p-4 bg-white border border-gray-100">
                                                    <div className="text-2xl font-bold text-gray-900">{Math.round(videoTestResults.reduce((a, b) => a + b.visualAppeal, 0) / videoTestResults.length) || 0}</div>
                                                    <div className="text-[10px] font-black text-subtext uppercase tracking-widest mt-1">Avg Visual Appeal</div>
                                                </div>
                                                <div className="content-card text-center p-4 bg-white border border-gray-100">
                                                    <div className="text-2xl font-bold text-gray-900">{Math.round(videoTestResults.reduce((a, b) => a + b.messageClarity, 0) / videoTestResults.length) || 0}</div>
                                                    <div className="text-[10px] font-black text-subtext uppercase tracking-widest mt-1">Avg Clarity</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Results List */}
                            {videoTestResults.length > 0 && (
                                <div className="content-card">
                                    <h3 className="font-bold text-heading mb-4">Verbatim Feedback</h3>
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {videoTestResults.map((r, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200">
                                                <div className="flex justify-between text-[10px] font-bold text-subtext mb-2 uppercase tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <span>{r.personaName}</span>
                                                        <span className="text-[10px] text-subtext font-bold uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                                                            {(() => {
                                                                const user = syntheticUsers.find(u => r.personaId?.includes(u.id)) || 
                                                                             syntheticUsers.find(u => u.name === r.personaName);
                                                                return user?.baseAudienceName || 'Standard Audience';
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <span className={r.sentiment === 'Positive' ? 'text-green-600' : r.sentiment === 'Negative' ? 'text-red-600' : 'text-subtext'}>{r.sentiment}</span>
                                                </div>
                                                <p className="text-sm text-gray-800 leading-relaxed italic">"{r.feedback}"</p>
                                                <div className="mt-2 flex gap-4 text-xs text-subtext">
                                                    <span>Visual: {r.visualAppeal}/10</span>
                                                    <span>Clarity: {r.messageClarity}/10</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'LIVE' && (
                        <div className="space-y-6">
                            <div className="content-card p-8 border-b-4 border-b-[#0077C8]">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="section-header flex items-center gap-3 text-[#0077C8]">
                                            <Mic size={32} />
                                            Go Live with Focus Group
                                        </h2>
                                        <p className="text-subtext mt-2 text-lg font-medium">
                                            Pick a persona from your focus group and start a real-time voice conversation.
                                        </p>
                                    </div>
                                </div>

                                {isLiveActive && livePersona ? (
                                    <div className="bg-[#0077C8]/5 rounded-3xl p-12 border-2 border-[#0077C8]/20 text-center space-y-8 animate-fadeIn">
                                        <div className="relative inline-block">
                                            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-[#0077C8] shadow-xl border-4 border-[#0077C8] overflow-hidden">
                                                {livePersona?.imageUrl ? <img src={livePersona.imageUrl} className="w-full h-full object-cover" /> : <User size={64} />}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-white animate-pulse">
                                                <Volume2 size={24} />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-3xl font-black text-heading mb-2">
                                                {livePersona.personaName && livePersona.personaName !== livePersona.name 
                                                    ? `${livePersona.personaName} (${livePersona.name})` 
                                                    : livePersona.name}
                                            </h3>
                                            <p className="text-[#0077C8] font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                                                Live Connection Active
                                            </p>
                                        </div>

                                        <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-[#0077C8]/10 shadow-inner min-h-[120px] flex items-center justify-center italic text-gray-700 text-xl leading-relaxed">
                                            {liveTranscription || "Listening..."}
                                        </div>

                                        <div className="flex gap-4 justify-center mt-4">
                                            <button 
                                                onClick={() => handleSendData('brief')}
                                                className="btn-secondary py-2 px-4 text-sm font-bold flex items-center gap-2"
                                                disabled={!brief}
                                            >
                                                <FileText size={16} /> Send Marketing Brief
                                            </button>
                                            <button 
                                                onClick={() => handleSendData('email')}
                                                className="btn-secondary py-2 px-4 text-sm font-bold flex items-center gap-2"
                                                disabled={emailDrafts.length === 0}
                                            >
                                                <Mail size={16} /> Send Email Copy
                                            </button>
                                        </div>

                                        <button 
                                            onClick={() => toggleLive(null)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-12 py-4 rounded-full font-black text-lg shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-3 mx-auto"
                                        >
                                            <XCircle size={24} /> END SESSION
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[...personas, ...standardAudiences].map((p, i) => (
                                            <div key={i} className="content-card hover:shadow-xl transition-all border-t-4 border-t-gray-100 hover:border-t-[#0077C8] group flex flex-col">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-[#0077C8] transition-colors border border-gray-100 shadow-sm overflow-hidden">
                                                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Users size={32} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-heading leading-tight">{p.personaName || p.name}</h4>
                                                        <p className="text-xs text-subtext font-bold uppercase tracking-wider">{p.job_title || "Target Audience"}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-subtext line-clamp-3 mb-6 min-h-[60px] flex-grow">{p.bio}</p>
                                                <button 
                                                    onClick={() => toggleLive(p)}
                                                    className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-sm hover:shadow-md transition-all"
                                                >
                                                    <Mic size={20} /> START LIVE TALK
                                                </button>
                                            </div>
                                        ))}
                                        {personas.length === 0 && (
                                            <div className="col-span-full py-20 text-center content-card bg-gray-50/50 border-dashed">
                                                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                                                <h3 className="text-lg font-bold text-subtext">No Base Personas Found</h3>
                                                <p className="text-sm text-subtext">Add personas to the Audience Context list above first.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SHARED CONTROLS FOR EMAIL, BRIEF, PURCHASE */}
                    {(activeTab === 'EMAIL' || activeTab === 'BRIEF' || activeTab === 'PURCHASE') && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center mb-6">
                            <div className="">
                                <h3 className="text-lg font-black text-heading">
                                    {activeTab === 'EMAIL' ? 'Email Campaign Simulation' :
                                        activeTab === 'BRIEF' ? 'Marketing Brief Feedback' :
                                            'Purchase Behavior & Product Mix'}
                                </h3>
                                <p className="text-sm text-subtext font-medium outline-none">Test brief against {syntheticUsers.length} synthetic users.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                    <span className="text-xs font-black text-subtext uppercase tracking-widest">Users Tested</span>
                                    <span className="bg-transparent font-black text-heading">{syntheticUsers.length}</span>
                                </div>
                                {activeTab === 'EMAIL' && (
                                    <button
                                        onClick={() => setIsEmailEditorOpen(true)}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <Edit2 size={16} /> Create/Edit Emails
                                    </button>
                                )}
                                {activeTab === 'PURCHASE' && (
                                    <button
                                        onClick={() => setShowProducts(true)}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <Edit2 size={16} /> Create/Edit Products
                                    </button>
                                )}
                                <button
                                    onClick={() => handleLoadLast('MEMBER_SIMULATION')}
                                    disabled={isMemberLoading}
                                    className="btn-secondary flex items-center gap-2"
                                    title="Load Last Run"
                                >
                                    <History size={18} />
                                </button>
                                <button
                                    onClick={() => handleRunMemberSim()}
                                    disabled={isMemberLoading || syntheticUsers.length === 0}
                                    title={syntheticUsers.length === 0 ? "You must generate users in the Synthetic Users tab first." : ""}
                                    className="btn-primary px-6 py-3 flex items-center gap-2"
                                >
                                    {isMemberLoading ? <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full" /> : <Play size={20} />}
                                    Run Simulation
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Email Editor Modal */}
                    {isEmailEditorOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                                    <h3 className="font-bold text-xl text-heading flex items-center gap-2">
                                        <Mail className="text-[#0077C8]" />
                                        Email Campaign Editor
                                    </h3>
                                    <button onClick={() => setIsEmailEditorOpen(false)} className="text-subtext hover:text-heading transition-colors"><X /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                                    {editingEmailIndex !== null ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-subtext uppercase mb-1">Subject Line</label>
                                                <input
                                                    value={editingEmailSubject}
                                                    onChange={e => setEditingEmailSubject(e.target.value)}
                                                    className="w-full border border-gray-100 bg-white rounded-lg p-3 font-bold text-heading focus:ring-2 focus:ring-[#0077C8] shadow-sm outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-subtext uppercase mb-1">Email Body</label>
                                                <textarea
                                                    value={editingEmailBody}
                                                    onChange={e => setEditingEmailBody(e.target.value)}
                                                    className="w-full h-96 border border-gray-100 bg-white rounded-lg p-4 text-sm leading-relaxed focus:ring-2 focus:ring-[#0077C8] shadow-sm outline-none resize-none font-mono text-heading transition-all"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => setEditingEmailIndex(null)}
                                                    className="btn-secondary"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const updated = [...emailDrafts];
                                                        updated[editingEmailIndex] = { subject: editingEmailSubject, body: editingEmailBody };
                                                        updateEmailDrafts(updated);
                                                        setEditingEmailIndex(null);
                                                    }}
                                                    className="btn-primary"
                                                >
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4">
                                            {emailDrafts.length === 0 && (
                                                <div className="text-center py-10">
                                                    <p className="text-gray-500 mb-4">No drafts yet.</p>


                                                    {/* ... (rest of state) */}

                                                    {/* ... inside render ... */}

                                                    <button
                                                        onClick={async () => {
                                                            setIsGeneratingEmails(true);
                                                            try {
                                                                const { generateEmailBodies } = await import('../services/geminiService');
                                                                const bodies = await generateEmailBodies(emailHeadlines, brief!);
                                                                const campaigns = emailHeadlines.map(h => ({ subject: h, body: bodies[h] || "Loading..." }));
                                                                updateEmailDrafts(campaigns);
                                                            } catch (e) {
                                                                console.error(e);
                                                                alert("Failed to generate emails.");
                                                            } finally {
                                                                setIsGeneratingEmails(false);
                                                            }
                                                        }}
                                                        disabled={isGeneratingEmails}
                                                        className="text-[#0077C8] font-bold underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center hover:opacity-80 transition-opacity"
                                                    >
                                                        {isGeneratingEmails ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0077C8] border-t-transparent" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            "Generate Defaults"
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                            {emailDrafts.map((draft, i) => (
                                                <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-[#0077C8] transition-all">
                                                    <div>
                                                        <div className="font-bold text-heading mb-1">{draft.subject}</div>
                                                        <div className="text-xs text-subtext line-clamp-1">{draft.body.substring(0, 100)}...</div>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingEmailIndex(i);
                                                                setEditingEmailSubject(draft.subject);
                                                                setEditingEmailBody(draft.body);
                                                            }}
                                                            className="p-2 hover:bg-gray-50 rounded-lg text-subtext hover:text-heading transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => updateEmailDrafts(emailDrafts.filter((_, idx) => idx !== i))}
                                                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    updateEmailDrafts([...emailDrafts, { subject: "New Campaign", body: "Write your email content here..." }]);
                                                    setEditingEmailIndex(emailDrafts.length);
                                                    setEditingEmailSubject("New Campaign");
                                                    setEditingEmailBody("Write your email content here...");
                                                }}
                                                className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl text-subtext font-bold hover:border-gray-200 hover:text-heading transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Plus size={20} /> Add New Email
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsEmailEditorOpen(false)}
                                        className="btn-secondary"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEmailEditorOpen(false);
                                            handleRunMemberSim();
                                        }}
                                        disabled={emailDrafts.length === 0}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Play size={18} /> Run Test with {emailDrafts.length} Emails
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'EMAIL' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Email Performance Analytics */}
                            <div className="content-card">
                                <h3 className="font-bold text-heading mb-4 flex items-center gap-2">
                                    <Mail size={18} className="text-[#0077C8]" /> Campaign Performance
                                </h3>
                                <div className="space-y-4 h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {emailStats.length > 0 ? emailStats.map((stat, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedEmailStats(selectedEmailStats?.subject === stat.subject ? null : stat)}
                                            className="group border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer bg-white hover:border-[#0077C8]"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="font-bold text-heading group-hover:text-[#0077C8] transition-colors line-clamp-1">
                                                    {stat.subject}
                                                </div>
                                                <ChevronDown size={16} className={`text-subtext transform transition-transform ${selectedEmailStats?.subject === stat.subject ? 'rotate-180' : ''}`} />
                                            </div>

                                            {/* Stats Bars */}
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1.5">
                                                        <span className="font-medium text-subtext uppercase tracking-wider">Open Rate</span>
                                                        <span className="font-bold text-heading">{stat.openRate}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                        <div className="h-full bg-[#0077C8] rounded-full transition-all duration-500" style={{ width: `${stat.openRate}%` }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1.5">
                                                        <span className="font-medium text-subtext uppercase tracking-wider">Click-Through</span>
                                                        <span className="font-bold text-green-600">{stat.clickRate}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                                                        <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${stat.clickRate}%` }} />
                                                    </div>
                                                </div>
                                            </div>


                                            {/* Audience Breakdown */}
                                            {selectedEmailStats?.subject === stat.subject && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn cursor-default" onClick={(e) => e.stopPropagation()}>
                                                    <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        <h4 className="text-xs font-bold text-subtext uppercase mb-2 tracking-wider">Email Body</h4>
                                                        <p className="text-xs text-heading whitespace-pre-wrap font-mono max-h-40 overflow-y-auto custom-scrollbar leading-relaxed">{stat.body}</p>
                                                    </div>
                                                    <h4 className="text-xs font-bold text-heading uppercase mb-3 tracking-wider">Audience Insights</h4>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {Object.entries(memberResults.reduce((acc, r) => {
                                                                const engage = r.emailEngagement.find(e => e.subjectLine === stat.subject);
                                                                if (!engage) return acc;
                                                                const groupName = r.personaName;
                                                                if (!acc[groupName]) acc[groupName] = { sent: 0, opened: 0, clicked: 0, feedback: [] };
                                                                acc[groupName].sent++;
                                                                if (engage.opened) acc[groupName].opened++;
                                                                if (engage.clicked) acc[groupName].clicked++;
                                                                return acc;
                                                            }, {} as Record<string, { sent: number, opened: number, clicked: number, feedback: string[] }>)).map(([name, s], idx) => (
                                                                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                                                                    <div className="font-bold text-heading mb-3 border-b border-gray-50 pb-2">{name}</div>
                                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                                        <div>
                                                                            <div className="text-[10px] text-subtext uppercase font-bold tracking-tight">Open Rate</div>
                                                                            <div className="text-lg font-bold text-heading">{Math.round((s.opened / s.sent) * 100)}%</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[10px] text-subtext uppercase font-bold tracking-tight">Click Rate</div>
                                                                            <div className={`text-lg font-bold ${s.clicked > 0 ? 'text-green-600' : 'text-subtext'}`}>{Math.round((s.clicked / s.sent) * 100)}%</div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Feedback snippets */}
                                                                    <div className="space-y-2">
                                                                        {s.clicked > 0 ? (
                                                                            <div className="flex gap-2 items-start p-2 bg-green-50 rounded-lg border border-green-100">
                                                                                <div className="bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 shadow-sm">POS</div>
                                                                                <span className="text-xs text-green-800 italic">"The subject line really spoke to my needs."</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex gap-2 items-start p-2 bg-red-50 rounded-lg border border-red-100">
                                                                                <div className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 shadow-sm">NEG</div>
                                                                                <span className="text-xs text-red-800 italic">"I didn't feel this was relevant to me right now."</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="text-subtext italic text-sm text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                            Run simulation to see email performance metrics.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'BRIEF' && (
                        <div className="space-y-6 animate-fadeIn">
                            {/* Score Cards - MOVED TO TOP */}
                            {memberResults.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                                    {(() => {
                                        const interest = memberResults.reduce((a, b) => a + b.briefMetrics.interestScore, 0) / memberResults.length;
                                        return (
                                            <div className="content-card text-center relative group cursor-help p-6 border-t-4 border-[#0077C8]">
                                                <div className="text-5xl font-bold text-heading mb-2">{Math.round(interest)}</div>
                                                <div className="text-xs font-bold text-subtext uppercase tracking-widest">Interest Score</div>
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-gray-900 text-white text-xs font-medium p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                    Measures how engaging and appealing the brief is to the target audience.
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                    {(() => {
                                        const clarity = memberResults.reduce((a, b) => a + b.briefMetrics.clarityScore, 0) / memberResults.length;
                                        return (
                                            <div className="content-card text-center relative group cursor-help p-6 border-t-4 border-green-500">
                                                <div className="text-5xl font-bold text-green-500 mb-2">{Math.round(clarity)}</div>
                                                <div className="text-xs font-bold text-subtext uppercase tracking-widest">Clarity Score</div>
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-gray-900 text-white text-xs font-medium p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                    Evaluates how easily the key message is understood by the audience.
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                    {(() => {
                                        const rel = memberResults.reduce((a, b) => a + b.briefMetrics.relevanceScore, 0) / memberResults.length;
                                        return (
                                            <div className="content-card text-center relative group cursor-help p-6 border-t-4 border-red-500">
                                                <div className="text-5xl font-bold text-red-500 mb-2">{Math.round(rel)}</div>
                                                <div className="text-xs font-bold text-subtext uppercase tracking-widest">Relevance Score</div>
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-gray-900 text-white text-xs font-medium p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                    Assess how well the brief addresses the audience's specific needs and pain points.
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                            )}

                            {/* Key Messages Config */}
                            <div className="content-card">
                                <div className="text-sm font-bold text-heading mb-4 flex items-center gap-2">
                                    <MessageCircle size={18} className="text-[#0077C8]" />
                                    Key Marketing Messages (Tested in Simulation)
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {marketingMessages.map((msg, i) => (
                                        <span key={i} className="text-sm px-3 py-1.5 bg-white text-heading rounded-lg border border-gray-100 flex items-center gap-2 shadow-sm">
                                            {msg}
                                            <button onClick={() => setMarketingMessages(marketingMessages.filter(m => m !== msg))} className="text-subtext hover:text-red-500 transition-colors"><X size={12} /></button>
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-1">
                                        <input
                                            className="text-sm px-3 py-1.5 border border-gray-100 bg-gray-50 text-heading rounded-lg outline-none focus:border-[#0077C8] transition-colors"
                                            placeholder="Add message..."
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (setMarketingMessages([...marketingMessages, newMessage]), setNewMessage(""))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Feedback */}
                            {memberResults.length > 0 && (
                                <div className="content-card max-h-[600px] overflow-y-auto custom-scrollbar">
                                    <h3 className="font-bold text-heading mb-4">Detailed Feedback</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {memberResults.slice(0, 50).map((r, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                <div className="flex justify-between font-bold text-sm mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-heading">{r.personaName}</span>
                                                        <span className="text-[10px] text-subtext font-black uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                            {(() => {
                                                                const user = syntheticUsers.find(u => r.personaId.includes(u.id)) || 
                                                                             syntheticUsers.find(u => u.name === r.personaName);
                                                                return user?.baseAudienceName || 'Standard Audience';
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <span className="text-[#0077C8] flex items-center gap-1">Interest: {r.briefMetrics.interestScore}/10</span>
                                                </div>
                                                <div className="text-sm text-subtext leading-relaxed">"{r.briefMetrics.feedback}"</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'PURCHASE' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                            {/* Products Preview */}
                            <div className="content-card">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-heading flex items-center gap-2">
                                        <ShoppingCart size={18} className="text-[#0077C8]" /> Target Products
                                    </h3>
                                    <button onClick={() => setShowProducts(true)} className="text-xs font-bold text-[#0077C8] hover:opacity-80 transition-opacity uppercase tracking-wider">
                                        View All {simulationProducts.length}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {simulationProducts.slice(0, 6).map((p, i) => (
                                        <div key={i} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-gray-100 text-subtext shadow-sm">
                                                <ShoppingCart size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="text-sm font-bold text-heading truncate" title={p}>{p.split(':')[0]}</div>
                                                <div className="text-xs text-subtext font-medium">In Stock</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Products Purchased Summary */}
                            <div className="content-card">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-heading flex items-center gap-2">
                                        <ShoppingBag size={18} className="text-green-500" /> Purchased Summary
                                    </h3>
                                    {purchasedStats.length > 0 && <span className="badge badge-green">{memberResults.reduce((acc, r) => acc + r.cart.filter(c => c.purchased).length, 0)} Total Sales</span>}
                                </div>
                                <div className="space-y-3">
                                    {purchasedStats.length > 0 ? purchasedStats.map(([product, count], i) => (
                                        <div key={i} className="flex gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs border border-green-100 shadow-sm">
                                                {count}x
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="text-sm font-bold text-heading truncate" title={product}>{product.split(':')[0]}</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-subtext italic text-sm text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                            Run simulation to see purchase data.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'PURCHASE' && memberResults.length > 0 && (
                        <div className="mt-8 space-y-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-heading flex items-center gap-2">
                                <Users size={24} className="text-[#0077C8]" /> Audience Insights & Growth Opportunities
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.entries(memberResults.reduce((acc, r) => {
                                    // Group by Persona
                                    if (!acc[r.personaName]) acc[r.personaName] = [];
                                    acc[r.personaName].push(r);
                                    return acc;
                                }, {} as Record<string, typeof memberResults>)).map(([personaName, results], i) => {
                                    const purchasedItems = results.flatMap(r => r.cart.filter(c => c.purchased));
                                    const notPurchasedItems = results.flatMap(r => r.cart.filter(c => !c.purchased).map(c => ({ ...c, originalResult: r })));

                                    // Calculate top product
                                    const productCounts = purchasedItems.reduce((acc, item) => {
                                        acc[item.productName] = (acc[item.productName] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>);
                                    const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

                                    // Get a random "Why I bought"
                                    const positiveReason = purchasedItems.find(p => p.reason && p.reason.length > 5)?.reason;
                                    // Get a "Barrier" from negative feedback or non-purchase reason
                                    const barrier = results.find(r => r.briefMetrics.negativeFeedback)?.briefMetrics.negativeFeedback;

                                    return (
                                        <div key={i} className="content-card p-0 overflow-hidden flex flex-col bg-white">
                                            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                                                <h4 className="font-bold text-[#0077C8]">{personaName}</h4>
                                                <span className="badge badge-blue">
                                                    {purchasedItems.length} Purchases
                                                </span>
                                            </div>

                                            <div className="p-4 flex-1 space-y-4">
                                                {/* Top Product */}
                                                <div>
                                                    <div className="text-xs font-bold text-subtext uppercase mb-1 tracking-wider">Top Choice</div>
                                                    <div className="font-bold text-heading text-sm">
                                                        {topProduct ? `${topProduct[0]} (${topProduct[1]}x)` : <span className="text-subtext italic">No purchases yet</span>}
                                                    </div>
                                                </div>

                                                {/* Why They Buy */}
                                                {positiveReason && (
                                                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                                                        <div className="text-xs font-bold text-green-700 uppercase mb-1.5 flex items-center gap-1"><CheckCircle2 size={12} /> Why They Buy</div>
                                                        <p className="text-xs text-green-800 italic leading-relaxed">"{positiveReason}"</p>
                                                    </div>
                                                )}

                                                {/* Barrier / Missed Opp */}
                                                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                                    <div className="text-xs font-bold text-red-700 uppercase mb-1.5 flex items-center gap-1"><XCircle size={12} /> Growth Opportunity</div>
                                                    <p className="text-xs text-red-800 leading-relaxed italic">
                                                        {barrier || "Increase brief relevance to unlock this segment."}
                                                    </p>
                                                </div>

                                                {/* Potential Upsell - Random non-purchased item with reason */}
                                                {notPurchasedItems.length > 0 && notPurchasedItems[0].reason && (
                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                                                        <div className="text-[10px] font-bold text-subtext uppercase mb-1 tracking-tight">Missed Sale: {notPurchasedItems[0].productName}</div>
                                                        <div className="text-[11px] text-subtext italic leading-snug">"{notPurchasedItems[0].reason}"</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'CREATIVE' && (
                        <div className="space-y-6">
                            {/* Creative Controls */}
                            <div className="content-card flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-heading">Campaign Images Focus Group</h3>
                                    <p className="text-sm text-subtext">Test generated assets against {syntheticUsers.length} synthetic users.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                        <span className="text-xs font-bold text-subtext uppercase">Users Tested</span>
                                        <span className="bg-transparent text-heading font-bold text-sm">{syntheticUsers.length}</span>
                                    </div>
                                    <button
                                        onClick={() => handleLoadLast('CREATIVE_SIMULATION')}
                                        disabled={isCreativeLoading}
                                        className="btn-secondary flex items-center gap-2"
                                        title="Load Last Run"
                                    >
                                        <History size={18} />
                                    </button>
                                    <button
                                        onClick={handleRunCreativeSim}
                                        disabled={isCreativeLoading || syntheticUsers.length === 0}
                                        title={syntheticUsers.length === 0 ? "You must generate users in the Synthetic Users tab first." : ""}
                                        className="btn-primary px-6 py-3 flex items-center gap-2"
                                    >
                                        {isCreativeLoading ? <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full" /> : <Play size={20} />}
                                        Run Simulation
                                    </button>
                                </div>
                            </div>

                            {/* Creative Assets Preview */}
                            <div className="content-card">
                                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                                    <h3 className="font-bold text-heading">Assets being Tested</h3>
                                    {contentHubVariants.length > 0 ? (
                                        <div className="flex bg-gray-50 rounded-full p-1 border border-gray-100 overflow-x-auto max-w-full">
                                            {contentHubVariants.map(v => (
                                                <button
                                                    key={v.id}
                                                    onClick={() => setSelectedCreativeAudience(v.title)}
                                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all shrink-0 ${selectedCreativeAudience === v.title
                                                        ? 'bg-white text-[#0077C8] shadow-sm'
                                                        : 'text-subtext hover:text-heading'
                                                        }`}
                                                >
                                                    {v.title}
                                                </button>
                                            ))}
                                        </div>
                                    ) : brief?.campaignAssetsMap ? (
                                        <div className="flex bg-gray-50 rounded-full p-1 border border-gray-100">
                                            {Object.keys(brief.campaignAssetsMap).map(aud => (
                                                <button
                                                    key={aud}
                                                    onClick={() => setSelectedCreativeAudience(aud)}
                                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${selectedCreativeAudience === aud
                                                        ? 'bg-white text-[#0077C8] shadow-sm'
                                                        : 'text-subtext hover:text-heading'
                                                        }`}
                                                >
                                                    {aud}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                                {(contentHubVariants.length === 0 && !brief?.campaignAssetsMap && !brief?.campaignAssets) ? (
                                    <div className="text-center py-12 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                            <Sparkles className="text-[#0077C8]" size={32} />
                                        </div>
                                        <h4 className="text-lg font-black text-heading mb-2">No Campaign Assets Found</h4>
                                        <p className="text-subtext mb-6 max-w-sm mx-auto font-medium">
                                            We couldn't find any generated assets or content variations. Try generating variations in Create Content first.
                                        </p>
                                        <div className="flex gap-4 justify-center">
                                            <button
                                                onClick={refreshBriefData}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <History size={20} />
                                                Refresh Data
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                        <div className="flex flex-col md:flex-row gap-6 w-full items-stretch">
                                        {activeCreativeAssets?.image && (
                                                <div className="w-full md:w-1/3 flex-shrink-0">
                                                    <img src={activeCreativeAssets?.image} className="w-full aspect-square object-cover rounded-xl border border-gray-100 shadow-sm" />
                                                    <p className="text-[10px] text-center mt-3 font-black text-subtext uppercase tracking-widest">Main Concept Image</p>
                                            </div>
                                        )}
                                            <div className="flex-1 p-6 bg-gray-50 rounded-xl border border-gray-100 text-sm shadow-sm flex flex-col justify-center">
                                                <p className="font-black text-heading text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#0077C8]" />
                                                Social Caption
                                            </p>
                                                <p className="italic text-heading mb-6 font-medium leading-relaxed text-base">"{activeCreativeAssets?.social?.caption || 'No caption generated'}"</p>
                                            <p className="font-black text-heading text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#0077C8]" />
                                                Search Ad copy
                                            </p>
                                                <p className="text-heading font-black text-base mb-1">{activeCreativeAssets?.search?.headline || 'No headline'}</p>
                                                <p className="text-subtext text-sm leading-relaxed font-medium">{activeCreativeAssets?.search?.description || 'No description'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Results */}
                            {creativeResults.length > 0 && (
                                <div className="content-card lg:col-span-2">
                                    <h3 className="font-black text-heading mb-6 flex items-center gap-2 uppercase tracking-widest text-sm">
                                        Focus Group Feedback Summary
                                        <div className="group relative">
                                            <Info size={16} className="text-subtext cursor-help" />
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-heading text-white text-[10px] p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none border border-white/10 leading-relaxed font-medium">
                                                Aggregated scoring insights from all synthetic Healthco syntheticUsers in this cohort.
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-heading" />
                                            </div>
                                        </div>
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-gray-50 p-5 rounded-2xl text-center relative group cursor-help transition-all border border-gray-100 hover:border-[#0077C8] shadow-sm">
                                            <div className="text-3xl font-black text-heading">{Math.round(displayedCreativeResults.reduce((a, b) => a + b.visualAppeal, 0) / displayedCreativeResults.length) || 0}</div>
                                            <div className="text-[10px] font-black text-subtext uppercase tracking-widest mt-1">Consistency</div>
                                            {/* Tooltip */}
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-heading text-white text-[10px] font-medium p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none border border-white/10 leading-relaxed">
                                                How aesthetics align with expectations for modern healthcare experiences.
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-heading" />
                                            </div>
                                        </div>
                                        <div className="bg-red-50 p-5 rounded-2xl text-center relative group cursor-help transition-all border border-red-100 hover:border-red-500 shadow-sm">
                                            <div className="text-3xl font-black text-red-600">{Math.round(displayedCreativeResults.reduce((a, b) => a + b.brandFit, 0) / displayedCreativeResults.length) || 0}</div>
                                            <div className="text-[10px] font-black text-red-700 uppercase tracking-widest mt-1">Brand Fit</div>
                                            {/* Tooltip */}
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-heading text-white text-[10px] font-medium p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none border border-white/10 leading-relaxed">
                                                How well the creative aligns with Healthco Health's core brand identity.
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-heading" />
                                            </div>
                                        </div>
                                        <div className="bg-green-50 p-5 rounded-2xl text-center relative group cursor-help transition-all border border-green-100 hover:border-green-500 shadow-sm">
                                            <div className="text-3xl font-black text-green-600">{Math.round(displayedCreativeResults.reduce((a, b) => a + (b.conversionLikelihood || 0), 0) / displayedCreativeResults.length) || 0}</div>
                                            <div className="text-[10px] font-black text-green-700 uppercase tracking-widest mt-1">Growth</div>
                                            {/* Tooltip */}
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-heading text-white text-[10px] font-medium p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none border border-white/10 leading-relaxed">
                                                Likelihood of the audience engaging with the proposed plan or service.
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-heading" />
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-5 rounded-2xl text-center relative group cursor-help transition-all border border-purple-100 hover:border-purple-500 shadow-sm">
                                            <div className="text-3xl font-black text-purple-600">{Math.round(displayedCreativeResults.reduce((a, b) => a + (b.stoppingPower || 0), 0) / displayedCreativeResults.length) || 0}</div>
                                            <div className="text-[10px] font-black text-purple-700 uppercase tracking-widest mt-1">Clarity</div>
                                            {/* Tooltip */}
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-heading text-white text-[10px] font-medium p-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none border border-white/10 leading-relaxed">
                                                Ability for the messaging to be understood clearly and instantly.
                                                <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-heading" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Optimization Insights */}
                            <div className="content-card">
                                <h3 className="font-black text-heading mb-6 flex items-center gap-2 uppercase tracking-widest text-sm">
                                    <Zap size={20} className="text-yellow-500" />
                                    Persona Optimization insights
                                </h3>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Group by Persona Name to show 1 idea per audience type if multiple per type, or just map if 1:1 */
                                        Object.values(displayedCreativeResults.reduce((acc, r) => {
                                            if (!acc[r.personaName]) acc[r.personaName] = r;
                                            return acc;
                                        }, {} as Record<string, typeof displayedCreativeResults[0]>)).map((r: any, i) => (
                                            <div key={i} className="border border-gray-100 rounded-2xl p-5 bg-gray-50 shadow-sm">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0077C8] font-black text-xs border border-blue-100 shadow-sm">
                                                        {r.personaName.charAt(0)}
                                                    </div>
                                                    <div className="font-black text-heading text-sm uppercase tracking-widest">{r.personaName}</div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#0077C8]/20" />
                                                        <div className="text-[10px] font-black text-subtext uppercase mb-2 flex items-center gap-2 opacity-60">
                                                            <MessageSquare size={12} /> Messaging Strategy
                                                        </div>
                                                        <p className="text-xs text-heading italic font-medium leading-relaxed">"{r.suggestedMessaging || 'No specific suggestion.'}"</p>
                                                    </div>

                                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full bg-[#0077C8]/20" />
                                                        <div className="text-[10px] font-black text-subtext uppercase mb-2 flex items-center gap-2 opacity-60">
                                                            <Image size={12} /> Visual Direction
                                                        </div>
                                                        <p className="text-xs text-heading italic font-medium leading-relaxed">"{r.suggestedImage || 'No specific visual suggestion.'}"</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Copy & Product Suggestions */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="content-card max-h-[500px] overflow-y-auto custom-scrollbar">
                                    <h3 className="font-black text-heading mb-6 flex items-center gap-2 uppercase tracking-widest text-sm">
                                        <Edit2 size={20} className="text-[#0077C8]" />
                                        Copy Enhancement ideas
                                    </h3>
                                    <div className="space-y-4">
                                        {displayedCreativeResults.filter(r => r.copyEdit && r.copyEdit !== "None").map((r, i) => (
                                            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-[#0077C8]" />
                                                <div className="text-[10px] font-black text-[#0077C8] mb-2 uppercase tracking-widest">{r.personaName}</div>
                                                <p className="text-xs text-heading font-medium leading-relaxed italic">"{r.copyEdit}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="content-card max-h-[500px] overflow-y-auto custom-scrollbar">
                                    <h3 className="font-bold text-heading mb-4 flex items-center gap-2">
                                        <ShoppingBag size={18} className="text-[#0077C8]" />
                                        Product Alternatives
                                    </h3>
                                    <div className="space-y-3">
                                        {displayedCreativeResults.filter(r => r.suggestedProduct && r.suggestedProduct !== "None").slice(0, 20).map((r, i) => (
                                            <div key={i} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                                <span className="text-sm text-subtext font-bold">{r.personaName}</span>
                                                <span className="text-sm font-black text-[#0077C8]">{r.suggestedProduct}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Existing Verbatim Feedback - moved down */}
                            <div className="content-card max-h-[400px] overflow-y-auto custom-scrollbar">
                                <h3 className="font-bold text-heading mb-4 uppercase tracking-widest text-xs">Verbatim Feedback</h3>
                                <div className="space-y-3">
                                    {displayedCreativeResults.map((r, i) => (
                                        <div key={i} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex justify-between text-[10px] font-black text-subtext mb-2 uppercase tracking-widest">
                                                <span>{r.personaName}</span>
                                                <span className={r.sentiment === 'Positive' ? 'text-green-600' : r.sentiment === 'Negative' ? 'text-red-600' : 'text-subtext'}>{r.sentiment}</span>
                                            </div>
                                            <p className="text-sm text-heading leading-relaxed italic">"{r.feedback}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'AB_TEST' && (
                        <div className="space-y-6">
                            <div className="content-card flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-black text-heading">Campaign Strategic A/B Testing</h3>
                                    <p className="text-sm text-subtext">Generate strategic variants & simulate multi-variant testing on {syntheticUsers.length} synthetic users.</p>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleLoadLast('AB_TEST_SIMULATION')}
                                        disabled={isABTestingLoading}
                                        className="btn-secondary flex items-center gap-2"
                                        title="Load Last Run"
                                    >
                                        <History size={18} />
                                    </button>
                                    <button
                                        onClick={handleRunABTestSim}
                                        disabled={isABTestingLoading || syntheticUsers.length === 0}
                                        title={syntheticUsers.length === 0 ? "You must generate users in the Synthetic Users tab first." : ""}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {isABTestingLoading ? <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full" /> : <Play size={20} />}
                                        Run Simulation
                                    </button>
                                </div>
                            </div>

                            {/* Show Variants if any */}
                            {regionalVariants.length > 0 && (
                                <div className="content-card">
                                    <h3 className="font-black text-heading mb-6 flex items-center gap-2 uppercase tracking-widest text-sm">
                                        <Image size={20} className="text-[#0077C8]" />
                                        Regional Variants Generated
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {regionalVariants.map((v, i) => (
                                            <div key={i} className="flex flex-col items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                                                {v.image ? (
                                                    <img src={v.image} alt={v.region} className="w-full aspect-square object-cover rounded-lg mb-2" />
                                                ) : (
                                                    <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                                                        <Image className="text-gray-400" />
                                                    </div>
                                                )}
                                                <span className="text-xs font-black text-heading text-center">{v.region}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Show Results if any */}
                            {abTestResults.length > 0 && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Stats Column */}
                                    <div className="content-card">
                                        <h3 className="font-black text-heading mb-4 uppercase tracking-widest text-sm">Variant Performance (Avg Score)</h3>
                                        <div className="space-y-3">
                                            {/* Calculate Average Scores */}
                                            {(() => {
                                                const scores: Record<string, { total: number, count: number }> = {};
                                                abTestResults.forEach(r => {
                                                    r.rankings?.forEach(rank => {
                                                        if (!scores[rank.variantName]) scores[rank.variantName] = { total: 0, count: 0 };
                                                        scores[rank.variantName].total += rank.score;
                                                        scores[rank.variantName].count += 1;
                                                    });
                                                });
                                                const sortedScores = Object.entries(scores).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count));

                                                if (sortedScores.length === 0) {
                                                    return <div className="text-sm text-subtext">No ranking data available for this run.</div>;
                                                }

                                                return sortedScores.map(([variant, data]) => {
                                                    const avg = (data.total / data.count).toFixed(1);
                                                    return (
                                                        <div key={variant} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                            <span className="font-bold text-sm text-heading">{variant}</span>
                                                            <span className="font-black text-[#0077C8]">{avg} / 10</span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    {/* Feedback Column */}
                                    <div className="lg:col-span-2 content-card max-h-[600px] overflow-y-auto custom-scrollbar">
                                        <h3 className="font-black text-heading mb-4 uppercase tracking-widest text-sm">Persona Feedback</h3>
                                        <div className="space-y-4">
                                            {abTestResults.map((r, i) => (
                                                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                                                    <div className={`absolute top-0 left-0 w-1 h-full ${r.sentiment === 'Positive' ? 'bg-green-500' : r.sentiment === 'Negative' ? 'bg-red-500' : 'bg-blue-500'} `} />
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="text-[10px] font-black text-subtext uppercase tracking-widest">{r.personaName}</div>
                                                            <div className="text-sm font-bold text-heading mt-1">Top Choice: <span className="text-[#0077C8]">{r.selectedVariant}</span></div>
                                                        </div>
                                                        <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded ${r.sentiment === 'Positive' ? 'bg-green-100 text-green-700' : r.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>{r.sentiment}</span>
                                                    </div>
                                                    <p className="text-sm text-heading italic font-medium mt-2 mb-4">"{// @ts-ignore
                                                        r.overallFeedback || r.rationale || 'No feedback'}"</p>

                                                    {r.rankings && r.rankings.length > 0 && (
                                                        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                                                            <div className="text-[10px] font-black text-subtext uppercase tracking-widest mb-2">Variant Rankings</div>
                                                            {r.rankings.map((rank, idx) => (
                                                                <div key={idx} className="flex flex-col gap-1 bg-white p-3 rounded-lg border border-gray-100">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <span className="font-bold text-sm text-heading">{rank.variantName}</span>
                                                                        <span className="font-black text-[#0077C8]">{rank.score}/10</span>
                                                                    </div>
                                                                    <p className="text-xs text-subtext leading-relaxed">"{rank.rationale}"</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Footer */}
            {status && (
                <div className="fixed bottom-6 right-6 bg-white text-heading px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-5 z-50 animate-bounce-in border border-blue-100 backdrop-blur-md">
                    <div className="animate-spin h-5 w-5 border-2 border-[#0077C8] border-t-transparent rounded-full" />
                    <span className="font-black text-[10px] uppercase tracking-widest text-[#0077C8]">{status}</span>
                </div>
            )}

            {/* Add Audience Modal */}
            {isAddAudienceModalOpen && (
                <div className="fixed inset-0 bg-heading/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-gray-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#0077C8]"></div>
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <Users className="text-[#0077C8]" size={28} />
                                <h3 className="text-2xl font-black text-heading">Add New Audience</h3>
                            </div>
                            <button onClick={() => setIsAddAudienceModalOpen(false)} className="text-subtext hover:text-heading transition-colors p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                        </div>

                        <div className="space-y-6 mb-8">
                            <div className="flex flex-col gap-2">
                                <label className="block text-[10px] font-black text-subtext uppercase tracking-widest">Select From Standards</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {standardAudiences.map((std) => (
                                        <button 
                                            key={std.id}
                                            onClick={() => {
                                                setPersonas([...personas, { ...std, isWildcard: false }]);
                                                setIsAddAudienceModalOpen(false);
                                            }}
                                            className="text-left p-3 rounded-2xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center gap-3 group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                                                <img src={std.imageUrl} className="w-full h-full object-cover" alt={std.name} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-heading uppercase truncate w-24">{std.name}</div>
                                                <div className="text-[8px] font-bold text-subtext">{std.demographics.split(',')[0]}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase font-black text-subtext/40">
                                    <span className="bg-white px-2">Or Design Custom</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-subtext uppercase tracking-widest mb-3">Custom Audience Criteria</label>
                                <textarea
                                    className="input-field h-32 text-sm"
                                    placeholder="Describe the audience you want to test..."
                                    value={audienceCriteria}
                                    onChange={e => setAudienceCriteria(e.target.value)}
                                />
                            </div>
                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex gap-4 shadow-sm">
                                <Sparkles className="text-[#0077C8] flex-shrink-0 mt-1" size={20} />
                                <div className="text-xs text-heading font-medium leading-relaxed">
                                    <strong className="text-[#0077C8] block mb-1 uppercase tracking-widest font-black">AI Auto-Generation:</strong>
                                    Gemini will create a full persona profile, including bio, demographics, and a photorealistic avatar based on your criteria.
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => handleAddAudience()}
                                className="flex-1 btn-secondary py-4 text-sm"
                            >
                                Surprise Me
                            </button>
                            <button
                                onClick={() => handleAddAudience(audienceCriteria)}
                                disabled={!audienceCriteria.trim()}
                                className="flex-1 btn-primary py-4 text-sm shadow-xl shadow-blue-500/20"
                            >
                                Generate Audience
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audience Details Modal */}
            {selectedAudience && (
                <div className="fixed inset-0 bg-heading/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#0077C8]"></div>
                        {/* Header */}
                        <div className="bg-white p-8 border-b border-gray-50 flex justify-between items-start">
                            <div className="flex gap-6">
                                <div className="w-24 h-24 rounded-2xl bg-gray-50 overflow-hidden shadow-sm flex-shrink-0 border border-gray-100">
                                    {selectedAudience.imageUrl ? <img src={selectedAudience.imageUrl} className="w-full h-full object-cover" /> : <Users size={40} className="m-auto mt-8 text-subtext" />}
                                </div>
                                <div className="mt-2">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-3xl font-black text-heading">{selectedAudience.name}</h3>
                                        {selectedAudience.isWildcard && <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-red-100">Wildcard</span>}
                                    </div>
                                    <div className="text-subtext font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#0077C8]" />
                                        {selectedAudience.personaName}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAudience(null)} className="text-subtext hover:text-heading transition-all p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                        </div>

                        {/* Content */}
                        <div className="p-10 overflow-y-auto space-y-8 custom-scrollbar">
                            {/* Bio */}
                            <div>
                                <h4 className="text-[10px] font-black text-subtext uppercase tracking-widest mb-3">Bio & Lifestyle Persona</h4>
                                <p className="text-heading text-lg leading-relaxed font-black/10 font-medium italic">"{selectedAudience.bio || selectedAudience.details?.bio}"</p>
                            </div>

                            {/* Demographics */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-[10px] font-black text-subtext uppercase tracking-widest mb-3">Audience Demographics</h4>
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 font-bold text-heading text-sm shadow-sm">
                                        {selectedAudience.demographics || selectedAudience.details?.income || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-subtext uppercase tracking-widest mb-3">Interest Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAudience.details?.lifestyle_tags?.map((tag: string, i: number) => (
                                            <span key={i} className="px-4 py-1.5 bg-blue-50 text-[#0077C8] rounded-xl text-xs font-black border border-blue-100 shadow-sm">{tag}</span>
                                        )) || <span className="text-subtext italic">No specific tags identified.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setSelectedAudience(null)}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Details Modal */}
            {selectedCartResult && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] border border-gray-100">
                        <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                                    <ShoppingCart size={18} className="text-[#0077C8]" />
                                    {selectedCartResult.personaName}'s Cart
                                </h3>
                                <p className="text-xs text-gray-500">Purchased Fragrance & Care Items</p>
                            </div>
                            <button onClick={() => setSelectedCartResult(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50"><X size={18} /></button>
                        </div>

                        <div className="p-5 overflow-y-auto flex-1 space-y-3">
                            {selectedCartResult.cart.filter(c => c.purchased).length > 0 ? (
                                selectedCartResult.cart.filter(c => c.purchased).map((item, i) => (
                                    <div key={i} className="flex gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                                        <div className="bg-white p-2 rounded-lg h-fit border border-blue-100 shadow-2xs">
                                            <ShoppingCart size={16} className="text-[#0077C8]" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900 text-sm">{item.productName}</div>
                                            <div className="text-[#0077C8] text-xs mt-1 font-medium">"{item.reason}"</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 italic text-sm">
                                    No items purchased in this simulation.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Products Modal */}
            {showProducts && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] border border-gray-100">
                        <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-xl">
                                    <ShoppingCart size={22} className="text-[#0077C8]" />
                                    Target Products ({simulationProducts.length})
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Fragrance and body care catalog items available for simulation.</p>
                            </div>
                            <button onClick={() => setShowProducts(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50"><X size={20} /></button>
                        </div>

                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Add New Product</label>
                            <div className="flex gap-2">
                                <input
                                    value={newProduct}
                                    onChange={e => setNewProduct(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newProduct.trim()) {
                                            setSimulationProducts([...simulationProducts, newProduct.trim()]);
                                            setNewProduct("");
                                        }
                                    }}
                                    placeholder="e.g. Champagne Toast 3-Wick Candle or Gingham Fine Fragrance Mist"
                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#0077C8] transition-colors text-sm shadow-2xs"
                                />
                                <button
                                    onClick={() => {
                                        if (newProduct.trim()) {
                                            setSimulationProducts([...simulationProducts, newProduct.trim()]);
                                            setNewProduct("");
                                        }
                                    }}
                                    disabled={!newProduct.trim()}
                                    className="btn-primary flex items-center gap-2 justify-center px-6 py-3"
                                >
                                    <Plus size={18} /> Add
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {simulationProducts.map((p, i) => (
                                    <div key={i} className="group flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-white transition-all shadow-2xs">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-[#0077C8] shrink-0">
                                            <ShoppingCart size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="text-xs font-bold text-gray-900 truncate" title={p}>{p.split(':')[0]}</div>
                                        </div>
                                        <button
                                            onClick={() => setSimulationProducts(simulationProducts.filter((_, idx) => idx !== i))}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                            title="Remove Product"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Interview Modal */}
            {interviewPersona && brief && (
                <SyntheticInterview
                    persona={interviewPersona.persona}
                    simulationResult={interviewPersona.result}
                    brief={brief}
                    onClose={() => setInterviewPersona(null)}
                />
            )}
        </div>
    );
};
