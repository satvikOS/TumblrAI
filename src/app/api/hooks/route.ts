import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { predict } from "@/lib/ml/predict";
import { hookAnalysis } from "@/lib/ml/text-features";
import { tryLanguageModel } from "@/lib/ai/models";

const Body = z.object({
  text: z.string().min(1),
  platform: z.enum(["tumblr", "reddit"]),
  count: z.number().int().min(2).max(8).default(5),
  tags: z.array(z.string()).optional().default([]),
});

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = (platform: string) => `
You are a hook architect for ${platform === "tumblr" ? "Tumblr" : "Reddit r/travel"}.
Your job: generate distinct opening lines (HOOKS) that maximize scroll-stop and click-through.

Rules:
- Tumblr hooks: 6–14 words, sensory, lowercase, image-first, no clickbait, no emojis.
- Reddit hooks: 8–18 words, specific scenario + an honest tension, ends with a comma or period (NOT a question — the question goes elsewhere).
- One hook per line. No numbering, no quotes, no commentary. Just the lines.
`.trim();

function fallbackHooks(text: string, platform: "tumblr" | "reddit", n: number): string[] {
  const stems = platform === "tumblr"
    ? [
      "fog peeling off the lake at first light.",
      "soft morning, slow water, no one else here.",
      "the trail behind us, the mountain ahead.",
      "muted tones, the kind of quiet you can hear.",
      "amber light on stone — nothing posed.",
      "a long walk for a small view.",
      "rain on the window, cold tea, slow sentences.",
      "the canyon held the sunset for a full hour.",
    ]
    : [
      `Two weeks across ${text.split(" ").slice(0, 2).join(" ") || "the region"} — looking for honest tradeoffs.`,
      `Planning ${text.split(" ").slice(0, 3).join(" ") || "this trip"} in October — no rental car, train pass only.`,
      `Solo trip, mid-budget, want to do this right — what would you cut?`,
      `Booked the flights, second-guessing the route — sanity check?`,
      `Spent five days here, three things surprised me — happy to answer questions.`,
    ];
  return stems.slice(0, n);
}

export async function POST(req: NextRequest) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  const { text, platform, count, tags } = p.data;

  const model = tryLanguageModel("primary");
  let hooks: string[] = [];
  if (model) {
    try {
      const r = await generateText({
        model, system: SYSTEM(platform),
        prompt: `Brief: ${text.slice(0, 600)}\n\nGenerate ${count} distinct hooks. One per line.`,
        temperature: 0.9,
      });
      hooks = r.text.split(/\n+/).map((l: string) => l.trim().replace(/^[-•\d.\s]+/, "").replace(/^"|"$/g, "")).filter((l: string) => l.length > 0).slice(0, count);
    } catch {
      hooks = fallbackHooks(text, platform, count);
    }
  } else {
    hooks = fallbackHooks(text, platform, count);
  }

  // Score each hook: rate as a stand-alone first sentence + a draft using it
  const scored = hooks.map((h) => {
    const local = hookAnalysis(h);
    const composite = predict({ text: `${h} ${text}`, tags, platform });
    return {
      hook: h,
      hookScore: local.score,
      probWith: composite.probHigh,
      reasons: local.reasons.slice(0, 3),
    };
  });
  scored.sort((a, b) => b.hookScore * 0.6 + b.probWith * 0.4 - (a.hookScore * 0.6 + a.probWith * 0.4));

  return NextResponse.json({ hooks: scored, mock: !model });
}
