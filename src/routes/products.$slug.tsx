import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { getProduct } from "@/lib/public.functions";
import { PublicLayout } from "@/components/site/PublicLayout";
import { MediaImage } from "@/components/site/Media";
import { ProductCard, type ProductWithCategory } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/hooks/use-cart";
import { effectivePrice, formatPrice } from "@/lib/db-types";

const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProduct({ data: { slug } }) });

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!data.product) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) {
      return { meta: [{ title: "Product unavailable" }, { name: "robots", content: "noindex" }] };
    }
    const product = loaderData.product;
    const title = product.seo_title || `${product.name} — AD Security Camera Solution`;
    const description =
      product.seo_description || product.short_description || `Buy ${product.name} with expert installation.`;
    const images = Array.isArray(product.images) ? (product.images as string[]) : [];
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
    ];
    if (images[0]?.startsWith("https://")) {
      meta.push({ property: "og:image", content: images[0] });
      meta.push({ name: "twitter:image", content: images[0] });
    }
    return { meta };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(slug));
  const product = data.product!;
  const { addToCart, isMutating } = useCart();
  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const [active, setActive] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const specs = (product.specifications ?? {}) as Record<string, string>;
  const features = Array.isArray(product.features) ? (product.features as string[]) : [];
  const inStock = product.stock_quantity > 0;
  const price = effectivePrice(product);

  return (
    <PublicLayout>
      <div className="container-page py-8 sm:py-12">
        <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-accent">
            Home
          </Link>
          <span className="px-1.5">/</span>
          <Link to="/products" className="hover:text-accent">
            Products
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div>
            <MediaImage src={images[active]} alt={product.name} className="aspect-square w-full border border-border" />
            {images.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {images.slice(0, 8).map((image, index) => (
                  <button
                    key={image + index}
                    onClick={() => setActive(index)}
                    className={`border ${index === active ? "border-accent" : "border-border"}`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <MediaImage src={image} alt="" className="aspect-square w-full" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="eyebrow text-accent">
              {product.product_categories?.name ?? "Equipment"}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{product.name}</h1>
            {product.sku ? <p className="mt-1 text-xs text-muted-foreground">SKU: {product.sku}</p> : null}
            {product.short_description ? (
              <p className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">{product.short_description}</p>
            ) : null}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold">ETB {formatPrice(price)}</span>
              {product.sale_price ? (
                <span className="text-base text-muted-foreground line-through">ETB {formatPrice(product.price)}</span>
              ) : null}
            </div>
            <p className={`mt-1.5 text-sm font-semibold ${inStock ? "text-success" : "text-destructive"}`}>
              {inStock ? `In stock — ${product.stock_quantity} available` : "Currently out of stock"}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.min(product.stock_quantity || 99, q + 1))}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!inStock || isMutating}
                onClick={() => addToCart(product.id, quantity)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/request-service">Request installation</Link>
              </Button>
            </div>

            <ul className="mt-8 grid gap-3 border-t border-border pt-6 text-sm sm:grid-cols-2">
              <li className="flex gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                {product.warranty || "Manufacturer warranty included"}
              </li>
              <li className="flex gap-2">
                <Truck className="h-4 w-4 shrink-0 text-accent" /> Delivery &amp; on-site setup available
              </li>
            </ul>
          </div>
        </div>

        <Tabs defaultValue="description" className="mt-14">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="max-w-3xl whitespace-pre-line text-[0.95rem] leading-relaxed text-muted-foreground">
            {product.description || product.short_description || "No description provided yet."}
          </TabsContent>
          <TabsContent value="specs">
            {Object.keys(specs).length ? (
              <dl className="max-w-2xl divide-y divide-border border border-border">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-4 px-4 py-3 text-sm">
                    <dt className="font-semibold capitalize">{key.replace(/_/g, " ")}</dt>
                    <dd className="text-muted-foreground">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Specifications will be published soon.</p>
            )}
          </TabsContent>
          <TabsContent value="features">
            {features.length ? (
              <ul className="max-w-2xl space-y-2.5">
                {features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No feature list provided.</p>
            )}
          </TabsContent>
        </Tabs>

        {data.related.length ? (
          <section className="mt-16">
            <h2 className="text-xl font-bold">Related products</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(data.related as unknown as ProductWithCategory[]).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PublicLayout>
  );
}
