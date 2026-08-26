'use client';

import React, { useState, useEffect } from 'react';
import { useFranchise } from '@/lib/FranchiseContext';
import { EASurface } from '@/types';
import { MOCK_CREATIVE_ASSETS } from '@/lib/mock_data';
import { EA_SURFACES } from '@/lib/constants';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Code,
  CheckCircle2,
  Layers,
  Sparkles,
  Tv,
  Smartphone,
  Gamepad2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Crosshair,
} from 'lucide-react';
import { CoreFindingBanner } from '@/components/CoreFindingBanner';

export default function MultimodalPage() {
  const { currentFranchise } = useFranchise();
  const [isInputCollapsed, setIsInputCollapsed] = useState<boolean>(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(MOCK_CREATIVE_ASSETS[0].asset_id);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(4);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [jsonDrawerOpen, setJsonDrawerOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Find active asset
  const activeAsset =
    MOCK_CREATIVE_ASSETS.find((a) => a.asset_id === selectedAssetId) ||
    MOCK_CREATIVE_ASSETS.find((a) => a.franchise === currentFranchise) ||
    MOCK_CREATIVE_ASSETS[0];

  // Auto playback timer simulation
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= activeAsset.duration_sec) {
            return 0;
          }
          return Number((prev + 0.25 * playbackSpeed).toFixed(2));
        });
      }, 250);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeAsset.duration_sec, playbackSpeed]);

  // Active mechanic tags at current timestamp
  const activeMechanics = activeAsset.detected_mechanics.filter(
    (m) => currentTime >= m.timestamp_start_sec && currentTime <= m.timestamp_end_sec
  );

  const getFunnelBadge = (stage: string) => {
    switch (stage) {
      case 'ToFu_Exploration':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30">
            ToFu • Exploration
          </span>
        );
      case 'MoFu_Progression':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0072BC]/15 text-[#008BE6] border border-[#0072BC]/30">
            MoFu • Progression
          </span>
        );
      case 'BoFu_Conversion':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#8A2BE2]/15 text-[#8A2BE2] border border-[#8A2BE2]/30">
            BoFu • Conversion
          </span>
        );
      default:
        return null;
    }
  };

  const getSurfaceIcon = (surfaceId: EASurface) => {
    switch (surfaceId) {
      case 'EA_APP_LAUNCHER':
        return <Gamepad2 className="w-4 h-4 text-[#0072BC]" />;
      case 'IN_GAME_STORE':
        return <Sparkles className="w-4 h-4 text-[#FFB800]" />;
      case 'STADIUM_BOARDS':
        return <Tv className="w-4 h-4 text-[#00C48C]" />;
      case 'MOBILE_COMPANION':
        return <Smartphone className="w-4 h-4 text-[#8A2BE2]" />;
      default:
        return <Layers className="w-4 h-4 text-[#8FA3BC]" />;
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(activeAsset.pydantic_schema_json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Core Executive Finding Banner */}
      <CoreFindingBanner
        badge="KEY EXECUTIVE FINDING"
        finding="Instant Multi-Surface Compatibility Verified: 14 Gameplay Hooks Extracted Across 6 EA Gaming Platforms in <120ms"
        purpose="This module ingests raw video creative assets, scans frame-by-frame using multimodal AI vision, and automatically validates aspect ratio formatting, safe zones, and player conversion tags."
        metrics={[
          {
            label: 'Asset Status',
            value: 'Validated & Tagged',
            isPositive: true,
          },
          {
            label: 'Surfaces Cleared',
            value: '6 EA Platforms',
            isPositive: true,
          },
          {
            label: 'Active Feature Tags',
            value: `${activeAsset.detected_mechanics.length} Elements`,
            isPositive: true,
          },
          {
            label: 'Scan Latency',
            value: '118ms (Real-Time)',
            isPositive: true,
          },
        ]}
        inputToggle={{
          isCollapsed: isInputCollapsed,
          onToggle: () => setIsInputCollapsed(!isInputCollapsed),
          inputLabel: 'Video Viewport',
        }}
      />

      {/* Asset Selector Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-3.5 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[#0072BC]/15 text-[#38BDF8] border border-[#0072BC]/30 font-bold">
            Asset Selection
          </span>
          <span className="text-xs text-white font-medium">{activeAsset.title}</span>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-xs text-[#8FA3BC] font-medium">Select Video Asset:</label>
          <select
            value={activeAsset.asset_id}
            onChange={(e) => {
              setSelectedAssetId(e.target.value);
              setCurrentTime(2);
            }}
            className="bg-[#0E1A29] border border-[#253D5B] text-white text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-[#0072BC] cursor-pointer"
          >
            {MOCK_CREATIVE_ASSETS.map((asset) => (
              <option key={asset.asset_id} value={asset.asset_id}>
                {asset.franchise}: {asset.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Video Player + Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Synchronized Video Viewport (7 Cols) */}
        {!isInputCollapsed && (
          <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)] relative overflow-hidden">
            {/* Viewport Frame */}
            <div className="relative aspect-video bg-[#0A131F] rounded-md overflow-hidden border border-[#253D5B] flex items-center justify-center group">
              {/* Background Thumbnail Simulation */}
              <img
                src={activeAsset.thumbnail_url}
                alt={activeAsset.title}
                className="w-full h-full object-cover opacity-60 filter brightness-90"
              />

              {/* Dynamic Bounding Box Overlays */}
              {activeMechanics.map((mech) => {
                const box = mech.bounding_box || { x: 20, y: 20, width: 60, height: 60 };
                const isToFu = mech.funnel_stage === 'ToFu_Exploration';
                const isBoFu = mech.funnel_stage === 'BoFu_Conversion';
                const borderColor = isToFu ? '#00C48C' : isBoFu ? '#8A2BE2' : '#0072BC';
                const bgColor = isToFu ? 'rgba(0, 196, 140, 0.12)' : isBoFu ? 'rgba(138, 43, 226, 0.12)' : 'rgba(0, 114, 188, 0.12)';

                return (
                  <div
                    key={mech.mechanic_id}
                    className="absolute rounded-md border-2 transition-all duration-300 pointer-events-none shadow-lg animate-pulse"
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      borderColor: borderColor,
                      backgroundColor: bgColor,
                    }}
                  >
                    <div
                      className="absolute -top-7 left-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white whitespace-nowrap shadow-md flex items-center space-x-1"
                      style={{ backgroundColor: borderColor }}
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>{mech.mechanic_name}</span>
                      <span>({Math.round(mech.confidence_score * 100)}%)</span>
                    </div>
                  </div>
                );
              })}

              {/* Video Watermark & Surface Fit Indicator */}
              <div className="absolute top-3 left-3 bg-[#0E1A29]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#253D5B] text-[11px] font-mono text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#00C48C] animate-ping" />
                <span>1080p60 • {activeAsset.franchise}</span>
              </div>

              <div className="absolute top-3 right-3 bg-[#0E1A29]/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#253D5B] text-[11px] font-mono text-[#00C48C]">
                FPS Decimated: {Math.floor(currentTime)} / {activeAsset.duration_sec}s
              </div>

              {/* Central Play/Pause Overlay */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute w-14 h-14 rounded-full bg-[#0072BC]/90 hover:bg-[#008BE6] text-white flex items-center justify-center shadow-xl transition-transform hover:scale-110 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </button>
            </div>

            {/* Playback Controls & Scrubber */}
            <div className="mt-4 space-y-3">
              {/* Timeline Scrubber */}
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={activeAsset.duration_sec}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[#0E1A29] rounded-lg appearance-none cursor-pointer accent-[#0072BC]"
                />
                {/* Mechanic Segment Markers */}
                <div className="flex justify-between text-[10px] font-mono text-[#5C728C] mt-1">
                  <span>0:00</span>
                  <span className="text-[#00C48C] font-bold tabular-nums">{currentTime.toFixed(1)}s</span>
                  <span>0:{activeAsset.duration_sec}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-[#0E1A29] hover:bg-[#1E334D] text-white rounded-md text-xs font-semibold flex items-center space-x-1.5 border border-[#253D5B] cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => setCurrentTime(0)}
                    className="p-2 bg-[#0E1A29] hover:bg-[#1E334D] text-[#8FA3BC] hover:text-white rounded-md text-xs border border-[#253D5B] cursor-pointer"
                    title="Restart"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-[#0E1A29] hover:bg-[#1E334D] text-[#8FA3BC] hover:text-white rounded-md text-xs border border-[#253D5B] cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Speed Selector */}
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="bg-[#0E1A29] text-xs text-[#8FA3BC] px-2 py-1.5 rounded-md border border-[#253D5B] focus:outline-none cursor-pointer"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1.0x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2.0x</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-[#8FA3BC] font-mono">
                    Detected: <span className="text-white font-bold">{activeMechanics.length}</span> active tag(s)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Mechanics Deep Dive Banner */}
          <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 space-y-2 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
            <div className="text-xs font-heading font-bold uppercase tracking-wider text-[#8FA3BC] flex items-center justify-between">
              <span>Synchronized Storybeat Analysis</span>
              <span className="text-[#00C48C] font-mono text-[11px] tabular-nums">Timestamp: {currentTime.toFixed(1)}s</span>
            </div>

            {activeMechanics.length === 0 ? (
              <p className="text-xs text-[#5C728C] py-3 text-center italic">
                Transition period. Scrub to active mechanics or press Play.
              </p>
            ) : (
              <div className="space-y-2">
                {activeMechanics.map((mech) => (
                  <div
                    key={mech.mechanic_id}
                    className="bg-[#0E1A29] border border-[#253D5B] rounded-md p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-heading font-bold text-white">{mech.mechanic_name}</span>
                        {getFunnelBadge(mech.funnel_stage)}
                      </div>
                      <span className="text-xs font-mono text-[#00C48C] font-semibold tabular-nums">
                        {Math.round(mech.confidence_score * 100)}% Conf
                      </span>
                    </div>
                    <p className="text-xs text-[#8FA3BC] leading-relaxed">{mech.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 text-[#8FA3BC]">
                      <div>
                        <span className="font-semibold text-white">Visual Hook: </span>
                        {mech.visual_hook || 'High-fidelity cinematic framing'}
                      </div>
                      <div>
                        <span className="font-semibold text-white">Audio Cue: </span>
                        {mech.audio_cue || 'Spatial stereo mix with dynamic bass'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right Column: 6 Surfaces Compatibility Grid & Pydantic Schema */}
        <div className={isInputCollapsed ? 'lg:col-span-12 space-y-4' : 'lg:col-span-5 space-y-4'}>
          {/* 6 Surfaces Grid */}
          <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tv className="w-4 h-4 text-[#0072BC]" />
                <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                  6 Surface Compatibility Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0E1A29] text-[#8FA3BC] border border-[#253D5B]">
                Pydantic Evaluated
              </span>
            </div>

            <div className="space-y-3">
              {activeAsset.target_surfaces.map((surf) => {
                const surfaceMeta = EA_SURFACES.find((s) => s.id === surf.surface);
                const score = surf.compatibility_score;
                const scoreColor =
                  score >= 85 ? 'text-[#00C48C]' : score >= 70 ? 'text-[#008BE6]' : 'text-[#FFB800]';
                const barBg =
                  score >= 85 ? 'bg-[#00C48C]' : score >= 70 ? 'bg-[#0072BC]' : 'bg-[#FFB800]';

                return (
                  <div
                    key={surf.surface}
                    className="bg-[#0E1A29] border border-[#253D5B] rounded-md p-3 space-y-2 hover:border-[#0072BC]/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getSurfaceIcon(surf.surface)}
                        <span className="text-xs font-heading font-bold text-white">
                          {surfaceMeta?.label || surf.surface}
                        </span>
                      </div>
                      <span className={`text-xs font-mono font-bold tabular-nums ${scoreColor}`}>
                        {score}% Fit
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-[#16263A] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barBg}`} style={{ width: `${score}%` }} />
                    </div>

                    <p className="text-[11px] text-[#8FA3BC] leading-snug">{surf.recommendation}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collapsible Pydantic JSON Drawer */}
          <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-lg p-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setJsonDrawerOpen(!jsonDrawerOpen)}
                className="flex items-center space-x-2 text-xs font-heading font-bold uppercase tracking-wider text-[#8FA3BC] hover:text-white cursor-pointer"
              >
                <Code className="w-4 h-4 text-[#00C48C]" />
                <span>Pydantic Schema JSON (`CreativeMetadataSchema`)</span>
                {jsonDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <button
                onClick={handleCopyJson}
                className="p-1.5 bg-[#0E1A29] hover:bg-[#1E334D] text-[#8FA3BC] hover:text-white rounded text-[11px] flex items-center space-x-1 border border-[#253D5B] cursor-pointer"
                title="Copy JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00C48C]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {jsonDrawerOpen && (
              <div className="mt-3">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-[#00C48C] bg-[#00C48C]/10 px-2 py-1 rounded-md border border-[#00C48C]/30 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validation Passed: Zero Pydantic Schema Invariants Violated</span>
                </div>
                <pre className="bg-[#0A131F] p-3 rounded-md border border-[#253D5B] font-mono text-[11px] text-[#8FA3BC] overflow-x-auto max-h-64 leading-tight select-text">
                  {JSON.stringify(activeAsset.pydantic_schema_json, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
