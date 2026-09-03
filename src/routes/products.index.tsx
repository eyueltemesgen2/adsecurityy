import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { listProducts } from "@/lib/public.functions";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { ProductCard, type ProductWithCategory } from "@/components/site/ProductCard";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductSearch = {
  search?: string;
  category?: string;
  brand?: string;
  availability?: string;
  sort?: string;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
};

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    search: typeof search.search === "string" && search.search ? search.search : undefined,
    category: typeof search.category === "string" && search.category ? search.category : undefined,
    brand: typeof search.brand === "string" && search.brand ? search.brand : undefined,
    availability:
      typeof search.availability === "string" && search.availability ? search.availability : undefined,
    sort: typeof search.sort === "string" && search.sort ? search.sort : undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
    minPrice: Number(search.minPrice) > 0 ? Number(search.minPrice) : undefined,
    maxPrice: Number(search.maxPrice) > 0 ? Number(search.maxPrice) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Security Products & Equipment — AD Security Camera Solution" },
      {
        name: "description",
        content:
          "Browse CCTV cameras, NVRs, access control, intercom and networking equipment with warranty and expert installation.",
      },
      { property: "og:title", content: "Security Products & Equipment" },
      {
        property: "og:description",
        content: "Shop cameras, recorders, access control and networking hardware.",
      },
    ],
  }),
  component: ProductsPage,
});

const ALL = "__all__";

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const fetchProducts = useServerFn(listProducts);
  const [term, setTerm] = useState(search.search ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const query = useQuery({
    queryKey: ["products", search],
    queryFn: () => fetchProducts({ data: { ...search, perPage: 12 } }),
  });

  const update = (patch: Partial<ProductSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: patch.page ?? undefined }) });

  const total = query.data?.total ?? 0;
  const perPage = query.data?.perPage ?? 12;
  const page = query.data?.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Shop"
        title="Security products & equipment"
        subtitle="Genuine hardware with warranty, supplied and installed by our certified engineers."
      />
      <div className="container-page py-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              update({ search: term || undefined });
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search cameras, NVRs, brands…"
                className="h-10 pl-8"
                aria-label="Search products"
              />
            </div>
            <Button type="submit" className="h-10">
              Search
            </Button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-10 lg:hidden"
              onClick={() => setShowFilters((value) => !value)}
            >
              <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Filters
            </Button>
            <Select value={search.sort ?? "newest"} onValueChange={(value) => update({ sort: value })}>
              <SelectTrigger className="h-10 w-[170px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
            <div className="space-y-6 border border-border bg-card p-5">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
                <Select
                  value={search.category ?? ALL}
                  onValueChange={(value) => update({ category: value === ALL ? undefined : value })}
                >
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All categories</SelectItem>
                    {(query.data?.categories ?? []).map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Brand</Label>
                <Select
                  value={search.brand ?? ALL}
                  onValueChange={(value) => update({ brand: value === ALL ? undefined : value })}
                >
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All brands</SelectItem>
                    {(query.data?.brands ?? []).map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Availability</Label>
                <Select
                  value={search.availability ?? ALL}
                  onValueChange={(value) => update({ availability: value === ALL ? undefined : value })}
                >
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Any</SelectItem>
                    <SelectItem value="in_stock">In stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minPrice" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Min price
                  </Label>
                  <Input
                    id="minPrice"
                    type="number"
                    min={0}
                    defaultValue={search.minPrice ?? ""}
                    className="mt-2 h-10"
                    onBlur={(event) => update({ minPrice: Number(event.target.value) || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Max price
                  </Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    min={0}
                    defaultValue={search.maxPrice ?? ""}
                    className="mt-2 h-10"
                    onBlur={(event) => update({ maxPrice: Number(event.target.value) || undefined })}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setTerm("");
                  navigate({ search: {} });
                }}
              >
                Clear filters
              </Button>
            </div>
          </aside>

          <div>
            <p className="text-sm text-muted-foreground">
              {query.isLoading ? "Loading products…" : `${total} product${total === 1 ? "" : "s"} found`}
            </p>
            {query.isLoading ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-80 w-full" />
                ))}
              </div>
            ) : (query.data?.products.length ?? 0) === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="No products match your filters"
                  description="Try a different search term, category or clear the filters."
                  action={
                    <Button variant="outline" onClick={() => navigate({ search: {} })}>
                      Clear filters
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {(query.data!.products as unknown as ProductWithCategory[]).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {pages > 1 ? (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => update({ page: page - 1 > 1 ? page - 1 : undefined })}
                    >
                      Previous
                    </Button>
                    <span className="px-2 text-sm text-muted-foreground">
                      Page {page} of {pages}
                    </span>
                    <Button variant="outline" disabled={page >= pages} onClick={() => update({ page: page + 1 })}>
                      Next
                    </Button>
                  </div>
                ) : null}
              </>
            )}
            <p className="mt-10 text-sm text-muted-foreground">
              Need help choosing?{" "}
              <Link to="/contact" className="font-semibold text-accent hover:underline">
                Talk to our team
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
