// Lightweight topic classifier matching the LDA topics found in Group 14's
// study. We use a keyword-weighted scoring model so it runs in-process on
// Vercel with zero ML deps; the LLM agent can override / refine when called.
//
// Tumblr: Natural Scenery · Artistic Expression · Travel Activities · Lifestyle Notes
// Reddit: Travel Planning · Visa & Logistics · Food · Q&A · Trip Reports

export type Platform = "tumblr" | "reddit";

export type TopicScore = { topic: string; score: number };

const TUMBLR_TOPICS: Record<string, string[]> = {
  "Natural Scenery": [
    "mountain", "lake", "ocean", "sunset", "sunrise", "forest", "beach",
    "alpine", "river", "valley", "waterfall", "scenery", "view", "vista",
    "landscape", "trail", "hike", "hiking", "wilderness", "snow", "cloud",
    "stars", "milky way", "fjord", "canyon", "peak", "summit", "meadow",
    "tundra", "glacier", "tide", "shoreline", "horizon",
  ],
  "Artistic Expression": [
    "art", "aesthetic", "vibe", "mood", "moodboard", "film", "polaroid",
    "analog", "color", "palette", "composition", "photography", "photo",
    "shot", "lens", "edit", "edited", "preset", "cinematic", "moody",
    "tones", "muted", "soft", "dreamy", "ethereal", "grain", "portra",
    "kodachrome", "35mm", "minimal",
  ],
  "Travel Activities": [
    "trip", "travel", "tour", "guide", "itinerary", "backpack", "hostel",
    "airport", "flight", "train", "road trip", "rental", "visit", "explore",
    "adventure", "festival", "market", "museum", "cafe", "restaurant",
    "local", "city", "village", "town", "neighborhood", "stay", "weekend",
    "border", "customs", "lodge", "camp",
  ],
  "Lifestyle Notes": [
    "morning", "evening", "slow", "quiet", "solo", "alone", "thinking",
    "journal", "notes", "rest", "wandering", "wander", "feeling", "thought",
    "diary", "tea", "coffee", "rain", "window", "bed", "still",
  ],
};

const REDDIT_TOPICS: Record<string, string[]> = {
  "Travel Planning": [
    "itinerary", "plan", "planning", "route", "tips", "advice", "recommend",
    "should i", "worth it", "best time", "season", "schedule", "days",
    "week", "weeks", "budget", "cost", "save", "deal", "cheap", "compare",
  ],
  "Visa & Logistics": [
    "visa", "passport", "esta", "schengen", "border", "customs", "immigration",
    "embassy", "consulate", "permit", "transit", "stamp", "duration",
    "extend", "overstay", "documents", "insurance", "vaccine", "vaccination",
    "yellow fever", "evisa", "i-94",
  ],
  "Food": [
    "food", "eat", "ate", "restaurant", "cafe", "street food", "dish",
    "meal", "breakfast", "dinner", "lunch", "cuisine", "recipe", "delicious",
    "tasty", "spicy", "sweet", "drink", "coffee", "wine", "beer", "snack",
    "michelin", "hole in the wall",
  ],
  "Q&A": [
    "?", "anyone", "anyone been", "has anyone", "does anyone", "how do",
    "how can", "what is", "what are", "where can", "where to", "why",
    "help", "question", "asking", "advice needed", "tips please",
    "thoughts?",
  ],
  "Trip Reports": [
    "trip report", "tr:", "back from", "just got back", "did", "spent",
    "weeks in", "days in", "diary", "wrap-up", "review", "ama", "writeup",
  ],
};

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9?\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreTopics(
  text: string,
  taxonomy: Record<string, string[]>,
): TopicScore[] {
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  const lower = text.toLowerCase();
  const scores: TopicScore[] = Object.entries(taxonomy).map(([topic, keywords]) => {
    let score = 0;
    for (const kw of keywords) {
      if (kw.includes(" ")) {
        if (lower.includes(kw)) score += 2;
      } else if (tokenSet.has(kw)) {
        score += 1;
      }
    }
    return { topic, score };
  });
  return scores.sort((a, b) => b.score - a.score);
}

export type TopicResult = {
  primary: string;
  weights: Record<string, number>;
  raw: TopicScore[];
  confidence: number;       // 0..1 — sharpness of primary vs runner-up
  secondary?: string;
};

export function classifyTopic(text: string, platform: Platform): TopicResult {
  const tax = platform === "tumblr" ? TUMBLR_TOPICS : REDDIT_TOPICS;
  const raw = scoreTopics(text, tax);
  const total = Math.max(1, raw.reduce((s, r) => s + r.score, 0));
  const weights: Record<string, number> = {};
  for (const r of raw) weights[r.topic] = r.score / total;

  const primary = raw[0]?.score > 0 ? raw[0].topic : Object.keys(tax)[0];
  const secondary = raw[1]?.score > 0 ? raw[1].topic : undefined;
  const confidence =
    raw[0]?.score > 0
      ? (raw[0].score - (raw[1]?.score ?? 0)) / (raw[0].score + (raw[1]?.score ?? 0) + 1)
      : 0;
  return { primary, weights, raw, confidence, secondary };
}

export function topicList(platform: Platform): string[] {
  return Object.keys(platform === "tumblr" ? TUMBLR_TOPICS : REDDIT_TOPICS);
}
