import Link from "next/link";
import { PenSquare } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { drafts } from "@/lib/store";
import { getSession } from "@/lib/auth";
import { formatPct, relativeTime } from "@/lib/utils";

export const metadata = { title: "Calendar" };

const STATES = ["draft", "scheduled", "published"] as const;

export default async function CalendarPage() {
  const user = (await getSession())!;
  const all = drafts.list(user.id);
  const cols = STATES.map((s) => ({
    state: s,
    items: all.filter((d) => d.state === s),
  }));

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Drafts, scheduled, and published — at a glance."
        actions={
          <Button asChild>
            <Link href="/app/compose"><PenSquare /> New post</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-3">
        {cols.map((c) => (
          <div key={c.state} className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs uppercase tracking-wider text-muted-foreground">
              <span>{c.state}</span>
              <span className="tabular-nums">{c.items.length}</span>
            </div>
            <div className="space-y-2">
              {c.items.map((d) => (
                <Card key={d.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant={d.platform === "tumblr" ? "default" : "secondary"} className="capitalize">
                        {d.platform}
                      </Badge>
                      <span className="text-muted-foreground">{relativeTime(d.createdAt)}</span>
                    </div>
                    <div className="line-clamp-3 text-sm">{d.title ?? d.text}</div>
                    <div className="flex flex-wrap gap-1">
                      {d.tags.slice(0, 4).map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">
                          #{t}
                        </Badge>
                      ))}
                    </div>
                    {d.predictedProb != null && (
                      <div className="border-t border-border pt-2 text-xs text-muted-foreground">
                        predicted{" "}
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatPct(d.predictedProb)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {c.items.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-xs text-muted-foreground">
                    nothing here yet
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
