import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { adminListMessages, adminUpdateMessage, adminDeleteMessage } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/site/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  head: () => ({
    meta: [
      { title: "Admin Messages — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const list = useServerFn(adminListMessages);
  const updateMsg = useServerFn(adminUpdateMessage);
  const deleteMsg = useServerFn(adminDeleteMessage);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const query = useQuery({
    queryKey: ["admin-messages", search, page],
    queryFn: () => list({ data: { search: search || undefined, page } }),
  });

  const rows = (query.data?.rows ?? []) as Record<string, unknown>[];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 25));

  const markRead = useMutation({
    mutationFn: (id: string) => updateMsg({ data: { id, is_read: true } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-messages"] }),
  });

  const saveNotes = useMutation({
    mutationFn: () => updateMsg({ data: { id: selectedId!, admin_notes: notes } }),
    onSuccess: () => {
      toast.success("Notes saved");
      void queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteMsg({ data: { id } }),
    onSuccess: () => {
      toast.success("Message deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      setSelectedId(null);
    },
  });

  return (
    <AdminLayout title="Messages" subtitle="Contact form submissions from your website.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, subject"
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
            <p className="font-semibold">No messages found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.id as string}
                className={`flex cursor-pointer items-start gap-3 border border-border bg-card p-4 hover:bg-muted/30 ${!row.is_read ? "border-l-4 border-l-accent" : ""}`}
                onClick={() => {
                  setSelectedId(row.id as string);
                  setNotes((row.admin_notes as string) ?? "");
                  if (!row.is_read) markRead.mutate(row.id as string);
                }}
              >
                {row.is_read ? <MailOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> : <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{row.name as string}</p>
                    <span className="text-xs text-muted-foreground">{new Date(row.created_at as string).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{row.email as string}</p>
                  <p className="mt-1 text-sm font-medium">{row.subject as string}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{row.message as string}</p>
                </div>
              </div>
            ))}
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
              <DialogTitle>Message details</DialogTitle>
            </DialogHeader>
            {selectedId ? (
              <div className="space-y-4">
                {(() => {
                  const row = rows.find((r) => r.id === selectedId)!;
                  return (
                    <div className="space-y-2">
                      <p><span className="text-xs uppercase text-muted-foreground">From:</span> <span className="font-semibold">{row.name as string}</span> ({row.email as string})</p>
                      <p><span className="text-xs uppercase text-muted-foreground">Subject:</span> {row.subject as string}</p>
                      <div className="border border-border bg-muted/30 p-4 text-sm">{row.message as string}</div>
                    </div>
                  );
                })()}
                <div>
                  <Label htmlFor="msg-notes">Admin notes</Label>
                  <Textarea id="msg-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1.5" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveNotes.mutate()} disabled={saveNotes.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Save notes
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive"
                    onClick={() => { if (window.confirm("Delete this message?")) del.mutate(selectedId!); }}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
