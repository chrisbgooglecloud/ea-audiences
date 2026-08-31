import { NextRequest, NextResponse } from 'next/server';
import { solveEquimarginalPacing } from '@/lib/api';
import { ScenarioSimulationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const raw: any = await request.json();
    const payload: ScenarioSimulationRequest = {
      total_budget: raw.total_budget || raw.totalBudget || (raw.budgets ? Object.values(raw.budgets as Record<string, number>).reduce((a, b) => a + b, 0) : 4200000),
      target_cpi: raw.target_cpi || 4.18,
      target_roas: raw.target_roas || 2.74,
      franchise: raw.franchise || 'EA SPORTS FC 26',
      channel_caps: raw.channel_caps || {
        youtube: {
          current_spend: raw.budgets?.YouTube || 1200000,
          min_spend: 800000,
          max_spend: 2000000,
          is_locked: false,
        },
        meta: {
          current_spend: raw.budgets?.Meta || 850000,
          min_spend: 500000,
          max_spend: 1500000,
          is_locked: false,
        },
        programmatic_3d: {
          current_spend: raw.budgets?.Programmatic3D || 450000,
          min_spend: 300000,
          max_spend: 1200000,
          is_locked: false,
        },
        tiktok: {
          current_spend: raw.budgets?.TikTok || 650000,
          min_spend: 400000,
          max_spend: 1400000,
          is_locked: false,
        },
      },
    };

    const result = solveEquimarginalPacing(payload);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Failed to solve equimarginal pacing scenario' },
      { status: 500 }
    );
  }
}
