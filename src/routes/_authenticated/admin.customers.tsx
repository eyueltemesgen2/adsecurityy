import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { adminListCustomers, adminGetCustomer, adminSetCustomerActive } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/site/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({
    meta: [
      { title: "Admin Customers — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCustomersPage,
});

function AdminCustomersPage() {
  const list = useServerFn(adminListCustomers);
  const getCustomer = useServerFn(adminGetCustomer);
  const setActive = useServerFn(adminSetCustomerActive);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin-customers", search, page],
    queryFn: () => list({ data: { search: search || undefined, page } }),
  });

  const detailQuery = useQuery({
    queryKey: ["admin-customer", selectedId],
    enabled: Boolean(selectedId),
    queryFn: () => getCustomer({ data: { id: selectedId! } }),
  });

  const toggleActive = useMutation({
    mutationFn: (isActive: boolean) => setActive({ data: { id: selectedId!, is_active: isActive } }),
    onSuccess: () => {
      toast.success("Customer updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (query.data?.rows ?? []) as Record<string, unknown>[];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 25));

  return (
    <AdminLayout title="Customers" subtitle="View and manage customer accounts.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, phone"
            className="max-w-xs"
          />
          <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-10 text-center">
            <p className="font-semibold">No customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id as string}
                    className="cursor-pointer border-t border-border hover:bg-muted/30"
                    onClick={() => setSelectedId(row.id as string)}
                  >
                    <td className="px-4 py-3 font-semibold">{row.full_name as string ?? "—"}</td>
                    <td className="px-4 py-3">{row.email as string}</td>
                    <td className="px-4 py-3">{row.phone as string ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={row.is_active ? "text-success" : "text-destructive"}>
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
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
              <DialogTitle>Customer details</DialogTitle>
            </DialogHeader>
            {detailQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : detailQuery.data ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Name</p>
                    <p className="font-semibold">{detailQuery.data.profile?.full_name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Email</p>
                    <p>{detailQuery.data.profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Phone</p>
                    <p>{detailQuery.data.profile?.phone ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Roles</p>
                    <p>{detailQuery.data.roles.join(", ") || "customer"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Orders ({detailQuery.data.orders.length})</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {detailQuery.data.orders.map((order) => (
                      <li key={order.id} className="flex justify-between border-b border-border py-1">
                        <span>{order.order_number}</span>
                        <span>ETB {formatPrice(order.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Service requests ({detailQuery.data.requests.length})</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {detailQuery.data.requests.map((req) => (
                      <li key={req.id} className="flex justify-between border-b border-border py-1">
                        <span>{req.request_number}</span>
                        <span>{req.service_type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={() => toggleActive.mutate(!detailQuery.data!.profile?.is_active)}
                  variant="outline"
                  disabled={toggleActive.isPending}
                >
                  {detailQuery.data.profile?.is_active ? "Deactivate account" : "Activate account"}
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
