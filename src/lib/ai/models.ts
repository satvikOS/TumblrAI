import { languageModel as buildModel, deployments, isAzureConfigured } from "./azure";

export type ModelTier = "primary" | "pro" | "reasoning";

export function languageModel(tier: ModelTier = "primary") {
  return buildModel(deployments[tier]);
}

export function tryLanguageModel(tier: ModelTier = "primary") {
  if (!isAzureConfigured) return null;
  try {
    return languageModel(tier);
  } catch {
    return null;
  }
}

export { isAzureConfigured };
