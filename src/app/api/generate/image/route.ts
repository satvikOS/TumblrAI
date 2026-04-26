import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateImage } from "@/lib/ai/image";
import { isAzureConfigured } from "@/lib/ai/azure";

const Body = z.object({
  prompt: z.string().min(3),
  style: z.enum(["photoreal", "film", "illustration", "minimal"]).default("photoreal"),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (!isAzureConfigured) {
    return NextResponse.json({
      mock: true,
      images: [],
      message: "Azure not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.",
    });
  }

  const styleHint = {
    photoreal: "photorealistic, natural light, 35mm",
    film: "shot on Kodak Portra 400, soft grain, muted tones",
    illustration: "flat illustration, soft shadows, pastel palette",
    minimal: "minimalist composition, lots of negative space",
  }[parsed.data.style];

  const out = await generateImage({
    prompt: `${parsed.data.prompt}. Style: ${styleHint}.`,
    size: parsed.data.size,
    quality: "medium",
  });

  return NextResponse.json({
    images: out.images.map((i) => `data:image/png;base64,${i.b64}`),
  });
}
