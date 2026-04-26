import { NextResponse } from "next/server";
import { Likes } from "@/lib/social/store";
import { getSession } from "@/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { id } = await ctx.params;
  const result = Likes.toggle(user.handle, id);
  return NextResponse.json(result);
}
