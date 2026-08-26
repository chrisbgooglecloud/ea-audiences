import { fetchA2AAudiences, mapA2AToSyntheticUsers } from '../services/audienceService';
import React, { useState, useEffect } from 'react';
import { 
  Users, Sparkles, RefreshCw, Flame, ShieldCheck, TrendingUp, Loader2, RotateCcw, Brain, Target, Compass, Smartphone, 
  Mail, MessageSquare, Layout, FolderHeart, Gamepad2, Trophy, Shield
} from 'lucide-react';
import { generateText, generateImage, safeJsonParse } from '../services/geminiService';
import { useCompanyContext } from '../context/CompanyContext';
import { useAppConfig } from '../context/AppConfigContext';
import { SyntheticUserProfile } from '../types';

export const PersonalizeContent: React.FC = () => {
  const { name } = useCompanyContext();
  const { config } = useAppConfig();
  const companyName = config?.branding?.companyName || name || 'EA Games FC';

  const [users, setUsers] = useState<SyntheticUserProfile[]>([]);
  const [activeBrief, setActiveBrief] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [regeneratingImages, setRegeneratingImages] = useState<Record<string, boolean>>({});
  const [audienceContextModal, setAudienceContextModal] = useState<{name: string, bio: string} | null>(null);

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load active marketing brief
        const briefRes = await fetch(`/api/load-run/marketing_brief?companyName=${encodeURIComponent(companyName)}`);
        if (briefRes.ok) {
          const briefData = await briefRes.json();
          if (briefData && briefData.title) {
            setActiveBrief(briefData);
          }
        }

        // Primary: Load 7 live/cached A2A Audience Profiles with double fallback
        let targetUsers: SyntheticUserProfile[] = [];
        try {
          const a2aPlayers = await fetchA2AAudiences(7);
          if (a2aPlayers && a2aPlayers.length > 0) {
            targetUsers = mapA2AToSyntheticUsers(a2aPlayers);
          }
        } catch (e) {
          console.warn("Could not load A2A audiences for PersonalizeContent:", e);
        }

        // Secondary fallback: check synthetic_users if A2A is empty
        if (targetUsers.length === 0) {
          const usersRes = await fetch(`/api/load-run/synthetic_users?companyName=${encodeURIComponent(companyName)}`);
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            if (usersData.generatedUsers && usersData.generatedUsers.length > 0) {
              targetUsers = usersData.generatedUsers;
            }
          }
        }

        if (targetUsers.length > 0) {
          // Load saved personalized content if it exists
          try {
            const personalizedRes = await fetch(`/api/load-run/personalized_content?companyName=${encodeURIComponent(companyName)}`);
            if (personalizedRes.ok) {
              const personalizedData = await personalizedRes.json();
              if (personalizedData.results && personalizedData.results.length > 0) {
                // Map the personalized campaigns back to the users
                const mappedUsers = targetUsers.map((u: SyntheticUserProfile) => {
                  const found = personalizedData.results.find((r: any) => r.userId === u.name);
                  if (found) {
                    return {
                      ...u,
                      personalizedCampaign: found.personalizedCampaign
                    };
                  }
                  return u;
                });
                setUsers(mappedUsers);
                setStatusMessage("Loaded 7 gamer profiles and restored personalized campaigns from storage.");
                return;
              }
            }
          } catch (e) {}
          setUsers(targetUsers);
        }
      } catch (err) {
        console.warn("Failed to load data for Personalize Content:", err);
      }
    };
    loadInitialData();
  }, [companyName]);

  const handlePersonalizeAll = async () => {
    if (users.length === 0) {
      alert("No synthetic users found. Please generate personas or synthetic users first!");
      return;
    }

    const currentBrief = activeBrief || {
      title: "EA SPORTS FC 27 Global Launch & Pre-Order Campaign",
      campaignGoal: "Drive 1-to-1 pre-orders and engagement across Ultimate Team, Manager Career, and FC IQ Tactical gameplay",
      productName: "EA SPORTS FC 27 (Ultimate & Standard Editions)",
      assumptions: { focus: "HypermotionV+ Volumetric Simulation, FC IQ Tactical Strategy, Ultimate Team Packs, Regional Hero Perks" }
    };

    setIsGenerating(true);
    setStatusMessage("Running AI personalization text analysis & parallel football scene generation for all users...");

    try {
      const personalizationPromises = users.map(async (user) => {
        const prompt = `
You are the Lead 1-to-1 Personalization Director & Creative Strategist for "${companyName}".
We have an active Marketing Brief for EA SPORTS FC 27 and a specific target synthetic gamer profile.

--- Marketing Brief ---
Campaign: ${currentBrief.title}
Goal: ${currentBrief.campaignGoal}
Product: ${currentBrief.productName}
Assumptions/Focus: ${JSON.stringify(currentBrief.assumptions)}

--- Target Gamer Profile ---
Name: ${user.name}
Bio: ${user.bio}
Demographics: ${user.demographics}
Cognitive Style: ${JSON.stringify(user.cognitiveStyle)}
Lifestyle/Friction: ${JSON.stringify(user.lifestyleFriction)}
Digital Footprint: ${JSON.stringify(user.digitalFootprint)}
Psychographic Flavor: ${JSON.stringify(user.psychographicFlavor)}

--- TASK ---
1. Analyze this player's specific gaming archetypes and style preferences:
   - **Tactical Strategy & Manager Masterminds (Strategy Gaming)**: Focus on FC IQ tactical masterclass, coaching blueprints, formation strategy, manager dugout perspective overlooking the pitch, and scouting wonderkids.
   - **Volumetric Simulation & Realism (Simulation Gaming)**: Focus on next-gen HypermotionV+ pitch physics, matchday stadium floodlights, authentic league licenses, and marquee football stars (e.g. Mbappé, Bellingham, Haaland, Vinicius Jr., Messi).
   - **Street Football & Freestyle (Exploration & Casual Social)**: Focus on rooftop VOLTA cage matches in Rio, Tokyo, or London at sunset, neon turf lines, trick skill moves, and exclusive streetwear kits.
   - **Ultimate Team & Squad Building (Competitive / Collectors)**: Focus on pack opening reveals, glowing walkout player animations, untradeable hero items, and 4,600 FC Points bundles.
2. Choose the single most effective marketing channel for this user ("Email", "SMS", or "Web").
3. Write a high-converting, personalized marketing message (Headline & Copy Body) tailored to their gaming passion, playstyle, and favorite mode.
4. Craft a tailored value proposition or in-game perk offer.
5. Create a VIVID, CINEMATIC IMAGE PROMPT for a 16:9 photorealistic visual.

*** CRITICAL VISUAL DIRECTIVES FOR 'imagePrompt' ***
- The image MUST be deeply focused on authentic EA SPORTS FC 27 action, iconic football players, or gameplay immersion (Strategy, Simulation, Street Exploration, or Ultimate Team pack openings).
- Examples of great prompts:
  * For Strategy / Tactical players: "Cinematic overhead view of an illuminated football stadium pitch with glowing neon green tactical arrows, formation lines, and a manager in a tailored suit orchestrating plays from the dugout, 16:9 aspect ratio commercial visual"
  * For Simulation / Competitive players: "Photorealistic dynamic match action of a world-class superstar athlete striking a soccer ball into the top corner under bright stadium floodlights in a packed championship arena, high resolution, 16:9 aspect ratio"
  * For Exploration / Street VOLTA players: "Vibrant sunset rooftop cage football match in Tokyo overlooking neon skyscrapers, athletic players executing skill tricks on a glowing turf pitch, 16:9 aspect ratio"
  * For Ultimate Team / Pack Collectors: "Epic digital player item walkout stage with glowing gold holographic light beams, pyrotechnics, confetti, and neon green EA SPORTS FC branding, 16:9 aspect ratio"
- NEVER generate generic computer setups, office desks, PC monitors, keyboards, or people sitting in front of laptops. It must be an epic, cinematic video game marketing scene.

Return ONLY a valid JSON object matching this schema:
{
  "channel": "Email" | "SMS" | "Web",
  "headline": "Personalized subject line or header tailored to their favorite gameplay mode and player passion",
  "copyBody": "Engaging personalized copy highlighting FC 27 features that match their gaming playstyle",
  "offer": "Tailored promotional offer (e.g. 'Pre-Order Ultimate Edition: 4,600 FC Points + 7-Day Early Access + Hometown Hero Item')",
  "reasoning": "1-sentence strategic rationale why this specific angle resonates with this gamer profile",
  "imagePrompt": "Detailed 16:9 prompt describing an epic in-game football action scene, tactical strategy overview, or street soccer match matching their playstyle, with NO computer monitors or desk setups"
}
`;

        try {
          // 1. Text analysis using gemini-3.5-flash
          const textRes = await generateText(prompt, 'gemini-3.5-flash');
          const parsed = safeJsonParse(textRes, {
            channel: "Email",
            headline: `Lead Your Squad in EA SPORTS FC 27, ${user.name.split(' ')[0]}`,
            copyBody: "Experience the next evolution of football simulation with HypermotionV+ volumetric capture, FC IQ tactical overhauls, and deep squad customization.",
            offer: "Pre-Order Ultimate Edition: 4,600 FC Points + 7-Day Early Access",
            reasoning: "Resonates with competitive playstyle and squad management preferences.",
            imagePrompt: "Photorealistic dynamic match action of a world-class superstar athlete striking a soccer ball under bright stadium floodlights in a packed championship arena, 16:9 aspect ratio"
          });

          // 2. Image generation using gemini-3.1-flash-lite-image in 16:9 format
          let imageUrl = "";
          if (parsed.imagePrompt) {
            const imgPrompt = `${parsed.imagePrompt}, cinematic lighting, photorealistic, official EA SPORTS FC 27 visual style, 16:9 aspect ratio`;
            console.log(`[PersonalizeContent] Generating football scene for ${user.name} with prompt: ${imgPrompt}`);
            const prefix = `personalize_${user.name.toLowerCase().replace(/\s+/g, '_')}`;
            const generatedUrl = await generateImage(imgPrompt, 'gemini-3.1-flash-lite-image', '16:9', prefix, companyName);
            imageUrl = generatedUrl || "";
          }

          return {
            userId: user.name,
            personalizedCampaign: {
              channel: parsed.channel || "Email",
              headline: parsed.headline || "EA SPORTS FC 27 Pre-Order Access",
              copyBody: parsed.copyBody || "Experience next-gen realism and tactical control in EA SPORTS FC 27.",
              offer: parsed.offer || "4,600 FC Points + Early Access",
              reasoning: parsed.reasoning || "Tailored to gaming preferences.",
              imagePrompt: parsed.imagePrompt || "",
              image: imageUrl
            }
          };
        } catch (err) {
          console.error(`Failed to personalize for user ${user.name}:`, err);
          return null;
        }
      });

      const rawResults = await Promise.all(personalizationPromises);
      const validResults = rawResults.filter(r => r !== null) as any[];

      // Map back to active state
      const updatedUsers = users.map(u => {
        const result = validResults.find(r => r.userId === u.name);
        if (result) {
          return {
            ...u,
            personalizedCampaign: result.personalizedCampaign
          };
        }
        return u;
      });

      setUsers(updatedUsers);

      // Save to server
      await fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: 'personalized_content',
          companyName,
          data: {
            results: validResults,
            timestamp: new Date().toISOString()
          }
        })
      });

      setStatusMessage("AI personalization run successfully completed and saved.");
    } catch (e) {
      console.error("[PersonalizeContent] AI Personalization failed:", e);
      setStatusMessage("AI Personalization run failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateImage = async (userName: string) => {
    const targetUser = users.find(u => u.name === userName);
    if (!targetUser) return;

    setRegeneratingImages(prev => ({ ...prev, [userName]: true }));
    setStatusMessage(`Regenerating football scene for ${userName}...`);

    try {
      let promptToUse = targetUser.personalizedCampaign?.imagePrompt;
      if (!promptToUse) {
        if (targetUser.rawProfile?.personalized_creative_hooks?.imagen_prompt) {
          promptToUse = targetUser.rawProfile.personalized_creative_hooks.imagen_prompt;
        } else {
          promptToUse = `EA SPORTS FC 27 dynamic match action featuring ${targetUser.favoritePlayer || 'superstar player'} in ${targetUser.favoriteClub || 'official'} kit, tactical ${targetUser.favoriteFormation || 'formation'}, packed championship arena floodlights, cinematic lighting, photorealistic, 16:9 aspect ratio`;
        }
      } else if (!promptToUse.includes('16:9')) {
        promptToUse = `${promptToUse}, cinematic lighting, photorealistic, official EA SPORTS FC 27 visual style, 16:9 aspect ratio`;
      }

      console.log(`[PersonalizeContent] Regenerating image for ${userName} with prompt: ${promptToUse}`);
      const prefix = `personalize_${userName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      const newImageUrl = await generateImage(promptToUse, 'gemini-3.1-flash-lite-image', '16:9', prefix, companyName);

      if (newImageUrl) {
        const updatedUsers = users.map(u => {
          if (u.name === userName) {
            return {
              ...u,
              personalizedCampaign: {
                ...(u.personalizedCampaign || {
                  channel: "Email",
                  headline: u.suggestedHeadline || `${u.name} Momentum Reset`,
                  copyBody: `Lead your squad in EA SPORTS FC 27.`,
                  offer: "4,600 FC Points + Early Access",
                  reasoning: "Tailored to gaming preferences."
                }),
                imagePrompt: promptToUse,
                image: newImageUrl
              }
            };
          }
          return u;
        });

        setUsers(updatedUsers);

        // Save updated state to server
        const validResults = updatedUsers
          .filter(u => u.personalizedCampaign)
          .map(u => ({
            userId: u.name,
            personalizedCampaign: u.personalizedCampaign
          }));

        await fetch('/api/save-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId: 'personalized_content',
            companyName,
            data: {
              results: validResults,
              timestamp: new Date().toISOString()
            }
          })
        });

        setStatusMessage(`Successfully generated new scene for ${userName}!`);
      } else {
        setStatusMessage(`Failed to generate new image for ${userName}.`);
      }
    } catch (e) {
      console.error(`Failed to regenerate image for ${userName}:`, e);
      setStatusMessage(`Error regenerating image for ${userName}.`);
    } finally {
      setRegeneratingImages(prev => ({ ...prev, [userName]: false }));
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const effectiveBrief = activeBrief || {
    title: "EA SPORTS FC 27 Worldwide Launch Campaign",
    productName: "EA SPORTS FC 27 (Ultimate & Standard Editions)",
    campaignGoal: "Drive personalized 1-to-1 pre-orders and player engagement across all gameplay modes"
  };

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans text-slate-300 bg-transparent min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-emerald-600 font-bold text-xs uppercase tracking-widest font-mono">
            <Users className="h-4.5 w-4.5 text-emerald-500" />
            1-to-1 Communications Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Personalize Coms</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Leverages individual gamer profile data, cognitive styles, and favorite playstyles (Strategy, Simulation, Squad Building, Street VOLTA) to generate tailor-made 1-to-1 marketing copy and cinematic football imagery.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handlePersonalizeAll}
            disabled={isGenerating || users.length === 0}
            className="px-5 py-2.5 btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Personalizing Profiles...
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-emerald-200" />
                Personalize For Each User
              </>
            )}
          </button>
        </div>
      </div>

{/* Status banner suppressed for clean UI */}

      {/* Active Brief Summary Box */}
      <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl mb-8 text-white">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-mono bg-emerald-500/10 text-emerald-700 rounded-full border border-emerald-500/20 font-bold mb-3">
          Active Campaign Reference
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-slate-400 block font-mono text-[9px] uppercase">Campaign</span>
            <strong className="text-white font-bold block">{effectiveBrief.title}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[9px] uppercase">Product Details</span>
            <p className="text-slate-400">{effectiveBrief.productName}</p>
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[9px] uppercase">Primary Objective</span>
            <p className="text-slate-400">{effectiveBrief.campaignGoal}</p>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Target Gamer Profiles ({users.length})</span>
        </h3>
        
        {users.length === 0 ? (
          <div className="bg-[#0D131D]/90 border border-white/10 border-dashed rounded-3xl p-16 text-center shadow-xs flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400">
              <Gamepad2 size={32} />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-white mb-1">No Synthetic Users Available</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Please visit the "Create Personas" page to generate your synthetic gamer panel.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {users.map((user, idx) => (
              <div key={idx} className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative group transition hover:border-white/20 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-lg font-extrabold text-white tracking-tight">{user.name}</h4>
                      {user.favoriteClub && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-white/10 text-white border border-white/15">
                          {user.favoriteClub}
                        </span>
                      )}
                      {(() => {
                        const streak = user.lossStreak ?? user.rawProfile?.recent_loss_streak ?? 0;
                        if (streak >= 3) {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-[#FF4757]/15 text-[#FF4757] border border-[#FF4757]/30 flex items-center gap-1">
                              <Flame size={11} /> {streak}-Match Slump
                            </span>
                          );
                        } else if (streak > 0) {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 flex items-center gap-1">
                              <TrendingUp size={11} /> {streak} Match Defeat
                            </span>
                          );
                        } else {
                          return (
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30 flex items-center gap-1">
                              <Trophy size={11} /> In-Form / Win Streak
                            </span>
                          );
                        }
                      })()}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30">
                        {user.archetype || 'Competitive Grinder'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono tracking-tight">{user.demographics}</p>
                  </div>
                  <button 
                    onClick={() => setAudienceContextModal({ name: user.baseAudienceName || user.name, bio: user.baseAudienceBio || user.bio })}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-slate-300 text-[10px] rounded-xl font-bold uppercase font-mono self-start sm:self-auto"
                  >
                    View Full Profile
                  </button>
                </div>
                
                <p className="text-slate-300 text-xs italic mb-5 leading-relaxed font-sans">"{user.bio}"</p>

                {/* Profile Grid (A2A Live Telemetry, Slump Diagnostics, Purchase History, Targeting Rationale) */}
                {user.rawProfile || user.lossStreak !== undefined ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* 1. Slump & Tilt Risk Diagnostic */}
                    {(() => {
                      const streak = user.lossStreak ?? user.rawProfile?.recent_loss_streak ?? 0;
                      const tiltVal = Math.round((user.tiltSensitivity ?? user.rawProfile?.tilt_sensitivity ?? 0.5) * 100);
                      const isHighTilt = streak >= 3 || tiltVal >= 70;
                      const isModerate = streak > 0;

                      const borderColor = isHighTilt ? 'border-[#FF4757]/30' : isModerate ? 'border-[#00F0FF]/30' : 'border-[#00FF88]/30';
                      const badgeBg = isHighTilt ? 'bg-[#FF4757]/20 text-[#FF4757]' : isModerate ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-[#00FF88]/20 text-[#00FF88]';
                      const badgeLabel = isHighTilt ? 'HIGH RISK' : isModerate ? 'ACTIVE COHORT' : 'PEAK MOMENTUM';
                      const triggerText = isHighTilt ? 'Slump intervention to prevent churn & rage-quit.' : isModerate ? 'Engagement booster to sustain match frequency.' : 'Victory celebration & high-tier reward milestone.';

                      return (
                        <div className={`bg-[#080A0E] p-4 rounded-2xl border ${borderColor} text-white space-y-2`}>
                          <div className={`flex items-center justify-between pb-1.5 border-b ${isHighTilt ? 'border-[#FF4757]/20' : 'border-white/10'}`}>
                            <h5 className={`font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono ${isHighTilt ? 'text-[#FF4757]' : isModerate ? 'text-[#00F0FF]' : 'text-[#00FF88]'}`}>
                              {isHighTilt ? <Flame size={13} className="text-[#FF4757]" /> : <Trophy size={13} className="text-[#00FF88]" />}
                              {isHighTilt ? 'Slump & Tilt Risk' : 'Match Momentum'}
                            </h5>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${badgeBg}`}>
                              {badgeLabel}
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">{streak > 0 ? 'Loss Streak:' : 'Win Streak / Status:'}</span>
                              <span className={`font-black font-mono ${isHighTilt ? 'text-[#FF4757]' : 'text-[#00FF88]'}`}>
                                {streak > 0 ? `${streak} Matches` : '0 Losses (Active)'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[11px]">Tilt Sensitivity:</span>
                              <span className="font-black text-[#FFB800] font-mono">{tiltVal}%</span>
                            </div>
                            <div className="pt-1 text-[10.5px] text-slate-300 italic">
                              Trigger: {triggerText}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. Live In-Game Telemetry */}
                    <div className="bg-[#080A0E] p-4 rounded-2xl border border-[#00F0FF]/30 text-white space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#00F0FF]/20">
                        <h5 className="font-bold flex items-center gap-1.5 text-[#00F0FF] text-[11px] uppercase tracking-wider font-mono">
                          <Gamepad2 size={13} className="text-[#00F0FF]" /> Match Telemetry
                        </h5>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-[#00F0FF]/20 text-[#00F0FF]">
                          {user.telemetry?.squad_ovr || user.rawProfile?.telemetry?.squad_ovr || 90} OVR
                        </span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Club / Team:</span>
                          <span className="font-bold text-white truncate max-w-[110px]">{user.favoriteClub || user.telemetry?.favorite_club || user.rawProfile?.telemetry?.favorite_club || 'FC Club'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Key Star:</span>
                          <span className="font-bold text-white truncate max-w-[110px]">{user.favoritePlayer || user.telemetry?.favorite_player || user.rawProfile?.telemetry?.favorite_player || 'Star'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Tactics:</span>
                          <span className="font-mono text-slate-300 text-[10.5px]">{user.favoriteFormation || user.telemetry?.favorite_formation || user.rawProfile?.telemetry?.favorite_formation || '4-3-3'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. In-Game Spend & Purchase History */}
                    <div className="bg-[#080A0E] p-4 rounded-2xl border border-[#00FF88]/30 text-white space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#00FF88]/20">
                        <h5 className="font-bold flex items-center gap-1.5 text-[#00FF88] text-[11px] uppercase tracking-wider font-mono">
                          <ShieldCheck size={13} className="text-[#00FF88]" /> Spend Ledger
                        </h5>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-[#00FF88]/20 text-[#00FF88]">
                          ${user.lifetimeSpend || user.rawProfile?.lifetime_spend_usd || 861.73}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Recent Purchases:</span>
                        <div className="space-y-1 max-h-16 overflow-y-auto pr-1">
                          {(user.purchasedItems || user.rawProfile?.purchased_items || []).slice(0, 2).map((item: any, pIdx: number) => (
                            <div key={pIdx} className="text-[10.5px] text-slate-300 flex items-center justify-between bg-white/5 px-2 py-0.5 rounded">
                              <span className="truncate max-w-[110px]">{item.title}</span>
                              <span className="font-mono text-white font-bold">${item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 4. Why This Comms Strategy */}
                    <div className="bg-[#080A0E] p-4 rounded-2xl border border-[#FFB800]/30 text-white space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#FFB800]/20">
                        <h5 className="font-bold flex items-center gap-1.5 text-[#FFB800] text-[11px] uppercase tracking-wider font-mono">
                          <Target size={13} className="text-[#FFB800]" /> Comms Strategy
                        </h5>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-[#FFB800]/20 text-[#FFB800]">
                          1-to-1 Match
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="text-[10.5px] text-slate-300">
                          <strong className="text-white">Incentive:</strong> {user.preferredReward || user.telemetry?.preferred_reward_type || user.rawProfile?.telemetry?.preferred_reward_type || 'Double Rush Booster'}
                        </div>
                        <div className="p-1.5 bg-[#FFB800]/10 rounded-lg border border-[#FFB800]/20 text-[10px] text-slate-200 leading-snug font-sans">
                          {user.suggestedHeadline || user.rawProfile?.personalized_creative_hooks?.suggested_headline || `Personalized momentum reset offer tailored to ${user.favoriteClub || 'favorite club'}.`}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Legacy / Fallback Cognitive Styles Grid */
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {user.cognitiveStyle && (
                      <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 text-slate-300">
                        <h5 className="font-bold flex items-center gap-1.5 text-blue-400 text-2xs uppercase tracking-wider mb-2 font-mono">
                          <Brain size={12} /> Cognitive
                        </h5>
                        <ul className="space-y-1 text-[11px] text-slate-400 leading-normal">
                          <li><span className="font-semibold text-white">Density:</span> {user.cognitiveStyle.informationDensityPreference}</li>
                          <li><span className="font-semibold text-white">Signal:</span> {user.cognitiveStyle.primaryTrustSignal}</li>
                          <li><span className="font-semibold text-white">Velocity:</span> {user.cognitiveStyle.decisionVelocity}</li>
                        </ul>
                      </div>
                    )}

                    {user.lifestyleFriction && (
                      <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 text-slate-300">
                        <h5 className="font-bold flex items-center gap-1.5 text-purple-400 text-2xs uppercase tracking-wider mb-2 font-mono">
                          <Target size={12} /> Friction
                        </h5>
                        <ul className="space-y-1 text-[11px] text-slate-400 leading-normal">
                          <li><span className="font-semibold text-white">Daily Grind:</span> {user.lifestyleFriction.dailyGrindContext}</li>
                          <li><span className="font-semibold text-white">Mindset:</span> {user.lifestyleFriction.financialMindset}</li>
                          <li><span className="font-semibold text-white">Loyalty:</span> {user.lifestyleFriction.brandLoyaltyQuotient}</li>
                        </ul>
                      </div>
                    )}

                    {user.digitalFootprint && (
                      <div className="bg-black/40 p-3.5 rounded-2xl border border-white/10 text-slate-300">
                        <h5 className="font-bold flex items-center gap-1.5 text-emerald-400 text-2xs uppercase tracking-wider mb-2 font-mono">
                          <Smartphone size={12} /> Digital
                        </h5>
                        <ul className="space-y-1 text-[11px] text-slate-400 leading-normal">
                          <li><span className="font-semibold text-white">Unsub:</span> {user.digitalFootprint.unsubscribeTrigger}</li>
                          <li><span className="font-semibold text-white">Ecosystem:</span> {user.digitalFootprint.platformEcosystem}</li>
                          <li><span className="font-semibold text-white">Life Event:</span> {user.digitalFootprint.recentBigLifeEvent}</li>
                        </ul>
                      </div>
                    )}

                    {user.psychographicFlavor && (
                      <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                        <h5 className="font-bold flex items-center gap-1.5 text-orange-400 text-2xs uppercase tracking-wider mb-2 font-mono">
                          <Compass size={12} /> Flavor
                        </h5>
                        <ul className="space-y-1 text-[11px] text-slate-400 leading-normal">
                          <li><span className="font-semibold text-white">Luxury:</span> {user.psychographicFlavor.theOneLuxury}</li>
                          <li><span className="font-semibold text-white">Aspiration:</span> {user.psychographicFlavor.aspirationVsReality}</li>
                          <li><span className="font-semibold text-white">Cause:</span> {user.psychographicFlavor.socialCauseAlignment}</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Personalized Campaign Output */}
                {user.personalizedCampaign && (
                  <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    <div className="space-y-3">
                      <h5 className="font-bold flex items-center gap-1.5 text-emerald-700 text-xs uppercase tracking-wider font-mono">
                        <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                        Personalized {user.personalizedCampaign.channel} Communication
                      </h5>
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">Headline / Subject</span>
                        <strong className="text-white text-xs block font-bold">{user.personalizedCampaign.headline}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">Copy Content</span>
                        <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap border-l-4 border-l-emerald-500">
                          {user.personalizedCampaign.copyBody}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs font-mono">
                        <div>
                          <span className="text-[9px] text-slate-400 block">Offer:</span>
                          <span className="text-emerald-600 font-bold">{user.personalizedCampaign.offer}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">Audience Fit Reason:</span>
                          <span className="text-slate-400 italic">{user.personalizedCampaign.reasoning}</span>
                        </div>
                      </div>
                    </div>

                    {/* Personalized Image Container with Regenerate Button */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono block">Personalized Gameplay &amp; Player Scene (16:9)</span>
                        <button
                          onClick={() => handleRegenerateImage(user.name)}
                          disabled={regeneratingImages[user.name]}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                          title="Regenerate this player's visual scene"
                        >
                          {regeneratingImages[user.name] ? (
                            <>
                              <Loader2 size={11} className="animate-spin text-[#0AF468]" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw size={11} className="text-[#0AF468]" />
                              <span>{user.personalizedCampaign.image ? 'Regenerate Image' : 'Generate Image'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-slate-950 flex items-center justify-center shadow-inner">
                        {regeneratingImages[user.name] ? (
                          <div className="flex flex-col items-center gap-2 text-white text-center p-4">
                            <Loader2 size={24} className="animate-spin text-[#0AF468]" />
                            <span className="text-[10px] font-mono text-slate-300">Rendering new football scene...</span>
                          </div>
                        ) : user.personalizedCampaign.image ? (
                          <img src={user.personalizedCampaign.image} alt="Personalized Ad" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-6 space-y-2">
                            <Gamepad2 size={28} className="mx-auto text-slate-500" />
                            <span className="text-slate-400 text-xs block">No image generated yet</span>
                            <button
                              onClick={() => handleRegenerateImage(user.name)}
                              className="px-3 py-1.5 btn-primary rounded-xl text-[10px] font-mono font-bold transition flex items-center gap-1.5 mx-auto"
                            >
                              <Sparkles size={11} /> Generate 16:9 Scene
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {audienceContextModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#0D131D]/95 backdrop-blur-xl border border-white/15 rounded-3xl shadow-2xl max-w-lg w-full p-6 relative text-white">
            <button 
              onClick={() => setAudienceContextModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-400 text-lg"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-white mb-2">{audienceContextModal.name} Context</h3>
            <p className="text-slate-400 leading-relaxed text-xs whitespace-pre-line">{audienceContextModal.bio}</p>
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setAudienceContextModal(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
