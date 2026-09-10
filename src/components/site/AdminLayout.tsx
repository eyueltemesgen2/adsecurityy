import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  Boxes,
  FileText,
  Gauge,
  Images,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { getMyAccount } from "@/lib/customer.functions";
import { PublicLayout } from "./PublicLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/admin", label: "Dashboard", icon: Gauge },
  { to: "/admin/orders", label: "Orders", icon: Package },
  { to: "/admin/requests", label: "Service requests", icon: Wrench },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/catalog", label: "Catalog", icon: Boxes },
  { to: "/admin/content", label: "Website content", icon: LayoutDashboard },
  { to: "/admin/pages", label: "Pages & SEO", icon: FileText },
  { to: "/admin/media", label: "Media library", icon: Images },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/activity", label: "Activity log", icon: Activity },
] as const;

export function AdminLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchAccount = useServerFn(getMyAccount);
  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });

  if (account.isLoading) {
    return (
      <PublicLayout>
        <div className="container-page space-y-4 py-16">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PublicLayout>
    );
  }

  if (!account.data?.isAdmin) {
    return (
      <PublicLayout>
        <div className="container-page py-24 text-center">
          <p className="eyebrow text-accent">Restricted area</p>
          <h1 className="mt-3 font-display text-3xl font-bold">Administrator access required</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            This section is only available to the AD Security Camera Solution team.
          </p>
          <Button asChild className="mt-6">
            <Link to="/account">Back to my account</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="border-b border-border bg-surface text-surface-foreground">
        <div className="container-page flex flex-wrap items-end justify-between gap-4 py-8">
          <div>
            <p className="eyebrow text-accent">Admin control center</p>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-surface-foreground/75">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[230px_1fr]">
        <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {LINKS.map((link) => {
            const active =
              pathname === link.to || (link.to !== "/admin" && pathname.startsWith(link.to));
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
