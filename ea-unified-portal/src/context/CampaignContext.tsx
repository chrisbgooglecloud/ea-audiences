'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CampaignBrief, CohortContext, DeepSonaResult, CreativeAsset } from '@/types';

interface CampaignContextType {
  activeBrief: CampaignBrief | null;
  setActiveBrief: (brief: CampaignBrief | null) => void;
  activeCohort: CohortContext | null;
  setActiveCohort: (cohort: CohortContext | null) => void;
  lastDeepSonaResult: DeepSonaResult | null;
  setLastDeepSonaResult: (result: DeepSonaResult | null) => void;
  selectedCreative: CreativeAsset | null;
  setSelectedCreative: (creative: CreativeAsset | null) => void;
  proposedSpend: number;
  setProposedSpend: (spend: number) => void;
  targetROAS: number;
  setTargetROAS: (roas: number) => void;
  clearCampaign: () => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [activeBrief, setActiveBrief] = useState<CampaignBrief | null>({
    brief_id: 'brief-fc26-retention-001',
    title: 'FC 26 Weekend League Loss-Streak Churn Mitigation',
    franchise: 'EA SPORTS FC 26',
    target_segment: 'Competitive Grinders on 3+ Loss Streak ($850+ Avg LTV)',
    audience_size: 245000,
    trigger_rules: [
      'Loss Streak >= 3 in FUT Champions',
      'Tilt Index > 75%',
      'LTV > $500',
    ],
    deepsona_consensus: 'Synthetic focus group confirms high willingness to engage with contextual 500 FC Points Starter + Loan Player shield ($4.99). +34.2% projected retention recovery.',
    predicted_conversion_lift: 34.2,
    projected_roi: 2.85,
    recommended_action: 'Deploy ToFu Squad Breach Hook on TikTok & Dynamic Field-Side Hoardings in Top Nielsen DMAs.',
    creative_hooks: [
      'Squad Breach & Clear 2s Action Hook',
      'Loss Streak Protection Pack Guarantee',
      'Immediate Loan Player Roster Infusion',
    ],
    generated_at: new Date().toISOString(),
  });

  const [activeCohort, setActiveCohort] = useState<CohortContext | null>({
    query: 'Competitive Grinders on 3+ Loss Streak',
    franchise: 'FC26',
    matchedCount: 1420,
    estimatedTotal: 245000,
    dominantArchetype: 'COMPETITIVE_GRINDER',
    avgSpend: 850,
    avgChurn: 0.48,
    suggestedCampaign: 'Weekend League Tilt Shield & 500 FC Points Starter',
  });

  const [lastDeepSonaResult, setLastDeepSonaResult] = useState<DeepSonaResult | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<CreativeAsset | null>(null);
  const [proposedSpend, setProposedSpend] = useState<number>(350000);
  const [targetROAS, setTargetROAS] = useState<number>(2.74);

  const clearCampaign = () => {
    setActiveBrief(null);
    setActiveCohort(null);
    setLastDeepSonaResult(null);
    setSelectedCreative(null);
  };

  return (
    <CampaignContext.Provider
      value={{
        activeBrief,
        setActiveBrief,
        activeCohort,
        setActiveCohort,
        lastDeepSonaResult,
        setLastDeepSonaResult,
        selectedCreative,
        setSelectedCreative,
        proposedSpend,
        setProposedSpend,
        targetROAS,
        setTargetROAS,
        clearCampaign,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}
