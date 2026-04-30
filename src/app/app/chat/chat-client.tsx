"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { LogoSpinner } from "@/components/logo-3d";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { UserAvatar } from "@/components/social/avatar";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  { title: "What's rising on Tumblr this week?",       sub: "trends + topic mix" },
  { title: "Rewrite my last draft, more film-photo.",  sub: "agent rewrite" },
  { title: "Suggest 8 tags for a Patagonia trekking post.", sub: "tag suggestor" },
  { title: "Compare my Tumblr vs Reddit performance.", sub: "cross-platform" },
];

export function ChatClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [input]);

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
        setMessages((p) => [
          ...p,
          { role: "assistant", content: "No response. Open /api/ai/ping to diagnose." },
        ]);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      const accRef = { current: "" };
      setMessages((p) => [...p, { role: "assistant", content: "" }]);
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accRef.current = accRef.current + dec.decode(value, { stream: true });
        const snap = accRef.current;
        setMessages((p) => {
          const copy = p.slice();
          copy[copy.length - 1] = { role: "assistant", content: snap };
          return copy;
        });
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
      if (!accRef.current.trim()) {
        setMessages((p) => {
          const copy = p.slice();
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Empty response. Open /api/ai/ping to diagnose.",
          };
          return copy;
        });
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setMessages((p) => [...p, { role: "assistant", content: `Request failed: ${m}` }]);
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

      <div ref={scrollRef} className="flex-1 overflow-auto px-6 py-6 scrollbar-thin">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            <div className="pt-12">
              <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Try something
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p.title}
                    onClick={() => send(p.title)}
                    className="group rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-ring"
                  >
                    <Sparkles className="mb-2 h-4 w-4 text-primary" />
                    <div className="text-sm font-medium leading-snug">{p.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{p.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const isUser = m.role === "user";
                  const isStreaming = busy && i === messages.length - 1 && m.role === "assistant";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "flex items-start gap-3",
                        isUser && "flex-row-reverse",
                      )}
                    >
                      {isUser ? (
                        <UserAvatar seed="satvik" size={32} />
                      ) : (
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-white shadow-sm">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <Card
                        className={cn(
                          "max-w-[78%] px-4 py-3 text-[14.5px] leading-relaxed",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-card",
                        )}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : m.content ? (
                          <Markdown>{m.content}</Markdown>
                        ) : (
                          <span className="dots inline-flex items-center gap-0.5 align-middle">
                            <span /><span /><span />
                          </span>
                        )}
                        {isStreaming && m.content && (
                          <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-current align-middle" />
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <div className="relative flex-1">
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask anything — trends, rewrites, predictions…"
              className="min-h-[52px] resize-none pr-12"
              rows={1}
            />
            <div className="pointer-events-none absolute right-3 top-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              ⏎ to send · ⇧⏎ newline
            </div>
          </div>
          <Button
            type="submit"
            disabled={busy || !input.trim()}
            size="icon"
            className="h-[52px] w-[52px]"
          >
            {busy ? <LogoSpinner size={16} /> : <ArrowUp />}
          </Button>
        </form>
      </div>
    </div>
  );
}
