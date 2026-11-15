import type { ArticleCategory } from "@/lib/site";

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "image"; src: string; alt: string; caption?: string };

export interface Article {
  id: string;
  headline: string;
  slug: string;
  category: ArticleCategory;
  subtitle?: string;
  description: string;
  content: ContentBlock[];
  featuredImage: string;
  imageAlt: string;
  imageCaption?: string;
  author: string;
  publishedAt: string; // ISO
  updatedAt?: string | undefined; // ISO
  readingTime: number; // minutes
  featured: boolean;
  breaking?: boolean;
  isEditorialPick?: boolean;
  isPopularOverride?: boolean;
  isDemo?: boolean;
}
