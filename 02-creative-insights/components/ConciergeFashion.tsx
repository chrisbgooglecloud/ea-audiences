import React, { useState, useEffect } from 'react';
import { PhoneCall, User, Sparkles, Database, PhoneOff, Activity, Globe, Smartphone, Mail, FileText, Download, Volume2, CheckCircle2, XCircle, History, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateAgentSummary, generateDashboardFromProfile } from '../services/geminiService';
import { useAppConfig } from '../context/AppConfigContext';
import { brandConfig } from '../config';

export const ConciergeFashion: React.FC = () => {
    const { config } = useAppConfig();
    const [isGenerating, setIsGenerating] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [showRawData, setShowRawData] = useState(false);
    const [rawCustomerData, setRawCustomerData] = useState<any>(null);
    const [availableProducts, setAvailableProducts] = useState<any[]>([]);
    const [savedProfileName, setSavedProfileName] = useState<string>("Vanessa Miller");
    
    useEffect(() => {
        const loadSavedProfile = async () => {
            try {
                const res = await fetch('/api/load-run/concierge_fashion');
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile && data.profile.name) {
                        setSavedProfileName(data.profile.name);
                    }
                }
            } catch (e) {
                console.warn("Failed to load saved profile name", e);
            }
        };
        loadSavedProfile();
    }, []);
    
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const res = await fetch('/data/configuration/concierge_fashion_products.json');
                if (res.ok) setAvailableProducts(await res.json());
            } catch (e) {
                console.warn("Failed to load concierge products", e);
            }
        };
        loadProducts();
    }, []);
    
    // Audio Generation State
    const [isGeneratingAudioEn, setIsGeneratingAudioEn] = useState(false);
    const [audioUrlEn, setAudioUrlEn] = useState<string | null>(null);
    const [isGeneratingAudioZh, setIsGeneratingAudioZh] = useState(false);
    const [audioUrlZh, setAudioUrlZh] = useState<string | null>(null);

    const handleGenerateAudio = async (lang: 'english' | 'mandarin') => {
        const setGenerating = lang === 'english' ? setIsGeneratingAudioEn : setIsGeneratingAudioZh;
        const setAudio = lang === 'english' ? setAudioUrlEn : setAudioUrlZh;
        
        setGenerating(true);
        setAudio(null);
        try {
            const res = await fetch('/api/generate-audio-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    textData: JSON.stringify(dashboardData),
                    voiceName: lang === 'mandarin' ? 'Aoede' : 'Zephyr', 
                    language: lang 
                })
            });
            if (res.ok) {
                const data = await res.json();
                setAudio(data.audioUrl);
            } else {
                alert("Failed to generate audio summary.");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to audio generation service.");
        } finally {
            setGenerating(false);
        }
    };

    const fetchCustomerData = async () => {
        const response = await fetch('/data/customer_data.json');
        if (!response.ok) throw new Error("Failed to load customer_data.json");
        const textData = await response.text();
        try {
            setRawCustomerData(JSON.parse(textData));
        } catch (e) { /* ignore */ }
        return textData;
    };

    const handleAcceptCall = async () => {
        setIsGenerating(true);
        try {
            // Check for saved run
            const res = await fetch('/api/load-run/concierge_fashion');
            let savedData = null;
            if (res.ok) {
                savedData = await res.json();
            }

            let insights;
            if (savedData && savedData.profile) {
                console.log("Using saved profile for generation");
                const generatedData = await generateDashboardFromProfile(savedData.profile, 'Fashion', availableProducts);
                
                // Merge: keep profile from saved data, update generated fields, explicitly preserve profile
                insights = {
                    ...savedData,
                    ...generatedData,
                    profile: savedData.profile // Ensure profile is not overwritten
                };
            } else {
                console.log("No saved profile found, generating from scratch");
                const textData = await fetchCustomerData();
                insights = await generateAgentSummary(textData, 'Fashion', availableProducts);
            }

            setDashboardData(insights);
            setAudioUrlEn(null);
            setAudioUrlZh(null);
            
            await fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureId: 'concierge_fashion', data: insights })
            });
        } catch (e) {
            console.error(e);
            alert("Failed to analyze customer data.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLoadLast = async () => {
        setIsGenerating(true);
        try {
            await fetchCustomerData();
            const res = await fetch('/api/load-run/concierge_fashion');
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
            } else {
                alert("No previous analysis found.");
            }
        } catch (e) {
            console.error(e);
            alert("Error loading last run.");
        } finally {
            setIsGenerating(false);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'email': return <Mail size={16} className="text-white" />;
            case 'app': return <Smartphone size={16} className="text-white" />;
            case 'web': return <Globe size={16} className="text-white" />;
            default: return <Activity size={16} className="text-white" />;
        }
    };

    const primaryColor = config?.branding.colors.primary || '#020f1d';
    const isDark = primaryColor !== '#FFFFFF' && primaryColor !== '#fff';
    
    const bgClass = isDark ? 'bg-[#020f1d] text-white' : 'bg-gray-50 text-gray-900';
    const cardBgClass = isDark ? 'bg-[#041E3A] border-[#1e3a5f]' : 'bg-white border-gray-200';
    const textClass = isDark ? 'text-white' : 'text-gray-900';
    const subtextClass = isDark ? 'text-gray-400' : 'text-gray-500';
    const accentColor = config?.branding.colors.accent || '#C5A059';

    if (!dashboardData) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[70vh] text-center p-8 rounded-3xl border ${bgClass} ${isDark ? 'border-[#1e3a5f]' : 'border-gray-200'}`}>
                {isGenerating ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-24 h-24 border-4 rounded-full animate-spin mb-8" style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}></div>
                        <h2 className={`text-2xl font-bold mb-2 font-serif ${textClass}`}>Analyzing Style DNA...</h2>
                        <p className={`${subtextClass} font-medium`}>Gemini is structuring real-time fashion insights...</p>
                    </div>
                ) : (
                    <>
                        <div className="relative animate-bounce mb-8">
                            <div className="absolute inset-0 opacity-20 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: accentColor }}></div>
                            <div className={`p-6 rounded-full shadow-2xl relative z-10 cursor-pointer border ${isDark ? 'bg-[#041E3A]' : 'bg-white'}`} style={{ borderColor: accentColor }} onClick={handleAcceptCall}>
                                <PhoneCall size={64} style={{ color: accentColor }} />
                            </div>
                        </div>
                        <h1 className={`text-4xl font-bold mb-4 font-serif tracking-tight ${textClass}`}>Incoming Priority Call</h1>
                        <p className={`text-xl mb-8 max-w-lg ${subtextClass}`}>
                            Welcome agent, you are receiving a routed call from <strong className={textClass}>{savedProfileName}</strong>.
                        </p>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleAcceptCall}
                                className={`px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg flex items-center gap-3 border ${isDark ? 'bg-[#041E3A] hover:bg-[#C5A059] hover:text-[#020f1d]' : 'bg-white hover:bg-gray-50'}`}
                                style={{ borderColor: accentColor, color: isDark ? accentColor : '#020f1d' }}
                            >
                                <PhoneCall size={24} />
                                Accept & Generate Profile
                            </button>
                            <button
                                onClick={handleLoadLast}
                                className={`bg-transparent border-2 px-6 py-4 rounded-full font-bold shadow-sm hover:bg-gray-800 transition-all text-lg flex items-center gap-2 ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                title="Load Last Analysis"
                            >
                                <History size={20} />
                                Load Last
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={`max-w-7xl mx-auto px-4 py-8 relative rounded-3xl border ${bgClass} ${isDark ? 'border-[#1e3a5f]' : 'border-gray-200'}`}>
            {/* Header / Active Call banner */}
            <div className={`flex justify-between items-center mb-8 p-6 rounded-2xl border ${cardBgClass}`}>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-md" style={{ backgroundColor: accentColor, color: isDark ? '#020f1d' : '#fff' }}>
                        {dashboardData.profile?.initials || "VM"}
                    </div>
                    <div>
                        <h2 className={`text-2xl font-bold flex items-center gap-2 font-serif ${textClass}`}>
                            {dashboardData.profile?.name || "Vanessa Miller"}
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-900 text-green-400 rounded-full font-bold ml-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> Active Call
                            </span>
                        </h2>
                        <p className={`${subtextClass} font-medium`}>{dashboardData.profile?.email} • {dashboardData.profile?.phone}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>Lifetime Spend</p>
                        <p className="text-2xl font-black" style={{ color: accentColor }}>{dashboardData.profile?.totalSaved || "$24,500"}</p>
                    </div>
                    <div className={`w-px h-10 mx-2 ${isDark ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}></div>
                    <div className="text-right mr-4">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: isDark ? '#6B7280' : '#9CA3AF' }}>Annual Spend</p>
                        <p className={`text-xl font-bold ${textClass}`}>{dashboardData.profile?.income || "$8,500/yr"}</p>
                    </div>

                    <div className={`flex items-center gap-2 p-1 rounded-full border ml-4 ${isDark ? 'bg-[#020f1d] border-[#1e3a5f]' : 'bg-gray-50 border-gray-200'}`}>
                        <button
                            onClick={() => setShowRawData(!showRawData)}
                            className={`p-2.5 rounded-full transition-colors ${showRawData ? 'bg-[#C5A059] text-[#020f1d] shadow-sm' : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                            style={{ backgroundColor: showRawData ? accentColor : '' }}
                            title="View Full Telemetry Data"
                        >
                            <Database size={20} />
                        </button>
                        <div className={`w-px h-6 ${isDark ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}></div>
                        <button
                            onClick={() => {
                                setDashboardData(null);
                                setShowRawData(false);
                            }}
                            className="p-2.5 rounded-full text-red-500 hover:bg-red-900/20 transition-colors"
                            title="End Call / Reset"
                        >
                            <PhoneOff size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {showRawData ? (
                // RAW DATA VIEW
                <div className={`rounded-3xl p-8 border animate-in fade-in slide-in-from-bottom-4 duration-500 ${cardBgClass}`}>
                    <div className={`flex items-center justify-between mb-6 pb-4 border-b ${isDark ? 'border-[#1e3a5f]' : 'border-gray-100'}`}>
                        <h3 className={`text-2xl font-bold flex items-center gap-3 font-serif ${textClass}`}>
                            <Database style={{ color: accentColor }} size={28} /> Full Customer Telemetry Payload
                        </h3>
                    </div>
                    <div className={`rounded-2xl p-4 border shadow-inner overflow-auto max-h-[700px] ${isDark ? 'bg-[#020f1d] border-[#1e3a5f]' : 'bg-gray-50 border-gray-200'}`}>
                        <pre className={`text-sm font-mono leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {JSON.stringify(dashboardData, null, 2)}
                        </pre>
                    </div>
                </div>
            ) : (
                // ANALYST DASHBOARD VIEW
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* AI Executive Summary */}
                        <div className={`rounded-3xl p-8 border relative overflow-hidden ${cardBgClass}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-10" style={{ backgroundColor: accentColor }}></div>
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-4" style={{ color: accentColor }}>
                                <Sparkles size={16} /> AI Executive Summary
                            </h3>
                            <p className={`text-lg leading-relaxed font-medium relative z-10 mb-6 ${textClass}`}>
                                {dashboardData.aiSummary}
                            </p>
                            
                            {/* Audio Generation Tools */}
                            <div className={`relative z-10 flex flex-col md:flex-row gap-4 border-t pt-4 mt-4 ${isDark ? 'border-[#1e3a5f]' : 'border-gray-100'}`}>
                                <div className={`flex-1 p-4 rounded-2xl border ${isDark ? 'bg-[#020f1d] border-[#1e3a5f]' : 'bg-gray-50 border-gray-200'}`}>
                                    {!audioUrlEn ? (
                                        <button
                                            onClick={() => handleGenerateAudio('english')}
                                            disabled={isGeneratingAudioEn}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-[#041E3A] hover:bg-[#C5A059] hover:text-[#020f1d]' : 'bg-white hover:bg-gray-100'}`}
                                            style={{ borderColor: accentColor, color: isDark ? accentColor : '#020f1d' }}
                                        >
                                            {isGeneratingAudioEn ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: accentColor }}></div>
                                            ) : (
                                                <PhoneCall size={18} />
                                            )}
                                            {isGeneratingAudioEn ? "Generating Audio..." : "Generate Audio (English)"}
                                        </button>
                                    ) : (
                                        <div className="w-full">
                                            <p className="text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2" style={{ color: accentColor }}>
                                                <Sparkles size={12} /> English Overview
                                            </p>
                                            <audio controls src={audioUrlEn} className="w-full h-10" />
                                        </div>
                                    )}
                                </div>
                                <div className={`flex-1 p-4 rounded-2xl border ${isDark ? 'bg-[#020f1d] border-[#1e3a5f]' : 'bg-gray-50 border-gray-200'}`}>
                                    {!audioUrlZh ? (
                                        <button
                                            onClick={() => handleGenerateAudio('mandarin')}
                                            disabled={isGeneratingAudioZh}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-[#041E3A] hover:bg-[#C5A059] hover:text-[#020f1d]' : 'bg-white hover:bg-gray-100'}`}
                                            style={{ borderColor: accentColor, color: isDark ? accentColor : '#020f1d' }}
                                        >
                                            {isGeneratingAudioZh ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent" style={{ borderColor: accentColor }}></div>
                                            ) : (
                                                <PhoneCall size={18} />
                                            )}
                                            {isGeneratingAudioZh ? "Generating Audio..." : "Generate Audio (Mandarin)"}
                                        </button>
                                    ) : (
                                        <div className="w-full">
                                            <p className="text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-2" style={{ color: accentColor }}>
                                                <Sparkles size={12} /> Mandarin Overview
                                            </p>
                                            <audio controls src={audioUrlZh} className="w-full h-10" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Personalized Recommendations */}
                        <div className={`rounded-3xl p-6 border ${cardBgClass}`}>
                            <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 pb-4 border-b font-serif ${textClass} ${isDark ? 'border-[#1e3a5f]' : 'border-gray-100'}`}>
                                <Sparkles style={{ color: accentColor }} size={20} /> Recommendations by Gemini
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {dashboardData.personalizedRecommendations && dashboardData.personalizedRecommendations.map((prod: any, i: number) => (
                                    <div key={i} className={`p-4 rounded-2xl border flex flex-col transition-colors ${isDark ? 'bg-[#020f1d] border-[#1e3a5f] hover:border-[#C5A059]' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
                                        <div className="w-full h-48 bg-gray-800 rounded-xl mb-4 overflow-hidden">
                                            <img src={prod.image || "/images/recommendation_dress.jpg"} alt={prod.name} className="w-full h-full object-contain" />
                                        </div>
                                        <h4 className={`font-bold mb-1 ${textClass}`}>{prod.name}</h4>
                                        <p className={`text-xs mb-2 flex-1 ${subtextClass}`}>{prod.description}</p>
                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="font-black" style={{ color: accentColor }}>${prod.price}</span>
                                            <button className="text-xs font-bold uppercase tracking-widest hover:underline" style={{ color: accentColor }}>Add to Lookbook</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Accounts & Goals Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Recent Purchases */}
                            <div className={`rounded-3xl p-6 border ${cardBgClass}`}>
                                <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 pb-4 border-b font-serif ${textClass} ${isDark ? 'border-[#1e3a5f]' : 'border-gray-100'}`}>
                                    <Globe style={{ color: accentColor }} size={20} /> Wardrobe Additions
                                </h3>
                                <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {dashboardData.recent_purchases && dashboardData.recent_purchases.map((acc: any, i: number) => (
                                        <li key={i} className={`flex flex-col p-4 border rounded-xl transition-all ${isDark ? 'bg-[#020f1d] border-[#1e3a5f] hover:border-[#C5A059]' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`font-bold truncate max-w-[140px] ${textClass}`}>{acc.name}</span>
                                                <span className="font-black" style={{ color: accentColor }}>
                                                    ${Number(acc.price || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className={`flex justify-between items-center text-xs font-semibold uppercase tracking-wide ${subtextClass}`}>
                                                <span>{acc.brand}</span>
                                                <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-[#1e3a5f] text-gray-300' : 'bg-gray-200 text-gray-700'}`}>{acc.type}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Style Goals & Events */}
                            <div className={`rounded-3xl p-6 border ${cardBgClass}`}>
                                <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 pb-4 border-b font-serif ${textClass} ${isDark ? 'border-[#1e3a5f]' : 'border-gray-100'}`}>
                                    <Target style={{ color: accentColor }} size={20} /> Fashion Goals
                                </h3>
                                <div className="space-y-6">
                                    {dashboardData.upcoming_events && dashboardData.upcoming_events.map((goal: any, i: number) => (
                                        <div key={i} className="relative">
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <span className={`font-bold block ${textClass}`}>{goal.event_name}</span>
                                                    <span className="text-xs font-bold uppercase tracking-wide text-green-400">
                                                        {goal.target_date || "Upcoming"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`w-full rounded-lg p-3 text-sm border mt-1 ${isDark ? 'bg-[#020f1d] border-[#1e3a5f] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                                {goal.notes}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Next Best Actions */}
                        <div className={`rounded-3xl p-8 border ${cardBgClass}`}>
                            <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 font-serif ${textClass}`}>
                                <CheckCircle2 className="text-green-400" size={24} /> Recommended Next Best Actions
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {dashboardData.nextActions && dashboardData.nextActions.map((action: any, i: number) => (
                                    <div key={i} className={`flex gap-4 p-5 rounded-2xl border transition-all group ${isDark ? 'bg-[#020f1d] border-[#1e3a5f] hover:border-[#C5A059]' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${isDark ? 'bg-[#041E3A] border-[#1e3a5f]' : 'bg-white border-gray-200'}`} style={{ color: accentColor }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className={`font-bold text-lg mb-1 transition-colors group-hover:${textClass}`} style={{ color: isDark ? '' : accentColor }}>{action.title}</h4>
                                            <p className={`text-sm leading-relaxed ${subtextClass}`}>{action.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Engagement Chart */}
                        {dashboardData.engagementChart && (
                            <div className={`rounded-3xl p-6 border ${cardBgClass}`}>
                                <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 pb-4 border-b font-serif ${textClass} ${isDark ? 'border-[#1e3a5f]' : 'border-gray-100'}`}>
                                    <Activity style={{ color: accentColor }} size={20} /> {dashboardData.engagementChart.title}
                                </h3>
                                <div className="h-56 w-full mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dashboardData.engagementChart.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#6B7280', fontWeight: 'bold' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#6B7280' : '#9CA3AF' }} />
                                            <Tooltip cursor={{ fill: isDark ? '#020f1d' : '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: `1px solid ${isDark ? '#1e3a5f' : '#e5e7eb'}`, background: isDark ? '#041E3A' : '#fff', color: isDark ? '#fff' : '#000' }} />
                                            <Bar dataKey="visits" radius={[6, 6, 6, 6]} barSize={32}>
                                                {dashboardData.engagementChart.data.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? accentColor : isDark ? '#1e3a5f' : '#e5e7eb'} stroke={isDark ? '#1e3a5f' : '#e5e7eb'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Activity Timeline */}
                        <div className={`rounded-3xl p-6 border sticky top-24 ${cardBgClass}`}>
                            <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 pb-4 border-b font-serif ${textClass} ${isDark ? 'border-[#1e3a5f]' : 'border-gray-100'}`}>
                                <Activity style={{ color: accentColor }} size={20} /> Telemetry & Signals
                            </h3>
                            <div className={`relative pl-6 border-l-2 space-y-8 mt-4 ml-2 ${isDark ? 'border-[#1e3a5f]' : 'border-gray-100'}`}>
                                {dashboardData.marketingActivity && dashboardData.marketingActivity.map((activity: any, i: number) => (
                                    <div key={i} className="relative">
                                        <div className={`absolute -left-[37px] top-0 w-8 h-8 rounded-full border-4 shadow-sm flex items-center justify-center ${isDark ? 'border-[#041E3A]' : 'border-white'}
                                            ${activity.type === 'Email' ? 'bg-purple-500' : activity.type === 'App' ? 'bg-green-500' : activity.type === 'Web' ? 'bg-[#0077C8]' : 'bg-orange-500'}`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <h4 className={`font-bold ${textClass}`}>{activity.event}</h4>
                                        <p className={`text-xs mt-1 uppercase font-bold tracking-wider ${subtextClass}`}>{activity.time || "Recent"}</p>
                                        <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{activity.details}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ConciergeFashion;
