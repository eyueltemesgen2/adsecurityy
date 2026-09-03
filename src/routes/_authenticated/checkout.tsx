import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { placeOrder } from "@/lib/customer.functions";
import { PublicLayout, PageHeader } from "@/components/site/PublicLayout";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/hooks/use-cart";
import { effectivePrice, formatPrice } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — AD Security Camera Solution" },
      { name: "description", content: "Confirm your delivery details and place your equipment order." },
      { property: "og:title", content: "Checkout" },
      { property: "og:description", content: "Place your security equipment order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().min(6, "Enter a reachable phone number").max(40),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  address_line: z.string().trim().min(5, "Enter your delivery address").max(400),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  delivery_notes: z.string().trim().max(1000).optional().or(z.literal("")),
  save_address: z.boolean().optional(),
});

function CheckoutPage() {
  const { lines, subtotal, loading } = useCart();
  const submit = useServerFn(placeOrder);
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveAddress, setSaveAddress] = useState(true);

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) => submit({ data: values }),
    onSuccess: (result) => {
      toast.success(`Order ${result.orderNumber} placed`);
      navigate({ to: "/account/orders/$id", params: { id: result.orderId } });
    },
    onError: (error: Error) => toast.error(error.message || "Order could not be placed"),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      full_name: String(form.get("full_name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      address_line: String(form.get("address_line") ?? ""),
      city: String(form.get("city") ?? ""),
      delivery_notes: String(form.get("delivery_notes") ?? ""),
      save_address: saveAddress,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <PublicLayout>
      <PageHeader eyebrow="Checkout" title="Delivery details" subtitle="We'll confirm stock, delivery and installation before any payment." />
      <div className="container-page py-12">
        {!loading && lines.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Add products before checking out."
            action={
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/products">Shop products</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <form onSubmit={onSubmit} className="grid gap-5 border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
              <div>
                <Label htmlFor="full_name">Full name *</Label>
                <Input id="full_name" name="full_name" className="mt-2 h-11" required />
                {errors.full_name ? <p className="mt-1 text-xs text-destructive">{errors.full_name}</p> : null}
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" className="mt-2 h-11" required />
                {errors.phone ? <p className="mt-1 text-xs text-destructive">{errors.phone}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" className="mt-2 h-11" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address_line">Delivery address *</Label>
                <Input id="address_line" name="address_line" className="mt-2 h-11" required />
                {errors.address_line ? (
                  <p className="mt-1 text-xs text-destructive">{errors.address_line}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="city">City / area</Label>
                <Input id="city" name="city" className="mt-2 h-11" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="delivery_notes">Delivery notes</Label>
                <Textarea id="delivery_notes" name="delivery_notes" rows={4} className="mt-2" />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Checkbox checked={saveAddress} onCheckedChange={(value) => setSaveAddress(Boolean(value))} />
                Save this address to my account
              </label>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={mutation.isPending || lines.length === 0}
                >
                  {mutation.isPending ? "Placing order…" : "Place order"}
                </Button>
              </div>
            </form>

            <aside className="h-fit border border-border bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wide">Order summary</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-3">
                    <span>
                      {line.product.name}
                      <span className="text-muted-foreground"> × {line.quantity}</span>
                    </span>
                    <span className="whitespace-nowrap font-semibold">
                      ETB {formatPrice(effectivePrice(line.product) * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="font-semibold">Total</span>
                <span className="font-display text-lg font-bold">ETB {formatPrice(subtotal)}</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
