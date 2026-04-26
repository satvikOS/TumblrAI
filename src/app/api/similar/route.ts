import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findSimilar } from "@/lib/library";

const Body = z.object({
  query: z.string().min(1),
  platform: z.enum(["tumblr", "reddit"]),
  k: z.number().int().min(1).max(20).optional().default(5),
});

export async function POST(req: NextRequest) {
  const p = Body.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 });
  return NextResponse.json({ items: findSimilar(p.data.query, p.data.platform, p.data.k) });
}
