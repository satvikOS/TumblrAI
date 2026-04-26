import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { predict } from "@/lib/ml/predict";

const Body = z.object({
  url: z.string().url(),
  fallbackText: z.string().optional(),
});

// Notecount is a standalone product — we do NOT scrape Tumblr/Reddit. Instead
// we let users paste a URL and the public OG/title text we can extract from
// the URL pathname, falling back to user-provided text. Real OG fetching is
// intentionally avoided to stay platform-independent.
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { url, fallbackText } = parsed.data;
  const u = new URL(url);
  const platform: "tumblr" | "reddit" = u.hostname.includes("reddit") ? "reddit" : "tumblr";

  const guess =
    fallbackText ??
    decodeURIComponent(u.pathname.replace(/\/$/, "").split("/").pop() ?? "")
      .replace(/[-_]/g, " ");

  const r = predict({ text: guess, tags: [], platform });
  return NextResponse.json({
    platform,
    extractedText: guess,
    prediction: r,
    note: "Notecount does not scrape source platforms. Paste the post body for the most accurate analysis.",
  });
}
