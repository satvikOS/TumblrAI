import { NextResponse } from "next/server";
import { isAzureConfigured, deployments } from "@/lib/ai/azure";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "notecount",
    azure: { configured: isAzureConfigured, deployments },
    time: new Date().toISOString(),
  });
}
