import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Comments, Users } from "@/lib/social/store";
import { getSession } from "@/lib/auth";

const Body = z.object({ body: z.string().min(1).max(800) });

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const c = Comments.create({ postId: id, authorHandle: user.handle, body: parsed.data.body });
  const a = Users.byHandle(c.authorHandle);
  return NextResponse.json({
    comment: {
      ...c,
      author: a
        ? { handle: a.handle, name: a.name, avatarSeed: a.avatarSeed, verified: a.verified }
        : null,
    },
  });
}
