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

export const deployments = {
  primary: process.env.AZURE_DEPLOYMENT_PRIMARY ?? "gpt-5-mini",
  pro: process.env.AZURE_DEPLOYMENT_PRO ?? "gpt-5",
  reasoning: process.env.AZURE_DEPLOYMENT_REASONING ?? "o4-mini",
  embedding: process.env.AZURE_DEPLOYMENT_EMBEDDING ?? "text-embedding-3-large",
  image: process.env.AZURE_DEPLOYMENT_IMAGE ?? "gpt-image-1",
} as const;

export const azureRest = {
  endpoint: endpoint?.replace(/\/$/, ""),
  apiKey,
  apiVersion,
};
