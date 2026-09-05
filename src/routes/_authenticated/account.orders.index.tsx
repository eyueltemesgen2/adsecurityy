import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Package } from "lucide-react";
import { listMyOrders } from "@/lib/customer.functions";
import { AccountLayout } from "@/components/site/AccountLayout";
import { StatusBadge } from "@/components/site/StatusBadge";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/account/orders/")({
  head: () => ({
    meta: [
      { title: "My Orders — AD Security Camera Solution" },
      { name: "description", content: "Review your equipment orders and their current status." },
      { property: "og:title", content: "My Orders" },
      { property: "og:description", content: "Track your equipment orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const fetchOrders = useServerFn(listMyOrders);
  const query = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });

  return (
    <AccountLayout title="My orders" subtitle="Every order you have placed with us.">
      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : (query.data?.orders.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No orders yet"
          description="When you place an order it will appear here with live status updates."
          action={
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/products">Shop products</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {query.data!.orders.map((order) => (
            <li key={order.id} className="border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold">{order.order_number}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()} ·{" "}
                    {(order.order_items ?? []).length} item(s)
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-lg font-bold">ETB {formatPrice(order.total)}</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/account/orders/$id" params={{ id: order.id }}>
                    View details
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountLayout>
  );
}
