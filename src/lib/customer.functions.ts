import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function notifyAdmins(title: string, body: string, link: string, kind: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("notifications").insert({ title, body, link, kind, is_admin: true });
}

/* ------------------------------- cart ------------------------------- */

export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cart_items")
      .select("id, quantity, product:products(*)")
      .order("created_at");
    if (error) throw new Error(error.message);
    return { items: (data ?? []).filter((row) => row.product) };
  });

export const setCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string().uuid(), quantity: z.number().int().min(0).max(99) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.quantity === 0) {
      await context.supabase.from("cart_items").delete().eq("product_id", data.productId);
      return { ok: true };
    }
    const { error } = await context.supabase
      .from("cart_items")
      .upsert(
        { user_id: context.userId, product_id: data.productId, quantity: data.quantity },
        { onConflict: "user_id,product_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const existing = await context.supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("product_id", data.productId)
      .maybeSingle();
    const quantity = Math.min(99, (existing.data?.quantity ?? 0) + data.quantity);
    const { error } = await context.supabase
      .from("cart_items")
      .upsert(
        { user_id: context.userId, product_id: data.productId, quantity },
        { onConflict: "user_id,product_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, quantity };
  });

export const clearCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("cart_items").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const mergeGuestCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) })),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    for (const item of data.items) {
      const existing = await context.supabase
        .from("cart_items")
        .select("quantity")
        .eq("product_id", item.productId)
        .maybeSingle();
      await context.supabase.from("cart_items").upsert(
        {
          user_id: context.userId,
          product_id: item.productId,
          quantity: Math.min(99, Math.max(existing.data?.quantity ?? 0, item.quantity)),
        },
        { onConflict: "user_id,product_id" },
      );
    }
    return { ok: true };
  });

/* ------------------------------ orders ------------------------------ */

const checkoutSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  address_line: z.string().trim().min(5).max(400),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  delivery_notes: z.string().trim().max(1000).optional().or(z.literal("")),
  save_address: z.boolean().optional(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cart = await supabase.from("cart_items").select("quantity, product:products(*)");
    const items = (cart.data ?? []).filter((row) => row.product);
    if (items.length === 0) throw new Error("Your cart is empty.");

    let subtotal = 0;
    const orderItems = items.map((row) => {
      const product = row.product as NonNullable<typeof row.product>;
      const sale = product.sale_price == null ? null : Number(product.sale_price);
      const unitPrice = sale && sale > 0 ? sale : Number(product.price);
      const lineTotal = unitPrice * row.quantity;
      subtotal += lineTotal;
      const images = Array.isArray(product.images) ? (product.images as string[]) : [];
      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: row.quantity,
        line_total: lineTotal,
        image_url: images[0] ?? null,
      };
    });

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || null,
        address_line: data.address_line,
        city: data.city || null,
        delivery_notes: data.delivery_notes || null,
        subtotal,
        total: subtotal,
      })
      .select()
      .single();
    if (error || !order) throw new Error(error?.message ?? "Order could not be created.");

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    await supabase.from("cart_items").delete().eq("user_id", userId);
    if (data.save_address) {
      await supabase.from("addresses").insert({
        user_id: userId,
        label: "Delivery address",
        full_name: data.full_name,
        phone: data.phone,
        address_line: data.address_line,
        city: data.city || null,
      });
    }
    await supabase.from("notifications").insert({
      user_id: userId,
      title: `Order ${order.order_number} received`,
      body: "We have received your order and will confirm it shortly.",
      kind: "order",
      link: `/account/orders/${order.id}`,
    });
    await notifyAdmins(
      `New order ${order.order_number}`,
      `${data.full_name} placed an order.`,
      `/admin/orders/${order.id}`,
      "order",
    );

    return { orderId: order.id, orderNumber: order.order_number };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .maybeSingle();
    return { order };
  });

/* -------------------------- service requests -------------------------- */

const serviceRequestSchema = z.object({
  service_type: z.string().trim().min(2).max(120),
  service_id: z.string().uuid().optional().nullable(),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  location: z.string().trim().min(3).max(400),
  property_type: z.string().trim().max(120).optional().or(z.literal("")),
  preferred_date: z.string().max(20).optional().or(z.literal("")),
  preferred_time: z.string().max(60).optional().or(z.literal("")),
  device_count: z.number().int().min(0).max(10000).optional().nullable(),
  current_system: z.string().trim().max(1000).optional().or(z.literal("")),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  additional_notes: z.string().trim().max(2000).optional().or(z.literal("")),
  files: z.array(z.object({ name: z.string(), path: z.string(), type: z.string().optional() })).optional(),
});

export const submitServiceRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => serviceRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error } = await context.supabase
      .from("service_requests")
      .insert({
        user_id: context.userId,
        service_id: data.service_id || null,
        service_type: data.service_type,
        full_name: data.full_name,
        phone: data.phone,
        email: data.email || null,
        location: data.location,
        property_type: data.property_type || null,
        preferred_date: data.preferred_date || null,
        preferred_time: data.preferred_time || null,
        device_count: data.device_count ?? null,
        current_system: data.current_system || null,
        description: data.description || null,
        additional_notes: data.additional_notes || null,
        files: data.files ?? [],
      })
      .select()
      .single();
    if (error || !request) throw new Error(error?.message ?? "Request could not be submitted.");

    await context.supabase.from("notifications").insert({
      user_id: context.userId,
      title: `Service request ${request.request_number} received`,
      body: "Our team will review your request and contact you.",
      kind: "service_request",
      link: `/account/requests/${request.id}`,
    });
    await notifyAdmins(
      `New service request ${request.request_number}`,
      `${data.full_name} requested ${data.service_type}.`,
      `/admin/service-requests/${request.id}`,
      "service_request",
    );
    return { id: request.id, requestNumber: request.request_number };
  });

export const listMyServiceRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

export const getMyServiceRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request } = await context.supabase
      .from("service_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    return { request };
  });

/* ---------------------------- account ---------------------------- */

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, roles, orders, requests, notifications, addresses] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("orders").select("id, status"),
      supabase.from("service_requests").select("id, status"),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("addresses").select("*").order("created_at", { ascending: false }),
    ]);
    const orderRows = orders.data ?? [];
    const requestRows = requests.data ?? [];
    return {
      profile: profile.data,
      isAdmin: (roles.data ?? []).some((r) => r.role === "admin"),
      addresses: addresses.data ?? [],
      notifications: notifications.data ?? [],
      stats: {
        totalOrders: orderRows.length,
        activeOrders: orderRows.filter((o) => !["completed", "cancelled"].includes(o.status)).length,
        completedOrders: orderRows.filter((o) => o.status === "completed").length,
        totalRequests: requestRows.length,
        activeRequests: requestRows.filter((r) => !["completed", "cancelled"].includes(r.status)).length,
        unreadNotifications: (notifications.data ?? []).filter((n) => !n.read_at).length,
      },
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(120),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
        avatar_url: z.string().trim().max(500).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        ...(data.avatar_url ? { avatar_url: data.avatar_url } : {}),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        label: z.string().trim().max(80).optional().or(z.literal("")),
        full_name: z.string().trim().max(120).optional().or(z.literal("")),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
        address_line: z.string().trim().min(5).max(400),
        city: z.string().trim().max(120).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      label: data.label || null,
      full_name: data.full_name || null,
      phone: data.phone || null,
      address_line: data.address_line,
      city: data.city || null,
    };
    const { error } = data.id
      ? await context.supabase.from("addresses").update(payload).eq("id", data.id)
      : await context.supabase.from("addresses").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase.from("addresses").delete().eq("id", data.id);
    return { ok: true };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    return { ok: true };
  });

/* ---------------------------- uploads ---------------------------- */

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
];

export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z.string().min(1).max(200),
        contentType: z.string().min(3).max(120),
        size: z.number().int().min(1).max(20 * 1024 * 1024),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!ALLOWED_TYPES.includes(data.contentType)) throw new Error("This file type is not allowed.");
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `user/${context.userId}/${Date.now()}-${safe}`;
    const { data: signed, error } = await context.supabase.storage
      .from("media")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Upload could not be prepared.");
    return { path, token: signed.token, signedUrl: signed.signedUrl };
  });
