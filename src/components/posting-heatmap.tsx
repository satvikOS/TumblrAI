"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PostingHeatmap({
  cells,
  best,
}: {
  cells: { day: number; hour: number; score: number }[];
  best?: { day: string; hour: string; rationale: string };
}) {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const c of cells) grid[c.day][c.hour] = c.score;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[40px_1fr] gap-1.5">
        <div />
        <div className="grid grid-cols-24 gap-[2px] text-[9px] text-muted-foreground tabular-nums" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className={cn("text-center", h % 4 === 0 ? "" : "opacity-0")}>{h}</div>
          ))}
        </div>
        {DAYS.map((d, di) => (
          <>
            <div key={d} className="text-[10px] uppercase tracking-wider text-muted-foreground self-center">{d}</div>
            <div key={d + "row"} className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
              {grid[di].map((s, h) => {
                const isBest = best && DAYS[di] === best.day && `${String(h).padStart(2, "0")}:00` === best.hour;
                return (
                  <Tooltip key={h}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "aspect-square rounded-[3px] cursor-pointer transition-transform hover:scale-110",
                          isBest && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                        )}
                        style={{
                          backgroundColor: `color-mix(in oklch, var(--primary) ${Math.round(s * 90)}%, transparent)`,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="text-xs">{DAYS[di]} · {String(h).padStart(2, "0")}:00</div>
                      <div className="text-[10px] text-muted-foreground">{(s * 100).toFixed(0)}/100</div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </>
        ))}
      </div>
      {best && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <div className="font-medium">Best window: {best.day} · {best.hour}</div>
          <div className="text-muted-foreground">{best.rationale}</div>
        </div>
      )}
    </div>
  );
}
