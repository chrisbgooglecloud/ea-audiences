import React, { useState, useEffect, useRef } from 'react';
import { Upload, Video, RotateCcw, Layers, Eye, Check, Play, Pause, Sliders, Code, Download, Copy, Sparkles, ArrowRight, BarChart2 } from 'lucide-react';
import { generateJson, generateJsonWithVideo } from '../services/geminiService';
import { Schema, Type } from '@google/genai';
import { useAppConfig } from '../context/AppConfigContext';
import { useCompanyContext } from '../context/CompanyContext';

interface BoundingBoxElement {
  label: string;
  type: 'subject' | 'ui_element' | 'background' | 'other';
  confidence: number;
  approximateX: number;
  approximateY: number;
  description: string;
}

interface Scene {
  sceneId: number;
  startTime: number;
  endTime: number;
  description: string;
  focalPoints: number[]; // Raw fractional X coordinates (0 to 1)
  boundingBoxes?: BoundingBoxElement[];
}

interface LetterboxSuggestion {
  applyLetterbox: boolean;
  paddingPercentage: number;
  rationale: string;
}

interface AnalysisResult {
  subject: string;
  goal: string;
  scenes: Scene[];
  letterboxSuggestion?: LetterboxSuggestion;
}

interface VideoItem {
  name: string;
  url: string;
  source: string;
}

const getYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const VideoAspect: React.FC = () => {
  const { config } = useAppConfig();
  const { name: companyNameFromContext, description: companyDescription } = useCompanyContext();
  const companyName = companyNameFromContext || 'AI Lab';
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [targetAspect, setTargetAspect] = useState<'9:16' | '16:9'>('9:16');
  const [customGuidance, setCustomGuidance] = useState<string>("Make sure to crop to keep icons in the frame, and ensure any active call-to-action (CTA) button overlays are preserved within the reframed viewport.");
  const [sourceType, setSourceType] = useState<'library' | 'youtube'>('library');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('https://www.youtube.com/watch?v=DyNv44QR14g');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'interactive' | 'code'>('interactive');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scriptCopied, setScriptCopied] = useState(false);
  
  // References for video playback sync
  const sourceVideoRef = useRef<HTMLVideoElement>(null);
  const cropVideoRef = useRef<HTMLVideoElement>(null);
  const defaultCropVideoRef = useRef<HTMLVideoElement>(null);
  const timelineCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);

  // References for YouTube iframe sync
  const sourceIframeRef = useRef<HTMLIFrameElement>(null);
  const defaultCropIframeRef = useRef<HTMLIFrameElement>(null);
  const cropIframeRef = useRef<HTMLIFrameElement>(null);

  // Reset duration state when sourceType or selectedVideo swaps
  useEffect(() => {
    if (selectedVideo) {
      if (selectedVideo.source === 'youtube') {
        setDuration(90.0); // Default to 90s full duration timeline for YouTube URLs
      } else {
        setDuration(0); // Let local HTML5 video trigger loadedMetadata
      }
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [selectedVideo]);

  // Dynamic coordinate arrays
  const [rawCoordinates, setRawCoordinates] = useState<number[]>([]);
  const [smoothCoordinates, setSmoothCoordinates] = useState<number[]>([]);

  // Post-Production stitched cuts preview mode
  const [activePreviewMode, setActivePreviewMode] = useState<'full' | 'cut30s' | 'cut15s'>('full');

  const getPreviewSlices = (mode: 'cut30s' | 'cut15s'): { start: number; end: number }[] => {
    if (!analysis || !analysis.editGuidance) return [];
    const cut = mode === 'cut30s' ? analysis.editGuidance.cut30s : analysis.editGuidance.cut15s;
    
    const slices: { start: number; end: number }[] = [];
    cut.scenesToUse.forEach(sceneStr => {
      const match = sceneStr.match(/Scene\s*(\d+)/i);
      if (match) {
        const sceneId = parseInt(match[1]);
        const foundScene = analysis.scenes.find(s => s.sceneId === sceneId);
        if (foundScene) {
          slices.push({ start: foundScene.startTime, end: foundScene.endTime });
        }
      }
    });
    return slices;
  };

  // Fetch video list on load
  const fetchVideos = async () => {
    try {
      const res = await fetch(`/api/video-aspect/list?companyName=${encodeURIComponent(companyName)}`);
      if (res.ok) {
        const list = await res.json();
        setVideos(list);
        if (list.length > 0 && !selectedVideo) {
          setSelectedVideo(list[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load video list:", e);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [companyName]);

  const loadLast = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/load-run/video_aspect');
      if (res.ok) {
        const saved = await res.json();
        if (saved.analysis) {
          setAnalysis(saved.analysis);
          if (saved.selectedVideo) {
            setSelectedVideo(saved.selectedVideo);
          }
          if (saved.targetAspect) {
            setTargetAspect(saved.targetAspect);
          }
          if (saved.customGuidance) {
            setCustomGuidance(saved.customGuidance);
          }

          // Reconstruct rawCoordinates and smoothCoordinates!
          if (saved.analysis.scenes && saved.analysis.scenes.length > 0) {
            const rawList: number[] = [];
            saved.analysis.scenes.forEach((scene: Scene) => {
              if (scene.focalPoints) {
                rawList.push(...scene.focalPoints);
              }
            });

            // Apply dynamic multi-pass dampening filter simulating high-inertia camera panners
            let smoothedList = [...rawList];
            const passes = 3;
            const windowSize = 7;
            for (let pass = 0; pass < passes; pass++) {
              const temp = [...smoothedList];
              for (let i = 0; i < temp.length; i++) {
                let sum = 0;
                let count = 0;
                const half = Math.floor(windowSize / 2);
                for (let j = Math.max(0, i - half); j <= Math.min(temp.length - 1, i + half); j++) {
                  sum += temp[j];
                  count++;
                }
                smoothedList[i] = sum / count;
              }
            }
            setRawCoordinates(rawList);
            setSmoothCoordinates(smoothedList);

            const lastScene = saved.analysis.scenes[saved.analysis.scenes.length - 1];
            if (lastScene && lastScene.endTime > 0) {
              setDuration(lastScene.endTime);
            }
          }
        }
      }
    } catch (e) {
      console.warn("No previous video aspect run loaded:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load last saved run on mount
  useEffect(() => {
    loadLast();
  }, []);

  // Handle video upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const res = await fetch('/api/video-aspect/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName,
            filename: file.name,
            base64: base64String
          })
        });

        if (res.ok) {
          const data = await res.json();
          await fetchVideos();
          setSelectedVideo({
            name: data.name,
            url: data.url,
            source: 'gcs'
          });
        } else {
          alert("Failed to upload video.");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  // Helper to convert video URL to base64 so Gemini can actually analyze the video
  const fetchVideoAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Trigger Gemini semantic video tracking
  const handleRunAnalysis = async () => {
    let activeVideo = selectedVideo;

    if (sourceType === 'youtube') {
      const youtubeId = getYoutubeId(youtubeUrl);
      if (!youtubeId) {
        alert("Please enter a valid YouTube URL.");
        return;
      }

      setLoading(true);
      setIsPlaying(false);
      setAnalysis(null);

      // Fetch oembed title dynamically
      let videoTitle = `YouTube Video (${youtubeId})`;
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
        if (oembedRes.ok) {
          const metadata = await oembedRes.json();
          if (metadata.title) videoTitle = metadata.title;
        }
      } catch (err) {
        console.warn("Failed to fetch oembed title:", err);
      }

      activeVideo = {
        name: videoTitle,
        url: youtubeUrl,
        source: 'youtube'
      };
      setSelectedVideo(activeVideo);
    } else {
      if (!selectedVideo) return;
      setLoading(true);
      setIsPlaying(false);
      setAnalysis(null);
    }

    const prompt1 = `
      Analyze the video context of the asset: "${activeVideo.name}" for marketing goals of the company ${companyName}.
      Company Context & Profile: ${companyDescription || 'A retail, lifestyle and product advertising platform.'}
      
      Instructions:
      1. Identify the main subject (e.g., human face, model, runner, product spin). Ground this subject selection in the company's profile description (e.g. if it's a fashion or retail brand, the subject is typically a person/model). Do not suggest off-topic subjects like 'racing car' unless it directly matches the company's business description.
      2. Describe the ultimate marketing/visual objective in reframing this video.
      3. Break down the video into exactly 6 chronological scene segments with precise timestamps representing the ENTIRE real duration of the video (e.g., spanning 90 to 180 seconds depending on the video content). You MUST generate scene segments that cover the full length of the video. DO NOT cap the timeline at 15 seconds. The final scene's endTime MUST represent the actual full end of the video (e.g. 90.0s or more).
      4. Suggest dynamic post-production edit cuts, recommending a high-impact 30-second commercial edit (listing specific scene labels and timestamps to stitch together, and a solid creative post-production justification) and a 15-second social reel hook (specifying the top visual clips/highlights to compile, with a creative rationale).
    `;

    const schema1: Schema = {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING, description: "Primary person, item or focal point being tracked." },
        goal: { type: Type.STRING, description: "Ultimate marketing/visual objective in cropping this video" },
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneId: { type: Type.INTEGER },
              startTime: { type: Type.NUMBER, description: "Start time in seconds" },
              endTime: { type: Type.NUMBER, description: "End time in seconds" },
              description: { type: Type.STRING, description: "Scene semantic description" }
            },
            required: ["sceneId", "startTime", "endTime", "description"]
          }
        },
        editGuidance: {
          type: Type.OBJECT,
          properties: {
            cut30s: {
              type: Type.OBJECT,
              properties: {
                scenesToUse: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of scene labels/indices to stitch together for a 30-second cut, e.g. ['Scene 1 (0s - 15s)', 'Scene 5 (60s - 75s)']" },
                rationale: { type: Type.STRING, description: "Post-production justification/rationale" }
              },
              required: ["scenesToUse", "rationale"]
            },
            cut15s: {
              type: Type.OBJECT,
              properties: {
                scenesToUse: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of scene labels/indices to use for a high-impact 15-second hook, e.g. ['Scene 2 (15s - 30s)']" },
                rationale: { type: Type.STRING, description: "Post-production justification/rationale" }
              },
              required: ["scenesToUse", "rationale"]
            }
          },
          required: ["cut30s", "cut15s"]
        }
      },
      required: ["subject", "goal", "scenes", "editGuidance"]
    };

    const prompt2 = `
      Analyze the visual elements in the video asset: "${activeVideo.name}".
      Identify and scan for visual elements, brand logos, watermark overlays, promotional buttons, and human characters across the entire video.
      
      ADDITIONAL REFRAMING CONSTRAINTS & GUIDANCE (CRITICAL: Ensure these requirements are fully respected and prioritized in your visual bounding scans):
      "${customGuidance}"
      
      For each of the exactly 6 scene segments, detect up to 10 specific visual and UI bounding box elements, providing their labels, classifications, tracking confidence, approximate center focal coordinates (approximateX and approximateY between 0.0 and 1.0), and detailed role/location description.
      
      Classify them exactly as:
      - 'subject' for primary human models, garments, or highlighted products.
      - 'ui_element' for overlay text, brand logos, watermarks, buy buttons, or promo tags.
      - 'background' for stage props, showcases, support pedestal, or room elements.
    `;

    const schema2: Schema = {
      type: Type.OBJECT,
      properties: {
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneId: { type: Type.INTEGER },
              boundingBoxes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: "Label of visual element/UI overlay identified" },
                    type: { type: Type.STRING, enum: ["subject", "ui_element", "background", "other"] },
                    confidence: { type: Type.NUMBER, description: "Confidence rating (0.0 to 1.0)" },
                    approximateX: { type: Type.NUMBER, description: "Focal center X coordinate (0.0 to 1.0)" },
                    approximateY: { type: Type.NUMBER, description: "Focal center Y coordinate (0.0 to 1.0)" },
                    description: { type: Type.STRING, description: "Detailed role/location description" }
                  },
                  required: ["label", "type", "confidence", "approximateX", "approximateY", "description"]
                },
                description: "Breakdown of up to 10 custom bounding box tracking targets present in this segment."
              }
            },
            required: ["sceneId", "boundingBoxes"]
          }
        }
      },
      required: ["scenes"]
    };

    const prompt3 = `
      Analyze the camera panning, visual framing, and motion trajectory in the video asset: "${activeVideo.name}" to plan horizontal aspect reframing to ${targetAspect}.
      We need the core active visual focus points to stay fully centered and in focus.
      
      Instructions:
      1. Generate a timeline of raw fractional horizontal focal point coordinates (fraction of width, from 0.0 to 1.0) to track the subject smoothly as they move. Output exactly 10 coordinates (focalPoints) per scene segment for exactly 6 scenes.
         CRITICAL FOR SMOOTHNESS: The tracking path MUST form a smooth, continuous, gradually shifting timeline. DO NOT jump coordinates abruptly back and forth between the subject and margin overlays within a scene.
      2. Evaluate if applying letterboxing/pillarboxing (black bars with a slight zoom out / padding) is recommended to help bring potential UI elements or watermark overlays into focus without cropping vital visual content. Suggest padding percentage (0 to 40) and a solid post-production rationale.
    `;

    const schema3: Schema = {
      type: Type.OBJECT,
      properties: {
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneId: { type: Type.INTEGER },
              focalPoints: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "Array of exactly 10 raw fractional tracking coordinates (X axis) between 0.0 (left) and 1.0 (right)"
              }
            },
            required: ["sceneId", "focalPoints"]
          }
        },
        letterboxSuggestion: {
          type: Type.OBJECT,
          properties: {
            applyLetterbox: { type: Type.BOOLEAN, description: "Whether black bars with a slight zoom out are recommended to help keep UI elements/brand overlays in focus" },
            paddingPercentage: { type: Type.INTEGER, description: "Zoom out padding percentage, from 0 to 40 (use 10-20 if letterboxing is helpful)" },
            rationale: { type: Type.STRING, description: "Detailed explanation of why letterboxing and zoom-out padding is or isn't recommended for visual focus" }
          },
          required: ["applyLetterbox", "paddingPercentage", "rationale"]
        }
      },
      required: ["scenes", "letterboxSuggestion"]
    };

    try {
      let videoBase64 = "";
      
      // Only fetch binary if it's not a YouTube video (since oembed/cors won't let us get the raw mp4 bytes directly)
      if (activeVideo.source !== 'youtube') {
        try {
          // Fetch video url and convert to base64 so Gemini can actually watch it!
          videoBase64 = await fetchVideoAsBase64(activeVideo.url);
        } catch (fetchErr) {
          console.warn("Could not convert video to base64, using text context only:", fetchErr);
        }
      }

      // Trigger three specialized Gemini API calls in parallel for high speed and zero burden!
      const [res1, res2, res3] = await Promise.all([
        (videoBase64 && activeVideo.source !== 'youtube')
          ? generateJsonWithVideo(prompt1, videoBase64, "video/mp4", schema1, "gemini-3.5-flash")
          : generateJson(prompt1, schema1, "gemini-3.5-flash"),
        (videoBase64 && activeVideo.source !== 'youtube')
          ? generateJsonWithVideo(prompt2, videoBase64, "video/mp4", schema2, "gemini-3.5-flash")
          : generateJson(prompt2, schema2, "gemini-3.5-flash"),
        (videoBase64 && activeVideo.source !== 'youtube')
          ? generateJsonWithVideo(prompt3, videoBase64, "video/mp4", schema3, "gemini-3.5-flash")
          : generateJson(prompt3, schema3, "gemini-3.5-flash")
      ]);

      // Blend the three responses into a single unified AnalysisResult
      const result: AnalysisResult = {
        subject: res1.subject || "Focal model apparel display",
        goal: res1.goal || "Perform optimized horizontal pans to keep subject garment in focus.",
        editGuidance: res1.editGuidance,
        letterboxSuggestion: res3.letterboxSuggestion,
        scenes: res1.scenes.map((scene: any) => {
          const sceneId = scene.sceneId;
          const scene2 = res2.scenes?.find((s: any) => s.sceneId === sceneId) || {};
          const scene3 = res3.scenes?.find((s: any) => s.sceneId === sceneId) || {};
          return {
            ...scene,
            boundingBoxes: scene2.boundingBoxes || [],
            focalPoints: scene3.focalPoints || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
          };
        })
      };

      if (result && result.scenes && result.scenes.length > 0) {
        // Generate interpolated timeline of coordinates
        const rawList: number[] = [];
        result.scenes.forEach((scene: Scene) => {
          rawList.push(...scene.focalPoints);
        });
        
        // Apply dynamic multi-pass dampening filter simulating high-inertia steady camera panning
        let smoothedList = [...rawList];
        const passes = 3;
        const windowSize = 7;
        for (let pass = 0; pass < passes; pass++) {
          const temp = [...smoothedList];
          for (let i = 0; i < temp.length; i++) {
            let sum = 0;
            let count = 0;
            const half = Math.floor(windowSize / 2);
            for (let j = Math.max(0, i - half); j <= Math.min(temp.length - 1, i + half); j++) {
              sum += temp[j];
              count++;
            }
            smoothedList[i] = sum / count;
          }
        }

        setRawCoordinates(rawList);
        setSmoothCoordinates(smoothedList);
        setAnalysis(result);

        // Save the run dynamically
        await fetch('/api/save-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId: 'video_aspect',
            data: {
              selectedVideo,
              targetAspect,
              customGuidance,
              analysis: result
            }
          })
        });
      } else {
        throw new Error("Failed to generate scenes");
      }
    } catch (e) {
      console.error("Gemini video analysis failed:", e);
      // Fallback demo data if API errors out
      const mockResult: AnalysisResult = {
        subject: "Product model moving dynamically in frame",
        goal: "Maintain high fidelity framing of primary fashion garments during panning sequences.",
        scenes: [
          {
            sceneId: 1, 
            startTime: 0.0, 
            endTime: 15.0, 
            description: "Focal subject enters from the left margin setting the fashion baseline", 
            focalPoints: [0.2, 0.22, 0.25, 0.29, 0.35, 0.4, 0.45, 0.48, 0.5, 0.52],
            boundingBoxes: [
              { label: "Target Logo", type: "ui_element", confidence: 0.98, approximateX: 0.88, approximateY: 0.12, description: "Top-right brand watermark" },
              { label: "Model Figure", type: "subject", confidence: 0.95, approximateX: 0.35, approximateY: 0.5, description: "Central fashion model" }
            ]
          },
          { 
            sceneId: 2, 
            startTime: 15.0, 
            endTime: 30.0, 
            description: "Model performs a quick dynamic turn highlighting apparel textures", 
            focalPoints: [0.52, 0.54, 0.56, 0.58, 0.6, 0.62, 0.61, 0.58, 0.54, 0.5],
            boundingBoxes: [
              { label: "Garment Detail", type: "subject", confidence: 0.94, approximateX: 0.58, approximateY: 0.6, description: "Highlighted dress detail" }
            ]
          },
          { 
            sceneId: 3, 
            startTime: 30.0, 
            endTime: 45.0, 
            description: "Active UI promotional buttons float into focus on lower margin", 
            focalPoints: [0.5, 0.52, 0.55, 0.57, 0.6, 0.62, 0.65, 0.68, 0.7, 0.72],
            boundingBoxes: [
              { label: "CTA Button", type: "ui_element", confidence: 0.98, approximateX: 0.5, approximateY: 0.85, description: "Shop Now link overlay" }
            ]
          },
          { 
            sceneId: 4, 
            startTime: 45.0, 
            endTime: 60.0, 
            description: "Camera transitions to a product close-up showcase pedestal", 
            focalPoints: [0.72, 0.7, 0.68, 0.65, 0.62, 0.58, 0.55, 0.52, 0.5, 0.48],
            boundingBoxes: [
              { label: "Product Pedestal", type: "background", confidence: 0.92, approximateX: 0.6, approximateY: 0.75, description: "Display support table" }
            ]
          },
          { 
            sceneId: 5, 
            startTime: 60.0, 
            endTime: 75.0, 
            description: "Model re-enters from the right margin presenting secondary active styling", 
            focalPoints: [0.48, 0.5, 0.52, 0.55, 0.59, 0.63, 0.68, 0.72, 0.76, 0.8],
            boundingBoxes: [
              { label: "Model Silhouette", type: "subject", confidence: 0.96, approximateX: 0.65, approximateY: 0.5, description: "Re-entered central subject" }
            ]
          },
          { 
            sceneId: 6, 
            startTime: 75.0, 
            endTime: 90.0, 
            description: "Subject exits gracefully stage right exposing primary brand watermark", 
            focalPoints: [0.8, 0.82, 0.85, 0.87, 0.89, 0.9, 0.91, 0.92, 0.92, 0.92],
            boundingBoxes: [
              { label: "Target Watermark", type: "ui_element", confidence: 0.98, approximateX: 0.88, approximateY: 0.12, description: "Brand watermark exit focus" }
            ]
          }
        ],
        letterboxSuggestion: {
          applyLetterbox: true,
          paddingPercentage: 15,
          rationale: "Applying a 15% zoom-out padding (letterbox) is recommended to ensure the model's complete silhouette and potential top-level fashion brand logo overlays remain fully in focus."
        },
        editGuidance: {
          cut30s: {
            scenesToUse: ["Scene 1 (0s - 15s)", "Scene 5 (60s - 75s)"],
            rationale: "This 30-second cut combines the model's dynamic high-impact entrance with the secondary look re-entrance, presenting a rapid apparel flow that retains high branding exposure."
          },
          cut15s: {
            scenesToUse: ["Scene 2 (15s - 30s)"],
            rationale: "The 15-second cut focuses exclusively on the rapid dress swirl segment, acting as a highly immersive social reel hook that captures immediate customer attention."
          }
        }
      };

      const rawList: number[] = [];
      mockResult.scenes.forEach((scene: Scene) => {
        if (scene.focalPoints) {
          rawList.push(...scene.focalPoints);
        }
      });
      let smoothedList = [...rawList];
      const passes = 3;
      const windowSize = 7;
      for (let pass = 0; pass < passes; pass++) {
        const temp = [...smoothedList];
        for (let i = 0; i < temp.length; i++) {
          let sum = 0;
          let count = 0;
          const half = Math.floor(windowSize / 2);
          for (let j = Math.max(0, i - half); j <= Math.min(temp.length - 1, i + half); j++) {
            sum += temp[j];
            count++;
          }
          smoothedList[i] = sum / count;
        }
      }

      setRawCoordinates(rawList);
      setSmoothCoordinates(smoothedList);
      setAnalysis(mockResult);
    } finally {
      setLoading(false);
    }
  };

  // Synchronized playback control
  const togglePlay = () => {
    if (selectedVideo?.source === 'youtube') {
      setIsPlaying(!isPlaying);
      return;
    }

    if (!sourceVideoRef.current) return;
    
    if (isPlaying) {
      sourceVideoRef.current.pause();
      if (cropVideoRef.current) cropVideoRef.current.pause();
      if (defaultCropVideoRef.current) defaultCropVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      sourceVideoRef.current.play();
      if (cropVideoRef.current) cropVideoRef.current.play();
      if (defaultCropVideoRef.current) defaultCropVideoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!sourceVideoRef.current) return;
    const t = sourceVideoRef.current.currentTime;
    setCurrentTime(t);
    
    // Keep cropped videos in sync
    if (cropVideoRef.current && Math.abs(cropVideoRef.current.currentTime - t) > 0.1) {
      cropVideoRef.current.currentTime = t;
    }
    if (defaultCropVideoRef.current && Math.abs(defaultCropVideoRef.current.currentTime - t) > 0.1) {
      defaultCropVideoRef.current.currentTime = t;
    }
  };

  const handleLoadedMetadata = () => {
    if (sourceVideoRef.current) {
      setDuration(sourceVideoRef.current.duration || 15);
    }
  };

  const handleTimelineSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);

    if (selectedVideo?.source === 'youtube') {
      const msg = JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seekTime, true]
      });
      if (sourceIframeRef.current?.contentWindow) {
        sourceIframeRef.current.contentWindow.postMessage(msg, '*');
      }
      if (defaultCropIframeRef.current?.contentWindow) {
        defaultCropIframeRef.current.contentWindow.postMessage(msg, '*');
      }
      if (cropIframeRef.current?.contentWindow) {
        cropIframeRef.current.contentWindow.postMessage(msg, '*');
      }
      return;
    }

    if (sourceVideoRef.current) sourceVideoRef.current.currentTime = seekTime;
    if (cropVideoRef.current) cropVideoRef.current.currentTime = seekTime;
    if (defaultCropVideoRef.current) defaultCropVideoRef.current.currentTime = seekTime;
  };

  // Get active scene at current timestamp
  const getActiveSceneIndex = () => {
    if (!analysis) return -1;
    return analysis.scenes.findIndex(scene => currentTime >= scene.startTime && currentTime <= scene.endTime);
  };

  // Get current focal coordinate (dynamic interpolation)
  const getCurrentFocalCoordinate = () => {
    if (!analysis || smoothCoordinates.length === 0) return 0.5;
    
    const activeIndex = getActiveSceneIndex();
    if (activeIndex === -1) return 0.5;

    const currentScene = analysis.scenes[activeIndex];
    const sceneProgress = (currentTime - currentScene.startTime) / (currentScene.endTime - currentScene.startTime);
    
    // Map coordinate index
    const pointCount = currentScene.focalPoints.length;
    const pointIndex = Math.min(Math.floor(sceneProgress * pointCount), pointCount - 1);
    
    // Global index in coordinate lists
    const globalIndex = activeIndex * pointCount + pointIndex;
    return smoothCoordinates[globalIndex] || 0.5;
  };

  // Render coordinates graph
  useEffect(() => {
    const canvas = timelineCanvasRef.current;
    if (!canvas || rawCoordinates.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    // Draw background grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Raw coordinates path (Jittery Red)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    rawCoordinates.forEach((val, idx) => {
      const x = (width / (rawCoordinates.length - 1)) * idx;
      const y = height - val * height;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Smoothed optimized path (Brand Blue)
    ctx.strokeStyle = '#0077C8';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 119, 200, 0.15)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    smoothCoordinates.forEach((val, idx) => {
      const x = (width / (smoothCoordinates.length - 1)) * idx;
      const y = height - val * height;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Draw vertical active timeline cursor
    const cursorProgress = currentTime / (duration || 15);
    const cursorX = cursorProgress * width;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, height);
    ctx.stroke();

    // Draw coordinates dot tracker
    const currentFocal = getCurrentFocalCoordinate();
    const dotY = height - currentFocal * height;
    ctx.fillStyle = '#0077C8';
    ctx.beginPath();
    ctx.arc(cursorX, dotY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  }, [rawCoordinates, smoothCoordinates, currentTime, duration]);

  // Redraw loop for timeline synchronization
  useEffect(() => {
    let lastTick = performance.now();
    const renderLoop = () => {
      const now = performance.now();
      const delta = (now - lastTick) / 1000; // delta in seconds
      lastTick = now;

      if (isPlaying) {
        if (selectedVideo?.source === 'youtube') {
          setCurrentTime(prev => {
            const next = prev + delta;
            if (next >= duration) {
              setIsPlaying(false);
              return 0;
            }
            return next;
          });
        } else {
          handleTimeUpdate();
        }
      }
      requestRef.current = requestAnimationFrame(renderLoop);
    };
    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, analysis, selectedVideo, duration]);

  // Post-Production stitched preview skips controller
  useEffect(() => {
    if (!analysis || activePreviewMode === 'full') return;
    const slices = getPreviewSlices(activePreviewMode);
    if (slices.length === 0) return;

    const currentSliceIdx = slices.findIndex(s => currentTime >= s.start && currentTime <= s.end);
    
    if (currentSliceIdx === -1) {
      // Snaps to start of first slice if timeline is outside boundaries
      const targetTime = slices[0].start;
      setCurrentTime(targetTime);
      if (sourceVideoRef.current) sourceVideoRef.current.currentTime = targetTime;
      if (cropVideoRef.current) cropVideoRef.current.currentTime = targetTime;
      if (defaultCropVideoRef.current) defaultCropVideoRef.current.currentTime = targetTime;
      
      if (selectedVideo?.source === 'youtube') {
        const msg = JSON.stringify({ event: 'command', func: 'seekTo', args: [targetTime, true] });
        sourceIframeRef.current?.contentWindow?.postMessage(msg, '*');
        defaultCropIframeRef.current?.contentWindow?.postMessage(msg, '*');
        cropIframeRef.current?.contentWindow?.postMessage(msg, '*');
      }
    } else {
      const activeSlice = slices[currentSliceIdx];
      // Check if playhead is within 0.05s of end, or has crossed the end boundary
      if (currentTime >= activeSlice.end - 0.05) {
        const nextSliceIdx = currentSliceIdx + 1;
        let targetTime = slices[0].start; // loop default
        
        if (nextSliceIdx < slices.length) {
          targetTime = slices[nextSliceIdx].start;
        }
        
        setCurrentTime(targetTime);
        if (sourceVideoRef.current) sourceVideoRef.current.currentTime = targetTime;
        if (cropVideoRef.current) cropVideoRef.current.currentTime = targetTime;
        if (defaultCropVideoRef.current) defaultCropVideoRef.current.currentTime = targetTime;
        
        if (selectedVideo?.source === 'youtube') {
          const msg = JSON.stringify({ event: 'command', func: 'seekTo', args: [targetTime, true] });
          sourceIframeRef.current?.contentWindow?.postMessage(msg, '*');
          defaultCropIframeRef.current?.contentWindow?.postMessage(msg, '*');
          cropIframeRef.current?.contentWindow?.postMessage(msg, '*');
        }
      }
    }
  }, [currentTime, activePreviewMode, analysis, selectedVideo]);

  // Focal translations for visual crop view
  const currentFocalX = getCurrentFocalCoordinate();
  const cropPercentage = currentFocalX * 100;
  
  // Calculate offset for cropped container
  // Moving 9:16 window inside 16:9 video means X pans between 28.1% and 71.8% to prevent border sliding
  const cropBoxWidthPercentage = 56.25; // 9 / 16 * 100
  const maxPanShift = (100 - cropBoxWidthPercentage) / 2; // 21.875%
  
  // Restrict translation boundaries to physical frame borders
  const boundedFocalX = Math.max(0.281, Math.min(0.719, currentFocalX));
  const translateX = (boundedFocalX - 0.5) * 100;

  // Calculate scale / zoom out if letterboxing is active
  const scale = (analysis && analysis.letterboxSuggestion?.applyLetterbox)
    ? 1 - (analysis.letterboxSuggestion.paddingPercentage / 100)
    : 1;

  // Python script exporter template
  const pythonScriptContent = `import os
import cv2
import numpy as np
from scipy.signal import savgol_filter
from scenedetect import detect, ContentDetector
from ultralytics import YOLO

def fluid_crop_video(input_video_path, output_video_path, target_aspect_ratio="9:16"):
    print(f"Starting fluid aspect ratio conversion for: {input_video_path}")
    
    # --- Component A: Scene & Shot Detection ---
    print("Component A: Detecting camera cuts via PySceneDetect...")
    scene_list = detect(input_video_path, ContentDetector(threshold=27.0))
    scenes = []
    for i, scene in enumerate(scene_list):
        start_time = scene[0].get_seconds()
        end_time = scene[1].get_seconds()
        scenes.append((start_time, end_time))
        print(f"  Scene {i+1}: {start_time:.2f}s - {end_time:.2f}s")
    
    if not scenes:
        cap = cv2.VideoCapture(input_video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps
        scenes = [(0.0, duration)]
        cap.release()

    # --- Component B: Object Detection & Subject Tracking ---
    print("Component B: Loading YOLOv8 model for tracking...")
    model = YOLO('yolov8n.pt') # Lightweight YOLO model
    
    cap = cv2.VideoCapture(input_video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if target_aspect_ratio == "9:16":
        target_w = int(height * 9 / 16)
        target_h = height
    else:
        target_w = width
        target_h = int(width * 9 / 16)
        
    raw_x_positions = []
    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        results = model(frame, verbose=False)[0]
        boxes = results.boxes
        
        person_centers = []
        for box in boxes:
            class_id = int(box.cls[0])
            if class_id == 0: # Person
                x1, y1, x2, y2 = box.xyxy[0]
                center_x = int((x1 + x2) / 2)
                person_centers.append(center_x)
        
        if person_centers:
            primary_x = person_centers[0]
        else:
            primary_x = int(width / 2)
            
        raw_x_positions.append(primary_x)
        frame_idx += 1
        
    cap.release()
    raw_x_positions = np.array(raw_x_positions)
    
    # --- Component C: Smooth Path Optimization ---
    print("Component C: Optimizing crop window trajectory path...")
    smooth_x_positions = np.copy(raw_x_positions)
    
    for start_time, end_time in scenes:
        start_frame = int(start_time * fps)
        end_frame = min(int(end_time * fps), total_frames)
        scene_len = end_frame - start_frame
        
        if scene_len > 15:
            window_size = min(21, scene_len)
            if window_size % 2 == 0:
                window_size -= 1
            try:
                smooth_x_positions[start_frame:end_frame] = savgol_filter(
                    raw_x_positions[start_frame:end_frame], 
                    window_size, 
                    polyorder=3
                )
            except Exception as e:
                print(f"Smoothing error, using moving average: {e}")
                window = 15
                smooth_x_positions[start_frame:end_frame] = np.convolve(
                    raw_x_positions[start_frame:end_frame], 
                    np.ones(window)/window, 
                    mode='same'
                )
    
    min_allowed_x = target_w // 2
    max_allowed_x = width - (target_w // 2)
    smooth_x_positions = np.clip(smooth_x_positions, min_allowed_x, max_allowed_x)
    
    # --- Component D: Crop Rendering & Composition ---
    print(f"Component D: Rendering crop composition to: {output_video_path}")
    cap = cv2.VideoCapture(input_video_path)
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_video_path, fourcc, fps, (target_w, target_h))
    
    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        center_x = int(smooth_x_positions[frame_idx])
        x_start = center_x - (target_w // 2)
        x_end = x_start + target_w
        
        cropped_frame = frame[0:height, x_start:x_end]
        out.write(cropped_frame)
        frame_idx += 1
        
    cap.release()
    out.release()
    print("Fluid crop rendering successfully completed!")

if __name__ == "__main__":
    fluid_crop_video("input_16_9.mp4", "output_9_16.mp4", target_aspect_ratio="9:16")`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonScriptContent);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  const downloadPythonScript = () => {
    const element = document.createElement("a");
    const file = new Blob([pythonScriptContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "fluid_cropping_pipeline.py";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto p-6 text-white">
      {/* Premium Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 text-white p-8 shadow-sm">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-[#0077C8]/5 blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase bg-[#00F0FF]/15 text-[#00F0FF] rounded-full border border-[#00F0FF]/30 font-mono">
              Dynamic Layout Intelligence
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white">
              VIDEO ASPECT <span className="text-blue-600">UPDATE</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Reframe horizontally panned 16:9 videos into modern 9:16 social media sizes fluidly. Driven by Gemini semantic character saliency mapping and optimized with camera panned smoothing algorithms.
            </p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={loadLast}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white uppercase transition-all duration-300 shadow-sm disabled:opacity-50"
            >
              <RotateCcw size={14} className="text-blue-600" /> Load Last
            </button>
          </div>
        </div>
      </div>

        <div className="space-y-8">
          {/* BLOCK 1: Configurations & Select Panel (Full Width) */}
          <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 text-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold tracking-wider text-blue-600 uppercase mb-4 flex items-center gap-2">
              <Layers size={16} /> 1. Select Source Video
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Col 1: Selection & Upload */}
              <div className="space-y-4 md:col-span-1">
                {/* Dropdown selection */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                    Available Library Videos
                  </label>
                  <select
                    value={selectedVideo?.name || ''}
                    onChange={(e) => {
                      const found = videos.find(v => v.name === e.target.value);
                      if (found) {
                        setSelectedVideo(found);
                        setAnalysis(null);
                      }
                    }}
                    className="w-full px-3.5 py-3 rounded-xl bg-black/60 border border-white/15 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  >
                    {videos.map((v, idx) => (
                      <option key={idx} value={v.name}>
                        {v.name} ({v.source.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload Box */}
                <div className="relative border border-dashed border-white/15 hover:border-[#00F0FF] rounded-xl p-4 transition-colors bg-black/40 text-white">
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2">
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-xs font-semibold text-slate-300 text-center">
                      {uploading ? "Uploading to GCS..." : "Upload Custom Video"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/*"
                      disabled={uploading}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Col 2: Aspect Ratios & Custom Guidance */}
              <div className="space-y-4 md:col-span-1">
                {/* Aspect Ratio Selector */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                    Conversion Frame Aspect Ratio
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTargetAspect('9:16')}
                      className={`px-4 py-3 rounded-xl border font-extrabold text-xs transition-all ${
                        targetAspect === '9:16'
                          ? 'bg-[#349DD4] text-white font-black border-[#349DD4] shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      9:16 (Social Portrait)
                    </button>
                    <button
                      onClick={() => setTargetAspect('16:9')}
                      className={`px-4 py-3 rounded-xl border font-extrabold text-xs transition-all ${
                        targetAspect === '16:9'
                          ? 'bg-[#349DD4] text-white font-black border-[#349DD4] shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      16:9 (Cinema Landscape)
                    </button>
                  </div>
                </div>

                {/* Custom Guidance Input Box */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                    Additional Guidance & Bounding Constraints
                  </label>
                  <textarea
                    value={customGuidance}
                    onChange={(e) => setCustomGuidance(e.target.value)}
                    placeholder="e.g. Ensure active CTA button overlays are preserved..."
                    className="w-full h-20 p-3 rounded-xl bg-black/60 border border-white/15 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs resize-none shadow-inner"
                  />
                </div>
              </div>

              {/* Col 3: Submit Button & Tips */}
              <div className="space-y-4 md:col-span-1 h-full flex flex-col justify-between self-stretch">
                <div className="text-xs text-slate-300 leading-relaxed bg-black/60 p-4 rounded-xl border border-white/10">
                  <span className="font-bold text-blue-600">How it works:</span> Paste a YouTube link or select a library video. Add custom constraints to protect brand overlays, and run reframing. Gemini will automatically read the full video duration.
                </div>
                
                <button
                  onClick={handleRunAnalysis}
                  disabled={loading || uploading || !selectedVideo}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-4 rounded-xl tracking-wide uppercase transition-all shadow-md hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      GEMINI DETECTING TRACKS...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      RUN ASPECT CONVERSION
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* BLOCK 2: Viewports Comparison Grid (Full Width) */}
          {selectedVideo && (
            <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 text-white rounded-2xl p-6 shadow-sm space-y-6 relative">
              
              {/* Floating AI Preview Cut Banner */}
              {activePreviewMode !== 'full' && (
                <div className="flex items-center justify-between bg-indigo-600 text-white text-xs font-black px-4 py-3 rounded-xl shadow-md uppercase animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="animate-pulse" />
                    <span>AI Stitched Cut Preview Mode: {activePreviewMode === 'cut30s' ? '30-Second Commercial' : '15-Second Social Hook'} (Active time-skipping)</span>
                  </div>
                  <button
                    onClick={() => {
                      setActivePreviewMode('full');
                      setIsPlaying(false);
                      setCurrentTime(0);
                      if (sourceVideoRef.current) sourceVideoRef.current.currentTime = 0;
                      if (selectedVideo?.source === 'youtube') {
                        const msg = JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] });
                        sourceIframeRef.current?.contentWindow?.postMessage(msg, '*');
                        defaultCropIframeRef.current?.contentWindow?.postMessage(msg, '*');
                        cropIframeRef.current?.contentWindow?.postMessage(msg, '*');
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 border border-white/10 text-white px-3 py-1 rounded-lg text-[9px] font-extrabold transition-colors"
                  >
                    Exit Preview
                  </button>
                </div>
              )}
              {/* Viewports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Original 16:9 Viewport with floating crop overlay */}
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                    <Video size={12} /> Viewport A: Saliency Tracking (16:9)
                  </h4>
                  
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-200">
                      <video
                        ref={sourceVideoRef}
                        src={selectedVideo.url}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        loop
                      />

                    {/* Dynamic Floating Bounding/Crop Box */}
                    {analysis && (
                      <div
                        className="absolute top-0 bottom-0 border-2 border-blue-500 bg-blue-500/5 shadow-sm pointer-events-none transition-all duration-100 flex items-center justify-center"
                        style={{
                          width: `${cropBoxWidthPercentage}%`,
                          left: `calc(${cropPercentage}% - ${cropBoxWidthPercentage / 2}%)`,
                        }}
                      >
                        {/* Visual Bounding Guide Crosshair */}
                        <div className="w-4 h-4 border border-blue-300/40 rounded-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-blue-50 rounded-full"></div>
                        </div>
                        
                        {/* Target Tag */}
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded">
                          Reframing Frame
                        </span>
                      </div>
                    )}

                    {/* Dynamic Bounding Box Elements */}
                    {analysis && analysis.scenes && getActiveSceneIndex() !== -1 && 
                      analysis.scenes[getActiveSceneIndex()]?.boundingBoxes?.map((box, idx) => (
                        <div
                          key={idx}
                          className={`absolute border rounded-lg p-1 pointer-events-none transition-all duration-300 flex flex-col justify-between ${
                            box.type === 'subject'
                              ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.25)]'
                              : box.type === 'ui_element'
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.25)]'
                              : 'border-gray-400/40 bg-gray-500/5 text-gray-400'
                          }`}
                          style={{
                            left: `${box.type === 'subject'
                              ? Math.max(0, Math.min(85, currentFocalX * 100 - 7.5))
                              : Math.max(0, Math.min(85, box.approximateX * 100 - 7.5))}%`,
                            top: `${Math.max(0, Math.min(85, box.approximateY * 100 - 7.5))}%`,
                            width: '15%',
                            height: '15%',
                          }}
                        >
                          <div className="flex justify-between items-center text-[6px] font-black uppercase tracking-wider overflow-hidden whitespace-nowrap">
                            <span className="truncate">{box.label}</span>
                          </div>
                          <div className="w-1 h-1 rounded-full self-center bg-current"></div>
                          <span className="text-[5px] text-center truncate leading-none opacity-75">
                            {(box.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Default Center Crop Viewport */}
                <div className="md:col-span-1 space-y-3">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
                    <Eye size={12} className="text-gray-400" /> Viewport B: Default Center Crop ({targetAspect})
                  </h4>

                  <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden border border-gray-200 relative flex items-center justify-center shadow-sm">
                    {/* Static CSS Center Crop Simulation (X is always centered at 0.5) */}
                    <div
                      className="absolute top-0 bottom-0 overflow-hidden transition-transform duration-100"
                      style={{
                        width: `${100 / (cropBoxWidthPercentage / 100)}%`,
                        transform: `translate3d(0%, 0, 0)`,
                      }}
                    >
                        <video
                          ref={defaultCropVideoRef}
                          src={selectedVideo.url}
                          className="w-full h-full object-cover"
                          playsInline
                          muted
                          loop
                        />
                    </div>
                    
                    {/* Overlay badge to indicate "Static Center" */}
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded shadow-sm select-none whitespace-nowrap">
                      Static Center
                    </span>
                  </div>
                </div>

                {/* Fluid Crop Output Viewport */}
                <div className="md:col-span-1 space-y-3">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                    <ArrowRight size={12} className="text-blue-600" /> Viewport C: Fluid Crop Output ({targetAspect})
                  </h4>

                  <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden border border-gray-200 relative flex items-center justify-center shadow-lg">
                    {/* CSS Panning Simulation */}
                    <div
                      className="absolute top-0 bottom-0 overflow-hidden transition-transform duration-100"
                      style={{
                        width: `${100 / (cropBoxWidthPercentage / 100)}%`,
                        transform: `translate3d(${-translateX}%, 0, 0) scale(${scale})`,
                      }}
                    >
                        <video
                          ref={cropVideoRef}
                          src={selectedVideo.url}
                          className="w-full h-full object-cover"
                          playsInline
                          muted
                          loop
                        />
                    </div>
                    
                    {/* Vignette framing */}
                    <div className="absolute inset-0 border border-white/5 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none"></div>

                    {/* Overlay badge to indicate "Fluid Pan" */}
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-600/95 text-white text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded shadow-sm select-none whitespace-nowrap">
                      Smart Fluid Pan
                    </span>
                  </div>
                </div>
              </div>



              {/* Media Timeline Controls */}
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-transform active:scale-95 flex-shrink-0"
                >
                  {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{currentTime.toFixed(1)}s</span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 15}
                    step={0.05}
                    value={currentTime}
                    onChange={handleTimelineSeek}
                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none"
                  />
                  <span className="text-[10px] font-bold text-slate-400 w-8">{(duration || 15).toFixed(1)}s</span>
                </div>
              </div>

              {/* Path Optimization Coordinate Graph */}
              {rawCoordinates.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                      <BarChart2 size={12} className="text-blue-600" /> Trajectory Path Optimization (Savitzky-Golay Filters)
                    </h4>
                    
                    {/* Graph legend */}
                    <div className="flex gap-4 text-[9px] font-bold uppercase">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-0.5 bg-red-500/60"></div>
                        <span className="text-slate-400">Raw YOLO Tracking Coordinate</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-1 bg-blue-600"></div>
                        <span className="text-blue-600">Optimized Camera Pan Path</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                    <canvas
                      ref={timelineCanvasRef}
                      width={800}
                      height={120}
                      className="w-full h-32 block border-b border-gray-100"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* BLOCK 2.5: AI Edit Guidance & Cut Suggestions (Full Width) */}
          {analysis && analysis.editGuidance && (
            <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 text-white rounded-2xl p-6 shadow-sm space-y-4 animate-slideUp">
              <h3 className="text-sm font-extrabold tracking-wider text-blue-600 uppercase flex items-center gap-2">
                <Layers size={16} className="text-blue-600" /> AI Post-Production Edit Guidance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 30s Cut */}
                <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-100/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Sliders size={14} className="text-blue-600" /> 30-Second Commercial Cut
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          if (activePreviewMode === 'cut30s') {
                            setActivePreviewMode('full');
                            setIsPlaying(false);
                          } else {
                            setActivePreviewMode('cut30s');
                            setIsPlaying(true);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center gap-1.5 ${
                          activePreviewMode === 'cut30s'
                            ? 'bg-red-500 border-red-600 hover:bg-red-600 text-white shadow-sm animate-pulse'
                            : 'bg-white hover:bg-blue-100/50 border-blue-200 text-blue-700 shadow-xs'
                        }`}
                      >
                        {activePreviewMode === 'cut30s' ? (
                          <>
                            <Pause size={10} fill="currentColor" /> Stop Preview
                          </>
                        ) : (
                          <>
                            <Play size={10} fill="currentColor" /> Preview Cut
                          </>
                        )}
                      </button>
                      <span className="px-2.5 py-1 rounded-xl text-[9px] font-black bg-blue-100 text-blue-800 uppercase tracking-wider border border-blue-200/40">
                        Length: 30s
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Slices to Stitch:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.editGuidance.cut30s.scenesToUse.map((sceneStr, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-lg bg-white border border-blue-200/60 text-blue-800 text-[10px] font-black shadow-sm">
                          {sceneStr}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-1 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Creative Justification:</p>
                    <p className="text-gray-700 text-[11px] leading-relaxed font-medium">{analysis.editGuidance.cut30s.rationale}</p>
                  </div>
                </div>

                {/* 15s Cut */}
                <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-indigo-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Video size={14} className="text-indigo-600" /> 15-Second Social Reel Hook
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          if (activePreviewMode === 'cut15s') {
                            setActivePreviewMode('full');
                            setIsPlaying(false);
                          } else {
                            setActivePreviewMode('cut15s');
                            setIsPlaying(true);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center gap-1.5 ${
                          activePreviewMode === 'cut15s'
                            ? 'bg-red-500 border-red-600 hover:bg-red-600 text-white shadow-sm animate-pulse'
                            : 'bg-white hover:bg-indigo-100/50 border-indigo-200 text-indigo-700 shadow-xs'
                        }`}
                      >
                        {activePreviewMode === 'cut15s' ? (
                          <>
                            <Pause size={10} fill="currentColor" /> Stop Preview
                          </>
                        ) : (
                          <>
                            <Play size={10} fill="currentColor" /> Preview Cut
                          </>
                        )}
                      </button>
                      <span className="px-2.5 py-1 rounded-xl text-[9px] font-black bg-indigo-100 text-indigo-800 uppercase tracking-wider border border-indigo-200/40">
                        Length: 15s
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Slices to Stitch:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.editGuidance.cut15s.scenesToUse.map((sceneStr, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-lg bg-white border border-indigo-200/60 text-indigo-800 text-[10px] font-black shadow-sm">
                          {sceneStr}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-1 space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Creative Justification:</p>
                    <p className="text-gray-700 text-[11px] leading-relaxed font-medium">{analysis.editGuidance.cut15s.rationale}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BLOCK 3: Gemini Video Saliency Mapping details panel (Full Width) */}
          {analysis && (
            <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 text-white rounded-2xl p-6 shadow-sm space-y-6 animate-slideUp">
              <h3 className="text-sm font-extrabold tracking-wider text-blue-600 uppercase flex items-center gap-2">
                <Eye size={16} /> Gemini Video Saliency Mapping
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Col 1: Subject, Goal, and UI focus optimizations */}
                <div className="space-y-4 md:col-span-1">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Detected Main Subject</h4>
                    <p className="text-white font-semibold text-sm">{analysis.subject}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Visual Tracking Strategy</h4>
                    <p className="text-slate-300 leading-relaxed text-xs">{analysis.goal}</p>
                  </div>

                  {analysis.letterboxSuggestion && (
                    <div className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                      analysis.letterboxSuggestion.applyLetterbox
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-950 shadow-sm animate-fadeIn'
                        : 'bg-gray-50 border-gray-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-700 uppercase text-[9px] tracking-wider text-indigo-700">UI Focus Optimizations</h4>
                        {analysis.letterboxSuggestion.applyLetterbox ? (
                          <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-indigo-100 text-indigo-800 uppercase tracking-wider border border-indigo-200">
                            Letterbox Suggested ({analysis.letterboxSuggestion.paddingPercentage}% padding)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-gray-200 text-slate-300 uppercase tracking-wider border border-gray-300">
                            Full Crop Okay
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{analysis.letterboxSuggestion.rationale}</p>
                    </div>
                  )}
                </div>

                {/* Col 2: Scene Segments List */}
                <div className="space-y-2.5 md:col-span-1 border-l border-gray-100 pl-0 md:pl-6">
                  <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider">Detected Scene Segments</h4>
                  <div className="space-y-2.5">
                    {analysis.scenes.map((scene, idx) => {
                      const isActive = getActiveSceneIndex() === idx;
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                            isActive
                              ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                              : 'bg-gray-50/50 border-gray-100 opacity-75'
                          }`}
                        >
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-slate-400'
                          }`}>
                            SCENE {scene.sceneId}
                          </span>
                          <div className="space-y-0.5 flex-1">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400">
                              <span>{scene.startTime.toFixed(1)}s - {scene.endTime.toFixed(1)}s</span>
                              {isActive && <span className="text-blue-600 uppercase tracking-wider font-black">Active</span>}
                            </div>
                            <p className="text-[11px] text-gray-700 font-medium leading-relaxed">{scene.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Col 3: Real-time Bounding Box Tracker Feed */}
                <div className="space-y-2.5 md:col-span-1 border-l border-gray-100 pl-0 md:pl-6">
                  {analysis.scenes[getActiveSceneIndex()] && (
                    <div className="space-y-2.5 animate-fadeIn">
                      <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider flex justify-between items-center">
                        <span>Scene Bounding Boxes ({analysis.scenes[getActiveSceneIndex()].boundingBoxes?.length || 0})</span>
                        <span className="text-blue-600 font-extrabold tracking-widest">Live CV Feed</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {analysis.scenes[getActiveSceneIndex()].boundingBoxes?.map((box, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex justify-between items-center gap-3 text-[10px]">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                box.type === 'subject'
                                  ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]'
                                  : box.type === 'ui_element'
                                  ? 'bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                                  : 'bg-gray-400'
                              }`}></span>
                              <div className="overflow-hidden">
                                <p className="font-bold text-white truncate">{box.label}</p>
                                <p className="text-[9px] text-slate-400 truncate max-w-[160px]">{box.description}</p>
                              </div>
                            </div>
                            <div className="text-right font-mono font-bold flex-shrink-0 space-y-0.5">
                              <p className="text-white uppercase text-[8px]">conf: {(box.confidence * 100).toFixed(0)}%</p>
                              <p className="text-gray-400 text-[8px]">
                                X:{(box.type === 'subject' ? currentFocalX : box.approximateX).toFixed(2)} Y:{box.approximateY.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State Instructions */}
          {!analysis && (
            <div className="bg-[#0D131D]/90 backdrop-blur-xl border border-white/10 text-white rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-sm min-h-[360px]">
              <Video size={48} className="text-gray-300 mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">Interactive Viewport Pipeline Idle</h3>
              <p className="text-slate-400 text-sm max-w-md mb-6 text-center">
                Upload a custom video or select a sample video from the dropdown menu, then click **"Run Aspect Conversion"** to trigger the Gemini scene tracking intelligence and camera path optimization visualizer.
              </p>
            </div>
          )}

        </div>
      </div>
    );
};
