import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { MediaImage } from "@/components/site/Media";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { effectivePrice, formatPrice } from "@/lib/db-types";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — AD Security Camera Solution" },
      { name: "description", content: "Review the security equipment in your cart and continue to checkout." },
      { property: "og:title", content: "Your Cart" },
      { property: "og:description", content: "Review your selected security equipment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, subtotal, updateQuantity, clear, loading, count } = useCart();
  const { user } = useAuth();

  return (
    <PublicLayout>
      <PageHeader eyebrow="Cart" title="Your cart" subtitle={`${count} item${count === 1 ? "" : "s"} selected`} />
      <div className="container-page py-12">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-5 w-5" />}
            title="Your cart is empty"
            description="Browse our catalogue and add the equipment you need."
            action={
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/products">Shop products</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="divide-y divide-border border border-border bg-card">
              {lines.map((line) => {
                const images = Array.isArray(line.product.images) ? (line.product.images as string[]) : [];
                const price = effectivePrice(line.product);
                return (
                  <div key={line.id} className="flex gap-4 p-4">
                    <MediaImage src={images[0]} alt={line.product.name} className="h-24 w-24 shrink-0" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <Link
                          to="/products/$slug"
                          params={{ slug: line.product.slug }}
                          className="text-sm font-semibold hover:text-accent"
                        >
                          {line.product.name}
                        </Link>
                        <button
                          onClick={() => updateQuantity(line.product.id, 0)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${line.product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">ETB {formatPrice(price)} each</p>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(line.product.id, Math.max(1, line.quantity - 1))}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-9 text-center text-sm font-semibold">{line.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="font-display text-base font-bold">
                          ETB {formatPrice(price * line.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-between p-4">
                <Button variant="ghost" onClick={() => void clear()}>
                  Clear cart
                </Button>
                <Button asChild variant="outline">
                  <Link to="/products">Continue shopping</Link>
                </Button>
              </div>
            </div>

            <aside className="h-fit border border-border bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold">ETB {formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery / installation</dt>
                  <dd className="text-muted-foreground">Quoted after review</dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="font-display text-lg font-bold">ETB {formatPrice(subtotal)}</span>
              </div>
              <Button asChild size="lg" className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to={user ? "/checkout" : "/auth"} search={user ? undefined : { redirect: "/checkout" }}>
                  {user ? "Proceed to checkout" : "Sign in to checkout"}
                </Link>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Payment is arranged directly with our team after we confirm stock and delivery.
              </p>
            </aside>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
