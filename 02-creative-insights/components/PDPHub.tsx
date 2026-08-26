import React, { useState } from 'react';
import { PDPEnrichment } from './PDPEnrichment';
import { MultiImage } from './MultiImage';
import { PDPPersonalization } from './PDPPersonalization';
import { ESpots } from './ESpots';
import { ContentVersioning } from './ContentVersioning';
import { GenSiteStub } from './GenSiteStub';
import { ProductSpin } from './ProductSpin';
import { GenerateNewProduct } from './GenerateNewProduct';
import { YouTubeBanner } from './YouTubeBanner';
import { ImagePlus, Heart, Sparkles, Target, Tag, Globe, Video, Layers, Youtube, Box, Wand2 } from 'lucide-react';
import { useAppConfig } from '../context/AppConfigContext';


type HubTab = 'PERSONALIZATION' | 'ENRICHMENT' | 'ESPOTS' | 'CONTENT_VERSIONING' | 'GENSITE' | 'MULTI_IMAGE' | 'PRODUCT_SPIN' | 'NEW_PRODUCT' | 'YOUTUBE_BANNER';

export const PDPHub: React.FC = () => {
    const { config } = useAppConfig();
    const disabledTabs = config?.pages?.CONTENT_STUDIO?.disabledTabs || [];

    const allTabs = [
        { id: 'PERSONALIZATION', label: 'PDP Personalization', icon: <Target size={18} /> },
        { id: 'NEW_PRODUCT', label: 'Sketch to Reality', icon: <Sparkles size={18} /> },
        { id: 'MULTI_IMAGE', label: 'Multi-Image', icon: <ImagePlus size={18} /> },
        { id: 'CONTENT_VERSIONING', label: 'Content Versions', icon: <Layers size={18} /> },
        { id: 'YOUTUBE_BANNER', label: 'YouTube Banner', icon: <Youtube size={18} /> },
        { id: 'PRODUCT_SPIN', label: '3D Product Spin', icon: <Box size={18} /> }
    ] as const;

    const visibleTabs = allTabs.filter(tab => !disabledTabs.includes(tab.id));

    const [activeTab, setActiveTab] = useState<HubTab>(visibleTabs[0]?.id as HubTab || 'PERSONALIZATION');

    return (
        <div className="app-container flex-col w-full">
            {/* Top Bar */}
            <div className="page-header">
                <div className="max-w-7xl mx-auto px-6 w-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <Layers className="text-[#0077C8]" size={24} />
                            <h1 className="page-title">Content Studio</h1>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tab-scroll-container">
                        {visibleTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as HubTab)}
                                className={`tab-button ${activeTab === tab.id ? 'active' : 'inactive'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'MULTI_IMAGE' && <MultiImage />}
                    {activeTab === 'PERSONALIZATION' && <PDPPersonalization />}
                    {activeTab === 'NEW_PRODUCT' && <GenerateNewProduct />}
                    {activeTab === 'YOUTUBE_BANNER' && <YouTubeBanner />}

                    {activeTab === 'ENRICHMENT' && <PDPEnrichment />}
                    {activeTab === 'CONTENT_VERSIONING' && <ContentVersioning />}
                    {activeTab === 'PRODUCT_SPIN' && <ProductSpin />}
                    {activeTab === 'GENSITE' && <GenSiteStub />}

                </div>
            </div>
        </div>
    );
};
