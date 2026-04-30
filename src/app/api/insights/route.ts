import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { predict } from "@/lib/ml/predict";
import { findContentGaps, postingHeatmap, viralRisk, studyMatches } from "@/lib/ml/insights";
import { drafts } from "@/lib/store";
import { getSession } from "@/lib/auth";

const Body = z.object({
  text: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  platform: z.enum(["tumblr", "reddit"]),
  imageDescription: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { text, tags, platform, imageDescription } = parsed.data;

  const user = await getSession();
  const prediction = predict({ text, tags, platform, imageDescription });
  const heatmap = postingHeatmap(platform, prediction.features.topic.primary);
  const risk = viralRisk(prediction);
  const matches = studyMatches(text, platform, 3);
  const userDocs = user
    ? drafts.list(user.id).map((d) => ({ text: d.text, tags: d.tags, platform: d.platform, state: d.state }))
    : [];
  const gaps = findContentGaps(userDocs, platform).slice(0, 4);

  return NextResponse.json({
    prediction,
    heatmap,
    risk,
    matches,
    gaps,
    asOf: new Date().toISOString(),
  });
}
