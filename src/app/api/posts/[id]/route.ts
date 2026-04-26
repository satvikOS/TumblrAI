import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { drafts } from "@/lib/store";
import { getSession } from "@/lib/auth";

const Patch = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  imageDescription: z.string().optional(),
  state: z.enum(["draft", "scheduled", "published"]).optional(),
  scheduledFor: z.string().optional(),
  publishedAt: z.string().optional(),
  predictedProb: z.number().optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const d = drafts.get(id);
  if (!d) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ draft: d });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const updated = drafts.update(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ draft: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const ok = drafts.delete(id);
  return NextResponse.json({ ok });
}
