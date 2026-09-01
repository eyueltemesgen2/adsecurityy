import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPublicClient } from "./supabase-public.server";
import type {
  Announcement,
  Appearance,
  Branding,
  ContactInfo,
  FooterSettings,
  SeoSettings,
  SiteData,
} from "./db-types";

const DEFAULT_BRANDING: Branding = { company_name: "AD Security Camera Solution" };
const DEFAULT_CONTACT: ContactInfo = { email: "adsecuritycamerasolution@gmail.com" };
const DEFAULT_SEO: SeoSettings = {
  title: "AD Security Camera Solution",
  description: "Professional security systems, installation and technology solutions.",
};

export const getSiteData = createServerFn({ method: "GET" }).handler(async (): Promise<SiteData> => {
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();
  const [settings, navigation, footerSections, socialLinks, announcements] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase.from("navigation_items").select("*").eq("is_visible", true).order("sort_order"),
    supabase.from("footer_sections").select("*").eq("is_visible", true).order("sort_order"),
    supabase.from("social_links").select("*").eq("is_visible", true).order("sort_order"),
    supabase
      .from("announcements")
      .select("*")
      .eq("is_published", true)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const map = new Map((settings.data ?? []).map((row) => [row.key, row.value as Record<string, unknown>]));
  const announcement = (announcements.data?.[0] ?? null) as Announcement | null;
  const activeAnnouncement =
    announcement && (!announcement.ends_at || announcement.ends_at > nowIso) ? announcement : null;

  return {
    branding: { ...DEFAULT_BRANDING, ...(map.get("branding") as Branding | undefined) },
    contact: { ...DEFAULT_CONTACT, ...(map.get("contact") as ContactInfo | undefined) },
    seo: { ...DEFAULT_SEO, ...(map.get("seo") as SeoSettings | undefined) },
    appearance: (map.get("appearance") ?? {}) as Appearance,
    footerSettings: (map.get("footer") ?? {}) as FooterSettings,
    navigation: navigation.data ?? [],
    footerSections: footerSections.data ?? [],
    socialLinks: socialLinks.data ?? [],
    announcement: activeAnnouncement,
  };
});

export const getHomepage = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const [sections, services, products, testimonials, gallery, faqs] = await Promise.all([
    supabase.from("homepage_sections").select("*").eq("is_visible", true).order("sort_order"),
    supabase
      .from("services")
      .select("*")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("sort_order")
      .limit(6),
    supabase
      .from("products")
      .select("*, product_categories(name, slug)")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("testimonials").select("*").eq("is_published", true).order("sort_order").limit(6),
    supabase
      .from("gallery_items")
      .select("*")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("sort_order")
      .limit(6),
    supabase.from("faqs").select("*").eq("is_published", true).order("sort_order").limit(6),
  ]);
  return {
    sections: sections.data ?? [],
    services: services.data ?? [],
    products: products.data ?? [],
    testimonials: testimonials.data ?? [],
    gallery: gallery.data ?? [],
    faqs: faqs.data ?? [],
  };
});

const productListSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  availability: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sort: z.string().optional(),
  page: z.number().int().min(1).optional(),
  perPage: z.number().int().min(1).max(48).optional(),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => productListSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const perPage = data.perPage ?? 12;
    const page = data.page ?? 1;
    let query = supabase
      .from("products")
      .select("*, product_categories(name, slug)", { count: "exact" })
      .eq("is_published", true);

    if (data.search) {
      const term = data.search.replace(/[%,()]/g, " ").trim();
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,sku.ilike.%${term}%,brand.ilike.%${term}%,short_description.ilike.%${term}%`,
        );
      }
    }
    if (data.category) {
      const cat = await supabase
        .from("product_categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (cat.data) query = query.eq("category_id", cat.data.id);
    }
    if (data.brand) query = query.eq("brand", data.brand);
    if (data.availability === "in_stock") query = query.gt("stock_quantity", 0);
    if (data.availability === "out_of_stock") query = query.eq("stock_quantity", 0);
    if (data.minPrice != null) query = query.gte("price", data.minPrice);
    if (data.maxPrice != null) query = query.lte("price", data.maxPrice);

    switch (data.sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "featured":
        query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const from = (page - 1) * perPage;
    const { data: rows, count } = await query.range(from, from + perPage - 1);

    const [categories, brands] = await Promise.all([
      supabase.from("product_categories").select("*").eq("is_published", true).order("sort_order"),
      supabase.from("products").select("brand").eq("is_published", true),
    ]);

    return {
      products: rows ?? [],
      total: count ?? 0,
      page,
      perPage,
      categories: categories.data ?? [],
      brands: Array.from(new Set((brands.data ?? []).map((r) => r.brand).filter(Boolean))).sort() as string[],
    };
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: product } = await supabase
      .from("products")
      .select("*, product_categories(id, name, slug)")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!product) return { product: null, related: [] };
    const { data: related } = await supabase
      .from("products")
      .select("*, product_categories(name, slug)")
      .eq("is_published", true)
      .eq("category_id", product.category_id ?? "")
      .neq("id", product.id)
      .limit(4);
    return { product, related: related ?? [] };
  });

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const [services, categories] = await Promise.all([
    supabase.from("services").select("*").eq("is_published", true).order("sort_order"),
    supabase.from("service_categories").select("*").eq("is_published", true).order("sort_order"),
  ]);
  return { services: services.data ?? [], categories: categories.data ?? [] };
});

export const getService = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: service } = await supabase
      .from("services")
      .select("*, service_categories(name, slug)")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    const { data: others } = await supabase
      .from("services")
      .select("*")
      .eq("is_published", true)
      .neq("slug", data.slug)
      .order("sort_order")
      .limit(5);
    return { service, others: others ?? [] };
  });

export const getPageContent = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: page } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    return { page };
  });

export const listGallery = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("gallery_items")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  return { items: data ?? [] };
});

export const listFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data } = await supabase.from("faqs").select("*").eq("is_published", true).order("sort_order");
  return { faqs: data ?? [] };
});

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(3000),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    });
    if (error) throw new Error("Your message could not be sent. Please try again.");
    return { ok: true };
  });
