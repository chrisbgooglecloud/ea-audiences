import React, { useState, useEffect } from 'react';
import { 
  Shirt, 
  Sparkles, 
  RotateCw, 
  Save, 
  Upload, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Flame, 
  Trophy, 
  Layers, 
  Eye, 
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import { useCompanyContext } from '../context/CompanyContext';
import { generateImage, generateImageWithReference, GEMINI_MODELS } from '../services/geminiService';

export interface GearOutfit {
  id: string;
  category: 'Casual City Wear' | 'Fancy Clothing' | 'Soccer Gear';
  title: string;
  description: string;
  outfitPrompt: string;
  outfitImage?: string; // Standalone outfit flatlay image (gemini-3.1-flash-lite-image)
  tryOnPrompt?: string;
  tryOnImage?: string; // Player wearing the outfit (gemini-3.1-flash-image with player reference)
  isGeneratingOutfit?: boolean;
  isGeneratingTryOn?: boolean;
}

const DEFAULT_BASE_PLAYER_IMAGE = '/assets/gear_swap_base_player.jpg';

const DEFAULT_OUTFITS: GearOutfit[] = [
  // 1. Casual City Wear (3)
  {
    id: "gear-casual-1",
    category: "Casual City Wear",
    title: "Parisian Tech Fleece & Tactical Cargo",
    description: "Oversized minimalist grey tech fleece hoodie, black cargo joggers, and retro white leather high-tops.",
    outfitPrompt: "High-end commercial fashion product flatlay photography of a men's stylish Parisian streetwear outfit: oversized matte grey tech fleece hoodie, relaxed black cargo joggers with tactical straps, and pristine retro white leather high-top sneakers arranged neatly on a dark concrete studio surface, clean studio lighting, 1:1 aspect ratio",
    tryOnPrompt: "Commercial fashion photoshoot of Kylian Mbappé wearing a stylish oversized grey tech fleece hoodie, black cargo joggers, and retro white sneakers, standing confident on a trendy Paris boulevard at twilight, photorealistic, 4K, 1:1 square portrait"
  },
  {
    id: "gear-casual-2",
    category: "Casual City Wear",
    title: "Cyber Volt Bomber & Relaxed Chinos",
    description: "Sleek obsidian satin bomber jacket with subtle neon volt accents, crisp white tee, and olive relaxed chinos.",
    outfitPrompt: "High-end commercial fashion flatlay of a men's outfit: luxury black satin bomber jacket with subtle neon green volt lining, crisp crewneck white tee, olive green tailored chinos, and low-profile suede sneakers on a minimalist dark studio floor, 1:1 aspect ratio",
    tryOnPrompt: "Commercial lifestyle portrait of Kylian Mbappé wearing a black satin bomber jacket with volt accents, white t-shirt, and olive chinos, leaning against an illuminated glass architectural wall in Tokyo, cinematic urban lighting, 1:1 square portrait"
  },
  {
    id: "gear-casual-3",
    category: "Casual City Wear",
    title: "Monochromatic Cashmere Knit & Indigo Denim",
    description: "Cream textured ribbed cashmere crewneck sweater, dark raw selvedge denim, and brown suede Chelsea boots.",
    outfitPrompt: "Studio fashion flatlay photography of a men's luxury casual outfit: heavy cream textured ribbed cashmere sweater, dark indigo raw denim jeans, and dark brown suede Chelsea boots neatly laid out on a dark slate background, 1:1 aspect ratio",
    tryOnPrompt: "Editorial lifestyle portrait of Kylian Mbappé wearing a luxury cream ribbed knit sweater and dark indigo denim jeans, warm natural cafe lighting in Madrid, relaxed confident pose, 1:1 square portrait"
  },

  // 2. Fancy Clothing (3)
  {
    id: "gear-fancy-1",
    category: "Fancy Clothing",
    title: "Midnight Navy Velvet Bespoke Tuxedo",
    description: "Midnight navy velvet dinner jacket with black silk shawl lapel, pleated dress shirt, and black bow tie.",
    outfitPrompt: "Luxury menswear product photography flatlay: bespoke midnight navy velvet tuxedo jacket with black silk satin shawl lapel, white pleated tuxedo shirt, black silk bow tie, gold cufflinks, and polished patent leather oxford shoes on dark marble, 1:1 aspect ratio",
    tryOnPrompt: "Red carpet gala portrait of Kylian Mbappé wearing a tailored midnight navy velvet tuxedo with black silk shawl lapel and bow tie, holding an award, elegant gala ballroom background with champagne chandeliers, 1:1 square portrait"
  },
  {
    id: "gear-fancy-2",
    category: "Fancy Clothing",
    title: "Haute Couture Double-Breasted Gala Suit",
    description: "Sharp jet-black double-breasted structured blazer with peak lapels and tailored wool dress trousers.",
    outfitPrompt: "Editorial menswear flatlay: luxury jet-black double-breasted structured blazer with peak lapels, tailored tapered black trousers, silk dress shirt, and Italian leather dress shoes on clean obsidian backdrop, 1:1 aspect ratio",
    tryOnPrompt: "High-fashion magazine cover shoot of Kylian Mbappé wearing a structured double-breasted black-tie suit with crisp open collar, dramatic spotlighting in a minimalist luxury architectural loft, 1:1 square portrait"
  },
  {
    id: "gear-fancy-3",
    category: "Fancy Clothing",
    title: "Bordeaux Satin Evening Cocktail Suit",
    description: "Rich bordeaux wine satin-finish evening suit with matching slim trousers and a black silk turtleneck.",
    outfitPrompt: "High-fashion product flatlay: rich burgundy bordeaux satin tailored suit jacket, black fine-gauge silk turtleneck, matching slim trousers, and black velvet loafers on dark velvet surface, 1:1 aspect ratio",
    tryOnPrompt: "VIP evening portrait of Kylian Mbappé wearing a tailored bordeaux wine satin suit with black silk turtleneck, luxury VIP lounge overlooking night skyline, atmospheric warm amber lighting, 1:1 square portrait"
  },

  // 3. Soccer Gear (3)
  {
    id: "gear-soccer-1",
    category: "Soccer Gear",
    title: "Real Madrid 2026/27 Gold Champions Kit",
    description: "Official Real Madrid all-white matchday kit with gold championship stripes, shorts, and Predator boots.",
    outfitPrompt: "Official EA SPORTS FC 27 football kit flatlay: Real Madrid white matchday kit jersey with gold trim and Champions League sleeve badge, matching white shorts, white match socks, and gold metallic football cleats on stadium grass turf, 1:1 aspect ratio",
    tryOnPrompt: "Full-body dynamic football portrait of Kylian Mbappé wearing the Real Madrid white and gold matchday jersey and shorts, standing proudly on the Santiago Bernabéu pitch under radiant floodlights, 1:1 square portrait"
  },
  {
    id: "gear-soccer-2",
    category: "Soccer Gear",
    title: "VOLTA Neon Cyber Street 5v5 Kit",
    description: "Electric cyberpunk blackout jersey with neon volt geometric patterns, compression tights, and turf boots.",
    outfitPrompt: "Futuristic EA FC VOLTA street football apparel flatlay: blackout athletic jersey with glowing neon green volt fractal patterns, athletic compression shorts, and neon street turf boots on a wet asphalt surface with neon reflections, 1:1 aspect ratio",
    tryOnPrompt: "Cyberpunk street football portrait of Kylian Mbappé wearing a neon volt and blackout VOLTA street soccer kit, holding a neon glowing soccer ball on a Tokyo rooftop cage pitch at night, 1:1 square portrait"
  },
  {
    id: "gear-soccer-3",
    category: "Soccer Gear",
    title: "Retro Galáctico Heritage Match Kit",
    description: "Iconic retro-inspired vintage Real Madrid tribute jersey with polo collar, gold crest, and captain's armband.",
    outfitPrompt: "Vintage heritage football kit product flatlay: classic retro cream-white football jersey with navy polo collar, embroidered heritage club crest, gold captain armband, and classic leather football boots on vintage wooden locker bench, 1:1 aspect ratio",
    tryOnPrompt: "Cinematic stadium tunnel portrait of Kylian Mbappé wearing a retro-inspired cream white football jersey with navy polo collar and captain armband, walking out toward the roaring championship stadium crowd, 1:1 square portrait"
  }
];

export const GearSwap: React.FC = () => {
  const { name } = useCompanyContext();
  const companyName = name || 'EA Games FC';

  // State Management
  const [basePlayerImage, setBasePlayerImage] = useState<string>(DEFAULT_BASE_PLAYER_IMAGE);
  const [outfits, setOutfits] = useState<GearOutfit[]>(DEFAULT_OUTFITS);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'All' | 'Casual City Wear' | 'Fancy Clothing' | 'Soccer Gear'>('All');
  const [selectedOutfitModal, setSelectedOutfitModal] = useState<GearOutfit | null>(null);

  // Load Saved Run on Mount
  useEffect(() => {
    const loadLastRun = async () => {
      try {
        const res = await fetch(`/api/load-run/gear_swap?companyName=${encodeURIComponent(companyName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.outfits && Array.isArray(data.outfits) && data.outfits.length > 0) {
            setOutfits(data.outfits);
            if (data.basePlayerImage) setBasePlayerImage(data.basePlayerImage);
            setStatusMessage("Restored Gear Swap session from GCS cache.");
            setTimeout(() => setStatusMessage(''), 3000);
          }
        }
      } catch (e) {
        console.warn("No saved Gear Swap run found, using default state.", e);
      }
    };
    loadLastRun();
  }, [companyName]);

  // Persist to GCS
  const handleSaveToGCS = async (currentOutfits: GearOutfit[] = outfits) => {
    try {
      await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'gear_swap',
          companyName,
          data: {
            basePlayerImage,
            outfits: currentOutfits,
            timestamp: new Date().toISOString()
          }
        })
      });
      setStatusMessage("Saved Gear Swap outfits & try-ons to GCS.");
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e) {
      console.error("Failed to save gear swap run:", e);
    }
  };

  // Step 1: Generate Single Outfit Image via Flash Lite Image
  const handleGenerateOutfitOnly = async (outfitId: string) => {
    const target = outfits.find(o => o.id === outfitId);
    if (!target) return;

    setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isGeneratingOutfit: true } : o));
    setStatusMessage(`Generating outfit asset for "${target.title}" via Flash Lite Image...`);

    try {
      const generatedUrl = await generateImage(
        target.outfitPrompt, 
        'gemini-3.1-flash-lite-image', 
        '1:1', 
        `outfit_${target.id}`, 
        companyName
      );

      if (generatedUrl) {
        const updated = outfits.map(o => o.id === outfitId ? { ...o, outfitImage: generatedUrl, isGeneratingOutfit: false } : o);
        setOutfits(updated);
        handleSaveToGCS(updated);
        setStatusMessage(`Outfit asset rendered for "${target.title}"!`);
      } else {
        setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isGeneratingOutfit: false } : o));
        setStatusMessage(`Failed to render outfit asset for "${target.title}".`);
      }
    } catch (err) {
      console.error(`Failed to generate outfit ${outfitId}:`, err);
      setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isGeneratingOutfit: false } : o));
    } finally {
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Step 2: Generate Try-On Portrait via Gemini Flash Image (Multi-Image Composition)
  const handleGenerateTryOnOnly = async (outfitId: string) => {
    const target = outfits.find(o => o.id === outfitId);
    if (!target) return;

    setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isGeneratingTryOn: true } : o));
    setStatusMessage(`Compositing Kylian Mbappé wearing "${target.title}" via Gemini Flash Image...`);

    try {
      const prompt = `CRITICAL DIRECTIVE: Generate a high-fashion, commercial photorealistic full-body portrait of the exact male athlete from the reference image (Kylian Mbappé) wearing this outfit: ${target.outfitPrompt}.
Preserve 100% facial likeness, hairstyle, facial features, and athletic physique.
Replace his entire clothing with the ${target.category} ensemble: ${target.description}.
Setting: High-end commercial photoshoot with dramatic studio floodlighting, photorealistic, 1:1 aspect ratio, ultra-detailed 4K commercial fashion portrait.`;

      // Pass base player photo + outfit photo (if exists) into gemini-3.1-flash-image
      const referenceImages = [basePlayerImage];
      if (target.outfitImage) {
        referenceImages.push(target.outfitImage);
      }

      const generatedUrl = await generateImageWithReference(
        prompt,
        referenceImages,
        'image/jpeg',
        'gemini-3.1-flash-image', // Explicitly gemini flash image (not lite)
        '1:1'
      );

      if (generatedUrl) {
        const updated = outfits.map(o => o.id === outfitId ? { ...o, tryOnImage: generatedUrl, isGeneratingTryOn: false } : o);
        setOutfits(updated);
        handleSaveToGCS(updated);
        setStatusMessage(`Successfully synthesized try-on fit for "${target.title}"!`);
      } else {
        setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isGeneratingTryOn: false } : o));
        setStatusMessage(`Failed to synthesize try-on fit for "${target.title}".`);
      }
    } catch (err) {
      console.error(`Failed to generate try-on for ${outfitId}:`, err);
      setOutfits(prev => prev.map(o => o.id === outfitId ? { ...o, isGeneratingTryOn: false } : o));
    } finally {
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  // Full 2-Stage Pipeline: Generate 9 Outfits (Flash Lite Image) -> Generate 9 Try-On Portraits (Flash Image)
  const handleGenerateAll9Outfits = async () => {
    setIsGeneratingAll(true);
    setCurrentStep("Stage 1/2: Generating 9 Outfits via gemini-3.1-flash-lite-image...");
    setStatusMessage("Step 1: Generating 9 outfit assets across Casual City Wear, Fancy Clothing, and Soccer Gear...");

    try {
      // 1. Stage 1: Generate 9 Outfits concurrently with gemini-3.1-flash-lite-image
      const outfitPromises = outfits.map(async (outfit) => {
        try {
          const outfitImg = await generateImage(
            outfit.outfitPrompt, 
            'gemini-3.1-flash-lite-image', 
            '1:1', 
            `outfit_${outfit.id}`, 
            companyName
          );
          return {
            ...outfit,
            outfitImage: outfitImg || outfit.outfitImage
          };
        } catch (e) {
          console.warn(`Failed stage 1 for outfit ${outfit.id}:`, e);
          return outfit;
        }
      });

      const updatedOutfitsWithItems = await Promise.all(outfitPromises);
      setOutfits(updatedOutfitsWithItems);

      // 2. Stage 2: Combine Player Photo + Outfits with gemini-3.1-flash-image
      setCurrentStep("Stage 2/2: Synthesizing 9 Player Try-On Portraits via gemini-3.1-flash-image...");
      setStatusMessage("Step 2: Merging Mbappé reference photo + 9 outfits to render personalized try-on portraits...");

      const tryOnPromises = updatedOutfitsWithItems.map(async (outfit) => {
        try {
          const prompt = `CRITICAL DIRECTIVE: Generate a high-fashion, commercial photorealistic full-body portrait of the exact male athlete from the reference image (Kylian Mbappé) wearing this outfit: ${outfit.outfitPrompt}.
Preserve 100% facial likeness, hairstyle, facial features, and athletic physique.
Replace his entire clothing with the ${outfit.category} ensemble: ${outfit.description}.
Setting: High-end commercial photoshoot with dramatic studio floodlighting, photorealistic, 1:1 aspect ratio, ultra-detailed 4K commercial fashion portrait.`;

          const refs = [basePlayerImage];
          if (outfit.outfitImage) refs.push(outfit.outfitImage);

          const tryOnImg = await generateImageWithReference(
            prompt,
            refs,
            'image/jpeg',
            'gemini-3.1-flash-image', // gemini flash image (not lite)
            '1:1'
          );

          return {
            ...outfit,
            tryOnImage: tryOnImg || outfit.tryOnImage
          };
        } catch (e) {
          console.warn(`Failed stage 2 try-on for outfit ${outfit.id}:`, e);
          return outfit;
        }
      });

      const finalOutfits = await Promise.all(tryOnPromises);
      setOutfits(finalOutfits);
      handleSaveToGCS(finalOutfits);
      setStatusMessage("All 9 outfits and personalized try-on portraits synthesized successfully!");
    } catch (err) {
      console.error("Full pipeline error:", err);
      setStatusMessage("Encountered an issue generating outfits.");
    } finally {
      setIsGeneratingAll(false);
      setCurrentStep('');
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  // Handle Custom Player Image Upload
  const handlePlayerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBasePlayerImage(event.target.result as string);
        setStatusMessage("Loaded custom player base photo.");
        setTimeout(() => setStatusMessage(''), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredOutfits = activeCategoryFilter === 'All' 
    ? outfits 
    : outfits.filter(o => o.category === activeCategoryFilter);

  return (
    <div className="font-sans text-slate-100 w-full min-h-screen bg-[#080B10] flex flex-col space-y-6">
      
      {/* 1. STATUS BAR / TOAST NOTIFICATION */}
      {statusMessage && (
        <div className="p-3.5 bg-[#0D131D] border border-[#0AF468]/40 text-[#0AF468] text-xs font-mono font-bold rounded-2xl flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-[#0AF468] animate-pulse shrink-0" />
            <span>{statusMessage}</span>
          </div>
          {currentStep && (
            <span className="text-[10px] text-slate-400 bg-black/50 px-2.5 py-1 rounded-full border border-white/10">
              {currentStep}
            </span>
          )}
        </div>
      )}

      {/* 2. TOP HERO HERO CARD: BASE PLAYER MODEL & ONE-CLICK GENERATION ENGINE */}
      <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Left: Base Player Reference Card */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
            <div className="relative group shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden border-2 border-[#0AF468]/50 bg-black/60 shadow-[0_0_25px_rgba(10,244,104,0.2)] relative">
                <img 
                  src={basePlayerImage} 
                  alt="Base Athlete Reference" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] font-mono font-extrabold text-[#0AF468] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={11} /> Base Model
                  </span>
                </div>
              </div>

              {/* Upload Custom Base Model Button */}
              <label className="absolute -bottom-2 -right-2 p-2 bg-[#0D131D] hover:bg-white/10 text-white rounded-xl border border-white/20 shadow-lg cursor-pointer transition">
                <Upload size={13} className="text-[#0AF468]" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePlayerImageUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30">
                  EA SPORTS FC 27 • GEAR SWAP
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-slate-300 border border-white/15">
                  Male Athlete
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Kylian Mbappé</h2>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Multi-image neural style transfer transforms the base player photo across <strong className="text-white">Casual City Wear</strong>, <strong className="text-white">Fancy Gala Clothing</strong>, and <strong className="text-white">Authentic Soccer Gear</strong>.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">1. Flash Lite Image (Outfits)</span>
                <span className="text-slate-600">→</span>
                <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10">2. Flash Image (Try-On Composite)</span>
              </div>
            </div>
          </div>

          {/* Right: Primary Call to Action Button */}
          <div className="flex flex-col items-center sm:items-end gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={handleGenerateAll9Outfits}
              disabled={isGeneratingAll}
              className="w-full sm:w-auto px-8 py-4 btn-primary rounded-2xl text-sm font-black flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(10,244,104,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 size={18} className="animate-spin text-black" />
                  <span>Synthesizing 9 Outfits &amp; Fits...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-black animate-pulse" />
                  <span>Generate 9 Outfits &amp; Try-On</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveToGCS(outfits)}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5"
              >
                <Save size={13} /> Save Fits
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 3. CATEGORY FILTER TABS */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Casual City Wear', 'Fancy Clothing', 'Soccer Gear'] as const).map(cat => {
            const isActive = activeCategoryFilter === cat;
            const count = cat === 'All' ? outfits.length : outfits.filter(o => o.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#349DD4] text-white shadow-[0_0_12px_rgba(52,157,212,0.3)] font-black'
                    : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="hidden sm:block text-xs font-mono text-slate-400 font-bold">
          9 Total Outfits • 3 Per Cohort
        </span>
      </div>

      {/* 4. MAIN 9-OUTFIT DUAL-VIEW GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOutfits.map((outfit) => {
          const isCasual = outfit.category === 'Casual City Wear';
          const isFancy = outfit.category === 'Fancy Clothing';
          const isSoccer = outfit.category === 'Soccer Gear';

          const badgeColor = isCasual 
            ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30' 
            : isFancy 
            ? 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30' 
            : 'bg-[#0AF468]/15 text-[#0AF468] border-[#0AF468]/30';

          return (
            <div 
              key={outfit.id} 
              className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all space-y-4 text-white group"
            >
              {/* Header: Category Badge & Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${badgeColor}`}>
                    {outfit.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{outfit.id}</span>
                </div>
                <h3 className="text-base font-extrabold text-white tracking-tight">{outfit.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{outfit.description}</p>
              </div>

              {/* Dual Visual Showcase (Side-by-Side: Standalone Outfit + Player Wearing Outfit) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                
                {/* 1. Standalone Outfit Flatlay (Flash Lite Image) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 truncate">
                      1. Outfit Item
                    </span>
                    <button
                      onClick={() => handleGenerateOutfitOnly(outfit.id)}
                      disabled={outfit.isGeneratingOutfit}
                      className="p-1 text-slate-400 hover:text-[#0AF468] transition"
                      title="Regenerate Outfit Asset (Flash Lite Image)"
                    >
                      <RefreshCw size={11} className={outfit.isGeneratingOutfit ? 'animate-spin text-[#0AF468]' : ''} />
                    </button>
                  </div>

                  <div onClick={() => setSelectedOutfitModal(outfit)} className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/60 relative flex items-center justify-center cursor-pointer hover:border-white/30 transition-all group/item shadow-inner" title="Click to view side-by-side comparison">
                    {outfit.isGeneratingOutfit ? (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        <Loader2 size={18} className="animate-spin text-[#00F0FF]" />
                        <span className="text-[9px] font-mono text-slate-400">Rendering Flatlay...</span>
                      </div>
                    ) : outfit.outfitImage ? (
                      <img 
                        src={outfit.outfitImage} 
                        alt={`${outfit.title} Outfit`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        <Shirt size={22} className="text-slate-600" />
                        <button
                          onClick={() => handleGenerateOutfitOnly(outfit.id)}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[9.5px] font-mono font-bold border border-white/10 transition"
                        >
                          Generate Asset
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-500 block text-center truncate">
                    gemini-3.1-flash-lite-image
                  </span>
                </div>

                {/* 2. Player Wearing Outfit (Flash Image Multi-Image Composite) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#0AF468] truncate">
                      2. Player Try-On
                    </span>
                    <button
                      onClick={() => handleGenerateTryOnOnly(outfit.id)}
                      disabled={outfit.isGeneratingTryOn}
                      className="p-1 text-slate-400 hover:text-[#0AF468] transition"
                      title="Regenerate Try-On Composite (Gemini Flash Image)"
                    >
                      <RefreshCw size={11} className={outfit.isGeneratingTryOn ? 'animate-spin text-[#0AF468]' : ''} />
                    </button>
                  </div>

                  <div onClick={() => setSelectedOutfitModal(outfit)} className="aspect-square rounded-2xl overflow-hidden border border-[#0AF468]/30 bg-black/60 relative flex items-center justify-center shadow-[0_0_15px_rgba(10,244,104,0.1)] cursor-pointer hover:border-[#0AF468]/60 transition-all group/tryon" title="Click to view side-by-side comparison">
                    {outfit.isGeneratingTryOn ? (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        <Loader2 size={18} className="animate-spin text-[#0AF468]" />
                        <span className="text-[9px] font-mono text-slate-300">Compositing Mbappé...</span>
                      </div>
                    ) : outfit.tryOnImage ? (
                      <img 
                        src={outfit.tryOnImage} 
                        alt={`${outfit.title} Try-On`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        <Sparkles size={22} className="text-[#0AF468] opacity-60" />
                        <button
                          onClick={() => handleGenerateTryOnOnly(outfit.id)}
                          className="px-2 py-1 btn-primary rounded-lg text-[9.5px] font-mono font-bold transition"
                        >
                          Synthesize Fit
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[8.5px] font-mono text-[#0AF468]/80 block text-center truncate">
                    gemini-3.1-flash-image
                  </span>
                </div>

              </div>

              {/* Bottom Card Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedOutfitModal(outfit)}
                  className="text-slate-400 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 transition"
                >
                  <Eye size={12} /> Inspect Prompts
                </button>
                <button
                  onClick={() => {
                    handleGenerateOutfitOnly(outfit.id);
                    setTimeout(() => handleGenerateTryOnOnly(outfit.id), 2500);
                  }}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[#0AF468] border border-[#0AF468]/30 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1"
                >
                  <RefreshCw size={10} /> Re-roll Both
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 5. SIDE-BY-SIDE DUAL IMAGE COMPARISON MODAL */}
      {selectedOutfitModal && (
        <div 
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 md:p-6 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOutfitModal(null);
          }}
        >
          <div className="bg-[#0D131D] border border-white/15 rounded-3xl shadow-2xl max-w-5xl w-full p-6 md:p-8 relative text-white space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30">
                    {selectedOutfitModal.category}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{selectedOutfitModal.id}</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">{selectedOutfitModal.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{selectedOutfitModal.description}</p>
              </div>

              <button 
                onClick={() => setSelectedOutfitModal(null)}
                className="p-2 bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white rounded-xl border border-white/10 transition text-sm font-bold shrink-0"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Side-by-Side Dual Image Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left: Standalone Outfit Asset */}
              <div className="space-y-3 bg-[#080B10] p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Shirt size={14} className="text-[#00F0FF]" /> 1. Standalone Outfit Item
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Flash Lite Image</span>
                  </div>

                  <div className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/80 relative flex items-center justify-center group shadow-inner">
                    {selectedOutfitModal.isGeneratingOutfit ? (
                      <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <Loader2 size={28} className="animate-spin text-[#00F0FF]" />
                        <span className="text-xs font-mono text-slate-300">Rendering Flatlay Asset...</span>
                      </div>
                    ) : selectedOutfitModal.outfitImage ? (
                      <>
                        <img 
                          src={selectedOutfitModal.outfitImage} 
                          alt={`${selectedOutfitModal.title} Outfit`} 
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={selectedOutfitModal.outfitImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/80 hover:bg-black text-white rounded-xl text-xs font-mono font-bold border border-white/20 shadow-lg flex items-center gap-1.5 transition opacity-90 hover:opacity-100"
                        >
                          <ExternalLink size={12} /> Open Full Res
                        </a>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <Shirt size={36} className="text-slate-600" />
                        <span className="text-xs text-slate-400 font-mono">No outfit asset rendered yet</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Visual Generation Prompt
                    </span>
                    <div className="bg-black/60 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-slate-300 leading-relaxed max-h-28 overflow-y-auto">
                      {selectedOutfitModal.outfitPrompt}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleGenerateOutfitOnly(selectedOutfitModal.id)}
                      disabled={selectedOutfitModal.isGeneratingOutfit}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={selectedOutfitModal.isGeneratingOutfit ? 'animate-spin text-[#00F0FF]' : ''} />
                      Regenerate Outfit Shot
                    </button>
                    {selectedOutfitModal.outfitImage && (
                      <a
                        href={selectedOutfitModal.outfitImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono font-bold text-[#00F0FF] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> New Tab
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Player Try-On Composite */}
              <div className="space-y-3 bg-[#080B10] p-4 rounded-2xl border border-[#0AF468]/30 flex flex-col justify-between shadow-[0_0_20px_rgba(10,244,104,0.08)]">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0AF468] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#0AF468]" /> 2. Player Wearing Outfit
                    </span>
                    <span className="text-[10px] font-mono text-[#0AF468]/90 font-bold">gemini-3.1-flash-image</span>
                  </div>

                  <div className="aspect-square rounded-2xl overflow-hidden border border-[#0AF468]/40 bg-black/80 relative flex items-center justify-center group shadow-[0_0_25px_rgba(10,244,104,0.15)]">
                    {selectedOutfitModal.isGeneratingTryOn ? (
                      <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <Loader2 size={28} className="animate-spin text-[#0AF468]" />
                        <span className="text-xs font-mono text-slate-300">Compositing Kylian Mbappé in 3D...</span>
                      </div>
                    ) : selectedOutfitModal.tryOnImage ? (
                      <>
                        <img 
                          src={selectedOutfitModal.tryOnImage} 
                          alt={`${selectedOutfitModal.title} Try-On`} 
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={selectedOutfitModal.tryOnImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/80 hover:bg-black text-white rounded-xl text-xs font-mono font-bold border border-[#0AF468]/40 shadow-lg flex items-center gap-1.5 transition opacity-90 hover:opacity-100"
                        >
                          <ExternalLink size={12} /> Open Full Res
                        </a>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <Sparkles size={36} className="text-[#0AF468] opacity-60" />
                        <span className="text-xs text-slate-400 font-mono">No try-on portrait synthesized yet</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#0AF468] uppercase tracking-wider block mb-1">
                      Multi-Image Composite Prompt (Base Model + Outfit)
                    </span>
                    <div className="bg-black/60 border border-[#0AF468]/30 rounded-xl p-3 text-[11px] font-mono text-slate-300 leading-relaxed max-h-28 overflow-y-auto">
                      {selectedOutfitModal.tryOnPrompt}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleGenerateTryOnOnly(selectedOutfitModal.id)}
                      disabled={selectedOutfitModal.isGeneratingTryOn}
                      className="px-4 py-2 btn-primary rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={selectedOutfitModal.isGeneratingTryOn ? 'animate-spin text-black' : ''} />
                      Regenerate Try-On Portrait
                    </button>
                    {selectedOutfitModal.tryOnImage && (
                      <a
                        href={selectedOutfitModal.tryOnImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono font-bold text-[#0AF468] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> New Tab
                      </a>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono">
              <span className="text-slate-400">
                Clicking either image opens in new tab for direct download.
              </span>
              <button 
                onClick={() => setSelectedOutfitModal(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
