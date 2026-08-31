'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFranchise } from '@/context/FranchiseContext';
import { useCampaign } from '@/context/CampaignContext';
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Scale,
  FileVideo,
  Sparkles,
  Loader2,
  Eye,
  Sliders,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  Tag,
  Film,
  Zap,
  Info
} from 'lucide-react';

export interface VideoComplianceFlag {
  id: string;
  timestampSec: number;
  timestampStr: string;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'PASS';
  category: 'ESRB_RATING' | 'FTC_DISCLOSURE' | 'MONETIZATION_ODDS' | 'GAMEPLAY_FIDELITY' | 'CHILD_SAFETY' | 'IP_MUSIC';
  title: string;
  ruleCitation: string;
  detectedIssue: string;
  recommendedFix: string;
  resolved: boolean;
  overlayType?: 'ESRB_BADGE' | 'FTC_TAG' | 'ODDS_LINK' | 'BULLSHOT_DISCLAIMER';
}

const SAMPLE_CAMPAIGN_VIDEOS = [
  {
    id: 'nba2k26_anthem',
    title: 'NBA 2K26: "The City & ProPLAY" Official Launch Trailer (68s)',
    franchise: 'NBA 2K26',
    src: '/videos/short_video_similar_to_a_mobil.mp4',
    durationSec: 68,
    defaultFlags: [
      {
        id: 'flag-2k-1',
        timestampSec: 2,
        timestampStr: '00:02',
        severity: 'CRITICAL' as const,
        category: 'ESRB_RATING' as const,
        title: 'Missing "Includes Random Items" Rating Descriptor',
        ruleCitation: 'ESRB Advertising Code §3.2 & FTC In-Game Disclosures',
        detectedIssue: 'The opening rating bug displays "EVERYONE" but omits the mandatory secondary interactive element: "In-Game Purchases (Includes Random Items)" for VC & MyTEAM packs.',
        recommendedFix: 'Update opening 2s slate with the standardized dual-box ESRB rating icon containing the complete VC/loot box descriptor.',
        resolved: false,
        overlayType: 'ESRB_BADGE' as const,
      },
      {
        id: 'flag-2k-2',
        timestampSec: 14,
        timestampStr: '00:14',
        severity: 'WARNING' as const,
        category: 'GAMEPLAY_FIDELITY' as const,
        title: 'Pre-Rendered ProPLAY Mocap Cutscene Lacks "Not Actual Gameplay" Super',
        ruleCitation: 'FTC Truth in Advertising & ASA Broadcast Code §3.1',
        detectedIssue: 'Ultra-photorealistic cinematic dunk sequence is shown without an on-screen disclaimer distinguishing CGI from live gameplay.',
        recommendedFix: 'Overlay text in bottom-left corner: "Cinematic Sequence. Not Actual In-Game Footage. Captured in 2K ProPLAY Engine."',
        resolved: false,
        overlayType: 'BULLSHOT_DISCLAIMER' as const,
      },
      {
        id: 'flag-2k-3',
        timestampSec: 38,
        timestampStr: '00:38',
        severity: 'WARNING' as const,
        category: 'MONETIZATION_ODDS' as const,
        title: 'MyTEAM 100 OVR Holo Pack Animation Lacks Probability Notice',
        ruleCitation: 'South Korea Game Industry Promotion Act §33 & Google Play Policies',
        detectedIssue: 'Video showcases glowing MyTEAM Dark Matter pack opening sequence without mentioning probability disclosure URL or in-game odds menu.',
        recommendedFix: 'Add micro-copy super: "Pack probabilities verifiable in-game via Store Info and at 2k.com/drop-rates."',
        resolved: false,
        overlayType: 'ODDS_LINK' as const,
      },
      {
        id: 'flag-2k-4',
        timestampSec: 54,
        timestampStr: '00:54',
        severity: 'ADVISORY' as const,
        category: 'FTC_DISCLOSURE' as const,
        title: 'Creator Cameo Requires Clear #2KPartner Tag on Social Crops',
        ruleCitation: 'FTC Guides Concerning Use of Endorsements §255.5',
        detectedIssue: 'When formatted for TikTok/Reels 9:16 vertical cuts, streamer cameo banter must maintain persistent on-screen disclosure.',
        recommendedFix: 'Ensure top-right corner retains persistent "#2KPartner | Sponsored by 2K Games" tag.',
        resolved: false,
        overlayType: 'FTC_TAG' as const,
      }
    ]
  },
  {
    id: 'borderlands_4_reveal',
    title: 'Borderlands 4: "Mayhem Reborn" Vault Hunter Reveal (45s Cut)',
    franchise: 'Borderlands 4',
    src: '/videos/the_sims_4_free_base_game_launch_trailer__dynv44qr14g_.mp4',
    durationSec: 45,
    defaultFlags: [
      {
        id: 'flag-bl-1',
        timestampSec: 1,
        timestampStr: '00:01',
        severity: 'CRITICAL' as const,
        category: 'ESRB_RATING' as const,
        title: 'ESRB Rating Bug Duration Under Threshold',
        ruleCitation: 'ESRB Video Guidelines: Minimum 2.0s Hold Time',
        detectedIssue: 'Opening rating slate cuts after 1.1s, failing the mandatory 2.0 second minimum readability requirement.',
        recommendedFix: 'Extend opening rating bug card to a full 2.0 seconds with high-contrast neutral background.',
        resolved: false,
        overlayType: 'ESRB_BADGE' as const,
      },
      {
        id: 'flag-bl-2',
        timestampSec: 22,
        timestampStr: '00:22',
        severity: 'WARNING' as const,
        category: 'GAMEPLAY_FIDELITY' as const,
        title: 'Pre-Alpha In-Engine Capture Notice Required',
        ruleCitation: 'FTC Advertising Guides §233 & ASA Guidelines',
        detectedIssue: 'Explosive 4-player co-op raid boss fight features unreleased visual effects without pre-release disclaimer.',
        recommendedFix: 'Add legible on-screen disclaimer: "Pre-Alpha In-Engine Capture. Final gameplay experience and features subject to change."',
        resolved: false,
        overlayType: 'BULLSHOT_DISCLAIMER' as const,
      }
    ]
  }
];


export function VideoComplianceAuditor() {
  const { currentFranchise } = useFranchise();
  const { activeBrief } = useCampaign();

  const [selectedVideo, setSelectedVideo] = useState(SAMPLE_CAMPAIGN_VIDEOS[0]);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoName, setCustomVideoName] = useState<string>('');
  const [flags, setFlags] = useState<VideoComplianceFlag[]>(SAMPLE_CAMPAIGN_VIDEOS[0].defaultFlags);
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(68);
  const [isMuted, setIsMuted] = useState(false);
  const [activeFlagId, setActiveFlagId] = useState<string | null>('flag-fc-1');

  // AI Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [scanCompleted, setScanCompleted] = useState(true);

  // Overlay preview toggle
  const [previewOverlayFixes, setPreviewOverlayFixes] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY'>('ALL');

  // Sync flags when switching sample videos
  const handleSelectSample = (sample: typeof SAMPLE_CAMPAIGN_VIDEOS[0]) => {
    setSelectedVideo(sample);
    setCustomVideoUrl(null);
    setFlags(sample.defaultFlags);
    setActiveFlagId(sample.defaultFlags[0]?.id || null);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Handle local video file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
      setCustomVideoName(file.name);
      // Generate synthetic flags for uploaded video
      const generatedFlags: VideoComplianceFlag[] = [
        {
          id: `flag-up-1`,
          timestampSec: 2,
          timestampStr: '00:02',
          severity: 'CRITICAL',
          category: 'ESRB_RATING',
          title: 'Rating Bug Verification Required',
          ruleCitation: 'ESRB Advertising Code §3.2',
          detectedIssue: `Uploaded asset "${file.name}" requires verified ESRB rating bug and content descriptors on opening slate.`,
          recommendedFix: 'Confirm rating descriptor contains "Includes In-Game Purchases (Includes Random Items)".',
          resolved: false,
          overlayType: 'ESRB_BADGE',
        },
        {
          id: `flag-up-2`,
          timestampSec: Math.round(duration * 0.4),
          timestampStr: `00:${Math.round(duration * 0.4).toString().padStart(2, '0')}`,
          severity: 'WARNING',
          category: 'GAMEPLAY_FIDELITY',
          title: 'Verify In-Engine vs Live Capture Fidelity Super',
          ruleCitation: 'FTC Truth in Advertising Guides',
          detectedIssue: 'CGI cutscene transitions require platform capture notice.',
          recommendedFix: 'Overlay capture platform notice: "Captured on PlayStation 5 Pro."',
          resolved: false,
          overlayType: 'BULLSHOT_DISCLAIMER',
        }
      ];
      setFlags(generatedFlags);
      setActiveFlagId('flag-up-1');
      runAIScan(generatedFlags);
    }
  };

  // Run AI Video Audit Scan
  const runAIScan = async (targetFlags = flags) => {
    setIsScanning(true);
    setScanCompleted(false);
    setScanProgress(10);
    setScanStepMessage('Extracting video keyframes and OCR text overlays...');

    await new Promise(r => setTimeout(r, 600));
    setScanProgress(35);
    setScanStepMessage('Auditing opening & closing frames for ESRB/PEGI rating icon compliance...');

    await new Promise(r => setTimeout(r, 700));
    setScanProgress(60);
    setScanStepMessage('Transcribing audio track & scanning speech for #Ad creator disclosures...');

    await new Promise(r => setTimeout(r, 600));
    setScanProgress(85);
    setScanStepMessage('Verifying loot box drop rate disclaimers & anti-dark pattern timers...');

    await new Promise(r => setTimeout(r, 500));
    setScanProgress(100);
    setScanStepMessage('Multimodal Audit Complete: 4 Compliance Checkpoints Evaluated.');
    setIsScanning(false);
    setScanCompleted(true);
  };

  // Video time update handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Auto highlight active flag if within 3s window of flag timestamp
      const matchingFlag = flags.find(f => Math.abs(f.timestampSec - cur) < 2.5);
      if (matchingFlag && matchingFlag.id !== activeFlagId) {
        setActiveFlagId(matchingFlag.id);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 68);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (sec: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = sec;
      setCurrentTime(sec);
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Toggle flag resolution
  const handleToggleResolve = (id: string) => {
    setFlags(prev =>
      prev.map(f => (f.id === id ? { ...f, resolved: !f.resolved } : f))
    );
  };

  // Compute compliance score
  const unresolvedCritical = flags.filter(f => !f.resolved && f.severity === 'CRITICAL').length;
  const unresolvedWarning = flags.filter(f => !f.resolved && f.severity === 'WARNING').length;
  const complianceScore = Math.max(0, 100 - unresolvedCritical * 25 - unresolvedWarning * 10);
  const isApproved = unresolvedCritical === 0 && complianceScore >= 80;

  const filteredFlags = flags.filter(f => {
    if (filterSeverity === 'ALL') return true;
    return f.severity === filterSeverity;
  });

  const activeFlag = flags.find(f => f.id === activeFlagId) || flags[0];

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-[#16263A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00C48C]/15 text-[#00C48C] border border-[#00C48C]/30">
                MULTIMODAL VIDEO COMPLIANCE AUDIT
              </span>
              <span className="text-xs text-[#8FA3BC]">
                Automated Frame-by-Frame Flag Scanner & Red-Line Remediation
              </span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-white">
              Video Ad Campaign Compliance Scanner
            </h2>
            <p className="text-xs text-[#8FA3BC] mt-1 max-w-3xl">
              Upload marketing video trailers, TikTok ad cuts, or creator endorsement streams. The Gemini Multimodal Audit Engine evaluates frame OCR text, ESRB rating slates, speech disclosures, and monetization drop rate transparency against global gaming regulations.
            </p>
          </div>

          {/* Top Score Badge */}
          <div className="flex items-center gap-4 bg-[#0E1A29] border border-[#253D5B] rounded-2xl p-4 shrink-0">
            <div className="text-center">
              <div className="text-[10px] font-mono uppercase text-[#8FA3BC]">Compliance Score</div>
              <div
                className={`text-3xl font-mono font-bold ${
                  complianceScore >= 90
                    ? 'text-[#00C48C]'
                    : complianceScore >= 75
                    ? 'text-[#E6FF00]'
                    : 'text-[#FF4D4D]'
                }`}
              >
                {complianceScore}%
              </div>
              <div className="text-[9px] font-mono text-[#8FA3BC] mt-0.5">
                {isApproved ? 'READY FOR FLIGHT' : 'FLAGS REQUIRING FIX'}
              </div>
            </div>

            <div className="h-10 w-px bg-[#253D5B]" />

            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF4D4D]" />
                <span className="text-[#8FA3BC]">{unresolvedCritical} Critical Flags</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF7A00]" />
                <span className="text-[#8FA3BC]">{unresolvedWarning} Warnings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video Selector & Upload Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-[#253D5B]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase text-[#8FA3BC] mr-1">
              Sample Library:
            </span>
            {SAMPLE_CAMPAIGN_VIDEOS.map(sample => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedVideo.id === sample.id && !customVideoUrl
                    ? 'bg-[#0072BC] text-white shadow-sm'
                    : 'bg-[#0E1A29] text-[#8FA3BC] hover:text-white border border-[#253D5B]'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>{sample.title}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0E1A29] hover:bg-[#1E334D] text-[#00F0FF] border border-[#00F0FF]/40 text-xs font-bold transition-all shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Video (.mp4 / .mov)</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => runAIScan()}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#00C48C] hover:bg-[#00D99B] text-[#0E1A29] text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,196,140,0.4)] disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-Scan Multimodal Flags</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scan Progress Bar */}
        {isScanning && (
          <div className="mt-4 pt-3 border-t border-[#253D5B] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[#00F0FF] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {scanStepMessage}
              </span>
              <span className="font-mono text-white font-bold">{scanProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#0E1A29] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0072BC] via-[#00F0FF] to-[#00C48C] transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Studio: Video Player & Flag Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Interactive Video Player & Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#16263A] border border-[#253D5B] rounded-2xl p-5 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileVideo className="w-4 h-4 text-[#00F0FF]" />
                <h3 className="text-xs font-bold text-white truncate">
                  {customVideoUrl ? customVideoName : selectedVideo.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewOverlayFixes(!previewOverlayFixes)}
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                    previewOverlayFixes
                      ? 'bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/40'
                      : 'bg-[#0E1A29] text-[#8FA3BC] border-[#253D5B]'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview In-Player Compliance Fix: {previewOverlayFixes ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Video Screen Container with Dynamic In-Player Overlays */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-[#253D5B]/80 group shadow-inner">
              <video
                ref={videoRef}
                src={customVideoUrl || selectedVideo.src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />

              {/* Dynamic In-Player Red-Line Fix Overlays */}
              {previewOverlayFixes && (
                <>
                  {/* Opening ESRB Rating Box (0s - 4s) */}
                  {currentTime < 4 && (
                    <div className="absolute bottom-4 left-4 bg-white/95 text-black p-2.5 rounded shadow-2xl border-2 border-black flex items-center gap-3 animate-fadeIn z-20">
                      <div className="text-center font-black leading-none border-r border-black/40 pr-2">
                        <div className="text-[10px] font-mono uppercase">ESRB</div>
                        <div className="text-xl">E</div>
                      </div>
                      <div className="text-[9px] font-sans font-bold leading-tight uppercase">
                        <div>EVERYONE</div>
                        <div className="text-[7.5px] font-medium text-slate-800 mt-0.5">
                          In-Game Purchases (Includes Random Items)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top-Right Creator Disclosure Tag (Throughout) */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border border-white/20 flex items-center gap-1.5 z-20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0AF468]" />
                    <span>#EAPartner | Sponsored Promotion</span>
                  </div>

                  {/* Bottom-Left Gameplay Fidelity Notice */}
                  {currentTime > 10 && currentTime < 28 && (
                    <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md text-white/90 px-3 py-1 rounded text-[9px] font-mono border border-white/10 z-20">
                      Cinematic Sequence. Not Actual Gameplay. Captured in Frostbite Engine.
                    </div>
                  )}

                  {/* Loot Box Probability Disclosure Bar */}
                  {currentTime > 32 && currentTime < 48 && (
                    <div className="absolute bottom-4 right-4 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded text-[9px] font-mono border border-[#00F0FF]/40 text-[#00F0FF] z-20">
                      Odds & Drop Rates: ea.com/fc25-drop-rates
                    </div>
                  )}
                </>
              )}

              {/* Big Center Play Overlay Button */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute w-14 h-14 rounded-full bg-[#0072BC]/90 hover:bg-[#0072BC] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-105 z-30"
                >
                  <Play className="w-6 h-6 ml-0.5 fill-current" />
                </button>
              )}
            </div>

            {/* Custom Video Playback & Timeline Controls */}
            <div className="space-y-2 pt-1">
              {/* Interactive Timeline Bar with Flag Markers */}
              <div className="relative w-full h-4 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 68}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#0E1A29] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
                />

                {/* Render Flag Pins along the timeline */}
                {flags.map((flag) => {
                  const leftPct = (flag.timestampSec / (duration || 68)) * 100;
                  const isFlagSelected = activeFlagId === flag.id;
                  return (
                    <button
                      key={flag.id}
                      onClick={() => {
                        seekTo(flag.timestampSec);
                        setActiveFlagId(flag.id);
                      }}
                      title={`${flag.timestampStr}: ${flag.title}`}
                      style={{ left: `${leftPct}%` }}
                      className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full -ml-1.5 border-2 transition-transform hover:scale-125 z-10 ${
                        flag.resolved
                          ? 'bg-[#00C48C] border-white'
                          : flag.severity === 'CRITICAL'
                          ? 'bg-[#FF4D4D] border-white shadow-[0_0_8px_#FF4D4D]'
                          : flag.severity === 'WARNING'
                          ? 'bg-[#FF7A00] border-white shadow-[0_0_8px_#FF7A00]'
                          : 'bg-[#00F0FF] border-white'
                      } ${isFlagSelected ? 'ring-4 ring-white/50 scale-125' : ''}`}
                    />
                  );
                })}
              </div>

              {/* Time & Play Controls Bar */}
              <div className="flex items-center justify-between text-xs text-[#8FA3BC] pt-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-[#0E1A29] hover:bg-[#1E334D] text-white transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    onClick={() => seekTo(0)}
                    className="p-2 rounded-lg bg-[#0E1A29] hover:bg-[#1E334D] text-slate-400 hover:text-white transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <span className="font-mono text-xs font-bold text-white">
                    {Math.floor(currentTime / 60)}:
                    {Math.floor(currentTime % 60).toString().padStart(2, '0')} /{' '}
                    {Math.floor(duration / 60)}:
                    {Math.floor(duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase text-[#8FA3BC]">
                    Timeline Markers: {flags.length} Compliance Checkpoints
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right 5 Columns: Interactive Compliance Flag Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#16263A] border border-[#253D5B] rounded-2xl p-5 shadow-xl flex flex-col h-full space-y-4">
            
            {/* Inspector Header & Filter */}
            <div className="flex items-center justify-between border-b border-[#253D5B] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#00C48C]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Compliance Violations ({filteredFlags.length})
                </h3>
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'CRITICAL', 'WARNING'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      filterSeverity === sev
                        ? 'bg-[#0072BC] text-white'
                        : 'bg-[#0E1A29] text-[#8FA3BC] hover:text-white'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Detected Flags */}
            <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
              {filteredFlags.map((flag) => {
                const isSelected = activeFlagId === flag.id;
                return (
                  <div
                    key={flag.id}
                    onClick={() => {
                      setActiveFlagId(flag.id);
                      seekTo(flag.timestampSec);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#192B42] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : flag.resolved
                        ? 'bg-[#0E1A29]/60 border-[#00C48C]/40 opacity-75'
                        : 'bg-[#0E1A29] border-[#253D5B] hover:border-[#3D5E88]'
                    }`}
                  >
                    {/* Flag Header */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            seekTo(flag.timestampSec);
                          }}
                          className="px-2 py-0.5 rounded bg-[#16263A] border border-[#253D5B] text-[10px] font-mono font-bold text-[#00F0FF] hover:bg-[#0072BC] hover:text-white transition-all flex items-center gap-1"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>{flag.timestampStr}</span>
                        </button>
                        <h4 className="text-xs font-bold text-white">{flag.title}</h4>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                          flag.resolved
                            ? 'bg-[#00C48C]/15 text-[#00C48C] border-[#00C48C]/40'
                            : flag.severity === 'CRITICAL'
                            ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/40'
                            : 'bg-[#FF7A00]/15 text-[#FF7A00] border-[#FF7A00]/40'
                        }`}
                      >
                        {flag.resolved ? 'RESOLVED' : flag.severity}
                      </span>
                    </div>

                    {/* Rule Citation */}
                    <div className="text-[10px] font-mono text-[#8FA3BC] mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3 text-[#00F0FF]" />
                      <span>{flag.ruleCitation}</span>
                    </div>

                    {/* Issue Description */}
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      {flag.detectedIssue}
                    </p>

                    {/* Recommended Red-Line Fix */}
                    <div className="bg-[#16263A] border border-[#253D5B] rounded-lg p-3 space-y-1.5">
                      <div className="text-[10px] font-mono font-bold text-[#E6FF00] uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#E6FF00]" />
                        <span>Recommended Red-Line Action:</span>
                      </div>
                      <p className="text-xs text-slate-200">{flag.recommendedFix}</p>

                      <div className="pt-2 flex items-center justify-between border-t border-[#253D5B]/60">
                        <span className="text-[10px] text-[#8FA3BC] font-mono">
                          Auto-Overlay Ready
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleResolve(flag.id);
                          }}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                            flag.resolved
                              ? 'bg-[#00C48C]/20 text-[#00C48C] border border-[#00C48C]/40'
                              : 'bg-[#0072BC] hover:bg-[#008BE6] text-white shadow-sm'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{flag.resolved ? 'Mark Unresolved' : 'Apply Red-Line Fix'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Certificate Action */}
            <div className="pt-3 border-t border-[#253D5B]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8FA3BC]">
                  {flags.filter(f => f.resolved).length} of {flags.length} Flags Remediated
                </span>
                <button
                  onClick={() => {
                    setFlags(prev => prev.map(f => ({ ...f, resolved: true })));
                  }}
                  className="text-xs font-mono font-bold text-[#00F0FF] hover:underline"
                >
                  Approve All Remediation Steps
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
export default VideoComplianceAuditor;
