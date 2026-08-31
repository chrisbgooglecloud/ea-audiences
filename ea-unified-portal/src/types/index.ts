export type NodeType = "PLAYER" | "IDENTITY" | "GAME" | "CLAN" | "OFFER" | "CREATOR";

export type GameFranchise = "ALL" | "FC26" | "APEX" | "MADDEN25" | "BATTLEFIELD" | "SIMS4";
export type Franchise = "Apex Legends" | "EA Sports FC" | "EA SPORTS FC 26" | "Battlefield" | "Battlefield 2042" | "The Sims" | "The Sims 4" | "Madden NFL 25" | "EA Live Service" | GameFranchise | string;

export type Archetype =
  | "COMPETITIVE_GRINDER"
  | "ULTIMATE_TEAM_WHALE"
  | "CASUAL_SOCIALIZER"
  | "LORE_SEEKER"
  | "RANKED_SWEAT"
  | "HEIRLOOM_WHALE"
  | "CASUAL_WARRIOR"
  | "MUT_WHALE"
  | "CONQUEST_LEADER"
  | "SIMS_COLLECTOR"
  | "BUILDER_CREATOR";

export type ContextualViewType =
  | "audience-cohorts"
  | "geo-map"
  | "marketing-journey"
  | "single-identity"
  | "cross-franchise"
  | "social-clans";

export interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  franchise?: GameFranchise | string;
  archetype?: Archetype | string;
  spend?: number;
  churn_risk?: number;
  tilt?: number;
  loss_streak?: number;
  squad_ovr?: number;
  rank_tier?: string;
  kd_ratio?: number;
  expansion_count?: number;
  favorite_class?: string;
  confidence?: number;
  platform?: string;
  hours?: number;
  val?: number;
  color?: string;
  offer_data?: any;
  creator_data?: any;
  followed_creators?: string[];
  primary_creator_influence?: string;
  game_telemetry?: Record<string, any>;
  purchased_items?: Array<{ title: string; price: number; date: string; category: string; type?: string }>;
  country?: string;
  country_code?: string;
  country_flag?: string;
  dma_market?: string;
  lat?: number;
  lng?: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
  value?: number;
  isTriggerStream?: boolean;
  color?: string;
  curvature?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface PlayerIdentity {
  platform: string;
  handle: string;
  confidence_score: number;
}

export interface MasterPlayer {
  player_id: string;
  display_name: string;
  primary_email: string;
  primary_franchise: string;
  country: string;
  dma_market?: string;
  lat?: number;
  lng?: number;
  lifetime_spend_usd: number;
  primary_archetype: Archetype | string;
  churn_risk_score: number;
  tilt_sensitivity: number;
  recent_loss_streak?: number;
  archetype_embedding?: number[];
  linked_identities?: PlayerIdentity[];
  franchises_played?: string[];
  total_play_hours?: number;
  game_telemetry?: Record<string, any>;
  last_active_at?: string;
}

export interface TelemetryEvent {
  event_id: string;
  player_id: string;
  game_id: string;
  session_id: string;
  event_timestamp: string;
  event_type: "MATCH_COMPLETE" | "PURCHASE" | "RAGE_QUIT" | "SQUAD_JOIN" | "TIER_UNLOCK";
  match_outcome?: "VICTORY" | "DEFEAT" | "CRUSHING_LOSS" | "STALEMATE";
  loss_streak_count?: number;
  session_duration_minutes?: number;
  frustration_score?: number;
  tilt_index?: number;
  spend_amount_usd?: number;
  metadata_json?: Record<string, any>;
}

export interface MarketingOffer {
  offer_id: string;
  target_franchise: string;
  offer_title: string;
  offer_type: string;
  price_usd: number;
  discount_percent: number;
  trigger_condition: string;
  description: string;
  category?: string;
  affinity_archetype?: string;
  projected_revenue_lift?: string;
  conversion_rate?: string;
}

export interface DeepSonaReaction {
  archetype: Archetype | string;
  gamer_tag?: string;
  player_id?: string;
  willingness_to_pay_usd: number;
  churn_risk_score: number;
  final_fsm_state: "PURCHASED" | "ENGAGED_FREE" | "EVALUATING" | "ABANDONED" | "BOYCOTT";
  authenticity_rating: number;
  verbatim_quote: string;
  sentiment_score: number;
}

export interface CohortContext {
  query: string;
  franchise?: string;
  matchedCount: number;
  estimatedTotal: number;
  dominantArchetype: string;
  avgSpend: number;
  suggestedCampaign?: string;
  avgChurn?: number;
}

export interface DeepSonaResult {
  campaign_id: string;
  franchise: string;
  creative_title: string;
  target_cohort_query?: string;
  proposed_spend: number;
  target_roas: number;
  reactions: DeepSonaReaction[];
  consensus_summary: string;
  predicted_conversion_lift: number;
  sentiment_decay_index: number;
  churn_mitigation_lift: number;
  projected_revenue_impact_usd: number;
  a2ui_components?: any[];
}

export interface CampaignBrief {
  brief_id: string;
  title: string;
  franchise: string;
  target_segment: string;
  audience_size: number;
  trigger_rules: string[];
  deepsona_consensus: string;
  predicted_conversion_lift: number;
  projected_roi: number;
  recommended_action: string;
  creative_hooks: string[];
  generated_at: string;
}

export interface A2AMessageType {
  message_id: string;
  correlation_id: string;
  sender: string;
  recipient: string;
  timestamp: string;
  intent: string;
  payload: Record<string, any>;
  status: string;
}

// Measurement & Econometric Types
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
    x: number;
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
    compatibility_score: number;
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
  frequency_x: number;
  roas_impact_y: number;
  quadrant: TacticalQuadrant;
  confidence: number;
  sample_size: number;
  action_recommendation: string;
  description: string;
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

export interface ConflictFatigueData {
  target_campaign_id: string;
  target_campaign_name: string;
  conflicting_campaign_id: string;
  conflicting_campaign_name: string;
  target_franchise: string;
  conflicting_franchise: string;
  flight_start: string;
  flight_end: string;
  shared_ea_id_overlap_pct: number;
  shared_player_count: number;
  ad_fatigue_suppression_penalty_pct: number;
  net_bookings_risk_usd: number;
  recommended_timeline_shift_days: number;
  mitigated_flight_start: string;
  mitigated_flight_end: string;
  projected_net_bookings_recovery_usd: number;
  baseline_net_bookings_usd: number;
  unmitigated_net_bookings_usd: number;
  post_mitigation_net_bookings_usd: number;
  projected_installs: number;
  blended_cpi_usd: number;
  day7_roas: number;
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
  day_offset: number;
  date_label: string;
  temp_anomaly_c: number;
  precip_mm: number;
  t3_elasticity: number;
  t5_elasticity: number;
  t8_elasticity: number;
  t15_elasticity: number;
  realized_elasticity: number;
  surge_threshold: number;
}

// Act 4: Commerce Media Types
export interface CommerceAdImpression {
  impression_id: string;
  match_id: string;
  franchise: string;
  dma_code: number;
  surface: 'STADIUM_BOARDS' | 'PAUSE_SCREENS' | 'ROAD_BILLBOARDS';
  timestamp: string;
  dwell_time_seconds: number;
  camera_view_angle_degrees: number;
  occlusion_percentage: number;
  clearing_cpm_usd: number;
  ias_brand_safety_score: number;
  ias_viewability_status: 'VIEWABLE_PASSED' | 'OCCLUSION_FAILED' | 'DWELL_UNDER_THRESHOLD';
}

export interface AdvertiserCampaignBooking {
  campaign_id: string;
  advertiser_name: string;
  target_franchise: string;
  target_surfaces: string[];
  target_dmas: number[];
  budget_usd: number;
  max_cpm_bid: number;
  pacing_daily_limit: number;
  creative_texture_url?: string;
  status: 'ACTIVE_SERVING' | 'PENDING_APPROVAL' | 'PAUSED';
}
export * from './creative';

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
  trends_index: number;
  weather_shock_temp_c: number;
  weather_shock_precip_mm: number;
  hill_parameters: {
    base_roas: number;
    half_saturation_s: number;
    shape_k: number;
  };
  predicted_cpi: number;
  predicted_roas: number;
  regional_status: 'BOOST_OPPORTUNITY' | 'STABLE_CORE' | 'CLIMATE_TAILWIND' | 'HIGH_COMPETITION';
}

export type PersonaArchetype = 
  | 'COMPETITIVE_GRINDER' 
  | 'LORE_SEEKER' 
  | 'CASUAL_SOCIALIZER' 
  | 'ULTIMATE_TEAM_WHALE'
  | string;

export type BuyerActionState = 
  | 'INSTANT_PURCHASE' 
  | 'WISHLIST_ADD' 
  | 'FRICTION_ABANDON' 
  | 'COMMUNITY_BACKLASH_RISK'
  | string;

export interface GamerPersonaProfile {
  persona_id: string;
  archetype: PersonaArchetype;
  name: string;
  age_range: string;
  income_tier: string;
  preferred_franchise: Franchise;
  gaming_hours_weekly: number;
  price_sensitivity_score: number;
  competitive_drive: number;
  lore_immersion: number;
  social_connection: number;
  monetization_affinity: number;
  avatar_url: string;
  description: string;
}

export interface BAREPersonaEvaluation {
  persona_id: string;
  archetype: PersonaArchetype;
  base_pass: {
    model: string;
    entropy: 'HIGH_ENTROPY_UNALIGNED' | string;
    raw_friction_monologue: string;
    detected_objections: string[];
    sentiment_score: number;
  };
  refine_pass: {
    model: 'gemini-3.6-flash' | string;
    entropy: 'LOW_ENTROPY_DETERMINISTIC' | string;
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

export interface TelemetryLog {
  id: string;
  timestamp: string;
  source: 'ADK_TAGGING_AGENT' | 'ADK_ANALYTICS_AGENT' | 'ADK_MEDIA_BUYING_AGENT' | 'BARE_PERSONA_AGENT' | 'A2A_BUS' | 'A2UI_DISPATCHER' | string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'EXECUTION' | string;
  message: string;
  payload?: Record<string, any>;
  trace_id?: string;
}

export interface A2AMediaBuyingDispatchPayload {
  message_id: string;
  timestamp: string;
  sender: 'Dashboard_ScenarioPlanner_Module3' | string;
  recipient: 'ADK_MediaBuyingMicroAgent' | string;
  intent: 'EXECUTE_EQUIMARGINAL_REBALANCE' | string;
  pacing_protocol: 'MERIDIAN_HILL_EQUIMARGINAL_V2' | string;
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

export * from './creative';

