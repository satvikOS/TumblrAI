import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { drafts } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { predict } from "@/lib/ml/predict";

const Create = z.object({
  platform: z.enum(["tumblr", "reddit"]),
  title: z.string().optional(),
  text: z.string().min(1),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  imageDescription: z.string().optional(),
  state: z.enum(["draft", "scheduled", "published"]).default("draft"),
  scheduledFor: z.string().optional(),
});

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: drafts.list(user.id) });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const r = predict({
    text: parsed.data.text,
    tags: parsed.data.tags,
    platform: parsed.data.platform,
    imageDescription: parsed.data.imageDescription,
  });
  const created = drafts.create({
    ...parsed.data,
    userId: user.id,
    predictedProb: r.probHigh,
  });
  return NextResponse.json({ draft: created, prediction: r });
}
