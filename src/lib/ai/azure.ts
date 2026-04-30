import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";

// ─── Configuration ──────────────────────────────────────────────────────────
//
// Aggressively sanitize env var values. We've seen these in the wild:
//   "[host.com](http://host.com)"        — markdown link from chat clients
//   "\"https://host.com\""                — quoted by accident in dashboards
//   "https://host.com /openai/v1"          — stray whitespace in middle
//   "https://host.com?utm=..."             — extra query params from auto-redirect
//
// Strategy: regex-extract the first https?:// URL anywhere in the string.
// If no URL is found, fall back to the trimmed/unquoted value.
function cleanEndpoint(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const trimmed = v.trim().replace(/^['"]+|['"]+$/g, "");
  const urlMatch = trimmed.match(/https?:\/\/[^\s)\]"'<>]+/);
  if (urlMatch) {
    let url = urlMatch[0]
      .replace(/[)\].,;]+$/, "") // strip trailing punctuation
      .replace(/\/+$/, ""); // strip trailing slash
    // Azure OpenAI / Foundry endpoints are always HTTPS — auto-upgrade
    // anything that came in as http:// (which is common when chat clients
    // turn URLs into markdown links with http:// inside).
    url = url.replace(/^http:\/\//, "https://");
    return url;
  }
  return trimmed || undefined;
}

function cleanKey(v: string | undefined): string | undefined {
  if (!v) return undefined;
  return v.trim().replace(/^['"]+|['"]+$/g, "") || undefined;
}

const rawEndpoint = cleanEndpoint(process.env.AZURE_OPENAI_ENDPOINT);
const apiKey = cleanKey(process.env.AZURE_OPENAI_API_KEY);

// Hard validation: an endpoint that doesn't parse as a URL is a hard error.
// This stops us from ever sending fetch a malformed hostname.
if (rawEndpoint) {
  try {
    new URL(rawEndpoint);
  } catch {
    throw new Error(
      `AZURE_OPENAI_ENDPOINT is not a valid URL: "${rawEndpoint}". ` +
        `Expected format: https://your-resource.openai.azure.com`,
    );
  }
}
// Different endpoint shapes accept different api-version values:
//   - Foundry agents + classic /openai/v1   → literal "preview" or "v1"
//   - Classic deployment-based              → a date like "2024-10-21"
// Pick the right default based on the endpoint shape we detected, but
// still honor an explicit AZURE_OPENAI_API_VERSION override when set.
function defaultApiVersion(): string {
  if (!rawEndpoint) return "preview";
  const isV1Path = /\/openai\/v1$/.test(rawEndpoint.replace(/\/+$/, ""));
  return isV1Path ? "preview" : "2024-10-21";
}
const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? defaultApiVersion();

export const isAzureConfigured = Boolean(rawEndpoint && apiKey);

// Strip trailing slash and any "/openai/v1" or "/openai" suffix the user
// might have pasted in. We keep them around as flags so we can pick the
// right adapter below.
const endpointInfo = (() => {
  if (!rawEndpoint) return null;
  const trimmed = rawEndpoint.replace(/\/+$/, "");
  // Endpoint shapes Azure surfaces today:
  //   1. https://{resource}.openai.azure.com                       → deployment-based
  //   2. https://{resource}.openai.azure.com/openai                → deployment-based
  //   3. https://{resource}.openai.azure.com/openai/v1             → classic v1, api-version REQUIRED
  //   4. .../agents/{name}/protocols/openai/v1                     → Foundry agent, api-version REQUIRED
  //   5. .../api/projects/{name}/openai/v1                         → Foundry project, api-version FORBIDDEN
  const isV1 = /\/openai\/v1$/.test(trimmed);
  const isDeploymentBase = /\/openai$/.test(trimmed);
  // Foundry project endpoints (case 5) reject the api-version query param.
  // They're identified by /api/projects/{slug}/openai/v1 with no /agents/.
  const isFoundryProjectV1 = /\/api\/projects\/[^/]+\/openai\/v1$/.test(trimmed);
  const baseRoot = trimmed
    .replace(/\/openai\/v1$/, "")
    .replace(/\/openai$/, "");
  let resourceName: string | undefined;
  try {
    resourceName = new URL(baseRoot).hostname.split(".")[0];
  } catch {
    resourceName = undefined;
  }
  return { trimmed, baseRoot, isV1, isDeploymentBase, isFoundryProjectV1, resourceName };
})();

// ─── Deployment routing ────────────────────────────────────────────────────
//
// Only AZURE_DEPLOYMENT_PRIMARY is required. "pro" and "reasoning" fall back
// to it. Image generation and embeddings are different model classes — when
// their deployments aren't set, the corresponding endpoints return a clearly
// labeled preview response rather than failing.
const primary = process.env.AZURE_DEPLOYMENT_PRIMARY ?? "gpt-5-nano";

export const deployments = {
  primary,
  pro: process.env.AZURE_DEPLOYMENT_PRO ?? primary,
  reasoning: process.env.AZURE_DEPLOYMENT_REASONING ?? primary,
  embedding: process.env.AZURE_DEPLOYMENT_EMBEDDING ?? "",
  image: process.env.AZURE_DEPLOYMENT_IMAGE ?? "",
} as const;

export const isImageConfigured = Boolean(deployments.image);
export const isEmbeddingConfigured = Boolean(deployments.embedding);

// ─── Adapter selection ─────────────────────────────────────────────────────
//
// Mode A: OpenAI-compatible v1 endpoint. Use @ai-sdk/openai with the v1 base
//         URL and Azure's "api-key" header. The model() call uses the
//         deployment name as the model id (Azure routes by it).
// Mode B: Deployment-based Azure endpoint. Use @ai-sdk/azure as before.
//
// We pick Mode A when the URL ends in /openai/v1, otherwise Mode B.

export type AdapterMode = "openai-v1" | "azure-deployment" | "none";

export const adapterMode: AdapterMode = !isAzureConfigured
  ? "none"
  : endpointInfo?.isV1
    ? "openai-v1"
    : "azure-deployment";

// Azure's v1 OpenAI-compatible endpoint requires an `api-version` query
// param on every request — UNLESS it's a Foundry project endpoint
// (.../api/projects/{name}/openai/v1) which actively rejects it.
const skipApiVersion = endpointInfo?.isFoundryProjectV1 ?? false;
const v1Fetch: typeof fetch = (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (skipApiVersion) {
    url.searchParams.delete("api-version");
  } else if (!url.searchParams.has("api-version")) {
    url.searchParams.set("api-version", apiVersion);
  }
  return fetch(url.toString(), init);
};

const v1Client =
  adapterMode === "openai-v1" && endpointInfo
    ? createOpenAI({
        apiKey: apiKey!,
        baseURL: `${endpointInfo.baseRoot}/openai/v1`,
        // Azure accepts both Authorization Bearer AND api-key. We send both
        // for maximum compatibility (Foundry mints sometimes require Bearer,
        // classic Azure OpenAI requires api-key).
        headers: {
          "api-key": apiKey!,
          Authorization: `Bearer ${apiKey!}`,
        },
        fetch: v1Fetch,
      })
    : null;

const azureClient =
  adapterMode === "azure-deployment" && endpointInfo
    ? createAzure({
        apiKey: apiKey!,
        resourceName: endpointInfo.resourceName,
        apiVersion,
      })
    : null;

// Returns a typed model handle the AI SDK can use with streamText/generateText.
export function languageModel(deploymentName: string) {
  if (v1Client) return v1Client(deploymentName);
  if (azureClient) return azureClient(deploymentName);
  throw new Error(
    "Azure AI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.",
  );
}

// REST helpers (image generation) need the raw values.
export const azureRest = {
  endpoint: endpointInfo?.baseRoot,
  apiKey,
  apiVersion,
  isV1: Boolean(endpointInfo?.isV1),
};
