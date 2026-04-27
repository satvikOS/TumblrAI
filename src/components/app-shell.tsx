"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PenSquare,
  TrendingUp,
  Sparkles,
  CalendarDays,
  MessagesSquare,
  ImageIcon,
  Settings,
  Bell,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-provider";
import { Logo3D } from "@/components/logo-3d";
import { UserAvatar } from "@/components/social/avatar";
import { SearchBar } from "@/components/social/search-bar";

const PRIMARY = [
  { href: "/app", label: "Home", icon: Home, exact: true },
  { href: "/app/explore", label: "Explore", icon: Compass },
  { href: "/app/trends", label: "Trends", icon: TrendingUp },
];

const CREATE = [
  { href: "/app/compose", label: "Composer", icon: PenSquare },
  { href: "/app/agent", label: "Agent", icon: Sparkles },
  { href: "/app/visual", label: "Visual lab", icon: ImageIcon },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
];

const ACCOUNT = [
  { href: "/app/chat", label: "Chat", icon: MessagesSquare },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { id: string; handle: string; name: string; email: string; tier: string; avatarSeed: string };
}) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="grid min-h-svh grid-cols-[260px_1fr]">
      <aside className="flex flex-col border-r border-border-soft bg-background/80 backdrop-blur">
        <Link href="/app" className="flex h-14 items-center gap-2.5 px-5">
          <Logo3D size={28} withWordmark />
        </Link>

        <nav className="flex-1 space-y-5 px-3 py-2">
          <NavGroup items={PRIMARY} pathname={pathname} isActive={isActive} />
          <NavGroup label="Create" items={CREATE} pathname={pathname} isActive={isActive} />
          <NavGroup label="Account" items={ACCOUNT} pathname={pathname} isActive={isActive} />
        </nav>

        <div className="border-t border-border-soft p-3">
          <Link
            href={`/app/${user.handle}`}
            className="group flex items-center gap-3 rounded-md p-2 transition hover:bg-muted"
          >
            <UserAvatar seed={user.avatarSeed} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">@{user.handle}</div>
            </div>
            <Badge variant="outline" className="capitalize">{user.tier}</Badge>
          </Link>
          <div className="mt-2 flex items-center justify-between px-1">
            <div className="text-[11px] text-muted-foreground">v0.2 · live</div>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border-soft bg-background/80 px-6 backdrop-blur">
          <SearchBar />
          <div className="flex items-center gap-2">
            <Link
              href="/app/compose"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <PenSquare className="h-4 w-4" /> New post
            </Link>
            <button
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <Link
              href={`/app/${user.handle}`}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="profile"
            >
              <UserIcon className="h-4 w-4" />
            </Link>
          </div>
        </header>
        <main className="bg-background">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({
  label,
  items,
  isActive,
}: {
  label?: string;
  items: { href: string; label: string; icon: React.ElementType; exact?: boolean }[];
  pathname: string;
  isActive: (h: string, e?: boolean) => boolean;
}) {
  return (
    <div>
      {label && (
        <div className="px-3 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
      )}
      <div className="space-y-0.5">
        {items.map((n) => {
          const active = isActive(n.href, n.exact);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground-soft hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
              <span className="flex-1 truncate">{n.label}</span>
              {active && <span className="h-1 w-1 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

