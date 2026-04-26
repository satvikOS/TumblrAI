import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarSeed: string;
  tier: "free" | "creator" | "studio";
};

const COOKIE = "nc_session";

const MOCK_USERS: SessionUser[] = [
  {
    id: "u_satvik",
    email: "satvik@notecount.ai",
    name: "Satvik Adyanthaya",
    avatarSeed: "satvik",
    tier: "studio",
  },
  {
    id: "u_demo",
    email: "demo@notecount.ai",
    name: "Demo Creator",
    avatarSeed: "demo",
    tier: "creator",
  },
];

export async function getSession(): Promise<SessionUser | null> {
  const c = await cookies();
  const id = c.get(COOKIE)?.value;
  if (!id) return null;
  return MOCK_USERS.find((u) => u.id === id) ?? null;
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}

export async function signIn(userId?: string): Promise<SessionUser> {
  const c = await cookies();
  const target = MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0];
  c.set(COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return target;
}

export async function signOut() {
  const c = await cookies();
  c.delete(COOKIE);
}

export function listMockUsers(): SessionUser[] {
  return MOCK_USERS;
}

export function newId(prefix: string) {
  return `${prefix}_${nanoid(10)}`;
}
