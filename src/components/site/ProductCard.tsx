import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { MediaImage } from "./Media";
import { Button } from "@/components/ui/button";
import { effectivePrice, formatPrice, type Product } from "@/lib/db-types";
import { useCart } from "@/hooks/use-cart";

export type ProductWithCategory = Product & {
  product_categories?: { name: string; slug: string } | null;
};

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const { addToCart, isMutating } = useCart();
  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const price = effectivePrice(product);
  const onSale = product.sale_price != null && Number(product.sale_price) > 0;
  const inStock = product.stock_quantity > 0;

  return (
    <article className="group flex flex-col border border-border bg-card transition-colors hover:border-primary/40">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="block">
        <MediaImage
          src={images[0]}
          alt={product.name}
          className="aspect-[4/3] w-full"
          imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
          <span className="truncate">{product.product_categories?.name ?? "Equipment"}</span>
          {product.brand ? <span className="truncate font-semibold text-foreground">{product.brand}</span> : null}
        </div>
        <h3 className="mt-2 text-[0.95rem] font-semibold leading-snug">
          <Link to="/products/$slug" params={{ slug: product.slug }} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        {product.short_description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{product.short_description}</p>
        ) : null}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-lg font-bold">ETB {formatPrice(price)}</span>
          {onSale ? (
            <span className="text-sm text-muted-foreground line-through">ETB {formatPrice(product.price)}</span>
          ) : null}
        </div>
        <p className={`mt-1 text-xs font-semibold ${inStock ? "text-success" : "text-destructive"}`}>
          {inStock ? `In stock (${product.stock_quantity})` : "Out of stock"}
        </p>

        <div className="mt-4 flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={!inStock || isMutating}
            onClick={() => addToCart(product.id, 1)}
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" /> Add
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to="/products/$slug" params={{ slug: product.slug }}>
              Details
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
