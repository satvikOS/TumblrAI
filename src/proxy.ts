import { NextResponse, type NextRequest } from "next/server";

// Mock auth: when a visitor hits any /app/* route without a session cookie,
// auto-issue one for the demo user. This runs BEFORE Server Components, so
// it can legally mutate cookies (which the layout cannot).
const SESSION_COOKIE = "nc_session";
const DEFAULT_USER = "u_satvik";

export function proxy(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/app")) {
    return NextResponse.next();
  }
  if (req.cookies.get(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const res = NextResponse.next();
  res.cookies.set(SESSION_COOKIE, DEFAULT_USER, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export const config = {
  matcher: ["/app/:path*"],
};
