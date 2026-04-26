"use client";
import { cn } from "@/lib/utils";

export function PlatformToggle({
  value,
  onChange,
  size = "default",
}: {
  value: "tumblr" | "reddit";
  onChange: (v: "tumblr" | "reddit") => void;
  size?: "default" | "sm";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-card p-0.5",
        size === "sm" ? "h-7 text-xs" : "h-9 text-sm",
      )}
    >
      {(["tumblr", "reddit"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded px-3 capitalize transition-colors",
            value === p
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
            size === "sm" ? "h-6 text-xs" : "h-8",
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
