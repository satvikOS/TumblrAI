import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { predict } from "@/lib/ml/predict";

const Body = z.object({
  text: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  platform: z.enum(["tumblr", "reddit"]),
  imageDescription: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const r = predict(parsed.data);
  return NextResponse.json(r);
}
