/**
 * Maps database rows (ArticleRow + joined category slug) → the Article interface
 * used throughout the UI. This is the only file that knows about DB column names.
 */
import type { Article, ContentBlock } from "@/lib/news/types";
import type { ArticleCategory } from "@/lib/site";
import type { Json } from "./types";

// Fallback images for demo articles that have no uploaded featured_image yet.
// These are the same bundled assets used by the original sample data.
import educationImg from "@/assets/news-education.jpg";
import entertainmentImg from "@/assets/news-entertainment.jpg";
import businessImg from "@/assets/news-business.jpg";
import sportsImg from "@/assets/news-sports.jpg";
import politicsImg from "@/assets/news-politics.jpg";
import healthImg from "@/assets/news-health.jpg";
import generalImg from "@/assets/news-general.jpg";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  education: educationImg,
  entertainment: entertainmentImg,
  business: businessImg,
  sports: sportsImg,
  politics: politicsImg,
  health: healthImg,
  "general-news": generalImg,
};

/**
 * Shape returned by Supabase when categories is joined via select().
 * We cast the raw data to this type after fetching.
 */
export interface ArticleRowWithCategory {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: Json;
  featured_image: string | null;
  image_alt: string | null;
  image_caption: string | null;
  category_id: number;
  author_name: string;
  status: "draft" | "published" | "scheduled";
  is_featured: boolean;
  is_breaking: boolean;
  is_demo: boolean;
  is_editorial_pick?: boolean;
  is_popular_override?: boolean;
  reading_time: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories: { slug: string } | null;
}

/**
 * Parse `content` JSONB from the database into typed ContentBlock[].
 * Falls back gracefully if the value is malformed.
 */
function parseContent(raw: Json): ContentBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: ContentBlock[] = [];
  for (const block of raw) {
    if (typeof block !== "object" || block === null || Array.isArray(block)) continue;
    const b = block as Record<string, Json>;
    const type = b["type"];
    if (type === "paragraph" && typeof b["text"] === "string") {
      blocks.push({ type: "paragraph", text: b["text"] });
    } else if (type === "heading" && typeof b["text"] === "string") {
      blocks.push({ type: "heading", text: b["text"] });
    } else if (type === "quote" && typeof b["text"] === "string") {
      const q: ContentBlock = { type: "quote", text: b["text"] };
      if (typeof b["cite"] === "string") {
        (q as { type: "quote"; text: string; cite?: string }).cite = b["cite"];
      }
      blocks.push(q);
    } else if (type === "image" && typeof b["src"] === "string" && typeof b["alt"] === "string") {
      const img: ContentBlock = { type: "image", src: b["src"], alt: b["alt"] };
      if (typeof b["caption"] === "string") {
        (img as { type: "image"; src: string; alt: string; caption?: string }).caption =
          b["caption"];
      }
      blocks.push(img);
    }
  }
  return blocks;
}

/** Map a Supabase article row (with joined category) to the UI Article type. */
export function mapArticle(row: ArticleRowWithCategory): Article {
  const categorySlug = (row.categories?.slug ?? "education") as ArticleCategory;

  // Use the uploaded image if available; fall back to the bundled category image
  // for demo articles that haven't had a real photo uploaded yet.
  const featuredImage =
    row.featured_image && row.featured_image.trim() !== ""
      ? row.featured_image
      : (CATEGORY_FALLBACK_IMAGES[categorySlug] ?? "");

  const article: Article = {
    id: String(row.id),
    headline: row.title,
    slug: row.slug,
    category: categorySlug,
    description: row.excerpt ?? "",
    content: parseContent(row.content),
    featuredImage,
    imageAlt: row.image_alt ?? row.title,
    author: row.author_name,
    publishedAt: row.published_at ?? row.created_at,
    readingTime: row.reading_time,
    featured: row.is_featured,
    breaking: row.is_breaking,
    isDemo: row.is_demo,
    // These columns are optional — present once added via Lovable migration
    ...(row.is_editorial_pick !== undefined ? { isEditorialPick: row.is_editorial_pick } : {}),
    ...(row.is_popular_override !== undefined
      ? { isPopularOverride: row.is_popular_override }
      : {}),
  };

  // Only set optional fields when they have real values (exactOptionalPropertyTypes)
  if (row.excerpt) article.subtitle = row.excerpt;
  if (row.image_caption) article.imageCaption = row.image_caption;
  if (row.updated_at && row.updated_at !== row.created_at) {
    article.updatedAt = row.updated_at;
  }

  return article;
}
