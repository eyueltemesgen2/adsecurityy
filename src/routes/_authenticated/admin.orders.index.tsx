import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListOrders, adminGetOrder, adminUpdateOrder } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/site/AdminLayout";
import { StatusBadge } from "@/components/site/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatPrice, ORDER_STATUSES, statusLabel } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/admin/orders/")({
  head: () => ({
    meta: [
      { title: "Admin Orders — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const list = useServerFn(adminListOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");

  const query = useQuery({
    queryKey: ["admin-orders", search, statusFilter, page],
    queryFn: () =>
      list({ data: { search: search || undefined, status: statusFilter || undefined, page } }),
  });

  const getOrder = useServerFn(adminGetOrder);
  const updateOrder = useServerFn(adminUpdateOrder);
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ["admin-order", selectedId],
    enabled: Boolean(selectedId),
    queryFn: () => getOrder({ data: { id: selectedId! } }),
  });

  const save = useMutation({
    mutationFn: () =>
      updateOrder({
        data: {
          id: selectedId!,
          ...(newStatus ? { status: newStatus as never } : {}),
          ...(notes !== undefined ? { internal_notes: notes } : {}),
        },
      }),
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (query.data?.rows ?? []) as Record<string, unknown>[];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <AdminLayout title="Orders" subtitle="Manage and fulfill customer orders.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order #, name, phone"
            className="max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
          <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-10 text-center">
            <p className="font-semibold">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id as string}
                    className="cursor-pointer border-t border-border hover:bg-muted/30"
                    onClick={() => {
                      setSelectedId(row.id as string);
                      setNewStatus(row.status as string);
                      setNotes((row.internal_notes as string) ?? "");
                    }}
                  >
                    <td className="px-4 py-3 font-semibold">{row.order_number as string}</td>
                    <td className="px-4 py-3">{row.full_name as string}</td>
                    <td className="px-4 py-3">ETB {formatPrice(row.total as number)}</td>
                    <td className="px-4 py-3"><StatusBadge status={row.status as string} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.created_at as string).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 ? (
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-xs text-muted-foreground">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        ) : null}

        <Dialog open={Boolean(selectedId)} onOpenChange={(o) => !o && setSelectedId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order details</DialogTitle>
            </DialogHeader>
            {detailQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : detailQuery.data ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Order number</p>
                    <p className="font-semibold">{(detailQuery.data.order as Record<string, unknown>).order_number as string}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Customer</p>
                    <p className="font-semibold">{(detailQuery.data.order as Record<string, unknown>).full_name as string}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Phone</p>
                    <p>{(detailQuery.data.order as Record<string, unknown>).phone as string}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Total</p>
                    <p className="font-semibold">ETB {formatPrice((detailQuery.data.order as Record<string, unknown>).total as number)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Items</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {((detailQuery.data.order as Record<string, unknown>).order_items as Record<string, unknown>[])?.map((item, i) => (
                      <li key={i} className="flex justify-between border-b border-border py-1">
                        <span>{item.product_name as string} × {item.quantity as number}</span>
                        <span>ETB {formatPrice(item.subtotal as number)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1.5 h-10 w-full border border-input bg-background px-3 text-sm"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="notes">Internal notes</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1.5" />
                </div>
                <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {save.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
