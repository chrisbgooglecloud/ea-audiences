import React, { useState, useEffect } from 'react';
import { Sparkles, User, Plus, Trash2, Save, Loader2, Search, ImagePlus } from 'lucide-react';

export const ConciergeAdmin: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', image: '' });
    const [profilePrompt, setProfilePrompt] = useState("");
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchProfile();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/data/configuration/concierge_fashion_products.json');
            if (res.ok) {
                setProducts(await res.json());
            }
        } catch (e) {
            console.warn("Failed to load products", e);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/load-run/concierge_fashion');
            if (res.ok) {
                setProfile(await res.json());
            }
        } catch (e) {
            console.warn("Failed to load profile", e);
        }
    };

    const handleSaveProducts = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/admin/tables/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: 'concierge_fashion_products', data: products })
            });
            alert("Products saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save products.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/save-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featureId: 'concierge_fashion', data: profile })
            });
            alert("Profile updated successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateProfileWithGemini = async () => {
        if (!profile || !profilePrompt) return;
        setIsUpdatingProfile(true);
        try {
            const currentJson = JSON.stringify(profile, null, 2);
            const response = await fetch('/api/genai/generateContent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gemini-3.5-flash-lite',
                    contents: [{
                        role: 'user',
                        parts: [{ text: `You are an AI data assistant. I have the following JSON profile data for a fashion concierge. I need you to update, expand, or modify it based on the user's prompt. 
User Prompt: "${profilePrompt}"
Current JSON Data:
${currentJson}

You MUST keep the exact same JSON structure/schema as the current data. Return ONLY the raw updated JSON structure. DO NOT include markdown formatting or backticks.` }]
                    }],
                    config: { responseMimeType: 'application/json' }
                })
            });

            if (response.ok) {
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                const generatedData = JSON.parse(text.replace(/```json|```/g, '').trim());
                setProfile(generatedData);
                setProfilePrompt("");
                
                // Auto-save to server
                try {
                    await fetch('/api/save-run', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ featureId: 'concierge_fashion', data: generatedData })
                    });
                } catch (e) {
                    console.error("Auto-save failed", e);
                }
            } else {
                alert("Failed to update profile via Gemini API.");
            }
        } catch (e) {
            console.error("Gemini profile update failed", e);
            alert("Failed to update profile. Please ensure the prompt is clear.");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleAddProduct = () => {
        if (!newProduct.name || !newProduct.price) return;
        setProducts([...products, newProduct]);
        setNewProduct({ name: '', description: '', price: '', image: '' });
    };

    const handleDeleteProduct = (index: number) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            {/* Product Manager */}
            <div className="content-card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="text-[#0077C8]" size={20} /> Fashion Products Manager
                        </h3>
                        <p className="text-xs text-subtext">Manage products for the Fashion Concierge.</p>
                    </div>
                    <button onClick={handleSaveProducts} disabled={isSaving} className="btn-primary flex items-center gap-2">
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Products
                    </button>
                </div>

                {/* Add Product Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <input 
                        className="input-field text-sm" 
                        placeholder="Product Name" 
                        value={newProduct.name} 
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    />
                    <input 
                        className="input-field text-sm" 
                        placeholder="Price" 
                        value={newProduct.price} 
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    />
                    <input 
                        className="input-field text-sm md:col-span-2" 
                        placeholder="Description" 
                        value={newProduct.description} 
                        onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    />
                    <input 
                        className="input-field text-sm md:col-span-3" 
                        placeholder="Image URL" 
                        value={newProduct.image} 
                        onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                    />
                    <button onClick={handleAddProduct} className="btn-secondary flex items-center justify-center gap-2">
                        <Plus size={16} /> Add Product
                    </button>
                </div>

                {/* Product List */}
                <div className="space-y-3">
                    {products.map((prod, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {prod.image ? <img src={prod.image} className="w-full h-full object-cover" /> : <ImagePlus size={20} className="text-gray-400 m-2" />}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{prod.name}</div>
                                    <div className="text-xs text-gray-500">{prod.description}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-[#0077C8]">${prod.price}</span>
                                <button onClick={() => handleDeleteProduct(i)} className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                            No products added yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Editor */}
            <div className="content-card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <User className="text-[#0077C8]" size={20} /> Edit Last Generated Profile
                        </h3>
                        <p className="text-xs text-subtext">Update the fields of the last generated profile.</p>
                    </div>
                    <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary flex items-center gap-2">
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Update Profile
                    </button>
                </div>

                {profile ? (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Current JSON Profile</label>
                            <pre className="bg-gray-50 rounded-xl p-4 text-xs font-mono text-gray-700 border border-gray-200 max-h-[300px] overflow-auto">
                                {JSON.stringify(profile, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">What do you want to update?</label>
                            <div className="flex gap-2">
                                <textarea 
                                    className="input-field text-sm flex-1 min-h-[80px] resize-y" 
                                    placeholder="e.g. Change the name to John Doe and update the summary to mention his love for vintage cars..."
                                    value={profilePrompt}
                                    onChange={e => setProfilePrompt(e.target.value)}
                                />
                                <button 
                                    onClick={handleUpdateProfileWithGemini} 
                                    disabled={isUpdatingProfile || !profilePrompt} 
                                    className="btn-secondary flex items-center justify-center gap-2 px-4 self-end h-[42px]"
                                >
                                    {isUpdatingProfile ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                    Apply Updates
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                        No generated profile found. Run the Concierge first.
                    </div>
                )}
            </div>
        </div>
    );
};
