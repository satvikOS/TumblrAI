import { notFound } from "next/navigation";
import { Posts, Users, Follows } from "@/lib/social/store";
import { getSession } from "@/lib/auth";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const u = Users.byHandle(handle);
  if (!u) return notFound();
  const me = await getSession();
  const posts = Posts.byAuthor(handle).sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  return (
    <ProfileClient
      user={{
        ...u,
        followers: Follows.followersOf(handle).length || u.followers,
        following: Follows.followingOf(handle).length || u.following,
      }}
      posts={posts.map((p) => ({
        ...p,
        author: {
          handle: u.handle,
          name: u.name,
          avatarSeed: u.avatarSeed,
          verified: u.verified,
        },
      }))}
      isFollowing={me ? Follows.isFollowing(me.handle, handle) : false}
      isMe={me?.handle === handle}
    />
  );
}
