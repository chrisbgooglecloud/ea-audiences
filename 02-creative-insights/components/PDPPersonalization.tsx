import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search as SearchIcon, 
  Star, 
  Heart, 
  User, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Globe, 
  Gamepad2, 
  Trophy, 
  Shield, 
  Zap, 
  RotateCw, 
  Save, 
  Loader2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { generatePersonalizedPDPContent, generateImage, generateImageWithReference } from '../services/geminiService';
import { useCompanyContext } from '../context/CompanyContext';
import { useAppConfig } from '../context/AppConfigContext';

export interface RegionalEdition {
  id: string;
  name: string; // Region or Country Name e.g. "Default", "Spain", "USA"
  starPlayer: string;
  teamOrClub: string;
  whyPerfect: string;
  description: string;
  regionalPerks: string[];
  image: string; // URL or Base64
  isDefault?: boolean;
}

const DEFAULT_PRODUCT_NAME = "EA SPORTS FC 27";
const DEFAULT_EDITIONS = [
  { name: "Standard Edition", price: "$69.99", desc: "Base game + 500 FC Points + Cover Star Loan Item" },
  { name: "Ultimate Edition", price: "$99.99", desc: "7-Day Early Access + 4,600 FC Points + Untradeable Hero Item + Dual Entitlement" },
  { name: "Champions Club Edition", price: "$119.99", desc: "Ultimate Perks + Season Pass 1 Premium + Hometown Stadium Kit & VIP Anthems" }
];

const DEFAULT_PLATFORMS = [
  "PlayStation®5",
  "Xbox Series X|S",
  "PC (EA App / Steam)",
  "Nintendo Switch™ 2"
];

// Pre-seeded Default Global Edition featuring Kylian Mbappé on PS5
const DEFAULT_REGIONAL_EDITIONS: RegionalEdition[] = [
  {
    id: "edition_default_mbappe",
    name: "Default",
    starPlayer: "Kylian Mbappé",
    teamOrClub: "Real Madrid & France",
    whyPerfect: "Showcases world superstar Kylian Mbappé in his official Real Madrid kit standing atop the world's football capitals.",
    description: "EA SPORTS FC 27 Global Edition delivers next-gen volumetric HypermotionV+ realism, full UEFA Champions League licensing, and authentic matchday atmospheres from the Bernabéu to Wembley.",
    regionalPerks: [
      "Untradeable 91-rated Kylian Mbappé Ultimate Team Loan Item (25 Matches)",
      "4,600 FC Points (Ultimate Edition Pre-Order)",
      "Founder Status Stadium Kit & Tifo",
      "Signature PlayStyle+ Rapid Dribbler Perk"
    ],
    image: "/images/fc27_default_cover.jpg",
    isDefault: true
  }
];

export const PDPPersonalization: React.FC = () => {
  const { name } = useCompanyContext();
  const { config } = useAppConfig();
  const companyName = config?.branding?.companyName || name || 'EA Games FC';

  const [editions, setEditions] = useState<RegionalEdition[]>(DEFAULT_REGIONAL_EDITIONS);
  const [selectedEditionId, setSelectedEditionId] = useState<string>(DEFAULT_REGIONAL_EDITIONS[0].id);
  const [locationInput, setLocationInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(DEFAULT_EDITIONS[1].name); // Default to Ultimate Edition
  const [selectedPlatform, setSelectedPlatform] = useState(DEFAULT_PLATFORMS[0]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const activeEdition = editions.find(e => e.id === selectedEditionId) || editions[0] || DEFAULT_REGIONAL_EDITIONS[0];
  const activeFormatObj = DEFAULT_EDITIONS.find(f => f.name === selectedFormat) || DEFAULT_EDITIONS[1];

  // Helper: Persist run to GCS immediately
  const persistToGCS = async (targetEditions: RegionalEdition[], activeId?: string, silent = false) => {
    if (!silent) setStatusMessage("Saving to GCS...");
    try {
      const res = await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'pdp_personalization',
          data: {
            editions: targetEditions,
            selectedEditionId: activeId || (targetEditions[0] ? targetEditions[0].id : ''),
            timestamp: new Date().toLocaleString()
          },
          companyName
        })
      });
      if (res.ok && !silent) {
        setStatusMessage(`Saved run to GCS: ${companyName}/runs/pdp_personalization_run.json`);
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) {
      console.warn("Failed to persist PDP personalization run to GCS:", err);
      if (!silent) setStatusMessage("Failed to save to GCS.");
    }
  };

  // Load Saved Regional Editions from GCS
  const handleLoadLast = async (silent = false) => {
    if (!silent) setStatusMessage("Loading saved PDP editions from GCS...");
    try {
      const res = await fetch(`/api/load-run/pdp_personalization?companyName=${encodeURIComponent(companyName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.editions && Array.isArray(data.editions) && data.editions.length > 0) {
          // Ensure the Default Mbappé edition is always present at index 0
          const loadedCustomEditions = data.editions.filter((e: any) => e.id !== 'edition_default_mbappe' && e.name !== 'Default');
          const merged = [DEFAULT_REGIONAL_EDITIONS[0], ...loadedCustomEditions];
          setEditions(merged);

          // Always ensure the default Mbappé edition is shown first when reloading the page
          setSelectedEditionId(DEFAULT_REGIONAL_EDITIONS[0].id);

          if (!silent) {
            setStatusMessage(`Restored ${merged.length} localized cover editions from GCS.`);
            setTimeout(() => setStatusMessage(''), 4000);
          }
          return true;
        }
      }
    } catch (e) {
      console.warn("Could not load GCS saved PDP personalization run:", e);
    }
    if (!silent) {
      setStatusMessage("No previous PDP personalization run found in GCS. Using default cover.");
      setTimeout(() => setStatusMessage(''), 3000);
    }
    return false;
  };

  useEffect(() => {
    handleLoadLast(true);
  }, [companyName]);

  // Generate new location cover art & localized PDP using reference style matching
  const handleGenerateLocationEdition = async (targetLocation?: string) => {
    const loc = (targetLocation || locationInput).trim();
    if (!loc) return;

    setIsGenerating(true);
    setStatusMessage(`Synthesizing EA SPORTS FC 27 cover art & local star athlete for "${loc}" using reference packshot style...`);

    try {
      // 1. Text & Star Player Resolution using gemini-3.5-flash
      const content = await generatePersonalizedPDPContent(loc, "EA SPORTS FC 27", companyName);

      // 2. Reference Image-to-Image Generation (Match PS5 Packshot Style but change player, jersey & background city)
      const defaultReferenceImage = DEFAULT_REGIONAL_EDITIONS[0].image;
      const iconicCity = content.iconicCity || loc;
      const boxArtPrompt = `Official PlayStation 5 (PS5) video game packshot box art cover for EA SPORTS FC 27.
Match the EXACT visual style, camera angle, perspective, high-noon lighting, PS5 blue header banner, and composition from the reference image, but update the player, jersey, and background city:
- Replace the center athlete with ${content.starPlayer || loc} standing in the identical full-body open-arms hero pose, wearing the official ${content.teamOrClub || 'national team or marquee club'} football jersey and shorts.
- Include a high-res official UEFA Champions League match soccer ball by their feet on the rooftop overlook ledge.
- Background Cityscape Transformation: Replace the background cityscape with the iconic, recognizable skyline and landmark architecture of ${iconicCity}, featuring famous monuments, local scenery, and AT MOST ONE single realistic stadium or arena of ${iconicCity} visible in the distance under a bright daytime sky. CRITICAL REQUIREMENT: Do NOT generate multiple arenas, duplicate stadiums, or overlapping sports venues. Ensure only ONE stadium is rendered so the environment looks photorealistic, cohesive, and geographically accurate to the location.
- Retain the bold white "EA SPORTS FC 27" logo centered across the top sky, the official PS5 header banner across the top, and the ESRB rating / league badge icons at the bottom.
3:4 aspect ratio packshot cover art.`;
      
      let imageUrl: string | null = null;
      try {
        imageUrl = await generateImageWithReference(
          boxArtPrompt, 
          [defaultReferenceImage], 
          'image/jpeg', 
          'gemini-3.1-flash-lite-image', 
          '3:4'
        );
      } catch (refErr) {
        console.warn("generateImageWithReference failed, falling back to direct prompt generation:", refErr);
      }

      if (!imageUrl) {
        imageUrl = await generateImage(boxArtPrompt, 'gemini-3.1-flash-lite-image', '3:4');
      }

      const newEdition: RegionalEdition = {
        id: `edition_${Date.now()}_${loc.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: loc,
        starPlayer: content.starPlayer || loc,
        teamOrClub: content.teamOrClub || "Marquee Club",
        whyPerfect: content.whyPerfect || `Customized for football fans in ${loc} with regional stars and perks.`,
        description: content.description || `EA SPORTS FC 27 ${loc} Edition delivers next-gen realism, localized commentary, and official club licensing.`,
        regionalPerks: content.regionalPerks && content.regionalPerks.length > 0 ? content.regionalPerks : [
          `Untradeable ${content.starPlayer || loc} Ultimate Team Loan Item`,
          "4,600 FC Points (Ultimate Edition)",
          "Hometown Stadium Kit & Tifo",
          "PlayStyle+ Signature Trait Unlock"
        ],
        image: imageUrl || DEFAULT_REGIONAL_EDITIONS[0].image,
        isDefault: false
      };

      // Keep Default at [0], then new edition, then other custom editions
      const otherCustomEditions = editions.filter(e => !e.isDefault && e.name.toLowerCase() !== loc.toLowerCase());
      const updated = [DEFAULT_REGIONAL_EDITIONS[0], newEdition, ...otherCustomEditions];
      
      setEditions(updated);
      setSelectedEditionId(newEdition.id);
      setLocationInput('');

      // Auto-save to GCS immediately so state persists across tabs
      await persistToGCS(updated, newEdition.id, true);

      setStatusMessage(`Generated and saved EA SPORTS FC 27 cover featuring ${newEdition.starPlayer}!`);
      setTimeout(() => setStatusMessage(''), 5000);

    } catch (err) {
      console.error("Failed to generate regional edition:", err);
      setStatusMessage("Error generating regional edition. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteEdition = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = editions.filter(e => e.id !== id);
    const finalEditions = updated.length > 0 ? updated : DEFAULT_REGIONAL_EDITIONS;
    setEditions(finalEditions);
    const nextId = selectedEditionId === id ? finalEditions[0].id : selectedEditionId;
    setSelectedEditionId(nextId);
    await persistToGCS(finalEditions, nextId, true);
    setStatusMessage("Deleted edition and updated GCS run.");
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="font-sans text-slate-100 w-full min-h-screen bg-[#080B10] flex flex-col">

      {/* 1. EA SPORTS FC GAMING STORE HEADER */}
      <header className="bg-[#0E131E] border-b border-white/10 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Nav */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tighter text-white flex items-center gap-1.5">
                <span className="text-[#0AF468]">EA</span> SPORTS <span className="bg-white text-black px-2 py-0.5 rounded font-mono text-sm font-black">FC 27</span>
              </span>
            </div>

            <nav className="hidden lg:flex items-center gap-6 text-slate-300 font-bold text-xs uppercase tracking-wider">
              <a href="#" className="hover:text-[#0AF468] transition-colors">Ultimate Team</a>
              <a href="#" className="hover:text-[#0AF468] transition-colors">Clubs &amp; VOLTA</a>
              <a href="#" className="hover:text-[#0AF468] transition-colors">Career Mode</a>
                            <a href="#" className="text-[#0AF468] font-black flex items-center gap-1">
                <Sparkles size={12} />
                Global Pre-Order Studio
              </a>
            </nav>
          </div>

          {/* Right: Studio Header Badge */}
          <div className="flex items-center gap-3 text-slate-300 font-medium text-xs">
            <div className="flex items-center gap-1.5 bg-white/5 text-slate-300 px-3 py-1.5 rounded-full border border-white/10 text-xs font-mono font-bold">
              <Sparkles size={13} className="text-[#0AF468]" />
              <span>Box Art Studio</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN PDP WORKSPACE */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 flex-1 w-full">
        
        {/* Status Toast */}
        {statusMessage && (
          <div className="p-3 bg-emerald-950/90 border border-[#0AF468]/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg animate-fadeIn">
            <Sparkles size={15} className="text-[#0AF468] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* MAIN PDP INTERACTIVE VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#0F1420] rounded-3xl border border-white/10 shadow-2xl p-6 md:p-10">

          {/* ================================================================= */}
          {/* LEFT COLUMN: FEATURED BOX ART + LOCALIZATION INPUT + EDITIONS     */}
          {/* ================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Box Art Container */}
            <div className="aspect-[3/4] max-h-[580px] w-full mx-auto relative group bg-[#080B10] border-2 border-white/10 rounded-3xl overflow-hidden p-3 flex items-center justify-center shadow-2xl">
              
              {/* Cover Art Visual */}
              <img
                src={activeEdition.image || "/images/fc27_default_cover.jpg"}
                alt={`EA SPORTS FC 27 ${activeEdition.name} Cover`}
                className="w-full h-full object-contain rounded-2xl group-hover:scale-101 transition-transform duration-500 shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = "/images/fc27_default_cover.jpg";
                }}
              />

              {/* Dynamic Cover Star Overlay Badge */}
              <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full text-xs font-black text-white shadow-xl flex items-center gap-2 border border-[#0AF468]/40">
                <Trophy size={14} className="text-[#0AF468]" />
                Featured Cover Athlete: <span className="text-[#0AF468]">{activeEdition.starPlayer}</span>
              </div>

              {/* Region Tag */}
              <div className="absolute bottom-6 right-6 bg-[#0AF468] text-black px-4 py-1.5 rounded-full text-xs font-black shadow-xl flex items-center gap-1.5 uppercase tracking-wider">
                <Globe size={13} />
                {activeEdition.name}
              </div>
            </div>

            {/* DIRECTLY BELOW COVER IMAGE: TEXT ENTRY & GENERATE BUTTON */}
            <div className="bg-[#141A28] p-5 rounded-2xl border border-white/10 space-y-3 shadow-lg">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles size={15} className="text-[#0AF468]" />
                Localize Cover for Any Country, City, or Club:
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Try: 'Spain', 'USA', 'Brazil', 'Japan', 'Argentina', 'Portland Timbers', 'Real Madrid'..."
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-emerald-400 transition"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateLocationEdition()}
                  disabled={isGenerating}
                  aria-label="Custom location or club"
                />
                <button
                  onClick={() => handleGenerateLocationEdition()}
                  disabled={!locationInput.trim() || isGenerating}
                  className="bg-[#0AF468] hover:bg-emerald-400 disabled:opacity-50 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      Generate Box Art
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DIRECTLY BELOW GENERATOR: SWITCH BETWEEN CREATED REGIONAL EDITIONS */}
            <div className="bg-[#141A28] p-5 rounded-2xl border border-white/10 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers size={14} className="text-[#0AF468]" />
                  Switch Between Created Regional Editions ({editions.length}):
                </span>
                <span className="text-[11px] font-mono text-slate-500">Click to switch region</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {editions.map(ed => (
                  <div
                    key={ed.id}
                    onClick={() => setSelectedEditionId(ed.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center gap-2
                      ${selectedEditionId === ed.id
                        ? 'bg-[#0AF468] text-black border-emerald-400 shadow-lg shadow-emerald-500/20 transform -translate-y-0.5'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500 hover:text-white'
                      }`}
                  >
                    <span>{ed.name}</span>
                    <span className="text-[10px] opacity-75 font-normal">({ed.starPlayer})</span>
                    {!ed.isDefault && (
                      <span
                        onClick={(e) => handleDeleteEdition(ed.id, e)}
                        className="hover:text-red-400 ml-1 p-0.5"
                        title="Delete Edition"
                      >
                        <Trash2 size={12} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: LOCALIZED PRODUCT & PRE-ORDER DETAILS (5 cols)      */}
          {/* ================================================================= */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            
            {/* Main Title & Region Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#0AF468]/10 text-[#0AF468] border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-3">
                <Shield size={12} />
                Official Licensed Product • {activeEdition.name}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-1">
                {DEFAULT_PRODUCT_NAME}
              </h1>
              
              <h2 className="text-sm font-bold text-[#0AF468] tracking-wide uppercase">
                {activeEdition.name} featuring {activeEdition.starPlayer}
              </h2>

              {/* Star Rating */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex text-amber-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={15} fill="currentColor" className="text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-300">4.9 / 5.0 (Global Playtest Rating)</span>
              </div>
            </div>

            {/* Price & Release Info */}
            <div className="bg-[#141A28] p-4 rounded-2xl border border-white/10 space-y-1">
              <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-2">
                <span>{activeFormatObj.price}</span>
                <span className="text-xs font-normal text-slate-400">Pre-Order Price Guarantee</span>
              </div>
              <div className="text-xs text-[#0AF468] font-bold">
                ✓ Worldwide Launch: September 2026 • 7-Day Early Access with Ultimate Edition
              </div>
              <div className="text-[11px] text-slate-400">
                Digital download with Dual Entitlement (PS4/PS5 &amp; Xbox One/Series X|S)
              </div>
            </div>

            {/* Why This Edition Is Perfect Box */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl space-y-1">
              <h3 className="font-bold text-[#0AF468] text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Heart size={13} className="text-[#0AF468] fill-current" />
                Why We Love The {activeEdition.name} Edition
              </h3>
              <p className="text-slate-200 text-xs italic leading-relaxed">
                "{activeEdition.whyPerfect}"
              </p>
            </div>

            {/* Localized Description */}
            <div className="relative border-l-2 border-emerald-500 pl-4 py-1">
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {activeEdition.description}
              </p>
            </div>

            {/* Regional Pre-Order Perks List */}
            <div className="bg-[#141A28] p-5 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy size={14} className="text-[#0AF468]" />
                {activeEdition.name} Exclusive Pre-Order Bonuses:
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {activeEdition.regionalPerks.map((perk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={14} className="text-[#0AF468] shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Select Platform</span>
                <span className="text-[#0AF468]">{selectedPlatform}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_PLATFORMS.map(platform => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold text-center transition-all ${
                      selectedPlatform === platform
                        ? 'border-emerald-500 bg-[#0AF468]/20 text-white font-black shadow-sm'
                        : 'border-white/10 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Edition Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Select Game Edition</span>
                <span className="text-[#0AF468]">{selectedFormat}</span>
              </label>
              <div className="space-y-2">
                {DEFAULT_EDITIONS.map(ed => (
                  <div
                    key={ed.name}
                    onClick={() => setSelectedFormat(ed.name)}
                    className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      selectedFormat === ed.name
                        ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-sm'
                        : 'border-white/10 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-white">{ed.name}</div>
                      <div className="text-[10px] text-slate-400">{ed.desc}</div>
                    </div>
                    <div className="text-xs font-black text-[#0AF468] shrink-0 ml-3">
                      {ed.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase CTA Buttons */}
            <div className="pt-2 space-y-3">
              <button className="w-full bg-[#0AF468] hover:bg-emerald-400 text-black font-black tracking-wider py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-sm uppercase">
                <ShoppingCart size={18} />
                Pre-Order {activeFormatObj.name} ({activeFormatObj.price})
              </button>

              <div className="text-[11px] text-slate-500 font-medium text-center">
                Includes EA Play 10-hour early trial + 10% member discount at checkout.
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
