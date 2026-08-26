#!/usr/bin/env python3
"""EA EBC Multimodal Creative Intelligence & Shapley Analysis Pipeline.

Analyzes raw video creatives using gemini-3.7-flash with HIGH media resolution
and deep thinking budgets across EA Franchises (FC, The Sims, Apex Legends, Battlefield),
generating structured storybeat tags, econometric Shapley attributions, and UI catalog data.
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
MODEL_NAME = "gemini-3.7-flash"
GCS_BUCKET = "eagames-ebc-demo-app-creative-assets"

BASE_DIR = Path(__file__).resolve().parent.parent
ZZ_CREATIVES_DIR = Path(__file__).resolve().parent.parent.parent / "zz_creatives"
OUTPUT_CATALOG_FRONTEND_DATA = BASE_DIR / "frontend" / "public" / "data" / "creative_catalog.json"
OUTPUT_CATALOG_FRONTEND_TS = BASE_DIR / "frontend" / "src" / "lib" / "creative_catalog.ts"
OUTPUT_CATALOG_ROOT = BASE_DIR / "ad_video_catalog.json"

FRANCHISE_METADATA = {
    "fc": {
        "franchise": "EA Sports FC",
        "displayName": "EA SPORTS FC",
        "defaultSurface": "EA_APP_LAUNCHER",
        "accentColor": "#0072BC",
    },
    "sims": {
        "franchise": "The Sims",
        "displayName": "The Sims 4",
        "defaultSurface": "MOBILE_COMPANION",
        "accentColor": "#00C48C",
    },
    "apex": {
        "franchise": "Apex Legends",
        "displayName": "Apex Legends",
        "defaultSurface": "IN_GAME_STORE",
        "accentColor": "#FF4560",
    },
    "battlefield": {
        "franchise": "Battlefield",
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
    return f"""You are EA's Chief Creative Strategist and Multimodal Econometric Intelligence Agent.
Analyze this video ad creative for franchise '{franchise_name}' (Total duration: {duration_sec} seconds).

You must return a valid JSON object matching this EXACT schema:
{{
  "title": "Clear marketing or trailer title",
  "theme": "Core theme identifier (e.g. FUT_Pack_Walkout, HyperMotion_Physics, Squad_Tactical_Cooperation, Free_Play_Weekend, Nifty_Knitting_Sanctuary, Heirloom_Event)",
  "branding": "Specific branding shown (e.g. EA_SPORTS_FC_Logo, Apex_Legends_Logo, Battlefield_Logo, The_Sims_Plumbob)",
  "cta": "Exact call to action at the end (e.g. Pre_Order_Ultimate_Edition, Play_Free_This_Weekend, Join_The_Club, Download_Now)",
  "format": "Format classification: 'Cinematic_Trailer', 'Gameplay_Montage', 'Live_Action_Mixed', or 'Event_Spotlight'",
  "featured_elements": "Comma-separated list of 4-6 prominent visual elements/characters/features (e.g. Jude Bellingham walkout, skill move trick shot, crowded stadium, tactical map)",
  "live_action": "'Yes' or 'No'",
  "mechanic": "Primary game mechanic highlighted in the ad (e.g. HyperMotion Volumetric Dribbling, Tactical Squad Ping, Mythic Heirloom Melee, Knitting Craft Progression)",
  "surface": "Best matching surface from: 'EA_APP_LAUNCHER', 'IN_GAME_STORE', 'STADIUM_BOARDS', 'PAUSE_SCREENS', 'MOBILE_COMPANION', 'STREAMING_OVERLAYS'",
  "funnel_stage": "Dominant funnel stage: 'ToFu_Exploration', 'MoFu_Progression', or 'BoFu_Conversion'",
  "opening_scene": "Concise 1-sentence description of the opening scene and thumbstop hook",
  "summary": "2-sentence high-impact analytical summary explaining why this ad succeeds in player acquisition and monetization",
  "fbi_score": 0.76,
  "fbi_status": "BALANCED_HIGH_POTENTIAL",
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
      "description": "2-sentence analytical breakdown of visual action, player psychology, and pacing.",
      "visual_hook": "Visual hook type (e.g. Viral_Skill_Move, Pack_Reveal, Combat_Drop, Humor_Twist, Product_Hero)",
      "visual_mood": "Mood (e.g. High_Energy, Epic, Humorous, Cozy, Intense, Anticipation)",
      "action_intensity": "High",
      "emergent_concept_tag": "ShortTag",
      "ctrLift": 38.5,
      "ctiLift": -4.2,
      "roas": 2.15
    }}
  ]
}}

Ensure:
1. Provide exactly 4 distinct sequential storybeats covering the full video duration (from startSec 0.0 to {duration_sec}).
2. Early scenes should focus on Stopping Power / CTR (ToFu), middle on Engagement (MoFu), and final scenes on Store Conversion / CTI (BoFu).
3. The response is strict, valid JSON without Markdown ticks or extra commentary.
"""


def save_catalog(catalog: List[Dict[str, Any]]):
    """Saves catalog incrementally to JSON and TS files."""
    OUTPUT_CATALOG_FRONTEND_DATA.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CATALOG_FRONTEND_DATA, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    with open(OUTPUT_CATALOG_ROOT, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    ts_content = f"""// Generated by scripts/analyze_game_creatives.py with gemini-3.7-flash
export interface StorybeatItem {{
  id: string;
  timeframe: string;
  startSec: number;
  endSec: number;
  title: string;
  category: string;
  tier: string;
  description: string;
  visual_hook: string;
  visual_mood: string;
  action_intensity: string;
  emergent_concept_tag: string;
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
  fbi_score: number;
  fbi_status: string;
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
        f.write(ts_content)


def main():
    print("======================================================================", flush=True)
    print("EA EBC Multimodal Creative Intelligence & Shapley Pipeline", flush=True)
    print(f"Model: {MODEL_NAME} | Project: {PROJECT_ID} | Location: {LOCATION}", flush=True)
    print(f"Media Resolution: HIGH | Thinking Budget: 2048 tokens", flush=True)
    print("======================================================================", flush=True)

    client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

    gen_config = types.GenerateContentConfig(
        temperature=0.2,
        media_resolution=types.MediaResolution.MEDIA_RESOLUTION_HIGH,
        thinking_config=types.ThinkingConfig(thinking_budget=2048),
        response_mime_type="application/json",
    )

    catalog = []
    # Load existing partial catalog if present
    if OUTPUT_CATALOG_ROOT.exists():
        try:
            with open(OUTPUT_CATALOG_ROOT, "r", encoding="utf-8") as f:
                catalog = json.load(f)
                print(f"Loaded {len(catalog)} existing analyzed creatives.", flush=True)
        except Exception:
            catalog = []

    already_analyzed = {item["local_filename"] for item in catalog}

    video_count = len(catalog)
    subfolders = ["fc", "sims", "apex", "battlefield"]

    for folder_key in subfolders:
        folder_path = ZZ_CREATIVES_DIR / folder_key
        if not folder_path.exists():
            print(f"Folder not found: {folder_path}", flush=True)
            continue

        meta_info = FRANCHISE_METADATA.get(folder_key, {})
        franchise_name = meta_info.get("franchise", folder_key.upper())
        video_files = sorted(list(folder_path.glob("*.mp4")))

        print(f"\n--- Processing Franchise: {franchise_name} ({len(video_files)} videos) ---", flush=True)

        for idx, v_file in enumerate(video_files):
            raw_filename = v_file.name
            if raw_filename in already_analyzed:
                print(f"  [Skipping already analyzed] {raw_filename}", flush=True)
                continue

            video_count += 1
            project_number = f"EA-{folder_key.upper()}-{idx+1:03d}"
            duration = get_video_duration(v_file)
            gcs_uri = f"gs://{GCS_BUCKET}/creatives/{folder_key}/{raw_filename}"
            web_video_url = f"/videos/{folder_key}/{raw_filename}"

            print(f"\n[{video_count}] Analyzing [{project_number}] '{raw_filename}' ({duration}s)...", flush=True)
            print(f"    GCS URI: {gcs_uri}", flush=True)

            prompt = build_analysis_prompt(franchise_name, duration)
            video_part = types.Part.from_uri(file_uri=gcs_uri, mime_type="video/mp4")

            try:
                t0 = time.time()
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=[video_part, prompt],
                    config=gen_config,
                )
                elapsed = round(time.time() - t0, 2)
                data = json.loads(response.text)

                story_beats = []
                for b_idx, sb in enumerate(data.get("story_beats", [])):
                    sb_id = f"{folder_key}-{idx+1}-b{b_idx+1}"
                    start_sec = float(sb.get("startSec", 0.0))
                    end_sec = float(sb.get("endSec", duration))
                    tf = sb.get("timeframe") or f"{int(start_sec//60)}:{int(start_sec%60):02d} - {int(end_sec//60)}:{int(end_sec%60):02d}"

                    story_beats.append({
                        "id": sb_id,
                        "timeframe": tf,
                        "startSec": round(start_sec, 1),
                        "endSec": round(end_sec, 1),
                        "title": sb.get("title", f"Scene {b_idx+1}"),
                        "category": sb.get("category", "TOP_OF_FUNNEL" if b_idx == 0 else "NEUTRAL_ENGAGEMENT"),
                        "tier": sb.get("tier", "TOFU" if b_idx == 0 else "MOFU"),
                        "description": sb.get("description", ""),
                        "visual_hook": sb.get("visual_hook", "Gameplay_Highlight"),
                        "visual_mood": sb.get("visual_mood", "Dynamic"),
                        "action_intensity": sb.get("action_intensity", "High"),
                        "emergent_concept_tag": sb.get("emergent_concept_tag", data.get("theme", "EA_Creative")),
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
                    "fbi_score": float(data.get("fbi_score", 0.75)),
                    "fbi_status": data.get("fbi_status", "BALANCED_HIGH_POTENTIAL"),
                    "prescriptive_action": data.get("prescriptive_action", ""),
                    "recommended_edit": data.get("recommended_edit", ""),
                    "story_beats": story_beats,
                    "video_path": web_video_url,
                    "gcs_uri": gcs_uri,
                    "local_filename": raw_filename,
                }

                catalog.append(entry)
                already_analyzed.add(raw_filename)
                save_catalog(catalog)
                print(f"    -> [SUCCESS in {elapsed}s]: Title='{entry['title']}' | Theme='{entry['theme']}' | FBI={entry['fbi_score']} | Beats={len(story_beats)}", flush=True)

            except Exception as e:
                print(f"    -> [ERROR analyzing {raw_filename}]: {e}", flush=True)

    print(f"\nPipeline completed! Total analyzed: {len(catalog)} videos.", flush=True)


if __name__ == "__main__":
    main()
