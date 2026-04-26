// In-memory data store. Survives within a single serverless instance and is
// reseeded on cold start. Swap with Drizzle/Postgres later by re-implementing
// the same interface in a `db.ts` module.
import { newId } from "./auth";
import type { Platform } from "./ml/topics";

export type DraftState = "draft" | "scheduled" | "published";

export type Draft = {
  id: string;
  userId: string;
  platform: Platform;
  title?: string;
  text: string;
  tags: string[];
  imageUrl?: string;
  imageDescription?: string;
  state: DraftState;
  predictedProb?: number;
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AgentRun = {
  id: string;
  userId: string;
  draftId?: string;
  steps: AgentStep[];
  finalProb?: number;
  startProb?: number;
  status: "running" | "done" | "error";
  createdAt: string;
};

export type AgentStep =
  | { type: "thought"; content: string }
  | { type: "tool_call"; name: string; args: unknown; id: string }
  | { type: "tool_result"; id: string; result: unknown }
  | { type: "rewrite"; before: string; after: string; rationale: string }
  | { type: "final"; text: string; tags: string[]; prob: number };

type Store = {
  drafts: Map<string, Draft>;
  runs: Map<string, AgentRun>;
};

declare global {
  var __nc_store: Store | undefined;
}

const g = globalThis as unknown as { __nc_store?: Store };

if (!g.__nc_store) {
  g.__nc_store = { drafts: new Map(), runs: new Map() };
  seed(g.__nc_store);
}

const store: Store = g.__nc_store!;

function seed(s: Store) {
  const now = Date.now();
  const samples: Omit<Draft, "id" | "createdAt" | "updatedAt">[] = [
    {
      userId: "u_satvik",
      platform: "tumblr",
      title: "Hidden alpine lake at sunrise",
      text:
        "Hidden alpine lake at sunrise after a long hike. The view was absolutely worth every step. Soft fog over still water, no one else here.",
      tags: ["travel", "alpine", "sunrise", "hiking", "nature", "scenery"],
      state: "published",
      predictedProb: 0.82,
      publishedAt: new Date(now - 86400000 * 3).toISOString(),
    },
    {
      userId: "u_satvik",
      platform: "tumblr",
      text:
        "muted morning tones, the kind of quiet you can hear. nothing to add — just the river and the fog.",
      tags: ["aesthetic", "moody", "film", "morning"],
      state: "published",
      predictedProb: 0.74,
      publishedAt: new Date(now - 86400000 * 9).toISOString(),
    },
    {
      userId: "u_satvik",
      platform: "reddit",
      title: "Two weeks in northern Japan in October — itinerary check?",
      text:
        "Planning two weeks across Tohoku in mid-October for autumn colors. Tokyo in/out, train pass, no rental car. Anyone done a similar route? Looking for honest tradeoffs between Aomori vs Akita and whether two days in Yamagata is worth it.",
      tags: ["japan", "tohoku", "itinerary"],
      state: "draft",
      predictedProb: 0.71,
    },
  ];

  for (const d of samples) {
    const id = newId("draft");
    const t = new Date(now).toISOString();
    s.drafts.set(id, { ...d, id, createdAt: t, updatedAt: t });
  }
}

export const drafts = {
  list(userId: string): Draft[] {
    return [...store.drafts.values()]
      .filter((d) => d.userId === userId)
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  },
  get(id: string): Draft | undefined {
    return store.drafts.get(id);
  },
  create(input: Omit<Draft, "id" | "createdAt" | "updatedAt">): Draft {
    const id = newId("draft");
    const t = new Date().toISOString();
    const d = { ...input, id, createdAt: t, updatedAt: t };
    store.drafts.set(id, d);
    return d;
  },
  update(id: string, patch: Partial<Draft>): Draft | undefined {
    const cur = store.drafts.get(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    store.drafts.set(id, next);
    return next;
  },
  delete(id: string): boolean {
    return store.drafts.delete(id);
  },
};

export const runs = {
  list(userId: string): AgentRun[] {
    return [...store.runs.values()]
      .filter((r) => r.userId === userId)
      .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  },
  get(id: string): AgentRun | undefined {
    return store.runs.get(id);
  },
  create(input: Omit<AgentRun, "id" | "createdAt">): AgentRun {
    const id = newId("run");
    const r = { ...input, id, createdAt: new Date().toISOString() };
    store.runs.set(id, r);
    return r;
  },
  update(id: string, patch: Partial<AgentRun>): AgentRun | undefined {
    const cur = store.runs.get(id);
    if (!cur) return undefined;
    const next = { ...cur, ...patch };
    store.runs.set(id, next);
    return next;
  },
};
