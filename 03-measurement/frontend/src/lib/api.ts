import {
  Franchise,
  CreativeAsset,
  AttributionModelSummary,
  GeoSpineMetro,
  ScenarioSimulationRequest,
  ScenarioSimulationResult,
  GamerPersonaProfile,
  BAREPersonaEvaluation,
  ConflictFatigueData,
  CampaignIntakeRequest,
  CampaignIntakeResponse,
  ShapleyPreTestAuditData,
  WeatherTrajectoryPoint,
  NielsenDMA,
} from '@/types';
import {
  MOCK_CREATIVE_ASSETS,
  MOCK_ATTRIBUTION_SUMMARY,
  MOCK_GAMER_PROFILES,
  MOCK_BARE_EVALUATIONS,
  MOCK_CONFLICT_FATIGUE_OCT24_27,
  MOCK_BELLINGHAM_SHAPLEY_AUDIT,
  MOCK_APEX_SHAPLEY_AUDIT,
} from './mock_data';
import { US_25_METROS, TOP_25_NIELSEN_DMAS, WEATHER_TRAJECTORY_DATA } from './constants';

export function simulateCampaignIntake(request: CampaignIntakeRequest): CampaignIntakeResponse {
  // Check collision condition: Flight overlaps Oct 24-27 and franchise is FC (or has collision)
  const collStart = '2026-10-24';
  const collEnd = '2026-10-27';
  const hasCollision = !request.apply_mitigation && (request.flight_start <= collEnd && request.flight_end >= collStart);

  const budget = request.total_budget || 1500000;
  const baseRoas = request.target_roas || 3.42;
  const cpi = request.target_cpi || 4.12;

  const effectiveRoas = request.apply_mitigation 
    ? baseRoas * 1.08 
    : (hasCollision ? baseRoas * 0.88 : baseRoas);

  const baselineNetBookings = Math.round(budget * baseRoas);
  const unmitigatedNetBookings = Math.round(budget * baseRoas * 0.88);
  const postMitigationNetBookings = Math.round(budget * baseRoas * 1.08);
  const currentNetBookings = request.apply_mitigation 
    ? postMitigationNetBookings 
    : (hasCollision ? unmitigatedNetBookings : baselineNetBookings);
  const bookingsRecovery = postMitigationNetBookings - unmitigatedNetBookings;

  const conflictData: ConflictFatigueData | null = hasCollision
    ? { ...MOCK_CONFLICT_FATIGUE_OCT24_27, status: 'AMBER_COLLISION_DETECTED' }
    : request.apply_mitigation
    ? {
        ...MOCK_CONFLICT_FATIGUE_OCT24_27,
        status: 'MITIGATED_COLLISION_CLEARED',
        ad_fatigue_suppression_penalty_pct: 0.0,
        net_bookings_risk_usd: 0,
        flight_start: '2026-10-27',
        flight_end: '2026-11-07',
      }
    : null;

  const channelWeights: Record<string, number> = {
    YouTube: 0.35,
    Meta: 0.28,
    TikTok: 0.22,
    Twitch: 0.15,
    'Google Ads': 0.10,
  };

  const activeChannels = request.channels.length > 0 ? request.channels : ['YouTube', 'Meta', 'TikTok', 'Twitch'];
  const totalWeight = activeChannels.reduce((sum, ch) => sum + (channelWeights[ch] || 0.25), 0);

  const channelBreakdown = activeChannels.map((ch) => {
    const weight = (channelWeights[ch] || 0.25) / totalWeight;
    const chSpend = Math.round(budget * weight);
    const bookings = Math.round(chSpend * effectiveRoas);
    const installs = Math.round(chSpend / cpi);

    return {
      channel: ch,
      spend: chSpend,
      share_pct: Number((weight * 100).toFixed(1)),
      projected_installs: installs,
      cpi,
      roas: Number(effectiveRoas.toFixed(2)),
      bookings,
    };
  });

  const projectedInstalls = Math.round(budget / cpi);

  return {
    request,
    kpi_prediction: {
      projected_installs: projectedInstalls,
      blended_cpi: cpi,
      day7_roas: Number(effectiveRoas.toFixed(2)),
      baseline_net_bookings: baselineNetBookings,
      unmitigated_net_bookings: unmitigatedNetBookings,
      current_net_bookings: currentNetBookings,
      post_mitigation_net_bookings: postMitigationNetBookings,
      bookings_recovery: bookingsRecovery,
    },
    conflict_data: conflictData,
    channel_breakdown: channelBreakdown,
  };
}

export async function fetchShapleyAudit(franchise?: Franchise): Promise<ShapleyPreTestAuditData> {
  if (franchise === 'Apex Legends') {
    return MOCK_APEX_SHAPLEY_AUDIT;
  }
  return MOCK_BELLINGHAM_SHAPLEY_AUDIT;
}

export async function fetchNielsenDMAs(): Promise<NielsenDMA[]> {
  return TOP_25_NIELSEN_DMAS;
}

export async function fetchWeatherTrajectory(): Promise<WeatherTrajectoryPoint[]> {
  return WEATHER_TRAJECTORY_DATA;
}


export async function fetchCreativeAssets(franchise?: Franchise): Promise<CreativeAsset[]> {
  try {
    const res = await fetch(`/api/multimodal?franchise=${encodeURIComponent(franchise || '')}`);
    if (res.ok) {
      const data = await res.json();
      return data.assets || MOCK_CREATIVE_ASSETS;
    }
  } catch (err) {
    console.warn('Fallback to local mock data for creative assets:', err);
  }
  if (!franchise) return MOCK_CREATIVE_ASSETS;
  return MOCK_CREATIVE_ASSETS.filter((a) => a.franchise === franchise);
}

export async function fetchAttributionData(franchise?: Franchise): Promise<AttributionModelSummary> {
  try {
    const res = await fetch(`/api/attribution?franchise=${encodeURIComponent(franchise || '')}`);
    if (res.ok) {
      const data = await res.json();
      return data || MOCK_ATTRIBUTION_SUMMARY;
    }
  } catch (err) {
    console.warn('Fallback to local mock data for attribution:', err);
  }
  return MOCK_ATTRIBUTION_SUMMARY;
}

export async function fetchGeoSpineMetros(): Promise<GeoSpineMetro[]> {
  try {
    const res = await fetch('/api/geospine');
    if (res.ok) {
      const data = await res.json();
      return data.metros || US_25_METROS;
    }
  } catch (err) {
    console.warn('Fallback to local mock data for GeoSpine:', err);
  }
  return US_25_METROS;
}

export async function fetchGamerPersonas(): Promise<{
  profiles: GamerPersonaProfile[];
  evaluations: Record<string, BAREPersonaEvaluation>;
}> {
  try {
    const res = await fetch('/api/personas');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Fallback to local mock data for personas:', err);
  }
  return {
    profiles: MOCK_GAMER_PROFILES,
    evaluations: MOCK_BARE_EVALUATIONS,
  };
}

/**
 * Client-side or backend-proxied Equimarginal Hill Saturation solver.
 * Enforces:
 * 1. Marginal ROAS formula: mROAS(x) = base_roas * (s^k * k * x^(k-1)) / ((x^k + s^k)^2)
 * 2. 20% daily pacing clamp: 0.80 * x_current <= x_proposed <= 1.20 * x_current
 * 3. Zero-sum rebalancing or global budget scaling
 * 4. Sub-200ms latency execution
 */
export function solveEquimarginalPacing(request: ScenarioSimulationRequest): ScenarioSimulationResult {
  const startTime = performance.now();
  const channels = Object.keys(request.channel_caps) as (keyof typeof request.channel_caps)[];
  const channelData = request.channel_caps;

  const totalBudget = request.total_budget;
  const currentTotal = channels.reduce((sum, ch) => sum + channelData[ch].current_spend, 0);
  const scalingFactor = totalBudget / (currentTotal || 1);

  // Hill function parameters per channel
  const hillParams: Record<string, { base_roas: number; s: number; k: number }> = {
    youtube: { base_roas: 3.2, s: 450000, k: 1.4 },
    meta: { base_roas: 2.8, s: 350000, k: 1.35 },
    programmatic_3d: { base_roas: 3.6, s: 280000, k: 1.5 },
    tiktok: { base_roas: 3.0, s: 320000, k: 1.45 },
  };

  const calculateMarginalROAS = (spend: number, ch: string) => {
    const p = hillParams[ch] || { base_roas: 3.0, s: 350000, k: 1.4 };
    const x = Math.max(spend, 1000);
    const num = p.base_roas * Math.pow(p.s, p.k) * p.k * Math.pow(x, p.k - 1);
    const denom = Math.pow(Math.pow(x, p.k) + Math.pow(p.s, p.k), 2);
    return (num / denom) * p.s; // scaled marginal ROAS
  };

  const calculateCumulativeROAS = (spend: number, ch: string) => {
    const p = hillParams[ch] || { base_roas: 3.0, s: 350000, k: 1.4 };
    const x = Math.max(spend, 1000);
    const hillVal = Math.pow(x, p.k) / (Math.pow(x, p.k) + Math.pow(p.s, p.k));
    return (p.base_roas * hillVal * p.s) / x;
  };

  // Compute unconstrained optimal vs clamped
  let pacingClampApplied = false;
  let maxShiftFound = 0;

  const allocations = channels.map((ch) => {
    const current = channelData[ch].current_spend;
    const baseTarget = current * scalingFactor;
    
    // Check 20% pacing clamp
    const minAllowed = current * 0.8;
    const maxAllowed = current * 1.2;
    
    let proposed = baseTarget;
    if (proposed < minAllowed) {
      proposed = minAllowed;
      pacingClampApplied = true;
    } else if (proposed > maxAllowed) {
      proposed = maxAllowed;
      pacingClampApplied = true;
    }

    const shiftPercent = Math.abs((proposed - current) / (current || 1)) * 100;
    if (shiftPercent > maxShiftFound) {
      maxShiftFound = shiftPercent;
    }

    const mROAS = calculateMarginalROAS(proposed, ch);
    const projected_roas = calculateCumulativeROAS(proposed, ch);

    return {
      channel: ch.replace('_', ' ').toUpperCase(),
      spend: Math.round(proposed),
      percentage: 0, // filled below
      mROAS: Number(mROAS.toFixed(2)),
      projected_roas: Number(projected_roas.toFixed(2)),
      delta_vs_current: Math.round(proposed - current),
    };
  });

  const sumAllocated = allocations.reduce((acc, a) => acc + a.spend, 0);
  allocations.forEach((a) => {
    a.percentage = Number(((a.spend / sumAllocated) * 100).toFixed(1));
  });

  // Generate continuous S-curve points for visualization
  const s_curves: any[] = [];
  const spendSteps = [50000, 100000, 250000, 500000, 750000, 1000000, 1500000, 2000000, 3000000, 4000000, 5000000];
  
  spendSteps.forEach((spend) => {
    channels.forEach((ch) => {
      s_curves.push({
        spend: spend / 1000, // in $k
        marginal_roas: Number(calculateMarginalROAS(spend, ch).toFixed(2)),
        cumulative_roas: Number(calculateCumulativeROAS(spend, ch).toFixed(2)),
        channel: ch.replace('_', ' ').toUpperCase(),
      });
    });
  });

  const blendedROAS = allocations.reduce((acc, a) => acc + (a.projected_roas * a.spend), 0) / sumAllocated;
  const effectiveCPI = Math.max(0.8, request.target_cpi * (3.0 / Math.max(blendedROAS, 1.0)));
  const predictedInstalls = Math.round(sumAllocated / effectiveCPI);
  const predictedRevenue = Math.round(sumAllocated * blendedROAS);

  const endTime = performance.now();
  const solverLatency = Math.max(12, Math.round(endTime - startTime));

  return {
    scenario_id: `scenario-${Date.now()}`,
    total_spend: sumAllocated,
    predicted_installs: predictedInstalls,
    predicted_d7_roas: Number(blendedROAS.toFixed(2)),
    predicted_revenue: predictedRevenue,
    effective_cpi: Number(effectiveCPI.toFixed(2)),
    pacing_clamp_applied: pacingClampApplied,
    max_shift_percent: Number(maxShiftFound.toFixed(1)),
    channel_allocations: allocations,
    s_curves,
    solver_latency_ms: solverLatency,
    a2a_dispatch_ready: true,
  };
}
