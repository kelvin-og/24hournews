/**
 * db-server.ts
 * Server-side direct Supabase PostgreSQL executor.
 * Runs on the backend (Nitro / server routes) with direct database rights,
 * bypassing client RLS for reliable newsroom persistence.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { Article } from "@/lib/news/types";

let cachedToken: string | null = null;
let cachedRef: string | null = null;

function getSupabaseConfig(): { token: string | null; ref: string | null } {
  if (cachedToken && cachedRef) {
    return { token: cachedToken, ref: cachedRef };
  }

  // 1. Check process.env
  if (process.env["SUPABASE_ACCESS_TOKEN"] && process.env["SUPABASE_PROJECT_REF"]) {
    cachedToken = process.env["SUPABASE_ACCESS_TOKEN"];
    cachedRef = process.env["SUPABASE_PROJECT_REF"];
    return { token: cachedToken, ref: cachedRef };
  }

  // 2. Read from .env
  try {
    const envPath = resolve(process.cwd(), ".env");
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("SUPABASE_ACCESS_TOKEN=")) {
          cachedToken = trimmed
            .slice("SUPABASE_ACCESS_TOKEN=".length)
            .trim()
            .replace(/^["']|["']$/g, "");
        } else if (trimmed.startsWith("SUPABASE_PROJECT_REF=")) {
          cachedRef = trimmed
            .slice("SUPABASE_PROJECT_REF=".length)
            .trim()
            .replace(/^["']|["']$/g, "");
        }
      }
    }
  } catch (err) {
    console.warn("[db-server] Failed to parse .env file:", err);
  }

  return { token: cachedToken, ref: cachedRef };
}

/**
 * Execute raw SQL query directly against the Supabase database.
 */
export async function executeSql<T = unknown>(query: string): Promise<T | null> {
  const { token, ref } = getSupabaseConfig();
  if (!token || !ref) {
    console.warn("[db-server] Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF");
    return null;
  }

  try {
    const url = `https://api.supabase.com/v1/projects/${ref}/database/query`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[db-server] SQL execution error (HTTP ${response.status}):`, errText);
      return null;
    }

    const data = (await response.json()) as T;
    return data;
  } catch (err) {
    console.error("[db-server] Network exception executing SQL:", err);
    return null;
  }
}

/** Escape single quotes in SQL string literals */
function sqlEscape(val: string | null | undefined): string {
  if (val === null || val === undefined) return "NULL";
  return `'${val.replace(/'/g, "''")}'`;
}

/**
 * Upsert an article into the Supabase articles table.
 */
export async function upsertArticleInSupabase(article: Article): Promise<boolean> {
  const title = sqlEscape(article.headline);
  const slug = sqlEscape(article.slug);
  const excerpt = sqlEscape(article.description || article.subtitle || "");
  const content = sqlEscape(JSON.stringify(article.content || []));
  const featuredImage = sqlEscape(article.featuredImage || "");
  const imageAlt = sqlEscape(article.imageAlt || article.headline);
  const imageCaption = sqlEscape(article.imageCaption || "");
  const categorySlug = sqlEscape(article.category);
  const authorName = sqlEscape(article.author || "Staff Writer");
  const isFeatured = Boolean(article.featured);
  const isBreaking = Boolean(article.breaking);
  const isEditorialPick = Boolean(article.isEditorialPick);
  const isPopularOverride = Boolean(article.isPopularOverride);
  const readingTime = Number(article.readingTime) || 3;
  const publishedAt = article.publishedAt ? sqlEscape(article.publishedAt) : "now()";

  const sql = `
    INSERT INTO public.articles (
      title,
      slug,
      excerpt,
      content,
      featured_image,
      image_alt,
      image_caption,
      category_id,
      author_name,
      status,
      is_featured,
      is_breaking,
      is_editorial_pick,
      is_popular_override,
      reading_time,
      published_at,
      created_at,
      updated_at
    )
    VALUES (
      ${title},
      ${slug},
      ${excerpt},
      ${content}::jsonb,
      ${featuredImage},
      ${imageAlt},
      ${imageCaption},
      COALESCE((SELECT id FROM public.categories WHERE slug = ${categorySlug} LIMIT 1), 1),
      ${authorName},
      'published'::article_status,
      ${isFeatured},
      ${isBreaking},
      ${isEditorialPick},
      ${isPopularOverride},
      ${readingTime},
      ${publishedAt}::timestamptz,
      now(),
      now()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      content = EXCLUDED.content,
      featured_image = EXCLUDED.featured_image,
      image_alt = EXCLUDED.image_alt,
      image_caption = EXCLUDED.image_caption,
      category_id = EXCLUDED.category_id,
      author_name = EXCLUDED.author_name,
      status = EXCLUDED.status,
      is_featured = EXCLUDED.is_featured,
      is_breaking = EXCLUDED.is_breaking,
      is_editorial_pick = EXCLUDED.is_editorial_pick,
      is_popular_override = EXCLUDED.is_popular_override,
      reading_time = EXCLUDED.reading_time,
      published_at = EXCLUDED.published_at,
      updated_at = now();
  `;

  const res = await executeSql(sql);
  return res !== null;
}

/**
 * Remove an article from Supabase by its slug or ID.
 */
export async function deleteArticleInSupabase(idOrSlug: string): Promise<boolean> {
  const escaped = sqlEscape(idOrSlug);
  const isNumeric = /^\d+$/.test(idOrSlug);

  const condition = isNumeric ? `id = ${idOrSlug} OR slug = ${escaped}` : `slug = ${escaped}`;

  const sql = `DELETE FROM public.articles WHERE ${condition};`;
  const res = await executeSql(sql);
  return res !== null;
}

/**
 * Fetch all articles from Supabase with joined category.
 */
export async function fetchArticlesFromSupabase(): Promise<Article[] | null> {
  const sql = `
    SELECT 
      a.id, a.title, a.slug, a.excerpt, a.content, a.featured_image, a.image_alt, a.image_caption,
      a.category_id, a.author_name, a.status, a.is_featured, a.is_breaking,
      a.is_editorial_pick, a.is_popular_override, a.reading_time,
      a.published_at, a.created_at, a.updated_at,
      c.slug as category_slug
    FROM public.articles a
    LEFT JOIN public.categories c ON c.id = a.category_id
    ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC;
  `;

  interface RawRow {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: import("@/lib/supabase/types").Json;
    featured_image: string | null;
    image_alt: string | null;
    image_caption: string | null;
    category_id: number;
    author_name: string;
    status: "draft" | "published" | "scheduled";
    is_featured: boolean;
    is_breaking: boolean;
    is_editorial_pick: boolean;
    is_popular_override: boolean;
    reading_time: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    category_slug: string | null;
  }

  const rows = await executeSql<RawRow[]>(sql);
  if (!rows || !Array.isArray(rows)) return null;

  return rows.map((r) => ({
    id: String(r.id),
    headline: r.title,
    slug: r.slug,
    category: (r.category_slug ?? "education") as import("@/lib/site").ArticleCategory,
    description: r.excerpt ?? "",
    content: Array.isArray(r.content) ? (r.content as never) : [{ type: "paragraph", text: "" }],
    featuredImage: r.featured_image ?? "",
    imageAlt: r.image_alt ?? r.title,
    imageCaption: r.image_caption ?? "",
    author: r.author_name,
    publishedAt: r.published_at ?? r.created_at,
    readingTime: r.reading_time || 3,
    featured: Boolean(r.is_featured),
    breaking: Boolean(r.is_breaking),
    isEditorialPick: Boolean(r.is_editorial_pick),
    isPopularOverride: Boolean(r.is_popular_override),
  }));
}

/**
 * Log an audit event directly in the Supabase audit_logs table.
 */
export async function insertAuditLogInSupabase(log: {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityTitle?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}): Promise<boolean> {
  const id = sqlEscape(log.id);
  const actorId = sqlEscape(log.actorId);
  const actorName = sqlEscape(log.actorName);
  const actorEmail = sqlEscape(log.actorEmail);
  const action = sqlEscape(log.action);
  const entityType = sqlEscape(log.entityType);
  const entityId = log.entityId ? sqlEscape(log.entityId) : "NULL";
  const entityTitle = log.entityTitle ? sqlEscape(log.entityTitle) : "NULL";
  const details = log.details ? sqlEscape(JSON.stringify(log.details)) + "::jsonb" : "NULL";
  const timestamp = sqlEscape(log.timestamp);

  const sql = `
    INSERT INTO public.audit_logs (
      id, actor_id, actor_name, actor_email, action, entity_type, entity_id, entity_title, details, timestamp
    )
    VALUES (
      ${id}, ${actorId}, ${actorName}, ${actorEmail}, ${action}, ${entityType}, ${entityId}, ${entityTitle}, ${details}, ${timestamp}::timestamptz
    );
  `;
  const res = await executeSql(sql);
  return res !== null;
}

/**
 * Fetch latest audit logs from Supabase.
 */
export async function fetchAuditLogsFromSupabase(): Promise<unknown[] | null> {
  const sql = `
    SELECT id, actor_id, actor_name, actor_email, action, entity_type, entity_id, entity_title, details, timestamp
    FROM public.audit_logs
    ORDER BY timestamp DESC
    LIMIT 150;
  `;
  return executeSql(sql);
}

/**
 * Upsert a staff user profile in Supabase.
 */
export async function upsertStaffProfileInSupabase(user: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
}): Promise<boolean> {
  const id = sqlEscape(user.id);
  const email = sqlEscape(user.email);
  const fullName = sqlEscape(user.fullName);
  const role = sqlEscape(user.role);
  const isActive = Boolean(user.isActive);
  const avatarUrl = user.avatarUrl ? sqlEscape(user.avatarUrl) : "NULL";

  const sql = `
    INSERT INTO public.staff_profiles (id, email, full_name, role, is_active, avatar_url, created_at)
    VALUES (${id}, ${email}, ${fullName}, ${role}, ${isActive}, ${avatarUrl}, now())
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_active = EXCLUDED.is_active;
  `;
  const res = await executeSql(sql);
  return res !== null;
}

/**
 * Fetch staff profiles from Supabase.
 */
export async function fetchStaffProfilesFromSupabase(): Promise<unknown[] | null> {
  const sql = `
    SELECT id, email, full_name, role, is_active, avatar_url, created_at, last_login_at
    FROM public.staff_profiles
    ORDER BY created_at ASC;
  `;
  return executeSql(sql);
}

/**
 * Upsert a media asset in Supabase.
 */
export async function upsertMediaAssetInSupabase(media: {
  id: string;
  filename: string;
  url: string;
  altText: string;
  caption?: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<boolean> {
  const id = sqlEscape(media.id);
  const filename = sqlEscape(media.filename);
  const url = sqlEscape(media.url);
  const altText = sqlEscape(media.altText);
  const caption = media.caption ? sqlEscape(media.caption) : "''";
  const mimeType = sqlEscape(media.mimeType);
  const sizeBytes = Number(media.sizeBytes) || 0;

  const sql = `
    INSERT INTO public.media_assets (id, filename, url, alt_text, caption, mime_type, size_bytes, uploaded_at)
    VALUES (${id}, ${filename}, ${url}, ${altText}, ${caption}, ${mimeType}, ${sizeBytes}, now())
    ON CONFLICT (id) DO UPDATE SET
      filename = EXCLUDED.filename,
      alt_text = EXCLUDED.alt_text,
      caption = EXCLUDED.caption;
  `;
  const res = await executeSql(sql);
  return res !== null;
}

/**
 * Fetch all media assets from Supabase.
 */
export async function fetchMediaAssetsFromSupabase(): Promise<unknown[] | null> {
  const sql = `
    SELECT id, filename, url, alt_text, caption, mime_type, size_bytes, uploaded_at
    FROM public.media_assets
    ORDER BY uploaded_at DESC;
  `;
  return executeSql(sql);
}
