import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/site/AdminLayout";
import { AdminCrud, type AdminField } from "@/components/site/AdminCrud";

export const Route = createFileRoute("/_authenticated/admin/content")({
  head: () => ({
    meta: [
      { title: "Admin Website Content — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminContentPage,
});

const sectionFields: AdminField[] = [
  { name: "key", label: "Section key", type: "text", help: "e.g. hero, services, featured_products" },
  { name: "title", label: "Title", type: "text", wide: true },
  { name: "subtitle", label: "Eyebrow / subtitle", type: "text", wide: true },
  { name: "body", label: "Body text", type: "textarea", wide: true },
  { name: "image_url", label: "Image", type: "image", wide: true },
  { name: "cta_label", label: "Button 1 label", type: "text" },
  { name: "cta_link", label: "Button 1 link", type: "text" },
  { name: "cta2_label", label: "Button 2 label", type: "text" },
  { name: "cta2_link", label: "Button 2 link", type: "text" },
  { name: "items", label: "Items (JSON array)", type: "json", wide: true, help: "Array of { title, description, icon, value, label }" },
  { name: "sort_order", label: "Sort order", type: "number" },
  { name: "is_visible", label: "Visible", type: "switch" },
];

const serviceFields: AdminField[] = [
  { name: "name", label: "Name", type: "text", wide: true },
  { name: "slug", label: "Slug", type: "text", help: "Auto-generated if blank" },
  { name: "short_description", label: "Short description", type: "text", wide: true },
  { name: "description", label: "Full description", type: "textarea", wide: true },
  { name: "icon", label: "Icon key", type: "text", help: "shield, wrench, clock, support, badge" },
  { name: "image_url", label: "Image", type: "image", wide: true },
  { name: "is_published", label: "Published", type: "switch" },
  { name: "sort_order", label: "Sort order", type: "number" },
];

const testimonialFields: AdminField[] = [
  { name: "customer_name", label: "Customer name", type: "text" },
  { name: "company", label: "Company", type: "text" },
  { name: "content", label: "Testimonial", type: "textarea", wide: true },
  { name: "rating", label: "Rating (1-5)", type: "number" },
  { name: "is_published", label: "Published", type: "switch" },
];

const faqFields: AdminField[] = [
  { name: "question", label: "Question", type: "text", wide: true },
  { name: "answer", label: "Answer", type: "textarea", wide: true },
  { name: "sort_order", label: "Sort order", type: "number" },
  { name: "is_published", label: "Published", type: "switch" },
];

const galleryFields: AdminField[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "image_url", label: "Image", type: "image", wide: true },
  { name: "is_published", label: "Published", type: "switch" },
];

const announcementFields: AdminField[] = [
  { name: "title", label: "Title", type: "text", wide: true },
  { name: "message", label: "Message", type: "text", wide: true },
  { name: "cta_label", label: "Button label", type: "text" },
  { name: "cta_url", label: "Button URL", type: "text" },
  { name: "is_active", label: "Active", type: "switch" },
];

function AdminContentPage() {
  return (
    <AdminLayout title="Website content" subtitle="Manage homepage sections, services, testimonials, FAQs, gallery and announcements.">
      <div className="space-y-12">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Homepage sections</h2>
          <AdminCrud
            table="homepage_sections"
            singular="Section"
            fields={sectionFields}
            searchColumns={["key", "title"]}
            orderBy="sort_order"
            ascending
            columns={[
              { label: "Key", render: (row) => <span className="font-semibold">{row.key as string}</span> },
              { label: "Title", render: (row) => <span>{row.title as string ?? "—"}</span> },
              { label: "Visible", render: (row) => <span>{row.is_visible ? "Yes" : "No"}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Services</h2>
          <AdminCrud
            table="services"
            singular="Service"
            fields={serviceFields}
            searchColumns={["name"]}
            orderBy="sort_order"
            ascending
            columns={[
              { label: "Name", render: (row) => <span className="font-semibold">{row.name as string}</span> },
              { label: "Published", render: (row) => <span>{row.is_published ? "Yes" : "No"}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Service categories</h2>
          <AdminCrud
            table="service_categories"
            singular="Category"
            fields={[
              { name: "name", label: "Name", type: "text" },
              { name: "slug", label: "Slug", type: "text", help: "Auto-generated if blank" },
              { name: "description", label: "Description", type: "textarea", wide: true },
            ]}
            searchColumns={["name"]}
            orderBy="name"
            ascending
            columns={[
              { label: "Name", render: (row) => <span className="font-semibold">{row.name as string}</span> },
              { label: "Slug", render: (row) => <span className="text-muted-foreground">{row.slug as string}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Testimonials</h2>
          <AdminCrud
            table="testimonials"
            singular="Testimonial"
            fields={testimonialFields}
            searchColumns={["customer_name", "company"]}
            orderBy="created_at"
            columns={[
              { label: "Customer", render: (row) => <span className="font-semibold">{row.customer_name as string}</span> },
              { label: "Rating", render: (row) => <span>{"★".repeat(Number(row.rating ?? 0))}</span> },
              { label: "Published", render: (row) => <span>{row.is_published ? "Yes" : "No"}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">FAQs</h2>
          <AdminCrud
            table="faqs"
            singular="FAQ"
            fields={faqFields}
            searchColumns={["question"]}
            orderBy="sort_order"
            ascending
            columns={[
              { label: "Question", render: (row) => <span className="font-semibold">{row.question as string}</span> },
              { label: "Published", render: (row) => <span>{row.is_published ? "Yes" : "No"}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Gallery</h2>
          <AdminCrud
            table="gallery_items"
            singular="Gallery item"
            fields={galleryFields}
            searchColumns={["title", "category"]}
            orderBy="created_at"
            columns={[
              { label: "Title", render: (row) => <span className="font-semibold">{row.title as string}</span> },
              { label: "Category", render: (row) => <span className="text-muted-foreground">{row.category as string ?? "—"}</span> },
              { label: "Published", render: (row) => <span>{row.is_published ? "Yes" : "No"}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Announcements</h2>
          <AdminCrud
            table="announcements"
            singular="Announcement"
            fields={announcementFields}
            searchColumns={["title"]}
            orderBy="created_at"
            columns={[
              { label: "Title", render: (row) => <span className="font-semibold">{row.title as string}</span> },
              { label: "Active", render: (row) => <span>{row.is_active ? "Yes" : "No"}</span> },
            ]}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
