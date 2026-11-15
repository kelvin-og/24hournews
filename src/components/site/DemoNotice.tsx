import { isSupabaseReady } from "@/lib/supabase/client";

/**
 * Shows a "DEMO" banner when the site is running on sample data
 * (i.e. Supabase environment variables are not configured).
 * Hidden automatically once a live database is connected.
 */
export function DemoNotice() {
  // Hide when connected to a real database — no demo data is being shown
  if (isSupabaseReady) return null;

  return (
    <p className="mx-auto max-w-7xl px-4 pt-4 text-xs text-muted-foreground">
      <span className="mr-2 rounded-sm bg-accent px-1.5 py-0.5 font-bold text-accent-foreground">
        DEMO
      </span>
      All stories currently shown are sample content for preview purposes and are not real news.
    </p>
  );
}
