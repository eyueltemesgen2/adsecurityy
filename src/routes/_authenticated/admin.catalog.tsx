import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/site/AdminLayout";
import { AdminCrud, type AdminField } from "@/components/site/AdminCrud";
import { formatPrice } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/admin/catalog")({
  head: () => ({
    meta: [
      { title: "Admin Catalog — AD Security Camera Solution" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCatalogPage,
});

const productFields: AdminField[] = [
  { name: "name", label: "Name", type: "text", wide: true },
  { name: "slug", label: "Slug", type: "text", help: "Auto-generated from name if left blank" },
  { name: "short_description", label: "Short description", type: "text", wide: true },
  { name: "description", label: "Full description", type: "textarea", wide: true },
  { name: "price", label: "Price (ETB)", type: "number" },
  { name: "sale_price", label: "Sale price (ETB)", type: "number", help: "Set 0 for no sale" },
  { name: "stock_quantity", label: "Stock quantity", type: "number" },
  { name: "brand", label: "Brand", type: "text" },
  { name: "category_id", label: "Category", type: "select", options: [] },
  { name: "image_url", label: "Main image", type: "image", wide: true, folder: "products" },
  { name: "images", label: "Gallery images", type: "images", wide: true, folder: "products" },
  { name: "is_published", label: "Published", type: "switch" },
  { name: "is_featured", label: "Featured on homepage", type: "switch" },
];

function AdminCatalogPage() {
  return (
    <AdminLayout title="Catalog" subtitle="Manage your products and categories.">
      <div className="space-y-12">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Products</h2>
          <AdminCrud
            table="products"
            singular="Product"
            fields={productFields}
            searchColumns={["name", "brand"]}
            orderBy="created_at"
            columns={[
              {
                label: "Name",
                render: (row) => <span className="font-semibold">{row.name as string}</span>,
              },
              {
                label: "Price",
                render: (row) => <span>ETB {formatPrice(row.price as number)}</span>,
              },
              {
                label: "Stock",
                render: (row) => (
                  <span className={Number(row.stock_quantity) <= 5 ? "text-destructive font-semibold" : ""}>
                    {String(row.stock_quantity ?? 0)}
                  </span>
                ),
              },
              {
                label: "Status",
                render: (row) => (
                  <span className={row.is_published ? "text-success" : "text-muted-foreground"}>
                    {row.is_published ? "Published" : "Draft"}
                  </span>
                ),
              },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Product categories</h2>
          <AdminCrud
            table="product_categories"
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
      </div>
    </AdminLayout>
  );
}
