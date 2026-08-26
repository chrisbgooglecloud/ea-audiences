import React, { useState, useEffect } from 'react';
import { brandConfig } from './config';
import { AppMode, CombinedPersona } from './types';
import { Navigation } from './components/Navigation';
import { PDPHub } from './components/PDPHub';
import { PDPEnrichment } from './components/PDPEnrichment';
import { MultiImage } from './components/MultiImage';
import { PDPPersonalization } from './components/PDPPersonalization';
import { ESpots } from './components/ESpots';
import { GenSiteStub } from './components/GenSiteStub';
import { AudienceGenerator } from './components/AudienceGenerator';
import { MarketingCampaign } from './components/MarketingCampaign';
import { ContentVersioning } from './components/ContentVersioning';
import { MarketingBrief } from './components/MarketingBrief';
import { SyntheticChat } from './components/SyntheticChat';
import { SyntheticTesting } from './components/SyntheticTesting';
import { Home } from './components/Home';
import { CompanyContext } from './components/CompanyContext';
import { ProjectHelper } from './components/ProjectHelper';
import { FeasibilityAnalysis } from './components/FeasibilityAnalysis';
import { RunwayAnalysis } from './components/RunwayAnalysis';

import { Assistant } from './components/Assistant';
import { Concierge } from './components/Concierge';
import { ConciergeFashion } from './components/ConciergeFashion';
import { SyntheticUsers } from './components/SyntheticUsers';
import { AppConfigProvider, useAppConfig } from './context/AppConfigContext';
import { CompanyProvider } from './context/CompanyContext';
import { Admin } from './components/Admin';
import { ProductSpin } from './components/ProductSpin';
import { ContentAudit } from './components/ContentAudit';
import PlaygroundConsole from './components/PlaygroundConsole';
import { IngestionEngine } from './components/IngestionEngine';
import { PredictiveDelivery } from './components/PredictiveDelivery';
import { ContentHub } from './components/ContentHub';
import { PersonalizeContent } from './components/PersonalizeContent';
import { FullAudit } from './components/FullAudit';

function App() {
  return (
    <AppConfigProvider>
      <CompanyProvider>
        <AppContent />
      </CompanyProvider>
    </AppConfigProvider>
  );
}

function AppContent() {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [personas, setPersonas] = useState<CombinedPersona[]>([]);
  const { config } = useAppConfig();
  const [startupCheck, setStartupCheck] = useState<any>(null);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    // Fetch startup checks on application load
    fetch('/api/startup-checks')
      .then(res => res.json())
      .then(data => {
        console.log("[AppContent] Startup checks completed:", data);
        setStartupCheck(data);
      })
      .catch(err => console.error("Failed to load startup checks:", err));
  }, []);

  useEffect(() => {
    if (config?.branding.companyName) {
      document.title = config.branding.companyName;
    } else {
      document.title = brandConfig.meta.title;
    }

    // Load audiences from the file system explicitly if they exist
    const loadAudiences = async () => {
      try {
        const res = await fetch('/api/load-run/audience_generator');
        if (res.ok) {
          const data = await res.json();
          if (data.personas && Array.isArray(data.personas)) {
            setPersonas(data.personas);
          }
        }
      } catch (err) {
        console.warn("No saved audience run found, starting empty.", err);
      }
    };
    loadAudiences();

    
  }, [config]);

  

  const renderContent = () => {
    switch (mode) {
      case AppMode.PDP_HUB:
        return <PDPHub />;
      case AppMode.INSIGHTS:
        return <RunwayAnalysis />;
      case AppMode.BULK_INSIGHTS:
        return <RunwayAnalysis showBulk={true} />;
      case AppMode.PDP_PERSONALIZATION:
        return <PDPPersonalization />;
      case AppMode.PDP_ENRICHMENT:
        return <PDPEnrichment />;
      case AppMode.MULTI_IMAGE:
        return <MultiImage />;
      case AppMode.E_SPOTS:
        return <ESpots />;
      case AppMode.CONTENT_VERSIONING:
        return <ContentVersioning />;
      case AppMode.GEN_SITE:
        return <GenSiteStub />;
      case AppMode.PRODUCT_SPIN:
        return <ProductSpin />;
      case AppMode.AUDIENCE_GEN:
      case AppMode.AUDIENCE_CREATION:
        return (
          <AudienceGenerator 
            personas={personas} 
            setPersonas={setPersonas} 
          />
        );
      case AppMode.MARKETING_CAMPAIGN:
        return <MarketingCampaign />;
      case AppMode.MARKETING_BRIEF:
        return <MarketingBrief />;
      case AppMode.SYNTHETIC_CHAT:
        return <SyntheticChat />;

      case AppMode.SYNTHETIC_FOCUS_GROUP:
        return <SyntheticTesting />;
      case AppMode.FEASIBILITY_ANALYSIS:
        return <FeasibilityAnalysis />;
      case AppMode.PROJECT_HELPER:
        return <ProjectHelper />;
      case AppMode.ASSISTANT:
        return <Assistant />;
      case AppMode.CONCIERGE:
        return config?.branding.industryType === 'Fashion' ? <ConciergeFashion /> : <Concierge />;
      case AppMode.COMPANY_CONTEXT:
        return <CompanyContext  />;
      case AppMode.CONTENT_AUDIT:
        return <ContentAudit />;
      case AppMode.AGENT_PLAYGROUND:
        return <PlaygroundConsole />;
      case AppMode.ADMIN:
        return <Admin />;
      case AppMode.CONTENT_HUB:
        return <ContentHub />;
      case AppMode.PERSONALIZE_CONTENT:
        return <PersonalizeContent />;
      case AppMode.INGESTION_ENGINE:
        return <IngestionEngine />;
      case AppMode.PREDICTIVE_DELIVERY:
        return <PredictiveDelivery />;
      case AppMode.AUDIT:
        return <RunwayAnalysis initialTab="audit" />;
      case AppMode.HOME:
      default:
        return (
          <Home setMode={setMode} startupCheck={startupCheck} />
        );
    }
  };

  return (
    <div className="app-container font-sans">
      <Navigation
        currentMode={mode}
        setMode={setMode}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <main className={`
        main-content p-4 md:p-8 transition-all duration-300
        mt-16 md:mt-0 min-w-0 flex-1
      `}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
