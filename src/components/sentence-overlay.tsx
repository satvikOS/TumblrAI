"use client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Sent = { index: number; text: string; start: number; end: number; score: number; band: "weak" | "mid" | "good"; notes: string[] };

export function SentenceOverlay({ text, sentences }: { text: string; sentences: Sent[] }) {
  if (!text) {
    return <div className="min-h-[160px] text-sm text-muted-foreground">Live sentence scoring will render here as you type.</div>;
  }
  if (sentences.length === 0) {
    return <pre className="whitespace-pre-wrap text-sm leading-relaxed">{text}</pre>;
  }

  const segments: { start: number; end: number; sent: Sent | null }[] = [];
  let cursor = 0;
  for (const s of sentences) {
    if (s.start > cursor) segments.push({ start: cursor, end: s.start, sent: null });
    segments.push({ start: s.start, end: s.end, sent: s });
    cursor = s.end;
  }
  if (cursor < text.length) segments.push({ start: cursor, end: text.length, sent: null });

  return (
    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
      {segments.map((seg, i) => {
        const slice = text.slice(seg.start, seg.end);
        if (!seg.sent) return <span key={i}>{slice}</span>;
        const cls = seg.sent.band === "good" ? "hl-good" : seg.sent.band === "mid" ? "hl-mid" : "hl-weak";
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span className={cn(cls, "rounded px-0.5 cursor-help transition-colors")}>{slice}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[280px]">
              <div className="text-xs font-medium mb-1">
                Sentence {seg.sent.index + 1} · {seg.sent.band} · {(seg.sent.score * 100).toFixed(0)}/100
              </div>
              <ul className="space-y-0.5">
                {seg.sent.notes.length > 0
                  ? seg.sent.notes.map((n, j) => (
                      <li key={j} className="flex gap-1 text-[11px] text-muted-foreground">
                        <span>•</span><span>{n}</span>
                      </li>
                    ))
                  : <li className="text-[11px] text-muted-foreground">No notes — solid beat.</li>}
              </ul>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </pre>
  );
}
