import { NextRequest, NextResponse } from "next/server";
import { Posts, Users, Likes, Reblogs } from "@/lib/social/store";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  const sp = req.nextUrl.searchParams;
  const platform = (sp.get("platform") as "tumblr" | "reddit" | null) ?? undefined;
  const topic = sp.get("topic") ?? undefined;
  const cursor = sp.get("cursor") ? Number(sp.get("cursor")) : 0;
  const limit = sp.get("limit") ? Number(sp.get("limit")) : 24;
  const result = Posts.explore({ platform, topic, cursor, limit });
  const items = result.items.map((p) => {
    const a = Users.byHandle(p.authorHandle);
    return {
      ...p,
      author: a
        ? { handle: a.handle, name: a.name, avatarSeed: a.avatarSeed, verified: a.verified }
        : null,
      liked: user ? Likes.has(user.handle, p.id) : false,
      reblogged: user ? Reblogs.has(user.handle, p.id) : false,
    };
  });
  return NextResponse.json({ items, nextCursor: result.nextCursor, total: result.total });
}
