import { NextResponse } from "next/server";
import {
  isAzureConfigured,
  deployments,
  adapterMode,
  azureRest,
} from "@/lib/ai/azure";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "notecount",
    azure: {
      configured: isAzureConfigured,
      adapter: adapterMode,
      // The exact value our code resolved AZURE_OPENAI_ENDPOINT down to.
      // If this differs from what you typed in Vercel (or contains brackets),
      // your env var has stray formatting and needs to be re-pasted clean.
      endpointResolved: azureRest.endpoint ?? null,
      apiVersion: azureRest.apiVersion,
      deployments,
    },
    time: new Date().toISOString(),
  });
}
