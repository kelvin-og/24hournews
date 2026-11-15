import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Polyfill global WebSocket in SSR/Node.js environments where native WebSocket is missing (e.g. Node 20)
// so that @supabase/realtime-js does not throw an uncaught exception during prerender/build.
if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = class DummyWebSocket {};
}

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

const isTest =
  import.meta.env.MODE === "test" ||
  (typeof process !== "undefined" &&
    (process.env["NODE_ENV"] === "test" || Boolean(process.env["VITEST"])));

/** Custom fetch with a 4-second timeout to prevent hanging on unresponsive networks */
const timeoutFetch: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

/**
 * Session-persisting Supabase client for the Admin Area.
 * Unlike the public read client, this client stores sessions in localStorage
 * and handles token auto-refresh.
 */
export const adminSupabase =
  !isTest && supabaseUrl && supabaseKey
    ? createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "24hournews-admin-auth",
        },
        global: {
          fetch: timeoutFetch,
        },
      })
    : null;

export const isAdminSupabaseReady = adminSupabase !== null;
