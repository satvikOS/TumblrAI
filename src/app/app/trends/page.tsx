import { TrendsClient } from "./trends-client";

export const metadata = { title: "Trends" };

export default function TrendsPage() {
  return <TrendsClient initialPlatform="tumblr" />;
}
