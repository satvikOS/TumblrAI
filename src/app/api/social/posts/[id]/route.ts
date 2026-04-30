import { NextRequest, NextResponse } from "next/server";
import { Posts, Users, Comments, Likes, Reblogs } from "@/lib/social/store";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const post = Posts.byId(id);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  const author = Users.byHandle(post.authorHandle);
  const user = await getSession();
  const comments = Comments.forPost(id).map((c) => {
    const a = Users.byHandle(c.authorHandle);
    return {
      ...c,
      author: a
        ? { handle: a.handle, name: a.name, avatarSeed: a.avatarSeed, verified: a.verified }
        : null,
    };
  });
  return NextResponse.json({
    post: {
      ...post,
      author: author
        ? { handle: author.handle, name: author.name, avatarSeed: author.avatarSeed, verified: author.verified, bio: author.bio }
        : null,
      liked: user ? Likes.has(user.handle, post.id) : false,
      reblogged: user ? Reblogs.has(user.handle, post.id) : false,
    },
    comments,
  });
}
