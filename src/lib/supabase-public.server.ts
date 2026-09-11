import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Publishable-key Supabase client for server-side reads of PUBLIC data.
 * RLS applies as the anonymous role. Never use for user-owned data.
 *
 * If the Supabase project isn't configured, return a degraded client whose
 * queries always resolve to empty data — so the caller's `?? []` defaults
 * render the site from fallback constants instead of crashing the whole SSR
 * request (which previously surfaced as the generic "This page didn't load"
 * error page in previews without env vars).
 */
export function createPublicClient(): SupabaseClient<Database> {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];

  if (!key || !url) {
    console.warn(
      "[Supabase] Supabase env vars are not set; serving public data with defaults.",
    );
    return createDegradedClient();
  }

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

function createDegradedClient(): SupabaseClient<Database> {
  const emptyList = { data: [] as unknown[], error: null };
  const emptyMaybe = { data: null, error: null };

  // Any Supabase method (`.from`, `.select`, `.eq`, ...) returns a thenable
  // That resolves to an empty `{ data, error }` payload — callers' `?? []`
  // defaults render the site from fallback constants instead of crashing.



  const query = (result: { data: unknown; error: null }) => {
    const target = () => query(result);
    const proxy = new Proxy(target, {
      get: (_target, prop: string | symbol) => {
        if (prop === "then") {
          return (resolve: (value: unknown) => void) => resolve(result);
        }
        if (prop === "single" || prop === "maybeSingle") {
          return () => query(emptyMaybe);
        }
        if (prop === Symbol.iterator) return undefined;
        return () => query(result);
      },
    });
    return proxy as unknown as Record<string, unknown>;
  };
  return query(emptyList) as unknown as SupabaseClient<Database>;
}
