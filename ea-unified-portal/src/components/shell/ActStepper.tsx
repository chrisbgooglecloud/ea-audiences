'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Palette, BarChart3, Box, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ActStepper() {
  const pathname = usePathname();

  const acts = [
    {
      act: 'Act 1',
      title: 'Audiences',
      subtitle: 'Insights & Personas',
      href: '/audiences',
      icon: Users,
      color: '#00F0FF',
    },
    {
      act: 'Act 2',
      title: 'Creative Studio',
      subtitle: 'Asset Generation & Review',
      href: '/creative',
      icon: Palette,
      color: '#E6FF00',
    },
    {
      act: 'Act 3',
      title: 'Measurement',
      subtitle: 'Attribution & Optimization',
      href: '/measurement',
      icon: BarChart3,
      color: '#00C48C',
    },
    {
      act: 'Act 4',
      title: 'In-Game Commerce',
      subtitle: 'The City & Arena Media',
      href: '/commerce',
      icon: Box,
      color: '#FF2E38',
    },
  ];


  return (
    <div className="w-full bg-[#0E1A29]/80 backdrop-blur-md border-b border-white/[0.06] px-4 py-2">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono uppercase text-[#00F0FF] tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20">
            Workflow
          </span>
          <span className="text-white/20 hidden sm:inline">•</span>
          <span className="text-xs text-[#8FA3BC] hidden sm:inline apple-subhead font-medium">
            Connected Marketing Intelligence
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto py-0.5">
          {acts.map((item, idx) => {
            const isCurrent = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <React.Fragment key={item.act}>
                <Link
                  href={item.href}
                  className={`apple-press-subtle flex items-center gap-2 px-3 py-1 rounded-xl text-xs transition-all duration-spring ${
                    isCurrent
                      ? 'apple-glass-pill-active text-white font-semibold shadow-md'
                      : 'apple-glass-pill text-[#8FA3BC] hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full ring-2 ring-white/10 shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-mono text-[11px] font-bold text-white tracking-tight">
                    {item.act}
                  </span>
                  <span className="hidden md:inline text-[11px] tracking-tight">
                    {item.title}
                  </span>
                </Link>
                {idx < acts.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
