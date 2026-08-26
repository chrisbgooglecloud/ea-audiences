import React, { useState, useEffect } from 'react';
import { Users, FileText, Globe, ArrowRight, RotateCcw, Download, Music, ArrowLeft, User, Volume2 } from 'lucide-react';
import { generateFinancialGuideData } from '../services/geminiService';
import { useCompanyContext } from '../context/CompanyContext';
import { brandConfig } from '../config';

export const GenSiteStub: React.FC = () => {
    const { name: companyName, description } = useCompanyContext();
    const [sampleData, setSampleData] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [step, setStep] = useState(1); // 1: List, 2: Loading, 3: Preview
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any>(null);
    const [generatedHtml, setGeneratedHtml] = useState<string>("");
    const [lastRun, setLastRun] = useState<any>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [status, setStatus] = useState("");

    // Load data and last run on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const sampleRes = await fetch('/data/configuration/microsite_sample_data.json');
                if (sampleRes.ok) setSampleData(await sampleRes.json());
                
                const runRes = await fetch('/api/load-run/gensite');
                if (runRes.ok) {
                    const data = await runRes.json();
                    if (data) setLastRun(data);
                }
            } catch (error) {
                console.warn("Failed to load GenSite initial data:", error);
            }
        };
        loadData();
    }, []);

    const handleGeneratePage = async (customer: any) => {
        setSelectedCustomer(customer);
        setStep(2);
        setIsGenerating(true);
        setStatus("1/3: Asking Gemini for tailored financial guide data...");
        try {
            // 1. Call Gemini Service
            const guideData = await generateFinancialGuideData(customer, companyName);
            
            setStatus("2/3: Constructing personalized HTML...");
            // 2. Construct HTML
            const html = constructHtml(customer, guideData);
            
            setGeneratedHtml(html);
            setGeneratedContent(guideData);
            setStep(3);
            
            setStatus("3/3: Saving session...");
            // 3. Save Run
            fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureId: 'gensite', data: { customer, guideData, html, step: 3 } })
            }).catch(console.error);
            
        } catch (error) {
            console.error("Generation failed", error);
            alert("Failed to generate page.");
            setStep(1);
        } finally {
            setIsGenerating(false);
            setStatus("");
        }
    };

    const handleLoadLast = () => {
        if (lastRun) {
            setSelectedCustomer(lastRun.customer);
            setGeneratedContent(lastRun.guideData);
            setGeneratedHtml(lastRun.html);
            setStep(3);
        } else {
            alert("No previous run found.");
        }
    };

    const constructHtml = (customer: any, guideData: any) => {
        // USAA Colors: Primary: #FFFFFF, Accent: #13395B (Dark Blue)
        
        return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${companyName} - Financial Guide</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; }
            </style>
          </head>
          <body class="bg-gray-50 text-gray-900">
            <!-- Navigation -->
            <nav class="bg-white border-b border-gray-100 py-4">
                <div class="max-w-6xl mx-auto px-4 flex justify-between items-center">
                    <div class="font-bold text-2xl text-[#13395B]">${companyName}</div>
                </div>
            </nav>
    
            <!-- Hero Section -->
            <header class="relative bg-white overflow-hidden py-16 border-b border-gray-100">
                <div class="relative max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#13395B] text-sm font-semibold mb-6">
                            Intelligent Guide for ${customer.name}
                        </div>
                        <h1 class="text-4xl md:text-5xl font-black tracking-tight text-gray-900 mb-6 leading-tight">
                            ${guideData.headline}
                        </h1>
                        <p class="text-xl text-gray-600 mb-8 leading-relaxed">
                            ${guideData.subheadline}
                        </p>
                        <div class="bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6 rounded-2xl mb-8 shadow-sm">
                            <div class="flex items-center gap-2 mb-3 text-[#13395B] font-bold text-xs uppercase tracking-widest">
                                AI Executive Summary
                            </div>
                            <p class="text-gray-800 leading-relaxed text-sm font-medium">
                                ${guideData.generativeSummary}
                            </p>
                        </div>
                    </div>
                    <!-- Chart Placeholder -->
                    <div class="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                        <h3 class="font-bold text-gray-900 mb-6 text-xl">${guideData.charts?.[0]?.title || 'Asset Allocation'}</h3>
                        <div class="space-y-4">
                            ${guideData.charts?.[0]?.labels.map((label: string, i: number) => `
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span>${label}</span>
                                        <span class="font-bold">${guideData.charts[0].data[i]}%</span>
                                    </div>
                                    <div class="w-full bg-gray-100 rounded-full h-2">
                                        <div class="bg-[#13395B] h-2 rounded-full" style="width: ${guideData.charts[0].data[i]}%"></div>
                                    </div>
                                </div>
                            `).join('') || 'No data'}
                        </div>
                    </div>
                </div>
            </header>
    
            <!-- Content Sections -->
            <main class="max-w-6xl mx-auto px-4 py-16 space-y-16">
                <!-- Strategies -->
                <section>
                    <h2 class="text-2xl font-bold mb-6 text-gray-900">Recommended Strategies</h2>
                    <div class="grid md:grid-cols-2 gap-6">
                        ${guideData.recommended_strategies?.map((strat: any) => `
                            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 class="font-bold text-lg mb-2">${strat.name}</h3>
                                <p class="text-gray-600 text-sm mb-4">${strat.description}</p>
                                <button class="text-[#13395B] font-semibold text-sm hover:underline">${strat.action}</button>
                            </div>
                        `).join('') || 'No strategies'}
                    </div>
                </section>

                <!-- Products -->
                <section>
                    <h2 class="text-2xl font-bold mb-6 text-gray-900">Tailored Products</h2>
                    <div class="grid md:grid-cols-3 gap-6">
                        ${guideData.products?.map((prod: any) => {
                            const encodedProd = encodeURIComponent(prod.name);
                            const isBlackRock = companyName.toLowerCase() === 'blackrock';
                            const dynamicUrl = isBlackRock 
                                ? `https://www.blackrock.com/us/individual/search/summary-results?searchText=${encodedProd}&doTickerSearch=true` 
                                : `/search?q=${encodedProd}`;
                                
                            return `
                            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                <h3 class="font-bold text-lg mb-2">${prod.name}</h3>
                                <p class="text-gray-600 text-sm mb-4 flex-1">${prod.description}</p>
                                <a href="${dynamicUrl}" target="_blank" class="w-full text-center bg-[#13395B] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#0d2840] transition-colors inline-block">${prod.action}</a>
                            </div>
                            `;
                        }).join('') || 'No products'}
                    </div>
                </section>

                <!-- Reading Material -->
                <section>
                    <h2 class="text-2xl font-bold mb-6 text-gray-900">Recommended Reading</h2>
                    <div class="grid md:grid-cols-2 gap-6">
                        ${guideData.reading_material?.map((article: any) => {
                            const encodedTitle = encodeURIComponent(article.title);
                            const isBlackRock = companyName.toLowerCase() === 'blackrock';
                            const dynamicUrl = isBlackRock 
                                ? `https://www.blackrock.com/us/individual/search/summary-results?searchText=${encodedTitle}&doTickerSearch=true` 
                                : article.url;
                                
                            return `
                            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <h3 class="font-bold text-lg mb-2">${article.title}</h3>
                                <p class="text-gray-600 text-sm mb-4">${article.summary}</p>
                                <a href="${dynamicUrl}" target="_blank" class="text-[#13395B] font-semibold text-sm hover:underline">Read Article</a>
                            </div>
                            `;
                        }).join('') || 'No articles'}
                    </div>
                </section>
            </main>
          </body>
          </html>
        `;
    };

    const handleGenerateAudio = async () => {
        if (!generatedContent?.generativeSummary) return;
        setStatus("Generating audio summary...");
        try {
            // Simulate audio generation or call API
            setTimeout(() => {
                alert("Audio summary generated! (Simulated)");
                setStatus("");
            }, 2000);
        } catch (error) {
            console.error("Audio generation failed", error);
            setStatus("");
        }
    };

    const handleDownloadHtml = () => {
        if (!generatedHtml) return;
        const blob = new Blob([generatedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedCustomer?.name.replace(/\s+/g, '_')}_guide.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-header">Personalized Site</h2>
            </div>

            {step > 1 && !isGenerating && (
                <button
                    onClick={() => { setStep(1); setGeneratedHtml(""); setGeneratedContent(null); }}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold mb-6 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to List
                </button>
            )}

            {step === 1 && (
                <div className="content-card p-8 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 font-bold mb-1 flex items-center gap-2">
                            <Users size={20} className="text-[#0077C8]" /> Select Customer Profile
                        </h3>
                        <div className="flex gap-4">
                            <button onClick={handleLoadLast} className="btn-ghost flex items-center gap-2">
                                <RotateCcw size={16} /> Load Last
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Segment</th>
                                    <th>Location</th>
                                    <th>Interests</th>
                                    <th>Channel</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sampleData.map((customer, idx) => (
                                    <tr key={idx}>
                                        <td className="font-medium text-gray-900">{customer.name}</td>
                                        <td><span className="badge badge-blue">{customer.condition}</span></td>
                                        <td className="text-sm text-gray-500">{customer.location}</td>
                                        <td className="text-sm text-gray-500 max-w-xs truncate">{customer.Browse_history}</td>
                                        <td><span className="badge badge-gray">{customer.topChannel}</span></td>
                                        <td>
                                            <button 
                                                onClick={() => handleGeneratePage(customer)}
                                                className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
                                            >
                                                Generate Page <ArrowRight size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="content-card p-12 text-center animate-fadeIn">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#0077C8] border-t-transparent mb-4"></div>
                    <p className="text-lg font-medium text-gray-500 animate-pulse">{status}</p>
                </div>
            )}

            {step === 3 && generatedHtml && (
                <div className="animate-fadeIn">
                    {/* Main Content (Iframe) */}
                    <div className="content-card p-0 overflow-hidden flex flex-col h-[800px]">
                        <div className="bg-gray-100 p-2 border-b border-gray-200 flex gap-2 items-center">
                            <div className="flex gap-1.5 ml-2">
                                <div className="w-3 h-3 rounded-full bg-red-400/60"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400/60"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400/60"></div>
                            </div>
                            <div className="flex-1 bg-white mx-4 py-1 px-3 rounded text-xs text-center text-gray-500 font-mono border border-gray-200 shadow-inner">
                                ${companyName.toLowerCase().replace(/\s+/g, '')}.com/personalized/${selectedCustomer?.name.toLowerCase().replace(/\s+/g, '_')}
                            </div>
                        </div>
                        <iframe
                            srcDoc={generatedHtml}
                            className="w-full flex-1 border-none"
                            title="Generated Site"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
