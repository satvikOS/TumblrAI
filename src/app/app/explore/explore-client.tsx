"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostCard, type FeedPost } from "@/components/social/post-card";
import { PlatformToggle } from "@/components/platform-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { LogoLoader } from "@/components/logo-3d";
import { trendingTopics } from "@/lib/trends";
import { cn } from "@/lib/utils";

export function ExploreClient({
  initialTopic,
  initialPlatform,
}: {
  initialTopic?: string;
  initialPlatform: "tumblr" | "reddit";
}) {
  const [platform, setPlatform] = useState<"tumblr" | "reddit">(initialPlatform);
  const [topic, setTopic] = useState<string | undefined>(initialTopic);
  const [items, setItems] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(() => setLoading(true), 0);
    const qs = new URLSearchParams({ platform, limit: "30" });
    if (topic) qs.set("topic", topic);
    fetch(`/api/explore?${qs}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((j: { items: FeedPost[] }) => {
        setItems(j.items);
        setLoading(false);
      })
      .catch(() => {});
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [platform, topic]);

  const topics = trendingTopics(platform);

  return (
    <div>
      <PageHeader
        title="Explore"
        description="Top-decile posts ranked by predicted engagement, by platform and topic."
        actions={<PlatformToggle value={platform} onChange={setPlatform} />}
      />

      <div className="space-y-4 px-6 py-4">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 p-3">
            <Compass className="h-4 w-4 text-primary" />
            <button
              onClick={() => setTopic(undefined)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition",
                !topic ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {topics.map((t) => (
              <button
                key={t.topic}
                onClick={() => setTopic(t.topic)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs transition",
                  topic === t.topic
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {t.topic}
              </button>
            ))}
          </CardContent>
        </Card>

        {loading ? (
          <LogoLoader label="finding the best posts" size={56} />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AnimatePresence initial={false}>
              {items.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <PostCard post={p} />
                </motion.div>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <div className="col-span-full grid place-items-center py-16 text-sm text-muted-foreground">
                No posts match this filter.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
