import { SyntheticUserProfile } from '../types';

export interface A2APlayerProfile {
  player_id: string;
  gamer_tag: string;
  franchise: string;
  primary_archetype: string;
  location: string;
  lifetime_spend_usd: number;
  recent_loss_streak: number;
  tilt_sensitivity: number;
  telemetry: {
    squad_ovr: number;
    division: string;
    loss_streak: number;
    favorite_club: string;
    favorite_player: string;
    favorite_formation: string;
    primary_playstyle: string;
    preferred_reward_type: string;
  };
  purchased_items: {
    title: string;
    price: number;
    date: string;
    category: string;
    type: string;
  }[];
  personalized_creative_hooks: {
    favorite_club?: string;
    favorite_player?: string;
    favorite_formation?: string;
    primary_playstyle?: string;
    preferred_reward_type?: string;
    suggested_headline: string;
    imagen_prompt: string;
    veo_video_prompt: string;
  };
}

export const fetchA2AAudiences = async (count: number = 7, forceRefresh: boolean = false): Promise<A2APlayerProfile[]> => {
  // 1. Try local storage cache for instant offline re-use
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem('cached_a2a_audiences_v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length >= count) {
          return parsed.slice(0, count);
        }
      }
    } catch (e) {
      console.warn("localStorage read failed:", e);
    }
  }

  // 2. Try server API /api/a2a/audiences (Live Cloud Run or Server Cache)
  try {
    const res = await fetch(`/api/a2a/audiences?count=${count}${forceRefresh ? '&refresh=true' : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (data.players && Array.isArray(data.players) && data.players.length > 0) {
        try {
          localStorage.setItem('cached_a2a_audiences_v3', JSON.stringify(data.players));
        } catch (e) {}
        return data.players.slice(0, count);
      }
    }
  } catch (e) {
    console.warn("Could not load from /api/a2a/audiences:", e);
  }

  // 3. Try direct static cache file /data/configuration/a2a_cached_audiences.json
  try {
    const staticRes = await fetch('/data/configuration/a2a_cached_audiences.json');
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      if (Array.isArray(staticData) && staticData.length > 0) {
        try {
          localStorage.setItem('cached_a2a_audiences_v3', JSON.stringify(staticData));
        } catch (e) {}
        return staticData.slice(0, count);
      }
    }
  } catch (e) {
    console.warn("Could not load static cached audiences JSON:", e);
  }

  return [];
};

export const mapA2AToWorkflowPersonas = (players: A2APlayerProfile[], fallback: any[] = []): any[] => {
  if (!players || players.length === 0) return fallback;
  return players.map((p) => ({
    id: p.player_id,
    name: `${p.gamer_tag} (${p.telemetry?.favorite_club || 'FC Club'})`,
    demographics: `${p.telemetry?.division || 'Division 1'} • ${p.location} • Squad ${p.telemetry?.squad_ovr || 90} OVR`,
    bio: `${p.recent_loss_streak}-Match Slump | Tilt Risk: ${Math.round((p.tilt_sensitivity || 0.9) * 100)}% | Key Star: ${p.telemetry?.favorite_player || 'Player'} | Spend: $${p.lifetime_spend_usd}`,
    lifestyleContext: `RGB esports battle station adorned with authentic ${p.telemetry?.favorite_club || 'Football'} banners, tactical whiteboard detailing ${p.telemetry?.favorite_formation || '4-3-3 Attack'}, and glowing ${p.telemetry?.favorite_player || 'Player'} holographic trophy stand.`,
    affinity: `${p.telemetry?.primary_playstyle || 'Direct Counter'} • Preferred Reward: ${p.telemetry?.preferred_reward_type || 'Pack Booster'}`,
    defaultPrompt: p.personalized_creative_hooks?.imagen_prompt,
    lossStreak: p.recent_loss_streak,
    tiltSensitivity: p.tilt_sensitivity,
    favoriteClub: p.telemetry?.favorite_club,
    favoritePlayer: p.telemetry?.favorite_player,
    suggestedHeadline: p.personalized_creative_hooks?.suggested_headline
  }));
};

export const mapA2AToStorefrontPersonas = (players: A2APlayerProfile[], fallback: any[] = []): any[] => {
  if (!players || players.length === 0) return fallback;
  return players.map((p) => {
    const purchasedTitles = (p.purchased_items || []).map(item => item.title);
    const interests = purchasedTitles.length > 0 ? purchasedTitles : [
      `${p.telemetry?.favorite_club || 'FC Club'} Official Kit`,
      `${p.telemetry?.favorite_player || 'Star'} Hero Item`,
      `${p.telemetry?.favorite_formation || 'Tactics'} Playbook`
    ];

    const lossStreak = p.recent_loss_streak ?? 0;
    const tiltPct = Math.round((p.tilt_sensitivity || 0.5) * 100);
    
    let cohortStatus = '';
    let statusTag = '';
    let observationText = '';

    if (lossStreak >= 3) {
      cohortStatus = `${p.telemetry?.division || 'Weekend League'} • ${lossStreak}-Match Slump`;
      statusTag = `${lossStreak}-Match Slump`;
      observationText = p.personalized_creative_hooks?.suggested_headline || `High tilt risk (${tiltPct}%) following ${lossStreak} consecutive losses. Receptive to momentum reset bundles.`;
    } else if (lossStreak > 0) {
      cohortStatus = `${p.telemetry?.division || 'Division Rivals'} • ${lossStreak} Match Defeat`;
      statusTag = `${lossStreak} Match Defeat`;
      observationText = p.personalized_creative_hooks?.suggested_headline || `Moderate tilt risk (${tiltPct}%). Receptive to tactical coaching and squad upgrades.`;
    } else if (p.primary_archetype?.includes('WHALE')) {
      cohortStatus = `${p.telemetry?.division || 'Division 2 Rivals'} • VIP High Spender`;
      statusTag = 'Whale Collector';
      observationText = p.personalized_creative_hooks?.suggested_headline || `High lifetime spend ($${p.lifetime_spend_usd}). Receptive to exclusive Icon picks and points vaults.`;
    } else if (p.primary_archetype?.includes('VETERAN')) {
      cohortStatus = `${p.telemetry?.division || 'Division 5 Rivals'} • Returning Veteran`;
      statusTag = 'Returning Player';
      observationText = p.personalized_creative_hooks?.suggested_headline || `Re-engagement cohort. Receptive to welcome-back loan player items.`;
    } else if (p.primary_archetype?.includes('SOCIALIZER')) {
      cohortStatus = `${p.telemetry?.division || 'Pro Clubs & Rush 5v5'} • Casual Co-Op`;
      statusTag = 'Rush 5v5 Captain';
      observationText = p.personalized_creative_hooks?.suggested_headline || `Casual socializer. Receptive to XP boosters and co-op kit drops.`;
    } else {
      cohortStatus = `${p.telemetry?.division || 'FUT Champions'} • Win Streak / In-Form`;
      statusTag = 'In-Form Win Streak';
      observationText = p.personalized_creative_hooks?.suggested_headline || `Peak momentum (0 losses). Receptive to Champions Rank 1 rewards and milestone victory items.`;
    }

    return {
      id: p.player_id,
      name: `${p.gamer_tag}`,
      cohortTitle: cohortStatus,
      demographics: `${p.location} • $${p.lifetime_spend_usd} Lifetime Spend • Squad ${p.telemetry?.squad_ovr || 90} OVR`,
      interests,
      intentScores: {
        categoryAffinity: `${p.telemetry?.favorite_club || 'FC Club'} & ${p.telemetry?.primary_playstyle || 'Tactics'}`,
        purchaseIntent: tiltPct
      },
      behavioralTags: [
        p.primary_archetype || 'COMPETITIVE_GRINDER',
        statusTag,
        p.telemetry?.favorite_club || 'FC Club',
        `OVR ${p.telemetry?.squad_ovr || 90}`
      ],
      observations: observationText,
      creativeHooks: p.personalized_creative_hooks,
      telemetry: p.telemetry,
      purchasedItems: p.purchased_items,
      rawProfile: p
    };
  });
};

export const mapA2AToSyntheticUsers = (players: A2APlayerProfile[], fallback: SyntheticUserProfile[] = []): SyntheticUserProfile[] => {
  if (!players || players.length === 0) return fallback;
  return players.map((p) => ({
    name: p.gamer_tag,
    archetype: p.primary_archetype || 'Competitive Grinder',
    demographics: `${p.location} • ${p.telemetry?.division || 'Weekend League'} (Squad ${p.telemetry?.squad_ovr || 90} OVR)`,
    bio: `${p.recent_loss_streak}-Match Slump | Tilt Risk: ${Math.round((p.tilt_sensitivity || 0.9) * 100)}% | Club: ${p.telemetry?.favorite_club} | Key Star: ${p.telemetry?.favorite_player} | Spend: $${p.lifetime_spend_usd}`,
    behavioralSummary: `Tilt Sensitivity: ${Math.round((p.tilt_sensitivity || 0.9) * 100)}% | Current Slump: ${p.recent_loss_streak} Loss Streak | Favorite Club: ${p.telemetry?.favorite_club} | Favorite Star: ${p.telemetry?.favorite_player} | Total Spend: $${p.lifetime_spend_usd}`,
    affinityScores: {
      "Ultimate Team": 96,
      "FC IQ Tactics": 92,
      "Weekend League": 95,
      "Reward Boosters": 88
    },
    preferredTone: "Tactical redemption, high-energy comeback, momentum reset",
    rawProfile: p,
    telemetry: p.telemetry,
    purchasedItems: p.purchased_items,
    lossStreak: p.recent_loss_streak,
    tiltSensitivity: p.tilt_sensitivity,
    lifetimeSpend: p.lifetime_spend_usd,
    favoriteClub: p.telemetry?.favorite_club,
    favoritePlayer: p.telemetry?.favorite_player,
    favoriteFormation: p.telemetry?.favorite_formation,
    primaryPlaystyle: p.telemetry?.primary_playstyle,
    preferredReward: p.telemetry?.preferred_reward_type,
    suggestedHeadline: p.personalized_creative_hooks?.suggested_headline
  }));
};
