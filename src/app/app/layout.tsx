import { redirect } from "next/navigation";
import { getSession, signIn } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user = await getSession();
  if (!user) {
    // Mock auth: auto-sign-in the demo user on first visit.
    user = await signIn("u_satvik");
    if (!user) redirect("/");
  }
  return <AppShell user={user}>{children}</AppShell>;
}
