import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { featureId: string[] } }
) {
  const feature = params.featureId?.join('/') || '';
  const searchParams = request.nextUrl.searchParams;
  const companyName = searchParams.get('companyName') || 'EA SPORTS FC';

  // 1. Check local data/runs/ and public/data/
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'runs', `${feature}_run.json`),
    path.join(process.cwd(), 'data', 'runs', `${feature}.json`),
    path.join(process.cwd(), 'public', 'data', `${feature}.json`),
    path.join(process.cwd(), 'public', 'data', feature),
    path.join(process.cwd(), '..', '02-creative-insights', 'runs', `${feature}.json`),
    path.join(process.cwd(), '..', '02-creative-insights', 'public', 'data', `${feature}.json`),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        return NextResponse.json(JSON.parse(raw));
      } catch (e) {
        // continue
      }
    }
  }

  // 2. Safe defaults for standard creative features
  if (feature === 'company_context') {
    return NextResponse.json({
      name: companyName,
      description: 'EA SPORTS premier gaming title and live-service ecosystem.',
    });
  }

  if (feature.includes('noise_filter')) {
    return NextResponse.json({
      totalComments: 1420,
      totalEnriched: 380,
      topKeywords: [
        { keyword: 'HyperMotion V', mentions: 184, sentiment: 'positive', category: 'Gameplay' },
        { keyword: 'FC IQ Tactics', mentions: 142, sentiment: 'positive', category: 'Tactics' },
        { keyword: 'Server Latency', mentions: 96, sentiment: 'negative', category: 'Infrastructure' },
        { keyword: 'Weekend League Rewards', mentions: 112, sentiment: 'neutral', category: 'Progression' },
      ],
      enrichedComments: [],
    });
  }

  return NextResponse.json({
    status: 'NO_RUN_FOUND',
    feature,
    companyName,
  });
}
