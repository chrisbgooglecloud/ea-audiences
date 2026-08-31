import { NextRequest, NextResponse } from 'next/server';
import { US_25_METROS } from '@/lib/constants';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    count: US_25_METROS.length,
    metros: US_25_METROS,
  });
}
