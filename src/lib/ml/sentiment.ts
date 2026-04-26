// VADER sentiment via the official-style port — returns compound score [-1..1].
// We wrap the vader-sentiment npm package to give a typed, stable interface.
import vader from "vader-sentiment";

export type SentimentResult = {
  compound: number;
  pos: number;
  neu: number;
  neg: number;
  label: "positive" | "neutral" | "negative";
};

export function sentiment(text: string): SentimentResult {
  const s = (vader as unknown as {
    SentimentIntensityAnalyzer: {
      polarity_scores: (t: string) => {
        compound: number;
        pos: number;
        neu: number;
        neg: number;
      };
    };
  }).SentimentIntensityAnalyzer.polarity_scores(text || "");

  const label: SentimentResult["label"] =
    s.compound >= 0.05 ? "positive" : s.compound <= -0.05 ? "negative" : "neutral";

  return { compound: s.compound, pos: s.pos, neu: s.neu, neg: s.neg, label };
}
