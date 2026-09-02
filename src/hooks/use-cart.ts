import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addToCart, clearCart, getCart, mergeGuestCart, setCartItem } from "@/lib/customer.functions";
import { effectivePrice, type Product } from "@/lib/db-types";
import { useAuth } from "./use-auth";

const STORAGE_KEY = "ad-cart-v1";

type GuestItem = { productId: string; quantity: number };
export type CartLine = { id: string; quantity: number; product: Product };

function readGuestCart(): GuestItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as GuestItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("ad-cart-changed"));
}

export function useCart() {
  const { session, loading: authLoading } = useAuth();
  const isAuthed = Boolean(session);
  const queryClient = useQueryClient();
  const [guestItems, setGuestItems] = useState<GuestItem[]>([]);

  const fetchCart = useServerFn(getCart);
  const mutateItem = useServerFn(setCartItem);
  const addItem = useServerFn(addToCart);
  const emptyCart = useServerFn(clearCart);
  const merge = useServerFn(mergeGuestCart);

  useEffect(() => {
    const sync = () => setGuestItems(readGuestCart());
    sync();
    window.addEventListener("ad-cart-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ad-cart-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Merge a guest cart into the account cart once signed in.
  useEffect(() => {
    if (!isAuthed) return;
    const pending = readGuestCart();
    if (pending.length === 0) return;
    merge({ data: { items: pending } })
      .then(() => {
        writeGuestCart([]);
        void queryClient.invalidateQueries({ queryKey: ["cart"] });
      })
      .catch(() => undefined);
  }, [isAuthed, merge, queryClient]);

  const serverCart = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetchCart(),
    enabled: isAuthed,
  });

  const guestProducts = useQuery({
    queryKey: ["cart-guest", guestItems.map((i) => `${i.productId}:${i.quantity}`).join(",")],
    enabled: !isAuthed && guestItems.length > 0,
    queryFn: async () => {
      const ids = guestItems.map((i) => i.productId);
      const { data } = await supabase.from("products").select("*").in("id", ids).eq("is_published", true);
      return (data ?? []) as Product[];
    },
  });

  const lines: CartLine[] = useMemo(() => {
    if (isAuthed) {
      const rows = serverCart.data?.items ?? [];
      return rows.map((row) => ({
        id: row.id,
        quantity: row.quantity,
        product: row.product as Product,
      }));
    }
    const products = guestProducts.data ?? [];
    return guestItems
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product ? { id: product.id, quantity: item.quantity, product } : null;
      })
      .filter(Boolean) as CartLine[];
  }, [isAuthed, serverCart.data, guestProducts.data, guestItems]);

  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + effectivePrice(line.product) * line.quantity, 0);

  const add = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (isAuthed) {
        await addItem({ data: { productId, quantity } });
        return;
      }
      const current = readGuestCart();
      const existing = current.find((i) => i.productId === productId);
      const next = existing
        ? current.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i,
          )
        : [...current, { productId, quantity }];
      writeGuestCart(next);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (error: Error) => toast.error(error.message || "Could not add to cart"),
  });

  const update = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (isAuthed) {
        await mutateItem({ data: { productId, quantity } });
        return;
      }
      const current = readGuestCart();
      writeGuestCart(
        quantity === 0
          ? current.filter((i) => i.productId !== productId)
          : current.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      );
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (error: Error) => toast.error(error.message || "Could not update cart"),
  });

  const clear = useCallback(async () => {
    if (isAuthed) {
      await emptyCart();
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
    } else {
      writeGuestCart([]);
    }
  }, [isAuthed, emptyCart, queryClient]);

  return {
    lines,
    count,
    subtotal,
    isAuthed,
    loading: authLoading || (isAuthed ? serverCart.isLoading : guestProducts.isLoading),
    addToCart: (productId: string, quantity = 1) => add.mutate({ productId, quantity }),
    updateQuantity: (productId: string, quantity: number) => update.mutate({ productId, quantity }),
    clear,
    isMutating: add.isPending || update.isPending,
  };
}
