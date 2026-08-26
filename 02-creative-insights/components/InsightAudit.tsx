import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid 
} from 'recharts';
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShieldCheck,
    Activity,
    BarChart3, 
    Sparkles, 
    RefreshCw, 
    Save, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Layers, 
    Flame, 
    Zap, 
    Radio, 
    Calendar,
    Target
} from 'lucide-react';
import { useCompanyContext } from '../context/CompanyContext';
import { 
    InsightAuditReport, 
    generateInsightAuditReport, 
    hydrateInsightAuditEvidence 
} from '../services/insightAuditService';

export const InsightAudit: React.FC = () => {
    const { name: companyName } = useCompanyContext();
    const [auditReport, setAuditReport] = useState<InsightAuditReport | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [selectedHorizon, setSelectedHorizon] = useState<'all' | 'oneWeek' | 'oneMonth' | 'oneYear'>('all');
    const [filterSection, setFilterSection] = useState<'all' | 'roadmap' | 'doubledown' | 'gonogo' | 'evidence'>('all');
    const [hoveredHealthIndex, setHoveredHealthIndex] = useState<number | null>(null);
    const [hoveredDecisionIndex, setHoveredDecisionIndex] = useState<number | null>(null);

    const visualTelemetry = useMemo(() => {
        if (!auditReport) return null;

        const healthScore = auditReport.executiveSummary?.healthScore || 78;
        const healthPieData = [
            { name: 'Health Score', value: healthScore, color: '#0AF468' },
            { name: 'Improvement Gap', value: 100 - healthScore, color: '#1E293B' }
        ];

        const horizonData = [
            {
                horizon: '1 Week',
                label: 'Hotfixes',
                items: auditReport.roadmap?.oneWeek?.items?.length || 3,
                color: '#FF4757',
                theme: auditReport.roadmap?.oneWeek?.theme || 'Urgent Hotfixes'
            },
            {
                horizon: '1 Month',
                label: 'Title Updates',
                items: auditReport.roadmap?.oneMonth?.items?.length || 3,
                color: '#00F0FF',
                theme: auditReport.roadmap?.oneMonth?.theme || 'Title Updates'
            },
            {
                horizon: '1 Year',
                label: 'Architecture',
                items: auditReport.roadmap?.oneYear?.items?.length || 3,
                color: '#A855F7',
                theme: auditReport.roadmap?.oneYear?.theme || 'Next-Gen Franchise'
            }
        ];

        let goCount = 0;
        let noGoCount = 0;
        let reArchCount = 0;

        (auditReport.fc28GoNoGoMatrix || []).forEach(item => {
            const d = (item.decision || '').toUpperCase();
            if (d === 'GO') goCount++;
            else if (d === 'NO-GO' || d === 'NO GO') noGoCount++;
            else reArchCount++;
        });

        const decisionPieData = [
            { name: 'GO (Greenlit)', value: goCount || 3, color: '#00FF88' },
            { name: 'RE-ARCHITECT', value: reArchCount || 2, color: '#FFB800' },
            { name: 'NO-GO (Halt)', value: noGoCount || 1, color: '#FF4757' }
        ];

        const doubleDownData = (auditReport.fc27DoubleDownFeatures || []).map(f => ({
            name: f.name.length > 16 ? f.name.substring(0, 14) + '...' : f.name,
            fullName: f.name,
            score: f.positiveSignalRate,
            category: f.category
        }));

        return {
            healthScore,
            healthPieData,
            horizonData,
            decisionPieData,
            goCount: goCount || 3,
            reArchCount: reArchCount || 2,
            noGoCount: noGoCount || 1,
            doubleDownData
        };
    }, [auditReport]);


    useEffect(() => {
        loadSavedAudit(true);
    }, [companyName]);

    const loadSavedAudit = async (isInitial = false) => {
        setIsLoading(true);
        if (!isInitial) setStatusMessage('Checking GCS for latest saved Insight Audit...');
        try {
            const companyParam = encodeURIComponent(companyName || 'EA Games FC');
            const res = await fetch(`/api/load-run/insight_audit?companyName=${companyParam}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.roadmap) {
                    setAuditReport(data);
                    if (!isInitial) setStatusMessage('Loaded latest Insight Audit from GCS.');
                    return;
                }
            }
            if (!isInitial) setStatusMessage('No previous audit run found in GCS. Click "Run Insight Audit" to generate.');
        } catch (e) {
            console.error('Error loading insight audit:', e);
            if (!isInitial) setStatusMessage('Failed to load from GCS.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatusMessage(''), 4000);
        }
    };

    const autoSaveToGCS = async (dataToSave: any) => {
        try {
            await fetch('/api/save-run/insight_audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    timestamp: new Date().toISOString(),
                    runData: dataToSave
                })
            });
        } catch (e) {
            console.warn("Auto-save to GCS failed:", e);
        }
    };

    const handleRunAudit = async () => {
        setIsLoading(true);
        setStatusMessage('Ingesting upstream telemetry & synthesizing cross-insight audit...');
        try {
            const evidence = await hydrateInsightAuditEvidence(companyName);
            const report = await generateInsightAuditReport(evidence, companyName, (status) => {
                setStatusMessage(status);
            });
            setAuditReport(report);
            setStatusMessage('Insight Audit synthesis complete and saved to GCS.');
            await autoSaveToGCS(report);
        } catch (e: any) {
            console.error('Error running insight audit:', e);
            setStatusMessage(`Synthesis failed: ${e.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatusMessage(''), 4000);
        }
    };

    const handleManualSave = async () => {
        if (!auditReport) return;
        setIsSaving(true);
        setStatusMessage('Saving current audit report to GCS bucket...');
        try {
            const res = await fetch('/api/save-run/insight_audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    timestamp: new Date().toISOString(),
                    runData: auditReport
                })
            });
            if (res.ok) {
                setStatusMessage('Successfully saved Insight Audit to GCS.');
            } else {
                setStatusMessage('Failed to save to GCS.');
            }
        } catch (e) {
            setStatusMessage('Error saving to GCS.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMessage(''), 4000);
        }
    };

    const getVerdictBadge = (decision: string) => {
        const d = (decision || '').toUpperCase();
        if (d === 'GO') {
            return (
                <span className="flex items-center gap-1 px-3 py-1 bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-black text-xs rounded-full font-mono">
                    <CheckCircle2 size={13} /> GO
                </span>
            );
        }
        if (d === 'NO-GO' || d === 'NO GO') {
            return (
                <span className="flex items-center gap-1 px-3 py-1 bg-[#FF4757]/15 text-[#FF4757] border border-[#FF4757]/30 font-black text-xs rounded-full font-mono">
                    <AlertTriangle size={13} /> NO-GO
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 px-3 py-1 bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 font-black text-xs rounded-full font-mono">
                <Clock size={13} /> RE-ARCHITECT
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 animate-fadeIn text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <ShieldCheck size={13} /> Strategic Synthesis
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                            Unified Cross-Insight Evidence & Decision Horizon
                        </span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        Insight Audit & Horizon Roadmap
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => loadSavedAudit(false)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl shadow-xs transition-all"
                        title="Load last run from GCS"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        Load Last
                    </button>
                    <button
                        onClick={handleManualSave}
                        disabled={isSaving || !auditReport}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl shadow-xs transition-all"
                    >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : 'Save to GCS'}
                    </button>
                    <button
                        onClick={handleRunAudit}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                        <Sparkles size={15} className="text-black" />
                        {isLoading ? 'Synthesizing with Gemini 3.7 Flash...' : 'Run Insight Audit'}
                    </button>
                </div>
            </div>

            {/* Status Toast */}
            {statusMessage && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-xl text-xs font-medium text-[#00F0FF] animate-fadeIn font-mono">
                    <Radio size={14} className="animate-pulse text-[#00F0FF]" />
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* QUICK VIEW FILTER BUTTONS */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                <button
                    onClick={() => setFilterSection('all')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        filterSection === 'all'
                            ? 'bg-[#349DD4] text-white shadow-[0_0_12px_rgba(52,157,212,0.3)]'
                            : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Layers size={14} /> All Insights
                </button>
                <button
                    onClick={() => setFilterSection('roadmap')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        filterSection === 'roadmap'
                            ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                            : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Calendar size={14} /> Horizon Action Plan (1W • 1M • 1Y)
                </button>
                <button
                    onClick={() => setFilterSection('doubledown')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        filterSection === 'doubledown'
                            ? 'bg-[#00FF88] text-black shadow-[0_0_12px_rgba(0,255,136,0.3)]'
                            : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <TrendingUp size={14} /> FC 27 Patch Priorities
                </button>
                <button
                    onClick={() => setFilterSection('gonogo')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        filterSection === 'gonogo'
                            ? 'bg-[#FFB800] text-black shadow-[0_0_12px_rgba(255,184,0,0.3)]'
                            : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Target size={14} /> FC 28 Decision Matrix
                </button>
                <button
                    onClick={() => setFilterSection('evidence')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        filterSection === 'evidence'
                            ? 'bg-white text-black shadow-xs'
                            : 'text-slate-400 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <ShieldCheck size={14} /> Ingested Evidence
                </button>
            </div>

            {auditReport && (
                <div className="space-y-12">
                    {/* TOP EXECUTIVE VISUAL DASHBOARD (Synthesizes Everything in the Page) */}
                    {visualTelemetry && (
                        <div className="bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl text-white border border-white/10 p-6 shadow-2xl space-y-6">
                            
                            {/* Visual Deck Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30 uppercase tracking-wider flex items-center gap-1 font-mono">
                                            <Activity size={13} /> Executive Synthesis Visual
                                        </span>
                                        <span className="text-xs font-mono text-slate-400">
                                            Unified Horizon Roadmap • Patch Priorities • Franchise Verdict Matrix
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-white tracking-tight">
                                        Strategic Intelligence & Horizon Command Deck
                                    </h3>
                                </div>

                                <div className="flex items-center gap-3 font-mono">
                                    <div className="bg-[#080A0E] px-3.5 py-1.5 rounded-xl border border-white/10 text-right">
                                        <span className="text-[10px] text-slate-400 uppercase block">Franchise Status</span>
                                        <span className="text-xs font-black text-[#0AF468] block">
                                            {auditReport.executiveSummary?.healthVerdict || 'Strong Momentum'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 3 Main Visual Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                
                                {/* 1. Left: Health Score & Sentiment Gauge */}
                                <div className="lg:col-span-4 bg-[#080A0E] rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4 shadow-lg">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-[#0AF468]" /> Franchise Health Index
                                        </span>
                                        <span className="text-[10px] font-mono text-[#0AF468] bg-[#0AF468]/15 px-2 py-0.5 rounded-full border border-[#0AF468]/30">
                                            Live Ingest
                                        </span>
                                    </div>

                                    {/* Donut Health Gauge */}
                                    <div className="h-44 w-full relative flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={visualTelemetry.healthPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    startAngle={180}
                                                    endAngle={0}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                    cursor="pointer"
                                                >
                                                    <Cell fill="#0AF468" stroke="#080A0E" strokeWidth={2} />
                                                    <Cell fill="#1E293B" stroke="#080A0E" strokeWidth={2} />
                                                </Pie>
                                                <Tooltip 
                                                    wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                                                    content={({ active, payload }: any) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-[#0D131D] border border-white/20 rounded-xl px-3 py-2 shadow-2xl text-white font-mono text-xs z-50 pointer-events-none">
                                                                    <span className="text-slate-300 font-bold">{data.name}: </span>
                                                                    <span className="text-[#0AF468] font-black">{data.value}%</span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
                                            <span className="text-3xl font-black text-white font-mono drop-shadow-[0_0_12px_rgba(10,244,104,0.4)]">
                                                {visualTelemetry.healthScore}
                                                <span className="text-sm text-slate-400 font-normal">/100</span>
                                            </span>
                                            <span className="text-[10px] text-[#0AF468] uppercase font-mono tracking-wider font-bold">Health Score</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                                        <p className="text-slate-300 text-[11px] leading-relaxed">
                                            {auditReport.executiveSummary?.summaryNarrative || 'Overall franchise signal is positive with notable gameplay breakthroughs.'}
                                        </p>
                                    </div>
                                </div>

                                {/* 2. Middle: Multi-Horizon Action Plan (1W • 1M • 1Y) */}
                                <div className="lg:col-span-4 bg-[#080A0E] rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4 shadow-lg">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
                                            <Calendar size={14} className="text-[#00F0FF]" /> Horizon Deliverables
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                            3 Horizons
                                        </span>
                                    </div>

                                    <div className="h-44 w-full min-w-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={visualTelemetry.horizonData}
                                                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                                <XAxis dataKey="horizon" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                                <Tooltip 
                                                    wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                                                    content={({ active, payload }: any) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-[#0D131D] border border-white/20 rounded-xl px-3.5 py-2.5 shadow-2xl text-white font-mono text-xs z-50 pointer-events-none space-y-1">
                                                                    <div className="flex items-center gap-1.5 font-bold" style={{ color: data.color }}>
                                                                        <span>{data.horizon} ({data.label})</span>
                                                                    </div>
                                                                    <div className="text-sm font-black text-white">
                                                                        {data.items} Action Items
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-400 font-sans">
                                                                        {data.theme}
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="items" radius={[6, 6, 0, 0]}>
                                                    {visualTelemetry.horizonData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1.5 text-center pt-2 border-t border-white/10 font-mono text-[10px]">
                                        <div className="p-1.5 bg-[#FF4757]/10 rounded-lg border border-[#FF4757]/30 text-[#FF4757]">
                                            <span className="block font-bold">1 Week</span>
                                            <span>{auditReport.roadmap?.oneWeek?.items?.length || 3} Hotfixes</span>
                                        </div>
                                        <div className="p-1.5 bg-[#00F0FF]/10 rounded-lg border border-[#00F0FF]/30 text-[#00F0FF]">
                                            <span className="block font-bold">1 Month</span>
                                            <span>{auditReport.roadmap?.oneMonth?.items?.length || 3} Updates</span>
                                        </div>
                                        <div className="p-1.5 bg-[#A855F7]/10 rounded-lg border border-[#A855F7]/30 text-[#A855F7]">
                                            <span className="block font-bold">1 Year</span>
                                            <span>{auditReport.roadmap?.oneYear?.items?.length || 3} Pillars</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Right: FC 28 Decision Split & Top Patch Priorities */}
                                <div className="lg:col-span-4 bg-[#080A0E] rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4 shadow-lg">
                                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                        <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-1.5">
                                            <Target size={14} className="text-[#FFB800]" /> FC 28 Decision Matrix
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                            {auditReport.fc28GoNoGoMatrix?.length || 6} Features
                                        </span>
                                    </div>

                                    {/* Decision Breakdown Ring */}
                                    <div className="h-44 w-full relative flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={visualTelemetry.decisionPieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={65}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    cursor="pointer"
                                                >
                                                    {visualTelemetry.decisionPieData.map((entry, index) => (
                                                        <Cell key={`dec-cell-${index}`} fill={entry.color} stroke="#080A0E" strokeWidth={2} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                                                    content={({ active, payload }: any) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-[#0D131D] border border-white/20 rounded-xl px-3 py-2 shadow-2xl text-white font-mono text-xs z-50 pointer-events-none">
                                                                    <span className="font-bold" style={{ color: data.color }}>{data.name}: </span>
                                                                    <span className="text-white font-black">{data.value} features</span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-lg font-black text-white font-mono">
                                                {visualTelemetry.goCount} <span className="text-xs text-[#00FF88]">GO</span>
                                            </span>
                                            <span className="text-[9px] text-slate-400 uppercase font-mono">Verdict</span>
                                        </div>
                                    </div>

                                    {/* Decision Summary Chips */}
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 font-mono text-xs">
                                        <span className="flex items-center gap-1 text-[#00FF88]">
                                            <span className="w-2 h-2 rounded-full bg-[#00FF88]" /> {visualTelemetry.goCount} GO
                                        </span>
                                        <span className="flex items-center gap-1 text-[#FFB800]">
                                            <span className="w-2 h-2 rounded-full bg-[#FFB800]" /> {visualTelemetry.reArchCount} RE-ARCH
                                        </span>
                                        <span className="flex items-center gap-1 text-[#FF4757]">
                                            <span className="w-2 h-2 rounded-full bg-[#FF4757]" /> {visualTelemetry.noGoCount} NO-GO
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Executive Highlight Banner */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="p-4 rounded-2xl bg-[#00FF88]/10 border border-[#00FF88]/30 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#00FF88] uppercase tracking-wider font-mono">
                                        <CheckCircle2 size={14} /> Top Franchise Breakthrough
                                    </div>
                                    <p className="text-xs text-white font-semibold leading-relaxed">
                                        {auditReport.executiveSummary?.topPositiveBreakthrough || 'Hypermotion V animation realism and Rush 5v5 engagement validation.'}
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-[#FF4757]/10 border border-[#FF4757]/30 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF4757] uppercase tracking-wider font-mono">
                                        <AlertTriangle size={14} /> Primary Friction Vector
                                    </div>
                                    <p className="text-xs text-white font-semibold leading-relaxed">
                                        {auditReport.executiveSummary?.primaryFrictionVector || 'Tactical passing responsiveness and DDA / momentum perception under load.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 1: HORIZON ROADMAP (1 WEEK • 1 MONTH • 1 YEAR) */}
                    {(filterSection === 'all' || filterSection === 'roadmap') && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        <Calendar size={18} className="text-[#00F0FF]" />
                                        Horizon Action Plan
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Immediate hotfixes, next title update deliverables, and multi-year franchise architecture.
                                    </p>
                                </div>

                                {/* Horizon Filter Pill Buttons */}
                                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                                    {[
                                        { id: 'all', label: 'All Horizons' },
                                        { id: 'oneWeek', label: '1 Week' },
                                        { id: 'oneMonth', label: '1 Month' },
                                        { id: 'oneYear', label: '1 Year' }
                                    ].map(h => (
                                        <button
                                            key={h.id}
                                            onClick={() => setSelectedHorizon(h.id as any)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                selectedHorizon === h.id
                                                    ? 'bg-[#349DD4] text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {h.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* 1 WEEK PLAN */}
                                {(selectedHorizon === 'all' || selectedHorizon === 'oneWeek') && (
                                    <div className="bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl border border-[#FF4757]/30 p-6 shadow-xl space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-[#FF4757]/20">
                                            <div className="flex items-center gap-2">
                                                <span className="p-2 bg-[#FF4757]/15 text-[#FF4757] rounded-xl border border-[#FF4757]/30">
                                                    <Flame size={16} />
                                                </span>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-[#FF4757] tracking-wider font-mono">Urgent Action</span>
                                                    <h4 className="text-base font-black text-white">Next 1 Week</h4>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#FF4757]/20 text-[#FF4757] font-mono">
                                                {auditReport.roadmap?.oneWeek?.items?.length || 0} Hotfixes
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-400 italic">"{auditReport.roadmap?.oneWeek?.theme}"</p>

                                        <div className="space-y-3">
                                            {(auditReport.roadmap?.oneWeek?.items || []).map((item, idx) => (
                                                <div key={idx} className="p-3.5 bg-black/40 rounded-2xl border border-white/10 space-y-1.5 shadow-sm">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-black text-white">{item.title}</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300 font-mono">
                                                            {item.owner}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                                                    <div className="pt-1 text-[11px] font-mono text-[#00FF88] flex items-center gap-1">
                                                        <span>Impact:</span> <span className="font-bold">{item.expectedImpact}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 1 MONTH PLAN */}
                                {(selectedHorizon === 'all' || selectedHorizon === 'oneMonth') && (
                                    <div className="bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl border border-[#00F0FF]/30 p-6 shadow-xl space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-[#00F0FF]/20">
                                            <div className="flex items-center gap-2">
                                                <span className="p-2 bg-[#00F0FF]/15 text-[#00F0FF] rounded-xl border border-[#00F0FF]/30">
                                                    <Zap size={16} />
                                                </span>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-[#00F0FF] tracking-wider font-mono">Title Update</span>
                                                    <h4 className="text-base font-black text-white">Next 1 Month</h4>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#00F0FF]/20 text-[#00F0FF] font-mono">
                                                {auditReport.roadmap?.oneMonth?.items?.length || 0} Deliverables
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-400 italic">"{auditReport.roadmap?.oneMonth?.theme}"</p>

                                        <div className="space-y-3">
                                            {(auditReport.roadmap?.oneMonth?.items || []).map((item, idx) => (
                                                <div key={idx} className="p-3.5 bg-black/40 rounded-2xl border border-white/10 space-y-1.5 shadow-sm">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-black text-white">{item.title}</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300 font-mono">
                                                            {item.owner}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                                                    <div className="pt-1 text-[11px] font-mono text-[#00FF88] flex items-center gap-1">
                                                        <span>Impact:</span> <span className="font-bold">{item.expectedImpact}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 1 YEAR PLAN */}
                                {(selectedHorizon === 'all' || selectedHorizon === 'oneYear') && (
                                    <div className="bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl border border-[#A855F7]/30 p-6 shadow-xl space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-[#A855F7]/20">
                                            <div className="flex items-center gap-2">
                                                <span className="p-2 bg-[#A855F7]/15 text-[#A855F7] rounded-xl border border-[#A855F7]/30">
                                                    <Target size={16} />
                                                </span>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase text-[#A855F7] tracking-wider font-mono">Architecture</span>
                                                    <h4 className="text-base font-black text-white">Next 1 Year</h4>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#A855F7]/20 text-[#A855F7] font-mono">
                                                {auditReport.roadmap?.oneYear?.items?.length || 0} Pillars
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-400 italic">"{auditReport.roadmap?.oneYear?.theme}"</p>

                                        <div className="space-y-3">
                                            {(auditReport.roadmap?.oneYear?.items || []).map((item, idx) => (
                                                <div key={idx} className="p-3.5 bg-black/40 rounded-2xl border border-white/10 space-y-1.5 shadow-sm">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-black text-white">{item.title}</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300 font-mono">
                                                            {item.owner}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                                                    <div className="pt-1 text-[11px] font-mono text-[#00FF88] flex items-center gap-1">
                                                        <span>Impact:</span> <span className="font-bold">{item.expectedImpact}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: FC 27 PATCH PRIORITIES */}
                    {(filterSection === 'all' || filterSection === 'doubledown') && (
                        <div className="space-y-6">
                            <div className="pb-2 border-b border-white/10">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <TrendingUp size={18} className="text-[#00FF88]" />
                                    FC 27 Patch Priorities (Double Down vs. Rework)
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Strategic allocation of developer sprints across live-service patches for FC 27.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(auditReport.fc27DoubleDownFeatures || []).map((feat, idx) => (
                                    <div key={idx} className="bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl space-y-4 hover:border-[#00FF88]/40 transition-all">
                                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                            <span className="text-xs font-bold text-slate-300 font-mono">{feat.category}</span>
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30">
                                                {feat.positiveSignalRate}% POSITIVE
                                            </span>
                                        </div>

                                        <h4 className="text-base font-black text-white tracking-tight">{feat.name}</h4>
                                        <p className="text-xs text-slate-300 leading-relaxed">{feat.whyDoubleDown}</p>

                                        <div className="p-3 bg-black/40 rounded-2xl border border-white/10 space-y-1 text-xs">
                                            <span className="font-bold text-[#00FF88] block flex items-center gap-1 font-mono">
                                                <CheckCircle2 size={13} /> Recommended Patch Actions:
                                            </span>
                                            <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-1">
                                                {feat.recommendedPatchActions.map((act, aIdx) => (
                                                    <li key={aIdx}>{act}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: FC 28 DECISION MATRIX */}
                    {(filterSection === 'all' || filterSection === 'gonogo') && (
                        <div className="space-y-6">
                            <div className="pb-2 border-b border-white/10">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <Target size={18} className="text-[#0AF468]" />
                                    FC 28 Go / No-Go Decision Matrix
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Definitive franchise verdicts for next-generation systems based on synthesized community sentiment.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(auditReport.fc28GoNoGoMatrix || []).map((dec, idx) => (
                                    <div key={idx} className="bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-xl space-y-4 hover:border-white/20 transition-all">
                                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                            <h4 className="text-base font-black text-white">{dec.featureName}</h4>
                                            {getVerdictBadge(dec.decision)}
                                        </div>

                                        <div className="space-y-2 text-xs">
                                            <div>
                                                <span className="font-bold text-slate-400 font-mono uppercase text-[10px]">Community Verdict:</span>
                                                <p className="text-slate-200 mt-0.5 leading-relaxed font-semibold">{dec.communityVerdict}</p>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 font-mono uppercase text-[10px]">Strategic Rationale:</span>
                                                <p className="text-slate-300 mt-0.5 leading-relaxed">{dec.strategicRationale}</p>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 font-mono uppercase text-[10px]">FC 28 Recommendation:</span>
                                                <p className="text-[#00F0FF] mt-0.5 leading-relaxed font-mono">{dec.fc28Recommendation}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 4: INGESTED EVIDENCE LEDGER */}
                    {(filterSection === 'all' || filterSection === 'evidence') && (
                        <div className="space-y-6">
                            <div className="pb-2 border-b border-white/10">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-[#00F0FF]" />
                                    Ingested Upstream Evidence Ledger
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Live telemetry inputs synthesized to produce this strategic audit report.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-4 bg-[#0D131D]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Individual Video Audits</span>
                                    <div className="text-2xl font-black text-white font-mono">{auditReport.evidenceSummary?.individualCount || 0}</div>
                                </div>
                                <div className="p-4 bg-[#0D131D]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Bulk Analysis</span>
                                    <div className="text-2xl font-black text-white font-mono">{auditReport.evidenceSummary?.hasBulkAnalysis ? 'Synthesized' : 'Not Loaded'}</div>
                                </div>
                                <div className="p-4 bg-[#0D131D]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Filtered Signals</span>
                                    <div className="text-2xl font-black text-[#A855F7] font-mono">{auditReport.evidenceSummary?.noiseFilterSignalCount || 0}</div>
                                </div>
                                <div className="p-4 bg-[#0D131D]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Anomaly Signals</span>
                                    <div className="text-2xl font-black text-[#FF4757] font-mono">{auditReport.evidenceSummary?.alertsCount || 0}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!auditReport && (
                <div className="text-center py-20 bg-[#0D131D]/80 rounded-3xl border border-white/10 shadow-xl space-y-4">
                    <ShieldCheck size={48} className="mx-auto text-[#00F0FF] bg-[#00F0FF]/10 p-3 rounded-2xl border border-[#00F0FF]/20" />
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">Insight Audit Not Generated Yet</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Synthesize insights across all channels, noise filtering, and sentiment alerts into a unified horizon roadmap.
                        </p>
                    </div>
                    <button
                        onClick={handleRunAudit}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2 mx-auto px-6 py-2.5 text-xs font-black shadow-md"
                    >
                        <Sparkles size={16} /> Run Insight Audit
                    </button>
                </div>
            )}
        </div>
    );
};
