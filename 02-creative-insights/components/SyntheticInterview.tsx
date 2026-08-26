
import React, { useState, useEffect, useRef } from 'react';
import { User, X, MessageSquare, Send, Loader2, Bot, Briefcase, Heart, TrendingUp, BarChart2, Star, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { generatePersonaChatResponse } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { brandConfig } from '../config';

interface SyntheticInterviewProps {
    persona: any;
    simulationResult: any;
    brief: any;
    onClose: () => void;
}

const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
    const parts = content.split(/(\*\*.*?\*\*|\n)/g);

    return (
        <span className="whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (part === '\n') return <br key={i} />;
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                if (part.trim().startsWith('- ') || part.trim().startsWith('* ')) {
                    return <span key={i} className="block pl-4 -indent-4 md:pl-0 md:indent-0">{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export const SyntheticInterview: React.FC<SyntheticInterviewProps> = ({ persona, simulationResult, brief, onClose }) => {
    const [messages, setMessages] = useState<{ role: 'user' | 'persona', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'persona',
                content: `Hi, I'm ${persona.name}. I've just reviewed your campaign for ${brief.productName || 'product'}. I gave it a score of ${simulationResult.conversionLikelihood || simulationResult.likelihoodToJoin}/100. asks me anything about my feedback!`
            }]);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            // Pass simulationResult as context
            const response = await generatePersonaChatResponse(persona, brief, userMessage, history, simulationResult);
            setMessages(prev => [...prev, { role: 'persona', content: response }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'persona', content: "I'm having trouble thinking right now. Could you repeat that?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to transform chart data if available
    const transformChartData = (chartData: { labels: string[], data: number[] }) => {
        if (!chartData) return [];
        return chartData.labels.map((label, i) => ({
            name: label,
            value: chartData.data[i]
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 md:p-8 backdrop-blur-sm">
            <div className="bg-[#111] rounded-3xl w-full max-w-7xl h-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300 border border-gray-800">
                
                {/* Close Button Mobile */}
                <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-50 bg-gray-800 p-2 rounded-full shadow-md text-white">
                    <X size={20} />
                </button>

                {/* Left Panel: Profile */}
                <div className="w-full md:w-1/4 bg-[#111] border-r border-gray-800 overflow-y-auto">
                    <div className="h-64 relative">
                        {persona.imageUrl ? (
                            <img src={persona.imageUrl} alt={persona.name} className="w-full h-full object-cover" />
                        ) : (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-400">
                                <User size={48} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 text-white">
                            <h2 className="text-2xl font-bold">{persona.name}</h2>
                            <p className="opacity-90">{persona.details?.job_title || persona.job_title}</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                                <Briefcase size={14} /> Profile
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-gray-900 p-2 rounded border border-gray-800">
                                    <span className="block text-gray-400 text-xs">Age</span>
                                    <span className="font-bold text-white">{persona.age}</span>
                                </div>
                                <div className="bg-gray-900 p-2 rounded border border-gray-800">
                                    <span className="block text-gray-400 text-xs">Income</span>
                                    <span className="font-bold text-white">{persona.details?.income || persona.income}</span>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-gray-300 leading-relaxed italic">
                                "{persona.details?.bio || persona.bio}"
                            </p>
                        </div>

                        {persona.details?.preferred_brands && (
                            <div>
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                                    <Heart size={14} className="text-red-500" /> Brands
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {persona.details.preferred_brands.map((b: string, i: number) => (
                                        <span key={i} className="text-xs bg-gray-900 border border-gray-800 px-2 py-1 rounded-full text-gray-300">{b}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {persona.details?.charts?.brand_affinity && (
                            <div>
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                                    <TrendingUp size={14} /> Brand Affinity
                                </h4>
                                <div className="h-32 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={transformChartData(persona.details.charts.brand_affinity)}>
                                            <Line type="monotone" dataKey="value" stroke="#3F47E9" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Panel: Simulation Results */}
                <div className="w-full md:w-1/4 bg-[#111] border-r border-gray-800 overflow-y-auto p-6">
                    <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2">
                        <BarChart2 className="text-[#3F47E9]" /> Result Summary
                    </h3>

                    {/* Creative Scores */}
                    {simulationResult.visualAppeal !== undefined && (
                        <div className="space-y-4 mb-8">
                            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-gray-300">Visual Appeal</span>
                                    <span className={`text-sm font-bold ${simulationResult.visualAppeal >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                                        {simulationResult.visualAppeal}/100
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div className="bg-[#3F47E9] h-2 rounded-full" style={{ width: `${simulationResult.visualAppeal}%` }}></div>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-gray-300">Brand Fit</span>
                                    <span className={`text-sm font-bold ${simulationResult.brandFit >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                                        {simulationResult.brandFit}/100
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div className="bg-[#3F47E9] h-2 rounded-full" style={{ width: `${simulationResult.brandFit}%` }}></div>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold text-gray-300">Stopping Power</span>
                                    <span className={`text-sm font-bold ${simulationResult.stoppingPower >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
                                        {simulationResult.stoppingPower}/100
                                    </span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2">
                                    <div className="bg-[#3F47E9] h-2 rounded-full" style={{ width: `${simulationResult.stoppingPower}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    <div className="mb-6">
                        <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wider">Initial Reaction</h4>
                        <div className="bg-[#2a1a1a] p-4 rounded-xl text-gray-200 text-sm leading-relaxed border border-red-900/30 relative">
                            <span className="absolute top-2 left-2 text-4xl text-red-500/20 font-serif leading-none">“</span>
                            <p className="relative z-10">{simulationResult.feedback}</p>
                        </div>
                    </div>

                    {/* Suggestions */}
                    {(simulationResult.suggestedMessaging || simulationResult.suggestedImage) && (
                        <div>
                            <h4 className="font-bold text-white mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Star size={14} className="text-yellow-500" /> Optimization Idea
                            </h4>
                            <div className="space-y-3">
                                {simulationResult.suggestedMessaging && (
                                    <div className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-900/30 text-sm">
                                        <p className="text-yellow-200 italic">"{simulationResult.suggestedMessaging}"</p>
                                     </div>
                                )}
                                {simulationResult.suggestedImage && (
                                    <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 text-sm">
                                        <p className="text-gray-300 italic">"{simulationResult.suggestedImage}"</p>
                                     </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Chat */}
                <div className="flex-1 flex flex-col bg-black">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#111]">
                        <div>
                            <h3 className="font-bold text-lg text-white">Deep Dive Interview</h3>
                            <p className="text-xs text-gray-500">AI Moderator Mode • {persona.name} is Online</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors hidden md:block text-gray-400">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                         {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                                        m.role === 'user' ? 'bg-[#3F47E9] text-white' : 'bg-gray-800 text-white'
                                    }`}>
                                        {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        m.role === 'user' 
                                        ? 'bg-[#3F47E9] text-white rounded-tr-none' 
                                         : 'bg-gray-900 text-gray-200 rounded-tl-none border border-gray-800'
                                    }`}>
                                        <FormattedMessage content={m.content} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-3 max-w-[80%]">
                                     <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center">
                                        <Bot size={16} />
                                    </div>
                                    <div className="bg-gray-900 text-gray-200 p-4 rounded-2xl rounded-tl-none border border-gray-800 shadow-sm">
                                        <Loader2 className="animate-spin text-gray-400" size={18} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-[#111] border-t border-gray-800">
                        <div className="flex gap-3">
                             <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask a follow-up question..."
                                className="flex-1 input-field"
                                disabled={isLoading}
                            />
                            <button 
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className={`text-white p-3 rounded-xl disabled:opacity-50 transition-colors btn-primary`}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
