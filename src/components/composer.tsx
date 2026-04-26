"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Tag as TagIcon,
  X,
  Loader2,
  ImagePlus,
  Save,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EngagementGauge } from "./engagement-gauge";
import { PlatformToggle } from "./platform-toggle";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PredictResponse = {
  platform: "tumblr" | "reddit";
  probHigh: number;
  label: "high" | "low";
  features: {
    wordCount: number;
    sentiment: { label: string; compound: number };
    topic: { primary: string; weights: Record<string, number> };
    tagCount: number;
  };
  drivers: { feature: string; direction: "+" | "-"; weight: number; explanation: string }[];
};

type AgentEvent =
  | { event: "start"; data: { initialProb: number; target: number } }
  | { event: "text"; data: { delta: string } }
  | { event: "tool_call"; data: { id: string; name: string; args: unknown } }
  | { event: "tool_result"; data: { id: string; name: string; result: unknown } }
  | { event: "step"; data: { finishReason?: string } }
  | { event: "done"; data: { finishReason?: string; mock?: boolean } }
  | { event: "error"; data: { message: string } };

export function Composer() {
  const [platform, setPlatform] = useState<"tumblr" | "reddit">("tumblr");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const agentScrollRef = useRef<HTMLDivElement | null>(null);

  // Live prediction (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      const t = setTimeout(() => setPrediction(null), 0);
      return () => clearTimeout(t);
    }
    debounceRef.current = setTimeout(async () => {
      setPredicting(true);
      try {
        const r = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, tags, platform, imageDescription }),
        });
        const j = (await r.json()) as PredictResponse;
        startTransition(() => setPrediction(j));
      } finally {
        setPredicting(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, tags, platform, imageDescription, startTransition]);

  // Auto-scroll agent panel
  useEffect(() => {
    agentScrollRef.current?.scrollTo({
      top: agentScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [agentEvents]);

  function addTag(t: string) {
    const v = t.trim().replace(/^#/, "").toLowerCase();
    if (v && !tags.includes(v) && tags.length < 30) {
      setTags([...tags, v]);
    }
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function runAgent() {
    if (!text.trim()) {
      toast.error("Write a draft first.");
      return;
    }
    setAgentEvents([]);
    setAgentRunning(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: { text, tags, platform, imageDescription },
          target: 0.7,
        }),
      });
      if (!res.ok || !res.body) {
        toast.error("Agent failed to start.");
        setAgentRunning(false);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          let event: string | null = null;
          let data: string | null = null;
          for (const l of lines) {
            if (l.startsWith("event: ")) event = l.slice(7);
            if (l.startsWith("data: ")) data = l.slice(6);
          }
          if (event && data) {
            try {
              const parsed = JSON.parse(data);
              setAgentEvents((p) => [...p, { event, data: parsed } as AgentEvent]);
            } catch {
              /* ignore */
            }
          }
        }
      }
    } finally {
      setAgentRunning(false);
    }
  }

  async function saveDraft() {
    const r = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tags, platform, imageDescription }),
    });
    if (r.ok) toast.success("Draft saved.");
    else toast.error("Couldn't save.");
  }

  async function suggestTags() {
    if (!text.trim()) return;
    const r = await fetch("/api/similar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text, platform, k: 6 }),
    });
    const j = (await r.json()) as { items: { tags: string[] }[] };
    const candidates = new Set(j.items.flatMap((i) => i.tags));
    for (const c of candidates) addTag(c);
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-[1fr_420px]">
      {/* Left: composer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <PlatformToggle value={platform} onChange={setPlatform} />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={saveDraft}>
              <Save /> Save draft
            </Button>
            <Button size="sm" onClick={runAgent} disabled={agentRunning || !text.trim()}>
              {agentRunning ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Run agent
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                platform === "tumblr"
                  ? "Soft fog peeling off the lake at first light…"
                  : "Two weeks in northern Japan in October — itinerary check?"
              }
              className="min-h-[280px] resize-none border-0 bg-transparent p-6 text-base leading-relaxed focus-visible:ring-0"
            />
            <Separator />
            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
              <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <AnimatePresence initial={false}>
                {tags.map((t) => (
                  <motion.div
                    key={t}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                  >
                    <Badge className="gap-1 px-2 py-1">
                      #{t}
                      <button onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>
                        <X className="h-3 w-3 opacity-70" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                    setTagInput("");
                  } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                    setTags(tags.slice(0, -1));
                  }
                }}
                placeholder={tags.length === 0 ? "add tag, press enter" : ""}
                className="h-7 flex-1 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0"
              />
              <Button variant="ghost" size="sm" onClick={suggestTags} disabled={!text.trim()}>
                <Wand2 /> Suggest
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImagePlus className="h-3.5 w-3.5" />
              Optional: describe an image you'd attach (used by the predictor).
            </div>
            <Input
              value={imageDescription}
              onChange={(e) => setImageDescription(e.target.value)}
              placeholder="e.g. wide shot of a fog-covered alpine lake at sunrise"
            />
          </CardContent>
        </Card>

        {/* Drivers */}
        {prediction && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                Why this score
                <span className="text-xs font-normal text-muted-foreground">
                  Top drivers from the model
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {prediction.drivers.slice(0, 5).map((d) => (
                <div key={d.feature + d.explanation} className="flex items-start gap-3 text-sm">
                  <Badge
                    variant={d.direction === "+" ? "success" : "danger"}
                    className="mt-0.5 w-9 justify-center font-mono"
                  >
                    {d.direction}
                    {d.weight.toFixed(1)}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium">{d.feature.replace(/_/g, " ")}</div>
                    <div className="text-xs text-muted-foreground">{d.explanation}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: live prediction + agent stream */}
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <EngagementGauge
              prob={prediction?.probHigh ?? 0}
              label={prediction?.label}
            />
            <div className="grid w-full grid-cols-2 gap-2 text-xs">
              <Stat label="Topic" value={prediction?.features.topic.primary ?? "—"} />
              <Stat label="Sentiment" value={prediction?.features.sentiment.label ?? "—"} />
              <Stat label="Words" value={String(prediction?.features.wordCount ?? 0)} />
              <Stat label="Tags" value={String(prediction?.features.tagCount ?? 0)} />
            </div>
            {predicting ? (
              <div className="text-xs text-muted-foreground">scoring…</div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex h-[520px] flex-col">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              Engagement Agent
            </CardTitle>
          </CardHeader>
          <div ref={agentScrollRef} className="flex-1 space-y-3 overflow-auto p-4 scrollbar-thin">
            {agentEvents.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                Hit{" "}
                <span className="mx-1 inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px]">
                  <Sparkles className="h-3 w-3" /> Run agent
                </span>{" "}
                to iteratively rewrite this draft.
              </div>
            ) : (
              agentEvents.map((e, i) => <AgentLine key={i} event={e} />)
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function AgentLine({ event }: { event: AgentEvent }) {
  if (event.event === "start") {
    return (
      <div className="text-xs text-muted-foreground">
        starting from <strong>{(event.data.initialProb * 100).toFixed(0)}%</strong> · target{" "}
        {(event.data.target * 100).toFixed(0)}%
      </div>
    );
  }
  if (event.event === "text") {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{event.data.delta}</div>
    );
  }
  if (event.event === "tool_call") {
    return (
      <div className="rounded-md border border-border bg-muted/40 p-2 font-mono text-[11px]">
        <div className="flex items-center gap-1 text-primary">
          <ChevronRight className="h-3 w-3" />
          {event.data.name}
        </div>
        <pre className="mt-1 overflow-auto whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(event.data.args, null, 0).slice(0, 240)}
        </pre>
      </div>
    );
  }
  if (event.event === "tool_result") {
    return (
      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 font-mono text-[11px]">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <ArrowUpRight className="h-3 w-3" />
          {event.data.name} ↩
        </div>
        <pre className="mt-1 overflow-auto whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify(event.data.result, null, 0).slice(0, 280)}
        </pre>
      </div>
    );
  }
  if (event.event === "done") {
    return (
      <div
        className={cn(
          "rounded-md border p-2 text-xs",
          event.data.mock
            ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
            : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
        )}
      >
        {event.data.mock ? "preview run (no Azure key)" : "agent finished"}
      </div>
    );
  }
  if (event.event === "error") {
    return (
      <div className="rounded-md border border-red-500/30 bg-red-500/5 p-2 text-xs text-red-600">
        {event.data.message}
      </div>
    );
  }
  return null;
}
