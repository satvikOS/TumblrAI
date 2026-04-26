import { createAzure } from "@ai-sdk/azure";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-12-01-preview";

export const isAzureConfigured = Boolean(endpoint && apiKey);

function resourceNameFromEndpoint(): string | undefined {
  if (!endpoint) return undefined;
  try {
    const url = new URL(endpoint);
    return url.hostname.split(".")[0];
  } catch {
    return undefined;
  }
}

export const azure = isAzureConfigured
  ? createAzure({
      apiKey: apiKey!,
      resourceName: resourceNameFromEndpoint(),
      apiVersion,
    })
  : null;

// Deployment routing.
//
// Only AZURE_DEPLOYMENT_PRIMARY is required. The "pro" and "reasoning" tiers
// transparently fall back to the primary deployment when their dedicated
// envs are unset — so a single gpt-5-nano deployment is a valid full setup.
//
// Image generation and embeddings live on different model classes; if those
// deployments are absent the matching endpoints return a clearly-labeled
// preview response instead of failing.
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

export const azureRest = {
  endpoint: endpoint?.replace(/\/$/, ""),
  apiKey,
  apiVersion,
};
