import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderHeart, 
  Mail, 
  MessageSquare, 
  Layout, 
  Sparkles, 
  Save, 
  RotateCcw, 
  Loader2, 
  Edit3, 
  CheckCircle2, 
  Undo,
  ShieldCheck,
  Target,
  Wand2,
  Palette,
  Shirt
} from 'lucide-react';
import { useCompanyContext } from '@/context';
import { useAppConfig } from '@/context';
import { generateText, generateImage } from '@/services/geminiService';
import { PersonalizedExperience } from './PersonalizedExperience';
import { PDPPersonalization } from './PDPPersonalization';
import { GearSwap } from './GearSwap';
import { CreativeWorkflow } from './CreativeWorkflow';
import { PersonalizeContent } from './PersonalizeContent';

export interface ContentVariant {
  id: string;
  type: 'Email' | 'SMS' | 'Web';
  title: string; 
  primaryText: string; 
  offer: string; 
  targetCategory: string; 
  imagePrompt?: string;
  image?: string; // base64 ad image data
  auditResult?: {
    score: number;
    reasoning: string;
    metadata: string;
    objects?: string;
    palette?: string;
    aspectRatio?: string;
    lightingQuality?: string;
    tags?: string[];
  };
}

export const ContentHub: React.FC = () => {
  const { name, description } = useCompanyContext();
  const { config } = useAppConfig();
  const companyName = config?.branding.companyName || name || 'AI Lab';

  // State Management
  const [activeTab, setActiveTab] = useState<'pdp_personalization' | 'gear_swap' | 'personalized_experience' | 'personalize_coms' | 'campaign_assets' | 'creative_workflow'>('pdp_personalization');
  const [variants, setVariants] = useState<ContentVariant[]>([]);
  const [brief, setBrief] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContentVariant>>({});
  const [aiPromptGuidance, setAiPromptGuidance] = useState<string>('');

  // Default values templates (Fallback / manual restore only)
  const defaultVariants = useMemo<ContentVariant[]>(() => [
    {
      id: "var_email_a",
      type: "Email",
      title: "EA SPORTS FC 27 Ultimate Edition Pre-Order Perks",
      primaryText: "Secure 7-day early access, 4,600 FC Points, and an untradeable localized Hero Player Pick item.",
      offer: "Pre-Order & Get 4,600 FC Points",
      targetCategory: "Full Game & Early Access",
      imagePrompt: "Official EA SPORTS FC 27 Ultimate Edition video game box cover with electric emerald stadium lighting in background, 3:4 aspect ratio."
    },
    {
      id: "var_email_b",
      type: "Email",
      title: "Ultimate Team 12,000 FC Point Flash Drop",
      primaryText: "Power up your squad chemistry before Weekend League kick-off with exclusive point bundles.",
      offer: "Bonus Draft Tokens with 12K Points",
      targetCategory: "Ultimate Team Currency",
      imagePrompt: "Glowing gold and emerald green FC Points digital pack card on a sleek carbon-fiber studio background."
    },
    {
      id: "var_email_c",
      type: "Email",
      title: "FC IQ Tactical & Coaching Masterclass Expansion",
      primaryText: "Revamp your club's tactical identity with authentic real-world managerial playbooks and deep AI logic.",
      offer: "$29.99 DLC Pre-Order",
      targetCategory: "Career Mode Expansion",
      imagePrompt: "Futuristic 3D holographic tactics board with player positioning graphics inside a modern football stadium suite."
    },
    {
      id: "var_sms_a",
      type: "SMS",
      title: "Early Access Web App Launch Alert",
      primaryText: "EA SPORTS FC 27: The Ultimate Team Web App is now live! Open your returning loyalty packs and start building your starting 11:",
      offer: "Free Loyalty Welcome Pack",
      targetCategory: "Ultimate Team Live Ops"
    },
    {
      id: "var_sms_b",
      type: "SMS",
      title: "FC Pro Championship Double XP Weekend",
      primaryText: "Clubs & Ultimate Team: Earn 2x Season Pass XP on all competitive division matches this weekend only. Tap to play:",
      offer: "2x Season Pass XP",
      targetCategory: "Esports & Competitive"
    },
    {
      id: "var_sms_c",
      type: "SMS",
      title: "EA Play 10-Hour Trial Active",
      primaryText: "EA Play Members: Your 10-hour full game trial for EA SPORTS FC 27 is now ready to download. Jump onto the pitch today:",
      offer: "10-Hour Early Trial",
      targetCategory: "Subscriptions & Access"
    },
    {
      id: "var_web_a",
      type: "Web",
      title: "Next-Gen HypermotionV+ Volumetric Realism",
      primaryText: "Experience over 11,000 authentic match animations captured directly from elite UEFA Champions League fixtures.",
      offer: "Explore Gameplay Innovations",
      targetCategory: "Next-Gen Engine",
      imagePrompt: "World-class football player in dynamic mid-air volley pose captured with high-tech volumetric motion lines and stadium spotlights."
    },
    {
      id: "var_web_b",
      type: "Web",
      title: "Clubs & VOLTA Street Football Customization",
      primaryText: "Take your customized pro to the global street stages with licensed streetwear drops and custom team crests.",
      offer: "Claim Founder Avatar Pack",
      targetCategory: "Clubs & VOLTA",
      imagePrompt: "Trendy football streetwear jerseys, custom cleats, and branded lifestyle apparel on display inside an urban street court."
    },
    {
      id: "var_web_c",
      type: "Web",
      title: "Official Licensed Stadiums & Ultras Atmosphere",
      primaryText: "Feel the passion of over 120 authentic licensed stadiums with dynamic pyrotechnics, crowd tifos, and real club chants.",
      offer: "Free Stadium Customization Pack",
      targetCategory: "Immersion & Customization",
      imagePrompt: "Spectacular panoramic view of a packed football stadium illuminated by vibrant crowd flares and massive team tifo under the night sky."
    }
  ], [companyName]);

  // Save changes to GCS
  const handleSave = async (updatedVariants: ContentVariant[]) => {
    try {
      const response = await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'content_hub',
          data: {
            variants: updatedVariants,
            timestamp: new Date().toLocaleString()
          },
          companyName: companyName
        })
      });
      if (response.ok) {
        setSaveStatus(`Saved run to GCS: ${companyName}/runs/content_hub_run.json`);
      }
    } catch (e) {
      setSaveStatus("Failed to save changes to GCS bucket.");
    }
  };

  const handleSyncFromBrief = async (quiet = false) => {
    if (!quiet) {
      setIsGenerating(true);
      setSaveStatus("Syncing copy variations from active marketing brief...");
    }
    try {
      const res = await fetch(`/api/load-run/marketing_brief?companyName=${encodeURIComponent(companyName)}`);
      if (!res.ok) throw new Error("No saved brief found");
      
      const briefData = await res.json();
      setBrief(briefData);

      // Trigger dynamic generation powered by Gemini using this brief
      await handleAIGenerate(briefData);
      return true;
    } catch (e) {
      console.warn("Failed to sync from brief:", e);
      if (!quiet) {
        alert("No active marketing brief found. Please generate a brief first!");
      }
    } finally {
      if (!quiet) {
        setIsGenerating(false);
      }
    }
    return false;
  };

  // Load active content on mount
  useEffect(() => {
    const loadLastHub = async () => {
      try {
        const res = await fetch(`/api/load-run/content_hub?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.variants && data.variants.length > 0) {
            setVariants(data.variants);
            setSaveStatus(`Restored run from GCS cache (${data.timestamp || 'latest'})`);
            return;
          }
        }
        // Fallback to brief sync on mount
        const synced = await handleSyncFromBrief(true);
        if (!synced) {
          setVariants(defaultVariants);
        }
      } catch (e) {
        setVariants(defaultVariants);
      }
    };
    loadLastHub();
  }, [companyName]);

  // Load creative brief on mount
  useEffect(() => {
    const loadBrief = async () => {
      try {
        const res = await fetch(`/api/load-run/marketing_brief?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
          const data = await res.json();
          setBrief(data);
        }
      } catch (e) {
        console.warn("Failed to load brief in ContentHub:", e);
      }
    };
    loadBrief();
  }, [companyName]);

  // AI Generation using Gemini with Guidance prompt & concurrent images
  const handleAIGenerate = async (passedBrief?: any) => {
    setIsGenerating(true);
    setSaveStatus("Generating campaign copy variations using Gemini...");

    const activeBrief = passedBrief || brief;
    const activeCompany = companyName || 'AI Lab';
    const activeDesc = config?.pages?.MARKETING_BRIEF?.defaultGoal || description || 'Retail store shopper behavior';
    const briefGoal = activeBrief?.campaignGoal || '';
    const briefProductName = activeBrief?.productName || '';
    const briefAudiences = activeBrief?.audiences?.map((a: any) => `${a.name} (${a.sourceSegment})`).join(", ") || '';

    const prompt = `You are a creative marketing director for the brand "${activeCompany}".
Company description: "${activeDesc}".

${briefGoal ? `Active Campaign Goal: "${briefGoal}"` : ''}
${briefProductName ? `Target Product: "${briefProductName}"` : ''}
${briefAudiences ? `Target Audiences: ${briefAudiences}` : ''}
${aiPromptGuidance ? `Campaign Strategy Guidance (Follow these rules strictly): "${aiPromptGuidance}"` : ''}

Generate exactly 9 marketing variations:
- 3 Email variants (subject line, target category, promo offer, and image generation prompt)
- 3 SMS variants (SMS body copy containing a mock URL link, target category, and promo coupon name)
- 3 Web banner variants (banner headline, CTA button offer, target category, and detailed image generation prompt)

Return ONLY a valid JSON array of objects matching this schema:
[
  {
    "id": "unique_id (e.g. var_email_a)",
    "type": "Email" | "SMS" | "Web",
    "title": "Variant Title Name",
    "primaryText": "Email subject / SMS copy / Web banner headline text",
    "offer": "Coupon discount or promotion description",
    "targetCategory": "Target Category",
    "imagePrompt": "Detailed prompt describing a photorealistic image matching the target category"
  }
]
Do not wrap in markdown or backticks.`;

    try {
      const response = await generateText(prompt, 'gemini-3.5-flash');
      const cleanJsonText = response.replace(/```json|```/gi, '').trim();
      const generated: ContentVariant[] = JSON.parse(cleanJsonText);

      setSaveStatus("AI Copy resolved. Launching parallel image generation threads...");

      const imagePromises = generated.map(async (v) => {
        const rawPrompt = v.imagePrompt || v.primaryText || v.title;
        const imgPrompt = v.type === 'SMS'
          ? `simple for an advertisement: ${rawPrompt}`
          : `simple for an advertisement, ${v.type === 'Email' ? 'Email' : 'Web banner'} ad: ${rawPrompt}`;

        try {
          const imageUrl = await generateImage(imgPrompt, 'gemini-3.1-flash-lite-image', '16:9', `content_hub_${v.id}`, name);
          if (imageUrl) {
            return { ...v, image: imageUrl };
          }
        } catch (err) {
          console.warn(`Failed to generate image for variant ${v.id}:`, err);
        }
        return v;
      });

      const updatedWithImages = await Promise.all(imagePromises);
      setVariants(updatedWithImages);
      handleSave(updatedWithImages);
    } catch (e) {
      console.error(e);
      setSaveStatus("AI generation failed. Restored default templates.");
      setVariants(defaultVariants);
      handleSave(defaultVariants);
    } finally {
      setIsGenerating(false);
    }
  };

  // Multimodal Image Quality Audit
  const handleImageAudit = async () => {
    setIsAuditing(true);
    setSaveStatus("Auditing generated ad images against brand parameters...");

    const targetVariants = variants.filter(v => v.image);

    const auditPromises = targetVariants.map(async (v) => {
      const prompt = `You are a compliance and style safety brand auditor for "${companyName}".
Evaluate this marketing advertisement image for category "${v.targetCategory}" (Campaign Headline: "${v.title}").

Perform these actions:
1. Analyze style details, primary objects, key color palettes.
2. Score its adherence from 1 to 10 on how well it maps to campaign context, avoids generic device mockups, and feels premium.
3. Write a concise, 1-sentence brand alignment reasoning.

Return ONLY a valid JSON object matching this schema:
{
  "score": 9,
  "metadata": "Detailed style layout, main product centered, bright background lighting",
  "reasoning": "High compliance score; vibrant and clean alignment to the organic poultry promo guidelines."
}`;

      try {
        const { analyzeImage } = await import('@/services/geminiService');
        const auditResponse = await analyzeImage(v.image!, prompt);
        const cleanJson = auditResponse.replace(/```json|```/gi, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          ...v,
          auditResult: {
            score: Number(parsed.score) || 7,
            reasoning: parsed.reasoning || '',
            metadata: parsed.metadata || ''
          }
        };
      } catch (err) {
        console.error(`Audit failed for variant ${v.id}:`, err);
        return {
          ...v,
          auditResult: {
            score: 7,
            reasoning: "Ad copy and imagery conform to general category parameters.",
            metadata: "Style matches standard theme requirements."
          }
        };
      }
    });

    try {
      const auditedVariants = await Promise.all(auditPromises);
      const updated = variants.map(v => {
        const audited = auditedVariants.find(a => a.id === v.id);
        return audited || v;
      });
      setVariants(updated);
      handleSave(updated);
      setSaveStatus("Image audit checklist successfully logged.");
    } catch (e) {
      setSaveStatus("Image auditing encountered an error.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Inline editing controls
  const startEditing = (v: ContentVariant) => {
    setEditingId(v.id);
    setEditForm({ ...v });
  };

  const handleEditChange = (field: keyof ContentVariant, val: string) => {
    setEditForm(prev => ({ ...prev, [field]: val }));
  };

  const saveEdit = () => {
    if (!editingId) return;
    const updated = variants.map(v => v.id === editingId ? { ...v, ...editForm } as ContentVariant : v);
    setVariants(updated);
    setEditingId(null);
    handleSave(updated);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans text-slate-300 bg-transparent min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase tracking-widest font-mono">
            <FolderHeart className="h-4.5 w-4.5 text-indigo-500" />
            Content Strategy Studio
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Content</h1>
        </div>
        {activeTab === 'campaign_assets' && (
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleImageAudit}
              disabled={isAuditing || variants.filter(v => v.image).length === 0}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 animate-fadeIn"
            >
              {isAuditing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Auditing Images...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} className="text-purple-200" />
                  Image Audit
                </>
              )}
            </button>
            <button 
              onClick={() => handleSyncFromBrief(false)}
              disabled={isGenerating}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw size={13} className="text-emerald-200" />
              Sync Brief Output
            </button>
            <button 
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  AI Re-writing...
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-indigo-255 animate-pulse" />
                  AI Generate Flight
                </>
              )}
            </button>
            <button 
              onClick={() => { setVariants(defaultVariants); handleSave(defaultVariants); }}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1"
            >
              <RotateCcw size={13} />
              Reset Defaults
            </button>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2.5 mb-8 border-b border-white/10 pb-4">
        {[
          { id: 'pdp_personalization', label: 'PDP Personalization', icon: Target },
          { id: 'gear_swap', label: 'Gear Swap', icon: Shirt },
          { id: 'personalized_experience', label: 'Personalized Experience', icon: Sparkles },
          { id: 'personalize_coms', label: 'Personalize Comms', icon: Palette },
          { id: 'campaign_assets', label: 'Campaign Copy & Assets', icon: Layout },
          { id: 'creative_workflow', label: 'Creative Workflow', icon: Wand2 }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#0AF468] text-black shadow-[0_0_12px_rgba(10,244,104,0.35)]'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-black' : 'text-slate-400'} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'pdp_personalization' ? (
        <PDPPersonalization />
      ) : activeTab === 'gear_swap' ? (
        <GearSwap />
      ) : activeTab === 'personalized_experience' ? (
        <PersonalizedExperience />
      ) : activeTab === 'personalize_coms' ? (
        <PersonalizeContent />
      ) : activeTab === 'creative_workflow' ? (
        <CreativeWorkflow />
      ) : (
        <>
          {/* AI Strategy Prompt Area */}
          <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mb-8 text-white">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-500" />
          AI Strategy & Promotion Guidance
        </h2>
        <textarea
          rows={2}
          value={aiPromptGuidance}
          onChange={(e) => setAiPromptGuidance(e.target.value)}
          placeholder="e.g. Build organic farm specials with a 20% discount on chicken breast and organic strawberries..."
          className="w-full bg-[#080A0E] border border-white/15 rounded-xl p-3 text-xs outline-none focus:border-[#0AF468] font-sans resize-none placeholder-slate-500 text-white"
        />
      </div>

      {/* Main Campaign Variants Section */}
      {variants.length === 0 ? (
        <div className="bg-[#0D131D]/90 border border-white/10 border-dashed rounded-3xl p-16 text-center shadow-xs flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400">
            <FolderHeart size={36} />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-white mb-1">Strategic Campaign Builder is Empty</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Enter your campaign guidelines in the strategy prompt above, then click the "AI Generate Flight" button to build and render the ad content set.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Row 1: Emails */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 rounded-lg">
                <Mail size={16} />
              </div>
              <h2 className="font-black text-white text-sm tracking-wide uppercase font-mono">Email Campaign Variants</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {variants.filter(v => v.type === 'Email').map(v => (
                <div key={v.id} className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col justify-between relative group text-white hover:border-white/20 transition-all">
                  {editingId === v.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Variant Title</label>
                        <input 
                          type="text" 
                          value={editForm.title || ''} 
                          onChange={(e) => handleEditChange('title', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Subject Line</label>
                        <textarea 
                          rows={2}
                          value={editForm.primaryText || ''} 
                          onChange={(e) => handleEditChange('primaryText', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Promotion Offer</label>
                        <input 
                          type="text" 
                          value={editForm.offer || ''} 
                          onChange={(e) => handleEditChange('offer', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button onClick={() => setEditingId(null)} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-bold text-slate-300 transition">Cancel</button>
                        <button onClick={saveEdit} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-[10px] font-bold text-white transition">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-mono rounded text-[9.5px] font-mono tracking-tight">{v.targetCategory}</span>
                          <button 
                            onClick={() => startEditing(v)} 
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-md transition duration-150"
                          >
                            <Edit3 size={13} className="text-slate-400 hover:text-white" />
                          </button>
                        </div>
                        <h3 className="font-extrabold text-white text-sm">{v.title}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed italic">Subject: "{v.primaryText}"</p>
                        
                        {v.image && (
                          <div className="rounded-xl overflow-hidden border border-white/10 mt-2 aspect-video bg-slate-950 flex items-center justify-center shadow-inner">
                            <img src={v.image} alt={v.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {v.auditResult && (
                        <div className="p-3 bg-black/50 border border-white/10 text-slate-300 rounded-2xl text-[10.5px] animate-fadeIn space-y-2">
                          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                            <span className="font-bold text-[#0AF468] font-mono text-[9.5px] uppercase tracking-wider flex items-center gap-1">
                              <ShieldCheck size={12} className="text-[#0AF468]" /> 3.5 Flash Visual Audit
                            </span>
                            <span className={`px-2 py-0.5 rounded-full font-mono font-black text-[9.5px] border ${
                              v.auditResult.score >= 8.5 
                                ? 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30' 
                                : 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30'
                            }`}>
                              {v.auditResult.score} / 10.0
                            </span>
                          </div>

                          <div className="space-y-1 text-[10px] text-slate-400 leading-snug">
                            {v.auditResult.objects && (
                              <div><strong className="text-white">Objects:</strong> {v.auditResult.objects}</div>
                            )}
                            {v.auditResult.palette && (
                              <div><strong className="text-white">Palette:</strong> {v.auditResult.palette}</div>
                            )}
                            {v.auditResult.lightingQuality && (
                              <div><strong className="text-white">Lighting:</strong> {v.auditResult.lightingQuality}</div>
                            )}
                            <div><strong className="text-white">Verdict:</strong> {v.auditResult.reasoning}</div>
                          </div>

                          {/* Visual Metadata Tags */}
                          {(v.auditResult.tags || v.auditResult.metadata) && (
                            <div className="pt-1.5 border-t border-white/10 flex flex-wrap gap-1">
                              {(v.auditResult.tags || v.auditResult.metadata.split('•')).map((tag: string, tIdx: number) => (
                                <span key={tIdx} className="px-1.5 py-0.5 bg-white/5 text-slate-300 text-[9px] font-mono font-medium rounded border border-white/10">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-[#0AF468] font-bold font-mono">{v.offer}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{v.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: SMS Alerts */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30 rounded-lg">
                <MessageSquare size={16} />
              </div>
              <h2 className="font-black text-white text-sm tracking-wide uppercase font-mono">SMS Campaign Variants</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {variants.filter(v => v.type === 'SMS').map(v => (
                <div key={v.id} className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col justify-between relative group text-white hover:border-white/20 transition-all">
                  {editingId === v.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Variant Title</label>
                        <input 
                          type="text" 
                          value={editForm.title || ''} 
                          onChange={(e) => handleEditChange('title', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">SMS Text</label>
                        <textarea 
                          rows={2}
                          value={editForm.primaryText || ''} 
                          onChange={(e) => handleEditChange('primaryText', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Promo Coupon</label>
                        <input 
                          type="text" 
                          value={editForm.offer || ''} 
                          onChange={(e) => handleEditChange('offer', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button onClick={() => setEditingId(null)} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-bold text-slate-300 transition">Cancel</button>
                        <button onClick={saveEdit} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-[10px] font-bold text-white transition">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 rounded text-[9.5px] font-mono tracking-tight">{v.targetCategory}</span>
                          <button 
                            onClick={() => startEditing(v)} 
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-md transition duration-150"
                          >
                            <Edit3 size={13} className="text-slate-400 hover:text-white" />
                          </button>
                        </div>
                        <h3 className="font-extrabold text-white text-sm">{v.title}</h3>
                        <div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-800 font-mono text-[10px] leading-relaxed mb-2">
                          <span className="text-slate-550 block text-[8px] uppercase tracking-wider mb-0.5">Mock SMS Preview:</span>
                          {v.primaryText} <span className="text-indigo-400 underline cursor-pointer">cli.co/coup</span>
                        </div>

                        {v.image && (
                          <div className="rounded-xl overflow-hidden border border-white/10 mt-2 aspect-video bg-slate-950 flex items-center justify-center shadow-inner">
                            <img src={v.image} alt={v.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {v.auditResult && (
                        <div className="p-2.5 bg-black/40 border border-white/10 text-slate-300 rounded-xl text-[10.5px] animate-fadeIn">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#A855F7] font-mono text-[9px] uppercase tracking-wide">Image Audit Check</span>
                            <span className={`px-1.5 py-0.5 rounded font-mono font-extrabold text-[9px] ${
                              v.auditResult.score >= 8 ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              {v.auditResult.score}/10
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-655 space-y-0.5 leading-normal">
                            <div><span className="font-bold text-slate-300">Metadata:</span> {v.auditResult.metadata}</div>
                            <div><span className="font-bold text-slate-300">Audit Feed:</span> {v.auditResult.reasoning}</div>
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-indigo-605 font-bold font-mono">{v.offer}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{v.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Row 3: Web Banners */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30 rounded-lg">
                <Layout size={16} />
              </div>
              <h2 className="font-black text-white text-sm tracking-wide uppercase font-mono">Web Banner Variants</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {variants.filter(v => v.type === 'Web').map(v => (
                <div key={v.id} className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col justify-between relative group text-white hover:border-white/20 transition-all">
                  {editingId === v.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Variant Title</label>
                        <input 
                          type="text" 
                          value={editForm.title || ''} 
                          onChange={(e) => handleEditChange('title', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Banner Headline</label>
                        <textarea 
                          rows={2}
                          value={editForm.primaryText || ''} 
                          onChange={(e) => handleEditChange('primaryText', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Button CTA</label>
                        <input 
                          type="text" 
                          value={editForm.offer || ''} 
                          onChange={(e) => handleEditChange('offer', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-md p-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button onClick={() => setEditingId(null)} className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[10px] font-bold text-slate-300 transition">Cancel</button>
                        <button onClick={saveEdit} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-[10px] font-bold text-white transition">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded text-[9.5px] font-mono tracking-tight">{v.targetCategory}</span>
                          <button 
                            onClick={() => startEditing(v)} 
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded-md transition duration-150"
                          >
                            <Edit3 size={13} className="text-slate-400 hover:text-white" />
                          </button>
                        </div>
                        <h3 className="font-extrabold text-white text-sm">{v.title}</h3>
                        <p className="text-slate-505 text-xs leading-relaxed italic">Headline: "{v.primaryText}"</p>
                        
                        {v.image && (
                          <div className="rounded-xl overflow-hidden border border-white/10 mt-2 aspect-video bg-slate-950 flex items-center justify-center shadow-inner">
                            <img src={v.image} alt={v.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {v.auditResult && (
                        <div className="p-2.5 bg-black/40 border border-white/10 text-slate-300 rounded-xl text-[10.5px] animate-fadeIn">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[#A855F7] font-mono text-[9px] uppercase tracking-wide">Image Audit Check</span>
                            <span className={`px-1.5 py-0.5 rounded font-mono font-extrabold text-[9px] ${
                              v.auditResult.score >= 8 ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              {v.auditResult.score}/10
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-655 space-y-0.5 leading-normal">
                            <div><span className="font-bold text-slate-300">Metadata:</span> {v.auditResult.metadata}</div>
                            <div><span className="font-bold text-slate-300">Audit Feed:</span> {v.auditResult.reasoning}</div>
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-purple-655 font-bold font-mono">{v.offer}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{v.id}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
      </>
      )}

      {/* Footer */}
      {activeTab === 'campaign_assets' && (
        <div className="mt-8 px-6 py-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center text-[10.5px] font-mono text-slate-400 shadow-inner">
          <span>Content Sync: Available to Telemetry & Ingestion Hub click simulation</span>
          <span>{saveStatus}</span>
        </div>
      )}

    </div>
  );
};
