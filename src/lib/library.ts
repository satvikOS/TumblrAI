// Reference library of high-engagement posts used by /api/similar.
// Hand-curated to match the topic clusters identified in Group 14's study.
import type { Platform } from "./ml/topics";

export type LibraryPost = {
  id: string;
  platform: Platform;
  text: string;
  tags: string[];
  noteCount: number;
  topic: string;
  sentimentLabel: "positive" | "neutral" | "negative";
};

export const LIBRARY: LibraryPost[] = [
  {
    id: "lib_t1",
    platform: "tumblr",
    text:
      "fog peeling off the lake at first light. the trail behind us, the mountain ahead. nothing posed.",
    tags: ["nature", "fog", "alpine", "morning", "scenery", "minimal"],
    noteCount: 8421,
    topic: "Natural Scenery",
    sentimentLabel: "neutral",
  },
  {
    id: "lib_t2",
    platform: "tumblr",
    text:
      "muted tones from a roll of portra. soft greens, pale water, that feeling of september.",
    tags: ["film", "portra", "aesthetic", "analog", "muted", "september"],
    noteCount: 6210,
    topic: "Artistic Expression",
    sentimentLabel: "neutral",
  },
  {
    id: "lib_t3",
    platform: "tumblr",
    text:
      "a slow morning in the village. bread, coffee, no plans. travel doesn't have to be loud.",
    tags: ["travel", "slow", "village", "morning", "coffee", "quiet"],
    noteCount: 5130,
    topic: "Travel Activities",
    sentimentLabel: "neutral",
  },
  {
    id: "lib_t4",
    platform: "tumblr",
    text:
      "rain on the window, a cup of something warm, and the city lights bleeding into the dark.",
    tags: ["aesthetic", "rain", "city", "night", "moody", "soft"],
    noteCount: 4980,
    topic: "Artistic Expression",
    sentimentLabel: "neutral",
  },
  {
    id: "lib_t5",
    platform: "tumblr",
    text:
      "the canyon held the sunset for a full hour. nothing else to say.",
    tags: ["canyon", "sunset", "scenery", "nature", "minimal", "travel"],
    noteCount: 7340,
    topic: "Natural Scenery",
    sentimentLabel: "neutral",
  },
  {
    id: "lib_r1",
    platform: "reddit",
    text:
      "Two weeks in Japan in October — Tokyo, Tohoku, back to Tokyo. Has anyone done northern Honshu in autumn without renting a car? Trying to choose between Aomori and Akita as the anchor.",
    tags: ["japan", "october", "tohoku"],
    noteCount: 1840,
    topic: "Q&A",
    sentimentLabel: "neutral",
  },
  {
    id: "lib_r2",
    platform: "reddit",
    text:
      "Schengen 90/180 question — flew into Madrid Aug 1, left Sep 5, want to come back Nov 15. How is the rolling window calculated for partial months?",
    tags: ["schengen", "visa", "europe"],
    noteCount: 1320,
    topic: "Visa & Logistics",
    sentimentLabel: "neutral",
  },
  {
    id: "lib_r3",
    platform: "reddit",
    text:
      "Best street food experience of my life in Oaxaca last week. Mole negro that tasted like the entire history of a place. Can't recommend it enough.",
    tags: ["mexico", "oaxaca", "food"],
    noteCount: 2210,
    topic: "Food",
    sentimentLabel: "positive",
  },
  {
    id: "lib_r4",
    platform: "reddit",
    text:
      "Solo trip to Patagonia next March, 18 days. Is it crazy to do W trek + Fitz Roy back-to-back without a buffer day? Looking for honest answers from people who've done it.",
    tags: ["patagonia", "trekking", "solo"],
    noteCount: 1610,
    topic: "Q&A",
    sentimentLabel: "neutral",
  },
  {
    id: "lib_r5",
    platform: "reddit",
    text:
      "Spent 5 days in Tbilisi on a tight budget — wine, sulphur baths, and the most underrated old town in Europe. Happy to answer questions.",
    tags: ["georgia", "tbilisi", "budget"],
    noteCount: 1980,
    topic: "Travel Planning",
    sentimentLabel: "positive",
  },
];

export function tokens(s: string): Set<string> {
  return new Set(
    (s || "").toLowerCase().match(/[a-z]+/g)?.filter((w) => w.length > 2) ?? [],
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function findSimilar(
  query: string,
  platform: Platform,
  k: number = 5,
): LibraryPost[] {
  const qTokens = tokens(query);
  return LIBRARY.filter((l) => l.platform === platform)
    .map((l) => ({ post: l, score: jaccard(qTokens, tokens(l.text + " " + l.tags.join(" "))) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.post);
}
