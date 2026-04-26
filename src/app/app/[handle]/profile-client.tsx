"use client";
import { useState } from "react";
import Image from "next/image";
import { BadgeCheck, MapPin, Link as LinkIcon, Calendar, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/social/avatar";
import { PostCard, type FeedPost } from "@/components/social/post-card";
import { bannerUrl } from "@/lib/social/seed-users";
import { formatNumber, relativeTime } from "@/lib/utils";
import type { SocialUser } from "@/lib/social/types";

export function ProfileClient({
  user,
  posts,
  isFollowing: initialFollowing,
  isMe,
}: {
  user: SocialUser;
  posts: FeedPost[];
  isFollowing: boolean;
  isMe: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(user.followers);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy || isMe) return;
    setBusy(true);
    setFollowing((f) => !f);
    setFollowers((c) => c + (following ? -1 : 1));
    try {
      const r = await fetch(`/api/social/users/${user.handle}/follow`, { method: "POST" });
      if (r.ok) {
        const j = (await r.json()) as { following: boolean };
        setFollowing(j.following);
      }
    } finally {
      setBusy(false);
    }
  }

  const tumblrPosts = posts.filter((p) => p.platform === "tumblr");
  const redditPosts = posts.filter((p) => p.platform === "reddit");
  const withMedia = posts.filter((p) => p.imageUrl);

  return (
    <div>
      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-muted sm:h-56">
        <Image
          src={bannerUrl(user.bannerSeed)}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="-mt-16 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-background p-1 shadow-md"
            >
              <UserAvatar seed={user.avatarSeed} size={112} />
            </motion.div>
            <div className="pb-2">
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-2xl font-semibold tracking-tight">{user.name}</h1>
                {user.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>
              <div className="text-sm text-muted-foreground">@{user.handle}</div>
            </div>
          </div>
          <div className="flex gap-2 pb-2">
            {!isMe ? (
              <Button onClick={toggle} disabled={busy} variant={following ? "outline" : "default"}>
                {busy ? <Loader2 className="animate-spin" /> : following ? <UserCheck /> : <UserPlus />}
                {following ? "Following" : "Follow"}
              </Button>
            ) : (
              <Button variant="outline" disabled>This is you</Button>
            )}
          </div>
        </div>

        <Card className="mt-4">
          <CardContent className="space-y-3 p-5">
            {user.bio && <p className="text-[15px] leading-relaxed">{user.bio}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {user.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {user.location}
                </span>
              )}
              {user.link && (
                <a href={`https://${user.link}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <LinkIcon className="h-3.5 w-3.5" />
                  {user.link}
                </a>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Joined {relativeTime(user.joinedAt)}
              </span>
              {user.pronouns && <span>{user.pronouns}</span>}
            </div>
            <div className="flex gap-5 text-sm">
              <Stat label="Posts" value={formatNumber(user.postCount)} />
              <Stat label="Followers" value={formatNumber(followers)} />
              <Stat label="Following" value={formatNumber(user.following)} />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="posts" className="mt-6">
          <TabsList>
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="tumblr">Tumblr ({tumblrPosts.length})</TabsTrigger>
            <TabsTrigger value="reddit">Reddit ({redditPosts.length})</TabsTrigger>
            <TabsTrigger value="media">Media ({withMedia.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="space-y-4">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
            {posts.length === 0 && <Empty />}
          </TabsContent>
          <TabsContent value="tumblr" className="space-y-4">
            {tumblrPosts.map((p) => <PostCard key={p.id} post={p} />)}
            {tumblrPosts.length === 0 && <Empty />}
          </TabsContent>
          <TabsContent value="reddit" className="space-y-4">
            {redditPosts.map((p) => <PostCard key={p.id} post={p} />)}
            {redditPosts.length === 0 && <Empty />}
          </TabsContent>
          <TabsContent value="media" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {withMedia.map((p) => (
              <a
                key={p.id}
                href={`/app/post/${p.id}`}
                className="relative block aspect-square overflow-hidden rounded-md bg-muted"
              >
                <Image
                  src={p.imageUrl!}
                  alt={p.imageAlt ?? ""}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 240px"
                />
              </a>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="font-semibold tabular-nums">{value}</span>{" "}
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function Empty() {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border py-12 text-sm text-muted-foreground">
      Nothing here yet.
    </div>
  );
}
