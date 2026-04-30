"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Heart, Repeat2, MessageCircle, Sparkles, Send, BadgeCheck,
} from "lucide-react";
import { LogoSpinner } from "@/components/logo-3d";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/social/avatar";
import { EngagementGauge } from "@/components/engagement-gauge";
import { cn, formatNumber, relativeTime } from "@/lib/utils";

type PostAuthor = { handle: string; name: string; avatarSeed: string; verified?: boolean; bio?: string } | null;

type Post = {
  id: string;
  authorHandle: string;
  platform: "tumblr" | "reddit";
  title?: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  tags: string[];
  noteCount: number;
  reblogCount: number;
  commentCount: number;
  topic: string;
  sentimentLabel: "positive" | "neutral" | "negative";
  predictedProb: number;
  createdAt: string;
  liked?: boolean;
  reblogged?: boolean;
  author: PostAuthor;
};

type Comment = {
  id: string;
  authorHandle: string;
  body: string;
  createdAt: string;
  noteCount: number;
  author: { handle: string; name: string; avatarSeed: string; verified?: boolean } | null;
};

export function PostDetailClient({
  initialPost,
  initialComments,
}: {
  initialPost: Post;
  initialComments: Comment[];
}) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  async function toggleLike() {
    setPost((p) => ({ ...p, liked: !p.liked, noteCount: p.noteCount + (p.liked ? -1 : 1) }));
    const r = await fetch(`/api/social/posts/${post.id}/like`, { method: "POST" });
    if (r.ok) {
      const j = (await r.json()) as { liked: boolean; count: number };
      setPost((p) => ({ ...p, liked: j.liked, noteCount: j.count }));
    }
  }

  async function toggleReblog() {
    setPost((p) => ({ ...p, reblogged: !p.reblogged, reblogCount: p.reblogCount + (p.reblogged ? -1 : 1) }));
    const r = await fetch(`/api/social/posts/${post.id}/reblog`, { method: "POST" });
    if (r.ok) {
      const j = (await r.json()) as { reblogged: boolean; count: number };
      setPost((p) => ({ ...p, reblogged: j.reblogged, reblogCount: j.count }));
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      const r = await fetch(`/api/social/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      if (r.ok) {
        const j = (await r.json()) as { comment: Comment };
        setComments((cs) => [j.comment, ...cs]);
        setPost((p) => ({ ...p, commentCount: p.commentCount + 1 }));
        setDraft("");
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Post + comments */}
      <div className="px-4 py-4 sm:px-6">
        <Link
          href="/app"
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to feed
        </Link>

        <Card className="overflow-hidden">
          <div className="flex items-start gap-3 p-5 pb-3">
            <Link href={`/app/${post.author?.handle}`}>
              <UserAvatar seed={post.author?.avatarSeed ?? post.authorHandle} size={48} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link href={`/app/${post.author?.handle}`} className="font-semibold hover:underline">
                  {post.author?.name}
                </Link>
                {post.author?.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                <span className="text-sm text-muted-foreground">@{post.author?.handle}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={post.platform === "tumblr" ? "default" : "secondary"} className="h-4 px-1.5 text-[10px] uppercase">
                  {post.platform}
                </Badge>
                <span>{post.topic}</span>
                <span>·</span>
                <span>{relativeTime(post.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            {post.title && (
              <h1 className="mb-2 font-display text-2xl font-semibold leading-tight tracking-tight">
                {post.title}
              </h1>
            )}
            <p className="whitespace-pre-wrap text-[16px] leading-relaxed">{post.body}</p>
          </div>

          {post.imageUrl && (
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <Image
                src={post.imageUrl}
                alt={post.imageAlt ?? ""}
                fill
                sizes="(max-width: 1024px) 100vw, 760px"
                className="object-cover"
              />
            </div>
          )}

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 px-5 pt-3">
              {post.tags.map((t) => (
                <Link
                  key={t}
                  href={`/app/explore?topic=${encodeURIComponent(t)}`}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border-soft p-3 text-sm text-muted-foreground">
            <Action
              icon={<Heart className={cn("h-4 w-4", post.liked && "fill-current")} />}
              label={`${formatNumber(post.noteCount)} likes`}
              active={post.liked}
              activeClass="text-rose-500"
              onClick={toggleLike}
            />
            <Action
              icon={<Repeat2 className="h-4 w-4" />}
              label={`${formatNumber(post.reblogCount)} reblogs`}
              active={post.reblogged}
              activeClass="text-emerald-500"
              onClick={toggleReblog}
            />
            <span className="ml-auto inline-flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" />
              {formatNumber(post.commentCount)} comments
            </span>
          </div>
        </Card>

        {/* Comment composer */}
        <form onSubmit={submitComment} className="mt-5 flex items-start gap-3">
          <UserAvatar seed="satvik" size={36} />
          <div className="flex-1">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              className="min-h-[60px] resize-none"
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" disabled={!draft.trim() || posting}>
                {posting ? <LogoSpinner size={14} /> : <Send />}
                Comment
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/app/${c.author?.handle}`}>
                      <UserAvatar seed={c.author?.avatarSeed ?? c.authorHandle} size={32} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Link href={`/app/${c.author?.handle}`} className="font-medium hover:underline">
                          {c.author?.name ?? c.authorHandle}
                        </Link>
                        {c.author?.verified && <BadgeCheck className="h-3 w-3 text-primary" />}
                        <span className="text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{relativeTime(c.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {comments.length === 0 && (
              <div className="grid place-items-center rounded-lg border border-dashed border-border py-10 text-sm text-muted-foreground">
                No comments yet. Be first.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI side panel — engagement intelligence on this post */}
      <aside id="analyze" className="hidden border-l border-border-soft px-5 py-4 lg:block">
        <div className="sticky top-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Engagement Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              <EngagementGauge
                prob={post.predictedProb}
                label={post.predictedProb >= 0.5 ? "high" : "low"}
                size={140}
              />
              <div className="grid w-full grid-cols-2 gap-2 text-xs">
                <Stat label="Topic" value={post.topic} />
                <Stat label="Sentiment" value={post.sentimentLabel} />
                <Stat label="Words" value={String(post.body.trim().split(/\s+/).length)} />
                <Stat label="Tags" value={String(post.tags.length)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Reach breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BreakdownRow label="Likes" value={post.noteCount} max={post.noteCount + post.reblogCount + post.commentCount} />
              <BreakdownRow label="Reblogs" value={post.reblogCount} max={post.noteCount + post.reblogCount + post.commentCount} />
              <BreakdownRow label="Comments" value={post.commentCount} max={post.noteCount + post.reblogCount + post.commentCount} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 p-4 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Try a rewrite</div>
              <p className="text-sm leading-snug text-muted-foreground">
                Open this post in the composer to run the engagement agent on it.
              </p>
              <Button asChild size="sm" className="w-full">
                <Link href={`/app/compose?seed=${post.id}`}>Open in composer</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}

function Action({
  icon, label, active, activeClass, onClick,
}: {
  icon: React.ReactNode; label: string; active?: boolean; activeClass?: string; onClick?: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors hover:bg-muted hover:text-foreground",
        active && activeClass,
      )}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-soft bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium capitalize">{value}</div>
    </div>
  );
}

function BreakdownRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{formatNumber(value)}</span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
