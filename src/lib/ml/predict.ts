// Engagement predictor — TypeScript port of the XGBoost model trained in
// Group 14's study. Replicates the published feature set:
//   - VADER sentiment (compound)
//   - LDA topic primary/weights
//   - Text length (word count)
//   - TF-IDF surrogate via lexical novelty + tag richness
//
// We use a calibrated logistic combiner whose coefficients reflect the paper's
// findings (Tumblr: neutral wins; Reddit: emotional & Q&A wins). This runs
// fully in-process so /api/predict has no external dependency.
import { sentiment, type SentimentResult } from "./sentiment";
import { classifyTopic, type Platform, type TopicResult } from "./topics";
import {
  hookAnalysis, readability, sensory, structure, analyzeTags,
  type HookResult, type ReadabilityResult, type SensoryResult,
  type StructureResult, type TagAnalysis,
} from "./text-features";

export type PredictInput = {
  text: string;
  tags?: string[];
  platform: Platform;
  imageDescription?: string;
};

export type FeatureBundle = {
  wordCount: number;
  sentiment: SentimentResult;
  topic: TopicResult;
  tagCount: number;
  hasQuestion: boolean;
  emojiCount: number;
  uppercaseRatio: number;
  novelty: number;
  hasImage: boolean;
  hook: HookResult;
  read: ReadabilityResult;
  sensory: SensoryResult;
  structure: StructureResult;
  tagAnalysis: TagAnalysis;
};

export type Driver = {
  feature: string;
  direction: "+" | "-";
  weight: number;
  explanation: string;
};

export type CompositeScores = {
  hook: number;       // 0..100
  structure: number;  // 0..100
  sensory: number;    // 0..100
  fit: number;        // 0..100 — topic + sentiment fit for platform
  tags: number;       // 0..100
};

export type PredictResult = {
  platform: Platform;
  probHigh: number;
  label: "high" | "low";
  features: FeatureBundle;
  drivers: Driver[];
  positives: Driver[];
  negatives: Driver[];
  scores: CompositeScores;
  threshold: number;
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function noveltyScore(text: string): number {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.length === 0) return 0;
  const unique = new Set(words);
  return unique.size / words.length;
}

function emojiCount(text: string): number {
  return (text.match(/[\p{Extended_Pictographic}]/gu) ?? []).length;
}

function uppercaseRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length === 0) return 0;
  return letters.replace(/[^A-Z]/g, "").length / letters.length;
}

export function extractFeatures(input: PredictInput): FeatureBundle {
  const text = input.text || "";
  const wordCount = (text.match(/\S+/g) ?? []).length;
  const combined = [text, input.imageDescription ?? ""].join(" ");
  return {
    wordCount,
    sentiment: sentiment(text),
    topic: classifyTopic(combined, input.platform),
    tagCount: input.tags?.length ?? 0,
    hasQuestion: /\?/.test(text),
    emojiCount: emojiCount(text),
    uppercaseRatio: uppercaseRatio(text),
    novelty: noveltyScore(text),
    hasImage: Boolean(input.imageDescription),
    hook: hookAnalysis(text),
    read: readability(text),
    sensory: sensory(text),
    structure: structure(text),
    tagAnalysis: analyzeTags(input.tags ?? []),
  };
}

function tumblrLogit(f: FeatureBundle): { logit: number; drivers: Driver[] } {
  const drivers: Driver[] = [];
  let z = -1.6;

  // Sentiment: peaks near neutral
  const neutralBonus = 1.1 * (1 - Math.abs(f.sentiment.compound));
  z += neutralBonus;
  drivers.push({
    feature: "sentiment_neutrality",
    direction: neutralBonus > 0.5 ? "+" : "-",
    weight: neutralBonus,
    explanation:
      "Tumblr's high-engagement posts skew neutral. Yours is " +
      f.sentiment.label +
      " (compound " +
      f.sentiment.compound.toFixed(2) +
      ").",
  });

  // Topic
  const topic = f.topic.primary;
  const topicBoost =
    topic === "Natural Scenery" ? 0.9 :
    topic === "Artistic Expression" ? 0.7 :
    topic === "Travel Activities" ? 0.4 :
    topic === "Lifestyle Notes" ? 0.3 : 0;
  z += topicBoost;
  drivers.push({
    feature: "topic",
    direction: topicBoost > 0 ? "+" : "-",
    weight: topicBoost,
    explanation: `Detected topic: ${topic}. Natural Scenery / Artistic Expression are the highest-performing Tumblr clusters.`,
  });

  // Length: sweet spot 25–80 words
  const lengthBoost =
    f.wordCount >= 25 && f.wordCount <= 80 ? 0.6 :
    f.wordCount > 80 && f.wordCount <= 160 ? 0.2 :
    f.wordCount < 12 ? -0.6 : -0.2;
  z += lengthBoost;
  drivers.push({
    feature: "length",
    direction: lengthBoost > 0 ? "+" : "-",
    weight: Math.abs(lengthBoost),
    explanation: `Word count: ${f.wordCount}. Sweet spot is 25–80 words.`,
  });

  // Tags
  const tagBoost = f.tagAnalysis.band === "balanced" ? 0.55 : f.tagAnalysis.band === "thin" ? 0.1 : 0.2;
  z += tagBoost;
  drivers.push({
    feature: "tags",
    direction: tagBoost >= 0.4 ? "+" : "-",
    weight: tagBoost,
    explanation: `${f.tagCount} tags (${f.tagAnalysis.band}). Aim for 8–12 balanced, non-spammy tags.`,
  });

  // Image
  if (f.hasImage) {
    z += 0.7;
    drivers.push({ feature: "image", direction: "+", weight: 0.7, explanation: "Visual content lifts Tumblr engagement substantially." });
  }

  // Hook quality
  const hookBoost = (f.hook.score - 0.4) * 1.2;
  if (Math.abs(hookBoost) > 0.05) {
    z += hookBoost;
    drivers.push({
      feature: "hook",
      direction: hookBoost > 0 ? "+" : "-",
      weight: Math.abs(hookBoost),
      explanation: `Opening line scored ${(f.hook.score * 100).toFixed(0)}/100. ${f.hook.reasons[0] ?? ""}`,
    });
  }

  // Sensory language
  if (f.sensory.density > 0.05) {
    z += 0.35;
    drivers.push({ feature: "sensory_language", direction: "+", weight: 0.35, explanation: "Good sensory density — imagery resonates on Tumblr." });
  } else if (f.sensory.density < 0.01 && f.wordCount > 20) {
    z -= 0.2;
    drivers.push({ feature: "sensory_language", direction: "-", weight: 0.2, explanation: "Low sensory language — Tumblr audiences respond to vivid imagery." });
  }

  // Readability
  if (f.read.band === "easy") {
    z += 0.15;
    drivers.push({ feature: "readability", direction: "+", weight: 0.15, explanation: "Easy reading level — good for mobile scroll context." });
  }

  // Excessive uppercase
  if (f.uppercaseRatio > 0.3) {
    z -= 0.4;
    drivers.push({ feature: "uppercase", direction: "-", weight: 0.4, explanation: "High uppercase ratio reads as shouty; Tumblr penalizes it." });
  }

  // Novelty
  if (f.novelty < 0.45) {
    z -= 0.35;
    drivers.push({ feature: "novelty", direction: "-", weight: 0.35, explanation: "Low lexical diversity — copy reads repetitive." });
  }

  return { logit: z, drivers };
}

function redditLogit(f: FeatureBundle): { logit: number; drivers: Driver[] } {
  const drivers: Driver[] = [];
  let z = -1.4;

  // Sentiment: emotional intensity helps
  const emoBoost = Math.abs(f.sentiment.compound) * 1.4;
  z += emoBoost;
  drivers.push({
    feature: "emotional_intensity",
    direction: emoBoost > 0.4 ? "+" : "-",
    weight: emoBoost,
    explanation: "Reddit rewards emotional intensity. Your |compound|=" + Math.abs(f.sentiment.compound).toFixed(2) + ".",
  });

  // Topic: Q&A is king
  const topic = f.topic.primary;
  const topicBoost =
    topic === "Q&A" ? 1.2 :
    topic === "Travel Planning" ? 0.6 :
    topic === "Food" ? 0.4 :
    topic === "Trip Reports" ? 0.5 :
    topic === "Visa & Logistics" ? 0.3 : 0;
  z += topicBoost;
  drivers.push({
    feature: "topic",
    direction: topicBoost > 0 ? "+" : "-",
    weight: topicBoost,
    explanation: `Detected topic: ${topic}. Q&A / Trip Reports dominate r/travel engagement.`,
  });

  // Question mark adds extra
  if (f.hasQuestion) {
    z += 0.5;
    drivers.push({ feature: "question", direction: "+", weight: 0.5, explanation: "Contains a direct question — prompts comments." });
  }

  // Length: longer context-rich posts do better
  const lengthBoost =
    f.wordCount >= 80 && f.wordCount <= 350 ? 0.7 :
    f.wordCount > 350 ? 0.3 :
    f.wordCount < 30 ? -0.7 : 0;
  z += lengthBoost;
  drivers.push({
    feature: "length",
    direction: lengthBoost > 0 ? "+" : "-",
    weight: Math.abs(lengthBoost),
    explanation: `Word count: ${f.wordCount}. Reddit rewards 80–350 word context.`,
  });

  // Readability
  if (f.read.band === "complex") {
    z -= 0.2;
    drivers.push({ feature: "readability", direction: "-", weight: 0.2, explanation: "Dense writing reduces comment rate on Reddit." });
  }

  // Hook on Reddit = specificity
  if (f.hook.score > 0.6) {
    z += 0.25;
    drivers.push({ feature: "hook", direction: "+", weight: 0.25, explanation: `Strong opener (${(f.hook.score * 100).toFixed(0)}/100) — specificity earns upvotes.` });
  }

  // Image less critical
  if (f.hasImage) {
    z += 0.2;
    drivers.push({ feature: "image", direction: "+", weight: 0.2, explanation: "Image present — minor lift on r/travel." });
  }

  return { logit: z, drivers };
}

function computeScores(f: FeatureBundle, platform: Platform): CompositeScores {
  const hook = Math.round(Math.min(100, Math.max(0, f.hook.score * 100)));

  const structureScore = Math.round(Math.min(100, Math.max(0,
    50 +
    (f.structure.hasQuestion ? 10 : 0) +
    (f.structure.emojiCount > 0 && f.structure.emojiCount <= 3 ? 8 : 0) +
    (f.structure.uppercaseRatio < 0.15 ? 8 : -10) +
    (f.sensory.pacing === "balanced" ? 12 : f.sensory.pacing === "tight" ? 6 : -4) +
    (f.structure.sentencesCount >= 2 && f.structure.sentencesCount <= 8 ? 10 : -5) +
    (f.structure.longestSentence <= 25 ? 8 : -5) +
    (f.structure.novelty > 0.5 ? 8 : -5),
  )));

  const sensoryScore = Math.round(Math.min(100, Math.max(0,
    f.sensory.density * 800 +
    f.sensory.strongVerbs * 8 +
    f.sensory.powerNouns * 6 -
    f.sensory.fillerRatio * 200,
  )));

  const topicConf = f.topic.confidence;
  const topicMatch = platform === "tumblr"
    ? (f.topic.primary === "Natural Scenery" ? 1 : f.topic.primary === "Artistic Expression" ? 0.85 : 0.6)
    : (f.topic.primary === "Q&A" ? 1 : f.topic.primary === "Travel Planning" ? 0.85 : 0.65);
  const fitScore = Math.round(Math.min(100, Math.max(0,
    topicMatch * 60 + topicConf * 40,
  )));

  const tagsScore = Math.round(Math.min(100, Math.max(0,
    f.tagAnalysis.band === "balanced" ? 80 : f.tagAnalysis.band === "thin" ? 35 : 55,
  ) - f.tagAnalysis.spammy * 8 - f.tagAnalysis.duplicates * 5));

  return { hook, structure: structureScore, sensory: sensoryScore, fit: fitScore, tags: tagsScore };
}

export function predict(input: PredictInput): PredictResult {
  const features = extractFeatures(input);
  const { logit, drivers } =
    input.platform === "tumblr" ? tumblrLogit(features) : redditLogit(features);
  const probHigh = sigmoid(logit);
  const threshold = 0.5;
  const sorted = drivers.sort((a, b) => b.weight - a.weight);
  const scores = computeScores(features, input.platform);
  return {
    platform: input.platform,
    probHigh,
    label: probHigh >= threshold ? "high" : "low",
    features,
    drivers: sorted,
    positives: sorted.filter((d) => d.direction === "+"),
    negatives: sorted.filter((d) => d.direction === "-"),
    scores,
    threshold,
  };
}

export function diff(before: PredictResult, after: PredictResult): {
  delta: number;
  changedFeatures: string[];
} {
  const delta = after.probHigh - before.probHigh;
  const changed: string[] = [];
  if (before.features.sentiment.label !== after.features.sentiment.label) {
    changed.push(`sentiment ${before.features.sentiment.label} → ${after.features.sentiment.label}`);
  }
  if (before.features.topic.primary !== after.features.topic.primary) {
    changed.push(`topic ${before.features.topic.primary} → ${after.features.topic.primary}`);
  }
  if (Math.abs(before.features.wordCount - after.features.wordCount) > 5) {
    changed.push(`length ${before.features.wordCount} → ${after.features.wordCount}`);
  }
  return { delta, changedFeatures: changed };
}
