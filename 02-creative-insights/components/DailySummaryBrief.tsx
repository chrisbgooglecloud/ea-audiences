import React, { useState, useEffect, useRef } from 'react';
import { generateDailyAudioBriefing, generatePodcastTTS } from '../services/geminiService';
import { useCompanyContext } from '../context/CompanyContext';
import {
    Headphones,
    Play,
    Pause,
    RotateCcw,
    Sparkles,
    RefreshCw,
    Save,
    Radio,
    Volume2,
    VolumeX,
    FileText
} from 'lucide-react';

interface DailySummaryBriefProps {
    bulkData?: any;
    rows?: any[];
}

export const DailySummaryBrief: React.FC<DailySummaryBriefProps> = ({ bulkData, rows }) => {
    const { name: activeCompany } = useCompanyContext();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [briefData, setBriefData] = useState<any>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');

    // Audio Playback & Synthesis State
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [currentTimeSec, setCurrentTimeSec] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [isMuted, setIsMuted] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');
    const [isGeneratingTts, setIsGeneratingTts] = useState<boolean>(false);
    const [currentSpokenIndex, setCurrentSpokenIndex] = useState<number>(0);

    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const timerIntervalRef = useRef<any>(null);

    useEffect(() => {
        loadSavedRun(true);

        return () => {
            if (audioElementRef.current) {
                audioElementRef.current.pause();
                audioElementRef.current.src = '';
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    // Load Last from GCS
    const loadSavedRun = async (isInitial = false) => {
        setIsLoading(true);
        if (!isInitial) setStatusMessage('Checking GCS for saved Daily Brief run...');
        try {
            const companyParam = encodeURIComponent(activeCompany || 'EA Games FC');
            const res = await fetch(`/api/load-run/daily_summary?companyName=${companyParam}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.audioScript) {
                    setBriefData(data);
                    if (data.voiceName) setSelectedVoice(data.voiceName);
                    if (!isInitial) setStatusMessage('Loaded latest Daily Brief from GCS.');
                    return;
                }
            }
            if (!isInitial) setStatusMessage('No previous run found in GCS. Generating fresh briefing...');
            if (!isInitial) {
                handleGenerateBriefing();
            }
        } catch (e) {
            console.error("Error loading saved Daily Brief run:", e);
            if (!isInitial) setStatusMessage('Failed to load from GCS.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatusMessage(''), 4000);
        }
    };

    // Auto-save to GCS
    const autoSaveToGCS = async (dataToSave: any) => {
        try {
            await fetch('/api/save-run/daily_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: activeCompany,
                    timestamp: new Date().toISOString(),
                    runData: dataToSave
                })
            });
        } catch (e) {
            console.warn("Auto-save to GCS failed:", e);
        }
    };

    // Synthesize Gemini Podcast Script & TTS
    const handleGenerateBriefing = async () => {
        setIsLoading(true);
        setStatusMessage('Reading cross-channel telemetry & crafting 90s executive memo...');
        try {
            let activeAnomalyAlerts: any = null;
            try {
                const companyParam = encodeURIComponent(activeCompany || 'EA Games FC');
                const alertRes = await fetch(`/api/load-run/alerts?companyName=${companyParam}`);
                if (alertRes.ok) {
                    const alertJson = await alertRes.json();
                    if (alertJson?.activeRun) {
                        activeAnomalyAlerts = alertJson.activeRun;
                    }
                }
            } catch (e) {
                console.warn("Could not load alert data:", e);
            }

            const rawBulk = bulkData || {};
            const rawRows = rows || [];

            const result = await generateDailyAudioBriefing(
                rawBulk,
                rawRows,
                activeAnomalyAlerts,
                activeCompany
            );

            if (result && result.audioScript) {
                setStatusMessage('Generating natural speech via Gemini 3.1 Audio TTS...');
                try {
                    const ttsRes = await generatePodcastTTS(result.audioScript, selectedVoice, activeCompany);
                    if (ttsRes && ttsRes.audioUrl) {
                        result.audioUrl = ttsRes.audioUrl;
                        result.voiceName = selectedVoice;
                    }
                } catch (ttsErr) {
                    console.warn("TTS generation failed, fallback to Web Speech API:", ttsErr);
                }

                setBriefData(result);
                setStatusMessage('Audio briefing generated successfully!');
                await autoSaveToGCS(result);
            } else {
                setStatusMessage('Could not parse daily briefing summary.');
            }
        } catch (e: any) {
            console.error("Error generating daily briefing:", e);
            setStatusMessage(`Generation failed: ${e.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatusMessage(''), 4000);
        }
    };

    const handleManualSave = async () => {
        if (!briefData) return;
        setIsSaving(true);
        setStatusMessage('Saving current briefing to GCS bucket...');
        try {
            const res = await fetch('/api/save-run/daily_summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: activeCompany,
                    timestamp: new Date().toISOString(),
                    runData: briefData
                })
            });
            if (res.ok) {
                setStatusMessage('Successfully saved Daily Brief audio to GCS.');
            } else {
                setStatusMessage('Failed to save to GCS.');
            }
        } catch (e) {
            setStatusMessage('Error saving to GCS.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setStatusMessage(''), 4000);
        }
    };

    // Voice Regeneration
    const handleGenerateVoice = async (voiceName: string) => {
        if (!briefData?.audioScript) return;
        setSelectedVoice(voiceName);
        setIsGeneratingTts(true);
        setStatusMessage(`Generating audio with Gemini voice '${voiceName}'...`);
        try {
            const res = await generatePodcastTTS(briefData.audioScript, voiceName, activeCompany);
            if (res && res.audioUrl) {
                const updated = {
                    ...briefData,
                    audioUrl: res.audioUrl,
                    voiceName: voiceName
                };
                setBriefData(updated);
                if (audioElementRef.current) {
                    audioElementRef.current.pause();
                    audioElementRef.current = new Audio(res.audioUrl);
                }
                setStatusMessage(`Audio regenerated with voice '${voiceName}'.`);
                await autoSaveToGCS(updated);
            }
        } catch (err) {
            console.error("Voice generation error:", err);
            setStatusMessage("Voice generation error. Falling back to browser speech.");
        } finally {
            setIsGeneratingTts(false);
            setTimeout(() => setStatusMessage(''), 4000);
        }
    };

    // Playback Logic
    const togglePlayAudio = () => {
        if (!briefData?.audioScript) return;
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    };

    const playAudio = () => {
        if (briefData?.audioUrl) {
            if (!audioElementRef.current) {
                audioElementRef.current = new Audio(briefData.audioUrl);
            }
            audioElementRef.current.playbackRate = playbackRate;
            audioElementRef.current.muted = isMuted;

            audioElementRef.current.ontimeupdate = () => {
                if (audioElementRef.current) {
                    const current = audioElementRef.current.currentTime;
                    const duration = audioElementRef.current.duration || briefData.durationSeconds || 90;
                    setCurrentTimeSec(Math.floor(current));
                    setAudioProgress((current / duration) * 100);

                    const sentences = (briefData.audioScript || '').split(/(?<=[.!?])\s+/);
                    const idx = Math.min(
                        Math.floor((current / duration) * sentences.length),
                        sentences.length - 1
                    );
                    setCurrentSpokenIndex(idx);
                }
            };

            audioElementRef.current.onended = () => {
                setIsPlaying(false);
                setAudioProgress(100);
                setCurrentTimeSec(briefData.durationSeconds || 90);
            };

            audioElementRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => {
                    console.warn("Audio element play error, falling back to Web Speech:", err);
                    playWebSpeechFallback();
                });
            return;
        }

        playWebSpeechFallback();
    };

    const playWebSpeechFallback = () => {
        if (!window.speechSynthesis) {
            alert('Speech synthesis not supported in this browser environment.');
            return;
        }

        window.speechSynthesis.cancel();
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

        const textToSpeak = briefData.audioScript;
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = playbackRate;
        utterance.pitch = 1.0;

        const sentences = textToSpeak.split('.');
        const totalDurationSec = briefData.durationSeconds || 90;
        let elapsed = 0;

        timerIntervalRef.current = setInterval(() => {
            elapsed += 1;
            setCurrentTimeSec(elapsed);
            setAudioProgress(Math.min((elapsed / totalDurationSec) * 100, 100));

            const sentenceIdx = Math.floor((elapsed / totalDurationSec) * sentences.length);
            setCurrentSpokenIndex(Math.min(sentenceIdx, sentences.length - 1));

            if (elapsed >= totalDurationSec) {
                clearInterval(timerIntervalRef.current);
                setIsPlaying(false);
            }
        }, 1000 / playbackRate);

        utterance.onend = () => {
            setIsPlaying(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setAudioProgress(100);
            setCurrentTimeSec(totalDurationSec);
        };

        synthUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
    };

    const pauseAudio = () => {
        if (audioElementRef.current) {
            audioElementRef.current.pause();
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.pause();
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        setIsPlaying(false);
    };

    const handleRestartAudio = () => {
        pauseAudio();
        setCurrentTimeSec(0);
        setAudioProgress(0);
        setCurrentSpokenIndex(0);
        if (audioElementRef.current) {
            audioElementRef.current.currentTime = 0;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        playAudio();
    };

    const handleSpeedChange = (speed: number) => {
        setPlaybackRate(speed);
        if (audioElementRef.current) {
            audioElementRef.current.playbackRate = speed;
        }
        if (isPlaying && window.speechSynthesis) {
            handleRestartAudio();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const scriptSentences = (briefData?.audioScript || '').split(/(?<=[.!?])\s+/).filter(Boolean);

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 animate-fadeIn">
            {/* Top Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Headphones size={13} /> Executive Audio Overview
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                            Conversational Multi-Source Audio Intelligence Briefing
                        </span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        Daily Audio Briefing
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => loadSavedRun(false)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl shadow-xs transition-all"
                        title="Load the latest saved Daily Brief from GCS"
                    >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                        Load Last
                    </button>
                    <button
                        onClick={handleManualSave}
                        disabled={isSaving || !briefData}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl shadow-xs transition-all"
                    >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : 'Save to GCS'}
                    </button>
                    <button
                        onClick={handleGenerateBriefing}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                        <Sparkles size={15} className="text-black" />
                        {isLoading ? 'Synthesizing...' : 'Synthesize Audio Brief'}
                    </button>
                </div>
            </div>

            {/* Status Toast */}
            {statusMessage && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#00F0FF]/10 border border-[#00F0FF]/20 rounded-xl text-xs font-medium text-[#00F0FF] animate-fadeIn font-mono">
                    <Radio size={14} className="animate-pulse text-[#00F0FF]" />
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* DEDICATED EXECUTIVE AUDIO BRIEFING & PLAYBACK CONTAINER */}
            <div className="bg-[#0D131D]/90 backdrop-blur-xl text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#00F0FF]/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-[#00F0FF]/15 rounded-2xl border border-[#00F0FF]/30 backdrop-blur-md">
                            <Headphones size={28} className="text-[#00F0FF]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0AF468]/15 text-[#0AF468] border border-[#0AF468]/30 font-mono">
                                    90-Second Executive Podcast
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    {briefData?.generatedAt || 'Today • 24-Hour Horizon'}
                                </span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-white">
                                {briefData?.title || 'Daily Brief: Executive Intelligence Overview'}
                            </h3>
                        </div>
                    </div>

                    {/* Gemini Voice Selector, Speed Controls & Mute */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Gemini Voice Selector */}
                        <div className="flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-xl border border-white/10 text-xs">
                            <span className="text-slate-400 font-mono text-[11px] pr-1">Voice:</span>
                            {['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'].map((vName) => (
                                <button
                                    key={vName}
                                    onClick={() => handleGenerateVoice(vName)}
                                    disabled={isGeneratingTts}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition text-[11px] ${
                                        (briefData?.voiceName || selectedVoice) === vName
                                            ? 'bg-[#00F0FF] text-black shadow-xs font-bold'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {vName}
                                </button>
                            ))}
                            {isGeneratingTts && <RefreshCw size={12} className="animate-spin text-[#00F0FF] ml-1" />}
                        </div>

                        <div className="flex items-center bg-black/50 rounded-xl p-1 border border-white/10 text-xs">
                            {[1.0, 1.25, 1.5].map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => handleSpeedChange(speed)}
                                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                                        playbackRate === speed 
                                            ? 'bg-[#0AF468] text-black shadow-xs' 
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 bg-black/50 rounded-xl border border-white/10 text-slate-300 hover:text-white transition-all"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                    </div>
                </div>

                {/* Animated Waveform & Player Controls */}
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-4">
                    <div className="flex items-center gap-4">
                        {/* Play/Pause Button */}
                        <button
                            onClick={togglePlayAudio}
                            className="w-14 h-14 rounded-2xl bg-[#E6FF00] hover:bg-[#d8f000] text-black flex items-center justify-center shadow-[0_0_20px_rgba(230,255,0,0.3)] transition-all transform hover:scale-105 active:scale-95 shrink-0"
                            title={isPlaying ? "Pause Audio Brief" : "Play Daily Brief"}
                        >
                            {isPlaying ? <Pause size={24} className="text-black" /> : <Play size={24} className="ml-1 text-black" />}
                        </button>

                        <button
                            onClick={handleRestartAudio}
                            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all shrink-0"
                            title="Restart Audio"
                        >
                            <RotateCcw size={16} />
                        </button>

                        {/* Visualizer Bars */}
                        <div className="flex-1 flex items-center gap-1 sm:gap-1.5 h-12 px-2 overflow-hidden">
                            {Array.from({ length: 36 }).map((_, i) => {
                                const activeHeight = isPlaying 
                                    ? Math.sin(i * 0.5 + currentTimeSec * 2) * 18 + 22 
                                    : (i % 3 === 0 ? 16 : i % 2 === 0 ? 10 : 6);
                                const isPassed = (i / 36) * 100 <= audioProgress;

                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-full transition-all duration-150 ${
                                            isPassed 
                                                ? 'bg-gradient-to-t from-[#00F0FF] to-[#0AF468]' 
                                                : 'bg-slate-800'
                                        }`}
                                        style={{ height: `${activeHeight}px` }}
                                    ></div>
                                );
                            })}
                        </div>

                        {/* Duration Display */}
                        <div className="text-right shrink-0 font-mono text-xs text-slate-300">
                            <span className="font-bold text-white font-mono">{formatTime(currentTimeSec)}</span> / {formatTime(briefData?.durationSeconds || 90)}
                        </div>
                    </div>

                    {/* Synchronized Script Transcript Highlight */}
                    <div className="pt-3 border-t border-white/10">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#00F0FF] mb-1.5 flex items-center gap-1.5 font-mono">
                            <FileText size={13} /> Spoken Broadcast Script:
                        </div>
                        <p className="text-sm md:text-base leading-relaxed text-slate-200 font-normal">
                            {scriptSentences.map((sentence, idx) => {
                                const isCurrent = isPlaying && idx === currentSpokenIndex;
                                return (
                                    <span
                                        key={idx}
                                        className={`transition-colors duration-200 ${
                                            isCurrent 
                                                ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-semibold px-1 rounded' 
                                                : 'text-slate-300'
                                        }`}
                                    >
                                        {sentence}{' '}
                                    </span>
                                );
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
