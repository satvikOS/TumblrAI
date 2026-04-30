"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart, Repeat2, MessageCircle, BarChart3, MoreHorizontal, Sparkles, BadgeCheck,
} from "lucide-react";
import { UserAvatar } from "./avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatNumber, relativeTime } from "@/lib/utils";

export type FeedPost = {
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
  author?: { handle: string; name: string; avatarSeed: string; verified?: boolean } | null;
};

export function PostCard({ post: initial }: { post: FeedPost }) {
  const [post, setPost] = useState(initial);
  const [busy, setBusy] = useState<"like" | "reblog" | null>(null);

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy("like");
    setPost((p) => ({ ...p, liked: !p.liked, noteCount: p.noteCount + (p.liked ? -1 : 1) }));
    try {
      const r = await fetch(`/api/social/posts/${post.id}/like`, { method: "POST" });
      if (r.ok) {
        const j = (await r.json()) as { liked: boolean; count: number };
        setPost((p) => ({ ...p, liked: j.liked, noteCount: j.count }));
      }
    } finally {
      setBusy(null);
    }
  }

  async function toggleReblog(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy("reblog");
    setPost((p) => ({ ...p, reblogged: !p.reblogged, reblogCount: p.reblogCount + (p.reblogged ? -1 : 1) }));
    try {
      const r = await fetch(`/api/social/posts/${post.id}/reblog`, { method: "POST" });
      if (r.ok) {
        const j = (await r.json()) as { reblogged: boolean; count: number };
        setPost((p) => ({ ...p, reblogged: j.reblogged, reblogCount: j.count }));
      }
    } finally {
      setBusy(null);
    }
  }

  const author = post.author;
  const probColor =
    post.predictedProb >= 0.7
      ? "text-emerald-600 dark:text-emerald-400"
      : post.predictedProb >= 0.5
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <Card className="lift overflow-hidden">
      <div className="flex items-start gap-3 p-4 pb-2">
        <Link href={`/app/${author?.handle}`} className="shrink-0">
          <UserAvatar seed={author?.avatarSeed ?? post.authorHandle} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <Link
              href={`/app/${author?.handle}`}
              className="truncate font-semibold hover:underline"
            >
              {author?.name ?? post.authorHandle}
            </Link>
            {author?.verified && (
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            )}
            <span className="truncate text-muted-foreground">@{author?.handle ?? post.authorHandle}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{relativeTime(post.createdAt)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Badge variant={post.platform === "tumblr" ? "default" : "secondary"} className="h-4 px-1.5 text-[10px] uppercase">
              {post.platform}
            </Badge>
            <span className="truncate">{post.topic}</span>
            <span>·</span>
            <span className="capitalize">{post.sentimentLabel}</span>
          </div>
        </div>
        <div className={cn("flex items-center gap-1 text-xs", probColor)}>
          <Sparkles className="h-3 w-3" />
          <span className="font-mono tabular-nums">{Math.round(post.predictedProb * 100)}%</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground" aria-label="more">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <Link href={`/app/post/${post.id}`} className="block px-4 pb-3">
        {post.title && (
          <h2 className="mb-1.5 font-display text-lg font-semibold leading-snug tracking-tight">
            {post.title}
          </h2>
        )}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
          {post.body}
        </p>
      </Link>

      {post.imageUrl && (
        <Link href={`/app/post/${post.id}`} className="relative block">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
            <Image
              src={post.imageUrl}
              alt={post.imageAlt ?? ""}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
            />
          </div>
        </Link>
      )}

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pt-3">
          {post.tags.slice(0, 8).map((t) => (
            <Link
              key={t}
              href={`/app/explore?topic=${encodeURIComponent(t)}`}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 px-2 py-1.5 text-muted-foreground">
        <ActionButton
          icon={<Heart className={cn("h-4 w-4", post.liked && "fill-current")} />}
          label={formatNumber(post.noteCount)}
          active={post.liked}
          activeClass="text-rose-500"
          onClick={toggleLike}
        />
        <ActionButton
          icon={<Repeat2 className="h-4 w-4" />}
          label={formatNumber(post.reblogCount)}
          active={post.reblogged}
          activeClass="text-emerald-500"
          onClick={toggleReblog}
        />
        <Link
          href={`/app/post/${post.id}`}
          className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          {formatNumber(post.commentCount)}
        </Link>
        <Link
          href={`/app/post/${post.id}#analyze`}
          className="ml-auto flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors hover:bg-muted hover:text-foreground"
        >
          <BarChart3 className="h-4 w-4" />
          analyze
        </Link>
      </div>
    </Card>
  );
}

function ActionButton({
  icon,
  label,
  active,
  activeClass,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeClass?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors hover:bg-muted hover:text-foreground",
        active && activeClass,
      )}
    >
      {icon}
      <span className="tabular-nums">{label}</span>
    </motion.button>
  );
}
