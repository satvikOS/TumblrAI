import { NextResponse } from "next/server";
import { generateText } from "ai";
import { tryLanguageModel } from "@/lib/ai/models";
import {
  adapterMode,
  azureRest,
  deployments,
  isAzureConfigured,
} from "@/lib/ai/azure";

// Diagnostic endpoint. Hits the configured model with a single trivial
// prompt and returns either the response text or the exact error so the
// user can see what's wrong without digging in logs.
//
// GET /api/ai/ping
export async function GET() {
  const summary = {
    configured: isAzureConfigured,
    adapter: adapterMode,
    endpoint: azureRest.endpoint ?? null,
    isV1: azureRest.isV1,
    apiVersion: azureRest.apiVersion,
    deployments: {
      primary: deployments.primary,
      pro: deployments.pro,
      reasoning: deployments.reasoning,
      embedding: deployments.embedding || null,
      image: deployments.image || null,
    },
  };

  if (!isAzureConfigured) {
    return NextResponse.json({
      ok: false,
      ...summary,
      error: "AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY must be set.",
    });
  }

  const model = tryLanguageModel("primary");
  if (!model) {
    return NextResponse.json({
      ok: false,
      ...summary,
      error: "Could not build language model. Check endpoint format.",
    });
  }

  const started = Date.now();
  try {
    const r = await generateText({
      model,
      prompt: "Reply with exactly one word: pong",
      temperature: 0,
      maxTokens: 5,
    });
    const elapsed = Date.now() - started;
    return NextResponse.json({
      ok: true,
      ...summary,
      response: r.text.trim(),
      latencyMs: elapsed,
      usage: r.usage,
    });
  } catch (err) {
    const elapsed = Date.now() - started;
    const e = err as Error & { responseBody?: string; statusCode?: number };
    return NextResponse.json(
      {
        ok: false,
        ...summary,
        error: e.message,
        statusCode: e.statusCode,
        responseBody: e.responseBody?.slice(0, 600),
        latencyMs: elapsed,
        hint: hintFor(e.message, summary),
      },
      { status: 200 },
    );
  }
}

function hintFor(msg: string, s: { adapter: string; deployments: { primary: string } }): string | undefined {
  const m = msg.toLowerCase();
  if (m.includes("404") || m.includes("not found") || m.includes("deploymentnotfound")) {
    return `Deployment "${s.deployments.primary}" not found. Verify AZURE_DEPLOYMENT_PRIMARY matches the deployment name (NOT the model id) in Azure AI Foundry → Models + endpoints.`;
  }
  if (m.includes("401") || m.includes("unauthorized") || m.includes("invalid api key")) {
    return "Auth failed. Re-check AZURE_OPENAI_API_KEY (no whitespace, correct region).";
  }
  if (m.includes("403")) {
    return "Forbidden. The key may not have access to this deployment, or quota is exhausted.";
  }
  if (m.includes("does not exist")) {
    return `Model "${s.deployments.primary}" doesn't exist for this endpoint. If you used Foundry agents, you need an Azure OpenAI deployment with the same name OR change AZURE_OPENAI_ENDPOINT to the agents-compatible URL.`;
  }
  if (m.includes("getaddrinfo") || m.includes("enotfound")) {
    return "DNS/network failure. Check the endpoint hostname.";
  }
  return undefined;
}
