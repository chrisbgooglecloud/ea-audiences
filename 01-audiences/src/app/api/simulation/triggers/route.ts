import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { SituationalTrigger } from "@/lib/types";

let cachedTelemetry: any[] = [];

function getTelemetry() {
  if (cachedTelemetry.length === 0) {
    const p = path.join(process.cwd(), "data/telemetry_match_events.json");
    if (fs.existsSync(p)) {
      cachedTelemetry = JSON.parse(fs.readFileSync(p, "utf-8"));
    }
  }
  return cachedTelemetry;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stepIndex = parseInt(searchParams.get("step") || "0", 10);
  const batchSize = 15;

  const telemetry = getTelemetry();
  const start = (stepIndex * batchSize) % Math.max(1, telemetry.length - batchSize);
  const currentBatch = telemetry.slice(start, start + batchSize);

  const triggers: SituationalTrigger[] = [];
  const activeStreams: { playerId: string; offerId: string; reason: string }[] = [];

  for (const ev of currentBatch) {
    if (ev.loss_streak_count >= 3 || ev.event_type === "RAGE_QUIT") {
      const trig: SituationalTrigger = {
        trigger_id: `trig-fc-${ev.event_id}`,
        player_id: ev.player_id,
        player_name: `FUT Player ${ev.player_id.replace("ea-fc-", "#")}`,
        trigger_type: "FUT_CHAMPIONS_LOSS_STREAK_TILT",
        offer_id: "offer-fc26-champs-pity-pack",
        offer_title: "FUT Champions Loss-Mitigation Pity Pack ($4.99)",
        price_usd: 4.99,
        discount_percent: 65.0,
        frustration_score: ev.frustration_score,
        loss_streak: ev.loss_streak_count,
        timestamp: ev.event_timestamp,
      };
      triggers.push(trig);
      activeStreams.push({
        playerId: ev.player_id,
        offerId: "offer-fc26-champs-pity-pack",
        reason: `3-loss Champs streak detected (Tilt: ${(ev.frustration_score * 100).toFixed(0)}%)`,
      });
    } else if (ev.event_type === "PURCHASE" && ev.spend_amount_usd > 30) {
      const trig: SituationalTrigger = {
        trigger_id: `trig-fc-${ev.event_id}`,
        player_id: ev.player_id,
        player_name: `FUT Player ${ev.player_id.replace("ea-fc-", "#")}`,
        trigger_type: "FUT_WHALE_PROMO_DROP_ENGAGEMENT",
        offer_id: "offer-fc26-whale-promo-flash",
        offer_title: "Guaranteed 88+ Campaign Icon Flash Pack ($49.99)",
        price_usd: 49.99,
        discount_percent: 25.0,
        frustration_score: 0.1,
        loss_streak: 0,
        timestamp: ev.event_timestamp,
      };
      triggers.push(trig);
      activeStreams.push({
        playerId: ev.player_id,
        offerId: "offer-fc26-whale-promo-flash",
        reason: `Whale FC Points reload ($${ev.spend_amount_usd})`,
      });
    }
  }

  return NextResponse.json({
    stepIndex,
    currentTimestamp: currentBatch[0]?.event_timestamp || new Date().toISOString(),
    batchEventsEvaluated: currentBatch.length,
    triggers,
    activeStreams,
  });
}
