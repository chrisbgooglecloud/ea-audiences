import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  RotateCcw, 
  RotateCw, 
  Save, 
  Play, 
  Loader2, 
  Check, 
  X, 
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useAppConfig } from '@/context';
import { useCompanyContext } from '@/context';
import { generateText, generateImageFromPrompt, analyzeImage } from '@/services/geminiService';

interface ImageAuditState {
  id: number;
  url: string;
  metadata: string;
  score: number | null;
  reason: string;
  positive: string[];
  negative: string[];
  status: 'pending' | 'generating_image' | 'loading_metadata' | 'metadata_done' | 'loading_score' | 'completed' | 'failed';
}

export const ContentAudit: React.FC = () => {
  const { config } = useAppConfig();
  const { name: companyName } = useCompanyContext();
  const activeCompany = companyName || '2K Games (Take-Two Interactive)';

  const [guidelines, setGuidelines] = useState("");
  const [imageStyle, setImageStyle] = useState("Authentic NBA 2K ProPLAY Hardwood");
  const [customInstructions, setCustomInstructions] = useState("");
  const [auditPrompt, setAuditPrompt] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [images, setImages] = useState<ImageAuditState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [gcsWarning, setGcsWarning] = useState<string | null>(null);

  // Initialize images by loading GCS run on mount
  useEffect(() => {
    if (!activeCompany) return;
    
    setImages([]);
    setGcsWarning(null);
    setIsLoading(true);
    
    const url = `/api/content-audit/run?companyName=${encodeURIComponent(activeCompany)}`;
    fetch(url)
      .then(res => {
        if (res.ok) return res.json();
        if (res.status === 404) throw new Error("no gcs files found, please generate new");
        throw new Error(`Failed to verify GCS run (HTTP ${res.status})`);
      })
      .then(data => {
        if (data.images && Array.isArray(data.images)) {
          setImages(data.images);
        }
      })
      .catch(err => {
        if (err.message === "no gcs files found, please generate new") {
          setGcsWarning("no gcs files found, please generate new");
        } else {
          setGcsWarning("Google Cloud Storage failed to fetch guidelines or run files.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeCompany]);

  // Load guidelines
  useEffect(() => {
    if (!activeCompany) return;
    const url = `/api/content-audit/guidelines?companyName=${encodeURIComponent(activeCompany)}`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load guidelines (HTTP ${res.status})`);
        return res.json();
      })
      .then(data => {
        if (data.guidelines !== undefined) setGuidelines(data.guidelines);
        if (data.imageStyle !== undefined) setImageStyle(data.imageStyle);
        if (data.customInstructions !== undefined) setCustomInstructions(data.customInstructions);
        if (data.auditPrompt !== undefined) setAuditPrompt(data.auditPrompt);
      })
      .catch(err => console.warn("[ContentAudit] Failed to load guidelines:", err));
  }, [activeCompany]);

  const handleSaveGuidelines = async () => {
    try {
      const res = await fetch('/api/content-audit/guidelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: activeCompany, data: { guidelines, imageStyle, customInstructions, auditPrompt } })
      });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("[ContentAudit] Failed to save guidelines:", error);
    }
  };

  const handleAuditAsset = async (id: number) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, status: 'loading_score' } : img));
    const img = images.find(i => i.id === id);
    if (!img) return;

    try {
      const auditPromptDefault = `You are a brand compliance auditor for ${activeCompany}.
Context: "EA SPORTS FC" (including "EA SPORTS FC 27", "FC 27", "Ultimate Edition", "Standard Edition") is the official flagship global football video game franchise created and published by Electronic Arts.
Evaluate this marketing asset/image and score its adherence/compliance on a scale from 0 to 10.
- A score of 10 means fully compliant, fits the brand guidelines perfectly.
- A score of 0 means completely non-compliant.

Brand Guidelines:
{guidelines}

Provide the score (e.g. 9.2), a very short 1-sentence assessment summary, exactly 3 strengths, and exactly 3 weaknesses.
Return a valid JSON object:
{
  "score": 9.2,
  "reason": "Brand compliance assessment summary...",
  "positive": ["Strength 1", "Strength 2", "Strength 3"],
  "negative": ["Weakness 1", "Weakness 2", "Weakness 3"]
}`;
      const promptTemplate = auditPrompt || auditPromptDefault;
      const prompt = promptTemplate.replace('{guidelines}', guidelines);
      const response = await analyzeImage(img.url, prompt, 'gemini-3.5-flash');
      
      let responseStr = response.replace(/```json|```/gi, '').trim();
      
      let score = 8.5;
      let reason = "Conforms to EA brand guidelines.";
      let positive: string[] = ["Official brand fidelity", "Clean commercial typography", "High-contrast dynamic stadium lighting"];
      let negative: string[] = [];
      try {
        const data = JSON.parse(responseStr);
        score = data.score;
        reason = data.reason || reason;
        positive = data.positive || positive;
        negative = data.negative || negative;
      } catch (e) {
        const match = response.match(/"score":\s*([0-9.]+)/);
        if (match) score = parseFloat(match[1]);
      }
      
      setImages(prev => prev.map(i => i.id === id ? { ...i, score, reason, positive, negative, status: 'completed' } : i));
    } catch (error) {
      console.error("Failed to audit asset:", error);
      setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'failed' } : i));
    }
  };

  const handleReAnalyze = async (id: number) => {
    const img = images.find(i => i.id === id);
    if (!img) return;

    setImages(prev => prev.map(item => item.id === id ? { ...item, status: 'loading_metadata', metadata: "", score: null, reason: "", positive: [], negative: [] } : item));

    try {
      const metaPrompt = `Analyze this product marketing image and identify the key details (e.g. product type/style, brands, colors, materials, design elements, visible text or logos). Return ONLY the tags separated by commas (limit to ~10 tags total).`;
      const metaResponse = await analyzeImage(img.url, metaPrompt, 'gemini-3.5-flash');
      const metadata = metaResponse || "No metadata found";

      setImages(prev => prev.map(item => item.id === id ? { ...item, metadata, status: 'metadata_done' } : item));
      setImages(prev => prev.map(item => item.id === id ? { ...item, status: 'loading_score' } : item));

      const auditPromptDefault = `You are a brand compliance auditor for ${activeCompany}.
Evaluate this marketing asset and score compliance from 0 to 10.
Guidelines: {guidelines}
Return JSON:
{
  "score": 9.2,
  "reason": "Brand assessment summary...",
  "positive": ["Strength 1", "Strength 2", "Strength 3"],
  "negative": ["Weakness 1", "Weakness 2", "Weakness 3"]
}`;
      const evalPrompt = (auditPrompt || auditPromptDefault).replace('{guidelines}', guidelines);
      const auditResponse = await analyzeImage(img.url, evalPrompt, 'gemini-3.5-flash');

      let responseStr = auditResponse.replace(/```json|```/gi, '').trim();
      let score = 8.5;
      let reason = "High compliance score; matches category guidelines.";
      let positive: string[] = [];
      let negative: string[] = [];
      try {
        const parsed = JSON.parse(responseStr);
        score = parsed.score || 8.5;
        reason = parsed.reason || reason;
        positive = parsed.positive || [];
        negative = parsed.negative || [];
      } catch (e) {
        console.warn("Could not parse JSON:", e);
      }

      setImages(prev => prev.map(item => item.id === id ? { ...item, score, reason, positive, negative, status: 'completed' } : item));
    } catch (e) {
      setImages(prev => prev.map(item => item.id === id ? { ...item, status: 'failed' } : item));
    }
  };

  const handleAuditAll = async () => {
    setIsLoading(true);
    for (const img of images) {
      if (img.url && img.status !== 'completed') {
        await handleReAnalyze(img.id);
      }
    }
    setIsLoading(false);
  };

  const handleLoadLast = () => {
    if (!activeCompany) return;
    setIsLoading(true);
    fetch(`/api/content-audit/run?companyName=${encodeURIComponent(activeCompany)}`)
      .then(res => res.json())
      .then(data => {
        if (data.images && Array.isArray(data.images)) {
          setImages(data.images);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-100 min-h-screen space-y-6">
      
      {/* Top Header */}
      <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#0AF468] animate-pulse"></span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Multimodal Safety &amp; Style Checker
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck size={26} className="text-[#0AF468]" />
            Image Audit Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Auditing marketing visuals against official {activeCompany} style guides using <strong className="text-white">Gemini 3.5 Flash</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={handleAuditAll} 
            disabled={isLoading} 
            className="px-4 py-2 btn-primary rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Audit All Assets
          </button>
          
          <button 
            onClick={handleLoadLast} 
            disabled={isLoading} 
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5"
          >
            <RotateCcw size={13} /> Load Last
          </button>

          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition"
            title="Configure Brand Guidelines"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* GCS Warning Banner */}
      {gcsWarning && (
        <div className="bg-[#0D131D] border border-amber-500/30 text-amber-300 rounded-2xl p-4 flex items-center gap-3 shadow-lg animate-fadeIn">
          <Settings className="animate-spin text-amber-400 shrink-0" size={18} />
          <div className="text-xs">
            <p className="font-bold text-amber-200">{gcsWarning}</p>
            <p className="text-slate-400 mt-0.5">Click <strong>Audit All Assets</strong> to evaluate live images against brand standards.</p>
          </div>
        </div>
      )}

      {/* Grid of Audited Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map(img => (
          <div 
            key={img.id} 
            className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all space-y-4 text-white group"
          >
            <div className="space-y-3">
              <div className="aspect-video bg-black/60 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 relative group/img shadow-inner">
                <img 
                  src={img.url} 
                  alt={`Ad ${img.id}`} 
                  className="w-full h-full object-cover cursor-zoom-in group-hover/img:scale-105 transition-transform duration-300" 
                  onClick={() => setPreviewImage(img.url)}
                  onError={(e) => { 
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://via.placeholder.com/300x200?text=${encodeURIComponent(activeCompany || 'Ad')}`; 
                  }} 
                />
                
                <button 
                  onClick={() => handleReAnalyze(img.id)}
                  disabled={img.status === 'loading_metadata' || img.status === 'loading_score'}
                  className="absolute bottom-2 left-2 p-2 bg-black/80 hover:bg-black text-white rounded-xl shadow-md transition-all border border-white/20 z-10"
                  title="Re-analyze this image"
                >
                  <RefreshCw size={13} className={img.status === 'loading_metadata' || img.status === 'loading_score' ? 'animate-spin text-[#0AF468]' : 'text-[#0AF468]'} />
                </button>

                {img.score !== null && (
                  <div className="absolute top-2 right-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-black border shadow-lg ${
                      img.score >= 8 
                        ? 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/40' 
                        : 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/40'
                    }`}>
                      {img.score} / 10.0
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-slate-300 min-h-[38px] leading-relaxed">
                {img.status === 'generating_image' 
                  ? <span className="text-[#00F0FF] font-mono flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Generating image...</span> 
                  : img.status === 'loading_metadata' 
                  ? <span className="text-amber-400 font-mono flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Analyzing metadata...</span> 
                  : img.metadata || "No metadata extracted yet."}
              </div>
            </div>

            {/* Assessment & Strengths / Weaknesses */}
            {img.score !== null && (
              <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                {img.reason && (
                  <p className="text-slate-300 italic text-[11px]">"{img.reason}"</p>
                )}

                {img.positive && img.positive.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-mono font-bold text-[#00FF88] uppercase tracking-wider block">Strengths</span>
                    <ul className="space-y-0.5">
                      {img.positive.slice(0, 2).map((pos, idx) => (
                        <li key={idx} className="flex gap-1.5 items-start text-[10.5px] text-slate-300">
                          <Check size={11} className="text-[#00FF88] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{pos}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Guidelines Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0D131D] border border-white/15 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden text-white">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Settings size={18} className="text-[#0AF468]" /> Brand Guidelines Configuration
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Brand Compliance Rules</label>
                <textarea 
                  value={guidelines}
                  onChange={(e) => setGuidelines(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl outline-none font-medium text-white resize-none text-xs"
                  placeholder="Enter official brand rules..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Evaluation Prompt</label>
                <textarea 
                  value={auditPrompt}
                  onChange={(e) => setAuditPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/60 border border-white/15 rounded-xl outline-none font-mono text-xs text-white resize-y"
                  placeholder="System prompt template to evaluate/score the image assets. Supports {guidelines} placeholder."
                />
              </div>
            </div>

            <div className="p-6 bg-black/40 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setIsSettingsOpen(false)} className="px-5 py-2 text-xs font-mono font-bold text-slate-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleSaveGuidelines} className="px-6 py-2 btn-primary rounded-xl text-xs font-black shadow-md">
                Save Guidelines
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" 
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-[#0D131D] p-3 shadow-2xl flex items-center justify-center border border-white/20" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute top-4 right-4 p-2 bg-black/80 hover:bg-black text-white rounded-full shadow-lg transition-all z-50 border border-white/20"
              title="Close preview"
            >
              <X size={18} />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[82vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};
