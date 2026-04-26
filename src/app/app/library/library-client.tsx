"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlatformToggle } from "@/components/platform-toggle";
import { formatNumber } from "@/lib/utils";

type LibItem = {
  id: string;
  platform: "tumblr" | "reddit";
  text: string;
  tags: string[];
  noteCount: number;
  topic: string;
  sentimentLabel: "positive" | "neutral" | "negative";
};

export function LibraryClient() {
  const [platform, setPlatform] = useState<"tumblr" | "reddit">("tumblr");
  const [items, setItems] = useState<LibItem[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch(`/api/library?platform=${platform}`)
      .then((r) => r.json())
      .then((j: { items: LibItem[] }) => setItems(j.items));
  }, [platform]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return items.filter(
      (i) =>
        !ql ||
        i.text.toLowerCase().includes(ql) ||
        i.tags.some((t) => t.includes(ql)) ||
        i.topic.toLowerCase().includes(ql),
    );
  }, [items, q]);

  return (
    <div>
      <PageHeader
        title="Reference library"
        description="Top-decile posts you can study, riff on, or pull tags from."
        actions={<PlatformToggle value={platform} onChange={setPlatform} />}
      />

      <div className="px-8 py-6">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search by text, tag, or topic"
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-8 pb-12 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((i, idx) => (
          <motion.div
            key={i.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="capitalize">{i.topic}</Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    {formatNumber(i.noteCount)} {i.platform === "tumblr" ? "notes" : "score"}
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{i.text}</p>
                <div className="mt-auto flex flex-wrap gap-1">
                  {i.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      #{t}
                    </Badge>
                  ))}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {i.sentimentLabel} sentiment
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full grid place-items-center py-16 text-sm text-muted-foreground">
            No matches.
          </div>
        )}
      </div>
    </div>
  );
}
