import React from 'react';
import { AppMode } from '../types';
import { brandConfig } from '../config';
import { 
  BarChart3, 
  Users, 
  Target, 
  MessageSquare, 
  CheckCircle2, 
  FileText, 
  Zap, 
  Search,
  ArrowRight,
  Eye,
  UserPlus,
  Layers,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useCompanyContext } from '../context/CompanyContext';
import { useAppConfig } from '../context/AppConfigContext';
import { Settings, HelpCircle, Home as HomeIcon, Shield, Bot } from 'lucide-react';

const FallbackIconMap: Record<string, any> = {
  Home: HomeIcon,
  Users: Users,
  UserPlus: UserPlus,
  FileText: FileText,
  Layers: Layers,
  MessageSquare: MessageSquare,
  Eye: Eye,
  Settings: Settings,
  Search: Search,
  Sparkles: Sparkles,
  HelpCircle: HelpCircle,
  TrendingUp: TrendingUp,
  Shield: Shield,
  Bot: Bot
};

const FallbackDescriptionMap: Record<string, string> = {
  HOME: "Back to dashboard",
  INSIGHTS: "Analyze live broadcast performance and viral gaming community trends.",
  CONTENT_HUB: "Generate multi-channel campaigns, box art, and personalized creative experiences.",
  AGENT_PLAYGROUND: "Interactive multi-agent orchestration console, live execution graph, and artifact inspector.",
  AUDIENCE_GEN: "Segment players and generate deep synthetic gamer personas.",
  SYNTHETIC_USERS: "Build and interact with a database of synthetic players.",
  MARKETING_BRIEF: "Generate multi-channel strategies and creative assets.",
  PDP_HUB: "Personalize product content and lifestyle imagery.",
  SYNTHETIC_FOCUS_GROUP: "Simulate real-time feedback from target segments.",
  CONTENT_AUDIT: "Audit marketing assets against brand guidelines.",
  ADMIN: "Change branding, navigation, and data tables on the fly.",
};

interface HomeProps {
    setMode: (mode: AppMode) => void;
    startupCheck?: any;
}

export const Home: React.FC<HomeProps> = ({ setMode, startupCheck: initialStartupCheck }) => {
    const { name } = useCompanyContext();
    const { config } = useAppConfig();
    const [startupCheck, setStartupCheck] = React.useState<any>(initialStartupCheck);
    const [checking, setChecking] = React.useState(false);
    const [bypass, setBypass] = React.useState(false);
    const companyName = config?.branding.companyName || name || 'EA SPORTS';

    React.useEffect(() => {
        if (initialStartupCheck) {
            setStartupCheck(initialStartupCheck);
        }
    }, [initialStartupCheck]);

    const runChecks = async () => {
        setChecking(true);
        try {
            const res = await fetch('/api/startup-checks');
            const data = await res.json();
            setStartupCheck(data);
        } catch (e) {
            console.error("Failed to run startup checks:", e);
        } finally {
            setChecking(false);
        }
    };

    const isSetupRequired = startupCheck && startupCheck.success === false && !bypass;
    
    const tools = config?.navigation ? config.navigation.map(nav => {
        const Icon = FallbackIconMap[nav.icon as string] || HelpCircle;
        const desc = FallbackDescriptionMap[nav.id as string] || "Custom tool added by Admin";
        return {
            mode: nav.id as AppMode,
            label: nav.label,
            icon: <Icon size={24} />,
            desc: desc
        };
    }) : [
        {
            mode: AppMode.INSIGHTS,
            label: "Insights",
            icon: <Eye size={24} />,
            desc: "Multi-channel community listening, noise filtering, and strategic roadmap audits."
        },
        {
            mode: AppMode.CONTENT_HUB,
            label: "Create Content",
            icon: <Sparkles size={24} />,
            desc: "Generate cross-platform media, PDP personalization, and campaign assets."
        },
        {
            mode: AppMode.ADMIN,
            label: "App Config",
            icon: <Settings size={24} />,
            desc: "Change branding, navigation, and live data configurations."
        },
    ];

    if (isSetupRequired) {
        const { checks } = startupCheck;
        return (
            <div className="max-w-5xl mx-auto px-4 py-12 animate-fadeIn text-white">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFB800]/15 border border-[#FFB800]/30 text-[#FFB800] font-bold text-sm mb-6 shadow-sm animate-pulse font-mono">
                        <Zap size={16} className="fill-[#FFB800] stroke-[#FFB800]" />
                        System Setup Required
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 animate-fadeIn">
                        Configure Your AI Lab Workspace
                    </h1>
                    <p className="max-w-2xl mx-auto text-slate-400 leading-relaxed text-sm">
                        Welcome to your containerized AI Lab environment. Complete the startup checklist below to verify multimodal pipelines and GCS connectivity.
                    </p>
                </div>

                {/* Checklist Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                    {/* Gemini Key */}
                    <div className={`p-6 rounded-3xl border bg-[#0D131D]/90 backdrop-blur-xl shadow-xl flex flex-col h-full justify-between transition-all duration-300 ${checks.gemini.status === 'failed' ? 'border-[#FF4757]/30' : 'border-[#00FF88]/30'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-md text-2xs font-extrabold tracking-wider uppercase font-mono ${checks.gemini.status === 'failed' ? 'bg-[#FF4757]/20 text-[#FF4757]' : 'bg-[#00FF88]/20 text-[#00FF88]'}`}>
                                    {checks.gemini.status === 'failed' ? 'Action Required' : 'Active'}
                                </div>
                                <Sparkles className={checks.gemini.status === 'failed' ? 'text-[#FF4757]' : 'text-[#00FF88]'} size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Gemini API Activation</h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4 font-medium">{checks.gemini.message}</p>
                        </div>
                        {checks.gemini.status === 'failed' && (
                            <div className="mt-auto">
                                <span className="block text-3xs font-extrabold text-slate-500 uppercase mb-1 tracking-wider font-mono">Quick Fix</span>
                                <code className="block p-2 bg-black/50 border border-white/10 text-2xs font-mono text-slate-300 rounded-lg select-all break-all">
                                    export GEMINI_API_KEY="your_key"
                                </code>
                            </div>
                        )}
                    </div>

                    {/* GCS Bucket */}
                    <div className={`p-6 rounded-3xl border bg-[#0D131D]/90 backdrop-blur-xl shadow-xl flex flex-col h-full justify-between transition-all duration-300 ${checks.gcs.status === 'failed' ? 'border-[#FF4757]/30' : 'border-[#00FF88]/30'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-md text-2xs font-extrabold tracking-wider uppercase font-mono ${checks.gcs.status === 'failed' ? 'bg-[#FF4757]/20 text-[#FF4757]' : 'bg-[#00FF88]/20 text-[#00FF88]'}`}>
                                    {checks.gcs.status === 'failed' ? 'Action Required' : 'Active'}
                                </div>
                                <Layers className={checks.gcs.status === 'failed' ? 'text-[#FF4757]' : 'text-[#00FF88]'} size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">GCS Cloud Connection</h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4 font-medium">{checks.gcs.message}</p>
                        </div>
                        {checks.gcs.status === 'failed' && (
                            <div className="mt-auto">
                                <span className="block text-3xs font-extrabold text-slate-500 uppercase mb-1 tracking-wider font-mono">Auth Command</span>
                                <code className="block p-2 bg-black/50 border border-white/10 text-2xs font-mono text-slate-300 rounded-lg select-all break-all">
                                    gcloud auth application-default login
                                </code>
                            </div>
                        )}
                    </div>

                    {/* Custom Tailoring */}
                    <div className={`p-6 rounded-3xl border bg-[#0D131D]/90 backdrop-blur-xl shadow-xl flex flex-col h-full justify-between transition-all duration-300 ${checks.company.status === 'failed' ? 'border-[#FFB800]/30' : 'border-[#00FF88]/30'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-2.5 py-1 rounded-md text-2xs font-extrabold tracking-wider uppercase font-mono ${checks.company.status === 'failed' ? 'bg-[#FFB800]/20 text-[#FFB800]' : 'bg-[#00FF88]/20 text-[#00FF88]'}`}>
                                    {checks.company.status === 'failed' ? 'Recommended' : 'Tailored'}
                                </div>
                                <Target className={checks.company.status === 'failed' ? 'text-[#FFB800]' : 'text-[#00FF88]'} size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Active Customer Context</h3>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4 font-medium">{checks.company.message}</p>
                        </div>
                        {checks.company.status === 'failed' && (
                            <div className="mt-auto">
                                <button 
                                    onClick={() => setMode(AppMode.ADMIN)} 
                                    className="w-full py-2 bg-[#FFB800] hover:bg-[#e6a600] text-black font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 font-mono"
                                >
                                    <Settings size={14} /> Open Admin Settings
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                    <button
                        onClick={runChecks}
                        disabled={checking}
                        className="btn-primary w-full py-3 text-xs font-black shadow-md flex items-center justify-center gap-2"
                    >
                        {checking ? "Re-running Checks..." : "Re-run System Checks"}
                    </button>
                    <button
                        onClick={() => setBypass(true)}
                        className="btn-secondary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
                    >
                        Enter Demo Sandbox Anyway
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
            <div className="text-center mb-16">
                <div className="flex items-center justify-center gap-4 mb-4 animate-fadeIn">
                  <div className="p-3.5 bg-[#339DD4]/10 border border-[#339DD4]/25 rounded-2xl backdrop-blur-md">
                    <BarChart3 className="w-8 h-8 text-[#339DD4]" />
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                    Welcome to <span className="text-[#339DD4] drop-shadow-[0_0_20px_rgba(51,157,212,0.3)]">{companyName} AI</span>
                  </h1>
                </div>

                {/* Workflow Architecture Card */}
                <div className="max-w-4xl mx-auto bg-[#0D131D]/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10 text-left mb-12 animate-fadeIn">
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                        <Sparkles className="text-[#339DD4]" size={20} />
                        The {companyName} AI Workflow Architecture
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <div className="w-8 h-8 rounded-xl bg-[#339DD4] text-black flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(51,157,212,0.3)] font-mono">1</div>
                            <h3 className="font-bold text-white">Ingest &amp; Listen</h3>
                            <p className="text-sm text-slate-400">Stream community videos, Reddit debates, and Steam reviews with parallel sentiment workers.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-8 h-8 rounded-xl bg-[#00F0FF] text-black flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(0,240,255,0.3)] font-mono">2</div>
                            <h3 className="font-bold text-white">Filter &amp; Synthesize</h3>
                            <p className="text-sm text-slate-400">Isolate feature signals across 4 pipeline stages and build the franchise relationship graph.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-8 h-8 rounded-xl bg-[#339DD4] text-black flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(51,157,212,0.3)] font-mono">3</div>
                            <h3 className="font-bold text-white">Audit &amp; Create</h3>
                            <p className="text-sm text-slate-400">Produce horizon action roadmaps and generate personalized cross-platform marketing content.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Tool Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {tools.map((tool, idx) => (
                    <div
                        key={idx}
                        onClick={() => setMode(tool.mode)}
                        className="tool-card group p-8 bg-[#0D131D]/80 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-[#339DD4]/40 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl relative overflow-hidden h-full flex flex-col hover:-translate-y-1"
                    >
                        <div className="tool-icon-wrapper mb-6 w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-[#339DD4]/40 text-[#339DD4] transition-all">
                            {tool.icon}
                        </div>
                        <h3 className="text-xl font-black text-white mb-3 group-hover:text-[#339DD4] transition-colors">{tool.label}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow">{tool.desc}</p>
                        <div className="flex items-center text-[#339DD4] font-bold text-sm font-mono">
                            Open Tool 
                            <span className="ml-2 transform group-hover:translate-x-1.5 transition-transform">&rarr;</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
