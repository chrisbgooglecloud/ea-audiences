'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SpannerDataSource = 'live_spanner' | 'synthetic_bq' | 'mock_cache';

interface SimulationContextType {
  dataSource: SpannerDataSource;
  setDataSource: (source: SpannerDataSource) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [dataSource, setDataSource] = useState<SpannerDataSource>('live_spanner');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  return (
    <SimulationContext.Provider
      value={{
        dataSource,
        setDataSource,
        simulationSpeed,
        setSimulationSpeed,
        isSimulating,
        setIsSimulating,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
