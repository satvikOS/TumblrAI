"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ScoreTile({
  label, value, sublabel, accent = "default",
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  accent?: "default" | "success" | "warn" | "danger" | "viral";
}) {
  const ring =
    accent === "success" ? "ring-emerald-500/30 bg-emerald-500/5"
    : accent === "warn"  ? "ring-amber-500/30 bg-amber-500/5"
    : accent === "danger" ? "ring-red-500/30 bg-red-500/5"
    : accent === "viral" ? "ring-fuchsia-500/30 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-sky-500/10"
    : "ring-border bg-muted/30";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-lg p-3 ring-1", ring)}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-semibold tabular-nums leading-tight">{value}</div>
      {sublabel ? <div className="mt-0.5 text-[11px] text-muted-foreground truncate">{sublabel}</div> : null}
    </motion.div>
  );
}
