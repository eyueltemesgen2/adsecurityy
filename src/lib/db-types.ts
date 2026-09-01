import type { Database } from "@/integrations/supabase/types";

type T = Database["public"]["Tables"];

export type Profile = T["profiles"]["Row"];
export type Product = T["products"]["Row"];
export type ProductCategory = T["product_categories"]["Row"];
export type Service = T["services"]["Row"];
export type ServiceCategory = T["service_categories"]["Row"];
export type ServiceRequest = T["service_requests"]["Row"];
export type Order = T["orders"]["Row"];
export type OrderItem = T["order_items"]["Row"];
export type CartItem = T["cart_items"]["Row"];
export type Address = T["addresses"]["Row"];
export type Notification = T["notifications"]["Row"];
export type ContactMessage = T["contact_messages"]["Row"];
export type GalleryItem = T["gallery_items"]["Row"];
export type Testimonial = T["testimonials"]["Row"];
export type Faq = T["faqs"]["Row"];
export type HomepageSection = T["homepage_sections"]["Row"];
export type Page = T["pages"]["Row"];
export type NavigationItem = T["navigation_items"]["Row"];
export type FooterSection = T["footer_sections"]["Row"];
export type SocialLink = T["social_links"]["Row"];
export type Media = T["media"]["Row"];
export type Announcement = T["announcements"]["Row"];
export type AuditLog = T["audit_logs"]["Row"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type ServiceRequestStatus = Database["public"]["Enums"]["service_request_status"];

export type SectionItem = { title?: string; text?: string; label?: string; value?: string };

export type Branding = {
  company_name: string;
  tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  description?: string;
};
export type ContactInfo = {
  email: string;
  phone?: string;
  address?: string;
  working_hours?: string;
};
export type SeoSettings = { title: string; description: string; og_image?: string };
export type Appearance = {
  primary?: string;
  accent?: string;
  radius?: string;
  button_style?: string;
};
export type FooterSettings = { description?: string; copyright?: string };

export type SiteData = {
  branding: Branding;
  contact: ContactInfo;
  seo: SeoSettings;
  appearance: Appearance;
  footerSettings: FooterSettings;
  navigation: NavigationItem[];
  footerSections: FooterSection[];
  socialLinks: SocialLink[];
  announcement: Announcement | null;
};

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
];

export const SERVICE_REQUEST_STATUSES: ServiceRequestStatus[] = [
  "submitted",
  "under_review",
  "contacted",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
];

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const SERVICE_TYPES = [
  "CCTV Installation",
  "CCTV Maintenance",
  "CCTV Repair",
  "Network Installation",
  "Access Control Installation",
  "Time Attendance Installation",
  "Video Intercom Installation",
  "Web & IT Solutions",
  "Security Consultation",
  "System Inspection",
  "Security System Upgrade",
];

export const GALLERY_CATEGORIES = [
  "CCTV Installation",
  "Access Control",
  "Networking",
  "Time Attendance",
  "Video Intercom",
  "Security Projects",
];

export function formatPrice(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    amount,
  );
}

export function effectivePrice(product: Pick<Product, "price" | "sale_price">): number {
  const sale = product.sale_price == null ? null : Number(product.sale_price);
  return sale && sale > 0 ? sale : Number(product.price);
}
