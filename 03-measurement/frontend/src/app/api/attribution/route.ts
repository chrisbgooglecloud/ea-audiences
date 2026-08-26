import { NextRequest, NextResponse } from 'next/server';
import { MOCK_ATTRIBUTION_SUMMARY } from '@/lib/mock_data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const franchise = searchParams.get('franchise');

  let summary = { ...MOCK_ATTRIBUTION_SUMMARY };
  if (franchise && franchise !== 'ALL') {
    summary.features = summary.features.filter((f) => f.franchise === franchise);
  }

  return NextResponse.json(summary);
}
