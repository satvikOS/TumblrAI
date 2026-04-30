// Endpoint smoke tests. Run after `pnpm start`. Exits non-zero on failure.
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const tests = [
  {
    name: "GET /api/health",
    run: async () => {
      const r = await fetch(`${BASE}/api/health`);
      assertOk(r);
      const j = await r.json();
      assert(j.ok === true, "health.ok");
    },
  },
  {
    name: "GET /api/auth (no session)",
    run: async () => {
      const r = await fetch(`${BASE}/api/auth`);
      assertOk(r);
    },
  },
  {
    name: "POST /api/auth (sign in mock user)",
    run: async () => {
      const r = await fetch(`${BASE}/api/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "u_satvik" }),
      });
      assertOk(r);
      const j = await r.json();
      assert(j.user?.id === "u_satvik", "auth user id");
    },
  },
  {
    name: "POST /api/predict (tumblr)",
    run: async () => {
      const r = await fetch(`${BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "fog over the lake at first light, a mountain held the colour of pewter",
          tags: ["alpine", "fog", "scenery"],
          platform: "tumblr",
        }),
      });
      assertOk(r);
      const j = await r.json();
      assert(typeof j.probHigh === "number", "predict probHigh");
      assert(j.features?.topic?.primary, "predict topic");
    },
  },
  {
    name: "POST /api/predict (reddit)",
    run: async () => {
      const r = await fetch(`${BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Two weeks in northern Japan in October — anyone done a similar route? What would you skip?",
          tags: ["japan"],
          platform: "reddit",
        }),
      });
      assertOk(r);
      const j = await r.json();
      assert(j.label === "high" || j.label === "low", "reddit label");
    },
  },
  {
    name: "GET /api/trends?platform=tumblr",
    run: async () => {
      const r = await fetch(`${BASE}/api/trends?platform=tumblr`);
      assertOk(r);
      const j = await r.json();
      assert(Array.isArray(j.tags) && j.tags.length > 0, "trends tags");
      assert(Array.isArray(j.topics), "trends topics");
      assert(Array.isArray(j.series) && j.series.length > 0, "trends series");
    },
  },
  {
    name: "GET /api/trends?platform=reddit",
    run: async () => {
      const r = await fetch(`${BASE}/api/trends?platform=reddit`);
      assertOk(r);
    },
  },
  {
    name: "GET /api/library?platform=tumblr",
    run: async () => {
      const r = await fetch(`${BASE}/api/library?platform=tumblr`);
      assertOk(r);
      const j = await r.json();
      assert(j.items.length > 0, "library items");
    },
  },
  {
    name: "POST /api/similar",
    run: async () => {
      const r = await fetch(`${BASE}/api/similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "alpine fog sunrise lake", platform: "tumblr", k: 3 }),
      });
      assertOk(r);
      const j = await r.json();
      assert(j.items.length > 0, "similar items");
    },
  },
  {
    name: "POST /api/analyze/url",
    run: async () => {
      const r = await fetch(`${BASE}/api/analyze/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://www.tumblr.com/dashboard/post/fog-on-the-lake",
          fallbackText: "soft fog over the lake at first light",
        }),
      });
      assertOk(r);
      const j = await r.json();
      assert(j.prediction?.probHigh != null, "analyze url prediction");
    },
  },
  {
    name: "GET /api/feed (social)",
    run: async () => {
      const r = await fetch(`${BASE}/api/feed?limit=5`);
      assertOk(r);
      const j = await r.json();
      assert(Array.isArray(j.items), "feed items array");
    },
  },
  {
    name: "GET /api/explore (social)",
    run: async () => {
      const r = await fetch(`${BASE}/api/explore?platform=tumblr&limit=4`);
      assertOk(r);
      const j = await r.json();
      assert(Array.isArray(j.items), "explore items array");
      assert(j.items.length > 0, "explore has items");
    },
  },
  {
    name: "GET /api/social/users/satvik",
    run: async () => {
      const r = await fetch(`${BASE}/api/social/users/satvik`);
      assertOk(r);
      const j = await r.json();
      assert(j.user?.handle === "satvik", "user payload");
      assert(Array.isArray(j.posts), "user posts");
    },
  },
  {
    name: "GET /api/social/search?q=fog",
    run: async () => {
      const r = await fetch(`${BASE}/api/social/search?q=fog`);
      assertOk(r);
      const j = await r.json();
      assert(Array.isArray(j.posts), "search posts");
      assert(Array.isArray(j.users), "search users");
    },
  },
];

let failed = 0;
for (const t of tests) {
  try {
    await t.run();
    console.log(`✓ ${t.name}`);
  } catch (err) {
    failed++;
    console.error(`✗ ${t.name}`);
    console.error("  " + (err instanceof Error ? err.message : String(err)));
  }
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${tests.length} endpoint tests passed.`);

function assert(cond, msg) {
  if (!cond) throw new Error(`assert failed: ${msg}`);
}
function assertOk(r) {
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
}
