import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { adminList, adminDelete } from "@/lib/admin.functions";
import { uploadImage } from "@/lib/media.functions";
import { AdminLayout } from "@/components/site/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaImage } from "@/components/site/Media";

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => ({
    meta: [
      { title: "Admin Media Library — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMediaPage,
});

function AdminMediaPage() {
  const list = useServerFn(adminList);
  const remove = useServerFn(adminDelete);
  const upload = useServerFn(uploadImage);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin-crud", "media", search, page],
    queryFn: () =>
      list({
        data: {
          table: "media",
          search: search || undefined,
          searchColumns: ["filename", "alt_text", "folder"],
          page,
          perPage: 24,
          orderBy: "created_at",
        },
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      for (const file of Array.from(files)) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });
        await upload({
          data: {
            filename: file.name,
            contentType: file.type,
            base64,
            folder: "general",
          },
        });
      }
    },
    onSuccess: () => {
      toast.success("Images uploaded");
      void queryClient.invalidateQueries({ queryKey: ["admin-crud", "media"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { table: "media", id } }),
    onSuccess: () => {
      toast.success("Media deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-crud", "media"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (query.data?.rows ?? []) as Record<string, unknown>[];

  return (
    <AdminLayout title="Media library" subtitle="Upload and manage images used across your site.">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search media"
            className="max-w-xs"
          />
          <label className="ml-auto">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files?.length && uploadMutation.mutate(e.target.files)}
            />
            <Button asChild className="cursor-pointer bg-accent text-accent-foreground hover:bg-accent/90">
              <span>
                <Upload className="mr-1.5 h-4 w-4" />
                {uploadMutation.isPending ? "Uploading…" : "Upload images"}
              </span>
            </Button>
          </label>
        </div>

        {query.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-border bg-card p-10 text-center">
            <p className="font-semibold">No media uploaded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload images to use across your site.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((row) => (
              <div key={row.id as string} className="group relative border border-border bg-card">
                <MediaImage src={row.url as string} alt={row.alt_text as string ?? row.filename as string} className="aspect-square w-full" />
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{row.filename as string}</p>
                  <p className="text-xs text-muted-foreground">{row.folder as string ?? "general"}</p>
                </div>
                <button
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-sm bg-background/80 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    if (window.confirm("Delete this image?")) del.mutate(row.id as string);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
