import React, { useState } from 'react';
import { generateImageWithReference } from '../services/geminiService';
import { brandConfig } from '../config';
import { Upload, X, RotateCcw, RotateCw } from 'lucide-react';
import { useAppConfig } from '../context/AppConfigContext';
import { useCompanyContext } from '../context/CompanyContext';

const BRAND_BLACK = "#111827"; // Brand Black
const BRAND_ACCENT = "#0077C8";

const ASPECT_RATIOS = ["1:1", "4:3", "16:9", "9:16", "3:2", "2:3", "4:5", "5:4", "21:9"];

const openImageInNewTab = (base64OrUrl: string) => {
  try {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Image Preview</title>
            <style>
              body {
                margin: 0;
                background-color: #0e0e10;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-family: system-ui, -apple-system, sans-serif;
              }
              img {
                max-width: 95%;
                max-height: 95%;
                object-fit: contain;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                border-radius: 8px;
                transition: transform 0.3s ease;
              }
              img:hover {
                transform: scale(1.01);
              }
            </style>
          </head>
          <body>
            <img src="${base64OrUrl}" alt="Image Preview" />
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  } catch (e) {
    console.error("Failed to open image in new tab:", e);
    window.open(base64OrUrl, '_blank');
  }
};

const GENERATION_PROMPT = `
      Create a high-quality variation of the provided input advertisement.
      
      CONTEXT:
      The image should be a faithful recreation of the input advertisement, adapted to the target aspect ratio.
      Maintain the overarching theme, visual style, and aesthetic of the input image.
      The lighting, color palette, and overall vibe MUST remain consistent with the original.
      CRITICAL: The pose, posture, and body language of any characters present MUST be maintained exactly as in the original image.
      
      TEXT REPLICATION:
      CRITICAL: You MUST maintain 100% accuracy of all text found in the original advertisement.
      The text placement, font weights, and typographic hierarchy should feel native to the new aspect ratio.
      Do not add new text or calls to action.
      
      COLOR CONSISTENCY:
      CRITICAL: The colors of all text and backgrounds stay exactly the same as in the original advertisement. Do not alter contrast or color schemes.
      
      BRANDING:
      Maintain any logos or brand elements exactly as they appear in the input image, adjusted proportionately for the new aspect ratio.`;

export const ContentVersioning: React.FC = () => {
  const { config } = useAppConfig();
  const { name: companyName } = useCompanyContext();
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedDeals, setGeneratedDeals] = useState<string[]>([]);

  React.useEffect(() => {
    const initData = async () => {
      // 1. Try to auto-load last run if available
      try {
        const response = await fetch(`/api/load-run/content_versioning?companyName=${encodeURIComponent(companyName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.uploadedImage || (data.generatedDeals && data.generatedDeals.length > 0))) {
            if (data.uploadedImage) setUploadedImage(data.uploadedImage);
            if (data.generatedDeals) setGeneratedDeals(data.generatedDeals);
            console.log("[ContentVersioning] Auto-loaded last saved run.");
            return;
          }
        }
      } catch (e) {
        console.warn("[ContentVersioning] No saved run auto-loaded, loading defaults.");
      }

      // 2. Fallback to default reference image
      try {
        const defaultRef = config?.pages?.CONTENT_STUDIO?.contentVersioningReference || '/images/qvc-ad.png';
        const response = await fetch(defaultRef);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Content = base64String.split(',')[1] || base64String;
          setUploadedImage(base64Content);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error loading default image:", error);
      }
    };
    initData();
  }, [companyName, config]);

  React.useEffect(() => {
    if (generatedDeals.length > 0) {
      fetch('/api/save-run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          featureId: 'content_versioning',
          companyName,
          data: {
            uploadedImage,
            generatedDeals
          }
        })
      }).catch(err => console.error("Failed to save run to server:", err));
    }
  }, [generatedDeals, uploadedImage, companyName]);

  const loadLastRun = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/load-run/content_versioning?companyName=${encodeURIComponent(companyName)}`);
      if (!response.ok) throw new Error("No saved run");
      
      const data = await response.json();
      
      if (data.uploadedImage) setUploadedImage(data.uploadedImage);
      if (data.generatedDeals) setGeneratedDeals(data.generatedDeals);
      
    } catch (error) {
      console.warn("Could not load last run:", error);
      alert("No previous run found.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1] || base64String;
        setUploadedImage(base64Content);
        setGeneratedDeals([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDeal = async () => {
    if (!uploadedImage) return;
    
    setGeneratedDeals(new Array(ASPECT_RATIOS.length).fill(null));

    try {
      ASPECT_RATIOS.forEach((ratio, index) => {
        generateImageWithReference(GENERATION_PROMPT, [uploadedImage], "image/jpeg", "gemini-3.1-flash-lite-image", ratio)
          .then(res => {
            if (res) {
              setGeneratedDeals(prev => {
                const next = [...prev];
                next[index] = res;
                return next;
              });
            }
          })
          .catch(err => console.error(`Error for ratio ${ratio}:`, err));
      });

    } catch (error) {
      console.error("Error generating deals:", error);
    }
  };

  const handleRegenerateOne = async (index: number) => {
    if (!uploadedImage) return;
    
    const ratio = ASPECT_RATIOS[index];
    
    setGeneratedDeals(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    try {
      const res = await generateImageWithReference(GENERATION_PROMPT, [uploadedImage], "image/jpeg", "gemini-3.1-flash-lite-image", ratio);
      if (res) {
        setGeneratedDeals(prev => {
          const next = [...prev];
          next[index] = res;
          return next;
        });
      }
    } catch (error) {
      console.error(`Error regenerating for ratio ${ratio}:`, error);
    }
  };

  const isStillGenerating = generatedDeals.length > 0 && generatedDeals.some(deal => deal === null);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="section-header !mb-0">Content Versioning</h2>
        <button
          onClick={loadLastRun}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm font-medium"
        >
          <RotateCcw size={16} /> Load Last
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Inputs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit lg:col-span-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">1. Upload Product</h3>

          {!uploadedImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-gray-50 mb-6 group">
              <label className="cursor-pointer flex flex-col items-center">
                <Upload size={32} className="text-gray-400 group-hover:text-blue-600 mb-2 transition-colors" />
                <span className="text-gray-500 font-medium group-hover:text-gray-900">Click to upload Product Image</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white mb-6 p-2">
              <img 
                src={`data:image/jpeg;base64,${uploadedImage}`} 
                alt="Uploaded Preview" 
                className="w-full h-48 object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-300" 
                onClick={() => openImageInNewTab(`data:image/jpeg;base64,${uploadedImage}`)}
                title="Click to open in new tab"
              />
              <button
                onClick={() => { setUploadedImage(null); setGeneratedDeals([]); }}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm border border-gray-200 z-10"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <button
            onClick={handleGenerateDeal}
            disabled={!uploadedImage || isStillGenerating}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg btn-primary px-6 py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6`}
          >
            Generate 9 Options
          </button>
          
          {isStillGenerating && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 animate-fadeIn">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
              <span>Generating variations...</span>
            </div>
          )}
        </div>

        {/* Right Col: Output */}
        <div className="lg:col-span-2 space-y-6">
          {generatedDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedDeals.slice(0, 9).map((dealUrl, index) => {
                const ratios = [
                  "1:1 (Square)", "4:3 (Classic)", "16:9 (Landscape)", "9:16 (Vertical)", 
                  "3:2 (Standard)", "2:3 (Portrait)", "4:5 (Social)", "5:4 (Social)", 
                  "21:9 (Cinematic)"
                ];
                return (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wider">{ratios[index]}</h3>
                    <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center mb-3 border border-gray-200">
                      {dealUrl ? (
                        <img 
                          src={dealUrl} 
                          alt={`Generated Deal ${index + 1}`} 
                          className="max-w-full max-h-full object-contain shadow-sm animate-fadeIn cursor-pointer hover:scale-[1.03] transition-transform duration-300" 
                          onClick={() => openImageInNewTab(dealUrl)}
                          title="Click to open in new tab"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                          <span className="text-xs text-gray-400">Generating...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Powered by Gemini</span>
                      <div className="flex items-center gap-3">
                        {dealUrl && (
                          <button 
                            onClick={() => handleRegenerateOne(index)} 
                            className="text-gray-500 hover:text-blue-600 transition-colors"
                            title="Regenerate this version"
                          >
                            <RotateCw size={16} />
                          </button>
                        )}
                        {dealUrl && (
                          <a href={dealUrl} download={`deal-${ratios[index].split(' ')[0]}.jpg`} className="text-blue-600 font-semibold hover:underline">Download</a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 h-full min-h-[400px] flex items-center justify-center text-gray-400">
              <p>Generated images will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
