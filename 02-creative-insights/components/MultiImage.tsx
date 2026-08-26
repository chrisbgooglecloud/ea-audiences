import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Download, Image as ImageIcon, ArrowLeft, Eye, RotateCcw, Sparkles } from 'lucide-react';
import { generateImageWithReference } from '../services/geminiService';
import { brandConfig } from '../config';
import { useAppConfig } from '../context/AppConfigContext';
import { useCompanyContext } from '../context/CompanyContext';

export const MultiImage: React.FC = () => {
    const { config } = useAppConfig();
    const { name } = useCompanyContext();
    const [step, setStep] = useState(1);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Load initial reference images as base64
    useEffect(() => {
        const loadDefaults = async () => {
            const defaults = config?.pages?.CONTENT_STUDIO?.multiImageReferences || ['/images/default-pot.png', '/images/qvc-dish2.png', '/images/qvc-dish3.png'];
            if(selectedImages.length === 0) {
               setSelectedImages(defaults);
            }
            // we delay the base64 conversion until they are set
            const loaded = await Promise.all(
                defaults.map(async (path: string) => {
                    if (path.startsWith('data:')) return path;
                    try {
                        const r = await fetch(path);
                        const blob = await r.blob();
                        return new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                        });
                    } catch (e) {
                        console.error("Failed to load", path, e);
                        return path;
                    }
                })
            );
            setSelectedImages(loaded);
        };
        // wait for config to be ready
        if (config) {
            loadDefaults();
        }
    }, [config]);

    useEffect(() => {
        if (generatedImages.length > 0) {
            fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    featureId: 'multi_image',
                    data: { selectedImages, generatedImages, step: 2 }
                })
            }).catch(err => console.error("Failed to save multi-image run:", err));
        }
    }, [generatedImages, selectedImages]);

    const handleLoadLast = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/load-run/multi_image');
            if (!res.ok) throw new Error("No saved run");
            const data = await res.json();
            if (data.selectedImages) setSelectedImages(data.selectedImages);
            if (data.generatedImages) {
                setGeneratedImages(data.generatedImages);
                setStep(2);
            }
        } catch (e) {
            console.warn("Load error:", e);
            alert("No saved run found.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setSelectedImages(prev => [...prev, base64]);
                setGeneratedImages([]);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (selectedImages.length === 0) return;

        setLoading(true);
        setError(null);
        setGeneratedImages([]);

        try {
            const persona = config?.pages?.CONTENT_STUDIO?.multiImagePersona || "younger Gen-Z woman in her 20s";
            const product = config?.pages?.CONTENT_STUDIO?.multiImageProduct || "sandals";
            const locations = config?.pages?.CONTENT_STUDIO?.multiImageLocations || ['At Home', 'Out with Friends', 'At a Festival'];

            const personaVariations = locations.map(loc => ({
                persona: loc,
                description: `A lifestyle image of a ${persona} ${loc}. The person should be the main character of the shot. Ensure the product (${product}) from the reference images is naturally integrated into the scene.`
            }));

            const results: string[] = [];
            
            // Process all 3 in parallel
            const batchResults = await Promise.all(personaVariations.map(async (item) => {
                const prompt = `Create a high-quality 16:9 lifestyle image of a ${persona} ${item.persona}. ${item.description}. Photorealistic, professional photography, soft lighting, aspirational yet relatable. IMPORTANT: DO NOT generate any text, logos, branding, or watermarks in the image. The scene should be purely visual.`;
                
                const img = await generateImageWithReference(prompt, selectedImages, 'image/png', 'gemini-3.1-flash-lite-image', '16:9');
                return img ? img : null;
            }));
            
            results.push(...batchResults.filter((img): img is string => img !== null));

            if (results.length > 0) {
                setGeneratedImages(results);
                setStep(2);
            } else {
                setError("No images were generated. Please check your API configuration.");
            }
        } catch (err) {
            console.error("Generation error:", err);
            setError("Failed to generate scenes. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-header">Multi-Image Generator</h2>
            </div>

            {step === 1 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[600px] flex flex-col justify-center max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <ImageIcon size={24} className="text-gray-500" /> Reference Assets
                        </h3>
                        <button
                            onClick={handleLoadLast}
                            className="text-gray-500 hover:text-blue-600 font-medium flex items-center gap-2"
                            title="Replay last run"
                        >
                            <RotateCcw size={16} /> Load Last Run
                        </button>
                    </div>

                    <div className="space-y-8">
                        {selectedImages.length === 0 ? (
                            <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-all bg-white group shadow-sm">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="bg-gray-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-10 h-10 text-blue-600" />
                                    </div>
                                    <p className="mb-2 text-lg text-gray-900 font-medium">Upload Reference Images</p>
                                    <p className="text-sm text-gray-500">Click to browse or drag and drop</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                            </label>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {selectedImages.map((img, idx) => (
                                        <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white h-64 flex items-center justify-center group">
                                            <img src={img} alt={`Reference ${idx + 1}`} className="max-w-full max-h-full object-contain p-4" />
                                            <button
                                                onClick={() => { setSelectedImages(prev => prev.filter((_, i) => i !== idx)); }}
                                                className="absolute top-4 right-4 bg-white p-2 rounded-full text-gray-500 hover:text-red-500 shadow-md transition-colors border border-gray-200 opacity-0 group-hover:opacity-100"
                                                title="Remove image"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-all bg-white group shadow-sm">
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="w-8 h-8 text-blue-400 group-hover:text-blue-600 mb-2" />
                                            <span className="text-xs font-semibold text-gray-500">Add More</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg`}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} /> Generate 3 Lifestyle Scenes</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fadeIn">
                    <button
                        onClick={() => setStep(1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} /> Back to Upload
                    </button>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[600px]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="section-header">Generated Variations (16:9)</h3>
                            {loading && (
                                <div className="flex items-center gap-2 text-red-600 font-medium animate-pulse">
                                    <Loader2 className="animate-spin" size={18} /> Generating High-Res Images...
                                </div>
                            )}
                        </div>

                        {loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="aspect-video bg-gray-100 rounded-xl animate-pulse border border-gray-200 flex items-center justify-center">
                                        <ImageIcon className="text-gray-300" size={48} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {!loading && error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium text-center">
                                {error}
                            </div>
                        )}

                        {!loading && generatedImages.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {generatedImages.map((img, idx) => (
                                    <div key={idx} className="aspect-video bg-white rounded-xl overflow-hidden shadow-sm relative group border border-gray-200 hover:shadow-lg transition-all transform hover:-translate-y-1">
                                        <img src={img} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => setPreviewImage(img)}
                                                className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2 transform scale-90 group-hover:scale-100 duration-200"
                                            >
                                                <Eye size={18} /> Preview
                                            </button>
                                            <a
                                                href={img}
                                                download={`${name || 'brand'}_variant_${idx + 1}.jpg`}
                                                className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2 transform scale-90 group-hover:scale-100 duration-200"
                                            >
                                                <Download size={18} /> Download
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-12 transition-all animate-fadeIn">
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-8 right-8 text-white/70 hover:text-white bg-white/10 p-3 rounded-full transition-all hover:bg-white/20 z-10"
                    >
                        ✕
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleIn"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
