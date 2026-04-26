import { tool } from "ai";
import { z } from "zod";
import { predict } from "@/lib/ml/predict";
import { findSimilar, type LibraryPost } from "@/lib/library";
import { trendingTags, trendingTopics } from "@/lib/trends";
import type { Platform } from "@/lib/ml/topics";
import { generateImage } from "./image";

const PlatformZ = z.enum(["tumblr", "reddit"]);

export const tools = {
  predict_engagement: tool({
    description:
      "Predict probability that a post achieves high engagement. Returns prob (0-1), label (high/low), all features, and ranked drivers explaining the score.",
    parameters: z.object({
      text: z.string().min(1).describe("The post body."),
      tags: z.array(z.string()).optional().describe("Tags / hashtags."),
      platform: PlatformZ.describe("tumblr or reddit"),
      imageDescription: z
        .string()
        .optional()
        .describe("Short description of any attached image."),
    }),
    execute: async ({ text, tags, platform, imageDescription }) => {
      const r = predict({
        text,
        tags: tags ?? [],
        platform: platform as Platform,
        imageDescription,
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
      k: z.number().int().min(1).max(10).default(5),
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
      max: z.number().int().min(1).max(20).default(10),
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
      target_topic: z.string().optional(),
      platform: PlatformZ,
    }),
    // The rewrite is *itself* an LLM call — we return a placeholder; the
    // calling agent loop will produce the real rewrite on the next turn
    // using its own model context. This tool is a structured intent marker.
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
      tags: z.array(z.string()).optional(),
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
      style: z
        .enum(["photoreal", "film", "illustration", "minimal"])
        .default("photoreal"),
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
};

export type ToolName = keyof typeof tools;
