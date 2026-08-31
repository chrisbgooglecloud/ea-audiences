import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const featureId = body.featureId || "general_run";
    const data = body.data || body;
    const companyName = body.companyName || "EA Games FC";

    const runsDir = path.join(process.cwd(), "data", "runs");
    if (!fs.existsSync(runsDir)) {
      fs.mkdirSync(runsDir, { recursive: true });
    }

    const filePath = path.join(runsDir, `${featureId}_run.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({
      success: true,
      message: `Saved ${featureId} run locally`,
      filePath,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[save-run error]:", error);
    return NextResponse.json({ error: error?.message || "Failed to save run" }, { status: 500 });
  }
}
