import { NextRequest, NextResponse } from "next/server";
import { Posts, Users } from "@/lib/social/store";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q) return NextResponse.json({ posts: [], users: [] });
  const posts = Posts.search(q, 12).map((p) => {
    const a = Users.byHandle(p.authorHandle);
    return {
      ...p,
      author: a
        ? { handle: a.handle, name: a.name, avatarSeed: a.avatarSeed, verified: a.verified }
        : null,
    };
  });
  const users = Users.all()
    .filter(
      (u) =>
        u.handle.toLowerCase().includes(q.toLowerCase()) ||
        u.name.toLowerCase().includes(q.toLowerCase()),
    )
    .slice(0, 8);
  return NextResponse.json({ posts, users });
}
