import React, { useState } from 'react';
import { generateMarketingCampaignAssets, MarketingAssets } from '@/services/geminiService';
import { brandConfig } from '@/config';
import { Image, Search, Mail, Youtube, Share2, Globe, ThumbsUp, MessageCircle } from 'lucide-react';
import { useCompanyContext } from '@/context';

export const MarketingCampaign: React.FC = () => {
    const [product, setProduct] = useState("Product Name");
    const { name } = useCompanyContext();
    const AUDIENCES = ["The Plan Skeptic", "The Health Enthusiast", "The Budget-Conscious Family"];
    const [selectedAudience, setSelectedAudience] = useState<string>(AUDIENCES[0]);
    const [assetsMap, setAssetsMap] = useState<Record<string, MarketingAssets> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'social' | 'search' | 'email' | 'youtube' | 'website'>('social');

    const currentAssets = assetsMap ? assetsMap[selectedAudience] : null;

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            const newMap: Record<string, MarketingAssets> = {};
            for (const aud of AUDIENCES) {
                const result = await generateMarketingCampaignAssets(product, aud);
                newMap[aud] = result;
            }
            setAssetsMap(newMap);
        } catch (error) {
            console.error(error);
            alert("Failed to generate campaign assets.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-Save Effect
    React.useEffect(() => {
        if (assetsMap) {
            fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    featureId: 'marketing_campaign',
                    data: { product, assetsMap }
                })
            }).catch(e => console.error("Save failed", e));
        }
    }, [product, assetsMap]);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-header">Marketing Campaign Builder</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="content-card">
                        <label className="form-label">Product Name</label>
                        <input
                            type="text"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            className="input-field mb-4"
                            placeholder="e.g. Your Product"
                        />

                        <label className="form-label">Target Audiences</label>
                        <div className="w-full border border-gray-800 bg-black/40 rounded-lg px-4 py-3 mb-6 text-sm text-gray-400 space-y-2">
                            <p className="font-semibold text-gray-200">Campaigns will be generated for:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>The Plan Skeptic</li>
                                <li>The Health Enthusiast</li>
                                <li>The Budget-Conscious Family</li>
                            </ul>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={async () => {
                                    setIsLoading(true);
                                    try {
                                        const res = await fetch('/api/load-run/marketing_campaign');
                                        if (!res.ok) throw new Error("No saved run");
                                        const data = await res.json();
                                        if (data.product) setProduct(data.product);
                                        if (data.assetsMap) setAssetsMap(data.assetsMap);
                                    } catch (e) {
                                        console.warn("Load error:", e);
                                        alert("No saved campaign found.");
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                                className="flex-1 btn-secondary text-sm py-3"
                            >
                                Load Last
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className={`flex-[2] btn-primary py-3 rounded-lg font-bold`}
                            >
                                {isLoading ? "Generating..." : "Create Campaign"}
                            </button>
                        </div>
                    </div>

                    {/* Tips / Status */}
                    <div className="bg-red-900/20 p-4 rounded-lg text-sm text-red-200 border border-red-900/50">
                        <p className="font-semibold mb-1">Pro Tip:</p>
                        <p>Be specific with your audience to get better targeted copy and imagery.</p>
                    </div>
                </div>

                {/* Right Column: Preview Dashboard */}
                <div className="lg:col-span-2">
                    <div className="content-card p-0 overflow-hidden min-h-[600px] flex flex-col">

                        {/* Tabs */}
                        <div className="flex border-b border-gray-800 bg-black overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('social')}
                                className={`flex-1 py-4 px-2 text-sm font-medium flex items-center justify-center gap-2 min-w-[80px] transition-colors ${activeTab === 'social' ? 'bg-[#111] text-red-500 border-t-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Share2 size={18} /> Social
                            </button>
                            <button
                                onClick={() => setActiveTab('search')}
                                className={`flex-1 py-4 px-2 text-sm font-medium flex items-center justify-center gap-2 min-w-[80px] transition-colors ${activeTab === 'search' ? 'bg-[#111] text-red-500 border-t-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Search size={18} /> Search
                            </button>
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`flex-1 py-4 px-2 text-sm font-medium flex items-center justify-center gap-2 min-w-[80px] transition-colors ${activeTab === 'email' ? 'bg-[#111] text-red-500 border-t-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Mail size={18} /> Email
                            </button>
                            <button
                                onClick={() => setActiveTab('youtube')}
                                className={`flex-1 py-4 px-2 text-sm font-medium flex items-center justify-center gap-2 min-w-[80px] transition-colors ${activeTab === 'youtube' ? 'bg-[#111] text-red-500 border-t-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Youtube size={18} /> YouTube
                            </button>
                            <button
                                onClick={() => setActiveTab('website')}
                                className={`flex-1 py-4 px-2 text-sm font-medium flex items-center justify-center gap-2 min-w-[80px] transition-colors ${activeTab === 'website' ? 'bg-[#111] text-red-500 border-t-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Globe size={18} /> Website
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-8 bg-gray-900 flex items-center justify-center overflow-y-auto max-h-[800px]">
                            {isLoading ? (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Creating assets across channels...</p>
                                </div>
                            ) : !currentAssets ? (
                                    <div className="text-center text-gray-500">
                                    <Image size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Enter details and click generate to see the campaign.</p>
                                </div>
                            ) : (
                                <div className="w-full max-w-lg flex flex-col items-center">
                                    {/* Audience Toggle */}
                                            <div className="flex bg-[#111] rounded-full p-1 mb-6 shadow-sm border border-gray-800">
                                        {AUDIENCES.map((aud) => (
                                            <button
                                                key={aud}
                                                onClick={() => setSelectedAudience(aud)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                                                    selectedAudience === aud
                                                    ? 'bg-white text-black shadow-md'
                                                    : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                {aud}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Social Media Preview */}
                                    {activeTab === 'social' && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="p-3 flex items-center gap-3 border-b border-gray-100">
                                                        <div className="w-8 h-8 bg-red-600 rounded-full"></div>
                                                        <p className="font-bold text-sm">{brandConfig.companyName}</p>
                                            </div>
                                            <div className="aspect-square bg-gray-100">
                                                {currentAssets.image ? (
                                                    <img src={currentAssets.image} alt="Campaign" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">Image Failed</div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                        <div className="flex gap-4 mb-3">
                                                            <div className="w-6 h-6 rounded-full border border-gray-300"></div>
                                                            <div className="w-6 h-6 rounded-full border border-gray-300"></div>
                                                            <div className="w-6 h-6 rounded-full border border-gray-300"></div>
                                                        </div>
                                                <p className="text-sm text-gray-800 mb-2">
                                                            <span className="font-bold mr-2">{brandConfig.companyName}</span>
                                                    {currentAssets.social.caption}
                                                </p>
                                                <p className="text-black text-sm">
                                                    {currentAssets.social.hashtags.join(' ')}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Search Ad Preview */}
                                    {activeTab === 'search' && (
                                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 w-full">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-black text-sm">Ad</span>
                                                <span className="text-gray-500 text-xs">·</span>
                                                <span className="text-gray-500 text-xs">{currentAssets.search.url}</span>
                                            </div>
                                            <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium mb-2">
                                                {currentAssets.search.headline}
                                            </h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {currentAssets.search.description}
                                            </p>

                                            <div className="mt-6 pt-6 border-t border-gray-100">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Campaign Image Asset</h4>
                                                <div className="h-32 w-48 bg-white rounded-lg overflow-hidden border border-gray-200">
                                                    {currentAssets.image && <img src={currentAssets.image} className="w-full h-full object-contain" />}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email Preview */}
                                    {activeTab === 'email' && (
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
                                            <div className="bg-gray-50 p-3 border-b border-gray-200 text-xs text-gray-500 flex justify-between">
                                                        <span>From: {brandConfig.companyName} &lt;updates@{brandConfig.companyName.replace(/\s+/g, '').toLowerCase()}.com&gt;</span>
                                                <span>Just now</span>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-bold text-lg text-gray-900 mb-1">{currentAssets.email.subject}</h3>
                                                <p className="text-gray-500 text-sm mb-6">{currentAssets.email.preheader}</p>

                                                <div className="border-t border-gray-100 pt-6">
                                                    {currentAssets.image && (
                                                        <img src={currentAssets.image} className="w-full h-auto max-h-80 object-contain rounded-lg mb-6 bg-gray-50" />
                                                    )}
                                                    <p className="text-gray-800 text-sm leading-relaxed mb-6">
                                                        {currentAssets.email.body}
                                                    </p>
                                                            <button className={`w-full py-3 rounded-full font-bold text-sm bg-black text-white hover:bg-gray-800 transition-colors`}>
                                                        Shop Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* YouTube Shorts Preview */}
                                    {activeTab === 'youtube' && (
                                        <div className="bg-black rounded-2xl shadow-xl overflow-hidden relative aspect-[9/16] w-full max-w-[340px] max-h-[600px] mx-auto">
                                            {currentAssets.image && (
                                                <img src={currentAssets.image} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>

                                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                                <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-xs text-black">Q</div>
                                                            <span className="font-bold text-sm">@{brandConfig.companyName.replace(/\s+/g, '').toLowerCase()}</span>
                                                    <button className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full">Subscribe</button>
                                                </div>
                                                <p className="text-sm mb-2 font-bold">{currentAssets.youtube.title}</p>
                                                <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 mb-4 border border-white/10">
                                                    <p className="text-xs text-white/90 font-mono">SCRIPT:</p>
                                                    <p className="text-xs italic text-white/80">{currentAssets.youtube.script}</p>
                                                </div>
                                                        <button className={`w-full py-3 rounded-lg font-bold text-sm bg-white text-black hover:bg-gray-200 transition-colors`}>
                                                    Shop Now
                                                </button>
                                            </div>

                                            {/* UI Icons Overlay */}
                                            <div className="absolute right-2 bottom-24 flex flex-col gap-6 items-center">
                                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <ThumbsUp size={24} className="text-white fill-white/20" />
                                                </div>
                                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <MessageCircle size={24} className="text-white fill-white/20" />
                                                </div>
                                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <Share2 size={24} className="text-white fill-white/20" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Website Preview */}
                                    {activeTab === 'website' && (
                                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full w-full">
                                            {/* Fake Nav */}
                                                    <div className={`bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4 shrink-0`}>
                                                        <div className="text-black font-bold text-xl tracking-tighter italic">{name || 'Brand'}</div>
                                                        <div className="h-9 bg-gray-100 rounded-full w-full max-w-md mx-auto flex items-center px-4 text-gray-500 text-xs font-medium">
                                                            <Search size={14} className="mr-2" /> Search
                                                        </div>
                                                        <div className="text-gray-800 text-xs font-bold flex items-center gap-4">
                                                            <span className="hidden sm:inline">Help</span>
                                                            <span className="hidden sm:inline">Join Us</span>
                                                            <span>Sign In</span>
                                                        </div>
                                            </div>

                                                    <div className="p-6 flex-1 overflow-y-auto">
                                                        {/* Main Product Hero */}
                                                        <div className="flex flex-col sm:flex-row gap-8 mb-8">
                                                            {/* Image Container */}
                                                            <div className="w-full sm:w-1/2 aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center relative group">
                                                                {currentAssets.image ? (
                                                                    <img
                                                                        src={currentAssets.image}
                                                                        alt={product}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                    />
                                                                ) : (
                                                                    <div className="text-gray-400 text-sm font-medium">Product Image</div>
                                                                )}
                                                            </div>

                                                            {/* Product Details */}
                                                            <div className="w-full sm:w-1/2 flex flex-col justify-center">
                                                                <div className="text-orange-600 text-xs font-bold mb-2">Highly Rated</div>
                                                                <h1 className="text-3xl font-black text-gray-900 leading-none tracking-tight mb-2">{product}</h1>
                                                                <h2 className="text-lg text-gray-500 font-medium mb-4">Men's Road Racing Shoes</h2>
                                                                
                                                                <div className="mb-6">
                                                                    <span className="text-2xl font-medium text-gray-900">$160.00</span>
                                                                </div>

                                                                <p className="text-base text-gray-800 mb-8 leading-relaxed">
                                                                    {currentAssets.search?.description || "Innovation that changes athletes' lives."}
                                                                </p>

                                                                <div className="space-y-3">
                                                                    <button className={`w-full bg-black text-white hover:bg-gray-800 py-4 rounded-full font-bold text-sm transition-colors`}>
                                                                        Add to Bag
                                                                    </button>
                                                                    <button className="w-full bg-white border border-gray-300 text-gray-900 py-4 rounded-full font-bold text-sm hover:border-black transition-colors">
                                                                        Favorite
                                                                    </button>
                                                                </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
