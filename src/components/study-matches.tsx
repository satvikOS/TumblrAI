"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

type Match = {
  id: string; text: string; tags: string[];
  noteCount?: number; topic?: string;
  takeaway?: string;
};

export function StudyMatches({ matches }: { matches: Match[] }) {
  if (!matches.length) {
    return <div className="text-xs text-muted-foreground">No reference matches yet.</div>;
  }
  return (
    <div className="space-y-2">
      {matches.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-md border border-border bg-card/50 p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.topic ?? "reference"}
            </div>
            {m.noteCount != null && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3" /> {formatNumber(m.noteCount)}
              </div>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed">{m.text}</p>
          {m.takeaway ? (
            <div className="mt-2 rounded bg-primary/5 px-2 py-1 text-[11px] text-primary">
              ↳ {m.takeaway}
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            {m.tags.slice(0, 5).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px]">#{t}</Badge>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
