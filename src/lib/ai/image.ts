import { azureRest, deployments, isAzureConfigured } from "./azure";

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
  if (!isAzureConfigured || !azureRest.endpoint) {
    return { images: [] };
  }

  const url = `${azureRest.endpoint}/openai/deployments/${deployments.image}/images/generations?api-version=${azureRest.apiVersion}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": azureRest.apiKey!,
    },
    body: JSON.stringify({
      prompt: input.prompt,
      size: input.size ?? "1024x1024",
      quality: input.quality ?? "medium",
      n: input.n ?? 1,
      output_format: "png",
    }),
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
