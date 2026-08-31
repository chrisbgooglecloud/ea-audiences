'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFranchise, FRANCHISE_REGISTRY } from '@/context/FranchiseContext';
import { useA2AEventBus } from '@/context/A2AEventBusContext';
import { useSimulation } from '@/context/SimulationContext';
import { GameFranchise } from '@/types';
import {
  ChevronDown,
  Radio,
  Sparkles,
  Database,
  Layers,
  Users,
  Palette,
  BarChart3,
  Box,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export function GlobalHeader() {
  const pathname = usePathname();
  const { currentFranchise, setCurrentFranchise, franchiseInfo, franchises } = useFranchise();
  const { isDrawerOpen, setIsDrawerOpen, unreadCount, messages } = useA2AEventBus();
  const { dataSource, setDataSource } = useSimulation();
  const [isFranchiseDropdownOpen, setIsFranchiseDropdownOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Mission Control', icon: Compass, badge: 'Overview' },
    { href: '/audiences', label: 'Act 1: Audiences', icon: Users, badge: 'DeepSona' },
    { href: '/creative', label: 'Act 2: Creative Studio', icon: Palette, badge: 'Gen AI' },
    { href: '/measurement', label: 'Act 3: Measurement', icon: BarChart3, badge: 'MMM' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full apple-glass border-b border-white/[0.08] transition-all duration-spring">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Left: Brand Monogram & Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group apple-press-subtle">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.12] group-hover:border-[#0072BC]/60 group-hover:bg-[#0072BC]/10 transition-all duration-spring shadow-sm">
              <img
                src="/ea_logo.webp"
                alt="EA"
                className="w-5 h-auto object-contain brightness-110 group-hover:scale-105 transition-transform duration-spring"
              />
            </div>
            <span className="apple-title font-bold text-sm text-white tracking-tight">
              EA Growth Engine
            </span>
          </Link>

          {/* Franchise Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFranchiseDropdownOpen(!isFranchiseDropdownOpen)}
              className="apple-press flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/[0.2] transition-all duration-spring text-xs text-white shadow-sm"
            >
              <span
                className="w-2 h-2 rounded-full ring-2 ring-white/10"
                style={{ backgroundColor: franchiseInfo.accentColor }}
              />
              <span className="font-semibold text-white tracking-tight">{franchiseInfo.shortName}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#8FA3BC] transition-transform duration-spring ${isFranchiseDropdownOpen ? 'rotate-180 text-white' : ''}`} />
            </button>

            {isFranchiseDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl apple-glass-dock border border-white/[0.14] shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-[#8FA3BC] tracking-wider border-b border-white/[0.08] mb-1.5 flex items-center justify-between">
                  <span>Active Franchise Context</span>
                  <span className="text-[9px] text-[#00F0FF]">5 Available</span>
                </div>
                <div className="space-y-1">
                  {franchises.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setCurrentFranchise(f.id);
                        setIsFranchiseDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all duration-spring apple-press-subtle ${
                        currentFranchise === f.id
                          ? 'apple-glass-pill-active text-white font-semibold'
                          : 'text-[#8FA3BC] hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10"
                          style={{ backgroundColor: f.accentColor }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">{f.label}</div>
                          <div className="text-[10px] text-[#8FA3BC]">{f.subtitle}</div>
                        </div>
                      </div>
                      {currentFranchise === f.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#00C48C] animate-scaleIn" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: 4-Act Nav Links (Apple Floating Glass Dock) */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-black/20 border border-white/[0.06] backdrop-blur-md">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`apple-press flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-spring ${
                  isActive
                    ? 'bg-gradient-to-r from-[#0072BC] to-[#008BE6] text-white shadow-[0_2px_12px_rgba(0,114,188,0.4)] font-semibold border border-white/20'
                    : 'text-[#8FA3BC] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#8FA3BC]'}`} />
                <span className="tracking-tight">{item.label}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-white/[0.04] text-[#8FA3BC]'
                  }`}
                >
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Data Source & A2A Event Bus */}
        <div className="flex items-center gap-2.5">
          {/* Data Source Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 apple-glass-pill px-3 py-1.5 rounded-xl text-[11px] text-[#8FA3BC]">
            <Database className="w-3.5 h-3.5 text-[#00C48C]" />
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value as any)}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-[11px] font-medium tracking-tight"
            >
              <option value="live_spanner" className="bg-[#16263A] text-white">
                Live Spanner & BQ
              </option>
              <option value="synthetic_bq" className="bg-[#16263A] text-white">
                BQML Synthetic (Gemini)
              </option>
              <option value="mock_cache" className="bg-[#16263A] text-white">
                Offline Fast Cache
              </option>
            </select>
          </div>

          {/* A2A Protocol Drawer Toggle Button */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`apple-press relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-spring shadow-sm ${
              isDrawerOpen
                ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                : 'bg-white/[0.06] hover:bg-white/[0.1] border-white/[0.12] text-white'
            }`}
            title="Open Live Agent-to-Agent (A2A) Message Bus"
          >
            <div className="relative flex items-center justify-center">
              <Radio
                className={`w-3.5 h-3.5 ${
                  isDrawerOpen ? 'text-black' : 'text-[#00C48C]'
                }`}
              />
              {!isDrawerOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#00C48C] rounded-full animate-ping" />
              )}
            </div>
            <span className="tracking-tight">A2A Protocol</span>
            {messages.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isDrawerOpen ? 'bg-black text-white' : 'bg-[#0072BC] text-white shadow-sm'
              }`}>
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
