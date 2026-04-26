import { NextRequest, NextResponse } from "next/server";
import { engagementSeries, trendingTags, trendingTopics } from "@/lib/trends";

export async function GET(req: NextRequest) {
  const platform = (req.nextUrl.searchParams.get("platform") ?? "tumblr") as
    | "tumblr"
    | "reddit";
  return NextResponse.json({
    platform,
    tags: trendingTags(platform),
    topics: trendingTopics(platform),
    series: engagementSeries(platform),
    asOf: new Date().toISOString(),
  });
}
