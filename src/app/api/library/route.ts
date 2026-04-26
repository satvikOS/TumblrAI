import { NextRequest, NextResponse } from "next/server";
import { LIBRARY } from "@/lib/library";

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  const items = platform
    ? LIBRARY.filter((l) => l.platform === platform)
    : LIBRARY;
  return NextResponse.json({ items });
}
