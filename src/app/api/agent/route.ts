import { NextRequest } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { tryLanguageModel } from "@/lib/ai/models";
import { tools } from "@/lib/ai/tools";
import { predict } from "@/lib/ml/predict";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  draft: z.object({
    text: z.string().min(1),
    tags: z.array(z.string()).default([]),
    platform: z.enum(["tumblr", "reddit"]),
    imageDescription: z.string().optional(),
  }),
  target: z.number().min(0.5).max(0.95).default(0.7),
  voice: z.string().optional(),
});

const SYSTEM = `
You are Notecount's Engagement Agent, an expert at improving creator drafts for Tumblr and Reddit.

You operate iteratively:
1. Call predict_engagement to score the current draft.
2. Call find_similar_top_posts and fetch_trends to gather context.
3. Diagnose the weakest drivers from the prediction.
4. Produce 1–2 concrete rewrite candidates inline (don't call rewrite as a tool — just write the new draft text).
5. Call score_diff to verify the rewrite improves the score.
6. Stop when probHigh >= target OR after 3 rewrite rounds OR no improvement > 0.02 for 2 rounds.
7. End with a short final summary: best draft, predicted prob, top 3 changes you made, and 6–10 suggested tags.

Platform rules grounded in the published study:
- Tumblr: NEUTRAL sentiment outperforms emotional. Length 25–80 words. Topic > emotion. Tag-driven discovery (8–12 tags).
- Reddit (r/travel): EMOTIONAL intensity wins. Length 80–350 words. Q&A topic and direct questions are strongest.

Be concise. Stream short reasoning between tool calls. Never invent statistics.
`.trim();

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
    });
  }
  const { draft, target, voice } = parsed.data;

  const model = tryLanguageModel("primary");
  if (!model) {
    return mockAgent(draft, target);
  }

  const initial = predict(draft);

  const result = streamText({
    model,
    system: SYSTEM,
    tools,
    maxSteps: 12,
    temperature: 0.4,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Improve this ${draft.platform} draft toward probHigh >= ${target}.\n\n` +
              `Current draft:\n"""${draft.text}"""\n\n` +
              `Tags: ${draft.tags.join(", ") || "(none)"}\n` +
              (draft.imageDescription ? `Image: ${draft.imageDescription}\n` : "") +
              (voice ? `\nUser voice samples:\n"""${voice}"""\n` : "") +
              `\nStart by calling predict_engagement, then proceed.`,
          },
        ],
      },
    ],
  });

  // Custom SSE stream so the UI can render structured events.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("start", { initialProb: initial.probHigh, target });

      try {
        for await (const part of result.fullStream) {
          switch (part.type) {
            case "text-delta":
              send("text", { delta: part.textDelta });
              break;
            case "tool-call":
              send("tool_call", {
                id: part.toolCallId,
                name: part.toolName,
                args: part.args,
              });
              break;
            case "tool-result":
              send("tool_result", {
                id: part.toolCallId,
                name: part.toolName,
                result: part.result,
              });
              break;
            case "step-finish":
              send("step", { finishReason: part.finishReason });
              break;
            case "finish":
              send("done", {
                finishReason: part.finishReason,
                usage: part.usage,
              });
              break;
            case "error":
              send("error", { message: String(part.error) });
              break;
          }
        }
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function mockAgent(
  draft: z.infer<typeof Body>["draft"],
  target: number,
): Response {
  const initial = predict(draft);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );

      send("start", { initialProb: initial.probHigh, target });
      await sleep(200);
      send("text", {
        delta:
          "Azure not configured — running deterministic preview. Scoring the draft against the published model.\n",
      });
      await sleep(150);
      send("tool_call", { id: "1", name: "predict_engagement", args: draft });
      send("tool_result", { id: "1", name: "predict_engagement", result: initial });
      await sleep(150);
      const rewrite =
        draft.platform === "tumblr"
          ? "soft fog peeling off the lake at first light. the trail behind, the mountain ahead. nothing posed."
          : draft.text + "\n\nDoing this in 3 weeks — has anyone done a similar route? What would you change?";
      const after = predict({ ...draft, text: rewrite });
      send("text", { delta: "Drafting a candidate rewrite tuned to platform.\n" });
      send("tool_call", {
        id: "2",
        name: "score_diff",
        args: { before: draft.text, after: rewrite, platform: draft.platform },
      });
      send("tool_result", {
        id: "2",
        name: "score_diff",
        result: {
          before: { prob: initial.probHigh, label: initial.label },
          after: { prob: after.probHigh, label: after.label },
          delta: after.probHigh - initial.probHigh,
        },
      });
      send("text", {
        delta: `\nFinal: ${rewrite}\n\nPredicted: ${(after.probHigh * 100).toFixed(0)}% high-engagement.`,
      });
      send("done", { finishReason: "stop", mock: true });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
