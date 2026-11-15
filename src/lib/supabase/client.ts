/**
 * Supabase browser/server client.
 *
 * Uses the publishable (anon) key — safe to ship in frontend code.
 * Row Level Security on every table ensures anonymous users can only
 * read published content and cannot write, update, or delete anything.
 *
 * Future Admin Dashboard: use a server-side service-role client kept
 * entirely in server functions / Edge Functions — never in browser code.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

const isTest =
  import.meta.env.MODE === "test" ||
  (typeof process !== "undefined" &&
    (process.env["NODE_ENV"] === "test" || Boolean(process.env["VITEST"])));

if (!isTest && (!supabaseUrl || !supabaseKey)) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing. " +
      "The site will fall back to sample demo data. " +
      "Create a .env file based on .env.example to connect to Supabase.",
  );
}

/** Custom fetch with a 4-second timeout to prevent hanging on unresponsive networks/paused projects */
const timeoutFetch: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
};

/**
 * Singleton Supabase client.
 * - In test mode, disabled so unit tests run fast and reliably against deterministic data.
 * - On the browser it re-uses the same instance across the page lifecycle.
 * - On the server (SSR) each module evaluation is scoped to the request via
 *   TanStack Start / Nitro's worker isolation, so there is no request leakage.
 */
export const supabase =
  !isTest && supabaseUrl && supabaseKey
    ? createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          // Public read-only site — no user sessions needed here.
          // The Admin Dashboard will use its own auth client.
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: timeoutFetch,
        },
      })
    : null;

/** True when the Supabase client is properly configured. */
export const isSupabaseReady = supabase !== null;
