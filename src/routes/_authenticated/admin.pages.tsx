import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/site/AdminLayout";
import { AdminCrud, type AdminField } from "@/components/site/AdminCrud";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  head: () => ({
    meta: [
      { title: "Admin Pages & SEO — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPagesPage,
});

const pageFields: AdminField[] = [
  { name: "title", label: "Page title", type: "text", wide: true },
  { name: "slug", label: "Slug", type: "text", help: "URL path, e.g. about, privacy-policy" },
  { name: "meta_title", label: "SEO title", type: "text", wide: true },
  { name: "meta_description", label: "SEO description", type: "textarea", wide: true },
  { name: "content", label: "Page content (JSON)", type: "json", wide: true, help: "Structured content blocks" },
  { name: "is_published", label: "Published", type: "switch" },
];

const navFields: AdminField[] = [
  { name: "label", label: "Label", type: "text" },
  { name: "url", label: "URL", type: "text" },
  { name: "sort_order", label: "Sort order", type: "number" },
  { name: "is_visible", label: "Visible", type: "switch" },
];

const footerSectionFields: AdminField[] = [
  { name: "title", label: "Section title", type: "text" },
  { name: "links", label: "Links (JSON array)", type: "json", wide: true, help: 'Array of { label, url }' },
  { name: "sort_order", label: "Sort order", type: "number" },
];

const socialFields: AdminField[] = [
  { name: "platform", label: "Platform", type: "text" },
  { name: "username", label: "Username", type: "text" },
  { name: "url", label: "URL", type: "text", wide: true },
  { name: "sort_order", label: "Sort order", type: "number" },
];

function AdminPagesPage() {
  return (
    <AdminLayout title="Pages & SEO" subtitle="Manage static pages, navigation, footer and social links.">
      <div className="space-y-12">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Pages</h2>
          <AdminCrud
            table="pages"
            singular="Page"
            fields={pageFields}
            searchColumns={["title", "slug"]}
            orderBy="created_at"
            columns={[
              { label: "Title", render: (row) => <span className="font-semibold">{row.title as string}</span> },
              { label: "Slug", render: (row) => <span className="text-muted-foreground">/{row.slug as string}</span> },
              { label: "Published", render: (row) => <span>{row.is_published ? "Yes" : "No"}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Navigation items</h2>
          <AdminCrud
            table="navigation_items"
            singular="Nav item"
            fields={navFields}
            searchColumns={["label"]}
            orderBy="sort_order"
            ascending
            columns={[
              { label: "Label", render: (row) => <span className="font-semibold">{row.label as string}</span> },
              { label: "URL", render: (row) => <span className="text-muted-foreground">{row.url as string}</span> },
              { label: "Visible", render: (row) => <span>{row.is_visible ? "Yes" : "No"}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Footer sections</h2>
          <AdminCrud
            table="footer_sections"
            singular="Footer section"
            fields={footerSectionFields}
            searchColumns={["title"]}
            orderBy="sort_order"
            ascending
            columns={[
              { label: "Title", render: (row) => <span className="font-semibold">{row.title as string}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Social links</h2>
          <AdminCrud
            table="social_links"
            singular="Social link"
            fields={socialFields}
            searchColumns={["platform", "username"]}
            orderBy="sort_order"
            ascending
            columns={[
              { label: "Platform", render: (row) => <span className="font-semibold">{row.platform as string}</span> },
              { label: "Username", render: (row) => <span className="text-muted-foreground">{row.username as string ?? "—"}</span> },
            ]}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
