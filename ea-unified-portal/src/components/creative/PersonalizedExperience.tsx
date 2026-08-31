import { fetchA2AAudiences, mapA2AToStorefrontPersonas } from '@/services/audienceService';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  Save, 
  User, 
  ShoppingBag, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Loader2, 
  RefreshCw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Gamepad2,
  Trophy,
  Shield,
  Zap
} from 'lucide-react';
import { useCompanyContext } from '@/context';
import { useAppConfig } from '@/context';
import { 
  generatePersonalizedStorefront, 
  generateImage, 
  PersonalizedStorefrontData 
} from '@/services/geminiService';

// Default EA SPORTS FC Gaming Personas
const DEFAULT_PERSONAS = [
  {
    id: "persona_fut_competitor",
    name: "Marcus Vance",
    cohortTitle: "Ultimate Team Power Buyer",
    demographics: "24 y/o Digital Marketing Specialist & Competitive Grinder",
    interests: ["Ultimate Team 12,000 Point Bundles", "EA Sports FC 27 Ultimate Edition", "Weekend League", "TOTS Flash Drops"],
    intentScores: { categoryAffinity: "Competitive Ultimate Team & Digital Currency", purchaseIntent: 96 },
    behavioralTags: ["Ultimate Team Fanatic", "Microtransaction Power Buyer", "Console Gamer", "Competitive Grinder"],
    observations: "Lives and breathes Ultimate Team, always chasing the meta and optimizing squad chemistry for Weekend League. Frequently buys promotional point bundles."
  },
  {
    id: "persona_hardware_esports",
    name: "Kaito Takahashi",
    cohortTitle: "Competitive Hardware & Esports Enthusiast",
    demographics: "25 y/o Systems Integrator & Esports Enthusiast",
    interests: ["Xbox Series X Console Bundles", "EA Sports FC 27 Ultimate Edition", "Custom Pro Controllers", "Low-Latency Monitors"],
    intentScores: { categoryAffinity: "Esports Hardware & Ultimate Edition Pre-orders", purchaseIntent: 92 },
    behavioralTags: ["Hardware Upgrader", "Esports Competitor", "Tech Savvy", "Pro Controller User"],
    observations: "Demands maximum frame rates and zero input lag on the pitch. Pre-orders premium editions to secure 7-day early access."
  },
  {
    id: "persona_career_tactician",
    name: "Chloe Bennett",
    cohortTitle: "Content Completionist & Career Mode Tactician",
    demographics: "22 y/o Graphic Design Student & Football Tactician",
    interests: ["Manager Career Mode", "FC IQ Tactical Masterclass DLC", "Youth Academy Scouting", "Tournament Expansions"],
    intentScores: { categoryAffinity: "Tactical Single-Player & Career Expansions", purchaseIntent: 88 },
    behavioralTags: ["Completionist", "Career Mode Strategist", "Storyline & Lore Explorer"],
    observations: "Loves deep tactical management, developing wonderkids in youth academies, and rebuilding historic clubs with realistic transfer rules."
  },
  {
    id: "persona_clubs_social",
    name: "Alexandre Silva",
    cohortTitle: "Clubs & Casual Social Drop-In Player",
    demographics: "28 y/o Creative Director & Social Gamer",
    interests: ["11v11 Clubs Mode", "Volta Street Football", "Streetwear Avatar Apparel", "Discord Squad Matches"],
    intentScores: { categoryAffinity: "Social Multiplayer & Avatar Customization", purchaseIntent: 85 },
    behavioralTags: ["Social Drop-In Player", "Skill Moves Specialist", "Apparel & Kit Collector"],
    observations: "Plays drop-in matches and competitive club seasons with a 6-player Discord squad every weekend. Loves custom skill moves and lifestyle kit drops."
  }
];

// Fallback Default EA SPORTS FC Storefront Data
const DEFAULT_STOREFRONT: PersonalizedStorefrontData = {
  announcement: "Pre-Order EA SPORTS FC 27 • Get 4,600 FC Points + 7-Day Early Access with Ultimate Edition • Local Club Hero Item Included • Free Cross-Gen Upgrade",
  searchPlaceholder: "Search for EA SPORTS FC 27, Ultimate Team Points, Player Packs, Kits...",
  hero: {
    title: "The World's Game. Evolved.",
    subtitle: "Feel closer to the game with next-gen HypermotionV+ volumetric capture, FC IQ tactical intelligence, and authentic matchday atmosphere.",
    ctaText: "Pre-Order Now",
    heroImagePrompt: "Cinematic promotional hero banner for EA SPORTS FC 27 video game, world-class football superstars celebrating a championship goal on an illuminated stadium pitch under electric floodlights, emerald green and neon geometric laser lighting, ultra-high resolution, 16:9 aspect ratio commercial visual",
    heroThemeColor: "from-emerald-950/80 via-slate-900/90 to-black"
  },
  chicletSectionTitle: "Recommended For Your Playstyle",
  chiclets: [
    {
      id: "chiclet-1",
      title: "EA SPORTS FC 27 Ultimate Edition",
      categoryName: "Full Game + 7-Day Early Access",
      fragranceNotes: "4,600 FC Points, Untradeable Local Hero Item, Dual Entitlement",
      offer: "$99.99 (Pre-Order)",
      badge: "MOST POPULAR",
      primaryCta: "Pre-Order Ultimate",
      imagePrompt: "Official game cover packaging for EA SPORTS FC 27 Ultimate Edition on modern premium dark background with neon emerald football graphics, 3:4 aspect ratio video game packshot cover art"
    },
    {
      id: "chiclet-2",
      title: "12,000 FC Point Power Bundle",
      categoryName: "Ultimate Team Digital Currency",
      fragranceNotes: "Instant In-Game Delivery, Bonus Draft Tokens, Exclusive Season Pass XP Boost",
      offer: "$99.99 Bundle",
      badge: "BEST VALUE",
      primaryCta: "Add to Bag",
      imagePrompt: "Digital Ultimate Team FC Points currency card pack with glowing gold and neon green geometric accents on clean dark studio backdrop, 3:4 aspect ratio"
    },
    {
      id: "chiclet-3",
      title: "FC IQ Tactical & Coaching Masterclass DLC",
      categoryName: "Career Mode Expansion",
      fragranceNotes: "Advanced AI Tactics Engine, 50+ Real Manager Playbooks, Scouting Network Upgrades",
      offer: "$29.99 Expansion",
      badge: "NEW DLC",
      primaryCta: "Add to Bag",
      imagePrompt: "Futuristic digital tactical board with glowing player position holograms and tactical chalkboard arrows on premium stadium background, 3:4 aspect ratio"
    },
    {
      id: "chiclet-4",
      title: "Official Licensed Club Kit & Stadium Bundle",
      categoryName: "Clubs & Ultimate Team Customization",
      fragranceNotes: "Exclusive Retro Match Kits, Custom Stadium Tifo, Dynamic Crowd Anthems",
      offer: "$19.99 Bundle",
      badge: "EXCLUSIVE",
      primaryCta: "Add to Bag",
      imagePrompt: "Authentic licensed football jerseys and match balls displayed in sleek modern locker room under dramatic spotlight, 3:4 aspect ratio"
    }
  ],
  personaMatchReason: "Curated for Marcus Vance based on high engagement in Ultimate Team competitive seasons and demand for early access digital currency bundles.",
  timestamp: new Date().toLocaleString()
};

export const PersonalizedExperience: React.FC = () => {
  const { name } = useCompanyContext();
  const { config } = useAppConfig();
  const companyName = config?.branding?.companyName || name || 'EA Games FC';

  // State Management
  const [personas, setPersonas] = useState<any[]>(DEFAULT_PERSONAS);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(DEFAULT_PERSONAS[0].id);
  const [storefront, setStorefront] = useState<PersonalizedStorefrontData>(DEFAULT_STOREFRONT);
  const [chicletImages, setChicletImages] = useState<Record<string, string>>({});
  const [heroImage, setHeroImage] = useState<string | null>(null);
  
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [customGuidance, setCustomGuidance] = useState<string>('');
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Selected persona object
  const activePersona = useMemo(() => {
    return personas.find(p => p.id === selectedPersonaId) || personas[0] || DEFAULT_PERSONAS[0];
  }, [personas, selectedPersonaId]);

  // Load Saved Personas from A2A Live/Cache with GCS & Double Fallback
  useEffect(() => {
    const loadGcsPersonas = async () => {
      try {
        // 1. Primary: Load 7 live/cached A2A Audience Profiles
        const a2aPlayers = await fetchA2AAudiences(7);
        if (a2aPlayers && a2aPlayers.length > 0) {
          const mapped = mapA2AToStorefrontPersonas(a2aPlayers, DEFAULT_PERSONAS);
          console.log(`[PersonalizedExperience] Loaded ${mapped.length} A2A gamer profiles:`, mapped.map(p => p.name));
          setPersonas(mapped);
          setSelectedPersonaId(mapped[0].id);
          return;
        }

        // 2. Secondary fallback: load generated personas from audience_generator
        const res = await fetch(`/api/load-run/audience_generator?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.personas && Array.isArray(data.personas) && data.personas.length > 0) {
            const normalized = data.personas.map((p: any, idx: number) => {
              const personaName = p.personaName || p.details?.name || p.name || `Player ${idx + 1}`;
              const cohortTitle = p.name !== personaName ? p.name : (p.details?.job_title || 'Gaming Cohort');
              const ageStr = p.details?.age ? `Age ${p.details.age}` : '';
              const demoLabel = [ageStr, p.details?.job_title || p.status || p.location].filter(Boolean).join(', ') || p.demographics || 'Dedicated Player';

              return {
                id: p.id || `persona_${idx}_${personaName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: personaName,
                cohortTitle,
                demographics: demoLabel,
                interests: p.details?.preferred_products || p.details?.lifestyle_tags || (p.coreValues ? [p.coreValues] : ["Ultimate Team", "Career Mode", "FC Points"]),
                intentScores: { 
                  categoryAffinity: cohortTitle || "EA Sports FC 27", 
                  purchaseIntent: p.details?.charts?.brand_affinity?.data ? p.details.charts.brand_affinity.data[p.details.charts.brand_affinity.data.length - 1] : 92 
                },
                behavioralTags: p.details?.lifestyle_tags || [p.status, p.financialHealth].filter(Boolean),
                observations: p.details?.bio || p.bioLifestyleNeeds || p.nba || "Dedicated EA Sports FC enthusiast engaging with upcoming game features.",
                imageUrl: p.imageUrl || p.details?.imageUrl || p.image || null,
                imagePrompt: p.imagePrompt || null
              };
            });

            console.log(`[PersonalizedExperience] Loaded ${normalized.length} personas from audience_generator:`, normalized.map(p => p.name));
            setPersonas(normalized);
            setSelectedPersonaId(normalized[0].id);
            return;
          }
        }

        // 2. Secondary fallback: check synthetic_users
        const usersRes = await fetch(`/api/load-run/synthetic_users?companyName=${encodeURIComponent(companyName)}`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.generatedUsers && Array.isArray(usersData.generatedUsers) && usersData.generatedUsers.length > 0) {
            const mappedUsers = usersData.generatedUsers.map((u: any, idx: number) => ({
              id: u.id || `user_${idx}`,
              name: u.name || `User ${idx + 1}`,
              cohortTitle: u.personaName || u.baseAudienceName || 'Synthetic Player',
              demographics: u.demographics || 'Player Profile',
              interests: u.digitalFootprint?.last3SearchQueries || ["EA Sports FC", "Ultimate Team"],
              intentScores: { categoryAffinity: u.baseAudienceName || "EA Sports FC 27", purchaseIntent: 85 },
              behavioralTags: u.details?.lifestyle_tags || ["Gamer"],
              observations: u.bio || u.whyPerfect || "Active community participant.",
              imageUrl: u.imageUrl || null
            }));
            setPersonas(mappedUsers);
            setSelectedPersonaId(mappedUsers[0].id);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not load GCS audience personas, using default EA SPORTS FC personas:", e);
      }

      // Default fallback
      setPersonas(DEFAULT_PERSONAS);
      setSelectedPersonaId(DEFAULT_PERSONAS[0].id);
    };
    loadGcsPersonas();
  }, [companyName]);

  // Load Last Generated Storefront from GCS
  const handleLoadLast = async (quiet = false) => {
    if (!quiet) setStatusMessage("Loading last personalized experience from GCS...");
    try {
      const res = await fetch(`/api/load-run/storefront_experience?companyName=${encodeURIComponent(companyName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.storefront) {
          setStorefront(data.storefront);
          if (data.chicletImages) setChicletImages(data.chicletImages);
          if (data.heroImage) setHeroImage(data.heroImage);
          if (data.personaId) setSelectedPersonaId(data.personaId);
          setStatusMessage(`Restored saved experience from GCS (${data.timestamp || 'latest'})`);
          return true;
        }
      }
    } catch (e) {
      console.warn("Failed to load last personalized experience:", e);
    }
    if (!quiet) setStatusMessage("No previous personalized experience found in GCS.");
    return false;
  };

  useEffect(() => {
    handleLoadLast(true);
  }, [companyName]);

  // Save to GCS
  const handleSaveToGCS = async () => {
    setStatusMessage("Saving personalized experience to GCS...");
    try {
      const response = await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'storefront_experience',
          data: {
            personaId: activePersona.id,
            personaName: activePersona.name,
            storefront,
            chicletImages,
            heroImage,
            timestamp: new Date().toLocaleString()
          },
          companyName
        })
      });
      if (response.ok) {
        setStatusMessage(`Saved run to GCS bucket: ${companyName}/runs/storefront_experience_run.json`);
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setStatusMessage("Failed to save experience to GCS.");
      }
    } catch (e) {
      setStatusMessage("Error saving experience to GCS.");
    }
  };

  // Generate Image for a specific chiclet
  const handleGenerateChicletImage = async (chicletId: string, prompt: string) => {
    setGeneratingImages(prev => ({ ...prev, [chicletId]: true }));
    try {
      const enhancedPrompt = `${prompt}, official EA SPORTS FC 27 video game packshot cover art, clean dark studio backdrop, crisp dramatic commercial lighting, 3:4 aspect ratio`;
      const imageUrl = await generateImage(enhancedPrompt, 'gemini-3.1-flash-lite-image', '3:4');
      if (imageUrl) {
        setChicletImages(prev => ({ ...prev, [chicletId]: imageUrl }));
      }
    } catch (err) {
      console.error(`Failed to generate image for chiclet ${chicletId}:`, err);
    } finally {
      setGeneratingImages(prev => ({ ...prev, [chicletId]: false }));
    }
  };

  // Generate Hero Lifestyle Image (16:9)
  const handleGenerateHeroImage = async (prompt?: string) => {
    const targetPrompt = prompt || storefront.hero.heroImagePrompt || "Cinematic promotional hero banner for EA SPORTS FC 27 video game, world-class football superstars on illuminated pitch, electric floodlights, 16:9 aspect ratio";
    setGeneratingImages(prev => ({ ...prev, hero: true }));
    try {
      const enhancedPrompt = `${targetPrompt}, 8k resolution, photorealistic, cinematic stadium illumination, 16:9 aspect ratio`;
      const imageUrl = await generateImage(enhancedPrompt, 'gemini-3.1-flash-lite-image', '16:9');
      if (imageUrl) {
        setHeroImage(imageUrl);
      }
    } catch (err) {
      console.error("Failed to generate hero image:", err);
    } finally {
      setGeneratingImages(prev => ({ ...prev, hero: false }));
    }
  };

  // Orchestrate Full Storefront Generation for Selected Persona
  const handleGenerateFullExperience = async () => {
    setIsGeneratingCopy(true);
    setStatusMessage(`Synthesizing EA SPORTS FC storefront for ${activePersona.name}...`);
    
    try {
      // Step 1: Text Orchestration with gemini-3.5-flash
      const generatedData = await generatePersonalizedStorefront(
        activePersona, 
        companyName, 
        customGuidance
      );

      if (generatedData) {
        setStorefront(generatedData);
        setStatusMessage(`Generated personalized layout. Rendering 16:9 hero and product chiclets...`);
        setIsGeneratingCopy(false);

        // Step 2: Trigger Hero & Chiclet Image Generations concurrently
        handleGenerateHeroImage(generatedData.hero.heroImagePrompt);

        // Generate images for all 4 chiclets
        if (generatedData.chiclets && Array.isArray(generatedData.chiclets)) {
          generatedData.chiclets.forEach((c) => {
            handleGenerateChicletImage(c.id, c.imagePrompt);
          });
        }

        setStatusMessage(`Personalized experience ready for ${activePersona.name}!`);
        setTimeout(() => setStatusMessage(''), 5000);
      } else {
        setStatusMessage("Failed to generate storefront layout. Please retry.");
        setIsGeneratingCopy(false);
      }
    } catch (err) {
      console.error("Storefront orchestration error:", err);
      setStatusMessage("Error generating personalized storefront.");
      setIsGeneratingCopy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Persona HUD Switcher Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {personas.map((p) => {
          const isSelected = p.id === selectedPersonaId;
          const isSlump = p.cohortTitle?.includes('Slump');
          const isWinStreak = p.cohortTitle?.includes('Win') || p.cohortTitle?.includes('In-Form') || p.cohortTitle?.includes('Champions');
          const isWhale = p.cohortTitle?.includes('Whale') || p.cohortTitle?.includes('VIP') || p.cohortTitle?.includes('Spender');
          const isCasual = p.cohortTitle?.includes('Casual') || p.cohortTitle?.includes('Rush') || p.cohortTitle?.includes('Clubs');

          return (
            <button
              key={p.id}
              onClick={() => setSelectedPersonaId(p.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0AF468]/15 border-[#0AF468] shadow-[0_0_15px_rgba(10,244,104,0.25)] ring-1 ring-[#0AF468]'
                  : 'bg-[#0D131D]/80 border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-extrabold text-xs text-white truncate max-w-[90px]">{p.name}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#0AF468] animate-pulse shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block truncate font-mono">
                  {p.telemetry?.favorite_club || p.behavioralTags?.[2] || 'FC Club'}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-white/10">
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded block truncate text-center ${
                  isSlump 
                    ? 'bg-[#FF4757]/15 text-[#FF4757] border border-[#FF4757]/30' 
                    : isWinStreak 
                    ? 'bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30'
                    : isWhale
                    ? 'bg-[#FFB800]/15 text-[#FFB800] border border-[#FFB800]/30'
                    : isCasual
                    ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                    : 'bg-white/10 text-slate-300 border border-white/15'
                }`}>
                  {p.cohortTitle?.split('•')?.[1]?.trim() || p.cohortTitle || 'Active'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Top Control Bar */}
      <div className="bg-[#0D131D]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-400">
              1-to-1 Experience Merchandising Engine
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {companyName} Personalized Experience
          </h2>
        </div>

        {/* Global Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Persona Selection Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#080A0E] border border-white/15 rounded-xl px-3 py-2 shadow-xs">
            <User size={14} className="text-emerald-600 shrink-0" />
            <select
              value={selectedPersonaId}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer pr-1"
              aria-label="Select Target Persona"
            >
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.cohortTitle ? `— ${p.cohortTitle}` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsGuidanceOpen(!isGuidanceOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-2 border border-white/10 rounded-xl text-xs font-bold transition bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white ${
              isGuidanceOpen ? 'bg-[#349DD4]/15 border-[#349DD4]/40 text-[#349DD4]' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <SlidersHorizontal size={13} />
            Strategy Guidance
          </button>
          
          <button
            onClick={() => handleLoadLast(false)}
            className="px-3 py-2 flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white rounded-xl shadow-xs transition"
            title="Load last saved storefront run from GCS"
          >
            <RotateCw size={13} />
            Load Last
          </button>

          <button
            onClick={handleSaveToGCS}
            className="px-3.5 py-2 flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Save size={13} />
            Save Run
          </button>

          <button
            onClick={handleGenerateFullExperience}
            disabled={isGeneratingCopy}
            className="px-4 py-2 btn-primary flex items-center gap-2 px-5 py-2 text-xs font-black rounded-xl shadow-md transition"
          >
            {isGeneratingCopy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Synthesizing Storefront...
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
                Generate for Selected Persona
              </>
            )}
          </button>
        </div>
      </div>

      {/* Optional Strategy Prompt Guidance Box */}
      {isGuidanceOpen && (
        <div className="bg-[#0D131D]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl animate-fadeIn text-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0AF468] flex items-center gap-1.5">
              <Sparkles size={14} />
              Custom Merchandising & Campaign Direction
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Optional LLM Steering</span>
          </div>
          <textarea
            rows={2}
            value={customGuidance}
            onChange={(e) => setCustomGuidance(e.target.value)}
            placeholder="e.g. Focus on Ultimate Team TOTY promo packs, Weekend League qualification bonuses, and FC IQ tactical coach upgrades..."
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-none placeholder-slate-400"
          />
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className="p-3 bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] text-xs rounded-xl flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EA SPORTS FC LIVE STOREFRONT INTERACTIVE UI                              */}
      {/* ========================================================================= */}
      <div className="bg-[#0B0E14] text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden font-sans">
        
        {/* MASSIVE 16:9 FULL-BLEED HERO BANNER */}
        <div className="relative w-full aspect-video min-h-[420px] max-h-[640px] bg-slate-950 overflow-hidden flex items-end">
          {heroImage ? (
            <img 
              src={heroImage} 
              alt={storefront.hero.title}
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-black flex items-center justify-center z-0">
              <div className="text-center text-white/60 p-6">
                <Sparkles size={48} className="mx-auto mb-2 text-emerald-400 opacity-60" />
                <p className="text-xs font-mono">16:9 Full-Bleed EA SPORTS FC 27 Hero Visual</p>
                <p className="text-[10px] text-white/40">Click "Generate for Selected Persona" to synthesize new scene</p>
              </div>
            </div>
          )}

          {/* Dark Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 pointer-events-none"></div>

          {/* Lower-Left Hero Content Overlay */}
          <div className="relative z-20 p-6 md:p-12 text-white max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <Zap size={13} />
              Next-Gen Football Simulation
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-md leading-tight text-white">
              {storefront.hero.title || "The World's Game. Evolved."}
            </h1>
            
            <p className="text-xs md:text-base text-slate-200 font-medium leading-relaxed drop-shadow max-w-lg">
              {storefront.hero.subtitle || "Experience HypermotionV+ volumetric capture, FC IQ tactical overhaul, and authentic club atmospheres."}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button className="px-8 py-3 bg-[#349DD4] text-white hover:bg-[#2b84b3] transition-all text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#349DD4]/20">
                {storefront.hero.ctaText || "Pre-Order Now"}
              </button>

              <button
                onClick={() => handleGenerateHeroImage()}
                disabled={generatingImages.hero}
                className="px-4 py-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                title="Regenerate 16:9 Hero Image with Gemini"
              >
                {generatingImages.hero ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                <span>Regenerate Scene</span>
              </button>
            </div>
          </div>

          {/* Lower-Right Video / Audio Controls */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 text-white/90">
            <button 
              onClick={() => setIsMarqueePaused(!isMarqueePaused)}
              className="p-2 bg-black/60 hover:bg-black/90 backdrop-blur-sm rounded-full transition border border-white/20"
              title="Pause Ticker"
            >
              <Pause size={14} />
            </button>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-black/60 hover:bg-black/90 backdrop-blur-sm rounded-full transition border border-white/20"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>

        {/* 5. PERSONALIZED 4-CHICLET GAMING SECTION */}
        <div className="p-6 md:p-10 bg-[#0B0E14] border-t border-slate-800">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {storefront.chicletSectionTitle || "Recommended For Your Playstyle"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Curated game editions & digital bundles tailored for <span className="text-emerald-400 font-bold">{activePersona.name}</span>
              </p>
            </div>

            {/* Carousel Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full border border-slate-700 text-slate-400 hover:bg-slate-800 transition">
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 rounded-full border border-slate-700 text-slate-400 hover:bg-slate-800 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 4 Personalized Chiclets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {storefront.chiclets.map((c, idx) => (
              <div 
                key={c.id || idx}
                className="bg-[#121722] rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-emerald-500/50 transition-all flex flex-col group relative"
              >
                {/* Chiclet Image Container (3:4 Ratio) */}
                <div className="relative aspect-[3/4] bg-slate-900 overflow-hidden flex items-center justify-center p-4">
                  {chicletImages[c.id] ? (
                    <img 
                      src={chicletImages[c.id]} 
                      alt={c.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-lg" 
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-4">
                      <Gamepad2 size={32} className="mx-auto mb-2 text-slate-400" />
                      <span className="text-[10px] font-mono block text-slate-400">Box Art Render</span>
                      <button
                        onClick={() => handleGenerateChicletImage(c.id, c.imagePrompt)}
                        disabled={generatingImages[c.id]}
                        className="mt-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-bold shadow-xs transition inline-flex items-center gap-1"
                      >
                        {generatingImages[c.id] ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Render Packshot
                      </button>
                    </div>
                  )}

                  {/* Badge */}
                  {c.badge && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="bg-emerald-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-md">
                        {c.badge}
                      </span>
                    </div>
                  )}

                  {/* Quick Re-roll image button */}
                  {chicletImages[c.id] && (
                    <button
                      onClick={() => handleGenerateChicletImage(c.id, c.imagePrompt)}
                      disabled={generatingImages[c.id]}
                      className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-black/80 hover:bg-black text-slate-300 rounded-full shadow-sm border border-slate-700 transition opacity-0 group-hover:opacity-100"
                      title="Re-generate Chiclet Product Photo"
                    >
                      {generatingImages[c.id] ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    </button>
                  )}
                </div>

                {/* Chiclet Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-[#121722]">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-wider block">
                      {c.categoryName}
                    </span>
                    <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5" title={c.title}>
                      {c.title}
                    </h4>
                    {c.fragranceNotes && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {c.fragranceNotes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    {c.offer && (
                      <div className="text-xs font-black text-emerald-400">
                        {c.offer}
                      </div>
                    )}
                    <button className="btn-primary w-full py-2.5 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md">
                      {c.primaryCta || "Pre-Order"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
