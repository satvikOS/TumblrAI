import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { translatePost } from "@/lib/ml/insights";
import { predict } from "@/lib/ml/predict";

const Body = z.object({
  text: z.string().min(1),
  from: z.enum(["tumblr", "reddit"]),
  to: z.enum(["tumblr", "reddit"]),
  tags: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  const { text, from, to, tags } = p.data;
  const translated = translatePost(text, from, to);
  const sourcePred = predict({ text, tags, platform: from });
  const targetPred = predict({ text: translated, tags, platform: to });
  return NextResponse.json({
    from, to, translated,
    source: { prob: sourcePred.probHigh, label: sourcePred.label, scores: sourcePred.scores },
    target: { prob: targetPred.probHigh, label: targetPred.label, scores: targetPred.scores },
  });
}
