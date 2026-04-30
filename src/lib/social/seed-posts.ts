import type { Platform } from "@/lib/ml/topics";
import { predict } from "@/lib/ml/predict";
import type { SocialComment, SocialFollow, SocialPost, SocialReblog, SocialUser } from "./types";
import { SEED_USERS } from "./seed-users";
import { PHOTOS, photoUrl, type PhotoEntry } from "./seed-photos";

// ----- Deterministic helpers -----
function mulberry(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickHandle(rng: () => number, exclude?: string): string {
  for (let i = 0; i < 16; i++) {
    const u = SEED_USERS[Math.floor(rng() * SEED_USERS.length)];
    if (u.handle !== exclude) return u.handle;
  }
  return SEED_USERS[0].handle;
}

const NOW = Date.UTC(2026, 3, 26, 12, 0, 0); // April 26, 2026

function ago(rng: () => number, maxDays = 60): string {
  const ms = rng() * maxDays * 86400_000;
  return new Date(NOW - ms).toISOString();
}

// ----- Tag pools -----
const TUMBLR_TAGS = [
  "travel", "scenery", "nature", "alpine", "mountains", "forest", "morning",
  "sunrise", "sunset", "fog", "lake", "ocean", "coastal", "minimal", "moody",
  "film", "portra", "analog", "aesthetic", "photography", "japan", "iceland",
  "patagonia", "italy", "norway", "kyoto", "tokyo", "lisbon", "slow travel",
  "solo travel", "softness", "muted", "quiet", "dreamy", "still", "wanderlust",
  "atmospheric", "ethereal", "mood", "stillness", "soft light", "negative space",
];
const REDDIT_TAGS = [
  "japan", "europe", "schengen", "patagonia", "tohoku", "iceland", "italy",
  "tbilisi", "georgia", "morocco", "atlas", "korea", "vietnam", "portugal",
  "trekking", "solo", "budget", "itinerary", "advice", "tips", "visa",
  "passport", "transport", "route",
];

// ----- Post body templates -----

// Tumblr-style: short, sensory, lowercase, neutral.
const T_POSTS: { body: string; topic: PhotoEntry["topic"]; image?: boolean }[] = [
  { body: "fog peeling off the lake at first light. the trail behind us, the mountain ahead. nothing posed.", topic: "scenery", image: true },
  { body: "muted morning tones, the kind of quiet you can hear. nothing to add — just the river and the fog.", topic: "art", image: true },
  { body: "the canyon held the sunset for a full hour. nothing else to say.", topic: "scenery", image: true },
  { body: "a slow morning in the village. bread, coffee, no plans. travel doesn't have to be loud.", topic: "travel", image: true },
  { body: "rain on the window, a cup of something warm, and the city lights bleeding into the dark.", topic: "city", image: true },
  { body: "cold lake. warm hands. the kind of swim you remember in winter.", topic: "scenery", image: true },
  { body: "the train cut through the alps for an hour and i didn't say a word.", topic: "travel", image: true },
  { body: "soft greens, pale water, that feeling of september.", topic: "art", image: true },
  { body: "first frost on the trail. boots quiet. light coming through the pines.", topic: "trail", image: true },
  { body: "morning at the harbor. the boats are still asleep.", topic: "city", image: true },
  { body: "a corner of the city where the stones remember more than i do.", topic: "city", image: true },
  { body: "kept walking past the viewpoint. the path past it was the one i came for.", topic: "trail", image: true },
  { body: "fjord. ferry. forty minutes of nothing happening, perfectly.", topic: "scenery", image: true },
  { body: "cafe at the end of the lane. window seat. a book i don't remember reading.", topic: "city", image: false },
  { body: "the desert kept its colors for the last ten minutes of light.", topic: "scenery", image: true },
  { body: "an empty cathedral on a tuesday. the kind of acoustics you feel in your chest.", topic: "city", image: false },
  { body: "tide came in slow. nothing to do but watch.", topic: "scenery", image: true },
  { body: "a black beach, white waves, grey sky. no edits.", topic: "scenery", image: true },
  { body: "the ferry from athens stops being practical and starts being the trip.", topic: "travel", image: true },
  { body: "summit. wind. tea from a thermos. a whole hour to ourselves.", topic: "trail", image: true },
  { body: "every kyoto alley has the same width as a held breath.", topic: "city", image: true },
  { body: "a village where the dogs decide the pace.", topic: "travel", image: false },
  { body: "ridge in cloud. sun finds a hole. fifteen seconds, then back to grey.", topic: "trail", image: true },
  { body: "old door. older hinges. the village hadn't changed since the postcard.", topic: "city", image: false },
  { body: "lichen. moss. small worlds at boot level.", topic: "trail", image: true },
  { body: "a city where the rain has its own rhythm.", topic: "city", image: true },
  { body: "wind on the dunes. footprints gone in seconds.", topic: "scenery", image: true },
  { body: "still water. it took the mountain whole.", topic: "scenery", image: true },
  { body: "lemons, ferries, a slow afternoon in southern italy.", topic: "travel", image: true },
  { body: "stone houses on a stone hill on a stone island.", topic: "city", image: true },
  { body: "the campervan held its own for 4,200 km. so did we.", topic: "travel", image: true },
  { body: "tent at 3am. milky way. nothing else to do but look.", topic: "trail", image: true },
  { body: "moss draped trees, a river that knows where it's going.", topic: "scenery", image: true },
  { body: "harbor light. nets drying. the day starting before the sun is committed.", topic: "city", image: true },
  { body: "northern light kept us up. didn't mind.", topic: "scenery", image: true },
  { body: "vineyard at the edge of the village. a glass of nothing fancy. perfect.", topic: "food", image: false },
  { body: "the road bent away from the coast for one minute and the country got bigger.", topic: "travel", image: true },
  { body: "early lisbon. tiles. a tram you don't have to catch.", topic: "city", image: true },
];

// Reddit-style: longer, contextual, ends with a question.
const R_POSTS: { title: string; body: string; topic: PhotoEntry["topic"] }[] = [
  {
    title: "Two weeks in northern Japan in October — itinerary check?",
    body:
      "Planning two weeks across Tohoku in mid-October for autumn colors. Tokyo in/out, JR pass, no rental car. " +
      "I'm trying to choose between Aomori and Akita as the anchor city, and I'm wondering whether two days in Yamagata is worth it given the rest of the route. " +
      "Anyone done this in mid-October without a car? What did you skip and what did you wish you hadn't?",
    topic: "travel",
  },
  {
    title: "Schengen 90/180 — partial-month math?",
    body:
      "Flew into Madrid Aug 1, left Sep 5 (35 days). I want to come back Nov 15. The rolling 180 is doing my head in. " +
      "Can someone walk me through how the partial-month math works for a re-entry on Nov 15 and how many days I'd have? Calculator links welcome.",
    topic: "travel",
  },
  {
    title: "Best street food experience of my life in Oaxaca",
    body:
      "Came back from a week in Oaxaca and I haven't stopped thinking about the mole negro. " +
      "I had it at a tiny stall on Mercado 20 de Noviembre, no English menu, no posters, no Instagram presence. " +
      "It tasted like the entire history of a place. Anywhere else in Mexico that hits like this?",
    topic: "food",
  },
  {
    title: "Solo trip to Patagonia in March, 18 days. Crazy?",
    body:
      "Looking at W trek + Fitz Roy back-to-back without a buffer day. " +
      "I'm a confident hiker but new to multi-day refugio life. " +
      "Is it crazy to do those two big things with zero rest, or is it doable for someone in OK shape?",
    topic: "trail",
  },
  {
    title: "Tbilisi on a budget — 5 days for under €350?",
    body:
      "Just got back from 5 days in Tbilisi for under €350 all in (excluding flights). " +
      "The wine, the sulphur baths, and hands-down the most underrated old town in Europe. " +
      "Happy to answer anything specific.",
    topic: "city",
  },
  {
    title: "First trek in Nepal — EBC vs Annapurna Circuit?",
    body:
      "October 2026, ~18 days available, decent fitness, no high-altitude experience yet. " +
      "EBC for the iconic factor or Annapurna Circuit for variety? Trying to decide on something I'll only do once.",
    topic: "trail",
  },
  {
    title: "Iceland in 7 days — ring road or just south coast?",
    body:
      "Late September, two of us, rental car. " +
      "Ring road feels rushed at 7 days but I don't want to skip the east. " +
      "What does 'doing it right' look like in your head?",
    topic: "scenery",
  },
  {
    title: "Vietnam itinerary feedback — 3 weeks, north to south",
    body:
      "Hanoi → Sapa → Ninh Binh → Phong Nha → Hue → Hoi An → Da Lat → HCMC. " +
      "Worried I'm overdoing it. What's the one place I'd regret skipping if I cut it for an extra day somewhere?",
    topic: "travel",
  },
  {
    title: "Solo in Morocco — Marrakech vs Fes as a base?",
    body:
      "10 days, late October. I want medina life + a desert excursion + atlas mountains. " +
      "Is Marrakech the obvious choice or is Fes underrated as a base for that combination?",
    topic: "travel",
  },
  {
    title: "Norway fjords without a car — actually possible?",
    body:
      "Reading mixed things about whether the fjords are doable on public transport. " +
      "5 days, late June, want to see Geirangerfjord and Nærøyfjord at minimum. Realistic?",
    topic: "scenery",
  },
  {
    title: "Camera question for a 3-week trip — film + digital combo?",
    body:
      "Used to bring just the M6 and 3 rolls a day. Now I'm being talked into adding a Fuji X100V for 'safety shots'. " +
      "Anyone tried this combo for a long trip? Did you actually use both?",
    topic: "art",
  },
  {
    title: "Lost passport in Lisbon — how it actually went",
    body:
      "Posting in case it helps someone. Lost passport on day 2 of a 10-day trip. " +
      "Embassy was easier than I expected. Here's a step-by-step of what worked and what didn't.",
    topic: "city",
  },
  {
    title: "Slow travel in Italy — Sicily for 3 weeks?",
    body:
      "Three weeks, no schedule, just one base for the first 10 days then drift. " +
      "Catania or Palermo as the first base? Looking for the one that rewards going nowhere.",
    topic: "travel",
  },
  {
    title: "Snow in May? Trekking the Tour du Mont Blanc late",
    body:
      "Pushed back to mid-September. Worried about new snow at the cols. " +
      "Anyone done TMB in mid-September after a wet summer? How was the alt-route situation at La Fouly and Champex?",
    topic: "trail",
  },
  {
    title: "Where to find the kind of cafe you sit in for 4 hours?",
    body:
      "Looking for cafe cities, not just good cafes. Specifically: walkable, coffee that's both good and cheap, slow service, no laptops policy is a plus. " +
      "Tbilisi was perfect. Where else is like that?",
    topic: "food",
  },
  {
    title: "Train pass strategy across Europe — Eurail or point-to-point?",
    body:
      "5 weeks, 7 countries, bouncing around. Eurail Global pass keeps coming out cheaper than I expected when I include reservations. " +
      "Anyone built a real spreadsheet on this recently?",
    topic: "travel",
  },
  {
    title: "How do you photograph a place you've already photographed?",
    body:
      "Going back to Kyoto for the third time. Want it to feel new, not just to repeat. " +
      "Anyone deliberately shot a place differently the second/third time around?",
    topic: "art",
  },
  {
    title: "What's the most underrated capital city in Europe?",
    body:
      "Going to ask the obvious question. Setting aside the obvious top 5, what capital actually surprised you, and why?",
    topic: "city",
  },
];

// ----- Comment templates -----
const COMMENTS = [
  "this is so my mood right now",
  "the third line is the whole post",
  "where is this exactly",
  "saving for later",
  "the muted greens are doing it for me",
  "you nailed the light here",
  "ok i need to go",
  "i went last year and have not stopped thinking about it since",
  "what camera/film?",
  "i think about this kind of post when i'm stuck in meetings",
  "this should be the platform's example post honestly",
  "did you edit much?",
  "the fog is doing all the work and the work is excellent",
  "this is exactly what i needed today",
  "ok adding to my saved list",
  "you do this so well",
  "first time on this account, going through the archive now",
  "love the patience in this",
  "did you make it back before sunset?",
  "i lived a whole minute in this photo",
  "is this the same trip from last week's post?",
  "does anyone know if the path is open in november",
  "great rec, going next month",
  "this is helpful, thanks for writing it up",
  "+1 to the cafe rec",
  "did you book in advance or walk in?",
  "currency question — was card accepted at most places?",
  "how was the wifi situation",
  "yeah this matches what i found, +1",
  "what was your visa situation here",
  "you should turn this into a longer post",
  "lol the description is perfect",
  "underrated, agreed",
  "this is the one. saving.",
];

// ----- Build everything -----

export type SocialSeed = {
  users: SocialUser[];
  posts: SocialPost[];
  comments: SocialComment[];
  follows: SocialFollow[];
  reblogs: SocialReblog[];
};

export function buildSeed(): SocialSeed {
  const rng = mulberry(20260426);
  const posts: SocialPost[] = [];
  const comments: SocialComment[] = [];
  const reblogs: SocialReblog[] = [];

  // ---- Tumblr posts ----
  // Cycle through templates several times with different authors so we end up
  // with ~120 tumblr posts.
  for (let cycle = 0; cycle < 3; cycle++) {
    for (let i = 0; i < T_POSTS.length; i++) {
      const tmpl = T_POSTS[i];
      const author = SEED_USERS[(i * 7 + cycle * 13) % SEED_USERS.length].handle;
      const tagPool = [...TUMBLR_TAGS];
      const tagCount = 6 + Math.floor(rng() * 6); // 6–11 tags
      const tags: string[] = [];
      while (tags.length < tagCount && tagPool.length) {
        const idx = Math.floor(rng() * tagPool.length);
        tags.push(tagPool.splice(idx, 1)[0]);
      }
      const photo = tmpl.image
        ? PHOTOS.filter((p) => p.topic === tmpl.topic)[
            (i + cycle) % PHOTOS.filter((p) => p.topic === tmpl.topic).length
          ]
        : undefined;

      const platform: Platform = "tumblr";
      const pred = predict({
        text: tmpl.body,
        tags,
        platform,
        imageDescription: photo?.alt,
      });
      const noteCount = Math.round(
        (200 + pred.probHigh * 9_500) * (0.6 + rng() * 0.9),
      );
      const reblogCount = Math.round(noteCount * (0.08 + rng() * 0.18));
      const commentCount = Math.round(noteCount * (0.02 + rng() * 0.06));

      const id = `post_t_${cycle}_${i}`;
      posts.push({
        id,
        authorHandle: author,
        platform,
        body: tmpl.body,
        imageUrl: photo ? photoUrl(photo.id) : undefined,
        imageAlt: photo?.alt,
        tags,
        noteCount,
        reblogCount,
        commentCount,
        topic: pred.features.topic.primary,
        sentimentLabel: pred.features.sentiment.label,
        sentimentScore: pred.features.sentiment.compound,
        predictedProb: pred.probHigh,
        createdAt: ago(rng, 90),
      });
    }
  }

  // ---- Reddit posts ----
  for (let cycle = 0; cycle < 2; cycle++) {
    for (let i = 0; i < R_POSTS.length; i++) {
      const tmpl = R_POSTS[i];
      const author = SEED_USERS[(i * 11 + cycle * 5) % SEED_USERS.length].handle;
      const tagPool = [...REDDIT_TAGS];
      const tagCount = 2 + Math.floor(rng() * 4);
      const tags: string[] = [];
      while (tags.length < tagCount && tagPool.length) {
        const idx = Math.floor(rng() * tagPool.length);
        tags.push(tagPool.splice(idx, 1)[0]);
      }
      const photoOpt =
        rng() > 0.55
          ? PHOTOS.filter((p) => p.topic === tmpl.topic)[
              (i + cycle) % Math.max(1, PHOTOS.filter((p) => p.topic === tmpl.topic).length)
            ]
          : undefined;

      const platform: Platform = "reddit";
      const pred = predict({
        text: tmpl.body,
        tags,
        platform,
        imageDescription: photoOpt?.alt,
      });
      const noteCount = Math.round(
        (80 + pred.probHigh * 3_400) * (0.6 + rng() * 0.9),
      );
      const commentCount = Math.round(noteCount * (0.18 + rng() * 0.22));
      const reblogCount = Math.round(noteCount * (0.02 + rng() * 0.05));

      const id = `post_r_${cycle}_${i}`;
      posts.push({
        id,
        authorHandle: author,
        platform,
        title: tmpl.title,
        body: tmpl.body,
        imageUrl: photoOpt ? photoUrl(photoOpt.id) : undefined,
        imageAlt: photoOpt?.alt,
        tags,
        noteCount,
        reblogCount,
        commentCount,
        topic: pred.features.topic.primary,
        sentimentLabel: pred.features.sentiment.label,
        sentimentScore: pred.features.sentiment.compound,
        predictedProb: pred.probHigh,
        createdAt: ago(rng, 60),
      });
    }
  }

  // ---- Comments per post (3–8) ----
  for (const p of posts) {
    const target = 3 + Math.floor(rng() * 6);
    for (let j = 0; j < target; j++) {
      const author = pickHandle(rng, p.authorHandle);
      comments.push({
        id: `${p.id}_c${j}`,
        postId: p.id,
        authorHandle: author,
        body: COMMENTS[Math.floor(rng() * COMMENTS.length)],
        createdAt: ago(rng, 30),
        noteCount: Math.floor(rng() * 80),
      });
    }
  }

  // ---- Reblogs (a few high-engagement posts get reblogged) ----
  posts
    .filter((p) => p.platform === "tumblr" && p.predictedProb > 0.6)
    .slice(0, 24)
    .forEach((p) => {
      const reblogger = pickHandle(rng, p.authorHandle);
      reblogs.push({
        userHandle: reblogger,
        postId: p.id,
        createdAt: ago(rng, 14),
      });
    });

  // ---- Follows: build a directed graph ----
  const follows: SocialFollow[] = [];
  for (const u of SEED_USERS) {
    const targetCount = Math.min(
      Math.max(8, Math.floor(u.following / 50)),
      SEED_USERS.length - 1,
    );
    const candidates = SEED_USERS.filter((x) => x.handle !== u.handle);
    for (let i = 0; i < targetCount; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const target = candidates.splice(idx, 1)[0];
      if (!target) break;
      follows.push({
        followerHandle: u.handle,
        followingHandle: target.handle,
        createdAt: ago(rng, 200),
      });
    }
  }

  // Make sure satvik follows a healthy mix so the home feed is dense.
  for (const t of [
    "mira.fog", "kojiro.frame", "iris.atlas", "sun.kim", "aria.lens",
    "zoe.adventure", "finn.alpine", "thalia.tides", "lila.sketch",
    "vega.night", "juno.minimal", "eli.lake", "freya.north", "priya.docs",
    "yuna.kr", "arjun.train", "amalia.color", "jules.atlas",
  ]) {
    if (!follows.find((f) => f.followerHandle === "satvik" && f.followingHandle === t)) {
      follows.push({ followerHandle: "satvik", followingHandle: t, createdAt: ago(rng, 200) });
    }
  }

  // Sort posts newest first
  posts.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

  return { users: SEED_USERS, posts, comments, follows, reblogs };
}
