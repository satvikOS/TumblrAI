"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Wand2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Lever = {
  id: string;
  label: string;
  delta: number;
  after: { prob: number; label: string };
  preview?: string;
};

export function WhatIfPanel({
  text, tags, platform, imageDescription, onApply,
}: {
  text: string;
  tags: string[];
  platform: "tumblr" | "reddit";
  imageDescription?: string;
  onApply: (next: { text?: string; tags?: string[]; imageDescription?: string }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [base, setBase] = useState<{ prob: number; label: string } | null>(null);
  const [levers, setLevers] = useState<Lever[]>([]);
  const [auto, setAuto] = useState(true);

  async function load() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/whatif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, tags, platform, imageDescription }),
      });
      const j = await r.json();
      setBase(j.base);
      setLevers(j.levers ?? []);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(load, 800);
    return () => clearTimeout(t);
  }, [text, JSON.stringify(tags), platform, imageDescription, auto]);

  function applyLever(l: Lever) {
    const id = l.id;
    if (id === "more_tags") {
      const extra = ["fog", "alpine", "minimal", "slow travel", "scenery"];
      const next = [...new Set([...tags, ...extra])].slice(0, 12);
      onApply({ tags: next });
      toast.success(`Added tags. +${(l.delta * 100).toFixed(0)} pts`);
      return;
    }
    if (id === "fewer_tags") {
      onApply({ tags: tags.slice(0, 4) });
      toast.success(`Trimmed tags. ${l.delta >= 0 ? "+" : ""}${(l.delta * 100).toFixed(0)} pts`);
      return;
    }
    if (id === "add_image") {
      onApply({ imageDescription: imageDescription || "wide shot of fog over an alpine lake at first light" });
      toast.success(`Image attached. +${(l.delta * 100).toFixed(0)} pts`);
      return;
    }
    if (l.preview) {
      onApply({ text: l.preview });
      toast.success(`Applied "${l.label}". ${l.delta >= 0 ? "+" : ""}${(l.delta * 100).toFixed(0)} pts`);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Wand2 className="h-3.5 w-3.5 text-primary" />
          What-if levers
        </div>
        <button
          onClick={() => setAuto((a) => !a)}
          className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {auto ? "auto" : "manual"}
        </button>
      </div>
      {!auto && (
        <Button onClick={load} variant="outline" size="sm" className="w-full" disabled={busy || !text.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : <Wand2 />} Recompute
        </Button>
      )}
      {!text.trim() ? (
        <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          Start writing to see what-if simulations.
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {levers.slice(0, 6).map((l) => {
              const positive = l.delta > 0;
              const negligible = Math.abs(l.delta) < 0.005;
              return (
                <motion.button
                  key={l.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => applyLever(l)}
                  disabled={negligible}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md border p-2.5 text-left transition-all",
                    positive
                      ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : negligible
                      ? "border-border bg-muted/20 opacity-60"
                      : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-9 w-12 place-items-center rounded-md font-mono text-xs font-semibold tabular-nums",
                      positive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-500/15 text-red-700 dark:text-red-400",
                    )}
                  >
                    {positive ? "+" : ""}{(l.delta * 100).toFixed(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{l.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      after: {(l.after.prob * 100).toFixed(0)}% · {l.after.label}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                </motion.button>
              );
            })}
          </AnimatePresence>
          {base && (
            <div className="pt-2 text-[11px] text-muted-foreground">
              <Badge variant="outline" className="font-mono text-[10px]"><Check className="mr-1 h-2.5 w-2.5" />now {(base.prob * 100).toFixed(0)}%</Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
