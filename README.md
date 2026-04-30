# Notecount

> Engagement intelligence for Tumblr & Reddit creators — a standalone product
> built on the published CIS 434 Group 14 engagement model.

Notecount predicts whether a post will achieve high engagement before you
publish it, explains *why*, and runs an iterative AI agent that rewrites the
draft until it clears your target score. No platform integration required.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind 4** + custom design tokens (OKLCH)
- **shadcn-style** primitives over Radix + Framer Motion
- **Vercel AI SDK 5** + **Azure AI Foundry** (gpt-5-mini default, gpt-5,
  o4-mini, text-embedding-3-large, gpt-image-1)
- **VADER + LDA-style topic + heuristic** engagement model in TypeScript —
  runs in-process on Vercel, mirroring the Group 14 published findings
- **In-memory store** for drafts/runs with seed data; swap with Drizzle +
  Postgres later by re-implementing `src/lib/store.ts`
- **Cookie-based mock auth** (multi-user via `/api/auth`)

## Run locally

```bash
pnpm install
cp .env.example .env.local      # add AZURE_OPENAI_* values
pnpm dev
```

Without Azure configured, every AI endpoint returns a clearly-labeled preview
response so the UI is fully usable.

## API surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Health + Azure config status |
| `/api/auth` | GET / POST / DELETE | Mock session management |
| `/api/predict` | POST | Engagement prediction (Tumblr or Reddit) |
| `/api/agent` | POST (SSE) | Iterative rewrite agent stream |
| `/api/chat` | POST (stream) | Conversational assistant |
| `/api/generate/text` | POST | Generate N variants of a post |
| `/api/generate/image` | POST | Hero image via gpt-image-1 |
| `/api/analyze/image` | POST | Vision analysis + engagement score |
| `/api/analyze/url` | POST | Analyze a posted URL |
| `/api/posts` | GET / POST | List + create drafts |
| `/api/posts/[id]` | GET / PATCH / DELETE | Single draft |
| `/api/library` | GET | Reference library |
| `/api/similar` | POST | Find similar top posts |
| `/api/trends` | GET | Trending tags + topics + series |
| `/api/runs` | GET | Agent run history |

## Pages

`/` landing · `/app` dashboard · `/app/compose` composer + agent panel ·
`/app/agent` agent overview · `/app/trends` trend explorer ·
`/app/library` reference library · `/app/visual` vision lab + image generation ·
`/app/calendar` kanban · `/app/chat` assistant · `/app/settings` profile + Azure status.

## Environment variables

Set in Vercel project settings (or GitHub Actions secrets for CI):

```
# Required
AZURE_OPENAI_ENDPOINT       https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY        <key>
AZURE_DEPLOYMENT_PRIMARY    gpt-5-nano            # your Azure deployment NAME

# Optional — leave unset and they route to PRIMARY automatically
AZURE_DEPLOYMENT_PRO        gpt-5
AZURE_DEPLOYMENT_REASONING  o4-mini
AZURE_OPENAI_API_VERSION    2024-12-01-preview

# Optional — different model classes; leave unset to disable that feature
AZURE_DEPLOYMENT_IMAGE      gpt-image-1            # enables image generation
AZURE_DEPLOYMENT_EMBEDDING  text-embedding-3-large # enables embedding search
```

**A single gpt-5-nano deployment is a valid full setup** for everything
except image generation and embeddings (those need their own model classes).
When the optional deployments are unset, the corresponding endpoints return
clearly-labeled preview responses instead of failing.

## CI

GitHub Actions runs typecheck → lint → build → smoke-tests every endpoint
(`scripts/smoke.mjs`) on every push.
