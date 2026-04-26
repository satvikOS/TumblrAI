"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlatformToggle } from "@/components/platform-toggle";
import { TrendSparkline } from "@/components/trend-sparkline";
import { formatNumber, formatPct } from "@/lib/utils";

type Trends = {
  platform: "tumblr" | "reddit";
  tags: { tag: string; posts: number; avgEngagement: number; weekChange: number; sentimentMix: { pos: number; neu: number; neg: number } }[];
  topics: { topic: string; share: number; avgEngagement: number; trajectory: "rising" | "steady" | "falling" }[];
  series: { date: string; value: number }[];
};

export function TrendsClient({ initialPlatform }: { initialPlatform: "tumblr" | "reddit" }) {
  const [platform, setPlatform] = useState<"tumblr" | "reddit">(initialPlatform);
  const [data, setData] = useState<Trends | null>(null);

  useEffect(() => {
    fetch(`/api/trends?platform=${platform}`)
      .then((r) => r.json())
      .then(setData);
  }, [platform]);

  return (
    <div>
      <PageHeader
        title="Trends"
        description="What's resonating right now, by tag and topic."
        actions={<PlatformToggle value={platform} onChange={setPlatform} />}
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Engagement · last 14 days</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? <TrendSparkline data={data.series} height={220} /> : <Skeleton h={220} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic share</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.topics.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    {t.topic}
                    <TrajectoryIcon trajectory={t.trajectory} />
                  </span>
                  <span className="tabular-nums text-muted-foreground">{formatPct(t.share)}</span>
                </div>
                <Progress value={t.share * 100} />
                <div className="mt-1 text-[11px] text-muted-foreground">
                  avg {formatNumber(t.avgEngagement)} engagement
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="px-8 pb-12">
        <Card>
          <CardHeader>
            <CardTitle>Trending tags</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data?.tags.map((t, i) => (
              <motion.div
                key={t.tag}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">#{t.tag}</div>
                  <Badge variant={t.weekChange >= 0 ? "success" : "danger"} className="font-mono">
                    {t.weekChange >= 0 ? "+" : ""}
                    {(t.weekChange * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">
                  {formatNumber(t.avgEngagement)}
                </div>
                <div className="text-xs text-muted-foreground">
                  avg engagement · {formatNumber(t.posts)} posts
                </div>
                <div className="mt-3 flex h-1.5 overflow-hidden rounded-full">
                  <div className="bg-emerald-500" style={{ width: `${t.sentimentMix.pos * 100}%` }} />
                  <div className="bg-zinc-400" style={{ width: `${t.sentimentMix.neu * 100}%` }} />
                  <div className="bg-red-500" style={{ width: `${t.sentimentMix.neg * 100}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                  <span>{(t.sentimentMix.pos * 100).toFixed(0)}% pos</span>
                  <span>{(t.sentimentMix.neu * 100).toFixed(0)}% neu</span>
                  <span>{(t.sentimentMix.neg * 100).toFixed(0)}% neg</span>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrajectoryIcon({ trajectory }: { trajectory: "rising" | "steady" | "falling" }) {
  if (trajectory === "rising") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trajectory === "falling") return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function Skeleton({ h }: { h: number }) {
  return <div style={{ height: h }} className="animate-pulse rounded-md bg-muted" />;
}
