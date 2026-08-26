import { BigQuery } from "@google-cloud/bigquery";
import { GCP_CONFIG } from "../config";
import fs from "fs";
import path from "path";

let bqClient: BigQuery | null = null;

function getBigQueryClient() {
  if (!bqClient) {
    bqClient = new BigQuery({ projectId: GCP_CONFIG.projectId });
  }
  return bqClient;
}

export async function queryBigQuery(sql: string) {
  try {
    const client = getBigQueryClient();
    const [rows] = await client.query({ query: sql });
    return rows;
  } catch (error) {
    console.warn("[BigQuery Client] Query failed, using local telemetry fallback:", error);
    return loadLocalTelemetryFallback();
  }
}

export function loadLocalTelemetryFallback() {
  try {
    const telemetryPath = path.join(process.cwd(), "data/telemetry_match_events.json");
    if (fs.existsSync(telemetryPath)) {
      const raw = fs.readFileSync(telemetryPath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("[Local Fallback] Error reading telemetry data:", e);
  }
  return [];
}
