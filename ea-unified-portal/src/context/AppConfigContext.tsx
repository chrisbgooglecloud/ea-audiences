'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppConfig {
  branding: {
    companyName: string;
    logo: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    logoHeight?: number;
    metaTitle: string;
    industryType?: string;
  };
  navigation: {
    id: string;
    label: string;
    icon: string;
  }[];
  adAnalysisVideos?: Array<{ id: string; title: string; url: string; description: string; } | any>;

  sentimentAlertThreshold?: number;
  forfeitAlertFloor?: number;
  pages: {
    MARKETING_BRIEF?: {
      defaultGoal?: string;
      heroImage?: string;
    };
    CONTENT_STUDIO?: {
      primaryProductImage?: string;
      secondaryStyleReference?: string;
      multiImageReferences?: string[];
      productSpinReferences?: string[];
      contentVersioningReference?: string;
      sketchToRealityReference?: string;
      youtubeBannerTemplate?: string;
      disabledTabs?: string[];
      multiImagePersona?: string;
      multiImageProduct?: string;
      multiImageLocations?: string[];
    };
  };
}


interface AppConfigContextType {
  config: AppConfig | null;
  updateConfig: (newConfig: AppConfig) => Promise<void>;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        try { localStorage.setItem('cached_app_config', JSON.stringify(data)); } catch (e) {}
      }
    } catch (e) {
      console.error("Error loading app config:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem('cached_app_config');
      if (cached) setConfig(JSON.parse(cached));
    } catch (e) {}
    refreshConfig();
  }, []);

  const updateConfig = async (newConfig: AppConfig) => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        setConfig(newConfig);
      } else {
        console.error("Failed to update config on server");
      }
    } catch (e) {
      console.error("Error updating config:", e);
    }
  };

  return (
    <AppConfigContext.Provider value={{ config, updateConfig, isLoading, refreshConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};
