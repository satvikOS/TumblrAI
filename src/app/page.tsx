import Link from "next/link";
import { ArrowRight, Sparkles, BarChart3, Image as ImageIcon, MessagesSquare, Compass, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-provider";
import { Logo3D } from "@/components/logo-3d";

const features = [
  { icon: Sparkles, title: "Post smarter", body: "Live engagement scoring for every draft. Know if it lands before you publish." },
  { icon: Zap,      title: "Agent rewrites", body: "An iterative AI agent rewrites until your post clears the target probability." },
  { icon: BarChart3, title: "Trend intelligence", body: "Daily-refreshed trending tags, topics, and sentiment mix per platform." },
  { icon: ImageIcon, title: "Visual lab", body: "Drop a photo. Get composition, mood, predicted visual engagement, hero generation." },
  { icon: MessagesSquare, title: "Real social", body: "Feed, profiles, comments, reblogs — built for travel & creative communities." },
  { icon: Compass, title: "Curated explore", body: "Top-decile posts ranked by predicted engagement. Find your next inspiration." },
];

export default function Landing() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 gradient-mesh opacity-30 dark:opacity-50" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo3D size={32} withWordmark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="#features" className="hover:text-foreground">Features</Link>
          <Link href="#science" className="hover:text-foreground">The model</Link>
          <Link href="/app" className="hover:text-foreground">Open app</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/app">Launch app <ArrowRight /></Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="pt-12 pb-20 md:pt-20 md:pb-28">
          <Badge variant="outline" className="mb-6">Engagement intelligence is the platform</Badge>
          <h1 className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            A social platform that{" "}
            <span className="text-brand-gradient">tells you what works</span>
            {" "}before you post.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-foreground-soft md:text-xl">
            Notecount is a social network for creators where every post is scored, explained, and improvable.
            Built on the published Tumblr × Reddit engagement model — no platform integration required.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/app">Open the feed <ArrowRight /></Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/app/compose">Start a draft</Link>
            </Button>
          </div>

          {/* Hero stats */}
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat n="42k+" l="trained posts" />
            <Stat n="78%" l="Tumblr accuracy" />
            <Stat n="81%" l="Reddit accuracy" />
            <Stat n="< 350ms" l="live score latency" />
          </div>
        </section>

        <section id="features" className="grid grid-cols-1 gap-4 pb-20 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="lift rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>

        <section id="science" className="rounded-2xl border border-border bg-card p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                The model behind every score
              </h2>
              <p className="mt-4 text-foreground-soft">
                Notecount is built on the engagement model published by Group 14 in
                CIS 434 (Spring 2026): VADER sentiment + LDA topics + TF-IDF + XGBoost,
                trained on 40k+ Tumblr posts and 2k+ Reddit r/travel posts. We turned
                the findings into a real-time predictor and an agentic rewriting loop.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />Tumblr: ~78% accuracy, neutral content wins, topic dominates emotion.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />Reddit: ~81% accuracy, emotional intensity wins, Q&amp;A is king.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />Cross-platform validation built into every recommendation.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-background p-5 font-mono text-xs leading-relaxed">
              <div className="text-muted-foreground">/api/predict</div>
              <pre className="mt-2 whitespace-pre-wrap text-foreground">{`{
  "platform": "tumblr",
  "probHigh": 0.74,
  "label": "high",
  "features": {
    "wordCount": 32,
    "sentiment": { "label": "neutral", "compound": 0.04 },
    "topic": { "primary": "Natural Scenery" },
    "tagCount": 9
  },
  "drivers": [
    { "feature": "topic",                 "weight": 0.9, "direction": "+" },
    { "feature": "sentiment_neutrality",  "weight": 1.0, "direction": "+" },
    { "feature": "tags",                  "weight": 0.5, "direction": "+" }
  ]
}`}</pre>
            </div>
          </div>
        </section>

        <footer className="my-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Logo3D size={20} />
            © {new Date().getFullYear()} Notecount
          </div>
          <div className="flex gap-6">
            <Link href="/app">Open app</Link>
            <a href="/api/health" className="hover:text-foreground">API status</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="font-display text-2xl font-semibold tracking-tight">{n}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
    </div>
  );
}
