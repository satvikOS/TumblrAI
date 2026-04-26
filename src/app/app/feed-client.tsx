"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { PostCard, type FeedPost } from "@/components/social/post-card";

export function FeedClient({
  initialItems,
  initialCursor,
}: {
  initialItems: FeedPost[];
  initialCursor: number | null;
}) {
  const [platform, setPlatform] = useState<"all" | "tumblr" | "reddit">("all");
  const [items, setItems] = useState<FeedPost[]>(initialItems);
  const [cursor, setCursor] = useState<number | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const initialLoad = useRef(true);

  // Reload when platform changes (skip the very first effect run since
  // we already have SSR data for the default platform).
  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    const ac = new AbortController();
    const qs = new URLSearchParams({ limit: "12" });
    if (platform !== "all") qs.set("platform", platform);
    const t = setTimeout(() => setLoading(true), 0);
    fetch(`/api/feed?${qs}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((j: { items: FeedPost[]; nextCursor: number | null }) => {
        setItems(j.items);
        setCursor(j.nextCursor);
        setLoading(false);
      })
      .catch(() => {});
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [platform]);

  const loadMore = useCallback(async () => {
    if (loading || cursor == null) return;
    setLoading(true);
    const qs = new URLSearchParams({ cursor: String(cursor), limit: "12" });
    if (platform !== "all") qs.set("platform", platform);
    try {
      const r = await fetch(`/api/feed?${qs}`);
      const j = (await r.json()) as { items: FeedPost[]; nextCursor: number | null };
      setItems((prev) => [...prev, ...j.items]);
      setCursor(j.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, platform]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5 text-sm">
          {(["all", "tumblr", "reddit"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={
                "h-8 rounded px-3 capitalize transition-colors " +
                (platform === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {items.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <PostCard post={p} />
          </motion.div>
        ))}
      </AnimatePresence>

      <div ref={sentinel} className="grid place-items-center py-6">
        {cursor == null ? (
          <span className="text-xs text-muted-foreground">— end of feed —</span>
        ) : loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    </div>
  );
}
