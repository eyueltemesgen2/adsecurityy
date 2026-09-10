import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { adminUpsertByKey } from "@/lib/admin.functions";
import { getSiteData } from "@/lib/public.functions";
import { AdminLayout } from "@/components/site/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Admin Settings — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const saveSettings = useServerFn(adminUpsertByKey);
  const queryClient = useQueryClient();
  const siteQuery = useQuery({
    queryKey: ["site-data"],
    queryFn: () => getSiteData(),
  });

  const [branding, setBranding] = useState({
    company_name: "",
    tagline: "",
    logo_url: "",
    favicon_url: "",
    description: "",
  });
  const [contact, setContact] = useState({
    email: "",
    phone: "",
    address: "",
    working_hours: "",
  });
  const [seo, setSeo] = useState({
    title: "",
    description: "",
    og_image: "",
  });
  const [appearance, setAppearance] = useState({
    primary: "",
    accent: "",
    radius: "",
    button_style: "",
  });
  const [footerSettings, setFooterSettings] = useState({
    description: "",
    copyright: "",
  });

  useEffect(() => {
    if (!siteQuery.data) return;
    setBranding({
      company_name: siteQuery.data.branding.company_name ?? "",
      tagline: siteQuery.data.branding.tagline ?? "",
      logo_url: siteQuery.data.branding.logo_url ?? "",
      favicon_url: siteQuery.data.branding.favicon_url ?? "",
      description: siteQuery.data.branding.description ?? "",
    });
    setContact({
      email: siteQuery.data.contact.email ?? "",
      phone: siteQuery.data.contact.phone ?? "",
      address: siteQuery.data.contact.address ?? "",
      working_hours: siteQuery.data.contact.working_hours ?? "",
    });
    setSeo({
      title: siteQuery.data.seo.title ?? "",
      description: siteQuery.data.seo.description ?? "",
      og_image: siteQuery.data.seo.og_image ?? "",
    });
    setAppearance({
      primary: siteQuery.data.appearance.primary ?? "",
      accent: siteQuery.data.appearance.accent ?? "",
      radius: siteQuery.data.appearance.radius ?? "",
      button_style: siteQuery.data.appearance.button_style ?? "",
    });
    setFooterSettings({
      description: siteQuery.data.footerSettings.description ?? "",
      copyright: siteQuery.data.footerSettings.copyright ?? "",
    });
  }, [siteQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveSettings({ data: { key: "branding", value: branding } }),
        saveSettings({ data: { key: "contact", value: contact } }),
        saveSettings({ data: { key: "seo", value: seo } }),
        saveSettings({ data: { key: "appearance", value: appearance } }),
        saveSettings({ data: { key: "footerSettings", value: footerSettings } }),
      ]);
    },
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["site-data"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (siteQuery.isLoading) {
    return (
      <AdminLayout title="Settings">
        <Skeleton className="h-96 w-full" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings" subtitle="Manage your site branding, contact info, SEO and appearance.">
      <div className="space-y-8">
        <section className="space-y-4 border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Branding</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="company_name">Company name</Label>
              <Input id="company_name" value={branding.company_name} onChange={(e) => setBranding({ ...branding, company_name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={branding.tagline} onChange={(e) => setBranding({ ...branding, tagline: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" value={branding.logo_url} onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <Input id="favicon_url" value={branding.favicon_url} onChange={(e) => setBranding({ ...branding, favicon_url: e.target.value })} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="brand_description">Description</Label>
              <Textarea id="brand_description" value={branding.description} onChange={(e) => setBranding({ ...branding, description: e.target.value })} rows={2} className="mt-1.5" />
            </div>
          </div>
        </section>

        <section className="space-y-4 border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Contact information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="working_hours">Working hours</Label>
              <Input id="working_hours" value={contact.working_hours} onChange={(e) => setContact({ ...contact, working_hours: e.target.value })} className="mt-1.5" />
            </div>
          </div>
        </section>

        <section className="space-y-4 border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">SEO</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="seo_title">Default page title</Label>
              <Input id="seo_title" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="og_image">Open Graph image URL</Label>
              <Input id="og_image" value={seo.og_image} onChange={(e) => setSeo({ ...seo, og_image: e.target.value })} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="seo_description">Default meta description</Label>
              <Textarea id="seo_description" value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} rows={2} className="mt-1.5" />
            </div>
          </div>
        </section>

        <section className="space-y-4 border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Appearance</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="primary_color">Primary color (oklch or hex)</Label>
              <Input id="primary_color" value={appearance.primary} onChange={(e) => setAppearance({ ...appearance, primary: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="accent_color">Accent color (oklch or hex)</Label>
              <Input id="accent_color" value={appearance.accent} onChange={(e) => setAppearance({ ...appearance, accent: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="radius">Border radius</Label>
              <Input id="radius" value={appearance.radius} onChange={(e) => setAppearance({ ...appearance, radius: e.target.value })} placeholder="0.25rem" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="button_style">Button style</Label>
              <select
                id="button_style"
                value={appearance.button_style}
                onChange={(e) => setAppearance({ ...appearance, button_style: e.target.value })}
                className="mt-1.5 h-10 w-full border border-input bg-background px-3 text-sm"
              >
                <option value="">Default</option>
                <option value="pill">Pill</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Footer settings</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="footer_description">Footer description</Label>
              <Textarea id="footer_description" value={footerSettings.description} onChange={(e) => setFooterSettings({ ...footerSettings, description: e.target.value })} rows={2} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="copyright">Copyright text</Label>
              <Input id="copyright" value={footerSettings.copyright} onChange={(e) => setFooterSettings({ ...footerSettings, copyright: e.target.value })} className="mt-1.5" />
            </div>
          </div>
        </section>

        <Button onClick={() => save.mutate()} disabled={save.isPending} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          {save.isPending ? "Saving…" : "Save all settings"}
        </Button>
      </div>
    </AdminLayout>
  );
}
