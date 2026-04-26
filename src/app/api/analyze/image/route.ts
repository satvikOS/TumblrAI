import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { tryLanguageModel } from "@/lib/ai/models";
import { predict } from "@/lib/ml/predict";

const Body = z.object({
  imageUrl: z.string().url().or(z.string().startsWith("data:image/")),
  caption: z.string().optional().default(""),
  platform: z.enum(["tumblr", "reddit"]).default("tumblr"),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { imageUrl, caption, platform } = parsed.data;

  const model = tryLanguageModel("primary");
  let description = "An outdoor scene with natural lighting.";
  let analysis = {
    subject: "natural scene",
    mood: "calm",
    composition: "balanced",
    palette: "muted",
    suggestions: [
      "Lean into negative space — Tumblr rewards minimal compositions.",
      "Tighten the caption to two short, sensory lines.",
    ],
  };

  if (model) {
    const r = await generateText({
      model,
      system:
        "You are a vision analyst for travel photography on Tumblr/Reddit. Return STRICT JSON only.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Describe this image and assess its engagement potential. " +
                `Caption: "${caption}". Platform: ${platform}. ` +
                'Respond as JSON with keys: description, subject, mood, composition, palette, suggestions (array of <=4 short strings).',
            },
            { type: "image", image: imageUrl },
          ],
        },
      ],
      temperature: 0.2,
    });
    try {
      const text = r.text.replace(/^```json\s*|\s*```$/g, "");
      const j = JSON.parse(text) as {
        description?: string;
        subject?: string;
        mood?: string;
        composition?: string;
        palette?: string;
        suggestions?: string[];
      };
      description = j.description ?? description;
      analysis = {
        subject: j.subject ?? analysis.subject,
        mood: j.mood ?? analysis.mood,
        composition: j.composition ?? analysis.composition,
        palette: j.palette ?? analysis.palette,
        suggestions: j.suggestions ?? analysis.suggestions,
      };
    } catch {
      description = r.text.slice(0, 280);
    }
  }

  const prediction = predict({
    text: caption,
    tags: [],
    platform,
    imageDescription: description,
  });

  return NextResponse.json({
    description,
    analysis,
    prediction,
    mock: !model,
  });
}
