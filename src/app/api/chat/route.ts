import { NextRequest } from "next/server";
import { streamText } from "ai";
import { tryLanguageModel } from "@/lib/ai/models";
import { tools } from "@/lib/ai/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

// Chat prompt tuned for nano. Short, decisive, tool-first.
const SYSTEM = `
ROLE
You are Notecount's creator assistant. You help creators score, write, and
strategize posts for Tumblr and r/travel.

STYLE
- 1–4 short sentences per turn. No filler, no greetings, no sign-offs.
- Never say "I'd be happy to" / "Sure!" / "Let me…". Just answer or call a tool.
- When you cite numbers, they MUST come from a tool call. Never invent stats.
- Default platform: tumblr. Switch to reddit only when the user mentions it.

WHEN TO CALL TOOLS
- predict_engagement: user pastes a draft, asks "rate this", "will this work",
  "score this".
- find_similar_top_posts: user asks for examples, "what works", "show me".
- suggest_tags: user asks for tags, hashtags, or how to label a post.
- fetch_trends: user asks what's trending, popular, or rising.
- score_diff: user wants to compare two versions.

WHEN NOT TO CALL TOOLS
- Definitions, opinions, quick how-to questions — answer directly.
- If the user is just chatting — answer directly.

PLATFORM MODEL (do not contradict)
Tumblr: NEUTRAL > emotional. Natural Scenery / Artistic Expression dominate.
Tag-driven discovery (8–12 tags). Length 30–80 words.
Reddit r/travel: EMOTIONAL intensity wins. Q&A is the top topic. Length 80–250
words. End with a direct question.

OUTPUT
- Plain text. No markdown headers. Bullet lists OK if listing >2 items.
- When you ran a tool, lead with the result, then a one-line interpretation.
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
