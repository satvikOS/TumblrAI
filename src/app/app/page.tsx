import Link from "next/link";
import { Sparkles, TrendingUp } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Posts, Users } from "@/lib/social/store";
import { trendingTags, trendingTopics } from "@/lib/trends";
import { FeedClient } from "./feed-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/social/avatar";
import { formatNumber, formatPct, relativeTime } from "@/lib/utils";

export default async function FeedPage() {
  const user = (await getSession())!;

  // Server-render the first page so the feed shows instantly.
  const initial = Posts.feed(user.id, { cursor: 0, limit: 8 });
  const items = initial.items.map((p) => {
    const a = Users.byHandle(p.authorHandle);
    return {
      ...p,
      author: a
        ? { handle: a.handle, name: a.name, avatarSeed: a.avatarSeed, verified: a.verified }
        : null,
      liked: false,
      reblogged: false,
    };
  });

  const tags = trendingTags("tumblr").slice(0, 6);
  const topics = trendingTopics("tumblr");
  const suggested = Users.all()
    .filter((u) => u.handle !== user.handle && (u.verified || u.followers > 10_000))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main feed */}
      <div className="px-4 py-4 sm:px-6">
        <header className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Your feed</h1>
            <p className="text-sm text-muted-foreground">
              Posts from {Users.all().length - 1} creators you follow, ranked newest first.
            </p>
          </div>
        </header>
        <FeedClient initialItems={items} initialCursor={initial.nextCursor} />
      </div>

      {/* Sidebar widgets */}
      <aside className="hidden border-l border-border-soft px-5 py-4 lg:block">
        <div className="sticky top-4 space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Trending tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {tags.map((t) => (
                <Link
                  key={t.tag}
                  href={`/app/explore?topic=${encodeURIComponent(t.tag)}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition hover:bg-muted"
                >
                  <span className="truncate">#{t.tag}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatNumber(t.posts)}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Topic mix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topics.map((t) => (
                <div key={t.topic}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{t.topic}</span>
                    <span className="tabular-nums text-muted-foreground">{formatPct(t.share)}</span>
                  </div>
                  <Progress value={t.share * 100} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Suggested for you</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggested.map((u) => (
                <Link
                  key={u.handle}
                  href={`/app/${u.handle}`}
                  className="flex items-center gap-3 rounded-md px-1 py-1 transition hover:bg-muted"
                >
                  <UserAvatar seed={u.avatarSeed} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 truncate text-sm font-medium">
                      {u.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {formatNumber(u.followers)} followers
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                Tip
              </div>
              <p className="text-sm leading-snug">
                Drafts are scored as you type. Hit{" "}
                <Link href="/app/compose" className="text-primary underline-offset-2 hover:underline">
                  Composer
                </Link>{" "}
                to try the agent on a fresh post.
              </p>
            </CardContent>
          </Card>

          <div className="pt-2 text-[11px] text-muted-foreground">
            Joined {relativeTime(user.id)} · v0.2 · <Link href="/api/health" className="hover:underline">api</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
