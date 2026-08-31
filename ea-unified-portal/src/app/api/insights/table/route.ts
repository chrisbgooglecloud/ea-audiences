import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    rows: [
      {
        id: 'fc26_gameplay_launch',
        title: 'EA SPORTS FC 26 • Official Reveal Trailer',
        type: 'youtube_sentiment',
        positive: 84,
        negative: 16,
        sentiment: 'High Excitement (8.4/10)',
        dominantTheme: 'HyperMotion V Volumetric Physics',
      },
      {
        id: 'reddit_fut_champions',
        title: 'r/EASportsFC Weekend League & Rewards Discourse',
        type: 'reddit',
        positive: 62,
        negative: 38,
        sentiment: 'Competitive Debate (6.2/10)',
        dominantTheme: 'Pack Odds & Division 1 Rank Pacing',
      },
      {
        id: 'tiktok_viral_skills',
        title: '#FC26SkillMoves Viral UGC Pulse',
        type: 'tiktok_hashtag',
        positive: 91,
        negative: 9,
        sentiment: 'Viral Overwhelmingly Positive (9.1/10)',
        dominantTheme: 'Trivela & Stepover Speed Boosts',
      },
    ],
  });
}
