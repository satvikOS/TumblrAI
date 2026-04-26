import { NextResponse } from "next/server";
import { Follows } from "@/lib/social/store";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ handle: string }> }) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { handle } = await ctx.params;
  const result = Follows.toggle(me.handle, handle);
  return NextResponse.json(result);
}
