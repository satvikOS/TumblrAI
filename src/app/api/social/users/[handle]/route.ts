import { NextRequest, NextResponse } from "next/server";
import { Posts, Users, Follows } from "@/lib/social/store";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ handle: string }> }) {
  const { handle } = await ctx.params;
  const u = Users.byHandle(handle);
  if (!u) return NextResponse.json({ error: "not found" }, { status: 404 });
  const me = await getSession();
  const posts = Posts.byAuthor(handle).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  return NextResponse.json({
    user: {
      ...u,
      followers: Follows.followersOf(handle).length || u.followers,
      following: Follows.followingOf(handle).length || u.following,
    },
    posts: posts.slice(0, 60),
    isFollowing: me ? Follows.isFollowing(me.handle, handle) : false,
    isMe: me?.handle === handle,
  });
}
