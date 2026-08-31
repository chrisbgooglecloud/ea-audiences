import React, { useState, useEffect, useMemo } from 'react';
import { 
    Sparkles, 
    RefreshCw, 
    Search, 
    DollarSign, 
    Layers, 
    Flame, 
    ShieldCheck, 
    MessageSquare, 
    Cpu, 
    Radio, 
    Shirt, 
    Tv, 
    Award, 
    CheckCircle2, 
    TrendingUp, 
    ExternalLink, 
    Zap,
    Users,
    Filter,
    Clock,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useCompanyContext } from '@/context';
import { 
    AdOpportunity, 
    AdOpportunitiesResult, 
    runAdOpportunitiesScan, 
    loadLastAdOpportunities 
} from '@/services/adOpportunitiesService';

export const AdOpportunities: React.FC = () => {
    const { name: companyName } = useCompanyContext();
    const [result, setResult] = useState<AdOpportunitiesResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedRevenue, setSelectedRevenue] = useState<string>('ALL');
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [activeCardTab, setActiveCardTab] = useState<{[key: string]: 'quotes' | 'blueprint' | 'monetization'}>({});

    // Load Last saved run from GCS on mount or company change
    useEffect(() => {
        handleLoadLast();
    }, [companyName]);

    const handleLoadLast = async () => {
        setIsLoading(true);
        try {
            const saved = await loadLastAdOpportunities(companyName);
            if (saved) {
                setResult(saved);
            }
        } catch (e) {
            console.error('Error loading ad opportunities:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunScan = async () => {
        setIsLoading(true);
        setStatusMessage('Partitioning GCS comments and dispatching parallel Gemini 3.7 Flash workers...');
        try {
            const res = await runAdOpportunitiesScan(companyName, (status) => {
                setStatusMessage(status);
            });
            setResult(res);
        } catch (e: any) {
            console.error('Ad opportunities scan error:', e);
            setStatusMessage(`Scan failed: ${e.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getPlacementIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('led') || t.includes('stadium') || t.includes('board')) return <Tv size={15} className="text-[#00F0FF]" />;
        if (t.includes('volta') || t.includes('streetwear') || t.includes('apparel')) return <Shirt size={15} className="text-[#A855F7]" />;
        if (t.includes('broadcast') || t.includes('halftime') || t.includes('replay')) return <Radio size={15} className="text-[#FF7A00]" />;
        if (t.includes('tech') || t.includes('hardware') || t.includes('pc')) return <Cpu size={15} className="text-[#00FF88]" />;
        if (t.includes('fut') || t.includes('tifo') || t.includes('walkout')) return <Flame size={15} className="text-[#FF4757]" />;
        return <Award size={15} className="text-[#0AF468]" />;
    };

    // Filtered and searched opportunities
    const filteredOpportunities = useMemo(() => {
        if (!result?.opportunities) return [];
        return result.opportunities.filter(opp => {
            const matchCategory = selectedCategory === 'ALL' || opp.category === selectedCategory;
            const matchRevenue = selectedRevenue === 'ALL' || opp.revenuePotential === selectedRevenue;
            const q = searchQuery.toLowerCase().trim();
            const matchSearch = !q || 
                opp.title.toLowerCase().includes(q) || 
                opp.placementType.toLowerCase().includes(q) ||
                opp.brandFitSuggestions.some(b => b.toLowerCase().includes(q)) ||
                opp.communityTrigger.toLowerCase().includes(q) ||
                opp.gamerQuotes.some(g => g.quote.toLowerCase().includes(q) || g.author.toLowerCase().includes(q));

            return matchCategory && matchRevenue && matchSearch;
        });
    }, [result, selectedCategory, selectedRevenue, searchQuery]);

    const categoriesList = useMemo(() => {
        if (!result?.opportunities) return [];
        const set = new Set<string>();
        result.opportunities.forEach(o => set.add(o.category));
        return Array.from(set);
    }, [result]);

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
            {/* Top Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <DollarSign size={13} /> In-Game Commercial Intelligence
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                            Multi-Threaded Gamer Feedback Mining & Contextual Placement Strategy
                        </span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        In-Game Ad Opportunities & Sponsorship Intelligence
                    </h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleLoadLast}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl shadow-xs transition-all disabled:opacity-50"
                        title="Hydrate most recent analysis from GCS cache"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        Load Last
                    </button>
                    <button
                        onClick={handleRunScan}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2 px-5 py-2 text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                        <Sparkles size={15} className={isLoading ? "animate-spin text-black" : "text-black"} />
                        {isLoading ? 'Scanning Comments...' : 'Run Multi-Threaded Scan'}
                    </button>
                </div>
            </div>

            {/* Real-Time Status Notification */}
            {statusMessage && (
                <div className="flex items-center gap-2 px-4 py-3 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-2xl text-xs font-semibold text-[#FFB800] animate-fadeIn">
                    <Zap size={15} className="animate-pulse text-[#FFB800] shrink-0" />
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* Summary Metrics */}
            {result && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0D131D]/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Opportunities</span>
                        <div className="text-3xl font-black text-white flex items-center gap-2 font-mono">
                            {result.opportunitiesCount}
                            <span className="text-xs font-bold text-[#00FF88] bg-[#00FF88]/15 px-2 py-0.5 rounded-full border border-[#00FF88]/30">
                                Validated
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Across {result.topCategories.length} in-game touchpoints.</p>
                    </div>

                    <div className="bg-[#0D131D]/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">GCS Comments Evaluated</span>
                        <div className="text-3xl font-black text-white font-mono">
                            {result.totalCommentsScanned}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            YouTube ({result.sourcesSummary?.youtube || 0}) • Steam ({result.sourcesSummary?.steam || 0}) • Reddit ({result.sourcesSummary?.reddit || 0})
                        </p>
                    </div>

                    <div className="bg-[#0D131D]/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Brand Alignment Index</span>
                        <div className="text-3xl font-black text-[#00F0FF] flex items-center gap-1.5 font-mono">
                            {result.brandAlignmentIndex}%
                            <TrendingUp size={18} className="text-[#00FF88]" />
                        </div>
                        <p className="text-[11px] text-slate-400">Natural community sentiment fit.</p>
                    </div>

                    <div className="bg-[#0D131D]/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-lg space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Analysis Engine</span>
                        <div className="text-sm font-black text-[#0AF468] truncate font-mono">
                            {result.workersCount} Parallel Workers
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{result.generatedAt}</p>
                    </div>
                </div>
            )}

            {/* Search & Revenue Filter Bar */}
            {result && (
                <div className="bg-[#0D131D]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedRevenue}
                            onChange={(e) => setSelectedRevenue(e.target.value)}
                            className="bg-[#080A0E] border border-white/15 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:ring-2 focus:ring-[#00F0FF] font-mono"
                        >
                            <option value="ALL">All Revenue Tiers ({result.opportunities.length} Opportunities)</option>
                            <option value="Transformative">Transformative Revenue</option>
                            <option value="Very High">Very High Revenue</option>
                            <option value="High">High Revenue</option>
                        </select>
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search opportunities, placement types, brands, quotes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-[#080A0E] border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#00F0FF] w-full"
                        />
                    </div>
                </div>
            )}

            {/* Opportunities List */}
            {result ? (
                <div className="space-y-4">
                    {filteredOpportunities.map((opp) => {
                        const isExpanded = expandedCardId === opp.id;
                        const currentTab = activeCardTab[opp.id] || 'quotes';

                        return (
                            <div 
                                key={opp.id} 
                                className="bg-[#0D131D]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-lg overflow-hidden hover:border-[#00F0FF]/40 transition-all"
                            >
                                {/* Card Header / Summary */}
                                <div className="p-6 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-white/5 text-slate-300 border border-white/10 font-mono">
                                                    {getPlacementIcon(opp.placementType)}
                                                    {opp.placementType}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25">
                                                    {opp.category}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-black uppercase font-mono ${
                                                    opp.revenuePotential === 'Transformative' ? 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30' :
                                                    opp.revenuePotential === 'Very High' ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30' :
                                                    'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                                                }`}>
                                                    {opp.revenuePotential} Revenue
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20 font-mono">
                                                    Risk: {opp.playerSentimentRisk}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-black text-white tracking-tight">
                                                {opp.title}
                                            </h3>

                                            <p className="text-xs text-slate-300 leading-relaxed pt-1">
                                                <strong className="text-white">Community Catalyst:</strong> {opp.communityTrigger}
                                            </p>
                                        </div>

                                        {/* Opportunity Score Gauge */}
                                        <div className="flex items-center gap-3 shrink-0 sm:border-l sm:border-white/10 sm:pl-6">
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Opportunity Score</span>
                                                <div className="text-2xl font-black text-[#0AF468] font-mono">
                                                    {opp.opportunityScore}<span className="text-sm text-slate-500 font-normal">/100</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Brand Fit Tags */}
                                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
                                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 font-mono uppercase">
                                            <Award size={13} className="text-[#FFB800]" /> Ideal Brand Partners:
                                        </span>
                                        {opp.brandFitSuggestions.map((brand, bIdx) => (
                                            <span 
                                                key={bIdx}
                                                className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/5 text-slate-200 border border-white/10 hover:border-[#00F0FF]/40 transition font-mono"
                                            >
                                                {brand}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Expand / Collapse Button */}
                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 font-mono">
                                            <MessageSquare size={14} className="text-[#00F0FF]" />
                                            <span>{opp.gamerQuotes.length} Verbatim Community Quotes</span>
                                        </div>

                                        <button
                                            onClick={() => setExpandedCardId(isExpanded ? null : opp.id)}
                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 transition border border-white/10"
                                        >
                                            {isExpanded ? (
                                                <><span>Hide Details</span> <ChevronUp size={14} /></>
                                            ) : (
                                                <><span>View Blueprint & Evidence</span> <ChevronDown size={14} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Detail Drawer */}
                                {isExpanded && (
                                    <div className="bg-[#080A0E]/90 p-6 border-t border-white/10 space-y-4 animate-fadeIn">
                                        {/* Sub-Tabs within card */}
                                        <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs">
                                            <button
                                                onClick={() => setActiveCardTab(prev => ({ ...prev, [opp.id]: 'quotes' }))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                                                    currentTab === 'quotes' ? 'bg-[#00F0FF] text-black shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <MessageSquare size={13} /> Community Voice Evidence ({opp.gamerQuotes.length})
                                            </button>
                                            <button
                                                onClick={() => setActiveCardTab(prev => ({ ...prev, [opp.id]: 'blueprint' }))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                                                    currentTab === 'blueprint' ? 'bg-[#00F0FF] text-black shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <CheckCircle2 size={13} /> In-Game Dev Blueprint
                                            </button>
                                            <button
                                                onClick={() => setActiveCardTab(prev => ({ ...prev, [opp.id]: 'monetization' }))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                                                    currentTab === 'monetization' ? 'bg-[#00F0FF] text-black shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                            >
                                                <DollarSign size={13} /> Monetization Model
                                            </button>
                                        </div>

                                        {/* Tab Content: Quotes */}
                                        {currentTab === 'quotes' && (
                                            <div className="space-y-2.5">
                                                {opp.gamerQuotes.map((gq, qIdx) => (
                                                    <div 
                                                        key={qIdx}
                                                        className="p-3.5 rounded-2xl bg-[#0D131D] border border-white/10 text-xs space-y-1.5 shadow-sm"
                                                    >
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="font-bold text-white">{gq.author}</span>
                                                            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                                                                {gq.release} • {gq.channel}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-300 italic leading-relaxed">
                                                            "{gq.quote}"
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Tab Content: Dev Blueprint */}
                                        {currentTab === 'blueprint' && (
                                            <div className="p-4 rounded-2xl bg-[#0D131D] border border-white/10 text-xs space-y-2 shadow-sm">
                                                <span className="font-bold text-white block flex items-center gap-1.5">
                                                    <Cpu size={14} className="text-[#00F0FF]" /> Non-Intrusive Integration Strategy:
                                                </span>
                                                <p className="text-slate-300 leading-relaxed">
                                                    {opp.implementationBlueprint}
                                                </p>
                                            </div>
                                        )}

                                        {/* Tab Content: Monetization */}
                                        {currentTab === 'monetization' && (
                                            <div className="p-4 rounded-2xl bg-[#0D131D] border border-white/10 text-xs space-y-2 shadow-sm">
                                                <span className="font-bold text-white block flex items-center gap-1.5">
                                                    <DollarSign size={14} className="text-[#00FF88]" /> Commercial Execution Structure:
                                                </span>
                                                <p className="text-slate-300 leading-relaxed">
                                                    {opp.monetizationModel}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredOpportunities.length === 0 && (
                        <div className="text-center py-12 bg-[#0D131D]/80 rounded-3xl border border-white/10 text-slate-400 space-y-2">
                            <Search size={32} className="mx-auto text-slate-500" />
                            <p className="text-sm font-semibold text-white">No opportunities matching current filters.</p>
                            <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <div className="text-center py-20 bg-[#0D131D]/80 rounded-3xl border border-white/10 shadow-xl space-y-4">
                    <DollarSign size={48} className="mx-auto text-[#FFB800] bg-[#FFB800]/10 p-3 rounded-2xl border border-[#FFB800]/20" />
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white">In-Game Ad Opportunities Not Generated Yet</h3>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Deploy parallel Gemini 3.7 Flash workers to scan the harvested gamer comments in GCS and discover high-value in-game sponsorship activations.
                        </p>
                    </div>
                    <button
                        onClick={handleRunScan}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2 mx-auto px-6 py-2.5 text-xs font-black shadow-md"
                    >
                        <Sparkles size={16} /> Run Multi-Threaded Scan
                    </button>
                </div>
            )}
        </div>
    );
};
