import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { predict } from "@/lib/ml/predict";

const Body = z.object({
  text: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  platform: z.enum(["tumblr", "reddit"]),
  imageDescription: z.string().optional(),
});

// Deterministic perturbation simulator. For each "what-if" lever we mutate the
// draft minimally and re-predict, returning the realized delta. This is the
// engine behind the Composer's counterfactuals panel.
export async function POST(req: NextRequest) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  const { text, tags, platform, imageDescription } = p.data;

  const base = predict({ text, tags, platform, imageDescription });

  type Lever = { id: string; label: string; mutate: () => { text?: string; tags?: string[]; imageDescription?: string } };
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const trimmed = sentences.length > 1 ? sentences.slice(0, Math.max(1, Math.floor(sentences.length / 2))).join(" ") : text;
  const punchier = text
    .replace(/\b(really|very|just|actually|basically|literally|kind of|kinda)\b/gi, "")
    .replace(/\s{2,}/g, " ");
  const neutralized = text.replace(/[!]+/g, ".").replace(/\b(amazing|incredible|awful|terrible|stunning)\b/gi, "");
  const withQuestion = text.trimEnd().replace(/[.!?]?$/, "") +
    (platform === "reddit"
      ? "\n\nWhat would you change about a route like this? Anyone done it?"
      : ".");
  const lowercased = text.toLowerCase();
  const moreTags = [...new Set([...(tags ?? []), "fog", "alpine", "minimal", "slow travel", "scenery"])].slice(0, 12);
  const fewerTags = (tags ?? []).slice(0, 4);
  const withImage = imageDescription ?? "wide shot of fog over an alpine lake at first light";

  const levers: Lever[] = [
    { id: "neutralize", label: "Neutralize the tone", mutate: () => ({ text: neutralized }) },
    { id: "tighten", label: "Trim filler words", mutate: () => ({ text: punchier }) },
    { id: "shorten", label: "Cut to half-length", mutate: () => ({ text: trimmed }) },
    { id: "add_question", label: "Add a closing question", mutate: () => ({ text: withQuestion }) },
    { id: "lowercase", label: "Drop into lowercase voice", mutate: () => ({ text: lowercased }) },
    { id: "more_tags", label: "Add more relevant tags", mutate: () => ({ tags: moreTags }) },
    { id: "fewer_tags", label: "Trim to 4 best tags", mutate: () => ({ tags: fewerTags }) },
    { id: "add_image", label: "Attach a hero image", mutate: () => ({ imageDescription: withImage }) },
  ];

  const results = levers.map((l) => {
    const m = l.mutate();
    const r = predict({
      text: m.text ?? text,
      tags: m.tags ?? tags,
      platform,
      imageDescription: m.imageDescription ?? imageDescription,
    });
    return {
      id: l.id, label: l.label,
      delta: Number((r.probHigh - base.probHigh).toFixed(3)),
      after: { prob: r.probHigh, label: r.label, scores: r.scores },
      preview: m.text?.slice(0, 240),
    };
  })
    .sort((a, b) => b.delta - a.delta);

  return NextResponse.json({ base: { prob: base.probHigh, label: base.label, scores: base.scores }, levers: results });
}
