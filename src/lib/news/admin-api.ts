import type { Article, ContentBlock } from "./types";
import { SAMPLE_ARTICLES } from "./sample-data";
import { CATEGORIES, type CategorySlug } from "@/lib/site";
import { adminSupabase } from "@/lib/auth/client";
import type { AppRole } from "@/lib/auth/types";

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const STORAGE_ARTICLES_KEY = "24hournews_admin_articles";
const STORAGE_MEDIA_KEY = "24hournews_admin_media";
const STORAGE_STAFF_KEY = "24hournews_admin_staff";
const STORAGE_AUDIT_KEY = "24hournews_admin_audit";

// ─── Types ────────────────────────────────────────────────────────────────────
export type AdminArticleStatus = "draft" | "scheduled" | "published" | "archived";

export interface AdminArticle extends Article {
  status: AdminArticleStatus;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  scheduledFor?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  altText: string;
  caption?: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: "article" | "user" | "media" | "setting";
  entityId?: string;
  entityTitle?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ArticleFilterOptions {
  status?: "all" | AdminArticleStatus;
  category?: "all" | CategorySlug;
  author?: string;
  search?: string;
  sortBy?: "latest" | "oldest" | "title";
}

// ─── Server Sync Helper ───────────────────────────────────────────────────────
async function syncToServer(action: "upsert" | "remove", article?: AdminArticle, id?: string) {
  if (typeof window === "undefined") return;
  try {
    if (action === "upsert" && article && article.status === "published") {
      await fetch("/api/sync-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert", article }),
      });
    } else if (action === "remove" || (article && article.status !== "published")) {
      await fetch("/api/sync-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", id: id || article?.id }),
      });
    }
  } catch {
    // Non-blocking sync attempt
  }
}

// ─── Supabase Persistence Helper ──────────────────────────────────────────────
/**
 * Upsert an article into Supabase when the admin client is configured.
 * Falls back gracefully — localStorage + server-store always succeed first.
 *
 * NOTE: Requires the articles table to have:
 *   is_editorial_pick  boolean NOT NULL DEFAULT false
 *   is_popular_override boolean NOT NULL DEFAULT false
 * Ask Lovable to add these columns via a migration.
 */
async function persistToSupabase(article: AdminArticle): Promise<void> {
  if (!adminSupabase) return;
  try {
    // Resolve category_id from the categories table
    const { data: rawCat } = await adminSupabase
      .from("categories")
      .select("id")
      .eq("slug", article.category)
      .maybeSingle();

    const catRow = rawCat as { id: number } | null;

    if (!catRow) {
      console.warn("[admin-api] persistToSupabase: category not found for slug", article.category);
      return;
    }

    const payload = {
      slug: article.slug,
      title: article.headline,
      excerpt: article.description || null,
      content: article.content as import("@/lib/supabase/types").Json,
      featured_image: article.featuredImage || null,
      image_alt: article.imageAlt || null,
      image_caption: article.imageCaption || null,
      category_id: catRow.id,
      author_name: article.author,
      status: (article.status === "archived" ? "draft" : article.status) as
        "draft" | "published" | "scheduled",
      is_featured: Boolean(article.featured),
      is_breaking: Boolean(article.breaking),
      is_editorial_pick: Boolean(article.isEditorialPick),
      is_popular_override: Boolean(article.isPopularOverride),
      reading_time: article.readingTime,
      published_at: article.publishedAt || null,
      updated_at: new Date().toISOString(),
    };

    // Try to match by slug so we do a true upsert
    const { data: rawExisting } = await adminSupabase
      .from("articles")
      .select("id")
      .eq("slug", article.slug)
      .maybeSingle();

    const existing = rawExisting as { id: number } | null;

    if (existing) {
      await adminSupabase
        .from("articles")
        .update(payload as never)
        .eq("id", existing.id);
    } else {
      await adminSupabase.from("articles").insert(payload as never);
    }
  } catch (err) {
    // Non-blocking — localStorage is source of truth until Supabase is set up
    console.warn("[admin-api] persistToSupabase failed (non-blocking):", err);
  }
}

/**
 * Delete an article from Supabase by its slug when the admin client is configured.
 */
async function deleteFromSupabase(slug: string): Promise<void> {
  if (!adminSupabase) return;
  try {
    await adminSupabase.from("articles").delete().eq("slug", slug);
  } catch (err) {
    console.warn("[admin-api] deleteFromSupabase failed (non-blocking):", err);
  }
}

// ─── Slug Generator ───────────────────────────────────────────────────────────
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Word Count & Reading Time Helper ─────────────────────────────────────────
export function calculateReadingTime(blocks: ContentBlock[], excerpt = ""): number {
  let wordCount = excerpt.trim().split(/\s+/).filter(Boolean).length;
  for (const block of blocks) {
    if ("text" in block && block.text) {
      wordCount += block.text.trim().split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(1, Math.ceil(wordCount / 200));
}

// ─── Local Store Initialization ───────────────────────────────────────────────
export function getStoredArticles(): AdminArticle[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_ARTICLES_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  // Initialize with SAMPLE_ARTICLES as published items
  const initial: AdminArticle[] = SAMPLE_ARTICLES.map((a, i) => ({
    ...a,
    status: (i === 1 ? "draft" : i === 4 ? "scheduled" : "published") as AdminArticleStatus,
    tags: [a.category, "Ghana News"],
    seoTitle: a.headline,
    seoDescription: a.description,
  }));
  localStorage.setItem(STORAGE_ARTICLES_KEY, JSON.stringify(initial));
  return initial;
}

function saveStoredArticles(articles: AdminArticle[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_ARTICLES_KEY, JSON.stringify(articles));
}

// ─── Article CRUD ─────────────────────────────────────────────────────────────

export async function getAdminArticles(
  filters: ArticleFilterOptions = {},
): Promise<AdminArticle[]> {
  // Try fetching latest live articles from Supabase via server sync endpoint
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/sync-articles");
      if (res.ok) {
        const liveArticles = (await res.json()) as Article[];
        if (Array.isArray(liveArticles) && liveArticles.length > 0) {
          const stored = getStoredArticles();
          const merged: AdminArticle[] = liveArticles.map((la) => {
            const match = stored.find((s) => s.id === la.id || s.slug === la.slug);
            return {
              ...la,
              status: match?.status ?? ("published" as AdminArticleStatus),
              tags: match?.tags ?? [la.category, "Ghana News"],
              seoTitle: match?.seoTitle ?? la.headline,
              seoDescription: match?.seoDescription ?? la.description,
              ...(match?.scheduledFor ? { scheduledFor: match.scheduledFor } : {}),
              ...(match?.createdBy ? { createdBy: match.createdBy } : {}),
              ...(match?.updatedBy ? { updatedBy: match.updatedBy } : {}),
            };
          });
          const liveSlugs = new Set(liveArticles.map((a) => a.slug));
          const localOnly = stored.filter((s) => !liveSlugs.has(s.slug));
          const allMerged = [...merged, ...localOnly];
          saveStoredArticles(allMerged);
        }
      }
    } catch {
      // Non-blocking fallback to local storage
    }
  }

  const articles = getStoredArticles();
  let list = [...articles];

  // Status filter
  if (filters.status && filters.status !== "all") {
    list = list.filter((a) => a.status === filters.status);
  }

  // Category filter
  if (filters.category && filters.category !== "all" && filters.category !== "general-news") {
    list = list.filter((a) => a.category === filters.category);
  }

  // Search filter
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.headline.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // Author filter
  if (filters.author && filters.author !== "all") {
    list = list.filter((a) => a.author === filters.author);
  }

  // Sort
  if (filters.sortBy === "oldest") {
    list.sort((a, b) => (a.publishedAt || a.id).localeCompare(b.publishedAt || b.id));
  } else if (filters.sortBy === "title") {
    list.sort((a, b) => a.headline.localeCompare(b.headline));
  } else {
    // Default latest
    list.sort((a, b) => (b.publishedAt || b.id).localeCompare(a.publishedAt || a.id));
  }

  return list;
}

export async function getAdminArticleById(id: string): Promise<AdminArticle | null> {
  let list = getStoredArticles();
  let match = list.find((a) => a.id === id || a.slug === id);
  if (!match && typeof window !== "undefined") {
    await getAdminArticles();
    list = getStoredArticles();
    match = list.find((a) => a.id === id || a.slug === id);
  }
  return match || null;
}

export async function saveAdminArticle(
  article: Omit<Partial<AdminArticle>, "category"> & { headline: string; category: CategorySlug },
  actor: { id: string; name: string; email: string },
): Promise<AdminArticle> {
  const list = getStoredArticles();
  const isNew = !article.id || !list.some((a) => a.id === article.id);

  const slug = article.slug || generateSlug(article.headline);
  const readingTime = article.content
    ? calculateReadingTime(article.content, article.description)
    : 3;

  const now = new Date().toISOString();

  let target: AdminArticle;

  if (isNew) {
    const newId = `art-${Date.now()}`;
    target = {
      id: newId,
      headline: article.headline,
      slug,
      category: (article.category === "general-news"
        ? "education"
        : article.category) as import("@/lib/site").ArticleCategory,
      subtitle: article.description || "",
      description: article.description || "",
      content: article.content || [{ type: "paragraph", text: "" }],
      featuredImage:
        article.featuredImage ||
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1280&auto=format&fit=crop&q=80",
      imageAlt: article.imageAlt || article.headline,
      imageCaption: article.imageCaption || "",
      author: article.author || actor.name,
      status: article.status || "draft",
      publishedAt: article.status === "published" ? article.publishedAt || now : now,
      updatedAt: now,
      readingTime,
      featured: Boolean(article.featured),
      breaking: Boolean(article.breaking),
      isEditorialPick: Boolean(article.isEditorialPick),
      isPopularOverride: Boolean(article.isPopularOverride),
      tags: article.tags || [article.category],
      seoTitle: article.seoTitle || article.headline,
      seoDescription: article.seoDescription || article.description || "",
      ...(article.scheduledFor !== undefined ? { scheduledFor: article.scheduledFor } : {}),
      createdBy: actor.name,
      updatedBy: actor.name,
    };
    list.unshift(target);
    await logAuditEvent({
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      action: "article.created",
      entityType: "article",
      entityId: target.id,
      entityTitle: target.headline,
      details: { status: target.status, category: target.category },
    });
  } else {
    const idx = list.findIndex((a) => a.id === article.id);
    const existing = list[idx];
    if (!existing) return existing as never;
    target = {
      ...existing,
      ...article,
      status: article.status ?? existing.status,
      featured: article.featured !== undefined ? Boolean(article.featured) : existing.featured,
      breaking:
        article.breaking !== undefined ? Boolean(article.breaking) : Boolean(existing.breaking),
      isEditorialPick:
        article.isEditorialPick !== undefined
          ? Boolean(article.isEditorialPick)
          : Boolean(existing.isEditorialPick),
      isPopularOverride:
        article.isPopularOverride !== undefined
          ? Boolean(article.isPopularOverride)
          : Boolean(existing.isPopularOverride),
      slug,
      readingTime,
      updatedAt: now,
      updatedBy: actor.name,
    } as AdminArticle;
    list[idx] = target;
    await logAuditEvent({
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      action: "article.updated",
      entityType: "article",
      entityId: target.id,
      entityTitle: target.headline,
      details: { status: target.status },
    });
  }

  saveStoredArticles(list);
  await syncToServer("upsert", target);
  await persistToSupabase(target);
  return target;
}

export async function setArticleStatus(
  id: string,
  newStatus: AdminArticleStatus,
  actor: { id: string; name: string; email: string },
): Promise<AdminArticle | null> {
  const list = getStoredArticles();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const item = list[idx];
  if (!item) return null;

  item.status = newStatus;
  item.updatedAt = new Date().toISOString();
  item.updatedBy = actor.name;

  if (newStatus === "published" && !item.publishedAt) {
    item.publishedAt = new Date().toISOString();
  }

  list[idx] = item;
  saveStoredArticles(list);
  await syncToServer(newStatus === "published" ? "upsert" : "remove", item);
  await persistToSupabase(item);

  await logAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    action: `article.${newStatus}`,
    entityType: "article",
    entityId: item.id,
    entityTitle: item.headline,
  });

  return item;
}

export async function toggleArticleFeature(
  id: string,
  field: "isEditorialPick" | "isPopularOverride" | "featured" | "breaking",
  actor: { id: string; name: string; email: string },
): Promise<AdminArticle | null> {
  const list = getStoredArticles();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  const item = list[idx];
  if (!item) return null;

  const currentVal = Boolean(item[field]);
  item[field] = !currentVal;
  item.updatedAt = new Date().toISOString();
  item.updatedBy = actor.name;

  list[idx] = item;
  saveStoredArticles(list);
  await syncToServer("upsert", item);
  await persistToSupabase(item);

  const labels = {
    isEditorialPick: "Editorial Pick",
    isPopularOverride: "Most Popular",
    featured: "Hero Carousel",
    breaking: "Breaking News",
  };

  await logAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    action: `article.${field}_toggled`,
    entityType: "article",
    entityId: item.id,
    entityTitle: item.headline,
    details: { field, enabled: item[field], label: labels[field] },
  });

  return item;
}

export async function deleteAdminArticle(
  id: string,
  actor: { id: string; name: string; email: string },
): Promise<boolean> {
  const list = getStoredArticles();
  const target = list.find((a) => a.id === id);
  if (!target) return false;

  const filtered = list.filter((a) => a.id !== id);
  saveStoredArticles(filtered);
  await syncToServer("remove", undefined, id);
  if (target.slug) {
    await deleteFromSupabase(target.slug);
  }

  await logAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    action: "article.deleted",
    entityType: "article",
    entityId: id,
    entityTitle: target.headline,
  });

  return true;
}

// ─── Media Library ────────────────────────────────────────────────────────────

const DEFAULT_MEDIA: MediaAsset[] = [
  {
    id: "med-1",
    filename: "parliament-session.jpg",
    url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1280&auto=format&fit=crop&q=80",
    altText: "Parliamentary chamber during a debate",
    caption: "Government and opposition MPs in parliamentary session",
    mimeType: "image/jpeg",
    sizeBytes: 1024 * 340,
    uploadedAt: "2026-11-01T10:00:00Z",
  },
  {
    id: "med-2",
    filename: "classroom-digital-learning.jpg",
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1280&auto=format&fit=crop&q=80",
    altText: "Students using tablets in a modern classroom",
    caption: "Regional school digital initiative pilot",
    mimeType: "image/jpeg",
    sizeBytes: 1024 * 412,
    uploadedAt: "2026-11-04T14:30:00Z",
  },
  {
    id: "med-3",
    filename: "football-stadium.jpg",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1280&auto=format&fit=crop&q=80",
    altText: "Crowded football stadium under floodlights",
    caption: "League opening match in Accra",
    mimeType: "image/jpeg",
    sizeBytes: 1024 * 510,
    uploadedAt: "2026-11-08T18:00:00Z",
  },
  {
    id: "med-4",
    filename: "health-clinic-checkup.jpg",
    url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1280&auto=format&fit=crop&q=80",
    altText: "Doctor measuring patient blood pressure",
    caption: "Community health screening exercise",
    mimeType: "image/jpeg",
    sizeBytes: 1024 * 280,
    uploadedAt: "2026-11-10T09:15:00Z",
  },
];

export function getStoredMedia(): MediaAsset[] {
  if (typeof window === "undefined") return DEFAULT_MEDIA;
  const raw = localStorage.getItem(STORAGE_MEDIA_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_MEDIA_KEY, JSON.stringify(DEFAULT_MEDIA));
  return DEFAULT_MEDIA;
}

export async function uploadMediaAsset(
  file: File,
  altText: string,
  caption?: string,
  actor?: { id: string; name: string; email: string },
): Promise<MediaAsset> {
  let url = "";

  // Try uploading to Supabase Storage if available
  if (adminSupabase) {
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { data, error } = await adminSupabase.storage.from("news-images").upload(path, file);
      if (!error && data?.path) {
        const { data: pub } = adminSupabase.storage.from("news-images").getPublicUrl(data.path);
        url = pub.publicUrl;
      }
    } catch (e) {
      console.warn("[media] Supabase upload failed, using local blob:", e);
    }
  }

  // Fallback to Object URL or Data URL
  if (!url) {
    url = URL.createObjectURL(file);
  }

  const asset: MediaAsset = {
    id: `med-${Date.now()}`,
    filename: file.name,
    url,
    altText: altText || file.name.replace(/\.[^/.]+$/, ""),
    caption: caption || "",
    mimeType: file.type || "image/jpeg",
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };

  const list = getStoredMedia();
  list.unshift(asset);
  localStorage.setItem(STORAGE_MEDIA_KEY, JSON.stringify(list));

  if (actor) {
    await logAuditEvent({
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      action: "media.uploaded",
      entityType: "media",
      entityId: asset.id,
      entityTitle: asset.filename,
    });
  }

  return asset;
}

export async function deleteMediaAsset(id: string): Promise<boolean> {
  const list = getStoredMedia();
  const filtered = list.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_MEDIA_KEY, JSON.stringify(filtered));
  return true;
}

// ─── Staff Management (Super Admin) ───────────────────────────────────────────

const DEFAULT_STAFF: StaffUser[] = [
  {
    id: "user-superadmin-01",
    email: "superadmin@24hournews.com.gh",
    fullName: "Chief Editor (Super Admin)",
    role: "super_admin",
    isActive: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00Z",
    lastLoginAt: "2026-11-13T20:15:00Z",
  },
  {
    id: "user-editor-01",
    email: "ama.osei@24hournews.com.gh",
    fullName: "Ama Osei",
    role: "editor",
    isActive: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    createdAt: "2026-02-15T00:00:00Z",
    lastLoginAt: "2026-11-12T16:40:00Z",
  },
  {
    id: "user-editor-02",
    email: "kofi.asante@24hournews.com.gh",
    fullName: "Kofi Asante",
    role: "editor",
    isActive: true,
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    createdAt: "2026-03-01T00:00:00Z",
    lastLoginAt: "2026-11-10T11:20:00Z",
  },
  {
    id: "user-editor-03",
    email: "yaw.boateng@24hournews.com.gh",
    fullName: "Yaw Boateng",
    role: "editor",
    isActive: false,
    createdAt: "2026-04-10T00:00:00Z",
    lastLoginAt: "2026-09-01T08:00:00Z",
  },
];

export function getStoredStaff(): StaffUser[] {
  if (typeof window === "undefined") return DEFAULT_STAFF;
  const raw = localStorage.getItem(STORAGE_STAFF_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(DEFAULT_STAFF));
  return DEFAULT_STAFF;
}

export async function inviteStaffMember(
  data: { email: string; fullName: string; role: AppRole },
  actor: { id: string; name: string; email: string },
): Promise<StaffUser> {
  const staff = getStoredStaff();
  const newUser: StaffUser = {
    id: `user-${Date.now()}`,
    email: data.email.trim().toLowerCase(),
    fullName: data.fullName.trim(),
    role: data.role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  staff.push(newUser);
  localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(staff));

  await logAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    action: "user.invited",
    entityType: "user",
    entityId: newUser.id,
    entityTitle: newUser.fullName,
    details: { email: newUser.email, role: newUser.role },
  });

  return newUser;
}

export async function updateStaffRole(
  userId: string,
  newRole: AppRole,
  actor: { id: string; name: string; email: string },
): Promise<StaffUser | null> {
  const staff = getStoredStaff();
  const target = staff.find((s) => s.id === userId);
  if (!target) return null;

  target.role = newRole;
  localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(staff));

  await logAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    action: "user.role_changed",
    entityType: "user",
    entityId: userId,
    entityTitle: target.fullName,
    details: { newRole },
  });

  return target;
}

export async function toggleStaffActive(
  userId: string,
  isActive: boolean,
  actor: { id: string; name: string; email: string },
): Promise<StaffUser | null> {
  const staff = getStoredStaff();
  const target = staff.find((s) => s.id === userId);
  if (!target) return null;

  target.isActive = isActive;
  localStorage.setItem(STORAGE_STAFF_KEY, JSON.stringify(staff));

  await logAuditEvent({
    actorId: actor.id,
    actorName: actor.name,
    actorEmail: actor.email,
    action: isActive ? "user.activated" : "user.deactivated",
    entityType: "user",
    entityId: userId,
    entityTitle: target.fullName,
  });

  return target;
}

// ─── Audit Trail ──────────────────────────────────────────────────────────────

export async function logAuditEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<void> {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(STORAGE_AUDIT_KEY);
  const logs: AuditEvent[] = raw ? JSON.parse(raw) : [];

  const entry: AuditEvent = {
    ...event,
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
  };

  logs.unshift(entry);
  // Keep last 150 events in local storage
  localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(logs.slice(0, 150)));
}

export function getAuditLogs(): AuditEvent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_AUDIT_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  // Initial demo audit items
  const initialLogs: AuditEvent[] = [
    {
      id: "aud-1",
      actorId: "user-superadmin-01",
      actorName: "Super Admin",
      actorEmail: "superadmin@24hournews.com.gh",
      action: "article.published",
      entityType: "article",
      entityId: "demo-1",
      entityTitle: "Regional schools pilot a new digital learning programme",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: "aud-2",
      actorId: "user-editor-01",
      actorName: "Ama Osei",
      actorEmail: "ama.osei@24hournews.com.gh",
      action: "article.created",
      entityType: "article",
      entityId: "demo-4",
      entityTitle: "Weekend music festival draws crowds to the capital",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "aud-3",
      actorId: "user-superadmin-01",
      actorName: "Super Admin",
      actorEmail: "superadmin@24hournews.com.gh",
      action: "user.role_changed",
      entityType: "user",
      entityId: "user-editor-01",
      entityTitle: "Ama Osei",
      details: { newRole: "editor" },
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_AUDIT_KEY, JSON.stringify(initialLogs));
  return initialLogs;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalArticles: number;
  publishedCount: number;
  draftCount: number;
  scheduledCount: number;
  totalMedia: number;
  totalStaff: number;
  recentArticles: AdminArticle[];
  recentActivity: AuditEvent[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const articles = getStoredArticles();
  const media = getStoredMedia();
  const staff = getStoredStaff();
  const logs = getAuditLogs();

  return {
    totalArticles: articles.length,
    publishedCount: articles.filter((a) => a.status === "published").length,
    draftCount: articles.filter((a) => a.status === "draft").length,
    scheduledCount: articles.filter((a) => a.status === "scheduled").length,
    totalMedia: media.length,
    totalStaff: staff.filter((s) => s.isActive).length,
    recentArticles: articles.slice(0, 5),
    recentActivity: logs.slice(0, 6),
  };
}
