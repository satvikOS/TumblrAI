import Link from "next/link";
import { ArrowRight, PenSquare, Sparkles, TrendingUp, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { drafts } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { engagementSeries, trendingTopics } from "@/lib/trends";
import { formatNumber, formatPct, relativeTime } from "@/lib/utils";
import { TrendSparkline } from "@/components/trend-sparkline";

export default async function Dashboard() {
  const user = (await getSession())!;
  const myDrafts = drafts.list(user.id);
  const series = engagementSeries("tumblr");
  const topics = trendingTopics("tumblr");

  const published = myDrafts.filter((d) => d.state === "published");
  const avgProb =
    myDrafts.length > 0
      ? myDrafts.reduce((s, d) => s + (d.predictedProb ?? 0), 0) / myDrafts.length
      : 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}.`}
        description="Your engagement intelligence at a glance."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/trends">Trends <ArrowRight /></Link>
            </Button>
            <Button asChild>
              <Link href="/app/compose"><PenSquare /> New post</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <Stat
          label="Drafts"
          value={String(myDrafts.length)}
          sub={`${published.length} published`}
          icon={<PenSquare className="h-4 w-4" />}
        />
        <Stat
          label="Avg predicted reach"
          value={formatPct(avgProb)}
          sub="across saved drafts"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <Stat
          label="Top trending topic"
          value={topics[0]?.topic ?? "—"}
          sub={`${formatPct(topics[0]?.share ?? 0)} of feed`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Tumblr engagement · last 14 days</CardTitle>
            <Badge variant="outline">avg {formatNumber(series.reduce((s, d) => s + d.value, 0) / series.length)}</Badge>
          </CardHeader>
          <CardContent>
            <TrendSparkline data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topics.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{t.topic}</span>
                  <span className="tabular-nums text-muted-foreground">{formatPct(t.share)}</span>
                </div>
                <Progress value={t.share * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 px-8 pb-12 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent drafts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/calendar">View all <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {myDrafts.slice(0, 6).map((d) => (
              <Link
                key={d.id}
                href={`/app/compose?id=${d.id}`}
                className="flex items-start gap-4 py-3 transition-colors hover:bg-muted/30"
              >
                <Badge variant={d.platform === "tumblr" ? "default" : "secondary"} className="mt-0.5 capitalize">
                  {d.platform}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-medium">{d.title ?? d.text.slice(0, 80)}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">
                    {relativeTime(d.createdAt)} · {d.tags.length} tags · {d.state}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">
                    {d.predictedProb ? formatPct(d.predictedProb) : "—"}
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">predicted</div>
                </div>
              </Link>
            ))}
            {myDrafts.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No drafts yet — start in the composer.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickAction
              href="/app/compose"
              icon={<PenSquare className="h-4 w-4" />}
              title="New draft"
              sub="Write with live engagement scoring"
            />
            <QuickAction
              href="/app/visual"
              icon={<ImageIcon className="h-4 w-4" />}
              title="Visual lab"
              sub="Analyze a photo or generate a hero image"
            />
            <QuickAction
              href="/app/chat"
              icon={<Sparkles className="h-4 w-4" />}
              title="Ask the assistant"
              sub="Trends, ideas, rewrites — on demand"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3 transition-all hover:border-primary/40 hover:bg-muted/50"
    >
      <div className="grid h-8 w-8 place-items-center rounded-md bg-background text-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
