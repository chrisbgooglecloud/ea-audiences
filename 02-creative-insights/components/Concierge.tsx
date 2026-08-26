import React, { useState } from 'react';
import { generateAgentSummary } from '../services/geminiService';
import ChatWidget from './chatbot/ChatWidget';
import { useAppConfig } from '../context/AppConfigContext';
import { brandConfig } from '../config';
import { useCompanyContext } from '../context/CompanyContext';
import {
    PhoneCall,
    User,
    Briefcase,
    TrendingUp,
    CheckCircle,
    Activity,
    PhoneOff,
    Sparkles,
    PieChart,
    RefreshCw,
    History,
    Database,
    Code,
    BarChart as BarChartIcon,
    Landmark,
    Target,
    Mail,
    Smartphone,
    Globe
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';



export const Concierge: React.FC<ConciergeProps> = () => {
    const { config } = useAppConfig();
    const { name, description } = useCompanyContext();
    const accentColor = config?.branding.colors.accent || '#0077C8';

    const [isGenerating, setIsGenerating] = useState(false);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [rawCustomerData, setRawCustomerData] = useState<any>(null);
    const [showRawData, setShowRawData] = useState(false);
    
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
                
                setDashboardData((prevData: any) => {
                    if (!prevData) return prevData;
                    const newData = { ...prevData };
                    if (lang === 'english') newData.audioUrlEn = data.audioUrl;
                    if (lang === 'mandarin') newData.audioUrlZh = data.audioUrl;
                    
                    fetch('/api/save-run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ featureId: 'concierge', data: newData })
                    }).catch((err: any) => console.error("Failed to save audio run", err));
                    
                    return newData;
                });
            } else {
                console.error("Failed to generate audio summary");
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
        } catch (e) { /* might not be JSON */ }
        return textData;
    };

    const handleAcceptCall = async () => {
        setIsGenerating(true);
        try {
            const textData = await fetchCustomerData();
            const insights = await generateAgentSummary(textData, name, description);
            setDashboardData(insights);
            setAudioUrlEn(null);
            setAudioUrlZh(null);
            
            await fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureId: 'concierge', data: insights })
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
            const res = await fetch('/api/load-run/concierge');
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
                if (data.audioUrlEn) setAudioUrlEn(data.audioUrlEn);
                else setAudioUrlEn(null);
                
                if (data.audioUrlZh) setAudioUrlZh(data.audioUrlZh);
                else setAudioUrlZh(null);
            } else {
                alert("No previous analysis found.");
            }
        } catch (e) {
            console.error(e);
            alert("Error loading last tracking run.");
        } finally {
            setIsGenerating(false);
        }
    };

    const SyntaxHighlightedJson = ({ data }: { data: any }) => {
        if (!data) return null;
        const jsonString = JSON.stringify(data, null, 2);
        const highlighted = jsonString
            .replace(/"(.*?)":/g, '<span class="text-purple-600 font-bold">"$1"</span>:')
            .replace(/:\s"(.*?)"/g, ': <span class="text-green-700">"$1"</span>')
            .replace(/:\s(-?\d+\.?\d*)/g, ': <span class="text-blue-600">$1</span>')
            .replace(/:\s(true|false|null)/g, ': <span class="text-pink-600">$1</span>');

        return (
            <pre
                className="bg-white text-gray-800 p-8 rounded-3xl overflow-auto text-sm shadow-inner font-mono leading-relaxed max-h-[700px] border border-gray-200"
                dangerouslySetInnerHTML={{ __html: highlighted }}
            />
        );
    };

    const getActivityIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'email': return <Mail size={16} className="text-white" />;
            case 'app': return <Smartphone size={16} className="text-white" />;
            case 'web': return <Globe size={16} className="text-white" />;
            default: return <Activity size={16} className="text-white" />;
        }
    };

    if (!dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
                {isGenerating ? (
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-24 h-24 border-4 border-[#0077C8]/30 border-t-[#0077C8] rounded-full animate-spin mb-8"></div>
                        <h2 className="text-2xl font-bold text-heading mb-2">Analyzing Customer History...</h2>
                        <p className="text-subtext font-medium">Gemini is structuring real-time commerce insights...</p>
                    </div>
                ) : (
                    <>
                        <div className="relative animate-bounce mb-8">
                            <div style={{ backgroundColor: accentColor }} className="absolute inset-0 opacity-20 rounded-full blur-2xl animate-pulse"></div>
                            <div style={{ backgroundColor: accentColor }} className="text-white p-6 rounded-full shadow-2xl relative z-10 cursor-pointer transition-colors" onClick={handleAcceptCall}>
                                <PhoneCall size={64} />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-heading mb-4 tracking-tight">Priority Customer Query</h1>
                        <p className="text-xl text-subtext mb-8 max-w-lg">
                            Welcome agent, you are receiving a query from <strong className="text-heading">David Miller</strong>.
                        </p>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleAcceptCall}
                                style={{ backgroundColor: accentColor }}
                                className="px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg flex items-center gap-3 text-white"
                            >
                                <PhoneCall size={24} />
                                Accept & Analyze
                            </button>
                            <button
                                onClick={handleLoadLast}
                                className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-4 rounded-full font-bold shadow-sm hover:bg-gray-50 transition-all text-lg flex items-center gap-2"
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
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
            {/* Header / Active Call banner */}
            <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-6">
                    <div style={{ backgroundColor: accentColor }} className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                        {dashboardData.profile?.initials || "SJ"}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-heading flex items-center gap-2">
                            {dashboardData.profile?.name || "David Miller"}
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold ml-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Active Call
                            </span>
                        </h2>
                        <p className="text-subtext font-medium">{dashboardData.profile?.email} • {dashboardData.profile?.phone}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-center">

                    <div className="text-right mr-4">
                        <p class="text-xs font-bold text-subtext uppercase tracking-widest mb-1">Yearly Income</p>
                        <p className="text-xl font-bold text-heading">{dashboardData.profile?.income || "$3,200/yr"}</p>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full border border-gray-200 ml-4">
                        <button
                            onClick={() => setShowRawData(!showRawData)}
                            className={`p-2.5 rounded-full transition-colors ${showRawData ? 'bg-white text-[#0077C8] shadow-sm' : 'text-subtext hover:text-heading hover:bg-gray-100'}`}
                            title="View Full Telemetry Data"
                        >
                            <Database size={20} />
                        </button>
                        <div className="w-px bg-gray-200 h-6"></div>
                        <button
                            onClick={() => {
                                setDashboardData(null);
                                setShowRawData(false);
                            }}
                            className="p-2.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                            title="End Call / Reset"
                        >
                            <PhoneOff size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {showRawData ? (
                // RAW DATA VIEW
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <h3 className="text-2xl font-bold text-heading flex items-center gap-3">
                            <Code style={{ color: accentColor }} size={28} /> Full Customer Telemetry Payload
                        </h3>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-inner">
                        {rawCustomerData ? (
                            <SyntaxHighlightedJson data={rawCustomerData} />
                        ) : (
                            <div className="p-8 text-center text-subtext font-medium">
                                <Database style={{ color: accentColor }} className="mx-auto mb-4 opacity-50" size={32} />
                                Raw JSON schema unavailable.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // ANALYST DASHBOARD VIEW
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* AI Executive Summary */}
                        <div className="bg-gradient-to-br from-[#0077C8]/5 to-transparent rounded-3xl p-8 shadow-sm border border-blue-100 relative overflow-hidden bg-white">
                            
                            <h3 style={{ color: accentColor }} className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                                <Sparkles size={16} /> AI Executive Summary
                            </h3>
                            <p className="text-heading text-lg leading-relaxed font-medium relative z-10 mb-6">
                                {dashboardData.aiSummary}
                            </p>
                            
                            {/* Audio Generation Tools */}
                            <div className="relative z-10 flex flex-col md:flex-row gap-4 border-t border-gray-100 pt-4 mt-4">
                                <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-200">
                                    {!audioUrlEn ? (
                                        <button
                                            onClick={() => handleGenerateAudio('english')}
                                            disabled={isGeneratingAudioEn}
                                            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-[#0077C8] px-4 py-3 rounded-xl border border-gray-200 hover:border-[#0077C8] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGeneratingAudioEn ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0077C8] border-t-transparent"></div>
                                            ) : (
                                                <PhoneCall size={18} />
                                            )}
                                            {isGeneratingAudioEn ? "Generating Audio..." : "Generate Audio (English)"}
                                        </button>
                                    ) : (
                                        <div className="w-full">
                                            <p className="text-xs text-[#0077C8] font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <Sparkles size={12} /> English Overview
                                            </p>
                                            <audio controls src={audioUrlEn} className="w-full h-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-200">
                                    {!audioUrlZh ? (
                                        <button
                                            onClick={() => handleGenerateAudio('mandarin')}
                                            disabled={isGeneratingAudioZh}
                                            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-[#0077C8] px-4 py-3 rounded-xl border border-gray-200 hover:border-[#0077C8] transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGeneratingAudioZh ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0077C8] border-t-transparent"></div>
                                            ) : (
                                                <PhoneCall size={18} />
                                            )}
                                            {isGeneratingAudioZh ? "Generating Audio..." : "Generate Audio (Mandarin)"}
                                        </button>
                                    ) : (
                                        <div className="w-full">
                                            <p className="text-xs text-[#0077C8] font-bold mb-2 uppercase tracking-wider flex items-center gap-2">
                                                <Sparkles size={12} /> Mandarin Overview
                                            </p>
                                            <audio controls src={audioUrlZh} className="w-full h-10" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Accounts & Goals Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Accounts List */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-heading flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                                    <Landmark className="text-[#0077C8]" size={20} /> Recent Purchases
                                </h3>
                                <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {dashboardData.recent_purchases && dashboardData.recent_purchases.map((acc: any, i: number) => (
                                        <li key={i} className="flex flex-col p-4 bg-gray-50 hover:bg-white hover:shadow-md hover:border-[#0077C8] border border-gray-100 rounded-xl transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-heading truncate max-w-[140px]">{acc.name}</span>
                                                <span className="font-black text-[#0077C8]">
                                                    ${Number(acc.price || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-subtext uppercase tracking-wide">
                                                <span>{acc.brand}</span>
                                                <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700">{acc.type}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Style Goals & Events */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-heading flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                                    <Target className="text-purple-500" size={20} /> Customer Interests & Scaling
                                </h3>
                                <div className="space-y-6">
                                    {dashboardData.upcoming_events && dashboardData.upcoming_events.map((goal: any, i: number) => {
                                        return (
                                            <div key={i} className="relative">
                                                <div className="flex justify-between items-end mb-2">
                                                    <div>
                                                        <span className="font-bold text-heading block">{goal.event_name}</span>
                                                        <span className={`text-xs font-bold uppercase tracking-wide text-green-600`}>
                                                            {goal.target_date || "Upcoming"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-50 rounded-lg p-3 text-sm text-subtext border border-gray-100 mt-1">
                                                    {goal.notes}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Recommendations Workspace */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-heading flex items-center gap-2 mb-6">
                                <CheckCircle className="text-green-600" size={24} /> Recommended Next Best Actions
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {dashboardData.nextActions && dashboardData.nextActions.map((action: any, i: number) => (
                                    <div key={i} className="flex gap-4 p-5 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-[#0077C8]/50 hover:shadow-sm transition-all group">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[#0077C8] font-bold shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-heading text-lg mb-1 group-hover:text-[#0077C8] transition-colors">{action.title}</h4>
                                            <p className="text-subtext text-sm leading-relaxed">{action.description}</p>
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
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-bold text-heading flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                                    <BarChartIcon className="text-green-500" size={20} /> {dashboardData.engagementChart.title}
                                </h3>
                                <div className="h-56 w-full mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dashboardData.engagementChart.data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 'bold' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', background: '#fff' }} />
                                            <Bar dataKey="visits" radius={[6, 6, 6, 6]} barSize={32}>
                                                {dashboardData.engagementChart.data.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0077C8' : index === 1 ? '#10B981' : '#F59E0B'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Activity Timeline */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 sticky top-24">
                            <h3 className="text-lg font-bold text-heading flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                                <Activity className="text-orange-500" size={20} /> Telemetry & Signals
                            </h3>
                            <div className="relative pl-6 border-l-2 border-gray-100 space-y-8 mt-4 ml-2">
                                {dashboardData.marketingActivity && dashboardData.marketingActivity.map((activity: any, i: number) => (
                                    <div key={i} className="relative">
                                        <div className={`absolute -left-[37px] top-0 w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                                            ${activity.type === 'Email' ? 'bg-purple-500' : activity.type === 'App' ? 'bg-green-500' : activity.type === 'Web' ? 'bg-[#0077C8]' : 'bg-orange-500'}`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <h4 className="font-bold text-heading">{activity.event}</h4>
                                        <p className="text-xs text-subtext mt-1 uppercase font-bold tracking-wider">{activity.time || "Recent"}</p>
                                        <p className="text-sm text-gray-600 mt-2">{activity.details}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Live Gemini Chat Bot */}
            <ChatWidget customerContextData={dashboardData} />
        </div>
    );
};
