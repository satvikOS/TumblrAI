import { notFound } from "next/navigation";
import { Posts, Users, Comments } from "@/lib/social/store";
import { PostDetailClient } from "./post-client";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = Posts.byId(id);
  if (!post) return notFound();
  const author = Users.byHandle(post.authorHandle);
  const comments = Comments.forPost(id).map((c) => {
    const a = Users.byHandle(c.authorHandle);
    return {
      ...c,
      author: a
        ? { handle: a.handle, name: a.name, avatarSeed: a.avatarSeed, verified: a.verified }
        : null,
    };
  });
  return (
    <PostDetailClient
      initialPost={{
        ...post,
        author: author
          ? { handle: author.handle, name: author.name, avatarSeed: author.avatarSeed, verified: author.verified, bio: author.bio }
          : null,
        liked: false,
        reblogged: false,
      }}
      initialComments={comments}
    />
  );
}
