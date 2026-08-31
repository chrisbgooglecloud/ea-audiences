import React, { useState, useEffect } from 'react';
import { generateJson, generateImage } from '@/services/geminiService';
import { brandConfig } from '@/config';
import { Schema, Type } from "@google/genai";
import { RotateCcw, Play, ArrowLeft, Shield, Heart, Activity } from 'lucide-react';

const FALLBACK_CONSUMER_DATA = [
  { id: 1, name: "Jessica M.", condition: "Home Chef", interest: "High", adherence: "Frequent", recent: "Purchased Le Creuset, Browsed recipes", segment_hint: "Home Chef" },
  { id: 2, name: "David K.", condition: "Tech Enthusiast", interest: "Medium", adherence: "Occasional", recent: "Browsed Laptops, Added to cart", segment_hint: "Tech Enthusiast" },
  { id: 3, name: "Robert L.", condition: "Fashion Lover", interest: "High", adherence: "Very Frequent", recent: "Purchased LOGO Dress, Reviewed items", segment_hint: "Fashion Lover" },
  { id: 4, name: "Sarah P.", condition: "Home Improver", interest: "High", adherence: "Frequent", recent: "Browsed Outdoor Furniture", segment_hint: "Home Improver" },
  { id: 5, name: "Michael T.", condition: "Beauty Guru", interest: "Medium", adherence: "Rare", recent: "Purchased Skincare, Viewed tutorials", segment_hint: "Beauty Guru" },
  { id: 6, name: "Elena R.", condition: "Home Chef", interest: "Medium", adherence: "Frequent", recent: "Joined Cooking club", segment_hint: "Home Chef" },
  { id: 7, name: "Thomas B.", condition: "Tech Enthusiast", interest: "Low", adherence: "Rare", recent: "Missed sale, Cart abandoned", segment_hint: "Tech Enthusiast" },
  { id: 8, name: "Linda C.", condition: "Fashion Lover", interest: "Medium", adherence: "Frequent", recent: "Viewed Fall collection", segment_hint: "Fashion Lover" },
  { id: 9, name: "James H.", condition: "Home Improver", interest: "High", adherence: "Very Frequent", recent: "Purchased Tools", segment_hint: "Home Improver" },
  { id: 10, name: "Patricia W.", condition: "Beauty Guru", interest: "High", adherence: "Frequent", recent: "Auto-delivery renewal", segment_hint: "Beauty Guru" },
  { id: 11, name: "Kevin G.", condition: "Home Chef", interest: "Medium", adherence: "Frequent", recent: "Browsed Air Fryers", segment_hint: "Home Chef" },
  { id: 12, name: "Nancy D.", condition: "Tech Enthusiast", interest: "Low", adherence: "Occasional", recent: "Price drop alert clicked", segment_hint: "Tech Enthusiast" },
];

interface Audience {
  name: string;
  description: string;
  key_characteristics: string[];
  target_user_ids: number[];
}



import { useCompanyContext } from '@/context';

export const ESpots: React.FC = () => {
  const { name, description } = useCompanyContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [campaigns, setCampaigns] = useState<Record<number, { copy: any; image: string | null }>>({});
  const [consumerData, setConsumerData] = useState<any[]>(FALLBACK_CONSUMER_DATA);

  useEffect(() => {
    fetch('/data/configuration/microsite_sample_data.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setConsumerData(data);
        }
      })
      .catch(err => console.warn("Failed to load sample data, using fallback", err));
  }, []);

  useEffect(() => {
    if (step > 1 && audiences.length > 0) {
      const runData = { audiences, campaigns, step };
      fetch('/api/save-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId: 'espots', data: runData })
      }).catch(err => console.error("Failed to save run to server:", err));
    }
  }, [audiences, campaigns, step]);

  const handleLoadLast = async () => {
    setLoading(true);
    setLoadingMessage("Loading previous run...");
    try {
      const res = await fetch('/api/load-run/espots');
      if (!res.ok) throw new Error("No saved run");
      const data = await res.json();
      setTimeout(() => {
        setAudiences(data.audiences || []);
        setStep(2);
        if (data.campaigns) setCampaigns(data.campaigns);
        setLoading(false);
        setLoadingMessage("");
      }, 1000);
    } catch (e) {
      console.warn("Could not load last run:", e);
      setLoading(false);
      setLoadingMessage("");
      alert("No previous run found.");
    }
  };

  const handleFullGeneration = async () => {
    setLoading(true);
    setCampaigns({});
    setAudiences([]);

    try {
      setLoadingMessage("Analyzing data & identifying segments...");
      const prompt = `Analyze this consumer data and group them into 3 distinct segments for ${name} outreach. Context: ${description}. Data: ${JSON.stringify(consumerData)}`;
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          audiences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                key_characteristics: { type: Type.ARRAY, items: { type: Type.STRING } },
                target_user_ids: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              },
              required: ["name", "description", "key_characteristics", "target_user_ids"]
            }
          }
        },
        required: ["audiences"]
      };

      const audResult = await generateJson(prompt, schema);
      const generatedAudiences = audResult?.audiences || [];
      if (generatedAudiences.length === 0) throw new Error("Failed to generate audiences");

      setAudiences(generatedAudiences);

      setLoadingMessage("Designing personalized health copy & banners...");

      const promises = generatedAudiences.map(async (aud: Audience, idx: number) => {
        const copyPrompt = `Create a marketing campaign for the audience "${aud.name}" for ${name}'s products. Context: ${description}. Description: ${aud.description}. Write a reassuring, benefit-focused headline and a VERY short Call to Action (CTA) of less than 5 words.`;
        const copySchema: Schema = {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            subhead: { type: Type.STRING },
            cta: { type: Type.STRING }
          },
          required: ["headline", "subhead", "cta"]
        };

        const copyResult = await generateJson(copyPrompt, copySchema);

        const imagePrompt = `Design a high-quality, professional retail marketing banner for ${brandConfig.companyName} targeting "${aud.name}". 
            
            **TEXT REQUIREMENT:**
            You MUST legally and clearly write the HEADLINE text: "${copyResult.headline}" directly onto the image.
            The text should be stylized, readable, and integrated into the design (e.g., elegant typography, ${name} brand colors).
            
            **VISUALS:**
            - Subject: ${aud.description} (Shopping, lifestyle, product usage, happy customers)
            - Style: Professional retail advertising, clean, trustworthy, warm, bright, visually engaging.
            - Background: Modern home, cozy living room, stylish kitchen, or neutral studio backdrop.
            
            **NEGATIVE CONSTRAINTS:**
            - DO NOT include browser frames, search bars, or fake website interfaces.
            
            Return ONLY the artistic banner image.`;

        const imageUrl = await generateImage(imagePrompt, 'gemini-3.1-flash-lite-image', '16:9');
        return { idx, copy: copyResult, image: imageUrl };
      });

      const results = await Promise.all(promises);
      const newCampaigns: any = {};
      results.forEach(res => {
        newCampaigns[res.idx] = { copy: res.copy, image: res.image };
      });

      setCampaigns(newCampaigns);
      setStep(2);

    } catch (error) {
      console.error("Error generating campaigns:", error);
      alert("Failed to generate campaigns.");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="section-header">Banner Creation</h2>
          <p className="text-subtext mt-1">Generate targeted marketing banners for specific member segments.</p>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/90 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#0077C8] mb-4"></div>
            <p className="text-xl font-semibold text-heading mb-2">Consulting Gemini...</p>
            <p className="text-subtext animate-pulse">{loadingMessage}</p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="content-card p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-heading">Member Data Input</h3>
            <div className="flex gap-4 items-center">
              <button
                onClick={handleLoadLast}
                className="text-subtext hover:text-[#0077C8] font-medium flex items-center gap-2 transition-colors"
                title="Replay last run"
              >
                <RotateCcw size={16} /> Load Last Run
              </button>
              <button
                onClick={handleFullGeneration}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Play size={18} fill="currentColor" /> Generate Banners
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {consumerData.length > 0 && Object.keys(consumerData[0])
                    .filter(key => key !== 'id' && key !== 'user_id')
                    .map(key => (
                      <th key={key} className="capitalize">{key.replace(/_/g, ' ')}</th>
                    ))
                  }
                </tr>
              </thead>
              <tbody>
                {consumerData.map((user, idx) => (
                  <tr key={user.id || idx}>
                    {Object.entries(user)
                      .filter(([key]) => key !== 'id' && key !== 'user_id')
                      .map(([key, val]: [string, any], i) => (
                        <td key={i} className={i === 1 ? "font-bold text-heading" : "text-subtext truncate max-w-xs"}>
                          {val}
                        </td>
                      ))
                    }
                  </tr>
                ))}
              </tbody>
            </table>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {audiences.map((aud, idx) => {
              const campaign = campaigns[idx];
              return (
                <div key={idx} className="flex flex-col gap-6">
                  {/* Audience Card */}
                  <div className="content-card border-t-4 border-[#0077C8] h-fit">
                    <h3 className="section-header mb-2">{aud.name}</h3>
                    <p className="text-subtext mb-4 text-sm">{aud.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {aud.key_characteristics.map((trait, i) => (
                        <span key={i} className="badge badge-gray">{trait}</span>
                      ))}
                    </div>
                  </div>

                  {/* Campaign Result Card */}
                  {campaign ? (
                    <div className="content-card overflow-hidden flex-grow flex flex-col p-0">
                      <div className="aspect-video w-full bg-gray-50 relative overflow-hidden group border-b border-gray-100">
                        {campaign.image ? (
                          <img
                            src={`data:image/png;base64,${campaign.image}`}
                            alt="Campaign Banner"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-subtext italic">No Image Generated</div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="mb-4">
                          <h4 className="text-xs font-bold text-subtext uppercase tracking-wider mb-1">Headline</h4>
                          <p className="text-lg font-bold text-heading leading-tight">
                            {typeof campaign.copy?.headline === 'string' ? campaign.copy.headline : 'N/A'}
                          </p>
                        </div>
                        <div className="mb-4 flex-grow">
                          <h4 className="text-xs font-bold text-subtext uppercase tracking-wider mb-1">Subhead</h4>
                          <p className="text-sm text-subtext">
                            {typeof campaign.copy?.subhead === 'string' ? campaign.copy.subhead : 'N/A'}
                          </p>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                          <button className="w-full btn-secondary py-2">
                            {typeof campaign.copy?.cta === 'string' ? campaign.copy?.cta : 'Learn More'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="content-card border-2 border-dashed border-gray-100 h-64 flex items-center justify-center text-subtext font-medium bg-gray-50/50">
                      Generation Failed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};