"use client";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Driver = {
  feature: string;
  category?: string;
  direction: "+" | "-";
  weight: number;
  contribution?: number;
  explanation: string;
  fix?: string;
};

export function DriverList({ drivers, max = 6 }: { drivers: Driver[]; max?: number }) {
  const items = drivers.slice(0, max);
  if (items.length === 0) {
    return <div className="text-xs text-muted-foreground">No driver signal yet — start writing.</div>;
  }
  return (
    <div className="space-y-2">
      {items.map((d, i) => (
        <motion.div
          key={d.feature + i}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-start gap-3 rounded-md border border-border bg-card/50 p-2.5 text-sm"
        >
          <Badge
            variant={d.direction === "+" ? "success" : "danger"}
            className="mt-0.5 w-12 justify-center font-mono text-[10px]"
          >
            {d.direction === "+" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {d.weight.toFixed(1)}
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="font-medium capitalize">{d.feature.replace(/_/g, " ")}</div>
            <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{d.explanation}</div>
            {d.fix ? (
              <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-400">
                <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{d.fix}</span>
              </div>
            ) : null}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
