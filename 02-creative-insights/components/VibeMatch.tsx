import React, { useState } from 'react';
import { fileToGenerativePart, generateVibeMatches } from '../services/geminiService';
import { VibeMatchResult } from '../types';

export const VibeMatch: React.FC = () => {
    const [inputImage, setInputImage] = useState<string | null>(null);
    const [result, setResult] = useState<any | null>(null); // Using any for flexibility with the new structure
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToGenerativePart(e.target.files[0]);
            setInputImage(base64);
            handleAnalyze(base64);
        }
    };

    const handleAnalyze = async (base64: string) => {
        setIsLoading(true);
        try {
            const analysis = await generateVibeMatches(base64);
            setResult(analysis);
        } catch (error) {
            console.error(error);
            alert("Could not analyze vibe.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-10">
                <h2 className="section-header justify-center mb-2">Vibe Match</h2>
                <p className="text-subtext">Upload an inspiration photo. We'll find the style that fits.</p>
            </div>

            <div className="content-card overflow-hidden">
                <div className="p-8 bg-[#151515] border-b border-gray-800">
                    <div className="flex flex-col items-center">
                        <div className="relative group w-full max-w-md aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-gray-700 hover:border-white transition-colors">
                            {inputImage ? (
                                <img src={`data:image/jpeg;base64,${inputImage}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Inspiration" />
                            ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-medium">Drop an image (Pinterest, Instagram, Nature)</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <h3 className="text-xl font-semibold text-white">Analyzing Aesthetics...</h3>
                        <p className="text-gray-400">Extracting color palette and generating matching products.</p>
                    </div>
                )}

                {!isLoading && result && (
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 mb-8">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Detected Mood</h3>
                                <p className="text-2xl font-serif italic text-white">"{result.mood}"</p>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Color Palette</h3>
                                <div className="flex gap-2">
                                    {result.colors.map((c: string, i: number) => (
                                        <div key={i} className="w-12 h-12 rounded-full shadow-sm border border-gray-700 transform hover:scale-110 transition-transform" style={{ backgroundColor: c }} title={c}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white mb-6">Matches from Brand</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {result.suggestedProducts.map((prod: any, idx: number) => (
                                    <div key={idx} className="group cursor-pointer">
                                        <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3 relative bg-gray-900">
                                            {prod.image ? (
                                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Image</div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/80 p-1.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                                            </div>
                                        </div>
                                        <h4 className="font-semibold text-white text-sm">{prod.name}</h4>
                                        <p className="text-white font-bold text-sm">${prod.price}</p>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{prod.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
