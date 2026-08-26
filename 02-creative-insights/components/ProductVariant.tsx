import React, { useState, useEffect } from 'react';
import { generateMultipleProductVariants, LAMPSHADE_STYLES } from '../services/geminiService';

const LAMP_OPTIONS = [
  { label: 'Classic Table Lamp', value: '/images/lamp/lamp1.png' },
  { label: 'Modern Desk Lamp', value: '/images/lamp/lamp2.png' },
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

interface VariantResult {
  style: string;
  image: string | null;
}

export const ProductVariant: React.FC = () => {
  const [selectedLampUrl, setSelectedLampUrl] = useState(LAMP_OPTIONS[0].value);
  const [inputImageBase64, setInputImageBase64] = useState<string | null>(null);

  const [results, setResults] = useState<VariantResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    handleLampSelect(LAMP_OPTIONS[0].value);
  }, []);

  const handleLampSelect = async (url: string) => {
    setSelectedLampUrl(url);
    setResults([]); // Clear previous results
    try {
      const base64 = await urlToBase64(url);
      setInputImageBase64(base64);
    } catch (e) {
      console.error("Failed to load lamp image", e);
    }
  };

  const handleGenerate = async () => {
    if (!inputImageBase64) return;
    setIsLoading(true);
    setResults([]);
    try {
      const generatedVariants = await generateMultipleProductVariants(inputImageBase64, LAMPSHADE_STYLES);
      setResults(generatedVariants);
    } catch (error) {
      console.error(error);
      alert("Failed to generate variants.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="section-header justify-center mb-2">Product Variant Studio</h2>
        <p className="text-subtext">Instantly visualize your product in 9 distinct styles.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Left: Input Config */}
        <div className="w-full lg:w-1/3 space-y-4 sticky top-8">
          <div className="content-card">
            <label className="form-label mb-3">Select Base Product</label>
            <select
              value={selectedLampUrl}
              onChange={(e) => handleLampSelect(e.target.value)}
              className="input-field mb-6"
            >
              {LAMP_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="aspect-square bg-black rounded-xl border border-gray-800 flex items-center justify-center overflow-hidden p-8 mb-6">
              <img src={selectedLampUrl} alt="Input" className="w-full h-full object-contain mix-blend-multiply" />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!inputImageBase64 || isLoading}
              className="w-full btn-primary py-4 rounded-full font-bold text-lg hover:shadow-xl transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Generating 9 Variants...' : 'Generate All Styles'}
            </button>

            {isLoading && (
              <p className="text-center text-sm text-gray-500 mt-3 animate-pulse">This may take about 10-15 seconds...</p>
            )}
          </div>
        </div>

        {/* Right: Grid Output */}
        <div className="w-full lg:w-2/3">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((variant, idx) => (
                <div key={idx} className="content-card p-3 hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden mb-3 relative">
                    {variant.image ? (
                      <img src={variant.image} alt={variant.style} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">Failed</div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white text-center uppercase tracking-wide truncate">{variant.style}</p>
                </div>
              ))}
            </div>
          ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-gray-500 bg-[#111] rounded-2xl border-2 border-dashed border-gray-800">
              {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                  <p className="font-medium">Dreaming up designs...</p>
                </>
              ) : (
                <>
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p>Select a lamp and click generate to see variations.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
