import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Play, Video, RotateCcw } from 'lucide-react';
import { generateProductSpinVideo, fileToGenerativePart, saveImageToGCS } from '@/services/geminiService';
import { useAppConfig } from '@/context';
import { useCompanyContext } from '@/context';

export const ProductSpin: React.FC = () => {
    const { name: companyName } = useCompanyContext();
    const { config } = useAppConfig();
    const defaultReferences = config?.pages?.CONTENT_STUDIO?.productSpinReferences || ['/images/default-pot.png', '/images/qvc-dish2.png'];
    const [images, setImages] = useState<string[]>(defaultReferences);
    const [prompt, setPrompt] = useState<string>("Cinematic 360-degree slow motion orbit camera pan around the product on pedestal, studio commercial lighting.");
    const [loading, setLoading] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setLoading(true);
        try {
            // Convert new files to base64
            const newImagesCheck = await Promise.all(Array.from(files).map(file => fileToGenerativePart(file)));
            const newImagesBase64 = newImagesCheck.map(img => `data:image/jpeg;base64,${img}`);

            // Save each new image to the server and get the URL
            const savedUrls = await Promise.all(newImagesBase64.map(async (b64) => {
                const url = await saveImageToGCS(b64, 'spin_ref', companyName);
                return url;
            }));

            // Filter out any nulls if saving failed
            const validUrls = savedUrls.filter(url => url !== null) as string[];
            setImages(prev => [...prev, ...validUrls]);
        } catch (err) {
            console.error("Failed to upload and save images:", err);
            setError("Failed to process images.");
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (images.length === 0) return;
        setLoading(true);
        setError(null);
        setGeneratedVideo(null);

        try {
            // Take up to 4 images as per typical Veo capabilities/best practices for this task
            // The prompt implies multiple images can be used for reference
            const videoUrl = await generateProductSpinVideo(images, prompt);

            if (videoUrl) {
                setGeneratedVideo(videoUrl);

                // Save run metadata
                try {
                    await fetch('/api/save-run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            featureId: 'product_spin',
                            data: {
                                timestamp: new Date().toISOString(),
                                images: images, // Use stored URLs
                                prompt: prompt,
                                videoUrl: videoUrl
                            }
                        })
                    });
                } catch (e) {
                    console.error("Failed to save run metadata", e);
                }

            } else {
                setError("Failed to generate video. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred during generation.");
        } finally {
            setLoading(false);
        }
    };
    const handleLoadLast = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/load-run/product_spin');
            if (res.ok) {
                const run = await res.json();
                if (run.videoUrl) {
                    setGeneratedVideo(run.videoUrl);
                }
                if (run.images) {
                    setImages(run.images);
                }
                if (run.prompt) {
                    setPrompt(run.prompt);
                }
            } else {
                setError("No previous run found.");
            }
        } catch (err) {
            console.error("Failed to load last run:", err);
            setError("Failed to load last session.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <h2 className="section-header justify-center text-4xl">
                    PRODUCT <span className="text-[#0077C8] ml-2">SPIN</span>
                </h2>
                <p className="text-subtext max-w-2xl mx-auto">
                    Generate a dynamic 360° product spin video using Veo 3.1. Upload multiple angles for best results.
                </p>
            </div>

            {/* Upload Area */}
            <div className="content-card p-8">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-heading mb-2">
                        Reference Images (Upload Front, Back, Sides)
                    </label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200 bg-gray-50 rounded-xl p-8 hover:bg-gray-100 transition-colors cursor-pointer flex flex-col items-center justify-center text-center h-48 group basic-transition"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                        />
                        <Upload className="text-gray-400 group-hover:text-[#0077C8] mb-4 transition-colors" size={32} />
                        <p className="text-heading font-medium">Click to upload images</p>
                        <p className="text-subtext text-sm mt-1">JPG, PNG supported</p>
                    </div>
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                                <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-full object-contain p-2" />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-sm border border-gray-100"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Prompt Editor */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-heading mb-3 flex items-center gap-2">
                        <Video size={16} className="text-[#0077C8]" />
                        Generation Prompt
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the product spin context..."
                        className="w-full h-32 p-4 rounded-xl border border-gray-200 bg-white text-heading focus:ring-2 focus:ring-[#0077C8] focus:border-transparent transition-all resize-none shadow-inner"
                    />
                    <p className="text-subtext text-xs mt-2 italic">
                        The AI will use the uploaded images as its primary visual reference while following this prompt.
                    </p>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                    <div></div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleLoadLast}
                            disabled={loading}
                            className="btn-secondary px-6 py-3 rounded-full text-sm flex items-center gap-2"
                        >
                            <RotateCcw size={16} /> LOAD LAST SPIN
                        </button>

                        <button
                            onClick={handleGenerate}
                            disabled={images.length === 0 || loading}
                            className={`
                                btn-primary px-8 py-3 rounded-full font-bold flex items-center gap-3 transition-all transform hover:scale-105
                                ${images.length === 0 || loading ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}
                            `}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    GENERATING VEO VIDEO...
                                </>
                            ) : (
                                <>
                                    <Video size={20} />
                                    GENERATE SPIN VIDEO
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg text-center font-medium animate-fadeIn">
                    {error}
                </div>
            )}

            {/* Result Area */}
            {generatedVideo && (
                <div className="content-card p-8 animate-slideUp">
                    <h3 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
                        <Play className="text-[#0077C8]" /> Generated Video
                    </h3>
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 max-w-4xl mx-auto">
                        <video
                            src={generatedVideo}
                            controls
                            autoPlay
                            loop
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <a
                            href={generatedVideo}
                            download="product_spin.mp4"
                            className="text-[#0077C8] font-bold hover:underline flex items-center gap-2"
                        >
                            <Video size={16} /> Download Video
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};
