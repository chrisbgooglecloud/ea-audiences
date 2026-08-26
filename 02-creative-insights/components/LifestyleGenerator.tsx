import React, { useState, useEffect } from 'react';
import { generateLifestyleVariations } from '../services/geminiService';

const LIFESTYLE_OPTIONS = [
  { label: 'Cotton Shirt', value: '/images/lifestyle/shirt.png' },
  { label: 'Cozy Sweater', value: '/images/lifestyle/sweater.png' },
  { label: 'Silk Pajamas', value: '/images/lifestyle/pjs.png' },
  { label: 'Bath Robe', value: '/images/lifestyle/robe.png' },
];

const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface LifestyleResult {
  type: string;
  image: string | null;
}

export const LifestyleGenerator: React.FC = () => {
  const [selectedProductUrl, setSelectedProductUrl] = useState(LIFESTYLE_OPTIONS[0].value);
  const [productImageBase64, setProductImageBase64] = useState<string | null>(null);
  const [results, setResults] = useState<LifestyleResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    handleProductSelect(LIFESTYLE_OPTIONS[0].value);
  }, []);

  const handleProductSelect = async (url: string) => {
    setSelectedProductUrl(url);
    setResults([]); // Clear previous results
    try {
      const base64 = await urlToBase64(url);
      setProductImageBase64(base64);
    } catch (e) {
      console.error("Failed to load image", e);
    }
  };

  const handleGenerate = async () => {
    if (!productImageBase64) return;
    setIsLoading(true);
    setResults([]);
    try {
      const generatedVariations = await generateLifestyleVariations(productImageBase64);
      setResults(generatedVariations);
    } catch (error) {
      console.error(error);
      alert("Failed to generate lifestyle images.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="section-header justify-center mb-2">Lifestyle Studio</h2>
        <p className="text-subtext">Turn flat catalog shots into inspiring scenes instantly.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Left: Input Config */}
        <div className="w-full lg:w-1/4 space-y-4 sticky top-8">
          <div className="content-card">
            <label className="form-label mb-3">Select Product</label>
            <select
              value={selectedProductUrl}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="input-field mb-6"
            >
              {LIFESTYLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="aspect-square bg-black rounded-xl border border-gray-800 flex items-center justify-center overflow-hidden p-8 mb-6">
              <img src={selectedProductUrl} alt="Input" className="w-full h-full object-contain" />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!productImageBase64 || isLoading}
              className="w-full btn-primary py-4 rounded-full font-bold text-lg hover:shadow-xl transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Creating Scenes...' : 'Generate Lifestyle'}
            </button>

            {isLoading && (
              <p className="text-center text-sm text-gray-500 mt-3 animate-pulse">Generating 3 unique scenes...</p>
            )}
          </div>
        </div>

        {/* Right: Grid Output */}
        <div className="w-full lg:w-3/4">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.map((variant, idx) => (
                <div key={idx} className="content-card p-3 hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden mb-3 relative group cursor-zoom-in">
                    {variant.image ? (
                      <img
                        src={variant.image}
                        alt={variant.type}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onClick={() => variant.image && setLightboxImage(variant.image)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">Failed</div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white text-center">{variant.type}</p>
                </div>
              ))}
            </div>
          ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-gray-500 bg-[#111] rounded-2xl border-2 border-dashed border-gray-800">
              {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                  <p className="font-medium">AI is styling your photoshoot...</p>
                </>
              ) : (
                <>
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p>Select a product to generate Natural, Studio, and Lifestyle photos.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <img
            src={lightboxImage}
            alt="Full view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
