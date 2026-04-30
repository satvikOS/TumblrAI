"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Wand2, Download } from "lucide-react";
import { LogoSpinner } from "@/components/logo-3d";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformToggle } from "@/components/platform-toggle";
import { EngagementGauge } from "@/components/engagement-gauge";
import { toast } from "sonner";

type AnalyzeResp = {
  description: string;
  analysis: { subject: string; mood: string; composition: string; palette: string; suggestions: string[] };
  prediction: { probHigh: number; label: "high" | "low"; features: { topic: { primary: string }; sentiment: { label: string } } };
  mock?: boolean;
};

export function VisualClient() {
  return (
    <div>
      <PageHeader title="Visual lab" description="Analyze a photo or generate a hero image with Azure gpt-image-1." />
      <div className="p-8">
        <Tabs defaultValue="analyze" className="w-full">
          <TabsList>
            <TabsTrigger value="analyze">Analyze</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
          </TabsList>
          <TabsContent value="analyze"><AnalyzePanel /></TabsContent>
          <TabsContent value="generate"><GeneratePanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AnalyzePanel() {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState<"tumblr" | "reddit">("tumblr");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnalyzeResp | null>(null);

  async function uploadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!imageUrl) {
      toast.error("Add an image URL or upload one.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/analyze/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, caption, platform }),
      });
      if (!r.ok) {
        toast.error("Analysis failed.");
        return;
      }
      const j = (await r.json()) as AnalyzeResp;
      setResult(j);
      if (j.mock) toast.info("Preview mode — Azure not configured.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Image</h3>
            <PlatformToggle value={platform} onChange={setPlatform} size="sm" />
          </div>
          <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/20 p-6">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Uploaded" className="max-h-[360px] rounded-md object-contain" />
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 text-sm text-muted-foreground">
                <ImagePlus className="h-6 w-6" />
                Click to upload (or paste a URL below)
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                />
              </label>
            )}
          </div>
          <Input
            value={imageUrl.startsWith("data:") ? "" : imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption to evaluate together…"
            className="min-h-[100px]"
          />
          <Button onClick={analyze} disabled={busy} className="w-full">
            {busy ? <LogoSpinner size={14} /> : <Wand2 />}
            Analyze
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <EngagementGauge prob={result?.prediction.probHigh ?? 0} label={result?.prediction.label} />
            <div className="grid w-full grid-cols-2 gap-2 text-xs">
              <Stat label="Topic" value={result?.prediction.features.topic.primary ?? "—"} />
              <Stat label="Sentiment" value={result?.prediction.features.sentiment.label ?? "—"} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Vision analysis</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {result ? (
              <>
                <p className="text-muted-foreground">{result.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Field k="Subject" v={result.analysis.subject} />
                  <Field k="Mood" v={result.analysis.mood} />
                  <Field k="Composition" v={result.analysis.composition} />
                  <Field k="Palette" v={result.analysis.palette} />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Suggestions
                  </div>
                  <ul className="space-y-1">
                    {result.analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-primary" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">Upload an image to begin.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GeneratePanel() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<"photoreal" | "film" | "illustration" | "minimal">("photoreal");
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  async function generate() {
    if (!prompt.trim()) {
      toast.error("Describe what you want to see.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, size: "1024x1024" }),
      });
      const j = (await r.json()) as { images?: string[]; mock?: boolean; message?: string };
      if (j.mock) {
        toast.info(j.message ?? "Preview mode — Azure not configured.");
      }
      setImages(j.images ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
      <Card>
        <CardContent className="space-y-4 p-5">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A misty alpine lake at sunrise, no people, soft fog…"
            className="min-h-[140px]"
          />
          <div>
            <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Style</div>
            <Select value={style} onValueChange={(v) => setStyle(v as typeof style)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="photoreal">Photoreal · 35mm</SelectItem>
                <SelectItem value="film">Film · Portra 400</SelectItem>
                <SelectItem value="illustration">Illustration · pastel</SelectItem>
                <SelectItem value="minimal">Minimal · negative space</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={busy} className="w-full">
            {busy ? <LogoSpinner size={14} /> : <Wand2 />}
            Generate
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Uses Azure <code>gpt-image-1</code>. PNG output.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {images.length === 0 ? (
          <Card className="col-span-full grid place-items-center border-dashed py-24 text-sm text-muted-foreground">
            Generated images will appear here.
          </Card>
        ) : (
          images.map((src, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Generated ${i + 1}`} className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between p-3">
                  <Badge variant="outline">{style}</Badge>
                  <a href={src} download={`notecount-${i + 1}.png`}>
                    <Button size="sm" variant="ghost"><Download /> Save</Button>
                  </a>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
      <div className="text-sm capitalize">{v}</div>
    </div>
  );
}
