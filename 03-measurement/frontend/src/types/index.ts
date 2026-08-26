export type Franchise = 'Apex Legends' | 'EA Sports FC' | 'Battlefield' | 'The Sims';

export type FunnelStage = 'ToFu_Exploration' | 'MoFu_Progression' | 'BoFu_Conversion';

export type EASurface = 
  | 'EA_APP_LAUNCHER' 
  | 'IN_GAME_STORE' 
  | 'STADIUM_BOARDS' 
  | 'PAUSE_SCREENS' 
  | 'MOBILE_COMPANION' 
  | 'STREAMING_OVERLAYS';

export type TacticalQuadrant = 
  | 'GOLD_MINES' 
  | 'CORE_DRIVERS' 
  | 'SATURATED_STARS' 
  | 'UNTAPPED' 
  | 'WORKHORSES' 
  | 'EFFICIENCY_RISKS' 
  | 'NOISE' 
  | 'UNDERPERFORMERS' 
  | 'MONEY_PITS';

export interface MechanicTag {
  mechanic_id: string;
  mechanic_name: string;
  funnel_stage: FunnelStage;
  confidence_score: number;
  timestamp_start_sec: number;
  timestamp_end_sec: number;
  bounding_box?: {
    x: number; // 0-100 percentage
    y: number;
    width: number;
    height: number;
  };
  description: string;
  audio_cue?: string;
  visual_hook?: string;
}

export interface CreativeAsset {
  asset_id: string;
  campaign_id: string;
  franchise: Franchise;
  title: string;
  video_url: string;
  thumbnail_url: string;
  duration_sec: number;
  media_type: 'VIDEO' | 'IMAGE';
  funnel_stage: FunnelStage;
  detected_mechanics: MechanicTag[];
  target_surfaces: {
    surface: EASurface;
    compatibility_score: number; // 0-100
    recommendation: string;
  }[];
  pydantic_schema_json: Record<string, any>;
  created_at: string;
}

export interface AttributionFeature {
  feature_id: string;
  feature_name: string;
  franchise: Franchise;
  funnel_stage: FunnelStage;
  surface: EASurface;
  frequency_x: number; // 0-100 scale (Historical occurrence)
  roas_impact_y: number; // -1.0 to +3.5 scale (Marginal SHAP contribution)
  quadrant: TacticalQuadrant;
  confidence: number;
  sample_size: number;
  action_recommendation: string;
  description: string;
}

export interface AttributionModelSummary {
  model_id: string;
  franchise: Franchise;
  features: AttributionFeature[];
  gemini_cot_reasoning: {
    thinking_level: 'HIGH';
    model: 'gemini-3.6-flash';
    executive_summary: string;
    key_drivers: string[];
    risk_factors: string[];
    strategic_action_plan: {
      action: string;
      expected_lift: string;
      rationale: string;
    }[];
    thinking_trace: string[];
  };
  updated_at: string;
}

export interface GeoSpineMetro {
  criteria_id: number;
  metro_name: string;
  state: string;
  lat: number;
  lng: number;
  gamer_population: number;
  population_density_sq_km: number;
  trends_index: number; // 0-100
  weather_shock_temp_c: number; // anomaly vs 56d baseline
  weather_shock_precip_mm: number;
  hill_parameters: {
    base_roas: number;
    half_saturation_s: number; // spend at half saturation ($k)
    shape_k: number; // slope parameter
  };
  predicted_cpi: number;
  predicted_roas: number;
  regional_status: 'BOOST_OPPORTUNITY' | 'STABLE_CORE' | 'CLIMATE_TAILWIND' | 'HIGH_COMPETITION';
}

export interface ChannelCap {
  min: number;
  max: number;
  current_spend: number;
  proposed_spend: number;
  saturation_point: number;
  base_roas: number;
}

export interface ScenarioSimulationRequest {
  total_budget: number;
  target_cpi: number;
  target_roas: number;
  franchise: Franchise;
  channel_caps: {
    youtube: ChannelCap;
    meta: ChannelCap;
    programmatic_3d: ChannelCap;
    tiktok: ChannelCap;
  };
}

export interface ChannelAllocation {
  channel: string;
  current_spend: number;
  proposed_spend: number;
  projected_roas: number;
  marginal_roas: number;
  hill_k?: number;
  hill_s?: number;
  hill_h?: number;
}

export interface SCurvePoint {
  spend: number;
  marginal_roas: number;
  cumulative_roas: number;
  channel: string;
}

export interface ScenarioSimulationResult {
  scenario_id: string;
  total_spend: number;
  predicted_installs: number;
  predicted_d7_roas: number;
  predicted_revenue: number;
  effective_cpi: number;
  pacing_clamp_applied: boolean;
  max_shift_percent: number;
  channel_allocations: {
    channel: string;
    spend: number;
    percentage: number;
    mROAS: number;
    projected_roas: number;
    delta_vs_current: number;
  }[];
  s_curves: SCurvePoint[];
  solver_latency_ms: number;
  a2a_dispatch_ready: boolean;
}

export type PersonaArchetype = 
  | 'COMPETITIVE_GRINDER' 
  | 'LORE_SEEKER' 
  | 'CASUAL_SOCIALIZER' 
  | 'ULTIMATE_TEAM_WHALE';

export type BuyerActionState = 
  | 'INSTANT_PURCHASE' 
  | 'WISHLIST_ADD' 
  | 'FRICTION_ABANDON' 
  | 'COMMUNITY_BACKLASH_RISK';

export interface GamerPersonaProfile {
  persona_id: string;
  archetype: PersonaArchetype;
  name: string;
  age_range: string;
  income_tier: string;
  preferred_franchise: Franchise;
  gaming_hours_weekly: number;
  price_sensitivity_score: number; // 0-100 (high = sensitive)
  competitive_drive: number; // 0-100
  lore_immersion: number; // 0-100
  social_connection: number; // 0-100
  monetization_affinity: number; // 0-100
  avatar_url: string;
  description: string;
}

export interface BAREPersonaEvaluation {
  persona_id: string;
  archetype: PersonaArchetype;
  base_pass: {
    model: string;
    entropy: 'HIGH_ENTROPY_UNALIGNED';
    raw_friction_monologue: string;
    detected_objections: string[];
    sentiment_score: number; // -1.0 to 1.0
  };
  refine_pass: {
    model: 'gemini-3.6-flash';
    entropy: 'LOW_ENTROPY_DETERMINISTIC';
    pydantic_schema_enforced: boolean;
    buyer_action: {
      action: BuyerActionState;
      confidence: number;
      willingness_to_pay_usd: number;
      churn_risk_probability: number;
      conversion_probability: number;
      fsm_transition_valid: boolean;
    };
    radar_resonance: {
      gameplay_excitement: number;
      visual_fidelity: number;
      pricing_fairness: number;
      fomo_intensity: number;
      community_trust: number;
    };
    friction_mitigation_notes: string;
  };
}

export interface ConflictFatigueData {
  target_campaign_id: string;
  target_campaign_name: string;
  conflicting_campaign_id: string;
  conflicting_campaign_name: string;
  target_franchise: string;
  conflicting_franchise: string;
  flight_start: string;
  flight_end: string;
  shared_ea_id_overlap_pct: number; // 42.1%
  shared_player_count: number; // 1,280,000
  ad_fatigue_suppression_penalty_pct: number; // 14.5%
  net_bookings_risk_usd: number; // 420,000
  recommended_timeline_shift_days: number; // 3
  mitigated_flight_start: string; // "2026-10-27"
  mitigated_flight_end: string; // "2026-11-07"
  projected_net_bookings_recovery_usd: number; // 420,000
  baseline_net_bookings_usd: number; // 4,710,000
  unmitigated_net_bookings_usd: number; // 4,290,000
  post_mitigation_net_bookings_usd: number; // 5,130,000
  projected_installs: number; // 364,000
  blended_cpi_usd: number; // 4.12
  day7_roas: number; // 3.42
  mitigation_strategy: string;
  status: 'AMBER_COLLISION_DETECTED' | 'MITIGATED_COLLISION_CLEARED' | 'NO_COLLISION_DETECTED';
}

export interface CampaignIntakeRequest {
  campaign_id: string;
  campaign_name: string;
  franchise: Franchise;
  target_cohort: string;
  flight_start: string;
  flight_end: string;
  total_budget: number;
  channels: string[];
  target_cpi: number;
  target_roas: number;
  apply_mitigation: boolean;
}

export interface CampaignIntakeResponse {
  request: CampaignIntakeRequest;
  kpi_prediction: {
    projected_installs: number;
    blended_cpi: number;
    day7_roas: number;
    baseline_net_bookings: number;
    unmitigated_net_bookings: number;
    current_net_bookings: number;
    post_mitigation_net_bookings: number;
    bookings_recovery: number;
  };
  conflict_data: ConflictFatigueData | null;
  channel_breakdown: {
    channel: string;
    spend: number;
    share_pct: number;
    projected_installs: number;
    cpi: number;
    roas: number;
    bookings: number;
  }[];
}

export interface ShapleyFeatureItem {
  feature_name: string;
  category: 'TOP_OF_FUNNEL' | 'LOWER_FUNNEL_MONETIZATION' | 'NEUTRAL_ENGAGEMENT';
  funnel_tier: 'TOFU' | 'MOFU' | 'BOFU';
  marginal_ctr_lift_pct: number;
  marginal_cti_lift_pct: number;
  marginal_d7_roas_multiplier: number;
  confidence_score: number;
  description: string;
  timestamp_start_sec?: number;
  timestamp_end_sec?: number;
}

export interface ShapleyStorybeat {
  id: string;
  timeframe: string;
  startSec: number;
  endSec: number;
  title: string;
  category: 'TOP_OF_FUNNEL' | 'NEUTRAL_ENGAGEMENT' | 'LOWER_FUNNEL_MONETIZATION' | 'BOFU';
  tier: 'TOFU' | 'MOFU' | 'BOFU';
  ctrLift: number;
  ctiLift: number;
  roas: number;
  description: string;
  assetPreviewUrl?: string;
}

export interface ShapleyPreTestAuditData {
  franchise: Franchise;
  asset_title: string;
  comparison_pair: string;
  features: ShapleyFeatureItem[];
  storybeats: ShapleyStorybeat[];
  funnel_balance_index: number;
  top_of_funnel_score: number;
  lower_funnel_score: number;
  predicted_d7_roas: number;
  prescriptive_action: string;
  recommended_edit: string;
  audit_verdict: 'BALANCED_HIGH_POTENTIAL' | 'NEEDS_LOWER_FUNNEL_MONETIZATION' | 'NEEDS_TOP_OF_FUNNEL_STOPPING_POWER';
}

export interface NielsenDMA {
  dma_code: number;
  google_ads_metro_code: number;
  metro_name: string;
  state: string;
  nielsen_rank: number;
  lat: number;
  lon: number;
  population: number;
  population_weight: number;
  gaming_density_index: number;
  esports_cluster_tag: string;
  timezone: string;
  weather_temp_c: number;
  weather_temp_anom_c: number;
  weather_precip_mm: number;
  t3_lead_shock: boolean;
  t5_lead_shock: boolean;
  t8_lead_shock: boolean;
  t15_lead_shock: boolean;
  indoor_elasticity_multiplier: number;
  recommended_pacing_action: string;
}

export interface WeatherTrajectoryPoint {
  day_offset: number; // 1 to 90
  date_label: string; // e.g. "Day 15", "Oct 24"
  temp_anomaly_c: number;
  precip_mm: number;
  t3_elasticity: number; // 1.00 - 1.50
  t5_elasticity: number;
  t8_elasticity: number;
  t15_elasticity: number;
  realized_elasticity: number;
  surge_threshold: number; // 1.15
}

export interface A2AMediaBuyingDispatchPayload {
  message_id: string;
  timestamp: string;
  sender: 'Dashboard_ScenarioPlanner_Module3';
  recipient: 'ADK_MediaBuyingMicroAgent';
  intent: 'EXECUTE_EQUIMARGINAL_REBALANCE';
  pacing_protocol: 'MERIDIAN_HILL_EQUIMARGINAL_V2';
  payload: {
    franchise: Franchise;
    campaign_id: string;
    total_budget_usd: number;
    net_budget_delta_usd: number;
    portfolio_d7_roas: number;
    pacing_clamp_enforced: boolean;
    max_daily_shift_pct: number;
    channel_allocations: {
      channel: string;
      current_spend: number;
      allocated_spend: number;
      spend_delta: number;
      spend_delta_pct: number;
      marginal_roas: number;
      projected_roas: number;
    }[];
  };
  signature: string;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  source: 'ADK_TAGGING_AGENT' | 'ADK_ANALYTICS_AGENT' | 'ADK_MEDIA_BUYING_AGENT' | 'BARE_PERSONA_AGENT' | 'A2A_BUS' | 'A2UI_DISPATCHER';
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'EXECUTION';
  message: string;
  payload?: Record<string, any>;
  trace_id?: string;
}
