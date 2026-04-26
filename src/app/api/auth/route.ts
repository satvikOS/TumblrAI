import { NextRequest, NextResponse } from "next/server";
import { getSession, listMockUsers, signIn, signOut } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  return NextResponse.json({ user, available: listMockUsers() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { userId?: string };
  const user = await signIn(body.userId);
  return NextResponse.json({ user });
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ ok: true });
}
