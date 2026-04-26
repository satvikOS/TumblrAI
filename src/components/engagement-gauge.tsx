"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function EngagementGauge({
  prob,
  label,
  size = 180,
}: {
  prob: number;
  label?: "high" | "low";
  size?: number;
}) {
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, prob));
  const color = prob >= 0.7 ? "var(--color-success)" : prob >= 0.5 ? "var(--color-warn)" : "var(--color-danger)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDasharray: `${dash} ${c - dash}` }}
          transition={{ type: "spring", stiffness: 70, damping: 15 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-semibold tabular-nums">
          {(prob * 100).toFixed(0)}
          <span className="text-base text-muted-foreground">%</span>
        </div>
        <div className={cn("mt-1 text-xs uppercase tracking-wider",
          prob >= 0.7 ? "text-emerald-600 dark:text-emerald-400"
          : prob >= 0.5 ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400",
        )}>
          {label ?? (prob >= 0.5 ? "high" : "low")}
        </div>
      </div>
    </div>
  );
}
