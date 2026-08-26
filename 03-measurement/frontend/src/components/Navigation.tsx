'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Franchise } from '@/types';
import { EA_FRANCHISES } from '@/lib/constants';
import {
  MapPin,
  Sliders,
  ClipboardList,
  Flame,
} from 'lucide-react';

interface NavigationProps {
  currentFranchise: Franchise;
  onSelectFranchise: (franchise: Franchise) => void;
}

export function Navigation({ currentFranchise, onSelectFranchise }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/intake', label: 'Campaign Intake', icon: ClipboardList },
    { href: '/shapley', label: 'Creative Shapley', icon: Flame },
    { href: '/scenario', label: 'Meridian MMM', icon: Sliders },
    { href: '/geospine', label: 'Spatial Geo-Spine', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#16263A]/95 backdrop-blur-md border-b border-[#253D5B]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* EA Brand & Title */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              {/* Crisp White Authentic EA Monogram Badge */}
              <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                <img
                  src="/logos/ea_badge_white.png"
                  alt="Electronic Arts"
                  className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight text-white group-hover:text-[#008BE6] transition-colors whitespace-nowrap">
                Creative Intelligence
              </span>
            </Link>
          </div>

          {/* Tab Navigation (4 Clean Tabs) */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#0072BC]/20 text-white border border-[#0072BC] shadow-[0_0_12px_rgba(0,114,188,0.35)]'
                      : 'text-[#8FA3BC] hover:text-white hover:bg-[#1E334D]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00C48C]' : 'text-[#8FA3BC]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side: Clean Franchise Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-[#0E1A29] px-3 py-1.5 rounded-md border border-[#253D5B]">
              <span className="text-[11px] font-semibold text-[#8FA3BC] uppercase tracking-wider hidden sm:inline">
                Franchise:
              </span>
              <select
                value={currentFranchise}
                onChange={(e) => onSelectFranchise(e.target.value as Franchise)}
                aria-label="Active Franchise"
                className="bg-transparent text-[#00C48C] font-semibold text-xs focus:outline-none cursor-pointer"
              >
                {EA_FRANCHISES.map((franchise) => (
                  <option key={franchise} value={franchise} className="bg-[#0E1A29] text-white">
                    {franchise}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile / Narrow Tab Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-[#253D5B]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0072BC]/20 text-white border border-[#0072BC] font-semibold'
                    : 'text-[#8FA3BC] hover:bg-[#1E334D]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
