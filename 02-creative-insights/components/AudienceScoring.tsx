import React, { useState, useEffect } from 'react';
import { CombinedPersona } from '../types';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Cell, Label } from 'recharts';
import { Brain, TrendingUp, Info, RotateCcw, Users } from 'lucide-react';
import { brandConfig } from '../config';

interface AudienceScoringProps {
    personas: CombinedPersona[];
    setPersonas: React.Dispatch<React.SetStateAction<CombinedPersona[]>>;
    onGenerateScores: () => void;
    onLoadLast: () => void;
    isScoring: boolean;
}

export const AudienceScoring: React.FC<AudienceScoringProps> = ({ personas, setPersonas, onGenerateScores, onLoadLast, isScoring }) => {
    const [hoveredPersona, setHoveredPersona] = useState<CombinedPersona | null>(null);

    const scoredPersonas = personas.filter(p => p.score);
    const hasScores = scoredPersonas.length > 0;

    const data = scoredPersonas.map(p => ({
        x: p.score?.propensity || 0,
        y: p.score?.value || 0,
        z: 1,
        name: p.personaName,
        segment: p.name,
        reason: p.score?.reason,
        imageUrl: p.imageUrl
    }));

    return (
        <div className="max-w-7xl mx-auto p-8 mb-20 animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="section-header mb-2 flex items-center gap-3">
                        <Brain className="text-[#0077C8]" size={32} />
                        Audience Scoring & Feasibility
                    </h2>
                    <p className="text-subtext mt-2 font-medium">
                        Analyze audience segments based on immediate propensity to purchase vs. long-time customer value.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={onLoadLast}
                        className="btn-secondary flex items-center gap-2"
                        title="Replay last run"
                        disabled={isScoring}
                    >
                        <RotateCcw size={16} /> Load Last
                    </button>
                    <button
                        onClick={onGenerateScores}
                        disabled={isScoring || personas.length === 0}
                        className="btn-primary px-6 py-3 flex items-center gap-2"
                    >
                        {isScoring ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                                Scoring Audiences...
                            </>
                        ) : (
                            <>
                                <TrendingUp size={20} />
                                {hasScores ? 'Re-Score Audiences' : 'Generate Scores'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {personas.length === 0 ? (
                <div className="content-card border-dashed p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#0077C8] border border-blue-100">
                        <Brain size={32} />
                    </div>
                    <h3 className="section-header justify-center mb-2">No Audiences Generated Yet</h3>
                    <p className="text-subtext max-w-md mx-auto font-medium">
                        Please go to the <strong>Audience Generator</strong> tab first to create audience segments before analyzing them.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Graph Section */}
                    <div className="lg:col-span-2 content-card flex flex-col h-[600px]">
                        <h3 className="section-header mb-4 flex items-center gap-2">
                            Value Matrix
                            <div className="group relative">
                                <Info size={16} className="text-gray-400 cursor-help" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700">
                                    X-Axis: Likelihood to buy NOW vs Later<br />
                                    Y-Axis: Total Lifetime Value (Retention + Spend)
                                </div>
                            </div>
                        </h3>

                        <div className="flex-1 w-full relative">
                            {/* Quadrant Backgrounds */}
                            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 z-0 pointer-events-none">
                                <div className="bg-red-50/50 border-r border-b border-gray-100 rounded-tl-xl flex p-4 items-start justify-start">
                                    <span className="text-red-700 font-bold uppercase tracking-widest text-[10px]">Low Value / Buy Later</span>
                                </div>
                                <div className="bg-green-50/50 border-b border-gray-100 rounded-tr-xl flex p-4 items-start justify-end">
                                    <span className="text-green-700 font-bold uppercase tracking-widest text-[10px]">High Value / Buy Later</span>
                                </div>
                                <div className="bg-yellow-50/50 border-r border-gray-100 rounded-bl-xl flex p-4 items-end justify-start">
                                    <span className="text-yellow-700 font-bold uppercase tracking-widest text-[10px]">Low Value / Buy Now</span>
                                </div>
                                <div className="bg-blue-50/50 rounded-br-xl flex p-4 items-end justify-end">
                                    <span className="text-[#0077C8] font-bold uppercase tracking-widest text-[10px]">Star Customers</span>
                                </div>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="Propensity"
                                        domain={[0, 100]}
                                        label={{ value: "Propensity to Purchase (Now vs Later)", position: 'bottom', offset: 20, fill: '#6B7280', fontSize: 10, fontWeight: 700, textAnchor: 'middle' }}
                                        tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }}
                                        axisLine={{ stroke: '#E5E7EB' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Value"
                                        domain={[0, 100]}
                                        label={{ value: "Potential Customer Value", angle: -90, position: 'left', offset: 20, fill: '#6B7280', fontSize: 10, fontWeight: 700, textAnchor: 'middle' }}
                                        tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }}
                                        axisLine={{ stroke: '#E5E7EB' }}
                                        tickLine={false}
                                    />
                                    <ZAxis type="number" range={[150, 600]} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3', stroke: '#9CA3AF' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white p-5 rounded-2xl shadow-2xl border border-blue-100 max-w-xs animate-fadeIn">
                                                        <p className="font-black text-heading mb-1 text-lg">{data.name}</p>
                                                        <p className="text-xs text-subtext font-bold mb-4 uppercase tracking-widest">{data.segment}</p>
                                                        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                <span className="text-[10px] text-subtext font-black block uppercase tracking-tighter">Propensity</span>
                                                                <span className="font-black text-[#0077C8] text-lg">{data.x}</span>
                                                            </div>
                                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                <span className="text-[10px] text-subtext font-black block uppercase tracking-tighter">Growth</span>
                                                                <span className="font-black text-purple-600 text-lg">{data.y}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-heading italic bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 leading-relaxed font-medium">"{data.reason}"</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Audiences" data={data} fill="#3F47E9">
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.x > 50 && entry.y > 50 ? '#10B981' : entry.x > 50 ? '#F59E0B' : entry.y > 50 ? '#3B82F6' : '#EF4444'}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setHoveredPersona(scoredPersonas[index])}
                                                style={{ outline: 'none' }}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Details Panel */}
                    <div className="content-card flex flex-col h-[600px] overflow-hidden">
                        <h3 className="section-header mb-4">Segment Details</h3>

                        {hoveredPersona ? (
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar animate-fadeIn">
                                <div className="text-center mb-8">
                                    <div className="w-28 h-28 rounded-2xl mx-auto mb-4 border-4 border-white shadow-xl overflow-hidden relative rotate-1 hover:rotate-0 transition-transform duration-300">
                                        {hoveredPersona.imageUrl ? (
                                            <img src={hoveredPersona.imageUrl} alt={hoveredPersona.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[#0077C8]">
                                                <Users size={32} />
                                            </div>
                                        )}
                                        <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm ${(hoveredPersona.score?.propensity || 0) > 50 ? 'bg-green-500' : 'bg-yellow-500'
                                            }`}></div>
                                    </div>
                                    <h4 className="text-2xl font-black text-heading leading-tight">{hoveredPersona.personaName}</h4>
                                    <p className="text-subtext font-bold text-sm uppercase tracking-widest mt-1">{hoveredPersona.name}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-black text-subtext uppercase tracking-widest">Sentiment Analysis</span>
                                        </div>
                                        <p className="text-sm text-heading leading-relaxed font-medium">
                                            {hoveredPersona.score?.reason}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-center shadow-sm">
                                            <span className="text-[10px] text-[#0077C8] font-black block mb-1 uppercase tracking-tighter">Propensity</span>
                                            <span className="text-3xl font-black text-[#0077C8]">{hoveredPersona.score?.propensity}</span>
                                        </div>
                                        <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-center shadow-sm">
                                            <span className="text-[10px] text-purple-700 font-black block mb-1 uppercase tracking-tighter">Value Index</span>
                                            <span className="text-3xl font-black text-purple-700">{hoveredPersona.score?.value}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="font-black text-[10px] uppercase text-subtext mb-3 tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#0077C8]" />
                                            Key Engagement Drivers
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {hoveredPersona.details?.goals.slice(0, 3).map((goal, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-xs text-heading font-bold shadow-sm">
                                                    {goal}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-subtext text-center p-8 bg-gray-50/30 border-2 border-dashed border-gray-100 rounded-2xl m-2">
                                <Info size={56} className="mb-6 opacity-10 text-[#0077C8]" />
                                <h4 className="font-bold text-heading mb-2">Select a Persona</h4>
                                <p className="text-sm font-medium leading-relaxed">Click on a node in the matrix to view detailed growth potential and propensity analysis for that segment.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
