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
    label: 'EA Portfolio (All Franchises)',
    shortName: 'EA Portfolio',
    accentColor: '#0072BC',
    accentBadgeBg: 'rgba(0, 114, 188, 0.15)',
    accentBorder: '#0072BC',
    logo: '/logos/ea_badge_white.png',
    subtitle: 'Cross-Portfolio Live Services & Commerce Network',
  },
  FC26: {
    id: 'FC26',
    label: 'EA SPORTS FC 26',
    shortName: 'FC 26',
    accentColor: '#E6FF00',
    accentBadgeBg: 'rgba(230, 255, 0, 0.15)',
    accentBorder: '#E6FF00',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'Ultimate Team, Clubs & Field-Side Dynamic Billboards',
  },
  'EA Sports FC': {
    id: 'FC26',
    label: 'EA SPORTS FC 26',
    shortName: 'FC 26',
    accentColor: '#E6FF00',
    accentBadgeBg: 'rgba(230, 255, 0, 0.15)',
    accentBorder: '#E6FF00',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'Ultimate Team, Clubs & Field-Side Dynamic Billboards',
  },
  APEX: {
    id: 'APEX',
    label: 'Apex Legends',
    shortName: 'Apex',
    accentColor: '#00F0FF',
    accentBadgeBg: 'rgba(0, 240, 255, 0.15)',
    accentBorder: '#00F0FF',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'Battle Pass Ultimate+, ALGS & Squad Breaches',
  },
  'Apex Legends': {
    id: 'APEX',
    label: 'Apex Legends',
    shortName: 'Apex',
    accentColor: '#00F0FF',
    accentBadgeBg: 'rgba(0, 240, 255, 0.15)',
    accentBorder: '#00F0FF',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'Battle Pass Ultimate+, ALGS & Squad Breaches',
  },
  MADDEN25: {
    id: 'MADDEN25',
    label: 'Madden NFL 25',
    shortName: 'Madden 25',
    accentColor: '#00FF88',
    accentBadgeBg: 'rgba(0, 255, 136, 0.15)',
    accentBorder: '#00FF88',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'MUT Field Pass & Gameday Weather Demands',
  },
  BATTLEFIELD: {
    id: 'BATTLEFIELD',
    label: 'Battlefield 2042',
    shortName: 'Battlefield',
    accentColor: '#FF7A00',
    accentBadgeBg: 'rgba(255, 122, 0, 0.15)',
    accentBorder: '#FF7A00',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'Squad Conquest, Elite Upgrades & Tactical Vehicles',
  },
  Battlefield: {
    id: 'BATTLEFIELD',
    label: 'Battlefield 2042',
    shortName: 'Battlefield',
    accentColor: '#FF7A00',
    accentBadgeBg: 'rgba(255, 122, 0, 0.15)',
    accentBorder: '#FF7A00',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'Squad Conquest, Elite Upgrades & Tactical Vehicles',
  },
  SIMS4: {
    id: 'SIMS4',
    label: 'The Sims 4',
    shortName: 'The Sims',
    accentColor: '#A855F7',
    accentBadgeBg: 'rgba(168, 85, 247, 0.15)',
    accentBorder: '#A855F7',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'Expansion Creator Kits, Lovestruck & Lifestyle DLC',
  },
  'The Sims': {
    id: 'SIMS4',
    label: 'The Sims 4',
    shortName: 'The Sims',
    accentColor: '#A855F7',
    accentBadgeBg: 'rgba(168, 85, 247, 0.15)',
    accentBorder: '#A855F7',
    logo: '/logos/ea_logo_blue.svg',
    subtitle: 'Expansion Creator Kits, Lovestruck & Lifestyle DLC',
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
