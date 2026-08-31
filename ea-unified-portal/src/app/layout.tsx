import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import {
  FranchiseProvider,
  CampaignProvider,
  A2AEventBusProvider,
  SimulationProvider,
  AppConfigProvider,
  CompanyProvider,
} from '@/context';
import { GlobalHeader } from '@/components/shell/GlobalHeader';
import { ActStepper } from '@/components/shell/ActStepper';
import { A2AProtocolDrawer } from '@/components/shell/A2AProtocolDrawer';


export const metadata: Metadata = {
  title: '2K Executive Briefing Center • Take-Two Interactive AI Platform',
  description: 'Closed-loop AI platform across Audiences, Creative Studio, Predictive Measurement & Dynamic 3D In-Game Commerce Media for 2K Games.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0E1A29] text-white min-h-screen flex flex-col antialiased selection:bg-[#E51B24] selection:text-white">

        <AppConfigProvider>
          <CompanyProvider>
            <FranchiseProvider>
              <CampaignProvider>
                <A2AEventBusProvider>
                  <SimulationProvider>
                    <GlobalHeader />
                    <ActStepper />
                    <main className="flex-1 w-full min-h-[calc(100vh-84px)] relative">
                      {children}
                    </main>
                    <A2AProtocolDrawer />
                  </SimulationProvider>
                </A2AEventBusProvider>
              </CampaignProvider>
            </FranchiseProvider>
          </CompanyProvider>
        </AppConfigProvider>
      </body>
    </html>
  );
}
