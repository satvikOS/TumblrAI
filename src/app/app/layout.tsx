import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Middleware (src/middleware.ts) issues the mock session cookie before this
  // runs, so getSession() should always return a user. If it doesn't (e.g.
  // cookie blocked), bounce to the landing page.
  const user = await getSession();
  if (!user) redirect("/");
  return <AppShell user={user}>{children}</AppShell>;
}
