import React, { useState, useEffect } from 'react';
import { generateImageWithReference } from '@/services/geminiService';
import { useAppConfig } from '@/context';
import { brandConfig } from '@/config';
import { Youtube, ImagePlus, Download, Eye, Loader2, X, CheckCircle, Sparkles, History } from 'lucide-react';

export const YouTubeBanner: React.FC = () => {
    const { config } = useAppConfig();
    const [step, setStep] = useState(1);
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<(string | null)[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [templateImage, setTemplateImage] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        // Load default template from admin config
        const defaultTemplate = config?.pages?.CONTENT_STUDIO?.youtubeBannerTemplate || '/images/qvc-ad.png';
        
        // Check if it's a URL and fetch as base64 to pass to the API if needed
        const loadBase64 = async () => {
            try {
                if (defaultTemplate.startsWith('data:')) {
                    setTemplateImage(defaultTemplate);
                    return;
                }
                const response = await fetch(defaultTemplate);
                if (!response.ok) throw new Error('Failed to fetch template');
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setTemplateImage(reader.result as string);
                };
                reader.readAsDataURL(blob);
            } catch (e) {
                console.error("Failed to load banner template", e);
                setTemplateImage(defaultTemplate); // Fallback to URL
            }
        };
        loadBase64();
    }, [config]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTemplateImage(reader.result as string);
                setUploadError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setUploadError("Please enter a text modification prompt.");
            return;
        }
        if (!templateImage) {
            setUploadError("Template image is missing. Please configure it in Admin Console or upload one.");
            return;
        }

        setIsGenerating(true);
        setUploadError(null);
        setGeneratedImages([null, null, null]);
        setPreviewImage(null);
        setStep(2); // Move to step 2 immediately

        const resultsArray = [null, null, null] as (string | null)[];
        let completedCount = 0;

        const checkCompletion = () => {
            completedCount++;
            if (completedCount === 3) {
                setIsGenerating(false);
                // Auto-save to server
                fetch('/api/save-run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        featureId: 'youtube_banner',
                        data: { prompt, generatedImages: resultsArray }
                    })
                }).catch(err => console.error("Failed to save run:", err));
            }
        };

        Array(3).fill(0).forEach((_, index) => {
            generateImageWithReference(
                `Create a high-quality YouTube channel banner. Modify the text in the image as follows: "${prompt}". Keep the original style, layout, and background intact. Aspect ratio 16:9. Photorealistic, sharp text, professional design.`,
                [templateImage],
                "image/png",
                "gemini-3.1-flash-lite-image",
                "16:9"
            ).then(img => {
                if (img) {
                    resultsArray[index] = img;
                    setGeneratedImages([...resultsArray]);
                }
            }).catch(error => {
                console.error("Generation error:", error);
            }).finally(() => checkCompletion());
        });
    };

    const handleLoadLast = async () => {
        setIsGenerating(true);
        setUploadError(null);
        try {
            const res = await fetch('/api/load-run/youtube_banner');
            if (res.ok) {
                const data = await res.json();
                if (data.prompt) setPrompt(data.prompt);
                if (data.generatedImages && data.generatedImages.length > 0) {
                    setGeneratedImages(data.generatedImages);
                    setStep(2);
                }
            } else {
                setUploadError("No previous run found.");
            }
        } catch (e) {
            console.error("Load error:", e);
            setUploadError("Failed to load last run.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        setStep(1);
        setPrompt("");
        setGeneratedImages([]);
        setPreviewImage(null);
        setUploadError(null);
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="section-header">YouTube Banner Generator</h2>
                <div className="flex items-center gap-4">
                    <button onClick={handleLoadLast} disabled={isGenerating} className="flex items-center gap-2 text-subtext hover:text-[#0077C8] font-bold transition-colors disabled:opacity-50">
                        <History size={16} /> Load Last Run
                    </button>
                    {step > 1 && (
                        <button onClick={handleReset} className="text-subtext hover:text-[#0077C8] underline font-bold">
                            Start Over
                        </button>
                    )}
                </div>
            </div>

            {step === 1 && (
                <div className="bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 text-white p-8 min-h-[600px] max-w-2xl mx-auto flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center justify-center shadow-sm">
                            <Youtube size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Customize Banner</h3>
                            <p className="text-sm text-slate-400">Modify the text on your standard channel art.</p>
                        </div>
                    </div>

                    {uploadError && (
                        <div className="p-4 bg-rose-950/40 text-rose-300 rounded-xl border border-rose-500/30 mb-6 text-sm font-bold flex items-center gap-2">
                            <X size={16} /> {uploadError}
                        </div>
                    )}

                    <div className="space-y-8">
                        <div>
                            <label className="form-label block mb-2">Banner Template</label>
                            <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-slate-950 aspect-video flex items-center justify-center p-4 shadow-inner">
                                {templateImage ? (
                                    <img src={templateImage} alt="Template" className="max-w-full max-h-full object-contain rounded shadow-sm" />
                                ) : (
                                    <div className="text-gray-400 font-medium">No template configured</div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="btn-primary cursor-pointer flex items-center gap-2 shadow-lg">
                                        <ImagePlus size={18} /> Change Template
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="form-label block mb-2">Text Modification Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. Change the text from 'Learn about ETFs' to 'Your Guide to Stocks'"
                                className="input-field min-h-[100px] text-base py-3"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim() || !templateImage}
                            className="w-full btn-primary py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} /> Generating 3 Variations...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={24} /> Generate Banners
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fadeIn">
                    <div className="bg-[#0D131D]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 text-white p-8 min-h-[600px]">
                        <div className="flex flex-col gap-3 mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <CheckCircle size={20} className="text-green-600" /> Select the Best Variation
                            </h3>
                            <p className="text-sm text-slate-300 italic bg-black/60 p-3 rounded-xl border border-white/10 text-slate-300 shadow-inner">
                                <span className="font-bold not-italic text-white">Prompt:</span> "{prompt}"
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {generatedImages.map((img, idx) => (
                                <div key={idx} className="flex flex-col gap-4">
                                    <div className="aspect-video bg-gray-50 rounded-xl overflow-hidden shadow-md border border-gray-200 group relative flex items-center justify-center">
                                        {img ? (
                                            <>
                                                <img src={img} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover animate-fadeIn" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 backdrop-blur-sm">
                                                    <button
                                                        onClick={() => setPreviewImage(img)}
                                                        className="btn-primary px-4 py-2 text-black font-black rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all flex items-center gap-2"
                                                    >
                                                        <Eye size={18} /> Preview
                                                    </button>
                                                    <a
                                                        href={img}
                                                        download={`youtube_banner_variant_${idx + 1}.png`}
                                                        className="bg-[#0077C8] text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-[#005a9e] transition-all flex items-center gap-2"
                                                    >
                                                        <Download size={18} /> Download
                                                    </a>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400 gap-2 animate-pulse">
                                                <Loader2 className="animate-spin" size={24} />
                                                <span className="text-xs font-bold">Generating...</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center font-bold text-sm text-slate-400 uppercase tracking-widest">
                                        Variation {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {previewImage && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-12 transition-all animate-fadeIn">
                    <button onClick={() => setPreviewImage(null)} className="absolute top-8 right-8 text-white/70 hover:text-white bg-white/10 p-3 rounded-full transition-all hover:bg-white/20 z-10">
                        <X size={24} />
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scaleIn" />
                    </div>
                </div>
            )}
        </div>
    );
};
