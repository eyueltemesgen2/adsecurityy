import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { OrderStatus, ServiceRequestStatus } from "./db-types";

/** Tables an admin may manage through the generic CMS endpoints. */
const MANAGED_TABLES = [
  "products",
  "product_categories",
  "services",
  "service_categories",
  "gallery_items",
  "testimonials",
  "faqs",
  "homepage_sections",
  "pages",
  "navigation_items",
  "footer_sections",
  "social_links",
  "announcements",
  "media",
] as const;
type ManagedTable = (typeof MANAGED_TABLES)[number];

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: administrator access required.");
}

async function writeAudit(
  context: { supabase: any; userId: string; claims: any },
  entry: {
    action: string;
    entity?: string;
    entity_id?: string;
    description?: string;
    old_value?: unknown;
    new_value?: unknown;
  },
) {
  await context.supabase.from("audit_logs").insert({
    actor_id: context.userId,
    actor_email: context.claims?.email ?? null,
    action: entry.action,
    entity: entry.entity ?? null,
    entity_id: entry.entity_id ?? null,
    description: entry.description ?? null,
    old_value: (entry.old_value ?? null) as never,
    new_value: (entry.new_value ?? null) as never,
  });
}

const tableSchema = z.enum(MANAGED_TABLES);

/* ------------------------------ generic CMS ------------------------------ */

export const adminList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        table: tableSchema,
        search: z.string().optional(),
        searchColumns: z.array(z.string()).optional(),
        orderBy: z.string().optional(),
        ascending: z.boolean().optional(),
        page: z.number().int().min(1).optional(),
        perPage: z.number().int().min(1).max(200).optional(),
        select: z.string().optional(),
        filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const perPage = data.perPage ?? 25;
    const page = data.page ?? 1;
    let query = context.supabase
      .from(data.table as ManagedTable)
      .select(data.select ?? "*", { count: "exact" });
    if (data.search && data.searchColumns?.length) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(data.searchColumns.map((c) => `${c}.ilike.%${term}%`).join(","));
    }
    for (const [key, value] of Object.entries(data.filters ?? {})) {
      if (value === null) continue;
      query = query.eq(key, value);
    }
    query = query.order(data.orderBy ?? "created_at", { ascending: data.ascending ?? false });
    const from = (page - 1) * perPage;
    const { data: rows, count, error } = await query.range(from, from + perPage - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, perPage };
  });

export const adminUpsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ table: tableSchema, id: z.string().optional(), values: z.record(z.string(), z.unknown()) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const values = data.values as Record<string, never>;
    if (data.id) {
      const before = await context.supabase.from(data.table).select("*").eq("id", data.id).maybeSingle();
      const { data: row, error } = await context.supabase
        .from(data.table)
        .update(values)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(context, {
        action: "update",
        entity: data.table,
        entity_id: data.id,
        description: `Updated ${data.table}`,
        old_value: before.data,
        new_value: row,
      });
      return { row };
    }
    const { data: row, error } = await context.supabase.from(data.table).insert(values).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(context, {
      action: "create",
      entity: data.table,
      entity_id: (row as { id?: string })?.id,
      description: `Created ${data.table}`,
      new_value: row,
    });
    return { row };
  });

export const adminUpsertByKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ key: z.string().min(2).max(60), value: z.record(z.string(), z.unknown()) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const before = await context.supabase.from("site_settings").select("*").eq("key", data.key).maybeSingle();
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: data.key, value: data.value as never }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    await writeAudit(context, {
      action: "settings_update",
      entity: "site_settings",
      entity_id: data.key,
      description: `Updated ${data.key} settings`,
      old_value: before.data?.value,
      new_value: data.value,
    });
    return { ok: true };
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ table: tableSchema, id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const before = await context.supabase.from(data.table).select("*").eq("id", data.id).maybeSingle();
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context, {
      action: "delete",
      entity: data.table,
      entity_id: data.id,
      description: `Deleted from ${data.table}`,
      old_value: before.data,
    });
    return { ok: true };
  });

/* ------------------------------- dashboard ------------------------------- */

export const adminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const [orders, requests, products, messages, profiles] = await Promise.all([
      supabase.from("orders").select("id, status, total, created_at").order("created_at"),
      supabase.from("service_requests").select("id, status, created_at").order("created_at"),
      supabase.from("products").select("id, name, stock_quantity, is_published"),
      supabase.from("contact_messages").select("id, is_read, created_at"),
      supabase.from("profiles").select("id, created_at").order("created_at"),
    ]);
    const orderRows = orders.data ?? [];
    const requestRows = requests.data ?? [];
    const productRows = products.data ?? [];
    const monthKey = (iso: string) => iso.slice(0, 7);
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const series = months.map((month) => ({
      month,
      orders: orderRows.filter((o) => monthKey(o.created_at) === month).length,
      revenue: orderRows
        .filter((o) => monthKey(o.created_at) === month && o.status !== "cancelled")
        .reduce((sum, o) => sum + Number(o.total), 0),
      customers: (profiles.data ?? []).filter((p) => monthKey(p.created_at) === month).length,
      requests: requestRows.filter((r) => monthKey(r.created_at) === month).length,
    }));
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    return {
      stats: {
        totalCustomers: (profiles.data ?? []).length,
        newCustomers: (profiles.data ?? []).filter((p) => p.created_at >= thirtyDaysAgo).length,
        totalOrders: orderRows.length,
        pendingOrders: orderRows.filter((o) => o.status === "pending").length,
        completedOrders: orderRows.filter((o) => o.status === "completed").length,
        revenue: orderRows
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + Number(o.total), 0),
        totalRequests: requestRows.length,
        pendingRequests: requestRows.filter((r) => !["completed", "cancelled"].includes(r.status)).length,
        totalProducts: productRows.length,
        lowStock: productRows.filter((p) => p.stock_quantity <= 5).length,
        unreadMessages: (messages.data ?? []).filter((m) => !m.is_read).length,
      },
      series,
      lowStockProducts: productRows
        .filter((p) => p.stock_quantity <= 5)
        .slice(0, 8)
        .map((p) => ({ id: p.id, name: p.name, stock_quantity: p.stock_quantity })),
    };
  });

/* --------------------------------- orders --------------------------------- */

export const adminListOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ search: z.string().optional(), status: z.string().optional(), page: z.number().optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const perPage = 25;
    const page = data.page ?? 1;
    let query = context.supabase.from("orders").select("*", { count: "exact" });
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`order_number.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`);
    }
    if (data.status) query = query.eq("status", data.status as OrderStatus);
    const from = (page - 1) * perPage;
    const { data: rows, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, perPage };
  });

export const adminGetOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: order } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .maybeSingle();
    let customer = null;
    if (order?.user_id) {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("*")
        .eq("id", order.user_id)
        .maybeSingle();
      customer = profile;
    }
    return { order, customer };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z
          .enum(["pending", "confirmed", "processing", "ready", "out_for_delivery", "completed", "cancelled"])
          .optional(),
        internal_notes: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const before = await context.supabase.from("orders").select("*").eq("id", data.id).maybeSingle();
    const patch: Record<string, unknown> = {};
    if (data.status) patch["status"] = data.status as OrderStatus;
    if (data.internal_notes !== undefined) patch["internal_notes"] = data.internal_notes;
    const { data: order, error } = await context.supabase
      .from("orders")
      .update(patch as never)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data.status && before.data && before.data.status !== data.status && order.user_id) {
      await context.supabase.from("notifications").insert({
        user_id: order.user_id,
        title: `Order ${order.order_number} is now ${data.status.replace(/_/g, " ")}`,
        body: "Open your order to see the latest details.",
        kind: "order",
        link: `/account/orders/${order.id}`,
      });
    }
    await writeAudit(context, {
      action: "order_update",
      entity: "orders",
      entity_id: data.id,
      description: data.status ? `Order status changed to ${data.status}` : "Order notes updated",
      old_value: before.data,
      new_value: order,
    });
    return { order };
  });

/* ---------------------------- service requests ---------------------------- */

export const adminListRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ search: z.string().optional(), status: z.string().optional(), page: z.number().optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const perPage = 25;
    const page = data.page ?? 1;
    let query = context.supabase.from("service_requests").select("*", { count: "exact" });
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term)
        query = query.or(
          `request_number.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%,location.ilike.%${term}%`,
        );
    }
    if (data.status) query = query.eq("status", data.status as ServiceRequestStatus);
    const from = (page - 1) * perPage;
    const { data: rows, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, perPage };
  });

export const adminGetRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: request } = await context.supabase
      .from("service_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const files = Array.isArray(request?.files) ? (request.files as { path: string; name: string }[]) : [];
    const signed: { name: string; url: string }[] = [];
    if (files.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      for (const file of files) {
        const { data: url } = await supabaseAdmin.storage.from("media").createSignedUrl(file.path, 3600);
        if (url?.signedUrl) signed.push({ name: file.name, url: url.signedUrl });
      }
    }
    return { request, files: signed };
  });

export const adminUpdateRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z
          .enum([
            "submitted",
            "under_review",
            "contacted",
            "scheduled",
            "in_progress",
            "completed",
            "cancelled",
          ])
          .optional(),
        internal_notes: z.string().max(4000).optional(),
        assigned_to: z.string().max(160).optional(),
        scheduled_at: z.string().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const before = await context.supabase
      .from("service_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    const patch: Record<string, unknown> = {};
    if (data.status) patch["status"] = data.status;
    if (data.internal_notes !== undefined) patch["internal_notes"] = data.internal_notes;
    if (data.assigned_to !== undefined) patch["assigned_to"] = data.assigned_to;
    if (data.scheduled_at !== undefined) patch["scheduled_at"] = data.scheduled_at || null;
    const { data: request, error } = await context.supabase
      .from("service_requests")
      .update(patch as never)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data.status && before.data && before.data.status !== data.status && request.user_id) {
      await context.supabase.from("notifications").insert({
        user_id: request.user_id,
        title: `Service request ${request.request_number} is now ${data.status.replace(/_/g, " ")}`,
        body: "Open your request to see the latest details.",
        kind: "service_request",
        link: `/account/requests/${request.id}`,
      });
    }
    await writeAudit(context, {
      action: "service_request_update",
      entity: "service_requests",
      entity_id: data.id,
      description: data.status ? `Request status changed to ${data.status}` : "Request updated",
      old_value: before.data,
      new_value: request,
    });
    return { request };
  });

/* ------------------------------- customers ------------------------------- */

export const adminListCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ search: z.string().optional(), page: z.number().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const perPage = 25;
    const page = data.page ?? 1;
    let query = context.supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, is_active, created_at", { count: "exact" });
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    }
    const from = (page - 1) * perPage;
    const { data: rows, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, perPage };
  });

export const adminGetCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const [profile, orders, requests, roles] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, is_active, created_at")
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase.from("orders").select("*").eq("user_id", data.id).order("created_at", { ascending: false }),
      context.supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", data.id)
        .order("created_at", { ascending: false }),
      context.supabase.from("user_roles").select("role").eq("user_id", data.id),
    ]);
    return {
      profile: profile.data,
      orders: orders.data ?? [],
      requests: requests.data ?? [],
      roles: (roles.data ?? []).map((r) => r.role),
    };
  });

export const adminSetCustomerActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await writeAudit(context, {
      action: "customer_update",
      entity: "profiles",
      entity_id: data.id,
      description: data.is_active ? "Customer account activated" : "Customer account deactivated",
    });
    return { ok: true };
  });

/* -------------------------------- messages -------------------------------- */

export const adminListMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ search: z.string().optional(), page: z.number().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const perPage = 25;
    const page = data.page ?? 1;
    let query = context.supabase.from("contact_messages").select("*", { count: "exact" });
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term)
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,subject.ilike.%${term}%,message.ilike.%${term}%`);
    }
    const from = (page - 1) * perPage;
    const { data: rows, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, perPage };
  });

export const adminUpdateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        is_read: z.boolean().optional(),
        admin_notes: z.string().max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch: Record<string, unknown> = {};
    if (data.is_read !== undefined) patch["is_read"] = data.is_read;
    if (data.admin_notes !== undefined) patch["admin_notes"] = data.admin_notes;
    const { error } = await context.supabase
      .from("contact_messages")
      .update(patch as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("contact_messages").delete().eq("id", data.id);
    await writeAudit(context, {
      action: "delete",
      entity: "contact_messages",
      entity_id: data.id,
      description: "Deleted contact message",
    });
    return { ok: true };
  });

/* ------------------------------- audit logs ------------------------------- */

export const adminListAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ page: z.number().optional(), search: z.string().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const perPage = 40;
    const page = data.page ?? 1;
    let query = context.supabase.from("audit_logs").select("*", { count: "exact" });
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`action.ilike.%${term}%,entity.ilike.%${term}%,actor_email.ilike.%${term}%`);
    }
    const from = (page - 1) * perPage;
    const { data: rows, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, perPage };
  });

export const adminLogAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ action: z.string().max(80), description: z.string().max(400).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await writeAudit(context, { action: data.action, description: data.description });
    return { ok: true };
  });

/* ------------------------------ admin notifications ----------------------- */

export const adminNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("is_admin", true)
      .order("created_at", { ascending: false })
      .limit(50);
    return { notifications: data ?? [] };
  });

export const adminMarkNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("is_admin", true)
      .is("read_at", null);
    return { ok: true };
  });
