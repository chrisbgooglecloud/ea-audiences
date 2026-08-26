import React from 'react';
import { AppMode } from '../types';
import { brandConfig } from '../config';
import {
  Home,
  Menu,
  X,
  Users,
  FileText,
  Sparkles,
  MessageSquare,
  TrendingUp,
  HeartHandshake,
  Monitor,
  UserPlus,
  Eye,
  Layers,
  Settings,
  Save,
  RotateCcw,
  RotateCw,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCompanyContext } from '../context/CompanyContext';
import { useAppConfig } from '../context/AppConfigContext';
import * as LucideIcons from 'lucide-react';

const IconMap: Record<string, any> = {
  Home: LucideIcons.Home,
  Users: LucideIcons.Users,
  UserPlus: LucideIcons.UserPlus,
  FileText: LucideIcons.FileText,
  MessageSquare: LucideIcons.MessageSquare,
  Layers: LucideIcons.Layers,
  Settings: LucideIcons.Settings,
  Target: LucideIcons.Target,
  TrendingUp: LucideIcons.TrendingUp,
  Layout: LucideIcons.Layout,
  Briefcase: LucideIcons.Briefcase,
  Search: LucideIcons.Search,
  Globe: LucideIcons.Globe,
  Palette: LucideIcons.Palette,
  Database: LucideIcons.Database,
  Wand2: LucideIcons.Wand2,
  Eye: LucideIcons.Eye,
  FolderHeart: LucideIcons.FolderHeart,
  HeartHandshake: LucideIcons.HeartHandshake,
  Film: LucideIcons.Film,
  Cpu: LucideIcons.Cpu,
  ShieldCheck: LucideIcons.ShieldCheck,
  CheckSquare: LucideIcons.CheckSquare,
  Bot: LucideIcons.Bot,
  Terminal: LucideIcons.Terminal,
  Gamepad2: LucideIcons.Gamepad2,
  Sparkles: LucideIcons.Sparkles
};

interface NavigationProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentMode, 
  setMode, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { name } = useCompanyContext();
  const { config } = useAppConfig();

  const navItems = config?.navigation || [
    { id: AppMode.HOME, label: 'Home', icon: 'Home' },
    { id: AppMode.INSIGHTS, label: 'Insights', icon: 'Film' },
    { id: AppMode.CONTENT_HUB, label: 'Create Content', icon: 'FolderHeart' },
    { id: AppMode.AGENT_PLAYGROUND, label: 'Agent Playground', icon: 'Bot' }
  ];

  const themeColors = config?.branding.colors || brandConfig.colors;
  const logoUrl = config?.branding.logo || brandConfig.logo.sidebar;
  const companyName = config?.branding.companyName || name;

  return (
    <>
      {/* Mobile Header */}
      <div 
        className="md:hidden fixed top-0 left-0 w-full h-16 flex items-center justify-between px-4 z-50 text-white bg-[#0D131D]/90 backdrop-blur-md border-b border-white/10 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tight text-white">{companyName}</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Overlay) */}
      <nav className={`
        nav-sidebar transition-all duration-300 ease-in-out pt-16 md:pt-0 flex flex-col justify-between
        ${isCollapsed ? 'collapsed' : ''}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Desktop Header */}
          <div className={`hidden md:flex items-center border-b border-white/10 bg-[#080A0E] transition-all ${
            isCollapsed ? 'flex-col justify-center p-3 min-h-[5.5rem] gap-2' : 'justify-between px-4 py-3 min-h-[5.5rem]'
          }`}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={companyName} 
                      className="w-auto object-contain transition-all drop-shadow-[0_0_12px_rgba(0,240,255,0.2)]" 
                      style={{ height: `${config?.branding?.logoHeight || 52}px` }} 
                    />
                  ) : (
                    <span className="font-black text-lg tracking-wider text-white flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0AF468] shadow-[0_0_10px_#0AF468] shrink-0"></span>
                      <span className="truncate">{companyName}</span>
                    </span>
                  )}
                </div>
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-1"
                    title="Collapse Sidebar"
                    aria-label="Collapse Sidebar"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
              </>
            ) : (
              <>
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#349DD4] text-slate-400 hover:text-white flex items-center justify-center transition-all border border-white/10 shadow-sm group"
                    title="Expand Sidebar"
                    aria-label="Expand Sidebar"
                  >
                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Navigation items */}
          <div className={`space-y-1.5 mt-2 transition-all ${isCollapsed ? 'p-2' : 'p-3'}`}>
            {navItems.map((item) => {
              const isActive = currentMode === item.id;
              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => {
                      setMode(item.id as AppMode);
                      setIsMobileMenuOpen(false);
                    }}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={item.label}
                    className={`
                      transition-all duration-200 font-bold text-sm
                      ${isCollapsed
                        ? `w-full flex items-center justify-center p-3 rounded-xl ${
                            isActive
                              ? `bg-[#349DD4] text-white shadow-[0_0_16px_rgba(52,157,212,0.4)] scale-105`
                              : `text-slate-400 hover:text-white hover:bg-white/5`
                          }`
                        : `w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl ${
                            isActive
                              ? `bg-[#349DD4] text-white shadow-[0_0_16px_rgba(52,157,212,0.4)] scale-[1.02]`
                              : `text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5`
                          }`
                      }
                    `}
                  >
                    {IconMap[item.icon as string] ? React.createElement(IconMap[item.icon as string], { size: isCollapsed ? 20 : 18 }) : <Menu size={isCollapsed ? 20 : 18} />}
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`w-full border-t border-white/10 bg-[#0D131D]/90 mt-auto transition-all ${
          isCollapsed ? 'p-2 flex flex-col items-center gap-2.5 py-4' : 'px-4 py-4'
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div
                  className="w-9 h-9 rounded-xl bg-[#349DD4] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-[0_0_12px_rgba(52,157,212,0.3)]"
                >
                  {companyName.charAt(0)}
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <p className="text-xs font-black text-white truncate leading-tight" title={`${companyName} AI Studio`}>
                    {companyName}
                  </p>
                  <p className="text-[11px] font-mono text-[#00F0FF] truncate leading-tight mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse"></span>
                    AI Lab v2.5
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setMode(AppMode.ADMIN);
                  if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                }}
                className="p-2 text-slate-400 hover:text-[#00F0FF] hover:bg-white/10 transition-all rounded-xl shrink-0"
                title="Admin Configuration"
                aria-label="Admin Configuration"
              >
                <Settings size={18} />
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => {
                  setMode(AppMode.ADMIN);
                  if (window.innerWidth < 768) setIsMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-xl transition-all ${
                  currentMode === AppMode.ADMIN
                    ? 'bg-[#349DD4] text-white shadow-[0_0_12px_rgba(52,157,212,0.4)]'
                    : 'text-slate-400 hover:text-[#00F0FF] hover:bg-white/10'
                }`}
                title="Admin Configuration"
                aria-label="Admin Configuration"
              >
                <Settings size={18} />
              </button>
              <div
                className="w-8 h-8 rounded-lg bg-[#349DD4] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-[0_0_10px_rgba(52,157,212,0.3)]"
                title={`${companyName} AI Studio`}
              >
                {companyName.charAt(0)}
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
};
