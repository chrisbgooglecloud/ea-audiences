'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameFranchise } from '@/types';

export interface FranchiseInfo {
  id: GameFranchise;
  label: string;
  shortName: string;
  accentColor: string;
  accentBadgeBg: string;
  accentBorder: string;
  logo: string;
  subtitle: string;
}

export const FRANCHISE_REGISTRY: Record<string, FranchiseInfo> = {
  ALL: {
    id: 'ALL',
    label: '2K Portfolio (All Franchises)',
    shortName: '2K Portfolio',
    accentColor: '#E51B24',
    accentBadgeBg: 'rgba(229, 27, 36, 0.15)',
    accentBorder: '#E51B24',
    logo: '/logos/2k_badge.png',
    subtitle: 'Take-Two Interactive Live Services & In-Game Media Network',
  },
  NBA2K26: {
    id: 'NBA2K26',
    label: 'NBA 2K26',
    shortName: 'NBA 2K',
    accentColor: '#FF2E38',
    accentBadgeBg: 'rgba(255, 46, 56, 0.15)',
    accentBorder: '#FF2E38',
    logo: '/logos/2k_badge.png',
    subtitle: 'MyCAREER, The City, MyTEAM & ProPLAY Courtside Ads',
  },
  'NBA 2K': {
    id: 'NBA2K26',
    label: 'NBA 2K26',
    shortName: 'NBA 2K',
    accentColor: '#FF2E38',
    accentBadgeBg: 'rgba(255, 46, 56, 0.15)',
    accentBorder: '#FF2E38',
    logo: '/logos/2k_badge.png',
    subtitle: 'MyCAREER, The City, MyTEAM & ProPLAY Courtside Ads',
  },
  'NBA 2K26': {
    id: 'NBA2K26',
    label: 'NBA 2K26',
    shortName: 'NBA 2K',
    accentColor: '#FF2E38',
    accentBadgeBg: 'rgba(255, 46, 56, 0.15)',
    accentBorder: '#FF2E38',
    logo: '/logos/2k_badge.png',
    subtitle: 'MyCAREER, The City, MyTEAM & ProPLAY Courtside Ads',
  },
  BORDERLANDS4: {
    id: 'BORDERLANDS4',
    label: 'Borderlands 4',
    shortName: 'Borderlands',
    accentColor: '#FFD200',
    accentBadgeBg: 'rgba(255, 210, 0, 0.15)',
    accentBorder: '#FFD200',
    logo: '/logos/2k_badge.png',
    subtitle: 'Vault Hunters, Mayhem Loot & Cel-Shaded Legendary Drops',
  },
  Borderlands: {
    id: 'BORDERLANDS4',
    label: 'Borderlands 4',
    shortName: 'Borderlands',
    accentColor: '#FFD200',
    accentBadgeBg: 'rgba(255, 210, 0, 0.15)',
    accentBorder: '#FFD200',
    logo: '/logos/2k_badge.png',
    subtitle: 'Vault Hunters, Mayhem Loot & Cel-Shaded Legendary Drops',
  },
  'Borderlands 4': {
    id: 'BORDERLANDS4',
    label: 'Borderlands 4',
    shortName: 'Borderlands',
    accentColor: '#FFD200',
    accentBadgeBg: 'rgba(255, 210, 0, 0.15)',
    accentBorder: '#FFD200',
    logo: '/logos/2k_badge.png',
    subtitle: 'Vault Hunters, Mayhem Loot & Cel-Shaded Legendary Drops',
  },
  CIV7: {
    id: 'CIV7',
    label: "Sid Meier's Civilization VII",
    shortName: 'Civ VII',
    accentColor: '#38BDF8',
    accentBadgeBg: 'rgba(56, 189, 248, 0.15)',
    accentBorder: '#38BDF8',
    logo: '/logos/2k_badge.png',
    subtitle: 'Ages of Humanity, Leader DLC & 4X Grand Strategy',
  },
  "Sid Meier's Civilization VII": {
    id: 'CIV7',
    label: "Sid Meier's Civilization VII",
    shortName: 'Civ VII',
    accentColor: '#38BDF8',
    accentBadgeBg: 'rgba(56, 189, 248, 0.15)',
    accentBorder: '#38BDF8',
    logo: '/logos/2k_badge.png',
    subtitle: 'Ages of Humanity, Leader DLC & 4X Grand Strategy',
  },
  'Civilization VII': {
    id: 'CIV7',
    label: "Sid Meier's Civilization VII",
    shortName: 'Civ VII',
    accentColor: '#38BDF8',
    accentBadgeBg: 'rgba(56, 189, 248, 0.15)',
    accentBorder: '#38BDF8',
    logo: '/logos/2k_badge.png',
    subtitle: 'Ages of Humanity, Leader DLC & 4X Grand Strategy',
  },
  WWE2K25: {
    id: 'WWE2K25',
    label: 'WWE 2K25',
    shortName: 'WWE 2K',
    accentColor: '#F59E0B',
    accentBadgeBg: 'rgba(245, 158, 11, 0.15)',
    accentBorder: '#F59E0B',
    logo: '/logos/2k_badge.png',
    subtitle: 'MyFACTION Card Packs, Universe Mode & Premium Live Events',
  },
  'WWE 2K25': {
    id: 'WWE2K25',
    label: 'WWE 2K25',
    shortName: 'WWE 2K',
    accentColor: '#F59E0B',
    accentBadgeBg: 'rgba(245, 158, 11, 0.15)',
    accentBorder: '#F59E0B',
    logo: '/logos/2k_badge.png',
    subtitle: 'MyFACTION Card Packs, Universe Mode & Premium Live Events',
  },
  PGATOUR2K: {
    id: 'PGATOUR2K',
    label: 'PGA TOUR 2K25',
    shortName: 'PGA TOUR',
    accentColor: '#10B981',
    accentBadgeBg: 'rgba(16, 185, 129, 0.15)',
    accentBorder: '#10B981',
    logo: '/logos/2k_badge.png',
    subtitle: 'Clubhouse Pass, Course Architect & PGA Tour Majors',
  },
  'PGA TOUR 2K25': {
    id: 'PGATOUR2K',
    label: 'PGA TOUR 2K25',
    shortName: 'PGA TOUR',
    accentColor: '#10B981',
    accentBadgeBg: 'rgba(16, 185, 129, 0.15)',
    accentBorder: '#10B981',
    logo: '/logos/2k_badge.png',
    subtitle: 'Clubhouse Pass, Course Architect & PGA Tour Majors',
  },
  // Legacy aliases for seamless backwards compatibility
  FC26: {
    id: 'NBA2K26',
    label: 'NBA 2K26',
    shortName: 'NBA 2K',
    accentColor: '#FF2E38',
    accentBadgeBg: 'rgba(255, 46, 56, 0.15)',
    accentBorder: '#FF2E38',
    logo: '/logos/2k_badge.png',
    subtitle: 'MyCAREER, The City, MyTEAM & ProPLAY Courtside Ads',
  },
  APEX: {
    id: 'BORDERLANDS4',
    label: 'Borderlands 4',
    shortName: 'Borderlands',
    accentColor: '#FFD200',
    accentBadgeBg: 'rgba(255, 210, 0, 0.15)',
    accentBorder: '#FFD200',
    logo: '/logos/2k_badge.png',
    subtitle: 'Vault Hunters, Mayhem Loot & Cel-Shaded Legendary Drops',
  },
  MADDEN25: {
    id: 'WWE2K25',
    label: 'WWE 2K25',
    shortName: 'WWE 2K',
    accentColor: '#F59E0B',
    accentBadgeBg: 'rgba(245, 158, 11, 0.15)',
    accentBorder: '#F59E0B',
    logo: '/logos/2k_badge.png',
    subtitle: 'MyFACTION Card Packs, Universe Mode & Premium Live Events',
  },
  BATTLEFIELD: {
    id: 'BORDERLANDS4',
    label: 'Borderlands 4',
    shortName: 'Borderlands',
    accentColor: '#FFD200',
    accentBadgeBg: 'rgba(255, 210, 0, 0.15)',
    accentBorder: '#FFD200',
    logo: '/logos/2k_badge.png',
    subtitle: 'Vault Hunters, Mayhem Loot & Cel-Shaded Legendary Drops',
  },
  SIMS4: {
    id: 'CIV7',
    label: "Sid Meier's Civilization VII",
    shortName: 'Civ VII',
    accentColor: '#38BDF8',
    accentBadgeBg: 'rgba(56, 189, 248, 0.15)',
    accentBorder: '#38BDF8',
    logo: '/logos/2k_badge.png',
    subtitle: 'Ages of Humanity, Leader DLC & 4X Grand Strategy',
  },
};


interface FranchiseContextType {
  currentFranchise: any;
  setCurrentFranchise: (franchise: any) => void;
  franchiseInfo: FranchiseInfo;
  franchises: FranchiseInfo[];
}

const FranchiseContext = createContext<FranchiseContextType | undefined>(undefined);

export function FranchiseProvider({ children }: { children: ReactNode }) {
  const [currentFranchise, setCurrentFranchise] = useState<any>('ALL');

  const normalizedKey =
    currentFranchise === 'EA Sports FC' || currentFranchise === 'EA SPORTS FC 26'
      ? 'FC26'
      : currentFranchise === 'Apex Legends'
      ? 'APEX'
      : currentFranchise === 'Battlefield' || currentFranchise === 'Battlefield 2042'
      ? 'BATTLEFIELD'
      : currentFranchise === 'The Sims' || currentFranchise === 'The Sims 4'
      ? 'SIMS4'
      : currentFranchise;

  const franchiseInfo = FRANCHISE_REGISTRY[normalizedKey] || FRANCHISE_REGISTRY.ALL;
  const uniqueFranchises = [
    FRANCHISE_REGISTRY.ALL,
    FRANCHISE_REGISTRY.FC26,
    FRANCHISE_REGISTRY.APEX,
    FRANCHISE_REGISTRY.MADDEN25,
    FRANCHISE_REGISTRY.BATTLEFIELD,
    FRANCHISE_REGISTRY.SIMS4,
  ];

  return (
    <FranchiseContext.Provider
      value={{
        currentFranchise,
        setCurrentFranchise,
        franchiseInfo,
        franchises: uniqueFranchises,
      }}
    >
      {children}
    </FranchiseContext.Provider>
  );
}

export function useFranchise() {
  const context = useContext(FranchiseContext);
  if (!context) {
    throw new Error('useFranchise must be used within a FranchiseProvider');
  }
  return context;
}
