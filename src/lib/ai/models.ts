import { azure, deployments, isAzureConfigured } from "./azure";

export type ModelTier = "primary" | "pro" | "reasoning";

export function languageModel(tier: ModelTier = "primary") {
  if (!azure) {
    throw new Error(
      "Azure AI Foundry is not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.",
    );
  }
  const deployment = deployments[tier];
  return azure(deployment);
}

export function tryLanguageModel(tier: ModelTier = "primary") {
  if (!isAzureConfigured) return null;
  return languageModel(tier);
}

export { isAzureConfigured };
