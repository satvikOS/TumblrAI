import { azureRest, deployments, isAzureConfigured, isEmbeddingConfigured } from "./azure";

export async function embed(input: string | string[]): Promise<number[][]> {
  if (!isAzureConfigured || !isEmbeddingConfigured || !azureRest.endpoint) {
    return Array.isArray(input) ? input.map(() => []) : [[]];
  }
  const inputs = Array.isArray(input) ? input : [input];
  const url = `${azureRest.endpoint}/openai/deployments/${deployments.embedding}/embeddings?api-version=${azureRest.apiVersion}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": azureRest.apiKey!,
    },
    body: JSON.stringify({ input: inputs }),
  });
  if (!res.ok) throw new Error(`Embeddings failed: ${res.status}`);
  const data = (await res.json()) as {
    data: { embedding: number[] }[];
  };
  return data.data.map((d) => d.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}
