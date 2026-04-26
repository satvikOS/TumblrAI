"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenSquare,
  TrendingUp,
  Library,
  CalendarDays,
  MessagesSquare,
  ImageIcon,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/compose", label: "Composer", icon: PenSquare },
  { href: "/app/agent", label: "Agent runs", icon: Sparkles },
  { href: "/app/trends", label: "Trends", icon: TrendingUp },
  { href: "/app/library", label: "Library", icon: Library },
  { href: "/app/visual", label: "Visual lab", icon: ImageIcon },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/chat", label: "Chat", icon: MessagesSquare },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; tier: string };
}) {
  const pathname = usePathname();
  return (
    <div className="grid min-h-svh grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-r border-border bg-card/40">
        <div className="flex h-14 items-center gap-2 px-5 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">N</span>
          Notecount
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {NAV.map((n) => {
            const active =
              n.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md p-2">
            <Avatar>
              <AvatarFallback>{user.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Badge variant="outline" className="capitalize">{user.tier}</Badge>
          </div>
        </div>
      </aside>
      <main className="min-w-0 bg-background">{children}</main>
    </div>
  );
}
