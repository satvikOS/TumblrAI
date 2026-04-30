"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, BadgeCheck } from "lucide-react";
import { UserAvatar } from "./avatar";
import { LogoSpinner } from "@/components/logo-3d";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber } from "@/lib/utils";

type Author = { handle: string; name: string; avatarSeed: string; verified?: boolean };
type SearchPost = {
  id: string;
  body: string;
  title?: string;
  platform: "tumblr" | "reddit";
  noteCount: number;
  author: Author | null;
};
type SearchUser = {
  handle: string;
  name: string;
  avatarSeed: string;
  verified?: boolean;
  followers: number;
};

export function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Cmd-K / Ctrl-K to focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside closes
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced search
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      const t = setTimeout(() => {
        setPosts([]);
        setUsers([]);
      }, 0);
      return () => clearTimeout(t);
    }
    const ac = new AbortController();
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`/api/social/search?q=${encodeURIComponent(term)}`, {
          signal: ac.signal,
        });
        const j = (await r.json()) as { posts: SearchPost[]; users: SearchUser[] };
        setPosts(j.posts ?? []);
        setUsers(j.users ?? []);
      } catch {
        /* ignore */
      } finally {
        setBusy(false);
      }
    }, 220);
    return () => {
      ac.abort();
      clearTimeout(t);
    };
  }, [q]);

  const hasResults = posts.length > 0 || users.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search posts, tags, people…"
        className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-14 text-sm shadow-sm placeholder:text-muted-foreground focus-ring focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-border-soft bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
        ⌘K
      </kbd>

      <AnimatePresence>
        {open && q.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[480px] overflow-auto rounded-lg border border-border bg-popover shadow-lg scrollbar-thin"
          >
            {busy && !hasResults && (
              <div className="grid place-items-center py-6">
                <LogoSpinner size={28} />
              </div>
            )}

            {users.length > 0 && (
              <Section label="People">
                {users.map((u) => (
                  <Link
                    key={u.handle}
                    href={`/app/${u.handle}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 transition hover:bg-muted"
                  >
                    <UserAvatar seed={u.avatarSeed} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 truncate text-sm font-medium">
                        {u.name}
                        {u.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        @{u.handle} · {formatNumber(u.followers)} followers
                      </div>
                    </div>
                  </Link>
                ))}
              </Section>
            )}

            {posts.length > 0 && (
              <Section label="Posts">
                {posts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app/post/${p.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-3 py-2 transition hover:bg-muted"
                  >
                    {p.author && (
                      <UserAvatar seed={p.author.avatarSeed} size={28} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-xs">
                        <Badge
                          variant={p.platform === "tumblr" ? "default" : "secondary"}
                          className="h-4 px-1.5 text-[9px] uppercase"
                        >
                          {p.platform}
                        </Badge>
                        <span className="truncate text-muted-foreground">
                          @{p.author?.handle}
                        </span>
                        <span className="ml-auto tabular-nums text-muted-foreground">
                          {formatNumber(p.noteCount)} notes
                        </span>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-sm">
                        {p.title ?? p.body}
                      </div>
                    </div>
                  </Link>
                ))}
              </Section>
            )}

            {!busy && !hasResults && q.trim() && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches for <span className="font-medium text-foreground">{q}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={cn("px-3 pt-2.5 pb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground")}>
        {label}
      </div>
      {children}
    </div>
  );
}
