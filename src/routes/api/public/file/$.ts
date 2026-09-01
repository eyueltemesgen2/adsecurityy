import { createFileRoute } from "@tanstack/react-router";

/**
 * Serves images from the private "media" storage bucket to the public website.
 * Only files under the "public/" prefix are exposed; customer uploads under
 * "user/<id>/" are never served here.
 */
export const Route = createFileRoute("/api/public/file/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!path.startsWith("public/") || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("media").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
