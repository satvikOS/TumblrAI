import { createAzure } from "@ai-sdk/azure";
import { createOpenAI } from "@ai-sdk/openai";

// ─── Configuration ──────────────────────────────────────────────────────────
const rawEndpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-12-01-preview";

export const isAzureConfigured = Boolean(rawEndpoint && apiKey);

// Strip trailing slash and any "/openai/v1" or "/openai" suffix the user
// might have pasted in. We keep them around as flags so we can pick the
// right adapter below.
const endpointInfo = (() => {
  if (!rawEndpoint) return null;
  const trimmed = rawEndpoint.replace(/\/+$/, "");
  // Endpoint shapes Azure surfaces today:
  //   1. https://{resource}.openai.azure.com                       (deployment-based)
  //   2. https://{resource}.openai.azure.com/openai                (deployment-based, redundant)
  //   3. https://{resource}.openai.azure.com/openai/v1             (OpenAI-compatible v1)
  //   4. https://{resource}.services.ai.azure.com/...              (Foundry agents — not supported here)
  const isV1 = /\/openai\/v1$/.test(trimmed);
  const isDeploymentBase = /\/openai$/.test(trimmed);
  const baseRoot = trimmed
    .replace(/\/openai\/v1$/, "")
    .replace(/\/openai$/, "");
  let resourceName: string | undefined;
  try {
    resourceName = new URL(baseRoot).hostname.split(".")[0];
  } catch {
    resourceName = undefined;
  }
  return { trimmed, baseRoot, isV1, isDeploymentBase, resourceName };
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

// Azure's v1 OpenAI-compatible endpoint (both classic and Foundry agents)
// requires an `api-version` query parameter on every request, which the
// standard OpenAI client does not send. Wrap fetch to inject it.
const v1Fetch: typeof fetch = (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (!url.searchParams.has("api-version")) {
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
