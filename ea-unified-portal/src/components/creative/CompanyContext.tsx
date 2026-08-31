import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe, Info, FileText, Sparkles } from 'lucide-react';
import { useCompanyContext } from '@/context';

export const CompanyContext: React.FC = () => {

  const { name, description, saveContext } = useCompanyContext();
  const [editedName, setEditedName] = useState(name);
  const [editedDesc, setEditedDesc] = useState(description);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setEditedName(name);
    setEditedDesc(description);
  }, [name, description]);

  const handleSave = async () => {
    await saveContext(editedName, editedDesc);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-6">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-[#0072BC]/20 rounded-2xl flex items-center justify-center shadow-sm">
            <Settings className="text-[#008BE6]" size={24} />
          </div>
          <div>
            <h1 className="page-title text-3xl font-extrabold tracking-tight text-white">Global Company Context</h1>
            <p className="text-[#8FA3BC] text-sm">Define brand identity to power AI-driven insights and content generation.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-xl space-y-5">
        <div>
          <label className="block text-xs font-semibold text-white mb-2">Company / Franchise Name</label>
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="w-full bg-[#0E1A29] border border-[#253D5B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0072BC]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white mb-2">Brand Description & Guidelines</label>
          <textarea
            rows={6}
            value={editedDesc}
            onChange={(e) => setEditedDesc(e.target.value)}
            className="w-full bg-[#0E1A29] border border-[#253D5B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0072BC]"
          />
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0072BC] hover:bg-[#008BE6] text-white text-xs font-bold shadow-lg transition-all"
        >
          <Save size={16} />
          <span>{isSaved ? "Saved Context!" : "Save Brand Context"}</span>
        </button>
      </div>
    </div>
  );
};
