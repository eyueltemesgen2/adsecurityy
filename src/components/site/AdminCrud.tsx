import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminDelete, adminList, adminUpsert } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageField } from "./ImageField";

export type AdminTable =
  | "products"
  | "product_categories"
  | "services"
  | "service_categories"
  | "gallery_items"
  | "testimonials"
  | "faqs"
  | "homepage_sections"
  | "pages"
  | "navigation_items"
  | "footer_sections"
  | "social_links"
  | "announcements";

export type AdminField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "switch" | "select" | "image" | "images" | "json" | "date";
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  wide?: boolean;
  folder?: string;
};

export type AdminRow = Record<string, unknown> & { id: string };

function defaultsFor(fields: AdminField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "switch") out[field.name] = false;
    else if (field.type === "number") out[field.name] = 0;
    else if (field.type === "images") out[field.name] = [];
    else if (field.type === "json") out[field.name] = "";
    else out[field.name] = "";
  }
  return out;
}

function toFormValues(row: AdminRow, fields: AdminField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const value = row[field.name];
    if (field.type === "json") out[field.name] = value == null ? "" : JSON.stringify(value, null, 2);
    else if (field.type === "images") out[field.name] = Array.isArray(value) ? value : [];
    else if (field.type === "switch") out[field.name] = Boolean(value);
    else out[field.name] = value ?? "";
  }
  return out;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AdminCrud({
  table,
  singular,
  fields,
  columns,
  searchColumns,
  orderBy,
  ascending,
  emptyHint,
}: {
  table: AdminTable;
  singular: string;
  fields: AdminField[];
  columns: { label: string; render: (row: AdminRow) => ReactNode; className?: string }[];
  searchColumns?: string[];
  orderBy?: string;
  ascending?: boolean;
  emptyHint?: string;
}) {
  const list = useServerFn(adminList);
  const upsert = useServerFn(adminUpsert);
  const remove = useServerFn(adminDelete);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>(() => defaultsFor(fields));

  const queryKey = ["admin-crud", table, search, page, orderBy] as const;
  const query = useQuery({
    queryKey,
    queryFn: () =>
      list({
        data: {
          table,
          search: search || undefined,
          searchColumns: search ? (searchColumns ?? ["name"]) : undefined,
          page,
          perPage: 25,
          ...(orderBy ? { orderBy } : {}),
          ...(ascending === undefined ? {} : { ascending }),
        },
      }),
  });

  const rows = (query.data?.rows ?? []) as AdminRow[];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 25));

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = values[field.name];
        if (field.type === "number") {
          payload[field.name] = raw === "" || raw === null ? null : Number(raw);
        } else if (field.type === "json") {
          const text = String(raw ?? "").trim();
          if (!text) payload[field.name] = field.name === "content" ? {} : [];
          else payload[field.name] = JSON.parse(text);
        } else if (field.type === "switch") {
          payload[field.name] = Boolean(raw);
        } else if (field.type === "images") {
          payload[field.name] = Array.isArray(raw) ? raw : [];
        } else if (field.type === "select" || field.type === "date") {
          payload[field.name] = raw === "" ? null : raw;
        } else {
          payload[field.name] = String(raw ?? "").trim() || null;
        }
      }
      if (fields.some((f) => f.name === "slug") && !payload["slug"]) {
        payload["slug"] = slugify(String(payload["name"] ?? payload["title"] ?? ""));
      }
      return upsert({ data: { table, ...(editingId ? { id: editingId } : {}), values: payload } });
    },
    onSuccess: () => {
      toast.success(editingId ? `${singular} updated` : `${singular} created`);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-crud", table] });
    },
    onError: (error: Error) => toast.error(error.message || `Could not save this ${singular.toLowerCase()}`),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { table, id } }),
    onSuccess: () => {
      toast.success(`${singular} deleted`);
      void queryClient.invalidateQueries({ queryKey: ["admin-crud", table] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not delete this item"),
  });

  const dialogTitle = useMemo(
    () => (editingId ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`),
    [editingId, singular],
  );

  function openNew() {
    setEditingId(null);
    setValues(defaultsFor(fields));
    setOpen(true);
  }

  function openEdit(row: AdminRow) {
    setEditingId(row.id);
    setValues(toFormValues(row, fields));
    setOpen(true);
  }

  function set(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search…"
          className="max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{total} total</span>
          <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-1.5 h-4 w-4" /> New {singular.toLowerCase()}
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {emptyHint ?? `Create your first ${singular.toLowerCase()}.`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column.label} className="px-4 py-3 font-semibold">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border align-middle">
                  {columns.map((column) => (
                    <td key={column.label} className={`px-4 py-3 ${column.className ?? ""}`}>
                      {column.render(row)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) {
                            del.mutate(row.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className={field.wide || field.type === "textarea" || field.type === "json" ? "sm:col-span-2" : ""}>
                {field.type === "switch" ? (
                  <div className="flex items-center justify-between border border-border px-3 py-2.5">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Switch
                      id={field.name}
                      checked={Boolean(values[field.name])}
                      onCheckedChange={(checked) => set(field.name, checked)}
                    />
                  </div>
                ) : (
                  <>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <div className="mt-1.5">
                      {field.type === "textarea" || field.type === "json" ? (
                        <Textarea
                          id={field.name}
                          rows={field.type === "json" ? 6 : 4}
                          value={String(values[field.name] ?? "")}
                          placeholder={field.placeholder}
                          onChange={(event) => set(field.name, event.target.value)}
                          className={field.type === "json" ? "font-mono text-xs" : ""}
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={field.name}
                          value={String(values[field.name] ?? "")}
                          onChange={(event) => set(field.name, event.target.value)}
                          className="h-10 w-full border border-input bg-background px-3 text-sm"
                        >
                          <option value="">— none —</option>
                          {(field.options ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "image" ? (
                        <ImageField
                          value={String(values[field.name] ?? "")}
                          folder={field.folder}
                          onChange={(url) => set(field.name, url)}
                        />
                      ) : field.type === "images" ? (
                        <ImageField
                          multiple
                          values={(values[field.name] as string[]) ?? []}
                          folder={field.folder}
                          onChangeMany={(urls) => set(field.name, urls)}
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          value={String(values[field.name] ?? "")}
                          placeholder={field.placeholder}
                          onChange={(event) => set(field.name, event.target.value)}
                        />
                      )}
                    </div>
                  </>
                )}
                {field.help ? <p className="mt-1 text-xs text-muted-foreground">{field.help}</p> : null}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
