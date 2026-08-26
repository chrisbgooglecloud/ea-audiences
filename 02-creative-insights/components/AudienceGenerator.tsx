import React, { useState } from 'react';
import { generateAudienceSegments, generateImage, generateImageFromPrompt, generateSyntheticPersona } from '../services/geminiService';
import { brandConfig } from '../config';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, BarChart2, DollarSign, Briefcase, Heart, RotateCcw, ArrowLeft, Shield, Upload, FileText, Download, Settings, X } from 'lucide-react';
import { CombinedPersona, DetailedPersona, formatTouchpointLabel } from '../types';
import { useCompanyContext } from '../context/CompanyContext';
import { useAppConfig } from '../context/AppConfigContext';
import { SyntheticUsers } from './SyntheticUsers';

// Helper to parse CSV text into JSON objects
const parseCSV = (csvText: string) => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    // Basic CSV split, ignores commas inside quotes
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    return headers.reduce((obj: any, header, index) => {
      let val = values[index] ? values[index].trim() : '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      obj[header] = val;
      return obj;
    }, {});
  });
};

const SAMPLE_CUSTOMER_DATA = [
  { name: 'Maya Lin', location: 'Columbus, OH', Browse_history: 'Warm Gourmand Scents, Foaming Hand Soap', topChannel: 'Email', condition: 'Gourmand Enthusiast', observations: 'Frequently browses seasonal pumpkin and vanilla collections. Consistent multi-item cart builder with high responsiveness to email promos.' },
  { name: 'Marcus Vance', location: 'Chicago, IL', Browse_history: 'Woodsy Cologne Scents, Wallflowers Refills', topChannel: 'Mobile App', condition: 'Premium Fragrance Buyer', observations: 'Regularly replenishes Mahogany Teakwood 3-wick candles and Wallflowers refills across seasonal transitions.' },
  { name: 'Elena Rostova', location: 'Denver, CO', Browse_history: 'Aromatherapy Stress Relief, Body Scrubs', topChannel: 'SMS', condition: 'Self-Care Ritualist', observations: 'Engages with evening wind-down routines and eucalyptus aromatherapy lines with fast SMS promotion conversions.' },
  { name: 'Chloe Bennett', location: 'Austin, TX', Browse_history: 'Fruity Florals, Champagne Toast Mists', topChannel: 'Web', condition: 'Trend Sensitive', observations: 'Discovers viral fragrance mists and pocket sanitizers through social channels, building impulse gift baskets.' },
  { name: 'David Miller', location: 'Indianapolis, IN', Browse_history: 'Clean Kitchen Lemon, Hand Care Gift Sets', topChannel: 'Web', condition: 'Family Replenisher', observations: 'Bulk-purchases foaming hand soap bundles for family home use during promotional stock-up events.' }
];

interface AudienceGeneratorProps {
  personas: CombinedPersona[];
  setPersonas: React.Dispatch<React.SetStateAction<CombinedPersona[]>>;
}

export const AudienceGenerator: React.FC<AudienceGeneratorProps> = ({ personas, setPersonas }) => {
  const { name, description } = useCompanyContext();
  const { config } = useAppConfig();
  const companyName = config?.branding.companyName || name || 'AI Lab';

  const [activeTab, setActiveTab] = useState<'generator' | 'synthetic_users'>('generator');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [audienceTargets, setAudienceTargets] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customerData, setCustomerData] = useState<any[]>(SAMPLE_CUSTOMER_DATA);

  React.useEffect(() => {
    const loadStitchedProfiles = async () => {
      try {
        const res = await fetch(`/api/load-run/ingestion_engine?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
          const runData = await res.json();
          if (runData.stitchedProfiles && runData.stitchedProfiles.length > 0) {
            const mappedData = runData.stitchedProfiles.map((p: any) => {
              const lastTouches = p.touchpoints ? p.touchpoints.map((t: any) => formatTouchpointLabel(t.label, t.action)).slice(-2).join(' • ') : '';
              return {
                name: p.name,
                location: p.id?.startsWith('guest_') ? 'Active Anonymous Guest' : 'Resolved Customer Account',
                Browse_history: p.intentScores?.categoryAffinity || 'General Browse',
                topChannel: p.channelPreference || 'Web',
                condition: p.behavioralTags ? p.behavioralTags.join(', ') : 'Active Browser',
                observations: p.observations || (p.intentScores?.purchaseIntentReason ? `${p.intentScores.purchaseIntentReason} ${p.intentScores.churnRiskReason || ''}` : lastTouches),
                recentActivity: p.observations || lastTouches
              };
            });
            setCustomerData(mappedData);
            return;
          }
        }
        
        // Fallback to sample data
        const sampleRes = await fetch('/data/configuration/microsite_sample_data.json');
        if (sampleRes.ok) {
          const data = await sampleRes.json();
          if (data && data.length > 0) {
            setCustomerData(data);
          }
        }
      } catch (err) {
        console.warn("Failed to load customer profiles, using fallback sample data", err);
        setCustomerData(SAMPLE_CUSTOMER_DATA);
      }
    };
    loadStitchedProfiles();
  }, [companyName]);

  React.useEffect(() => {
    if (personas.length > 0 || audienceTargets.trim() !== "") {
      fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'audience_generator',
          data: { personas, context: description, audienceTargets }
        })
      }).catch(err => console.error("Failed to save audience run:", err));
    }
  }, [personas, description, audienceTargets]);

  React.useEffect(() => {
    handleLoadStrategy();
  }, []);

  const handleSaveStrategy = async () => {
    try {
      await fetch('/api/audience-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audienceTargets })
      });
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Failed to save strategy:", error);
      alert("Failed to save strategy.");
    }
  };

  const handleLoadStrategy = async () => {
    try {
      const res = await fetch('/api/audience-strategy');
      if (res.ok) {
        const data = await res.json();
        if (data.audienceTargets) {
          setAudienceTargets(data.audienceTargets);
        }
      }
    } catch (error) {
      console.error("Failed to load strategy:", error);
    }
  };

  const handleLoadLast = async () => {
    setIsLoading(true);
    setLoadingStep("Loading previous session...");
    try {
      const res = await fetch('/api/load-run/audience_generator');
      if (!res.ok) throw new Error("No saved run found");
      const data = await res.json();

      if (data.audienceTargets) {
        setAudienceTargets(data.audienceTargets);
      }
      
      if (data.personas && data.personas.length > 0) {
        setPersonas(data.personas);
        setStep(2);
      }
    } catch (error) {
      console.warn(error);
      alert("No previous session found.");
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setPersonas([]);
    setLoadingStep("Identifying Key Member Segments...");

    try {
      const targetData = customerData.map(c => ({
        name: c.name,
        location: c.location,
        browsingHistory: c.Browse_history,
        preferredChannel: c.topChannel,
        inferredSegment: c.condition,
        aiJourneyObservations: c.observations || c.recentActivity
      }));
      let explicitContext = `${description}. Segment these customers into exactly three audiences based on the real customer telemetry and AI journey observations dataset: ${JSON.stringify(targetData)}`;
      
      if (audienceTargets.trim()) {
        explicitContext += `\n\nCRITICAL AUDIENCE TARGET DEFINITIONS TO USE: ${audienceTargets}`;
      }

      const segments = await generateAudienceSegments(explicitContext);
      const initialPersonas = segments || [];

      setPersonas(initialPersonas);
      setStep(2);

      setLoadingStep("Generating Real AI Persona Portraits & Behavioral Insights...");

      for (let index = 0; index < initialPersonas.length; index++) {
        const seg = initialPersonas[index];
        try {
          // 1. Generate real photorealistic portrait headshot image
          setLoadingStep(`Generating Real AI Portrait for ${seg.personaName} (${index + 1}/${initialPersonas.length})...`);
          let realImageUrl = seg.imageUrl || '';
          try {
            const prompt = seg.imagePrompt || `Photorealistic portrait headshot of ${seg.personaName}, representative of demographic: ${seg.demographics || seg.name}, natural studio lighting, high quality portrait photography`;
            const generated = await generateImage(prompt, 'gemini-3.1-flash-lite-image', '1:1', `persona_${seg.personaName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, companyName);
            if (generated) {
              realImageUrl = generated;
            }
          } catch (imgErr) {
            console.warn(`Failed to generate real image for persona ${seg.personaName}:`, imgErr);
          }

          // 2. Generate detailed synthetic persona metrics & preferences
          setLoadingStep(`Analyzing Synthetic Insights for ${seg.personaName} (${index + 1}/${initialPersonas.length})...`);
          const details = await generateSyntheticPersona(seg.personaName, seg.name, explicitContext, seg.demographics);
          if (details) {
            // Use LLM generated products, ensure array and limit to 5
            details.preferred_products = (details.preferred_products || []).slice(0, 5);
          }

          setPersonas(prev => {
            const newP = [...prev];
            if (newP[index]) {
              newP[index] = { 
                ...newP[index], 
                imageUrl: realImageUrl || newP[index].imageUrl,
                details: details || newP[index].details
              };
            }
            return newP;
          });
        } catch (err) {
          console.error(`Error enhancing persona ${index}:`, err);
        }
      }
      setLoadingStep("");
    } catch (error) {
      console.error(error);
      alert("Failed to generate audiences.");
      setLoadingStep("");
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const transformChartData = (chartData: { labels: string[], data: number[] }) => {
    return chartData.labels.map((label, i) => ({
      name: label,
      value: chartData.data[i]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="page-header">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Users className="text-[#0077C8]" />
              <h1 className="page-title">Create Personas</h1>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-[#0077C8] transition-colors bg-white rounded-lg border border-gray-200 shadow-sm"
              title="Audience Settings"
            >
              <Settings size={20} />
            </button>
          </div>
          <p className="text-subtext mt-1">Preview member data and generate detailed {name} user personas.</p>
          
          <div className="tab-scroll-container mt-4">
            <button
              onClick={() => setActiveTab('generator')}
              className={`tab-button ${activeTab === 'generator' ? 'active' : 'inactive'}`}
            >
              <Users size={18} /> Generator
            </button>
            <button
              onClick={() => setActiveTab('synthetic_users')}
              className={`tab-button ${activeTab === 'synthetic_users' ? 'active' : 'inactive'}`}
            >
              <Users size={18} /> Synthetic Users
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">

      {activeTab === 'generator' && (
        <>
          {step === 1 && (
        <div className="content-card mb-12 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-heading">Member Data Preview</h3>
            <div className="flex gap-4 items-center">
              <button
                onClick={handleLoadLast}
                className="btn-ghost flex items-center gap-2"
                title="Replay last run"
                disabled={isLoading}
              >
                <RotateCcw size={16} /> Load Last
              </button>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    Processing...
                  </div>
                ) : "Generate Personas"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto mb-8 border border-gray-100 rounded-xl">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Recent Website Views</th>
                  <th>Preferred Channel</th>
                  <th>Inferred Segment</th>
                  <th>AI Journey Observations</th>
                </tr>
              </thead>
              <tbody>
                {customerData.map((customer, idx) => (
                  <tr key={idx}>
                    <td><span className="font-medium text-gray-900">{customer.name}</span></td>
                    <td>{customer.location || 'N/A'}</td>
                    <td>{customer.Browse_history || 'N/A'}</td>
                    <td><span className="badge badge-blue">{customer.topChannel || 'N/A'}</span></td>
                    <td><span className="badge badge-blue">{customer.condition || 'N/A'}</span></td>
                    <td className="text-xs text-gray-700 leading-relaxed max-w-md">{customer.observations || customer.recentActivity || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
            <h4 className="text-xs font-bold text-[#0077C8] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield size={14} /> Active Strategy Context
            </h4>
            <p className="text-sm text-gray-700 italic">
              "{description}"
            </p>
            <p className="mt-2 text-[10px] text-gray-400">
              Update this context via the gear icon in the sidebar.
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fadeIn">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 text-subtext hover:text-[#0077C8] font-semibold mb-6 transition-colors"
          >
            <ArrowLeft size={20} /> Back to Data
          </button>

          {isLoading && loadingStep && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#0077C8] border-t-transparent mb-4"></div>
              <p className="text-lg font-medium text-gray-500 animate-pulse">{loadingStep}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {personas.map((p, i) => (
              <div key={i} className="content-card p-0 overflow-hidden flex flex-col hover:border-[#0077C8] transition-colors">
                {/* Header / Image */}
                <div className="relative h-72 bg-gray-100 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover object-center block" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                      <div className="text-center">
                        <Users size={48} className="mx-auto mb-2 opacity-30" />
                        <span className="text-sm">Creating Portrait...</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="font-bold text-2xl mb-1">{p.name}</h3>
                    <p className="text-gray-200 font-medium text-sm bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md inline-block border border-white/10">
                      {p.details?.job_title || "Member Profile"}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 flex-1 bg-white">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-subtext text-xs uppercase font-bold mb-1">Age Group</p>
                      <p className="font-semibold text-heading">{p.details?.age || p.demographics?.split(',')[0] || "..."}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-subtext text-xs uppercase font-bold mb-1">Income Tier</p>
                      <p className="font-semibold text-heading">{p.details?.income || "..."}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h4 className="font-bold text-heading mb-2 flex items-center gap-2">
                      <Briefcase size={16} className="text-[#0077C8]" /> Lifestyle & Needs
                    </h4>
                    <p className="text-subtext text-sm leading-relaxed">
                      {p.details?.bio || p.bio}
                    </p>
                  </div>

                  {/* Preferred Products / Plans */}
                  {p.details?.preferred_products && (
                    <div>
                      <h4 className="font-bold text-heading mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Shield size={14} className="text-green-600" /> Recommended Products
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {p.details.preferred_products.map((product, idx) => (
                          <span key={idx} className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full font-bold border border-green-100">
                            {product}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lifestyle Tags */}
                  {p.details && (
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {p.details.lifestyle_tags.slice(0, 5).map((tag, idx) => (
                          <span key={idx} className="bg-blue-50 text-[#0077C8] text-xs px-3 py-1 rounded-full font-medium border border-blue-100">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Charts Section */}
                  {p.details?.charts?.brand_affinity && (
                    <div className="space-y-6 pt-6 border-t border-gray-100">
                      {/* Brand Affinity (Engagement) Chart */}
                      <div>
                        <h4 className="font-bold text-heading mb-3 flex items-center gap-2 text-sm">
                          <TrendingUp size={16} className="text-[#0077C8]" /> Engagement Score
                        </h4>
                        <div className="h-48 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={transformChartData(p.details.charts.brand_affinity)}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} domain={[0, 100]} />
                              <Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#111827' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0077C8' }}
                              />
                              <Line type="monotone" dataKey="value" stroke="#0077C8" strokeWidth={3} dot={{ r: 4, fill: '#0077C8' }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
      {activeTab === 'synthetic_users' && (
        <SyntheticUsers personas={personas} />
      )}
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0077C8]/10 rounded-lg text-[#0077C8]">
                  <Settings size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Audience Strategy</h2>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Audience Target Definitions</label>
                <textarea 
                  value={audienceTargets}
                  onChange={(e) => setAudienceTargets(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0077C8] focus:border-transparent transition-all outline-none font-medium text-gray-900 resize-none"
                  placeholder="Paste specific audience definitions here that you want the AI to prioritize (e.g., 'Focus on high-net-worth retirees who shop late at night...')"
                />
                <p className="mt-2 text-[11px] text-gray-400 italic">
                  These definitions will be injected directly into the AI prompt when analyzing customer data to ensure alignment with your specific targeting goals.
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={handleLoadStrategy}
                className="mr-auto text-xs font-bold text-gray-500 hover:text-[#0077C8] flex items-center gap-1"
              >
                <RotateCcw size={14} /> Load Last
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveStrategy}
                className="px-6 py-2.5 bg-[#0077C8] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                Save Strategy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
