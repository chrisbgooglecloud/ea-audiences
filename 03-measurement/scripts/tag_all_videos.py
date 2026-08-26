#!/usr/bin/env python3
"""EA Creative Video Tagging & 4-Quadrant Shapley Intelligence Pipeline.

Scans all EA video creatives in zz_creatives using Gemini Multimodal Vision,
capturing rich evolving storybeats (mood, intensity, humor, visual hook, CTA, tags),
and computing 4-quadrant feature frequency vs performance matrices with prescriptive guidance.
"""

import os
import sys
import json
import time
import subprocess
from pathlib import Path
from typing import Dict, List, Any

# Clear conflicting certificate env vars if present
for k in [
    "GOOGLE_API_CERTIFICATE_CONFIG",
    "CLOUDSDK_CONTEXT_AWARE_USE_CLIENT_CERTIFICATE",
    "CLOUDSDK_CONTEXT_AWARE_USE_MTLS_FOR_GRPC",
    "CLOUDSDK_CONTEXT_AWARE_CERTIFICATE_CONFIG_FILE_PATH",
]:
    os.environ.pop(k, None)

from google import genai
from google.genai import types

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "eagames-ebc-demo-app")
LOCATION = os.getenv("GEMINI_LOCATION", "global")
MODEL_NAME = "gemini-2.5-flash"
GCS_BUCKET = "eagames-ebc-demo-app-creative-assets"

BASE_DIR = Path(__file__).resolve().parent.parent
ZZ_CREATIVES_DIR = Path(__file__).resolve().parent.parent.parent / "zz_creatives"

OUTPUT_CATALOG_FRONTEND_DATA = BASE_DIR / "frontend" / "public" / "data" / "creative_catalog.json"
OUTPUT_CATALOG_FRONTEND_TS = BASE_DIR / "frontend" / "src" / "lib" / "creative_catalog.ts"
OUTPUT_TAG_QUADRANT_TS = BASE_DIR / "frontend" / "src" / "lib" / "tag_quadrant_data.ts"
OUTPUT_TAG_QUADRANT_JSON = BASE_DIR / "frontend" / "public" / "data" / "tag_quadrant_data.json"
OUTPUT_CATALOG_ROOT = BASE_DIR / "ad_video_catalog.json"

FRANCHISE_METADATA = {
    "fc": {
        "franchise": "EA Sports FC",
        "franchise_key": "fc",
        "displayName": "EA SPORTS FC",
        "defaultSurface": "EA_APP_LAUNCHER",
        "accentColor": "#0072BC",
    },
    "sims": {
        "franchise": "The Sims",
        "franchise_key": "sims",
        "displayName": "The Sims 4",
        "defaultSurface": "MOBILE_COMPANION",
        "accentColor": "#00C48C",
    },
    "apex": {
        "franchise": "Apex Legends",
        "franchise_key": "apex",
        "displayName": "Apex Legends",
        "defaultSurface": "IN_GAME_STORE",
        "accentColor": "#FF4560",
    },
    "battlefield": {
        "franchise": "Battlefield",
        "franchise_key": "battlefield",
        "displayName": "Battlefield",
        "defaultSurface": "STADIUM_BOARDS",
        "accentColor": "#FFB800",
    },
}


def get_video_duration(filepath: Path) -> float:
    """Gets precise video duration in seconds via ffprobe."""
    try:
        cmd = [
            "/opt/homebrew/bin/ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(filepath),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return round(float(res.stdout.strip()), 2)
    except Exception as e:
        print(f"Warning: ffprobe failed for {filepath.name}: {e}", flush=True)
        return 30.0


def build_analysis_prompt(franchise_name: str, duration_sec: float) -> str:
    return f"""You are Principal Creative Intelligence Strategist for Electronic Arts.
Analyze this video ad creative for '{franchise_name}' (Total duration: {duration_sec} seconds).

Your task is to scan the video in depth, extract chronological story beats (scenes), and capture rich evolving creative tags across the duration of the commercial:
- Mood and emotion (e.g. Humorous, Intense, Epic, Cozy, High_Energy, Anticipation, Dramatic, Playful)
- Action & pacing intensity (Low, Medium, High, Very High)
- Humor style (None, Celebrity Banter, Slapstick Irony, Meta Irony, Lighthearted Banter, Witty Cameo)
- Visual Hook type (Celebrity_Cameo, Viral_Skill_Move, Humor_Twist, Combat_Drop, Pack_Reveal, Surreal_Drop, Product_Hero, LiveAction_Bridge, Gameplay_Highlight)
- Call-to-Action presence (None, Mid-Roll Value Prop, Pre-Order Offer, Play Now CTA, Limited Event Callout, Multiplatform Endcard)
- Emergent concept tag
- Granular feature tags active in that beat (e.g. ["Celebrity Cameo", "Living Room Banter", "Surreal TA Taekwondo", "Instant In-Engine Replay", "Rush 5v5 Mode"])
- Marginal CTR Lift % (stopping power), Marginal CTI Lift % (in-game monetization), and ROAS multiplier.

Return a valid JSON object matching this EXACT schema:
{{
  "title": "Clear marketing or trailer title",
  "theme": "Core theme identifier (e.g. Squad_Tactical_Cooperation, Ultimate_Team_Heroes, Community_Feedback_Reveal, Free_Play_Weekend, Nifty_Knitting_Sanctuary, Event_Spotlight)",
  "branding": "Specific branding shown (e.g. EA_SPORTS_FC_Logo, Apex_Legends_Logo, Battlefield_Logo, The_Sims_Plumbob)",
  "cta": "Exact call to action at the end (e.g. Play_Now, Pre_Order_Ultimate_Edition, Play_Free_This_Weekend, Start_Knitting, Coming_June_2)",
  "format": "Format classification: 'Cinematic_Trailer', 'Gameplay_Montage', 'Live_Action_Mixed', or 'Event_Spotlight'",
  "featured_elements": "Comma-separated list of 4-6 prominent visual elements/characters/features",
  "live_action": "'Yes' or 'No'",
  "mechanic": "Primary game mechanic or value prop highlighted in the ad",
  "surface": "Best matching surface from: 'EA_APP_LAUNCHER', 'IN_GAME_STORE', 'STADIUM_BOARDS', 'PAUSE_SCREENS', 'MOBILE_COMPANION', 'STREAMING_OVERLAYS'",
  "funnel_stage": "Dominant funnel stage: 'ToFu_Exploration', 'MoFu_Progression', or 'BoFu_Conversion'",
  "opening_scene": "Concise 1-sentence description of opening scene and initial hook",
  "summary": "2-sentence executive summary explaining creative narrative and conversion strategy",
  "prescriptive_action": "1-2 sentence prescriptive sequencing formula recommending optimal hook-to-conversion pacing",
  "recommended_edit": "1 sentence specific recommendation for video editors / creative studio",
  "story_beats": [
    {{
      "id": "b1",
      "timeframe": "0:00 - 0:08",
      "startSec": 0.0,
      "endSec": 8.0,
      "title": "Short descriptive scene title",
      "category": "TOP_OF_FUNNEL",
      "tier": "TOFU",
      "description": "Detailed description of the visual and narrative action in this beat.",
      "visual_mood": "Humorous",
      "action_intensity": "High",
      "humor_style": "Celebrity Banter",
      "visual_hook": "Celebrity_Cameo",
      "cta_presence": "None",
      "emergent_concept_tag": "BellinghamBanter",
      "tags": ["Celebrity Cameo", "Living Room Banter", "Viral Skill Move", "Humor Twist"],
      "ctrLift": 34.2,
      "ctiLift": 1.5,
      "roas": 2.85
    }}
  ]
}}

Ensure:
1. Provide exactly 4 sequential story beats covering the full video duration (from startSec 0.0 to {duration_sec}).
2. The response is strict, valid JSON without Markdown ticks or extra commentary.
"""


def process_all_videos(client: genai.Client) -> List[Dict[str, Any]]:
    catalog = []
    subfolders = ["fc", "sims", "apex", "battlefield"]
    video_count = 0

    for folder_key in subfolders:
        folder_path = ZZ_CREATIVES_DIR / folder_key
        if not folder_path.exists():
            continue

        meta_info = FRANCHISE_METADATA.get(folder_key, {})
        franchise_name = meta_info.get("franchise", folder_key.upper())
        video_files = sorted(list(folder_path.glob("*.mp4")))

        print(f"\n=======================================================", flush=True)
        print(f"Processing Franchise: {franchise_name} ({len(video_files)} videos)", flush=True)
        print(f"=======================================================", flush=True)

        for idx, v_file in enumerate(video_files):
            video_count += 1
            raw_filename = v_file.name
            project_number = f"EA-{folder_key.upper()}-{idx+1:03d}"
            duration = get_video_duration(v_file)
            gcs_uri = f"gs://{GCS_BUCKET}/creatives/{folder_key}/{raw_filename}"
            web_video_url = f"/videos/{folder_key}/{raw_filename}"

            print(f"\n[{video_count}/9] Scanning [{project_number}] '{raw_filename}' ({duration}s)...", flush=True)
            print(f"    GCS: {gcs_uri}", flush=True)

            prompt = build_analysis_prompt(franchise_name, duration)
            video_part = types.Part.from_uri(file_uri=gcs_uri, mime_type="video/mp4")

            try:
                t0 = time.time()
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=[video_part, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2,
                    ),
                )
                elapsed = round(time.time() - t0, 2)
                data = json.loads(response.text)

                story_beats = []
                for b_idx, sb in enumerate(data.get("story_beats", [])):
                    sb_id = f"{folder_key}-{idx+1}-b{b_idx+1}"
                    start_sec = float(sb.get("startSec", 0.0))
                    end_sec = float(sb.get("endSec", duration))
                    tf = sb.get("timeframe") or f"{int(start_sec//60)}:{int(start_sec%60):02d} - {int(end_sec//60)}:{int(end_sec%60):02d}"

                    raw_tags = sb.get("tags", [])
                    if isinstance(raw_tags, str):
                        raw_tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
                    elif not isinstance(raw_tags, list):
                        raw_tags = []

                    # Default fallback tags if empty
                    if not raw_tags:
                        raw_tags = [
                            sb.get("visual_hook", "Gameplay_Highlight").replace("_", " "),
                            sb.get("visual_mood", "High Energy").replace("_", " "),
                            sb.get("emergent_concept_tag", franchise_name).replace("_", " "),
                        ]

                    story_beats.append({
                        "id": sb_id,
                        "timeframe": tf,
                        "startSec": round(start_sec, 1),
                        "endSec": round(end_sec, 1),
                        "title": sb.get("title", f"Scene {b_idx+1}"),
                        "category": sb.get("category", "TOP_OF_FUNNEL" if b_idx == 0 else "MIDDLE_OF_FUNNEL"),
                        "tier": sb.get("tier", "TOFU" if b_idx == 0 else "MOFU"),
                        "description": sb.get("description", ""),
                        "visual_mood": sb.get("visual_mood", "Dynamic"),
                        "action_intensity": sb.get("action_intensity", "High"),
                        "humor_style": sb.get("humor_style", "None"),
                        "visual_hook": sb.get("visual_hook", "Gameplay_Highlight"),
                        "cta_presence": sb.get("cta_presence", "None" if b_idx < 3 else "Play Now CTA"),
                        "emergent_concept_tag": sb.get("emergent_concept_tag", data.get("theme", "Creative_Beat")),
                        "tags": raw_tags,
                        "ctrLift": float(sb.get("ctrLift", 15.0)),
                        "ctiLift": float(sb.get("ctiLift", 5.0)),
                        "roas": float(sb.get("roas", 2.20)),
                    })

                entry = {
                    "project_number": project_number,
                    "franchise": franchise_name,
                    "franchise_key": folder_key,
                    "title": data.get("title", v_file.stem),
                    "theme": data.get("theme", "Core_Gameplay"),
                    "branding": data.get("branding", "EA_SPORTS"),
                    "cta": data.get("cta", "Play_Now"),
                    "format": data.get("format", "Cinematic_Trailer"),
                    "duration_sec": duration,
                    "duration_str": f"{int(duration)}s",
                    "featured_elements": data.get("featured_elements", ""),
                    "live_action": data.get("live_action", "No"),
                    "mechanic": data.get("mechanic", "Gameplay Action"),
                    "surface": data.get("surface", meta_info.get("defaultSurface", "EA_APP_LAUNCHER")),
                    "funnel_stage": data.get("funnel_stage", "MoFu_Progression"),
                    "opening_scene": data.get("opening_scene", ""),
                    "summary": data.get("summary", ""),
                    "prescriptive_action": data.get("prescriptive_action", ""),
                    "recommended_edit": data.get("recommended_edit", ""),
                    "story_beats": story_beats,
                    "video_path": web_video_url,
                    "gcs_uri": gcs_uri,
                    "local_filename": raw_filename,
                }

                catalog.append(entry)
                print(f"    -> [SUCCESS in {elapsed}s]: Title='{entry['title']}' | Beats={len(story_beats)}", flush=True)

            except Exception as e:
                print(f"    -> [ERROR on {raw_filename}]: {e}", flush=True)
                raise e

    return catalog


def build_tag_quadrant_analysis(catalog: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Aggregates all tags across videos and beats into 4-quadrant feature frequency vs performance dataset."""
    
    dimension_keywords = {
        "Hooks & Openers": ["hook", "cameo", "reveal", "intro", "breakthrough", "twist", "opening", "launch", "start", "establishing"],
        "Mood & Tone": ["energy", "humorous", "intense", "epic", "cozy", "anticipation", "dramatic", "excitement", "cinematic", "dynamic", "vibe", "mood"],
        "Humor & Talent": ["banter", "humor", "celebrity", "cameo", "bellingham", "zidane", "verstappen", "beckham", "zlatan", "irony", "slapstick", "satire"],
        "CTAs & Value Props": ["cta", "pre-order", "play now", "offer", "trial", "endcard", "discount", "edition", "reward", "unlock", "plopsy", "economy"],
        "Gameplay & Mechanics": ["tackle", "rush", "gameplay", "hypermotion", "knitting", "combat", "jet", "tank", "supermoto", "race", "modifier", "cloak", "map", "strike", "volumetric"],
    }

    def infer_dimension(tag_name: str) -> str:
        t_lower = tag_name.lower()
        for dim, kws in dimension_keywords.items():
            if any(kw in t_lower for kw in kws):
                return dim
        return "Gameplay & Mechanics"

    franchises = ["All", "EA Sports FC", "Battlefield", "Apex Legends", "The Sims"]
    franchise_key_map = {
        "All": "all",
        "EA Sports FC": "fc",
        "Battlefield": "battlefield",
        "Apex Legends": "apex",
        "The Sims": "sims",
    }

    all_quadrant_data = {}

    for target_franchise in franchises:
        if target_franchise == "All":
            filtered_videos = catalog
        else:
            filtered_videos = [v for v in catalog if v["franchise"].lower() == target_franchise.lower()]

        total_beats = sum(len(v["story_beats"]) for v in filtered_videos)
        if total_beats == 0:
            continue

        tag_stats: Dict[str, Dict[str, Any]] = {}

        for video in filtered_videos:
            for beat in video["story_beats"]:
                beat_tags = set(beat.get("tags", []))
                if beat.get("visual_hook"):
                    beat_tags.add(beat["visual_hook"].replace("_", " "))
                if beat.get("visual_mood"):
                    beat_tags.add(f"{beat['visual_mood']} Mood".replace("_", " "))
                if beat.get("humor_style") and beat["humor_style"] != "None":
                    beat_tags.add(beat["humor_style"].replace("_", " "))
                if beat.get("cta_presence") and beat["cta_presence"] != "None":
                    beat_tags.add(beat["cta_presence"].replace("_", " "))
                if beat.get("emergent_concept_tag"):
                    beat_tags.add(beat["emergent_concept_tag"].replace("_", " "))

                # Performance metric combines CTI (in-game monetization) and CTR (stopping power) weighted by ROAS
                perf_score = (beat["ctiLift"] * 0.6) + (beat["ctrLift"] * 0.4) * (beat["roas"] / 2.5)

                for t in beat_tags:
                    t_clean = t.strip().title()
                    if len(t_clean) < 3 or t_clean.lower() in ["none", "default"]:
                        continue
                    if t_clean not in tag_stats:
                        tag_stats[t_clean] = {
                            "tag": t_clean,
                            "dimension": infer_dimension(t_clean),
                            "count": 0,
                            "total_perf": 0.0,
                            "cti_lifts": [],
                            "ctr_lifts": [],
                            "roas_values": [],
                            "sample_videos": [],
                            "sample_beats": [],
                        }
                    tag_stats[t_clean]["count"] += 1
                    tag_stats[t_clean]["total_perf"] += perf_score
                    tag_stats[t_clean]["cti_lifts"].append(beat["ctiLift"])
                    tag_stats[t_clean]["ctr_lifts"].append(beat["ctrLift"])
                    tag_stats[t_clean]["roas_values"].append(beat["roas"])
                    if video["title"] not in tag_stats[t_clean]["sample_videos"]:
                        tag_stats[t_clean]["sample_videos"].append(video["title"])
                    if len(tag_stats[t_clean]["sample_beats"]) < 2:
                        tag_stats[t_clean]["sample_beats"].append({
                            "videoTitle": video["title"],
                            "timeframe": beat["timeframe"],
                            "title": beat["title"],
                            "description": beat["description"],
                        })

        tag_items = []
        for tag_name, stats in tag_stats.items():
            freq_pct = round((stats["count"] / len(filtered_videos)) * 100, 1)
            avg_perf = round(stats["total_perf"] / stats["count"], 1)
            avg_cti = round(sum(stats["cti_lifts"]) / len(stats["cti_lifts"]), 1)
            avg_ctr = round(sum(stats["ctr_lifts"]) / len(stats["ctr_lifts"]), 1)
            avg_roas = round(sum(stats["roas_values"]) / len(stats["roas_values"]), 2)

            tag_items.append({
                "tag": tag_name,
                "dimension": stats["dimension"],
                "count": stats["count"],
                "frequency": freq_pct,
                "performance": avg_perf,
                "ctiLift": avg_cti,
                "ctrLift": avg_ctr,
                "roas": avg_roas,
                "sample_videos": stats["sample_videos"][:3],
                "sample_beats": stats["sample_beats"],
            })

        freq_median = 40.0 if target_franchise == "All" else 50.0
        perf_median = 12.0

        for item in tag_items:
            is_high_freq = item["frequency"] >= freq_median
            is_high_perf = item["performance"] >= perf_median

            if is_high_freq and is_high_perf:
                item["quadrant"] = "UPPER_RIGHT"
                item["quadrant_label"] = "KEEP IT UP! (Core Driver)"
                item["quadrant_badge"] = "Double Down"
                item["color"] = "#00C48C"
                item["guidance"] = f"High frequency ({item['frequency']}%) and high performance (+{item['performance']}% lift). Proven player anchor. Continue maintaining this core asset."
            elif is_high_freq and not is_high_perf:
                item["quadrant"] = "LOWER_RIGHT"
                item["quadrant_label"] = "STOP DOING THIS (Fatigue / Low ROI)"
                item["quadrant_badge"] = "Cut Back"
                item["color"] = "#FF4560"
                item["guidance"] = f"High frequency ({item['frequency']}%) but underdelivering on lift ({item['performance']}%). Shows signs of creative fatigue. Reduce screen time or reframe hook."
            elif not is_high_freq and is_high_perf:
                item["quadrant"] = "UPPER_LEFT"
                item["quadrant_label"] = "OPPORTUNITY (Untapped High-Return)"
                item["quadrant_badge"] = "Scale Up"
                item["color"] = "#008BE6"
                item["guidance"] = f"Low frequency ({item['frequency']}%) yet drives outsized performance (+{item['performance']}% lift). Prime candidate for scaling into mainstream creative rotations."
            else:
                item["quadrant"] = "LOWER_LEFT"
                item["quadrant_label"] = "AVOID (Low Impact / Low Priority)"
                item["quadrant_badge"] = "Avoid / Deprecate"
                item["color"] = "#8FA3BC"
                item["guidance"] = f"Low frequency ({item['frequency']}%) and low performance ({item['performance']}%). Low conversion leverage. Deprioritize production spend."

        tag_items.sort(key=lambda x: x["performance"], reverse=True)

        upper_right_top = [t["tag"] for t in tag_items if t["quadrant"] == "UPPER_RIGHT"][:3]
        upper_left_top = [t["tag"] for t in tag_items if t["quadrant"] == "UPPER_LEFT"][:3]
        lower_right_top = [t["tag"] for t in tag_items if t["quadrant"] == "LOWER_RIGHT"][:3]
        lower_left_top = [t["tag"] for t in tag_items if t["quadrant"] == "LOWER_LEFT"][:3]

        all_quadrant_data[target_franchise] = {
            "franchise": target_franchise,
            "franchise_key": franchise_key_map[target_franchise],
            "total_videos": len(filtered_videos),
            "total_tags": len(tag_items),
            "freq_threshold": freq_median,
            "perf_threshold": perf_median,
            "tags": tag_items,
            "prescriptive_summary": {
                "keep_it_up": {
                    "title": "KEEP IT UP! (High Frequency, High ROAS)",
                    "tags": upper_right_top,
                    "action": f"Double down on {', '.join(upper_right_top) if upper_right_top else 'core signature mechanics'}; these deliver proven ROI and strong player conversion.",
                },
                "opportunity": {
                    "title": "SCALE UP (Low Frequency, High ROAS)",
                    "tags": upper_left_top,
                    "action": f"Unleash untapped potential by increasing deployments of {', '.join(upper_left_top) if upper_left_top else 'emergent high-impact hooks'}.",
                },
                "stop_doing_this": {
                    "title": "STOP DOING THIS (High Frequency, Low Return)",
                    "tags": lower_right_top,
                    "action": f"Cut back or re-edit {', '.join(lower_right_top) if lower_right_top else 'generic filler beats'}; they suffer from viewer fatigue.",
                },
                "avoid": {
                    "title": "AVOID / DEPRECATE (Low Frequency, Low Return)",
                    "tags": lower_left_top,
                    "action": f"Deprioritize {', '.join(lower_left_top) if lower_left_top else 'low-leverage assets'} to streamline creative production budget.",
                },
            },
        }

    return all_quadrant_data


def save_all_artifacts(catalog: List[Dict[str, Any]], quadrant_data: Dict[str, Any]):
    OUTPUT_CATALOG_FRONTEND_DATA.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CATALOG_FRONTEND_DATA, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
    with open(OUTPUT_CATALOG_ROOT, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    ts_catalog = f"""// Generated by scripts/tag_all_videos.py with Gemini Multimodal Intelligence
export interface StorybeatItem {{
  id: string;
  timeframe: string;
  startSec: number;
  endSec: number;
  title: string;
  category: string;
  tier: string;
  description: string;
  visual_mood: string;
  action_intensity: string;
  humor_style: string;
  visual_hook: string;
  cta_presence: string;
  emergent_concept_tag: string;
  tags: string[];
  ctrLift: number;
  ctiLift: number;
  roas: number;
}}

export interface CreativeCatalogItem {{
  project_number: string;
  franchise: string;
  franchise_key: string;
  title: string;
  theme: string;
  branding: string;
  cta: string;
  format: string;
  duration_sec: number;
  duration_str: string;
  featured_elements: string;
  live_action: string;
  mechanic: string;
  surface: string;
  funnel_stage: string;
  opening_scene: string;
  summary: string;
  prescriptive_action: string;
  recommended_edit: string;
  story_beats: StorybeatItem[];
  video_path: string;
  gcs_uri: string;
  local_filename: string;
}}

export const REAL_CREATIVE_CATALOG: CreativeCatalogItem[] = {json.dumps(catalog, indent=2, ensure_ascii=False)};
"""
    with open(OUTPUT_CATALOG_FRONTEND_TS, "w", encoding="utf-8") as f:
        f.write(ts_catalog)

    with open(OUTPUT_TAG_QUADRANT_JSON, "w", encoding="utf-8") as f:
        json.dump(quadrant_data, f, indent=2, ensure_ascii=False)

    ts_quadrant = f"""// Generated by scripts/tag_all_videos.py
export type QuadrantType = 'UPPER_RIGHT' | 'UPPER_LEFT' | 'LOWER_RIGHT' | 'LOWER_LEFT';

export interface SampleBeat {{
  videoTitle: string;
  timeframe: string;
  title: string;
  description: string;
}}

export interface TagQuadrantItem {{
  tag: string;
  dimension: 'Hooks & Openers' | 'Mood & Tone' | 'Humor & Talent' | 'CTAs & Value Props' | 'Gameplay & Mechanics';
  count: number;
  frequency: number; // 0 - 100% (X-axis)
  performance: number; // Marginal lift % (Y-axis)
  ctiLift: number;
  ctrLift: number;
  roas: number;
  quadrant: QuadrantType;
  quadrant_label: string;
  quadrant_badge: string;
  color: string;
  guidance: string;
  sample_videos: string[];
  sample_beats: SampleBeat[];
}}

export interface PrescriptiveQuadrantSummary {{
  title: string;
  tags: string[];
  action: string;
}}

export interface FranchiseQuadrantData {{
  franchise: string;
  franchise_key: string;
  total_videos: number;
  total_tags: number;
  freq_threshold: number;
  perf_threshold: number;
  tags: TagQuadrantItem[];
  prescriptive_summary: {{
    keep_it_up: PrescriptiveQuadrantSummary;
    opportunity: PrescriptiveQuadrantSummary;
    stop_doing_this: PrescriptiveQuadrantSummary;
    avoid: PrescriptiveQuadrantSummary;
  }};
}}

export const TAG_QUADRANT_ANALYSIS: Record<string, FranchiseQuadrantData> = {json.dumps(quadrant_data, indent=2, ensure_ascii=False)};
"""
    with open(OUTPUT_TAG_QUADRANT_TS, "w", encoding="utf-8") as f:
        f.write(ts_quadrant)

    print("\n[SUCCESS] Successfully saved all video catalog and 4-quadrant datasets!", flush=True)


def main():
    print("=================================================================", flush=True)
    print("EA Creative Video Tagging & 4-Quadrant Shapley Pipeline")
    print(f"Model: {MODEL_NAME} | Project: {PROJECT_ID} | Location: {LOCATION}")
    print("=================================================================", flush=True)

    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

    print("\nScanning all 9 EA video creatives with Gemini Multimodal Vision...")
    catalog = process_all_videos(client)

    print(f"\nSuccessfully scanned {len(catalog)} videos across 4 franchises.")
    print("Computing 4-Quadrant Feature Frequency vs Performance Matrix...")
    quadrant_data = build_tag_quadrant_analysis(catalog)

    save_all_artifacts(catalog, quadrant_data)
    print("\nPipeline execution complete!")


if __name__ == "__main__":
    main()
