import { ExploreClient } from "./explore-client";

export const metadata = { title: "Explore" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; platform?: string }>;
}) {
  const sp = await searchParams;
  return <ExploreClient initialTopic={sp.topic} initialPlatform={(sp.platform as "tumblr" | "reddit") ?? "tumblr"} />;
}
