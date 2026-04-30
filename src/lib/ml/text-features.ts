// Deep text features used alongside VADER + topics in the engagement model.
// Everything here is deterministic and dependency-free so it can run inside
// /api/predict on Vercel edge nodes without cold-starting an ML container.

export type Sentence = {
  text: string;
  start: number;
  end: number;
  words: number;
};

const SENSORY_WORDS = new Set([
  "soft", "warm", "cold", "bright", "dim", "gold", "golden", "pale",
  "muted", "quiet", "still", "loud", "sharp", "rough", "smooth", "bitter",
  "sweet", "salt", "salty", "scent", "smell", "taste", "fog", "mist",
  "rain", "snow", "wind", "breeze", "shimmer", "glow", "shadow", "echo",
  "haze", "humid", "crisp", "tide", "ripple", "linen", "wool", "stone",
  "moss", "pine", "amber", "pearl", "smoke", "dust", "earth",
]);

const HOOK_WORDS = new Set([
  "imagine", "what", "ever", "stop", "wait", "listen", "honest", "honestly",
  "look", "story", "secret", "nobody", "everyone", "you", "i'll", "i've",
  "first", "last", "biggest", "tiny", "smallest", "weird", "strange", "wild",
  "this", "here's", "okay", "hot take",
]);

const FILLERS = new Set([
  "really", "very", "just", "actually", "basically", "literally", "kind",
  "kinda", "sort", "sorta", "stuff", "things", "like",
]);

const STRONG_VERBS = new Set([
  "shatter", "drift", "carve", "cradle", "linger", "spill", "tumble",
  "weave", "wander", "echo", "burst", "dissolve", "stretch", "gather",
  "split", "crawl", "ride", "soak", "press", "whisper",
]);

const POWER_NOUNS = new Set([
  "ritual", "memory", "afternoon", "evening", "shoreline", "valley", "ridge",
  "horizon", "promise", "patience", "decade", "summer", "winter", "season",
  "doorway", "village", "harbor", "platform", "passage",
]);

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "for",
  "with", "from", "is", "was", "were", "be", "been", "being", "as", "by",
  "this", "that", "it", "its", "i", "you", "we", "they", "he", "she", "him",
  "her", "them", "my", "your", "our", "their", "so", "if", "then", "than",
  "into", "out", "up", "down", "over", "under", "do", "does", "did", "have",
  "has", "had",
]);

export function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  if (!text) return out;
  const re = /[^.!?\n]+[.!?]?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const seg = m[0].trim();
    if (!seg) continue;
    const start = m.index;
    const end = start + m[0].length;
    out.push({ text: seg, start, end, words: (seg.match(/\S+/g) ?? []).length });
  }
  return out;
}

export type ReadabilityResult = {
  fleschReading: number;       // 0..100, higher = easier
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  gradeLevel: number;          // approx Flesch-Kincaid grade
  band: "easy" | "plain" | "complex";
};

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .match(/[aeiouy]+/g);
  return Math.max(1, groups?.length ?? 1);
}

export function readability(text: string): ReadabilityResult {
  const words = (text.match(/\S+/g) ?? []);
  const sents = splitSentences(text);
  const totalSyllables = words.reduce((s, w) => s + syllables(w), 0);
  const wpc = words.length / Math.max(1, sents.length);
  const spw = totalSyllables / Math.max(1, words.length);
  const flesch = 206.835 - 1.015 * wpc - 84.6 * spw;
  const grade = 0.39 * wpc + 11.8 * spw - 15.59;
  const band: ReadabilityResult["band"] =
    flesch >= 70 ? "easy" : flesch >= 50 ? "plain" : "complex";
  return {
    fleschReading: Math.max(0, Math.min(100, Math.round(flesch * 10) / 10)),
    avgWordsPerSentence: Math.round(wpc * 10) / 10,
    avgSyllablesPerWord: Math.round(spw * 100) / 100,
    gradeLevel: Math.round(grade * 10) / 10,
    band,
  };
}

export type HookResult = {
  text: string;
  score: number;             // 0..1
  reasons: string[];
};

export function hookAnalysis(text: string): HookResult {
  const sents = splitSentences(text);
  const first = sents[0]?.text ?? "";
  const lower = first.toLowerCase();
  const reasons: string[] = [];
  let score = 0.3;

  const wc = (first.match(/\S+/g) ?? []).length;
  if (wc <= 12 && wc >= 4) { score += 0.18; reasons.push("Short, punchy opener"); }
  if (wc > 28) { score -= 0.2; reasons.push("Opener is too long — lose it in the first second"); }

  if (/^[A-Z]/.test(first) === false && first.length > 0) {
    reasons.push("Lowercase opener — Tumblr-friendly cadence");
    score += 0.05;
  }
  if (/[?]/.test(first)) { score += 0.18; reasons.push("Opens with a question — invites a reply"); }
  if (/^(imagine|here'?s|you'?ve|nobody|everyone|stop|wait)/i.test(first)) {
    score += 0.15; reasons.push("Pattern-interrupt opener");
  }
  let hookHits = 0;
  for (const w of lower.split(/\W+/)) if (HOOK_WORDS.has(w)) hookHits++;
  if (hookHits >= 2) { score += 0.1; reasons.push("Multiple hook words"); }

  // Visual concreteness — sensory token in the first 12 words
  const firstWords = lower.split(/\W+/).slice(0, 12);
  let sensoryHits = 0;
  for (const w of firstWords) if (SENSORY_WORDS.has(w)) sensoryHits++;
  if (sensoryHits > 0) { score += 0.1; reasons.push("Sensory image up front"); }

  // Penalize generic openers
  if (/^(so |well |today i |i wanted |hello |hi |hey )/i.test(first)) {
    score -= 0.18; reasons.push("Generic opener — cut it");
  }
  // Caps yelling
  const caps = first.replace(/[^A-Za-z]/g, "");
  if (caps.length > 6 && caps.replace(/[^A-Z]/g, "").length / caps.length > 0.4) {
    score -= 0.15; reasons.push("All-caps opener reads as shouting");
  }

  return {
    text: first,
    score: Math.max(0, Math.min(1, score)),
    reasons,
  };
}

export type SensoryResult = {
  density: number;            // sensory tokens / total tokens
  hits: string[];
  pacing: "tight" | "balanced" | "loose";
  fillerRatio: number;
  strongVerbs: number;
  powerNouns: number;
};

export function sensory(text: string): SensoryResult {
  const tokens = (text.toLowerCase().match(/[a-z']+/g) ?? []);
  const total = Math.max(1, tokens.length);
  const hits: string[] = [];
  let fillers = 0;
  let strong = 0;
  let power = 0;
  for (const t of tokens) {
    if (SENSORY_WORDS.has(t)) hits.push(t);
    if (FILLERS.has(t)) fillers++;
    if (STRONG_VERBS.has(t)) strong++;
    if (POWER_NOUNS.has(t)) power++;
  }
  const density = hits.length / total;
  const fillerRatio = fillers / total;
  const sents = splitSentences(text);
  const avgWPS = total / Math.max(1, sents.length);
  const pacing: SensoryResult["pacing"] =
    avgWPS <= 9 ? "tight" : avgWPS <= 18 ? "balanced" : "loose";
  return { density, hits, pacing, fillerRatio, strongVerbs: strong, powerNouns: power };
}

export type StructureResult = {
  hasQuestion: boolean;
  questionsCount: number;
  exclaimCount: number;
  emojiCount: number;
  hashtagsInline: number;
  uppercaseRatio: number;
  novelty: number;
  sentencesCount: number;
  avgSentenceLength: number;
  longestSentence: number;
  startsWithI: boolean;
};

export function structure(text: string): StructureResult {
  const t = text || "";
  const letters = t.replace(/[^a-zA-Z]/g, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  const words = t.toLowerCase().match(/[a-z]+/g) ?? [];
  const unique = new Set(words);
  const sents = splitSentences(t);
  return {
    hasQuestion: /\?/.test(t),
    questionsCount: (t.match(/\?/g) ?? []).length,
    exclaimCount: (t.match(/!/g) ?? []).length,
    emojiCount: (t.match(/[\p{Extended_Pictographic}]/gu) ?? []).length,
    hashtagsInline: (t.match(/#\w+/g) ?? []).length,
    uppercaseRatio: letters.length === 0 ? 0 : upper / letters.length,
    novelty: words.length === 0 ? 0 : unique.size / words.length,
    sentencesCount: sents.length,
    avgSentenceLength: words.length / Math.max(1, sents.length),
    longestSentence: sents.reduce((m, s) => Math.max(m, s.words), 0),
    startsWithI: /^\s*i\b/i.test(t),
  };
}

export type TagAnalysis = {
  count: number;
  unique: number;
  duplicates: number;
  averageLength: number;
  spammy: number;       // tags > 30 chars or stuffed
  band: "thin" | "balanced" | "stuffed";
};

export function analyzeTags(tags: string[]): TagAnalysis {
  const norm = tags.map((t) => t.replace(/^#/, "").trim().toLowerCase()).filter(Boolean);
  const set = new Set(norm);
  const dup = norm.length - set.size;
  const avgLen = norm.length === 0 ? 0 : norm.reduce((s, t) => s + t.length, 0) / norm.length;
  const spammy = norm.filter((t) => t.length > 30 || /(\w)\1\1/.test(t)).length;
  const band: TagAnalysis["band"] =
    norm.length < 4 ? "thin" : norm.length > 18 ? "stuffed" : "balanced";
  return { count: norm.length, unique: set.size, duplicates: dup, averageLength: avgLen, spammy, band };
}

// Simple voice fingerprint — captures tonal habits we can match in rewrites.
export type VoiceFingerprint = {
  avgSentenceLen: number;
  lowercasePreference: number;  // 0..1
  questionRate: number;
  emojiPerSentence: number;
  topWords: string[];
};

export function voiceFingerprint(samples: string[]): VoiceFingerprint {
  const text = samples.join("\n");
  const sents = splitSentences(text);
  const totalWords = sents.reduce((s, x) => s + x.words, 0);
  const lowerStarts = sents.filter((s) => /^[a-z]/.test(s.text)).length;
  const ques = sents.filter((s) => s.text.includes("?")).length;
  const emos = (text.match(/[\p{Extended_Pictographic}]/gu) ?? []).length;
  const tokens = (text.toLowerCase().match(/[a-z']+/g) ?? [])
    .filter((w) => !STOP.has(w) && w.length > 2);
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  const topWords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map((e) => e[0]);
  return {
    avgSentenceLen: totalWords / Math.max(1, sents.length),
    lowercasePreference: sents.length === 0 ? 0 : lowerStarts / sents.length,
    questionRate: sents.length === 0 ? 0 : ques / sents.length,
    emojiPerSentence: sents.length === 0 ? 0 : emos / sents.length,
    topWords,
  };
}
