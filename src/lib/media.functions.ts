import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/x-icon"];

/**
 * Uploads an image to the public media area. Admins can upload anything;
 * customers may only upload their own avatar.
 */
export const uploadImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z.string().min(1).max(200),
        contentType: z.string().min(3).max(120),
        base64: z.string().min(10),
        folder: z.string().max(40).optional(),
        altText: z.string().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!IMAGE_TYPES.includes(data.contentType)) throw new Error("Only image files are allowed.");
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("Images must be 8MB or smaller.");

    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = Boolean(adminRole);
    const folder = isAdmin ? (data.folder || "general").replace(/[^a-z0-9-]/gi, "") : "avatars";
    if (!isAdmin && folder !== "avatars") throw new Error("Forbidden.");

    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = isAdmin
      ? `public/${folder}/${Date.now()}-${safe}`
      : `public/avatars/${context.userId}-${Date.now()}-${safe}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (error) throw new Error("Upload failed. Please try again.");

    const url = `/api/public/file/${path}`;
    if (isAdmin) {
      await context.supabase.from("media").insert({
        filename: safe,
        url,
        mime_type: data.contentType,
        size_bytes: bytes.byteLength,
        alt_text: data.altText ?? null,
        folder,
        uploaded_by: context.userId,
      });
    }
    return { url, path };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Forbidden.");
    const { data: row } = await context.supabase.from("media").select("*").eq("id", data.id).maybeSingle();
    if (!row) return { ok: true };
    const path = row.url.replace("/api/public/file/", "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from("media").remove([path]);
    await context.supabase.from("media").delete().eq("id", data.id);
    return { ok: true };
  });
