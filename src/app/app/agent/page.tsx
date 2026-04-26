import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Agent" };

export default function AgentPage() {
  return (
    <div>
      <PageHeader
        title="Engagement Agent"
        description="An iterative loop that scores, diagnoses, and rewrites your draft."
        actions={
          <Button asChild>
            <Link href="/app/compose"><Sparkles /> New run</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <h3 className="text-base font-semibold">How the loop works</h3>
            <ol className="space-y-3 text-sm">
              {[
                ["Score", "predict_engagement runs the trained model on your draft."],
                ["Gather context", "find_similar_top_posts and fetch_trends pull comparables."],
                ["Diagnose", "The agent picks the weakest drivers from the prediction."],
                ["Rewrite", "It writes 1–2 candidates inline, tuned to platform rules."],
                ["Verify", "score_diff confirms the rewrite improves the prob."],
                ["Stop", "When prob clears your target or improvement plateaus."],
              ].map(([k, v], i) => (
                <li key={k} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-mono text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium">{k}</div>
                    <div className="text-muted-foreground">{v}</div>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-6">
            <h3 className="text-base font-semibold">Tools available to the model</h3>
            <ul className="space-y-2 text-sm">
              {[
                "predict_engagement",
                "find_similar_top_posts",
                "suggest_tags",
                "fetch_trends",
                "score_diff",
                "generate_image",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">tool</Badge>
                  <code className="text-xs">{t}</code>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/compose">Open composer <ArrowRight /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
