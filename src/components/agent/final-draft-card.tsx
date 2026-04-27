"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FinalDraft } from "@/lib/agent-output";

export function FinalDraftCard({
  draft,
  onApply,
}: {
  draft: FinalDraft;
  onApply?: (next: { text: string; tags: string[] }) => void;
}) {
  const [copied, setCopied] = useState(false);
  const probPct = draft.probability != null ? Math.round(draft.probability * 100) : null;

  function copy() {
    navigator.clipboard.writeText(draft.body);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1400);
  }

  function apply() {
    if (!onApply) return;
    onApply({ text: draft.body, tags: draft.tags });
    toast.success("Applied to your draft");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden border-primary/40 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-soft bg-gradient-to-br from-primary-soft/40 to-transparent px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-brand-gradient text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Agent · Final Draft
              </div>
              <div className="font-display text-sm font-semibold leading-none tracking-tight">
                Ready to publish
              </div>
            </div>
          </div>
          {probPct != null && (
            <Badge
              variant={probPct >= 70 ? "success" : probPct >= 50 ? "warn" : "danger"}
              className="font-mono tabular-nums"
            >
              {probPct}%
            </Badge>
          )}
        </div>

        <CardContent className="space-y-4 p-5">
          {/* Body */}
          <p className="whitespace-pre-wrap font-display text-[15.5px] leading-relaxed">
            {draft.body}
          </p>

          {/* Probability bar */}
          {probPct != null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <span>Predicted reach</span>
                <span className="tabular-nums text-foreground-soft">{probPct}%</span>
              </div>
              <Progress value={probPct} />
            </div>
          )}

          {/* Changes */}
          {draft.changes.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Why this version is better
              </div>
              <ul className="space-y-1.5">
                {draft.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span className="leading-snug">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {draft.tags.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Suggested tags
              </div>
              <div className="flex flex-wrap gap-1">
                {draft.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground-soft"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-border-soft pt-3">
            <Button size="sm" onClick={apply} disabled={!onApply}>
              <Wand2 className="h-3.5 w-3.5" /> Apply to draft
            </Button>
            <Button size="sm" variant="outline" onClick={copy}>
              <Copy className={cn("h-3.5 w-3.5", copied && "text-emerald-500")} />
              {copied ? "Copied" : "Copy text"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
