import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminListAuditLogs } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/site/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  head: () => ({
    meta: [
      { title: "Admin Activity Log — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminActivityPage,
});

function AdminActivityPage() {
  const list = useServerFn(adminListAuditLogs);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin-audit-logs", search, page],
    queryFn: () => list({ data: { search: search || undefined, page } }),
  });

  const rows = (query.data?.rows ?? []) as Record<string, unknown>[];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 40));

  return (
    <AdminLayout title="Activity log" subtitle="Audit trail of all admin actions.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by action, entity, email"
            className="max-w-xs"
          />
          <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-10 text-center">
            <p className="font-semibold">No activity logged</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id as string} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">{row.action as string}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.entity as string ?? "—"}</td>
                    <td className="px-4 py-3">{row.description as string ?? "—"}</td>
                    <td className="px-4 py-3">{row.actor_email as string ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.created_at as string).toLocaleString()}
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
      </div>
    </AdminLayout>
  );
}
