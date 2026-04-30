import { tool } from "ai";
import { z } from "zod";
import { predict } from "@/lib/ml/predict";
import { findSimilar, type LibraryPost } from "@/lib/library";
import { trendingTags, trendingTopics } from "@/lib/trends";
import type { Platform } from "@/lib/ml/topics";
import { generateImage } from "./image";
import { findContentGaps, postingHeatmap, viralRisk, translatePost, rankVariants } from "@/lib/ml/insights";
import { hookAnalysis } from "@/lib/ml/text-features";

// gpt-5-nano (and other newer OpenAI models) enforce STRICT schemas: every
// property in `properties` must also appear in `required`. Use .nullable()
// for optional inputs so the property is required-but-allowed-to-be-null,
// and .default() so the model is told what value to send when it doesn't
// have a strong opinion.
const PlatformZ = z.enum(["tumblr", "reddit"]);

export const tools = {
  predict_engagement: tool({
    description:
      "Predict probability that a post achieves high engagement. Returns prob (0-1), label (high/low), all features, and ranked drivers explaining the score.",
    parameters: z.object({
      text: z.string().min(1).describe("The post body."),
      tags: z
        .array(z.string())
        .nullable()
        .describe("Tags / hashtags. Pass null when not relevant."),
      platform: PlatformZ.describe("tumblr or reddit"),
      imageDescription: z
        .string()
        .nullable()
        .describe("Short description of any attached image. Pass null if none."),
    }),
    execute: async ({ text, tags, platform, imageDescription }) => {
      const r = predict({
        text,
        tags: tags ?? [],
        platform: platform as Platform,
        imageDescription: imageDescription ?? undefined,
      });
      return {
        probHigh: Number(r.probHigh.toFixed(3)),
        label: r.label,
        sentiment: r.features.sentiment.label,
        sentimentScore: Number(r.features.sentiment.compound.toFixed(2)),
        topic: r.features.topic.primary,
        wordCount: r.features.wordCount,
        tagCount: r.features.tagCount,
        drivers: r.drivers.slice(0, 5).map((d) => ({
          feature: d.feature,
          direction: d.direction,
          weight: Number(d.weight.toFixed(2)),
          why: d.explanation,
        })),
      };
    },
  }),

  find_similar_top_posts: tool({
    description:
      "Find top-engagement reference posts similar to a query from the curated library.",
    parameters: z.object({
      query: z.string().min(1),
      platform: PlatformZ,
      k: z.number().int().min(1).max(10).describe("How many results to return (1-10)."),
    }),
    execute: async ({ query, platform, k }) => {
      const items: LibraryPost[] = findSimilar(query, platform as Platform, k);
      return items.map((i) => ({
        text: i.text,
        tags: i.tags,
        noteCount: i.noteCount,
        topic: i.topic,
        sentiment: i.sentimentLabel,
      }));
    },
  }),

  suggest_tags: tool({
    description:
      "Suggest tags for a draft, ranked by historical engagement on the platform.",
    parameters: z.object({
      text: z.string().min(1),
      platform: PlatformZ,
      max: z.number().int().min(1).max(20).describe("Max number of tags to return (1-20)."),
    }),
    execute: async ({ text, platform, max }) => {
      const trending = trendingTags(platform as Platform);
      const lower = text.toLowerCase();
      const scored = trending.map((t) => ({
        tag: t.tag,
        relevance:
          (lower.includes(t.tag.toLowerCase()) ? 1 : 0) +
          t.tag.split(" ").filter((w) => lower.includes(w)).length * 0.3,
        avgEngagement: t.avgEngagement,
      }));
      return scored
        .sort(
          (a, b) =>
            b.relevance * 1000 + b.avgEngagement -
            (a.relevance * 1000 + a.avgEngagement),
        )
        .slice(0, max)
        .map(({ tag, avgEngagement }) => ({ tag, avgEngagement }));
    },
  }),

  rewrite: tool({
    description:
      "Generate a rewrite of the draft for a specific strategy. Strategies: neutralize (Tumblr), tighten, topic_shift, add_hook, add_question (Reddit). Returns ONLY the rewritten text.",
    parameters: z.object({
      text: z.string().min(1),
      strategy: z.enum([
        "neutralize",
        "tighten",
        "topic_shift",
        "add_hook",
        "add_question",
      ]),
      target_topic: z.string().nullable().describe("Optional target topic; pass null when not relevant."),
      platform: PlatformZ,
    }),
    execute: async ({ text, strategy, target_topic, platform }) => {
      return {
        accepted: true,
        instruction: `Rewrite the draft for ${platform} using the "${strategy}" strategy${
          target_topic ? ` toward topic "${target_topic}"` : ""
        }. Original: """${text}"""`,
      };
    },
  }),

  fetch_trends: tool({
    description: "Fetch current trending tags and topics for a platform.",
    parameters: z.object({
      platform: PlatformZ,
    }),
    execute: async ({ platform }) => ({
      tags: trendingTags(platform as Platform).slice(0, 8),
      topics: trendingTopics(platform as Platform),
    }),
  }),

  score_diff: tool({
    description: "Compare predicted engagement of two versions of a post.",
    parameters: z.object({
      before: z.string(),
      after: z.string(),
      tags: z.array(z.string()).nullable().describe("Tags shared by both versions; pass null if none."),
      platform: PlatformZ,
    }),
    execute: async ({ before, after, tags, platform }) => {
      const a = predict({ text: before, tags: tags ?? [], platform: platform as Platform });
      const b = predict({ text: after, tags: tags ?? [], platform: platform as Platform });
      return {
        before: { prob: Number(a.probHigh.toFixed(3)), label: a.label },
        after: { prob: Number(b.probHigh.toFixed(3)), label: b.label },
        delta: Number((b.probHigh - a.probHigh).toFixed(3)),
      };
    },
  }),

  generate_image: tool({
    description:
      "Generate a hero image for a post via Azure gpt-image-1. Returns a base64 PNG.",
    parameters: z.object({
      prompt: z.string().min(3),
      style: z.enum(["photoreal", "film", "illustration", "minimal"]),
    }),
    execute: async ({ prompt, style }) => {
      const styleHint = {
        photoreal: "photorealistic, natural light, 35mm",
        film: "shot on Kodak Portra 400, soft grain, muted tones",
        illustration: "flat illustration, soft shadows, pastel palette",
        minimal: "minimalist composition, lots of negative space",
      }[style];
      const out = await generateImage({
        prompt: `${prompt}. Style: ${styleHint}.`,
        size: "1024x1024",
        quality: "medium",
      });
      return {
        ok: out.images.length > 0,
        count: out.images.length,
        b64: out.images[0]?.b64 ?? null,
      };
    },
  }),

  content_gaps: tool({
    description:
      "Find content gaps — trending topics the user hasn't covered yet. Returns up to 4 opportunities ranked by upside.",
    parameters: z.object({
      platform: PlatformZ,
      my_drafts: z.array(z.object({ text: z.string(), tags: z.array(z.string()), state: z.string() }))
        .nullable()
        .describe("User's existing drafts to measure coverage against. Pass null if unknown."),
    }),
    execute: async ({ platform, my_drafts }) => {
      const docs = (my_drafts ?? []).map((d) => ({ ...d, platform: platform as Platform }));
      return findContentGaps(docs, platform as Platform).slice(0, 4);
    },
  }),

  posting_heatmap: tool({
    description:
      "Return the best day and hour to post for the given platform and topic. Also returns a 7×24 score grid.",
    parameters: z.object({
      platform: PlatformZ,
      topic: z.string().nullable().describe("Primary topic (e.g. Q&A, Natural Scenery). Pass null to use platform defaults."),
    }),
    execute: async ({ platform, topic }) => {
      const h = postingHeatmap(platform as Platform, topic ?? undefined);
      return { best: h.best, platform: h.platform };
    },
  }),

  viral_risk: tool({
    description:
      "Assess viral potential and draft consistency (0..1 each). Returns a plain-language callout.",
    parameters: z.object({
      text: z.string().min(1),
      tags: z.array(z.string()).nullable().describe("Tags. Pass null if none."),
      platform: PlatformZ,
    }),
    execute: async ({ text, tags, platform }) => {
      const r = predict({ text, tags: tags ?? [], platform: platform as Platform });
      return viralRisk(r);
    },
  }),

  translate_post: tool({
    description:
      "Cross-platform translation: adapt a Tumblr post for Reddit or vice versa. Returns the translated text plus predicted engagement for both versions.",
    parameters: z.object({
      text: z.string().min(1),
      from: PlatformZ,
      to: PlatformZ,
      tags: z.array(z.string()).nullable().describe("Tags. Pass null if none."),
    }),
    execute: async ({ text, from, to, tags }) => {
      const translated = translatePost(text, from as Platform, to as Platform);
      const src = predict({ text, tags: tags ?? [], platform: from as Platform });
      const tgt = predict({ text: translated, tags: tags ?? [], platform: to as Platform });
      return {
        translated,
        source: { prob: Number(src.probHigh.toFixed(3)), scores: src.scores },
        target: { prob: Number(tgt.probHigh.toFixed(3)), scores: tgt.scores },
      };
    },
  }),

  analyze_hook: tool({
    description:
      "Score the opening line of a post on hook strength (0..1) and list specific improvement reasons.",
    parameters: z.object({
      text: z.string().min(1).describe("Full post body — first sentence is extracted automatically."),
    }),
    execute: async ({ text }) => {
      const h = hookAnalysis(text);
      return { openingLine: h.text, score: Number(h.score.toFixed(2)), reasons: h.reasons };
    },
  }),

  rank_variants: tool({
    description:
      "Rank multiple rewrites of a post by predicted engagement. Returns ordered list with reasoning.",
    parameters: z.object({
      variants: z.array(z.string()).min(2).max(6).describe("2–6 text variants to compare."),
      platform: PlatformZ,
      tags: z.array(z.string()).nullable().describe("Shared tags. Pass null if none."),
    }),
    execute: async ({ variants, platform, tags }) => {
      return rankVariants(variants, platform as Platform, tags ?? []).map((v) => ({
        rank: v.rank,
        preview: v.variant.slice(0, 200),
        prob: Number(v.prediction.probHigh.toFixed(3)),
        scores: v.prediction.scores,
        reasonToPick: v.reasonToPick,
      }));
    },
  }),
};

export type ToolName = keyof typeof tools;
