'use client';

import React from 'react';
import './globals.css';
import { FranchiseProvider, useFranchise } from '@/lib/FranchiseContext';
import { Navigation } from '@/components/Navigation';
import { ExecutiveTaskbar } from '@/components/ExecutiveTaskbar';
import { SessionAuthGate } from '@/components/SessionAuthGate';

function ShellContent({ children }: { children: React.ReactNode }) {
  const { currentFranchise, setCurrentFranchise } = useFranchise();

  return (
    <>
      <Navigation
        currentFranchise={currentFranchise}
        onSelectFranchise={setCurrentFranchise}
      />
      <ExecutiveTaskbar />
      <main className="flex-1 pb-12 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Electronic Arts • Creative Intelligence & Measurement Engine</title>
        <meta
          name="description"
          content="Electronic Arts Executive Briefing Center Measurement Dashboard"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[#0E1A29] text-white flex flex-col antialiased selection:bg-[#0072BC] selection:text-white">
        <SessionAuthGate>
          <FranchiseProvider>
            <ShellContent>{children}</ShellContent>
          </FranchiseProvider>
        </SessionAuthGate>
      </body>
    </html>
  );
}
