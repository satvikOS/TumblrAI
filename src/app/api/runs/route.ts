import { NextResponse } from "next/server";
import { runs } from "@/lib/store";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: runs.list(user.id) });
}
