/**
 * TypeScript types that mirror the Supabase PostgreSQL schema.
 *
 * Keep this file in sync with any schema changes made in Supabase.
 * When you add columns or tables in Supabase, run:
 *   npx supabase gen types typescript --project-id hvlvkoxjzpxgicypsycv > src/lib/supabase/types.ts
 * to regenerate automatically.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      articles: {
        Row: {
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
          is_editorial_pick: boolean;
          is_popular_override: boolean;
          reading_time: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: Json;
          featured_image?: string | null;
          image_alt?: string | null;
          image_caption?: string | null;
          category_id: number;
          author_name: string;
          status?: "draft" | "published" | "scheduled";
          is_featured?: boolean;
          is_breaking?: boolean;
          is_editorial_pick?: boolean;
          is_popular_override?: boolean;
          reading_time?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: Json;
          featured_image?: string | null;
          image_alt?: string | null;
          image_caption?: string | null;
          category_id?: number;
          author_name?: string;
          status?: "draft" | "published" | "scheduled";
          is_featured?: boolean;
          is_breaking?: boolean;
          is_editorial_pick?: boolean;
          is_popular_override?: boolean;
          reading_time?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      authors: {
        Row: {
          id: number;
          name: string;
          biography: string | null;
          profile_image: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          biography?: string | null;
          profile_image?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          biography?: string | null;
          profile_image?: string | null;
          created_at?: string;
        };
      };
      article_images: {
        Row: {
          id: number;
          article_id: number;
          image_url: string;
          image_caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          article_id: number;
          image_url: string;
          image_caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          article_id?: number;
          image_url?: string;
          image_caption?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      article_status: "draft" | "published" | "scheduled";
    };
  };
}

/** Convenience row types */
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
export type AuthorRow = Database["public"]["Tables"]["authors"]["Row"];
export type ArticleImageRow = Database["public"]["Tables"]["article_images"]["Row"];
