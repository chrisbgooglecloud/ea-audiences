import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    rows: [
      {
        id: 'nba2k26_gameplay_launch',
        title: 'NBA 2K26 • Official Gameplay & The City Reveal Trailer',
        type: 'youtube_sentiment',
        positive: 88,
        negative: 12,
        sentiment: 'High Excitement (8.8/10)',
        dominantTheme: 'ProPLAY 1-to-1 Volumetric Motion',
      },
      {
        id: 'reddit_nba2k_the_rec',
        title: 'r/NBA2k The REC & Cap Breaker Discourse',
        type: 'reddit',
        positive: 68,
        negative: 32,
        sentiment: 'Competitive Debate (6.8/10)',
        dominantTheme: '99 OVR Cap Breakers & 128-Tick Latency',
      },
      {
        id: 'tiktok_viral_green_releases',
        title: '#nba2k26 Signature Jumpshots & Park Drip',
        type: 'tiktok_hashtag',
        positive: 94,
        negative: 6,
        sentiment: 'Viral Overwhelmingly Positive (9.4/10)',
        dominantTheme: 'Step-Back Green Releases & Jordan Collabs',
      },
    ],
  });
}
