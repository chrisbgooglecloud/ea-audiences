'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const VALID_PASSWORDS = [
  'ea+google=awesome',
  (process.env.NEXT_PUBLIC_APP_PASSWORD || '').toLowerCase(),
  'ea-ebc-2026',
  'ebc2026',
  'google2026',
].filter(Boolean);

export function SessionAuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    try {
      const token = sessionStorage.getItem('ebc_session_token');
      if (token === 'valid') {
        setIsAuthenticated(true);
      }
    } catch {
      // Ignore sessionStorage access errors
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password required');
      return;
    }

    setLoading(true);
    setError('');

    // Normalize and verify password
    const entered = password.trim().toLowerCase();
    const isMatch = VALID_PASSWORDS.includes(entered);

    setTimeout(() => {
      if (isMatch) {
        try {
          sessionStorage.setItem('ebc_session_token', 'valid');
        } catch {
          // Ignore
        }
        setIsAuthenticated(true);
      } else {
        setError('Invalid access password');
        setPassword('');
      }
      setLoading(false);
    }, 250);
  };

  if (isChecking) {
    return <div className="min-h-screen bg-[#0E1A29]" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0E1A29] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#16263A] border border-[#253D5B] rounded-lg p-8 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center mb-6">
            {/* EA Brand Header */}
            <div className="mb-4">
              <img
                src="/logos/ea_logo_blue.svg"
                alt="Electronic Arts"
                className="h-9 w-auto object-contain"
              />
            </div>
            <h1 className="text-lg font-heading font-bold tracking-tight text-white">
              Executive Briefing Center
            </h1>
            <p className="text-xs text-[#8FA3BC] mt-1">
              Creative Intelligence & Measurement Engine
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password"
                autoFocus
                className={`w-full px-4 py-3 bg-[#0E1A29] border rounded-md text-sm text-white placeholder-[#8FA3BC] focus:outline-none transition-all ${
                  error
                    ? 'border-[#FF4560] focus:border-[#FF4560] ring-1 ring-[#FF4560]/30'
                    : 'border-[#253D5B] focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC]/40'
                }`}
              />
              {error && (
                <p className="text-xs text-[#FF4560] mt-1.5 text-center font-medium">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0072BC] hover:bg-[#008BE6] active:bg-[#0072BC] text-white font-semibold rounded-md text-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(0,114,188,0.4)] cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-[#253D5B] flex items-center justify-center gap-1.5 text-[11px] text-[#8FA3BC]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00C48C]" />
            <span>Protected Executive Session</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
