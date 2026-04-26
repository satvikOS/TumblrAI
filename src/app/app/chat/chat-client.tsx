"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "What topic is rising fastest on Tumblr this week?",
  "Rewrite my last draft to feel more like film photography.",
  "Suggest 8 tags for a post about Patagonia trekking.",
  "Compare my Tumblr vs Reddit performance and tell me where to focus.",
];

export function ChatClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.body) {
        setMessages((p) => [...p, { role: "assistant", content: "(no response)" }]);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((p) => {
          const copy = p.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-svh flex-col">
      <PageHeader
        title="Assistant"
        description="Calls the same prediction tools the agent uses."
      />

      <div ref={scrollRef} className="flex-1 overflow-auto px-8 py-6 scrollbar-thin">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <div className="grid gap-3 pt-12 sm:grid-cols-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-lg border border-border bg-card p-4 text-left text-sm transition-all hover:border-primary/40 hover:bg-muted/40"
                >
                  <Sparkles className="mb-2 h-4 w-4 text-primary" />
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <Card
                    className={cn(
                      "max-w-[80%] px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card",
                    )}
                  >
                    <div className="whitespace-pre-wrap">{m.content || "…"}</div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="border-t border-border px-8 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything — trends, rewrites, predictions…"
            className="min-h-[52px] resize-none"
          />
          <Button onClick={() => send()} disabled={busy || !input.trim()} size="icon" className="h-[52px] w-[52px]">
            {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          </Button>
        </div>
      </div>
    </div>
  );
}
