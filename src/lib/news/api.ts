/**
 * Data access layer.
 *
 * All UI code imports only from this file — no component knows about Supabase
 * or sample data directly. Swapping data sources only requires changes here.
 *
 * Strategy:
 *   • When VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are set,
 *     all queries go to the Supabase PostgreSQL database.
 *   • When those variables are absent (local dev without .env), the in-memory
 *     SAMPLE_ARTICLES are used so the site still renders for development.
 */
import type { Article } from "./types";
import type { CategorySlug } from "@/lib/site";
import { supabase, isSupabaseReady } from "@/lib/supabase/client";
import { mapArticle, type ArticleRowWithCategory } from "@/lib/supabase/mapper";
import { SAMPLE_ARTICLES } from "./sample-data";
import { getServerArticles } from "./server-store";

// ─── Shared query columns ─────────────────────────────────────────────────────
// Always join categories so the mapper can read the slug.
const ARTICLE_SELECT =
  "id, title, slug, excerpt, content, featured_image, image_alt, image_caption, " +
  "category_id, author_name, status, is_featured, is_breaking, is_demo, " +
  "is_editorial_pick, is_popular_override, reading_time, " +
  "published_at, created_at, updated_at, categories ( slug )";

/** Cast the raw Supabase response array to our typed shape. */
const cast = (rows: unknown): ArticleRowWithCategory[] => (rows ?? []) as ArticleRowWithCategory[];

/** Current ISO timestamp — used in every published_at filter. */
const now = () => new Date().toISOString();

// ─── Fallback helpers (used when Supabase is not configured) ──────────────────
const sampleSource = (): Article[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("24hournews_admin_articles");
      if (stored) {
        const list = JSON.parse(stored) as (Article & { status?: string })[];
        const publishedOnly = list.filter((a) => !a.status || a.status === "published");
        if (publishedOnly.length > 0) {
          return publishedOnly.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        }
      }
    } catch {
      // ignore and use in-memory SAMPLE_ARTICLES
    }
  }
  const serverList = getServerArticles();
  return [...serverList].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
};

/** Unique by id — prevents duplicate cards in aggregated feeds. */
export const dedupe = (list: Article[]) => {
  const seen = new Set<string>();
  return list.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch articles, optionally filtered by category.
 * "general-news" returns all categories (it is a UI aggregation, not a DB category).
 */
export async function getArticles(category?: CategorySlug): Promise<Article[]> {
  const fallback = () => {
    const all = sampleSource();
    if (!category || category === "general-news") return dedupe(all);
    return all.filter((a) => a.category === category);
  };

  if (!isSupabaseReady || !supabase) {
    return fallback();
  }

  try {
    let q = supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .lte("published_at", now())
      .order("published_at", { ascending: false });

    if (category && category !== "general-news") {
      q = q.eq("categories.slug", category);
    }

    const { data, error } = await q;
    if (error) {
      console.warn("[api] getArticles error, using sample data:", error.message);
      return fallback();
    }

    const rows = cast(data);
    const filtered =
      category && category !== "general-news" ? rows.filter((r) => r.categories !== null) : rows;

    const result = dedupe(filtered.map(mapArticle));
    return result.length > 0 ? result : fallback();
  } catch (err) {
    console.warn("[api] getArticles network exception, using sample data:", (err as Error).message);
    return fallback();
  }
}

/**
 * Fetch articles to show in hero carousels.
 * Featured articles come first; fills up to `limit` with non-featured if needed.
 */
export async function getFeatured(category?: CategorySlug, limit = 5): Promise<Article[]> {
  const fallback = async () => {
    const list = await getArticles(category);
    const featured = list.filter((a) => a.featured);
    return dedupe([...featured, ...list]).slice(0, limit);
  };

  if (!isSupabaseReady || !supabase) {
    return fallback();
  }

  try {
    let q = supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .lte("published_at", now())
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (category && category !== "general-news") {
      q = q.eq("categories.slug", category);
    }

    const { data, error } = await q;
    if (error) {
      console.warn("[api] getFeatured error, using sample data:", error.message);
      return fallback();
    }

    const rows = cast(data);
    const filtered =
      category && category !== "general-news" ? rows.filter((r) => r.categories !== null) : rows;

    const featured = filtered.map(mapArticle);

    // Pad with latest articles if we have fewer featured items than requested
    if (featured.length < limit) {
      const all = await getArticles(category);
      const combined = dedupe([...featured, ...all]).slice(0, limit);
      return combined.length > 0 ? combined : fallback();
    }
    return dedupe(featured);
  } catch (err) {
    console.warn("[api] getFeatured network exception, using sample data:", (err as Error).message);
    return fallback();
  }
}

/** Fetch a single article by its URL slug. Returns null if not found or not published. */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const fallback = () => sampleSource().find((a) => a.slug === slug) ?? null;

  if (!isSupabaseReady || !supabase) {
    return fallback();
  }

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", now())
      .maybeSingle();

    if (error) {
      console.warn("[api] getArticleBySlug error, using sample data:", error.message);
      return fallback();
    }
    if (!data) return fallback();

    return mapArticle(data as unknown as ArticleRowWithCategory);
  } catch (err) {
    console.warn(
      "[api] getArticleBySlug network exception, using sample data:",
      (err as Error).message,
    );
    return fallback();
  }
}

/** Fetch up to `limit` published articles from the same category, excluding the current one. */
export async function getRelated(article: Article, limit = 3): Promise<Article[]> {
  const fallback = () =>
    sampleSource()
      .filter((a) => a.category === article.category && a.id !== article.id)
      .slice(0, limit);

  if (!isSupabaseReady || !supabase) {
    return fallback();
  }

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .lte("published_at", now())
      .eq("categories.slug", article.category)
      .neq("slug", article.slug)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[api] getRelated error, using sample data:", error.message);
      return fallback();
    }

    const rows = cast(data).filter((r) => r.categories !== null);
    const result = rows.map(mapArticle);
    return result.length > 0 ? result : fallback();
  } catch (err) {
    console.warn("[api] getRelated network exception, using sample data:", (err as Error).message);
    return fallback();
  }
}

/**
 * Fetch articles ranked by reading_time (proxy for depth/popularity).
 * Replace with a real view_count column once analytics are connected.
 */
export async function getPopular(limit = 5): Promise<Article[]> {
  const fallback = () => {
    const src = sampleSource();
    const overrides = src.filter((a) => a.isPopularOverride);
    const rest = src
      .filter((a) => !a.isPopularOverride)
      .sort((a, b) => b.readingTime - a.readingTime || a.id.localeCompare(b.id));
    return [...overrides, ...rest].slice(0, limit);
  };

  if (!isSupabaseReady || !supabase) {
    return fallback();
  }

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .lte("published_at", now())
      .order("is_popular_override", { ascending: false })
      .order("reading_time", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[api] getPopular error, using sample data:", error.message);
      return fallback();
    }
    const rows = cast(data);
    const result = rows.map(mapArticle);
    return result.length > 0 ? result : fallback();
  } catch (err) {
    console.warn("[api] getPopular network exception, using sample data:", (err as Error).message);
    return fallback();
  }
}

/** Fetch all published articles marked as breaking news (for the ticker). */
export async function getBreaking(): Promise<Article[]> {
  const fallback = () => sampleSource().filter((a) => a.breaking);

  if (!isSupabaseReady || !supabase) {
    return fallback();
  }

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .lte("published_at", now())
      .eq("is_breaking", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.warn("[api] getBreaking error, using sample data:", error.message);
      return fallback();
    }
    const rows = cast(data);
    const result = rows.map(mapArticle);
    return result.length > 0 ? result : fallback();
  } catch (err) {
    console.warn("[api] getBreaking network exception, using sample data:", (err as Error).message);
    return fallback();
  }
}

/**
 * Full-text search across article titles and excerpts.
 * Uses Supabase PostgREST `.or()` with `ilike` — backed by GIN trigram indexes.
 */
export async function searchArticles(query: string): Promise<Article[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const fallback = () =>
    sampleSource().filter((a) => {
      const text = [
        a.headline,
        a.description,
        a.category,
        a.category.replace("-", " "),
        ...a.content.map((b) => ("text" in b ? b.text : "")),
      ]
        .join(" ")
        .toLowerCase();
      return q.split(/\s+/).every((t) => text.includes(t));
    });

  if (!isSupabaseReady || !supabase) {
    return fallback();
  }

  try {
    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_SELECT)
      .eq("status", "published")
      .lte("published_at", now())
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("[api] searchArticles error, using sample data:", error.message);
      return fallback();
    }
    const rows = cast(data);
    const result = rows.map(mapArticle);
    return result.length > 0 ? result : fallback();
  } catch (err) {
    console.warn(
      "[api] searchArticles network exception, using sample data:",
      (err as Error).message,
    );
    return fallback();
  }
}

/** Format an ISO date string as a human-readable UK date, e.g. "10 Nov 2026". */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult {
  articles: Article[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Paginated article fetch — used for "load more" or numbered pagination UIs.
 * @param category  Optional category slug filter
 * @param page      1-based page number
 * @param pageSize  Number of articles per page (default 12)
 */
export async function getArticlesPaginated(
  category?: CategorySlug,
  page = 1,
  pageSize = 12,
): Promise<PaginatedResult> {
  const fallback = () => {
    const all =
      !category || category === "general-news"
        ? sampleSource()
        : sampleSource().filter((a) => a.category === category);
    const start = (page - 1) * pageSize;
    return {
      articles: dedupe(all).slice(start, start + pageSize),
      total: all.length,
      page,
      pageSize,
      hasMore: start + pageSize < all.length,
    };
  };

  if (!isSupabaseReady || !supabase) {
    return fallback();
  }

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Note: "count()" appended to the select string triggers Supabase's exact count
    let q = supabase
      .from("articles")
      .select(ARTICLE_SELECT + ", count()", { count: "exact" })
      .eq("status", "published")
      .lte("published_at", now())
      .order("published_at", { ascending: false })
      .range(from, to);

    if (category && category !== "general-news") {
      q = q.eq("categories.slug", category);
    }

    const { data, error, count } = await q;
    if (error) {
      console.warn("[api] getArticlesPaginated error, using sample data:", error.message);
      return fallback();
    }

    const rows = cast(data);
    const filtered =
      category && category !== "general-news" ? rows.filter((r) => r.categories !== null) : rows;

    const total = count ?? 0;
    const articles = filtered.map(mapArticle);
    if (articles.length === 0 && total === 0) {
      return fallback();
    }
    return {
      articles,
      total,
      page,
      pageSize,
      hasMore: from + pageSize < total,
    };
  } catch (err) {
    console.warn(
      "[api] getArticlesPaginated network exception, using sample data:",
      (err as Error).message,
    );
    return fallback();
  }
}
