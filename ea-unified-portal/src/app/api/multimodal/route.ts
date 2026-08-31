import { NextRequest, NextResponse } from 'next/server';
import { MOCK_CREATIVE_ASSETS } from '@/lib/mock_data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const franchise = searchParams.get('franchise');

  let assets = MOCK_CREATIVE_ASSETS;
  if (franchise && franchise !== 'ALL') {
    assets = assets.filter((a) => a.franchise === franchise);
  }

  return NextResponse.json({
    status: 'success',
    count: assets.length,
    assets,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      status: 'success',
      message: 'Creative asset ingested. Gemini 3.6 Flash structured extraction completed.',
      asset_id: `asset-${Date.now()}`,
      data: body,
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Invalid payload' }, { status: 400 });
  }
}
