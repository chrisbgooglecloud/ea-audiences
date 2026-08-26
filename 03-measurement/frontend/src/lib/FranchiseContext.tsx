'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Franchise } from '@/types';

interface FranchiseContextType {
  currentFranchise: Franchise;
  setCurrentFranchise: (franchise: Franchise) => void;
}

const FranchiseContext = createContext<FranchiseContextType>({
  currentFranchise: 'EA Sports FC',
  setCurrentFranchise: () => {},
});

export function FranchiseProvider({ children }: { children: ReactNode }) {
  const [currentFranchise, setCurrentFranchise] = useState<Franchise>('EA Sports FC');

  return (
    <FranchiseContext.Provider value={{ currentFranchise, setCurrentFranchise }}>
      {children}
    </FranchiseContext.Provider>
  );
}

export function useFranchise() {
  return useContext(FranchiseContext);
}
