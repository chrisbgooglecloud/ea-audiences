import React, { useState } from 'react';
import { generateSyntheticUsersBatch } from '../services/geminiService';
import { brandConfig } from '../config';
import { Users, RotateCcw, UserPlus, Brain, Target, Compass, Smartphone } from 'lucide-react';
import { CombinedPersona, SyntheticUserProfile } from '../types';
interface SyntheticUsersProps {
  personas: CombinedPersona[];
}
import { useCompanyContext } from '../context/CompanyContext';

export const SyntheticUsers: React.FC<{ personas: CombinedPersona[] }> = ({ personas }) => {
    const { name: companyName, description: companyDescription } = useCompanyContext();
    const [selectedPersona, setSelectedPersona] = useState<CombinedPersona | null>(personas[0] || null);
  const [standardAudiences, setStandardAudiences] = useState<CombinedPersona[]>([]);

  // Combine dynamic personas with standard ones
  const allPersonas: CombinedPersona[] = [
    ...personas,
    ...standardAudiences.map(std => ({
      ...std,
      details: std.details as any
    }))
  ];

  const [selectedPersonaKeys, setSelectedPersonaKeys] = useState<string[]>([]);
  
  const getPersonaKey = (p: CombinedPersona) => {
    return `${(p as any).isStandard ? 'std' : 'dyn'}_${p.name}`;
  };
  const [count, setCount] = useState<number>(5);
  const [context, setContext] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedUsers, setGeneratedUsers] = useState<SyntheticUserProfile[]>([]);
  const [audienceContextModal, setAudienceContextModal] = useState<{name: string, bio: string} | null>(null);
  const [customerData, setCustomerData] = useState<any[]>([]);

  React.useEffect(() => {
    // If we haven't loaded them yet, fetch on mount
    const loadInitial = async () => {
      try {
        const clientRes = await fetch('/data/configuration/microsite_sample_data.json');
        if (clientRes.ok) {
          const clientData = await clientRes.json();
          setCustomerData(clientData);
        }

        const stdRes = await fetch('/data/configuration/synthetic_standard_audiences.json');
        if (stdRes.ok) {
          const stdData = await stdRes.json();
          setStandardAudiences(stdData);
        }

        const res = await fetch('/api/load-run/synthetic_users');
        if (res.ok) {
          const data = await res.json();
          if (data.generatedUsers && data.generatedUsers.length > 0) {
            setGeneratedUsers(data.generatedUsers);
          }
          if (data.context) {
            setContext(data.context);
          }
        }
      } catch (err) {
        // No problem, just don't load
      }
    };
    loadInitial();
  }, []);

  // Initialize selected on first render or when personas prop changes
  React.useEffect(() => {
    setSelectedPersonaKeys(prev => {
      const allKeys = allPersonas.map(p => getPersonaKey(p));
      if (prev.length === 0) return allKeys;
      const newKeys = allKeys.filter(k => !prev.includes(k));
      return [...prev, ...newKeys];
    });
  }, [personas, standardAudiences]);

  const togglePersona = (key: string) => {
    setSelectedPersonaKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };


  const handleGenerate = async () => {
    if (selectedPersonaKeys.length === 0) return;
    
    setIsLoading(true);
    try {
      let allNewProfiles: SyntheticUserProfile[] = [];
      const selectedPersonasObjects = allPersonas.filter(p => selectedPersonaKeys.includes(getPersonaKey(p)));

      for (const basePersona of selectedPersonasObjects) {
        const explicitContext = `Company Context: ${companyDescription}. We are expanding the persona ${basePersona.name}. Base this expansion on real customer profile metrics if possible: ${JSON.stringify(customerData.slice(0, 5))}. Additional User Context: ${context}`;
        const batch = await generateSyntheticUsersBatch(basePersona, count, explicitContext);
        
        const newProfiles = batch.map((u: any, idx: number) => ({
          ...basePersona,
          id: `u_${basePersona.name.replace(/\s+/g, '_')}_${Date.now()}_${idx}`,
          baseAudienceName: basePersona.name,
          baseAudienceBio: basePersona.details?.bio || basePersona.bio,
          name: u.name || "Unknown",
          bio: u.bio || "No bio available.",
          demographics: u.demographics || "Unknown demographics",
          cognitiveStyle: u.cognitiveStyle,
          lifestyleFriction: u.lifestyleFriction,
          digitalFootprint: u.digitalFootprint,
          psychographicFlavor: u.psychographicFlavor
        }));
        
        allNewProfiles = [...allNewProfiles, ...newProfiles];
      }

      setGeneratedUsers(allNewProfiles);

      // Save run
      if (allNewProfiles.length > 0) {
        fetch('/api/save-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId: 'synthetic_users',
            data: { generatedUsers: allNewProfiles, context }
          })
        }).catch(err => console.error("Failed to save synthetic users run:", err));
      }

    } catch (error) {
      console.error(error);
      alert("Failed to generate synthetic users.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadLast = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/load-run/synthetic_users');
      if (!res.ok) throw new Error("No saved run found");
      const data = await res.json();

      if (data.generatedUsers) {
        setGeneratedUsers(data.generatedUsers);
      }
      if (data.context) {
        setContext(data.context);
      }
    } catch (error) {
      console.warn(error);
      alert("No previous session found.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="page-header">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="text-[#0077C8]" />
            <h1 className="page-title">Synthetic Users</h1>
          </div>
          <p className="text-subtext mt-1">Generate expanded, highly detailed synthetic users based on your core audiences.</p>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="content-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-heading">Generation Settings</h3>
              <button
                onClick={handleLoadLast}
                className="btn-ghost flex items-center gap-2"
                disabled={isLoading}
              >
                <RotateCcw size={16} /> Load Last
              </button>
            </div>

            <div className="mb-6">
              <label className="form-label mb-3 block">Select Base Personas</label>
              <div className="p-4 border border-gray-200 rounded-lg bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Dynamic Audiences */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Audiences</h4>
                  {personas.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-sm text-blue-800">
                      <p className="font-medium mb-1">No custom audiences found.</p>
                      <p className="text-blue-600">Please go to the Audiences tab to generate or upload them first to use them here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {personas.map((p, i) => (
                        <label key={`dyn-${i}`} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-[#0077C8] rounded border-gray-300 focus:ring-[#0077C8]"
                            checked={selectedPersonaKeys.includes(getPersonaKey(p))}
                            onChange={() => togglePersona(getPersonaKey(p))}
                          />
                          <div>
                            <p className="font-medium text-sm text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.personaName}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Standard Personas */}
                <div className="md:border-l md:border-gray-100 md:pl-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Standard Personas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {standardAudiences.map((p, i) => (
                      <label key={`std-${i}`} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-[#0077C8] rounded border-gray-300 focus:ring-[#0077C8]"
                          checked={selectedPersonaKeys.includes(getPersonaKey(p))}
                          onChange={() => togglePersona(getPersonaKey(p))}
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.personaName}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="md:col-span-1">
                <label className="form-label">Users per Audience</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={5}>5 Users</option>
                  <option value={10}>10 Users</option>
                  <option value={15}>15 Users</option>
                </select>
                <div className="text-[10px] text-gray-500 mt-1 font-mono">
                  {selectedPersonaKeys.length} aud. × {count} = {selectedPersonaKeys.length * count} users total
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="form-label">Additional Context (Optional)</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="input-field min-h-[42px] py-2"
                  placeholder="Add any specific context for these users (e.g. 'Make these users recent homebuyers')."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isLoading || selectedPersonaKeys.length === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    Generating Profiles...
                  </div>
                ) : "Generate Users"}
              </button>
            </div>
          </div>

          {generatedUsers.length > 0 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-heading">Generated Users ({generatedUsers.length})</h3>
              <div className="grid grid-cols-1 gap-6">
                {generatedUsers.map((user, idx) => (
                  <div key={idx} className="content-card">
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <h4 className="text-xl font-bold text-heading">{user.name}</h4>
                        <p className="text-sm text-subtext font-medium">{user.demographics}</p>
                      </div>
                      <button 
                        onClick={() => setAudienceContextModal({ name: user.baseAudienceName || user.name, bio: user.baseAudienceBio || user.bio })}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors text-gray-600 text-xs rounded-full font-bold uppercase"
                        aria-label="View Audience Context"
                      >
                        {user.baseAudienceName || user.name} Base
                      </button>
                    </div>
                    
                    <p className="text-gray-700 italic mb-6">"{user.bio}"</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {user.cognitiveStyle && (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                          <h5 className="font-bold flex items-center gap-2 text-[#0077C8] mb-3">
                            <Brain size={16} /> Cognitive Style
                          </h5>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li><span className="font-semibold text-gray-900">Info Density:</span> {user.cognitiveStyle.informationDensityPreference}</li>
                            <li><span className="font-semibold text-gray-900">Trust Signal:</span> {user.cognitiveStyle.primaryTrustSignal}</li>
                            <li><span className="font-semibold text-gray-900">Decision Velocity:</span> {user.cognitiveStyle.decisionVelocity}</li>
                            <li><span className="font-semibold text-gray-900">Risk Tolerance:</span> {user.cognitiveStyle.riskTolerance}</li>
                          </ul>
                        </div>
                      )}

                      {user.lifestyleFriction && (
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                          <h5 className="font-bold flex items-center gap-2 text-purple-700 mb-3">
                            <Target size={16} /> Lifestyle & Friction
                          </h5>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li><span className="font-semibold text-gray-900">Daily Grind:</span> {user.lifestyleFriction.dailyGrindContext}</li>
                            <li><span className="font-semibold text-gray-900">Financial Mindset:</span> {user.lifestyleFriction.financialMindset}</li>
                            <li><span className="font-semibold text-gray-900">Brand Loyalty:</span> {user.lifestyleFriction.brandLoyaltyQuotient}</li>
                            <li><span className="font-semibold text-gray-900">Power Dynamic:</span> {user.lifestyleFriction.householdPowerDynamic}</li>
                          </ul>
                        </div>
                      )}

                      {user.digitalFootprint && (
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                          <h5 className="font-bold flex items-center gap-2 text-indigo-700 mb-3">
                            <Smartphone size={16} /> Digital Footprint
                          </h5>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li><span className="font-semibold text-gray-900">Recent Searches:</span> {user.digitalFootprint.last3SearchQueries?.join(', ')}</li>
                            <li><span className="font-semibold text-gray-900">Unsubscribe Trigger:</span> {user.digitalFootprint.unsubscribeTrigger}</li>
                            <li><span className="font-semibold text-gray-900">Ecosystem:</span> {user.digitalFootprint.platformEcosystem}</li>
                            <li><span className="font-semibold text-gray-900">Recent Life Event:</span> {user.digitalFootprint.recentBigLifeEvent}</li>
                          </ul>
                        </div>
                      )}

                      {user.psychographicFlavor && (
                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                          <h5 className="font-bold flex items-center gap-2 text-orange-700 mb-3">
                            <Compass size={16} /> Psychographic Flavor
                          </h5>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li><span className="font-semibold text-gray-900">The One Luxury:</span> {user.psychographicFlavor.theOneLuxury}</li>
                            <li><span className="font-semibold text-gray-900">Aspiration vs Reality:</span> {user.psychographicFlavor.aspirationVsReality}</li>
                            <li><span className="font-semibold text-gray-900">Social Cause:</span> {user.psychographicFlavor.socialCauseAlignment}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {audienceContextModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
            <button 
              onClick={() => setAudienceContextModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-heading mb-2">{audienceContextModal.name} Context</h3>
            <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">{audienceContextModal.bio}</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setAudienceContextModal(null)}
                className="btn-secondary"
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
