// Synthetic trends snapshot — what /api/trends serves until you wire a real
// scraping pipeline. Numbers are stable per day so the dashboard feels alive.
import type { Platform } from "./ml/topics";

export type TrendingTag = {
  tag: string;
  posts: number;
  avgEngagement: number;
  weekChange: number;
  sentimentMix: { pos: number; neu: number; neg: number };
};

export type TrendingTopic = {
  topic: string;
  share: number;
  avgEngagement: number;
  trajectory: "rising" | "steady" | "falling";
};

const TUMBLR_TAGS: TrendingTag[] = [
  { tag: "alpine", posts: 4280, avgEngagement: 612, weekChange: 0.18, sentimentMix: { pos: 0.31, neu: 0.61, neg: 0.08 } },
  { tag: "film photography", posts: 9810, avgEngagement: 540, weekChange: 0.07, sentimentMix: { pos: 0.28, neu: 0.66, neg: 0.06 } },
  { tag: "moody", posts: 6720, avgEngagement: 488, weekChange: 0.12, sentimentMix: { pos: 0.18, neu: 0.7, neg: 0.12 } },
  { tag: "slow travel", posts: 3140, avgEngagement: 462, weekChange: 0.22, sentimentMix: { pos: 0.4, neu: 0.55, neg: 0.05 } },
  { tag: "minimalism", posts: 5020, avgEngagement: 420, weekChange: 0.04, sentimentMix: { pos: 0.32, neu: 0.62, neg: 0.06 } },
  { tag: "fog", posts: 2890, avgEngagement: 510, weekChange: 0.14, sentimentMix: { pos: 0.22, neu: 0.7, neg: 0.08 } },
  { tag: "coastal", posts: 3580, avgEngagement: 446, weekChange: -0.03, sentimentMix: { pos: 0.36, neu: 0.58, neg: 0.06 } },
  { tag: "japan", posts: 8120, avgEngagement: 502, weekChange: 0.09, sentimentMix: { pos: 0.39, neu: 0.55, neg: 0.06 } },
];

const REDDIT_TAGS: TrendingTag[] = [
  { tag: "patagonia", posts: 220, avgEngagement: 1820, weekChange: 0.31, sentimentMix: { pos: 0.42, neu: 0.5, neg: 0.08 } },
  { tag: "schengen", posts: 540, avgEngagement: 1410, weekChange: 0.04, sentimentMix: { pos: 0.18, neu: 0.62, neg: 0.2 } },
  { tag: "japan", posts: 980, avgEngagement: 1680, weekChange: 0.12, sentimentMix: { pos: 0.5, neu: 0.45, neg: 0.05 } },
  { tag: "solo travel", posts: 410, avgEngagement: 1390, weekChange: 0.16, sentimentMix: { pos: 0.46, neu: 0.45, neg: 0.09 } },
  { tag: "budget", posts: 720, avgEngagement: 1240, weekChange: -0.02, sentimentMix: { pos: 0.34, neu: 0.55, neg: 0.11 } },
];

const TUMBLR_TOPICS: TrendingTopic[] = [
  { topic: "Natural Scenery", share: 0.42, avgEngagement: 612, trajectory: "rising" },
  { topic: "Artistic Expression", share: 0.31, avgEngagement: 502, trajectory: "steady" },
  { topic: "Travel Activities", share: 0.27, avgEngagement: 421, trajectory: "steady" },
];

const REDDIT_TOPICS: TrendingTopic[] = [
  { topic: "Q&A", share: 0.38, avgEngagement: 1820, trajectory: "rising" },
  { topic: "Travel Planning", share: 0.32, avgEngagement: 1390, trajectory: "steady" },
  { topic: "Visa & Logistics", share: 0.18, avgEngagement: 1240, trajectory: "falling" },
  { topic: "Food", share: 0.12, avgEngagement: 1480, trajectory: "rising" },
];

export function trendingTags(platform: Platform): TrendingTag[] {
  return platform === "tumblr" ? TUMBLR_TAGS : REDDIT_TAGS;
}

export function trendingTopics(platform: Platform): TrendingTopic[] {
  return platform === "tumblr" ? TUMBLR_TOPICS : REDDIT_TOPICS;
}

export function engagementSeries(platform: Platform): { date: string; value: number }[] {
  // Deterministic 14-day series — feels alive without RNG noise on each request.
  const base = platform === "tumblr" ? 480 : 1300;
  const out: { date: string; value: number }[] = [];
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const day = d.getUTCDay();
    const wave = Math.sin((i / 13) * Math.PI * 2) * 60;
    const weekend = day === 0 || day === 6 ? 80 : 0;
    out.push({
      date: d.toISOString().slice(0, 10),
      value: Math.round(base + wave + weekend + (i * 7) % 40),
    });
  }
  return out;
}
