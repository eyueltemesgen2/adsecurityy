import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Package, Wrench } from "lucide-react";
import { getMyAccount } from "@/lib/customer.functions";
import { AccountLayout } from "@/components/site/AccountLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({
    meta: [
      { title: "My Dashboard — AD Security Camera Solution" },
      { name: "description", content: "Your orders, service requests and notifications in one place." },
      { property: "og:title", content: "Customer Dashboard" },
      { property: "og:description", content: "Track your orders and service requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountDashboard,
});

function AccountDashboard() {
  const fetchAccount = useServerFn(getMyAccount);
  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });
  const stats = account.data?.stats;

  const cards = [
    { label: "Total orders", value: stats?.totalOrders ?? 0, icon: Package, to: "/account/orders" as const },
    { label: "Active orders", value: stats?.activeOrders ?? 0, icon: Package, to: "/account/orders" as const },
    { label: "Service requests", value: stats?.totalRequests ?? 0, icon: Wrench, to: "/account/requests" as const },
    {
      label: "Unread notifications",
      value: stats?.unreadNotifications ?? 0,
      icon: Bell,
      to: "/account/notifications" as const,
    },
  ];

  return (
    <AccountLayout
      title={`Welcome${account.data?.profile?.full_name ? `, ${account.data.profile.full_name}` : ""}`}
      subtitle="Track your equipment orders and service jobs."
    >
      {account.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="border border-border bg-card p-5 transition-colors hover:border-accent/60"
            >
              <card.icon className="h-4 w-4 text-accent" />
              <p className="mt-3 font-display text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <h2 className="text-base font-bold">Need a new system or repair?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Book a survey and our engineers will contact you to confirm the details.
          </p>
          <Button asChild className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/request-service">Request a service</Link>
          </Button>
        </div>
        <div className="border border-border bg-card p-6">
          <h2 className="text-base font-bold">Shop equipment</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cameras, recorders, access control and networking hardware with warranty.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      </div>

      {(account.data?.notifications.length ?? 0) > 0 ? (
        <section className="mt-8">
          <h2 className="text-base font-bold">Recent updates</h2>
          <ul className="mt-4 divide-y divide-border border border-border bg-card">
            {account.data!.notifications.slice(0, 5).map((notification) => (
              <li key={notification.id} className="p-4">
                <p className="text-sm font-semibold">{notification.title}</p>
                {notification.body ? (
                  <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AccountLayout>
  );
}
