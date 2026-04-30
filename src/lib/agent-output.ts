// Parse the agent's structured FINAL block into typed sections so the UI
// can render copy buttons, "Apply to draft", probability gauge, etc.
//
// The system prompt (src/app/api/agent/route.ts) instructs the model to end
// every run with this exact format:
//
//   FINAL DRAFT:
//   <body>
//
//   PROBABILITY: 73%
//
//   CHANGES:
//   - one
//   - two
//
//   TAGS: tag1, tag2
//
// We're strict about the FINAL DRAFT marker and lenient about whitespace.

export type FinalDraft = {
  body: string;
  probability: number | null; // 0..1
  changes: string[];
  tags: string[];
};

export function parseFinalDraft(text: string): FinalDraft | null {
  const idx = text.search(/(^|\n)\s*FINAL\s+DRAFT\s*:/i);
  if (idx === -1) return null;

  const tail = text.slice(idx).replace(/^[\s\S]*?FINAL\s+DRAFT\s*:/i, "").trim();

  // Split off PROBABILITY/CHANGES/TAGS sections.
  const sections = splitSections(tail);

  const body = sections.body.trim();
  const probability = parsePercent(sections.probability);
  const changes = parseList(sections.changes);
  const tags = parseTags(sections.tags);

  return { body, probability, changes, tags };
}

type Sections = {
  body: string;
  probability: string;
  changes: string;
  tags: string;
};

function splitSections(s: string): Sections {
  const out: Sections = { body: "", probability: "", changes: "", tags: "" };
  // Find each marker and slice between them.
  const markers: { key: keyof Sections; re: RegExp }[] = [
    { key: "probability", re: /(^|\n)\s*PROBABILITY\s*:/i },
    { key: "changes", re: /(^|\n)\s*CHANGES\s*:/i },
    { key: "tags", re: /(^|\n)\s*TAGS\s*:/i },
  ];
  // Locate each marker's start (-1 if missing).
  const positions = markers.map((m) => {
    const r = m.re.exec(s);
    return { key: m.key, start: r ? r.index + r[0].length : -1, before: r ? r.index : -1 };
  });
  // Sort by their original position (skipping missing).
  const present = positions.filter((p) => p.start >= 0).sort((a, b) => a.start - b.start);

  // Body is everything up to the first present marker (or all of `s` if none).
  out.body = present.length === 0 ? s : s.slice(0, present[0].before).trim();

  for (let i = 0; i < present.length; i++) {
    const cur = present[i];
    const next = present[i + 1];
    const slice = next ? s.slice(cur.start, next.before) : s.slice(cur.start);
    out[cur.key] = slice.trim();
  }
  return out;
}

function parsePercent(s: string): number | null {
  if (!s) return null;
  const m = s.match(/(-?\d+(?:\.\d+)?)\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n)) / 100;
}

function parseList(s: string): string[] {
  if (!s) return [];
  const lines = s.split("\n");
  const items: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/^[\s•\-*\d.]+\s*/, "").trim();
    if (line) items.push(line);
  }
  return items;
}

function parseTags(s: string): string[] {
  if (!s) return [];
  return s
    .split(/[,\n]/)
    .map((t) => t.replace(/^[#\s•\-*]+|\s+$/g, ""))
    .filter(Boolean);
}
