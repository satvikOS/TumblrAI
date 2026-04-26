import { NextRequest } from "next/server";
import { streamText } from "ai";
import { tryLanguageModel } from "@/lib/ai/models";
import { tools } from "@/lib/ai/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `
You are Notecount's creator assistant. Help with content strategy, post writing,
engagement analysis, trend exploration, and rewriting. You can call tools:
predict_engagement, find_similar_top_posts, suggest_tags, fetch_trends, score_diff.

Findings to ground your advice (do not contradict):
- Tumblr engagement skews toward NEUTRAL sentiment, Natural Scenery / Artistic Expression topics.
- Reddit r/travel engagement skews toward EMOTIONAL intensity, Q&A and Travel Planning topics.

Be concise. Use tool data over assumptions. Default platform = tumblr unless user says otherwise.
`.trim();

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: { role: string; content: string }[] };

  const model = tryLanguageModel("primary");
  if (!model) {
    const last = messages[messages.length - 1]?.content ?? "";
    const text = `Azure not configured. To enable the assistant, set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.\n\nYou said: "${last}"\n\nGuidance: Tumblr rewards neutral, sensory copy with 8–12 tags; Reddit rewards emotional, context-rich Q&A posts.`;
    return new Response(text, { headers: { "Content-Type": "text/plain" } });
  }

  const result = streamText({
    model,
    system: SYSTEM,
    tools,
    maxSteps: 8,
    messages: messages as Parameters<typeof streamText>[0]["messages"],
  });

  return result.toTextStreamResponse();
}
