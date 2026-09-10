import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { adminDashboard } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/site/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — AD Security Camera Solution" },
      { name: "description", content: "Business overview: orders, revenue, service requests and customers." },
      { property: "og:title", content: "Admin Dashboard" },
      { property: "og:description", content: "Business overview for AD Security Camera Solution." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardPage,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AdminDashboardPage() {
  const fetchDashboard = useServerFn(adminDashboard);
  const query = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fetchDashboard() });

  return (
    <AdminLayout title="Dashboard" subtitle="Live figures from your store and service operations.">
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <p className="border border-border bg-card p-6 text-sm text-destructive">
          {(query.error as Error).message}
        </p>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Revenue"
              value={`ETB ${formatPrice(query.data!.stats.revenue)}`}
              hint="Excludes cancelled orders"
            />
            <Stat
              label="Orders"
              value={String(query.data!.stats.totalOrders)}
              hint={`${query.data!.stats.pendingOrders} pending`}
            />
            <Stat
              label="Service requests"
              value={String(query.data!.stats.totalRequests)}
              hint={`${query.data!.stats.pendingRequests} open`}
            />
            <Stat
              label="Customers"
              value={String(query.data!.stats.totalCustomers)}
              hint={`${query.data!.stats.newCustomers} new in 30 days`}
            />
            <Stat label="Completed orders" value={String(query.data!.stats.completedOrders)} />
            <Stat label="Products" value={String(query.data!.stats.totalProducts)} />
            <Stat label="Low stock" value={String(query.data!.stats.lowStock)} hint="5 units or fewer" />
            <Stat label="Unread messages" value={String(query.data!.stats.unreadMessages)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-border bg-card p-5">
              <h2 className="font-display text-base font-bold">Orders & requests (6 months)</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={query.data!.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" name="Orders" />
                    <Bar dataKey="requests" fill="hsl(var(--accent))" name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="border border-border bg-card p-5">
              <h2 className="font-display text-base font-bold">Revenue & new customers</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={query.data!.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" name="Revenue" />
                    <Line type="monotone" dataKey="customers" stroke="hsl(var(--primary))" name="Customers" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">Low stock products</h2>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/catalog">Manage catalog</Link>
              </Button>
            </div>
            {query.data!.lowStockProducts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Stock levels are healthy.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border text-sm">
                {query.data!.lowStockProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between py-2">
                    <span>{product.name}</span>
                    <span className="font-semibold text-destructive">{product.stock_quantity} left</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
