// Higher-order insight functions that compose the predictor + library + trends
// into product-grade signals: voice fingerprint, content gap, posting heatmap,
// viral risk, and audience overlap. All deterministic / in-process.

import { predict, type PredictResult } from "./predict";
import { voiceFingerprint, type VoiceFingerprint } from "./text-features";
import type { Platform } from "./topics";
import { LIBRARY } from "../library";
import { trendingTags, trendingTopics } from "../trends";

export type ContentGap = {
  topic: string;
  reason: string;
  trajectory: "rising" | "steady" | "falling";
  avgEngagement: number;
  yourCoverage: number;          // 0..1 — share of your published drafts on this topic
  tagsToTry: string[];
};

export function findContentGaps(
  myDrafts: { text: string; tags: string[]; platform: Platform; state?: string }[],
  platform: Platform,
): ContentGap[] {
  const topics = trendingTopics(platform);
  const tags = trendingTags(platform);
  const mine = myDrafts.filter((d) => d.platform === platform);

  // Coverage by topic via predictor
  const coverage: Record<string, number> = {};
  for (const d of mine) {
    const r = predict({ text: d.text, tags: d.tags, platform });
    coverage[r.features.topic.primary] = (coverage[r.features.topic.primary] ?? 0) + 1;
  }
  const totalMine = Math.max(1, mine.length);

  return topics.map((t) => {
    const yourCoverage = (coverage[t.topic] ?? 0) / totalMine;
    const tagsToTry = tags
      .filter((tag) =>
        tag.tag.length < 24 &&
        (t.topic.toLowerCase().includes("scen") ? ["alpine","fog","coastal","japan","minimalism"].includes(tag.tag) :
         t.topic.toLowerCase().includes("art") ? ["film photography","moody","minimalism"].includes(tag.tag) :
         t.topic.toLowerCase().includes("travel") ? ["slow travel","japan","coastal"].includes(tag.tag) :
         true))
      .slice(0, 4)
      .map((x) => x.tag);

    const reason =
      yourCoverage < 0.1 && t.trajectory === "rising"
        ? `You're under-published in this rising cluster.`
        : yourCoverage < 0.2 && t.avgEngagement > 500
        ? `High-payoff cluster you've barely touched.`
        : t.trajectory === "falling"
        ? `Saturated — write only with a fresh angle.`
        : `On-trend, even coverage.`;
    return {
      topic: t.topic,
      reason,
      trajectory: t.trajectory,
      avgEngagement: t.avgEngagement,
      yourCoverage,
      tagsToTry,
    };
  })
    .sort((a, b) => {
      const score = (g: ContentGap) =>
        (g.trajectory === "rising" ? 2 : g.trajectory === "steady" ? 1 : 0) +
        (g.yourCoverage < 0.15 ? 1.5 : 0) +
        g.avgEngagement / 1000;
      return score(b) - score(a);
    });
}

export type PostingTimeCell = { day: number; hour: number; score: number };
export type PostingHeatmap = {
  platform: Platform;
  cells: PostingTimeCell[];
  best: { day: string; hour: string; rationale: string };
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function postingHeatmap(platform: Platform, topic?: string): PostingHeatmap {
  const cells: PostingTimeCell[] = [];
  let best: PostingTimeCell = { day: 0, hour: 0, score: 0 };

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      let s = 0.5;

      if (platform === "tumblr") {
        // Tumblr peaks late evening locally, mid-week strongest
        s += Math.max(0, Math.sin(((h - 21) / 24) * Math.PI * 2)) * 0.3;
        s += d >= 1 && d <= 3 ? 0.18 : 0;
        if (h >= 2 && h <= 6) s -= 0.15; // dead zone
      } else {
        // Reddit r/travel: weekday lunch ET + Sunday evenings
        s += Math.max(0, Math.cos(((h - 13) / 24) * Math.PI * 2)) * 0.22;
        s += d === 0 && h >= 18 && h <= 22 ? 0.25 : 0;
        s += d >= 2 && d <= 4 && h >= 12 && h <= 14 ? 0.2 : 0;
        if (topic === "Q&A") s += d === 0 ? 0.1 : 0;
        if (topic === "Trip Reports") s += d === 6 && h >= 10 && h <= 14 ? 0.18 : 0;
      }
      s = Math.max(0, Math.min(1, s));
      cells.push({ day: d, hour: h, score: s });
      if (s > best.score) best = { day: d, hour: h, score: s };
    }
  }
  return {
    platform,
    cells,
    best: {
      day: DAYS[best.day],
      hour: `${String(best.hour).padStart(2, "0")}:00`,
      rationale:
        platform === "tumblr"
          ? "Tumblr's late-evening, midweek surge gives reblog distance through Friday."
          : "r/travel's weekday lunch + Sunday evening windows have the highest comment rate.",
    },
  };
}

export type ViralRisk = {
  potential: number;        // 0..1
  consistency: number;      // 0..1 — how repeatable
  callout: string;
};

export function viralRisk(prediction: PredictResult): ViralRisk {
  const potential =
    Math.min(1,
      prediction.probHigh * 0.6 +
      Math.min(1, prediction.scores.hook / 100) * 0.2 +
      Math.min(1, prediction.scores.sensory / 100) * 0.1 +
      (prediction.features.topic.confidence) * 0.1,
    );
  // Consistency = how stable the draft is to small perturbations
  const consistency =
    1 -
    Math.min(1,
      Math.abs(prediction.features.sentiment.compound) * 0.3 +
      (prediction.features.structure.uppercaseRatio > 0.3 ? 0.3 : 0) +
      (prediction.features.structure.longestSentence > 35 ? 0.2 : 0) +
      Math.min(0.3, prediction.features.sensory.fillerRatio * 4),
    );
  let callout = "Strong, stable draft.";
  if (potential > 0.7 && consistency > 0.7) callout = "High ceiling, stable floor — ship it.";
  else if (potential > 0.7 && consistency < 0.5) callout = "Big-swing draft. Either lands or falls flat — keep an A/B variant.";
  else if (potential < 0.5 && consistency > 0.7) callout = "Safe, consistent — won't break out. Add a stronger hook.";
  else callout = "Mixed signal — improve the weakest driver before publishing.";
  return { potential, consistency, callout };
}

export type VoiceMatch = {
  fingerprint: VoiceFingerprint;
  matchScore: number;       // 0..1 against draft
};

export function voiceMatch(samples: string[], draft: string): VoiceMatch {
  const fp = voiceFingerprint(samples);
  const dfp = voiceFingerprint([draft]);
  const sentDiff = Math.abs(fp.avgSentenceLen - dfp.avgSentenceLen) / 20;
  const lcDiff = Math.abs(fp.lowercasePreference - dfp.lowercasePreference);
  const qDiff = Math.abs(fp.questionRate - dfp.questionRate);
  const matchScore = Math.max(0, 1 - (sentDiff * 0.5 + lcDiff * 0.3 + qDiff * 0.2));
  return { fingerprint: fp, matchScore };
}

// Cross-platform translation — turns a Tumblr post into a Reddit-ready Q&A and
// vice versa. Pure heuristic transformation (the LLM can refine later via a
// rewrite tool, but this is the deterministic baseline).
export function translatePost(text: string, from: Platform, to: Platform): string {
  if (from === to) return text;
  const trimmed = text.trim();
  if (to === "reddit") {
    // Tumblr → Reddit: capitalize, expand into context + question
    const cap = trimmed.replace(/^./, (c) => c.toUpperCase());
    return `${cap}\n\nContext: a few notes on the trip — what surprised me, what I'd cut, what I'd add. \n\nWhat would you change about a route like this? Have you done something similar?`;
  }
  // Reddit → Tumblr: distill to sensory beats
  const lines = trimmed.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const distilled = lines
    .filter((l) => !/^(edit|tl;dr|update)/i.test(l))
    .slice(0, 2)
    .join(" ")
    .toLowerCase()
    .replace(/[?!]+/g, ".")
    .slice(0, 220);
  return distilled || trimmed;
}

// Multi-armed comparison of a draft across N variants — used by the agent
// "post pack" tool to recommend the best one with reasoning.
export type VariantScore = {
  variant: string;
  prediction: PredictResult;
  rank: number;
  reasonToPick: string;
};

export function rankVariants(
  variants: string[],
  platform: Platform,
  tags: string[] = [],
): VariantScore[] {
  const scored = variants.map((text) => ({
    text,
    pred: predict({ text, tags, platform }),
  }));
  scored.sort((a, b) => b.pred.probHigh - a.pred.probHigh);
  return scored.map((s, i) => ({
    variant: s.text,
    prediction: s.pred,
    rank: i + 1,
    reasonToPick:
      i === 0
        ? `Top score (${(s.pred.probHigh * 100).toFixed(0)}%). Strongest on ${s.pred.positives[0]?.feature.replace(/_/g, " ") ?? "fit"}.`
        : `Tradeoff: ${s.pred.scores.hook >= scored[0].pred.scores.hook ? "stronger hook" : "weaker hook"}, ${s.pred.scores.fit >= scored[0].pred.scores.fit ? "stronger fit" : "weaker fit"}.`,
  }));
}

// Reference best matches (top-decile posts) the draft is closest to,
// returning a structural takeaway ("emulate this beat") for each.
export function studyMatches(text: string, platform: Platform, k = 3): { id: string; text: string; tags: string[]; takeaway: string }[] {
  const lower = text.toLowerCase();
  const ranked = LIBRARY
    .filter((l) => l.platform === platform)
    .map((l) => {
      const tokens = (l.text.toLowerCase().match(/[a-z']+/g) ?? []);
      const overlap = tokens.filter((t) => lower.includes(t)).length / Math.max(1, tokens.length);
      return { l, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, k);
  return ranked.map(({ l }) => ({
    id: l.id,
    text: l.text,
    tags: l.tags,
    takeaway:
      platform === "tumblr"
        ? "Sensory image opens, no editorializing — let the place do the work."
        : "Specific scenario + honest stake + a question that invites comparison.",
  }));
}
