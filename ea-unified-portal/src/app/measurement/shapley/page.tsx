'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFranchise } from '@/context';
import { REAL_CREATIVE_CATALOG, CreativeCatalogItem, StorybeatItem } from '@/lib/creative_catalog';
import {
  TAG_QUADRANT_ANALYSIS,
  TagQuadrantItem,
  FranchiseQuadrantData,
  QuadrantType,
} from '@/lib/tag_quadrant_data';
import { CoreFindingBanner } from '@/components/measurement/CoreFindingBanner';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  BarChart3,
  Video as VideoIcon,
  Send,
  Zap,
  Volume2,
  VolumeX,
  Film,
  Award,
  TrendingUp,
  Sliders,
  Filter,
  Grid,
  Check,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  HelpCircle,
  Clock,
  Compass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';


export default function ShapleyPage() {
  const { currentFranchise, setCurrentFranchise } = useFranchise();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isInputCollapsed, setIsInputCollapsed] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0.0);
  const [duration, setDuration] = useState<number>(15.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [dispatchedCreative, setDispatchedCreative] = useState<boolean>(false);
  const [dispatchedMsg, setDispatchedMsg] = useState<string | null>(null);

  // Quadrant Filtering State
  const [gameFilter, setGameFilter] = useState<string>(currentFranchise || 'All');
  const [dimensionFilter, setDimensionFilter] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<TagQuadrantItem | null>(null);

  // Sync game filter if global currentFranchise changes
  useEffect(() => {
    if (currentFranchise && TAG_QUADRANT_ANALYSIS[currentFranchise]) {
      setGameFilter(currentFranchise);
    }
  }, [currentFranchise]);

  // Filter real catalog for the selected franchise
  const franchiseCreatives: CreativeCatalogItem[] = useMemo(() => {
    const matched = REAL_CREATIVE_CATALOG.filter(
      (c) => c.franchise.toLowerCase() === currentFranchise.toLowerCase()
    );
    return matched.length > 0 ? matched : REAL_CREATIVE_CATALOG.slice(0, 1);
  }, [currentFranchise]);

  const [selectedProjectNumber, setSelectedProjectNumber] = useState<string>(
    franchiseCreatives[0]?.project_number || 'EA-FC-001'
  );

  // Keep selected creative in sync when franchise changes
  useEffect(() => {
    if (franchiseCreatives.length > 0) {
      const exists = franchiseCreatives.some((c) => c.project_number === selectedProjectNumber);
      if (!exists) {
        setSelectedProjectNumber(franchiseCreatives[0].project_number);
        setCurrentTime(0.0);
        setIsPlaying(false);
      }
    }
  }, [franchiseCreatives, selectedProjectNumber]);

  // Active creative item
  const activeCreative: CreativeCatalogItem = useMemo(() => {
    return (
      franchiseCreatives.find((c) => c.project_number === selectedProjectNumber) ||
      franchiseCreatives[0] ||
      REAL_CREATIVE_CATALOG[0]
    );
  }, [franchiseCreatives, selectedProjectNumber]);

  const storybeats: StorybeatItem[] = activeCreative.story_beats || [];

  // Update video duration once loaded
  useEffect(() => {
    if (activeCreative) {
      setDuration(activeCreative.duration_sec || 30.0);
      setCurrentTime(0.0);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.playbackRate = playbackSpeed;
      }
    }
  }, [activeCreative, playbackSpeed]);

  // Video element event listeners
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(Number(videoRef.current.currentTime.toFixed(2)));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(Number(videoRef.current.duration.toFixed(2)));
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };

  // Find active storybeat based on current time
  const activeBeat: StorybeatItem = useMemo(() => {
    if (storybeats.length === 0) {
      return {
        id: 'default-b1',
        timeframe: '0:00 - 0:05',
        startSec: 0,
        endSec: 5,
        title: 'Opening Scene',
        category: 'TOP_OF_FUNNEL',
        tier: 'TOFU',
        ctrLift: 25.0,
        ctiLift: 2.0,
        roas: 2.2,
        description: activeCreative.summary || 'Video Scene',
        visual_hook: 'Cinematic_Hook',
        visual_mood: 'Dynamic',
        action_intensity: 'High',
        humor_style: 'None',
        cta_presence: 'None',
        emergent_concept_tag: activeCreative.theme,
        tags: ['Gameplay', 'Hook'],
      };
    }
    const found = storybeats.find(
      (b) => currentTime >= b.startSec && (currentTime < b.endSec || (currentTime >= duration && b.endSec >= duration - 0.5))
    );
    return found || storybeats[storybeats.length - 1];
  }, [currentTime, storybeats, duration, activeCreative]);

  const maxCtiBeat = useMemo(() => {
    if (!storybeats.length) return null;
    return [...storybeats].sort((a, b) => b.ctiLift - a.ctiLift)[0];
  }, [storybeats]);

  const maxCtrBeat = useMemo(() => {
    if (!storybeats.length) return null;
    return [...storybeats].sort((a, b) => b.ctrLift - a.ctrLift)[0];
  }, [storybeats]);

  // Waterfall Chart Data
  const tradeOffChartData = useMemo(() => {
    return storybeats.map((b) => ({
      name: b.title.length > 22 ? b.title.substring(0, 20) + '...' : b.title,
      fullName: b.title,
      ctrLift: b.ctrLift,
      ctiLift: b.ctiLift,
      roas: b.roas,
      tier: b.tier,
      category: b.category,
      mood: b.visual_mood,
      intensity: b.action_intensity,
      hook: b.visual_hook,
    }));
  }, [storybeats]);

  // Active Franchise Quadrant Dataset
  const activeQuadrantData: FranchiseQuadrantData = useMemo(() => {
    return TAG_QUADRANT_ANALYSIS[gameFilter] || TAG_QUADRANT_ANALYSIS['All'] || TAG_QUADRANT_ANALYSIS['EA Sports FC'];
  }, [gameFilter]);

  // Filter tags by Dimension
  const filteredTags: TagQuadrantItem[] = useMemo(() => {
    if (!activeQuadrantData?.tags) return [];
    if (dimensionFilter === 'All') return activeQuadrantData.tags;
    return activeQuadrantData.tags.filter((t) => t.dimension === dimensionFilter);
  }, [activeQuadrantData, dimensionFilter]);

  // Top performance tag for banner
  const topTag: TagQuadrantItem | undefined = useMemo(() => {
    return activeQuadrantData?.tags?.[0];
  }, [activeQuadrantData]);

  // Auto-select first tag if none selected
  useEffect(() => {
    if (filteredTags.length > 0 && !selectedTag) {
      setSelectedTag(filteredTags[0]);
    }
  }, [filteredTags, selectedTag]);

  const handleDispatchDirectives = () => {
    setDispatchedCreative(true);
    setDispatchedMsg(
      `Creative Tag Optimization Manifest for [${activeQuadrantData.franchise}] dispatched to Curtis_CreativeStudioAgent. Manifest ID: shapley-tags-${Date.now()}`
    );
    setTimeout(() => {
      setDispatchedCreative(false);
      setDispatchedMsg(null);
    }, 6000);
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-[#16263A] rounded-md w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-96 bg-[#16263A]/60 rounded-lg" />
          <div className="lg:col-span-5 h-96 bg-[#16263A]/60 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Core Executive Finding Banner (Replacing FBI score with Tag Optimization Intelligence) */}
      <CoreFindingBanner
        badge="GEMINI MULTIMODAL SHAPLEY INTELLIGENCE"
        finding={`${activeCreative.title}: ${
          maxCtiBeat ? `${maxCtiBeat.title} drives +${maxCtiBeat.ctiLift}% in-game conversion` : 'High Monetization Potential'
        }; ${maxCtrBeat ? `Early hooks capture +${maxCtrBeat.ctrLift}% stopping power CTR` : 'Strong Stopping Power'}`}
        purpose="This module dissects video ad creatives scene-by-scene with Gemini multimodal vision, capturing evolving tags (mood, intensity, humor, visual hook, CTA) and mapping 4-quadrant feature frequency vs performance."
        metrics={[
          {
            label: 'Top Value Driver',
            value: topTag ? `${topTag.tag} (+${topTag.performance}% Lift)` : '+32.1% Lift',
            isPositive: true,
          },
          {
            label: 'Top Monetization Scene',
            value: maxCtiBeat ? `+${maxCtiBeat.ctiLift}% CTI (${maxCtiBeat.timeframe})` : '+18.5% CTI',
            isPositive: true,
          },
          {
            label: 'Top Stopping Power',
            value: maxCtrBeat ? `+${maxCtrBeat.ctrLift}% CTR (${maxCtrBeat.timeframe})` : '+38.0% CTR',
            isPositive: true,
          },
          {
            label: 'Audited Features',
            value: `${activeQuadrantData.tags.length} Tags across ${activeQuadrantData.total_videos} Videos`,
            isPositive: true,
          },
        ]}
        inputToggle={{
          isCollapsed: isInputCollapsed,
          onToggle: () => setIsInputCollapsed(!isInputCollapsed),
          inputLabel: 'Video Scrubber',
        }}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Player, Scrubber, Storybeats & Waterfall Chart (7 Cols) */}
        {!isInputCollapsed && (
          <div className="lg:col-span-7 space-y-5">
            {/* Video Player & Storybeat Timeline Breakdown Card */}
            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
              {/* Card Header & Creative Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#253D5B] pb-3">
                <div className="flex items-center space-x-2">
                  <VideoIcon className="w-4 h-4 text-[#0072BC]" />
                  <div>
                    <h2 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                      Multimodal Creative Video Breakdown
                    </h2>
                    <span className="text-[11px] text-[#8FA3BC]">
                      {activeCreative.mechanic} • {activeCreative.format}
                    </span>
                  </div>
                </div>

                {/* Video Selector Pills for multi-video franchises */}
                {franchiseCreatives.length > 1 ? (
                  <div className="flex items-center space-x-1.5 bg-[#0E1A29] p-1 rounded-md border border-[#253D5B] overflow-x-auto max-w-full">
                    {franchiseCreatives.map((c, idx) => {
                      const isSel = c.project_number === selectedProjectNumber;
                      return (
                        <button
                          key={c.project_number}
                          onClick={() => {
                            setSelectedProjectNumber(c.project_number);
                            setCurrentTime(0);
                            setIsPlaying(false);
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#0072BC] text-white font-bold shadow-[0_0_8px_rgba(0,114,188,0.4)]'
                              : 'text-[#8FA3BC] hover:text-white hover:bg-[#16263A]'
                          }`}
                        >
                          Cut {idx + 1}: {c.theme.replace(/_/g, ' ').substring(0, 16)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-xs font-mono text-[#00C48C] bg-[#0E1A29] px-2.5 py-1 rounded-md border border-[#253D5B] shrink-0">
                    Asset: {activeCreative.project_number}
                  </span>
                )}
              </div>

              {/* Interactive Video Player Canvas */}
              <div className="relative w-full aspect-[16/9] bg-[#070E18] rounded-md border border-[#253D5B] overflow-hidden flex flex-col justify-between shadow-2xl group">
                {/* Embedded HTML5 Video */}
                <video
                  ref={videoRef}
                  src={`/api/videos/${activeCreative.franchise_key}/${encodeURIComponent(activeCreative.local_filename)}`}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleVideoEnded}
                  muted={isMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />

                {/* Floating Top Telemetry Overlay */}
                <div className="flex items-center justify-between z-10 p-3 pointer-events-none">
                  <div className="flex items-center space-x-2 bg-[#0E1A29]/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#253D5B] text-xs font-mono">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPlaying ? 'bg-[#00C48C] animate-pulse' : 'bg-[#FF4560]'
                      }`}
                    />
                    <span className="text-white font-bold tabular-nums">
                      {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border backdrop-blur-md ${
                        activeBeat.category === 'TOP_OF_FUNNEL'
                          ? 'bg-[#0072BC]/40 text-[#008BE6] border-[#0072BC]'
                          : activeBeat.category === 'BOTTOM_OF_FUNNEL'
                          ? 'bg-[#FFB800]/40 text-[#FFB800] border-[#FFB800]'
                          : 'bg-[#8A2BE2]/40 text-[#8A2BE2] border-[#8A2BE2]'
                      }`}
                    >
                      {activeBeat.category.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-[#0E1A29]/90 text-[#00C48C] border border-[#253D5B] backdrop-blur-md">
                      {activeBeat.visual_mood} • {activeBeat.action_intensity}
                    </div>
                    {activeBeat.humor_style && activeBeat.humor_style !== 'None' && (
                      <div className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 backdrop-blur-md">
                        {activeBeat.humor_style}
                      </div>
                    )}
                  </div>
                </div>


                {/* Bottom In-Video Econometric Telemetry Ribbon */}
                <div className="z-10 bg-[#0E1A29]/90 backdrop-blur-md px-3.5 py-2 border-t border-[#253D5B] text-xs font-mono flex items-center justify-between pointer-events-none">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#8FA3BC]">Scene:</span>
                      <span className="text-white font-semibold truncate max-w-[140px] sm:max-w-[180px]">
                        {activeBeat.title}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center space-x-1.5">
                      <span className="text-[#8FA3BC]">Hook:</span>
                      <span className="text-[#008BE6] truncate max-w-[120px]">{activeBeat.visual_hook}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-[#8FA3BC]">Marginal CTR:</span>
                      <span
                        className={`font-bold tabular-nums ${
                          activeBeat.ctrLift >= 0 ? 'text-[#00C48C]' : 'text-[#FF4560]'
                        }`}
                      >
                        {activeBeat.ctrLift >= 0 ? `+${activeBeat.ctrLift}%` : `${activeBeat.ctrLift}%`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[#8FA3BC]">Marginal CTI:</span>
                      <span
                        className={`font-bold tabular-nums ${
                          activeBeat.ctiLift >= 0 ? 'text-[#FFB800]' : 'text-[#FF4560]'
                        }`}
                      >
                        {activeBeat.ctiLift >= 0 ? `+${activeBeat.ctiLift}%` : `${activeBeat.ctiLift}%`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[#8FA3BC]">ROAS:</span>
                      <span className="text-white font-bold tabular-nums">{activeBeat.roas.toFixed(2)}x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playback Controls & Progress Scrubber */}
              <div className="space-y-3 bg-[#0E1A29] p-3.5 rounded-md border border-[#253D5B]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={togglePlayPause}
                      className="p-2 rounded-md bg-[#0072BC] hover:bg-[#008BE6] text-white transition-all shadow-[0_0_12px_rgba(0,114,188,0.35)] cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleReset}
                      className="p-2 rounded-md bg-[#16263A] hover:bg-[#1E334D] text-[#8FA3BC] hover:text-white transition-all cursor-pointer border border-[#253D5B]"
                      title="Reset to 0s"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-md bg-[#16263A] hover:bg-[#1E334D] text-[#8FA3BC] hover:text-white transition-all cursor-pointer border border-[#253D5B]"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-white font-mono text-xs font-semibold ml-2 tabular-nums">
                      {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                    </span>
                  </div>

                  {/* Playback Speed Toggles */}
                  <div className="flex items-center space-x-1">
                    {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                          playbackSpeed === spd
                            ? 'bg-[#0072BC] text-white font-bold shadow-sm'
                            : 'bg-[#16263A] text-[#8FA3BC] hover:text-white border border-[#253D5B]'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider Scrubber */}
                <input
                  type="range"
                  min={0}
                  max={duration || 15.0}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#16263A] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
                />

                {/* Storybeat Markers / Jump Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {storybeats.map((beat) => {
                    const isActive = activeBeat.id === beat.id;
                    return (
                      <button
                        key={beat.id}
                        onClick={() => handleSeek(beat.startSec)}
                        className={`text-left p-2 rounded-md border transition-all text-[11px] cursor-pointer ${
                          isActive
                            ? 'bg-[#0072BC]/20 border-[#0072BC] text-white shadow-[0_0_10px_rgba(0,114,188,0.25)] ring-1 ring-[#0072BC]'
                            : 'bg-[#0E1A29] border-[#253D5B] text-[#8FA3BC] hover:border-[#0072BC]/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-[#00C48C] font-semibold tabular-nums">
                            {beat.timeframe}
                          </span>
                          <span className="text-[9px] text-[#8FA3BC] uppercase font-mono">
                            {beat.visual_mood}
                          </span>
                        </div>
                        <div className="font-bold truncate mt-0.5">{beat.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-[#5C728C] mt-1 tabular-nums font-mono">
                          <span className={beat.ctrLift >= 0 ? 'text-[#008BE6]' : 'text-[#FF4560]'}>
                            {beat.ctrLift >= 0 ? `+${beat.ctrLift}%` : `${beat.ctrLift}%`} CTR
                          </span>
                          <span className={beat.ctiLift >= 0 ? 'text-[#FFB800]' : 'text-[#FF4560]'}>
                            {beat.ctiLift >= 0 ? `+${beat.ctiLift}%` : `${beat.ctiLift}%`} CTI
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scene Performance Waterfall Chart */}
            <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-[#0072BC]" />
                    <span>Scene Performance: Hook Attention vs. In-Game Revenue</span>
                  </h3>
                  <p className="text-xs text-[#8FA3BC] mt-0.5">
                    Econometric marginal decomposition for &quot;{activeCreative.title}&quot;
                  </p>
                </div>
                <span className="text-xs font-mono text-[#00C48C] bg-[#0E1A29] px-2.5 py-1 rounded-md border border-[#253D5B]">
                  Gemini Verified
                </span>
              </div>

              {/* Recharts Waterfall Chart */}
              <div className="w-full h-64 min-w-0 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={tradeOffChartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E334D" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#8FA3BC"
                      fontSize={10}
                      interval={0}
                      angle={-10}
                      textAnchor="end"
                    />
                    <YAxis stroke="#8FA3BC" fontSize={11} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#000000',
                        borderColor: '#0072BC',
                        color: '#fff',
                        borderRadius: '6px',
                        fontSize: '11px',
                      }}
                      formatter={(val: any, name: any) => [
                        `${Number(val) >= 0 ? '+' : ''}${val}%`,
                        name === 'ctrLift'
                          ? 'Marginal CTR Lift (Stopping Power)'
                          : 'Marginal CTI Lift (Monetization)',
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <ReferenceLine y={0} stroke="#253D5B" />
                    <Bar
                      dataKey="ctrLift"
                      name="Marginal CTR Lift (Stopping Power)"
                      fill="#0072BC"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="ctiLift"
                      name="Marginal CTI Lift (Monetization)"
                      fill="#00C48C"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: 4-Quadrant Tag Performance & Prescriptive Guidance (5 or 12 Cols) */}
        <div className={isInputCollapsed ? 'lg:col-span-12 space-y-5' : 'lg:col-span-5 space-y-5'}>
          {/* 4-Quadrant Feature Frequency vs Tag Performance Card */}
          <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] space-y-4">
            {/* Header & Game Filter Controls */}
            <div className="space-y-3 border-b border-[#253D5B] pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Grid className="w-4 h-4 text-[#00C48C]" />
                  <div>
                    <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                      Creative Tag Performance Matrix
                    </h3>
                    <span className="text-[11px] text-[#8FA3BC]">
                      4-Quadrant Shapley Attribution & Prescriptive Guidance
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30">
                  {filteredTags.length} Active Tags
                </span>
              </div>

              {/* Game Franchise Switcher Tabs */}
              <div className="flex items-center space-x-1.5 bg-[#0E1A29] p-1 rounded-md border border-[#253D5B] overflow-x-auto">
                {['All', 'EA Sports FC', 'Battlefield', 'Apex Legends', 'The Sims'].map((fr) => {
                  const isSel = gameFilter.toLowerCase() === fr.toLowerCase();
                  return (
                    <button
                      key={fr}
                      onClick={() => setGameFilter(fr)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#0072BC] text-white font-bold shadow-[0_0_8px_rgba(0,114,188,0.4)]'
                          : 'text-[#8FA3BC] hover:text-white hover:bg-[#16263A]'
                      }`}
                    >
                      {fr === 'All' ? 'All Franchises' : fr}
                    </button>
                  );
                })}
              </div>

              {/* Tag Dimension Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px] font-mono">
                {[
                  'All',
                  'Hooks & Openers',
                  'Mood & Tone',
                  'Humor & Talent',
                  'CTAs & Value Props',
                  'Gameplay & Mechanics',
                ].map((dim) => {
                  const isSel = dimensionFilter === dim;
                  return (
                    <button
                      key={dim}
                      onClick={() => setDimensionFilter(dim)}
                      className={`px-2 py-0.5 rounded transition-all whitespace-nowrap cursor-pointer ${
                        isSel
                          ? 'bg-[#1E334D] text-[#00C48C] font-bold border border-[#00C48C]/40'
                          : 'text-[#8FA3BC] hover:text-white bg-[#0E1A29]/60'
                      }`}
                    >
                      {dim}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4-Quadrant Visual Scatter Plot */}
            <div className="relative w-full h-80 bg-[#070E18] rounded-md border border-[#253D5B] overflow-hidden p-2">
              {/* Background 4-Quadrant Watermark Zones */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none p-2 gap-1 z-0">
                {/* Upper Left: OPPORTUNITY */}
                <div className="bg-[#008BE6]/5 border border-[#008BE6]/15 rounded p-2 flex flex-col justify-start items-start">
                  <span className="text-[10px] font-mono font-bold text-[#008BE6]/80 flex items-center space-x-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>OPPORTUNITY (SCALE UP)</span>
                  </span>
                  <span className="text-[9px] text-[#5C728C] font-mono">Low Freq / High ROAS</span>
                </div>

                {/* Upper Right: KEEP IT UP */}
                <div className="bg-[#00C48C]/5 border border-[#00C48C]/15 rounded p-2 flex flex-col justify-start items-end text-right">
                  <span className="text-[10px] font-mono font-bold text-[#00C48C]/90 flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-[#00C48C]" />
                    <span>KEEP IT UP!</span>
                  </span>
                  <span className="text-[9px] text-[#5C728C] font-mono">High Freq / High ROAS</span>
                </div>

                {/* Lower Left: AVOID */}
                <div className="bg-[#8FA3BC]/5 border border-[#8FA3BC]/15 rounded p-2 flex flex-col justify-end items-start">
                  <span className="text-[10px] font-mono font-bold text-[#8FA3BC]/70">
                    AVOID / MONITOR
                  </span>
                  <span className="text-[9px] text-[#5C728C] font-mono">Low Freq / Low Return</span>
                </div>

                {/* Lower Right: STOP DOING THIS */}
                <div className="bg-[#FF4560]/5 border border-[#FF4560]/15 rounded p-2 flex flex-col justify-end items-end text-right">
                  <span className="text-[10px] font-mono font-bold text-[#FF4560]/90 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-[#FF4560]" />
                    <span>STOP DOING THIS</span>
                  </span>
                  <span className="text-[9px] text-[#5C728C] font-mono">High Freq / Low ROI (Fatigue)</span>
                </div>
              </div>

              {/* Recharts Scatter Plot */}
              <div className="relative z-10 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#16263A" />
                    <XAxis
                      type="number"
                      dataKey="frequency"
                      name="Feature Frequency"
                      unit="%"
                      domain={[0, 100]}
                      stroke="#8FA3BC"
                      fontSize={10}
                      tickCount={6}
                    />
                    <YAxis
                      type="number"
                      dataKey="performance"
                      name="Marginal Lift"
                      unit="%"
                      domain={[-5, 45]}
                      stroke="#8FA3BC"
                      fontSize={10}
                    />
                    <ZAxis dataKey="roas" range={[60, 240]} name="ROAS" />
                    <ReferenceLine
                      x={activeQuadrantData.freq_threshold}
                      stroke="#253D5B"
                      strokeDasharray="4 4"
                    />
                    <ReferenceLine
                      y={activeQuadrantData.perf_threshold}
                      stroke="#253D5B"
                      strokeDasharray="4 4"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3', stroke: '#0072BC' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as TagQuadrantItem;
                          return (
                            <div className="bg-[#0E1A29] border border-[#0072BC] rounded p-2.5 text-xs font-mono shadow-2xl space-y-1.5 max-w-[260px]">
                              <div className="flex items-center justify-between border-b border-[#253D5B] pb-1">
                                <span className="font-bold text-white text-sm">{data.tag}</span>
                                <span
                                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                  style={{ backgroundColor: `${data.color}25`, color: data.color }}
                                >
                                  {data.quadrant_badge}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#8FA3BC]">
                                Dimension: <span className="text-white">{data.dimension}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                                <div>
                                  <span className="text-[#8FA3BC] block">Frequency:</span>
                                  <span className="text-white font-bold">{data.frequency}%</span>
                                </div>
                                <div>
                                  <span className="text-[#8FA3BC] block">Perf Lift:</span>
                                  <span className="text-[#00C48C] font-bold">+{data.performance}%</span>
                                </div>
                                <div>
                                  <span className="text-[#8FA3BC] block">CTI Lift:</span>
                                  <span className="text-[#FFB800]">+{data.ctiLift}%</span>
                                </div>
                                <div>
                                  <span className="text-[#8FA3BC] block">ROAS:</span>
                                  <span className="text-[#008BE6]">{data.roas.toFixed(2)}x</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-[#8FA3BC] italic pt-1 border-t border-[#253D5B]">
                                {data.guidance}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      data={filteredTags}
                      onClick={(node) => setSelectedTag(node as any)}
                      className="cursor-pointer"
                    >
                      {filteredTags.map((entry, index) => {
                        const isSel = selectedTag?.tag === entry.tag;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={isSel ? '#ffffff' : entry.color}
                            strokeWidth={isSel ? 3 : 1}
                            className="transition-all hover:opacity-100 opacity-85"
                          />
                        );
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Selected Tag Deep Dive Inspector */}
            {selectedTag && (
              <div className="bg-[#0E1A29] p-3 rounded-md border border-[#253D5B] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedTag.color }}
                    />
                    <span className="text-xs font-bold text-white font-heading uppercase tracking-wide">
                      {selectedTag.tag}
                    </span>
                    <span className="text-[10px] text-[#8FA3BC] font-mono">
                      ({selectedTag.dimension})
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: `${selectedTag.color}20`,
                      color: selectedTag.color,
                      borderColor: `${selectedTag.color}40`,
                    }}
                  >
                    {selectedTag.quadrant_label}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono bg-[#16263A]/60 p-2 rounded border border-[#253D5B]">
                  <div>
                    <span className="text-[10px] text-[#8FA3BC] block">Frequency</span>
                    <span className="font-bold text-white tabular-nums">{selectedTag.frequency}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8FA3BC] block">Marginal Lift</span>
                    <span className="font-bold text-[#00C48C] tabular-nums">+{selectedTag.performance}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8FA3BC] block">CTI Lift</span>
                    <span className="font-bold text-[#FFB800] tabular-nums">+{selectedTag.ctiLift}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8FA3BC] block">ROAS Multiplier</span>
                    <span className="font-bold text-[#008BE6] tabular-nums">{selectedTag.roas.toFixed(2)}x</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-[#00C48C] font-bold uppercase tracking-wider text-[10px] block">
                    Prescriptive Directive:
                  </span>
                  <p className="text-[#8FA3BC] leading-relaxed">{selectedTag.guidance}</p>
                </div>

                {selectedTag.sample_beats && selectedTag.sample_beats.length > 0 && (
                  <div className="text-[11px] font-mono text-[#5C728C] pt-1 border-t border-[#253D5B]/60">
                    <span className="text-[#8FA3BC] block text-[10px] mb-1">Audited In:</span>
                    {selectedTag.sample_beats.slice(0, 2).map((sb, sbIdx) => (
                      <div key={sbIdx} className="truncate text-[#8FA3BC]">
                        • <span className="text-white">{sb.title}</span> ({sb.timeframe})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Prescriptive 4-Quadrant Guidance Summary Cards */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono text-[#8FA3BC] uppercase tracking-wider block">
                Prescriptive Portfolio Guidance ({activeQuadrantData.franchise}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Keep It Up */}
                <div className="p-2.5 bg-[#0E1A29] rounded border border-[#00C48C]/30 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#00C48C] font-bold text-[11px]">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span>KEEP IT UP! (Core Drivers)</span>
                  </div>
                  <p className="text-[11px] text-[#8FA3BC] leading-snug">
                    {activeQuadrantData.prescriptive_summary.keep_it_up.action}
                  </p>
                </div>

                {/* Scale Up Opportunity */}
                <div className="p-2.5 bg-[#0E1A29] rounded border border-[#008BE6]/30 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#008BE6] font-bold text-[11px]">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span>SCALE UP (Opportunity)</span>
                  </div>
                  <p className="text-[11px] text-[#8FA3BC] leading-snug">
                    {activeQuadrantData.prescriptive_summary.opportunity.action}
                  </p>
                </div>

                {/* Stop Doing This */}
                <div className="p-2.5 bg-[#0E1A29] rounded border border-[#FF4560]/30 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#FF4560] font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>STOP DOING THIS (Fatigue)</span>
                  </div>
                  <p className="text-[11px] text-[#8FA3BC] leading-snug">
                    {activeQuadrantData.prescriptive_summary.stop_doing_this.action}
                  </p>
                </div>

                {/* Avoid */}
                <div className="p-2.5 bg-[#0E1A29] rounded border border-[#8FA3BC]/30 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#8FA3BC] font-bold text-[11px]">
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>AVOID / DEPRECATE</span>
                  </div>
                  <p className="text-[11px] text-[#8FA3BC] leading-snug">
                    {activeQuadrantData.prescriptive_summary.avoid.action}
                  </p>
                </div>
              </div>
            </div>

            {/* Export & Dispatch CTA */}
            <div className="pt-2">
              <button
                onClick={handleDispatchDirectives}
                disabled={dispatchedCreative}
                className="w-full py-3 bg-[#0072BC] hover:bg-[#008BE6] text-white font-semibold text-xs rounded-md shadow-[0_0_12px_rgba(0,114,188,0.4)] flex items-center justify-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Export Tag Directives to Curtis_CreativeStudioAgent</span>
              </button>

              {dispatchedMsg && (
                <div className="mt-3 p-3 bg-[#0E1A29] border border-[#00C48C]/50 rounded-md text-xs font-mono text-[#00C48C] flex items-center space-x-2 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-[#00C48C] shrink-0" />
                  <span>{dispatchedMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
