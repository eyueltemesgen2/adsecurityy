import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LayoutDashboard, Package, User2, Wrench } from "lucide-react";
import { PublicLayout } from "./PublicLayout";

const LINKS = [
  { to: "/account", label: "Dashboard", icon: LayoutDashboard },
  { to: "/account/orders", label: "My orders", icon: Package },
  { to: "/account/requests", label: "Service requests", icon: Wrench },
  { to: "/account/notifications", label: "Notifications", icon: Bell },
  { to: "/account/profile", label: "Profile", icon: User2 },
] as const;

export function AccountLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <PublicLayout>
      <div className="border-b border-border bg-surface text-surface-foreground">
        <div className="container-page py-10">
          <p className="eyebrow text-accent">Customer portal</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-surface-foreground/75">{subtitle}</p> : null}
        </div>
      </div>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {LINKS.map((link) => {
            const active = pathname === link.to || (link.to !== "/account" && pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex shrink-0 items-center gap-2 rounded-sm border px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </PublicLayout>
  );
}
