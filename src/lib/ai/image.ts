import { azureRest, deployments, isAzureConfigured, isImageConfigured } from "./azure";

export type ImageGenInput = {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  quality?: "low" | "medium" | "high";
  n?: number;
};

export type ImageGenOutput = {
  images: { b64: string }[];
};

export async function generateImage(input: ImageGenInput): Promise<ImageGenOutput> {
  if (!isAzureConfigured || !isImageConfigured || !azureRest.endpoint) {
    return { images: [] };
  }

  // OpenAI-compatible v1 path:
  //   POST {endpoint}/openai/v1/images/generations  body.model = deployment
  // Deployment-based Azure path:
  //   POST {endpoint}/openai/deployments/{deployment}/images/generations?api-version=...
  const url = azureRest.isV1
    ? `${azureRest.endpoint}/openai/v1/images/generations`
    : `${azureRest.endpoint}/openai/deployments/${deployments.image}/images/generations?api-version=${azureRest.apiVersion}`;

  const body: Record<string, unknown> = {
    prompt: input.prompt,
    size: input.size ?? "1024x1024",
    quality: input.quality ?? "medium",
    n: input.n ?? 1,
    output_format: "png",
  };
  if (azureRest.isV1) body.model = deployments.image;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": azureRest.apiKey!,
      Authorization: `Bearer ${azureRest.apiKey!}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Image generation failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    data: { b64_json?: string; url?: string }[];
  };

  return {
    images: (data.data ?? [])
      .map((d) => ({ b64: d.b64_json ?? "" }))
      .filter((i) => i.b64),
  };
}
