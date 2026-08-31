import React, { useState, useEffect, useRef } from 'react';
import { conductQualitativeInterview } from '@/services/geminiService';
import { brandConfig } from '@/config';
import { MessageSquare, Users, Send, Loader2, User, Bot, AlertCircle, RotateCcw, Save, Play, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Persona, MarketingBriefData, InterviewResult, CombinedPersona, SavedSimulation } from '@/types';
import { SIMULATION_PRODUCTS } from '@/data/simulationData';



import { useCompanyContext } from '@/context';

export const SyntheticChat: React.FC = () => {
  const { name, description } = useCompanyContext();
  // State
  const [personas, setPersonas] = useState<CombinedPersona[]>([]);
  const [brief, setBrief] = useState<MarketingBriefData | null>(null);
  const [question, setQuestion] = useState("");
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    // Load Personas dynamically
    Promise.all([
      fetch('/api/load-run/audience_generator').then(res => res.ok ? res.json() : {}).catch(() => ({})),
      fetch('/data/configuration/synthetic_standard_audiences.json').then(res => res.ok ? res.json() : []).catch(() => [])
    ]).then(([runData, stdAudiences]) => {
      const runPersonas = ((runData as any) && (runData as any).personas) ? (runData as any).personas : [];
      setPersonas([...runPersonas, ...(Array.isArray(stdAudiences) ? stdAudiences : [])]);
    }).catch(console.error);

    // Load Brief
    fetch('/api/load-run/marketing_brief')
      .then(res => res.json())
      .then(data => {
        if (data && data.title) setBrief(data);
      })
      .catch(console.error);
  }, []);

  const handleStartInterview = async () => {
    if (!question.trim() || personas.length === 0) return;

    setIsInterviewing(true);
    setResults([]);
    setProgress({ current: 0, total: personas.length });

    const newResults: InterviewResult[] = [];

    for (let i = 0; i < personas.length; i++) {
      const p = personas[i];
      try {
        // Determine context from brief or generic
        const context = brief
          ? `Product: ${brief.productName}. Goal: ${brief.campaignGoal}. Company: ${name}. Context: ${description}`
          : `Company: ${name}. Context: ${description}`;

        const result = await conductQualitativeInterview(p, context, question);
        newResults.push(result);
        setResults([...newResults]); // Update UI incrementally
      } catch (e) {
        console.error(`Error interviewing ${p.name}:`, e);
      }
      setProgress({ current: i + 1, total: personas.length });
    }

    setIsInterviewing(false);
    saveSession(question, newResults);
  };

  const saveSession = (q: string, res: InterviewResult[]) => {
    const session = {
      type: 'INTERVIEW_SESSION',
      id: `interview_${Date.now()}`,
      name: `Interview: ${q.substring(0, 30)}...`,
      timestamp: new Date().toISOString(),
      question: q,
      results: res
    };

    fetch('/api/save-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        featureId: 'qualitative_interview',
        data: session
      })
    }).catch(err => console.error("Failed to save interview:", err));
  };

  const handleLoadLast = async () => {
    try {
      const res = await fetch('/api/load-run/qualitative_interview');
      if (!res.ok) throw new Error("No saved interview found");
      const data = await res.json();
      if (data) {
        setQuestion(data.question || "");
        setResults(data.results || []);
        // If personas are missing from current state but exist in saved data, we might want to reconcile?
        // For now, results display is independent of current personas state
      }
    } catch (error) {
      console.warn(error);
      alert("No previous interview session found.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header / Input Section */}
      <div className="content-card p-8 border-b-4 border-b-[#0077C8]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="section-header flex items-center gap-3">
              <MessageSquare className="text-[#0077C8]" size={32} />
              Qualitative Interview Hub
            </h2>
            <p className="text-subtext mt-2 text-lg font-medium">
              Broadcast a question to all {personas.length} personas. Our AI agents will conduct deep-dive interviews including automated follow-ups.
            </p>
          </div>
          <button
            onClick={handleLoadLast}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw size={20} /> Load Last Session
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isInterviewing && handleStartInterview()}
              placeholder="e.g., 'What fragrance notes or candle formats do you look for when shopping seasonal collections?'"
              className="input-field text-lg px-6 py-4 pr-12 shadow-sm"
              disabled={isInterviewing}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {question.length > 0 && <CheckCircle2 className="text-green-500" size={24} />}
            </div>
          </div>
          <button
            onClick={handleStartInterview}
            disabled={isInterviewing || !question.trim() || personas.length === 0}
            className="btn-primary px-8 py-4 flex items-center gap-3 text-lg min-w-[220px] justify-center"
          >
            {isInterviewing ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                {Math.round((progress.current / progress.total) * 100)}%
              </>
            ) : (
              <>
                <Play size={24} fill="currentColor" />
                Start Interview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-heading flex items-center gap-2">
            <Users size={24} className="text-[#0077C8]" /> Interview Results ({results.length})
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {results.map((result, i) => (
              <div key={i} className="content-card overflow-hidden transition-all hover:shadow-xl border-l-4 border-l-[#0077C8]">
                {/* Result Header */}
                <div
                  onClick={() => setExpandedResultId(expandedResultId === result.personaId ? null : result.personaId)}
                  className="p-6 cursor-pointer flex justify-between items-start hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex gap-6">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#0077C8] flex-shrink-0 border border-blue-100 shadow-sm">
                      <User size={28} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-heading">{result.personaName}</h4>
                      <p className="text-subtext font-bold text-sm mb-3 uppercase tracking-wider">{result.sentiment} Sentiment</p>
                      <p className="text-heading italic border-l-4 border-[#0077C8] pl-4 py-2 bg-gray-50/80 rounded-r-xl font-medium">
                        "{result.quote}"
                      </p>
                    </div>
                  </div>
                  <div className="text-subtext p-2 hover:bg-white rounded-full transition-all">
                    {expandedResultId === result.personaId ? <ChevronDown size={28} /> : <ChevronRight size={28} />}
                  </div>
                </div>

                {/* Expanded Transcript */}
                {expandedResultId === result.personaId && (
                  <div className="border-t border-gray-100 bg-gray-50/30 p-8">
                    <div className="max-w-3xl mx-auto space-y-8">
                      <h5 className="font-bold text-subtext uppercase tracking-widest text-xs mb-6 text-center">Full Interview Transcript</h5>
                      {result.transcript.map((msg, index) => (
                        <div key={index} className={`flex gap-4 ${msg.role === 'interviewer' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm border ${msg.role === 'interviewer' ? 'bg-heading text-white border-heading' : 'bg-white text-heading border-gray-100'
                            }`}>
                            {msg.role === 'interviewer' ? <Bot size={20} /> : <User size={20} />}
                          </div>
                          <div className={`p-5 rounded-2xl text-sm leading-relaxed max-w-[85%] shadow-sm ${msg.role === 'interviewer'
                            ? 'bg-white border border-blue-100 text-heading rounded-tr-none'
                            : 'bg-white border border-gray-100 text-heading rounded-tl-none'
                            }`}>
                            <span className={`font-black block mb-1 text-[10px] uppercase tracking-widest ${msg.role === 'interviewer' ? 'text-[#0077C8]' : 'text-subtext'}`}>
                              {msg.role === 'interviewer' ? 'AI Researcher' : result.personaName}
                            </span>
                            {msg.content}
                          </div>
                        </div>
                      ))}

                      <div className="mt-10 bg-blue-50/50 border-2 border-dashed border-blue-200 p-6 rounded-2xl shadow-inner">
                        <h6 className="font-black text-[#0077C8] text-xs mb-2 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={16} /> Key Researcher Insight
                        </h6>
                        <p className="text-heading text-sm font-medium leading-relaxed">{result.summary}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !isInterviewing && (
        <div className="text-center py-32 content-card bg-gray-50/20 border-dashed">
          <MessageSquare size={80} className="mx-auto mb-6 text-gray-200" />
          <h3 className="text-2xl font-bold text-subtext">Ready to Interview</h3>
          <p className="max-w-md mx-auto mt-3 text-subtext font-medium">Enter a question above to start a broadcast interview with all your generated personas.</p>
        </div>
      )}
    </div>
  );
};

