import React, { useState } from 'react';
import { generateImage, generateVideo, generateImageWithReference } from '../services/geminiService';
import { brandConfig } from '../config';
import { GenerationMode } from '../types';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export const PDPEnrichment: React.FC = () => {
  const [step, setStep] = useState(1);
  const [productName, setProductName] = useState('Advil Liqui-Gels');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedProductIdx, setSelectedProductIdx] = useState<number | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('upload');

  const [contextImages, setContextImages] = useState<string[]>([]);
  const [selectedContextIdx, setSelectedContextIdx] = useState<number | null>(null);

  const [videoResult, setVideoResult] = useState<{ objectUrl: string; uri: string } | null>(null);

  const handleGenerateProducts = async () => {
    if (!productName) return;
    setLoading(true);
    setStatus(`Generating 6 variations of ${productName} on white background...`);
    setProductImages([]);
    setUploadedImage(null);
    setSelectedProductIdx(null);

    try {
      const promises = Array(6).fill(0).map(() =>
        generateImage(`Professional product photography of ${productName} on a pure white background, studio lighting, high resolution, 4k, commercial style, perfect packaging`)
      );

      const results = await Promise.all(promises);
      const validResults = results.filter(r => r !== null) as string[];
      setProductImages(validResults);
      if (validResults.length > 0) setStep(2);
      else setStatus("Failed to generate images. Please try again.");
    } catch (error) {
      console.error(error);
      setStatus("Error generating images.");
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
        setProductImages([]);
        setSelectedProductIdx(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContextGenerationFromUpload = async () => {
    if (!uploadedImage || !productName) return;
    setLoading(true);
    setStatus(`Generating 6 variations of ${productName} in context (using uploaded image)...`);
    setContextImages([]);

    try {
      const promises = Array(6).fill(0).map(() =>
        generateImageWithReference(
          `Professional lifestyle photography of ${productName} being used in a race or training run, athletic people, dynamic lighting, high quality, 4k, photorealistic, ${brandConfig.companyName} branding style`,
          uploadedImage
        )
      );

      const results = await Promise.all(promises);
      const validResults = results.filter(r => r !== null) as string[];
      setContextImages(validResults);
      if (validResults.length > 0) setStep(3);
      else setStatus("Failed to generate context images.");
    } catch (error) {
      console.error(error);
      setStatus("Error generating context images.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContext = async () => {
    const imageToUse = uploadedImage || (selectedProductIdx !== null ? productImages[selectedProductIdx] : null);

    if (!imageToUse) return;

    setLoading(true);
    setStatus(`Generating 6 variations of ${productName} in context...`);
    setContextImages([]);

    try {
      const promises = Array(6).fill(0).map(() =>
        generateImageWithReference(
          `Professional lifestyle photography of ${productName} being used in a race or training run, athletic people, dynamic lighting, high quality, 4k, photorealistic, ${brandConfig.companyName} branding style`,
          imageToUse
        )
      );

      const results = await Promise.all(promises);
      const validResults = results.filter(r => r !== null) as string[];
      setContextImages(validResults);
      if (validResults.length > 0) setStep(3);
      else setStatus("Failed to generate context images.");
    } catch (error) {
      console.error(error);
      setStatus("Error generating context images.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (selectedContextIdx === null) return;
    setLoading(true);
    setStatus("Generating video with Veo (this may take a minute)...");

    try {
      const selectedImageBase64 = contextImages[selectedContextIdx];

      const result = await generateVideo({
        model: "veo-3.1-fast-generate-preview",
        mode: GenerationMode.FRAMES_TO_VIDEO,
        durationSeconds: 8,
        resolution: "720p",
        startFrame: {
          base64: selectedImageBase64,
          file: { type: "image/png", name: "start_frame.png" }
        },
        prompt: `Cinematic slow motion pan of ${productName} being raised for a toast, refreshing condensation, sunlight glinting off the bottle/can, high quality, commercial advertisement style`,
      });

      setVideoResult(result);
      setStep(4);
    } catch (error) {
      console.error(error);
      setStatus(`Error generating video: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setProductName('');
    setProductImages([]);
    setUploadedImage(null);
    setContextImages([]);
    setVideoResult(null);
    setSelectedProductIdx(null);
    setSelectedContextIdx(null);
    setStatus('');
    setActiveTab('generate');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="section-header">PDP Enrichment</h2>
        {step > 1 && (
          <button onClick={reset} className="text-subtext hover:text-white underline">Start Over</button>
        )}
      </div>

      <div className="content-card p-8 min-h-[600px]">

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
            <p className="text-lg text-gray-600 animate-pulse">{status}</p>
          </div>
        )}

        {!loading && step === 1 && (
          <div className="max-w-xl mx-auto">

            {/* Tabs */}
            <div className="flex bg-gray-900 rounded-lg p-1 mb-8 border border-gray-800">
              <button
                onClick={() => { setActiveTab('generate'); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'generate' ? 'bg-[#111] shadow-sm text-white border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Generate New
              </button>
              <button
                onClick={() => { setActiveTab('upload'); setProductImages([]); }}
                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-[#111] shadow-sm text-white border border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Upload Own Image
              </button>
            </div>

            <label className="block text-lg font-medium text-white mb-4 text-center">
              What product would you like to enrich?
            </label>

            {activeTab === 'generate' ? (
              <div className="flex gap-4">
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Nexium"
                  className="flex-1 input-field px-4 py-3 text-lg placeholder-gray-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateProducts()}
                />
                <button
                  onClick={handleGenerateProducts}
                  disabled={!productName}
                  className={`btn-primary px-8 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors ${brandConfig.ui.button.primary}`}
                >
                  Generate
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Product Name (Required)"
                    className="w-full rounded-lg border-2 border-gray-700 bg-black text-white px-4 py-3 text-lg focus:border-white focus:outline-none mb-4"
                  />

                  {!uploadedImage ? (
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center hover:border-white transition-colors bg-gray-900">
                      <label className="cursor-pointer flex flex-col items-center">
                        <Upload size={48} className="text-gray-500 mb-4" />
                        <span className="text-gray-300 font-medium">Click to upload product image</span>
                        <span className="text-gray-500 text-sm mt-2">JPG, PNG supported</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
                      <img src={`data:image/png;base64,${uploadedImage}`} alt="Uploaded Preview" className="w-full h-64 object-contain" />
                      <button
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-black hover:bg-white transition-colors"
                      >
                        <X size={20} />
                      </button>
                      <div className="absolute bottom-4 left-0 right-0 text-center">
                        <button
                          onClick={handleContextGenerationFromUpload}
                              className={`btn-primary px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors ${brandConfig.ui.button.primary}`}
                        >
                          Use this Image & Generate Lifestyle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && step === 2 && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Select the best product shot (White Background)</h3>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {productImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedProductIdx(idx)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${selectedProductIdx === idx ? 'border-red-600 scale-105 shadow-xl' : 'border-transparent hover:border-gray-200'
                    }`}
                >
                  <img src={`data:image/png;base64,${img}`} alt={`Product ${idx}`} className="w-full h-64 object-contain bg-gray-800" />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleGenerateContext}
                disabled={selectedProductIdx === null}
                className={`btn-primary px-8 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors ${brandConfig.ui.button.primary}`}
              >
                Confirm & Generate Context
              </button>
            </div>
          </div>
        )}

        {!loading && step === 3 && (
          <div>
            <h3 className="text-xl font-semibold mb-6">Select the best lifestyle context shot</h3>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {contextImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedContextIdx(idx)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${selectedContextIdx === idx ? 'border-red-600 scale-105 shadow-xl' : 'border-transparent hover:border-gray-200'
                    }`}
                >
                  <img src={`data:image/png;base64,${img}`} alt={`Context ${idx}`} className="w-full h-64 object-cover" />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleGenerateVideo}
                disabled={selectedContextIdx === null}
                className={`btn-primary px-8 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors ${brandConfig.ui.button.primary}`}
              >
                Create Video with Veo
              </button>
            </div>
          </div>
        )}

        {!loading && step === 4 && videoResult && (
          <div className="text-center py-8">
            <h3 className="text-2xl font-bold mb-8 text-white">Final Asset Package</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <h4 className="font-semibold text-lg mb-4">Selected Context Image</h4>
                <img
                  src={`data:image/png;base64,${contextImages[selectedContextIdx!]}`}
                  alt="Final Selection"
                  className="w-full rounded-lg shadow-md"
                />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-4">Generated Video</h4>
                <div className="rounded-lg overflow-hidden shadow-md bg-black">
                  <video
                    src={videoResult.objectUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full"
                  />
                </div>
                <a
                  href={videoResult.objectUrl}
                  download={`${brandConfig.companyName.replace(/\s+/g, '').toLowerCase()}_${productName.replace(/\s+/g, '_')}_promo.mp4`}
                  className="inline-block mt-4 text-white hover:underline"
                >
                  Download Video
                </a>
              </div>
            </div>

            <div className="mt-12 p-6 bg-green-900/20 rounded-lg border border-green-800">
              <p className="text-green-400 font-medium">Catalog updated successfully! 1 New Item Added.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};