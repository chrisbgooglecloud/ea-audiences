import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    branding: {
      companyName: 'EA SPORTS FC 26',
      logo: '/ea_logo.webp',
      colors: {
        primary: '#0072BC',
        secondary: '#16263A',
        accent: '#00F0FF',
      },
      metaTitle: 'EA Executive Briefing Center',
    },
    navigation: [
      { id: 'listening', label: 'Social Listening', icon: 'Radio' },
      { id: 'studio', label: 'Creative Studio', icon: 'Palette' },
      { id: 'audit', label: 'Brand Safety Audit', icon: 'ShieldCheck' },
      { id: 'synthetic', label: 'Synthetic Focus Group', icon: 'Users' },
    ],
  });
}
