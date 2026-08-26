import React, { useState, useEffect } from 'react';
import { brandConfig } from '../config';
import { generateFeasibilityReport } from '../services/geminiService';
import { FeasibilityReport, MarketingBriefData } from '../types';
import { TrendingUp, CheckCircle, XCircle, AlertTriangle, ArrowRight, Loader2, ClipboardCheck, BarChart3 } from 'lucide-react';

export const FeasibilityAnalysis: React.FC = () => {
    const [report, setReport] = useState<FeasibilityReport | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    // Data States
    const [brief, setBrief] = useState<MarketingBriefData | null>(null);
    const [focusGroupData, setFocusGroupData] = useState<any[]>([]);

    // Connection Status
    const [connections, setConnections] = useState({
        brief: false,
        focusGroup: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setStatus("Connecting to data sources...");

        try {
            // 1. Load Marketing Brief
            const briefRes = await fetch('/api/load-run/marketing_brief');
            const briefData = briefRes.ok ? await briefRes.json() : null;

            // 2. Load Focus Group Data (Synthetic Testing)
            const focusRes = await fetch('/api/load-run/synthetic_focus_group');
            const focusData = focusRes.ok ? await focusRes.json() : [];

            setBrief(briefData);
            setFocusGroupData(focusData);

            setConnections({
                brief: !!briefData,
                focusGroup: Array.isArray(focusData) && focusData.length > 0
            });

            setStatus("");
        } catch (e) {
            console.error("Failed to load data sources", e);
            setStatus("Error loading data sources.");
        }
    };

    const saveReport = async (reportData: FeasibilityReport) => {
        try {
            await fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    featureId: 'feasibility_analysis',
                    data: reportData
                })
            });
            console.log("Feasibility Report saved.");
        } catch (e) {
            console.error("Failed to save report:", e);
        }
    };

    const loadLastReport = async () => {
        setLoading(true);
        setStatus("Loading previous analysis...");
        try {
            const res = await fetch('/api/load-run/feasibility_analysis');
            if (!res.ok) throw new Error("No saved report found");
            const data = await res.json();
            if (data) {
                setReport(data);
                setStatus("");
            }
        } catch (e) {
            console.error("Failed to load last report:", e);
            alert("No saved analysis found.");
            setStatus("");
        } finally {
            setLoading(false);
        }
    };

    // Helper to recursively strip image data to save tokens
    const stripImageFields = (obj: any): any => {
        if (!obj) return obj;
        if (Array.isArray(obj)) {
            return obj.map(item => stripImageFields(item));
        }
        if (typeof obj === 'object') {
            const newObj: any = {};
            for (const key in obj) {
                // Skip keys that likely contain image data
                if (key.toLowerCase().includes('image') ||
                    key.toLowerCase().includes('base64') ||
                    key.toLowerCase() === 'url' && typeof obj[key] === 'string' && obj[key].startsWith('data:')) {
                    newObj[key] = "[IMAGE_REMOVED]";
                } else {
                    newObj[key] = stripImageFields(obj[key]);
                }
            }
            return newObj;
        }
        return obj;
    };

    const handleGenerateAnalysis = async () => {
        setLoading(true);
        setStatus("Analyzing aggregated data with Gemini...");

        try {
            // Data Optimization: Only send the latest Focus Group run to avoid context limit/quota issues
            // focusGroupData is sorted [newest, ...oldest]
            const latestFocusGroup = Array.isArray(focusGroupData) && focusGroupData.length > 0
                ? [focusGroupData[0]]
                : [];

            const aggregatedData = {
                brief: brief,
                focusGroup: latestFocusGroup
            };

            const optimizedData = stripImageFields(aggregatedData);

            const result = await generateFeasibilityReport(optimizedData);
            setReport(result);

            // Auto-save result
            saveReport(result);
        } catch (e) {
            console.error(e);
            alert("Failed to generate feasibility report.");
        } finally {
            setLoading(false);
            setStatus("");
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return "bg-green-100";
        if (score >= 60) return "bg-yellow-100";
        return "bg-red-100";
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Bar */}
            <div className="page-header">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-blue-600" size={24} />
                            <div>
                                <h1 className="page-title">Feasibility Analysis</h1>
                                <p className="page-subtitle">Executive assessment of campaign viability</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-8 mb-20">

                {/* Data Connections */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Data Sources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`p-4 rounded-xl border ${connections.brief ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <ClipboardCheck className={connections.brief ? "text-green-400" : "text-gray-500"} />
                                <div className="font-bold text-gray-900">Marketing Brief</div>
                            </div>
                            {connections.brief ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-gray-600" />}
                        </div>
                        <div className={`p-4 rounded-xl border ${connections.focusGroup ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                <BarChart3 className={connections.focusGroup ? "text-green-400" : "text-gray-500"} />
                                <div className="font-bold text-gray-900">Focus Group Data</div>
                            </div>
                            {connections.focusGroup ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-gray-600" />}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-4">
                        <button
                            onClick={loadLastReport}
                            disabled={loading}
                            className="px-6 py-3 rounded-lg font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-200"
                        >
                            <ClipboardCheck size={18} />
                            Load Last
                        </button>
                        <button
                            onClick={handleGenerateAnalysis}
                            disabled={loading || (!connections.brief && !connections.focusGroup)}
                            className={`${brandConfig.ui.button.primary} px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <TrendingUp size={20} />}
                            {loading ? status : "Generate Executive Assessment"}
                        </button>
                    </div>
                </div>

                {report && (
                    <div className="animate-fadeIn space-y-8">
                        {/* Score & Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Score Gauge */}
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center justify-center text-center">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Feasibility Score</h3>
                                <div className={`text-7xl font-black ${getScoreColor(report.score)} mb-2`}>
                                    {report.score}%
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${getScoreBg(report.score)} ${getScoreColor(report.score)}`}>
                                    {report.score >= 80 ? "High Probability" : report.score >= 60 ? "Moderate Probability" : "Low Probability"}
                                </div>
                            </div>

                            {/* Executive Summary */}
                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 md:col-span-2">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Executive Summary</h3>
                                <p className="text-lg text-gray-900 leading-relaxed font-medium">
                                    {report.summary}
                                </p>
                            </div>
                        </div>

                        {/* Risks & Opportunities */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-red-50 p-8 rounded-2xl border border-red-100">
                                <h3 className="text-red-400 font-bold flex items-center gap-2 mb-4">
                                    <AlertTriangle size={20} />
                                    Identified Risks
                                </h3>
                                <ul className="space-y-3">
                                    {report.risks.map((risk, i) => (
                                        <li key={i} className="flex gap-2 text-red-700">
                                            <div className="min-w-[6px] h-[6px] rounded-full bg-red-500 mt-2"></div>
                                            {risk}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
                                <h3 className="text-green-400 font-bold flex items-center gap-2 mb-4">
                                    <TrendingUp size={20} />
                                    Growth Opportunities
                                </h3>
                                <ul className="space-y-3">
                                    {report.opportunities.map((opp, i) => (
                                        <li key={i} className="flex gap-2 text-green-700">
                                            <div className="min-w-[6px] h-[6px] rounded-full bg-green-500 mt-2"></div>
                                            {opp}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Tactical Improvements */}
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <CheckCircle className="text-blue-600" size={24} />
                                Prioritized Improvements / Action Plan
                            </h3>
                            <div className="space-y-4">
                                {report.tactical_improvements.map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors bg-gray-50">
                                        <div className={`mt-0.5 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider
                                        ${item.priority === 'High' ? 'bg-red-100 text-red-600' :
                                                item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-blue-100 text-blue-600'}`}>
                                            {item.priority}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-gray-500 uppercase mb-1">{item.area}</div>
                                            <div className="font-medium text-gray-900">{item.suggestion}</div>
                                        </div>
                                        <ArrowRight className="text-gray-600 mt-2" size={16} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
