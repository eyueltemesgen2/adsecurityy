import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOrder } from "@/lib/customer.functions";
import { AccountLayout } from "@/components/site/AccountLayout";
import { StatusBadge } from "@/components/site/StatusBadge";
import { MediaImage } from "@/components/site/Media";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, ORDER_STATUSES } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/account/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order details — AD Security Camera Solution" },
      { name: "description", content: "Order items, totals and delivery status." },
      { property: "og:title", content: "Order details" },
      { property: "og:description", content: "Your order items and status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getMyOrder);
  const query = useQuery({ queryKey: ["my-order", id], queryFn: () => fetchOrder({ data: { id } }) });
  const order = query.data?.order;

  if (query.isLoading) {
    return (
      <AccountLayout title="Order details">
        <Skeleton className="h-64 w-full" />
      </AccountLayout>
    );
  }

  if (!order) {
    return (
      <AccountLayout title="Order details">
        <EmptyState
          title="Order not found"
          description="This order may have been removed."
          action={
            <Button asChild variant="outline">
              <Link to="/account/orders">Back to orders</Link>
            </Button>
          }
        />
      </AccountLayout>
    );
  }

  const flow = ORDER_STATUSES.filter((s) => s !== "cancelled");
  const currentIndex = flow.indexOf(order.status as (typeof flow)[number]);

  return (
    <AccountLayout title={`Order ${order.order_number}`} subtitle={new Date(order.created_at).toLocaleString()}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold">Status</h2>
              <StatusBadge status={order.status} />
            </div>
            {order.status !== "cancelled" ? (
              <ol className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {flow.map((step, index) => (
                  <li key={step} className="text-xs">
                    <div
                      className={`h-1 rounded-full ${index <= currentIndex ? "bg-accent" : "bg-border"}`}
                      aria-hidden
                    />
                    <p
                      className={`mt-2 capitalize ${
                        index <= currentIndex ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.replace(/_/g, " ")}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">This order was cancelled.</p>
            )}
          </div>

          <div className="border border-border bg-card">
            <h2 className="border-b border-border p-5 text-base font-bold">Items</h2>
            <ul className="divide-y divide-border">
              {(order.order_items ?? []).map((item) => (
                <li key={item.id} className="flex gap-4 p-4">
                  <MediaImage src={item.image_url} alt={item.product_name} className="h-16 w-16 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.product_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.quantity} × ETB {formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold">ETB {formatPrice(item.line_total)}</p>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-border p-5">
              <span className="font-semibold">Total</span>
              <span className="font-display text-lg font-bold">ETB {formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <aside className="h-fit border border-border bg-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide">Delivery details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{order.full_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{order.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-medium">
                {order.address_line}
                {order.city ? `, ${order.city}` : ""}
              </dd>
            </div>
            {order.delivery_notes ? (
              <div>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="font-medium">{order.delivery_notes}</dd>
              </div>
            ) : null}
          </dl>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/account/orders">Back to orders</Link>
          </Button>
        </aside>
      </div>
    </AccountLayout>
  );
}
