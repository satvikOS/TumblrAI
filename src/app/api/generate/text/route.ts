import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { tryLanguageModel } from "@/lib/ai/models";
import { predict } from "@/lib/ml/predict";

const Body = z.object({
  brief: z.string().min(1),
  platform: z.enum(["tumblr", "reddit"]),
  variants: z.number().int().min(1).max(5).default(3),
  voice: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = (platform: "tumblr" | "reddit", voice?: string) => `
You write social posts for ${platform === "tumblr" ? "Tumblr" : "Reddit (r/travel)"}.
Constraints:
- Tumblr: lean neutral, sensory, low-emoji, 30–80 words, lowercase preferred when stylistic.
- Reddit: longer (80–250 words), context-rich, ends with a clear question; honest tone, no clickbait.
${voice ? `Match the user's voice: """${voice}"""` : ""}
Return ONLY the post body. Do not add tags, headers, or commentary.
`.trim();

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { brief, platform, variants, voice } = parsed.data;

  const model = tryLanguageModel("primary");
  if (!model) {
    return NextResponse.json({
      variants: [
        {
          text:
            platform === "tumblr"
              ? `${brief}. soft light, slow morning. nothing else to add.`
              : `${brief}\n\nDoing this trip in three weeks. Anyone done a similar route — what would you do differently?`,
          prediction: predict({ text: brief, tags: [], platform }),
          mock: true,
        },
      ],
      mock: true,
    });
  }

  const out = await Promise.all(
    Array.from({ length: variants }, async (_, i) => {
      const r = await generateText({
        model,
        system: SYSTEM(platform, voice),
        prompt: `Brief: ${brief}\nVariant ${i + 1}: write a distinct angle.`,
        temperature: 0.8 - i * 0.1,
      });
      const prediction = predict({ text: r.text, tags: [], platform });
      return { text: r.text.trim(), prediction };
    }),
  );

  return NextResponse.json({ variants: out });
}
