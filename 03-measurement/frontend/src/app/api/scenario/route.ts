import { NextRequest, NextResponse } from 'next/server';
import { solveEquimarginalPacing } from '@/lib/api';
import { ScenarioSimulationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const payload: ScenarioSimulationRequest = await request.json();
    const result = solveEquimarginalPacing(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to solve equimarginal pacing scenario' },
      { status: 400 }
    );
  }
}
