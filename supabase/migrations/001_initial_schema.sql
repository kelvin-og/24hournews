-- =============================================================================
-- 24HOURNEWS — Initial Database Schema
-- Migration: 001_initial_schema.sql
--
-- Run this entire script in your Supabase project:
--   Dashboard → SQL Editor → New query → paste → Run
--
-- What this script does:
--   1. Creates the article_status enum
--   2. Creates categories, articles, authors, article_images tables
--   3. Seeds the seven news categories
--   4. Creates indexes for performance
--   5. Enables Row Level Security (RLS) on all tables
--   6. Creates RLS policies for public read / no anonymous write
--   7. Creates the news-images storage bucket
--   8. Creates storage policies
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
-- pg_trgm powers fast full-text search on article titles and excerpts
create extension if not exists pg_trgm;


-- -----------------------------------------------------------------------------
-- 1. Enum: article publication status
-- -----------------------------------------------------------------------------
do $$ begin
  create type article_status as enum ('draft', 'published', 'scheduled');
exception when duplicate_object then null;
end $$;


-- -----------------------------------------------------------------------------
-- 2. Table: categories
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id          serial        primary key,
  name        text          not null,
  slug        text          not null unique,
  description text,
  created_at  timestamptz   not null default now()
);

comment on table  public.categories             is 'News section categories (Education, Sports, etc.)';
comment on column public.categories.slug        is 'URL-safe identifier matching the CategorySlug type in site.ts';


-- -----------------------------------------------------------------------------
-- 3. Seed: seven categories
-- -----------------------------------------------------------------------------
insert into public.categories (name, slug, description) values
  ('General News',  'general-news',  'Stories from every desk, in one feed.'),
  ('Education',     'education',     'Schools, universities, learning and policy.'),
  ('Entertainment', 'entertainment', 'Music, film, culture and the arts.'),
  ('Business',      'business',      'Markets, companies, money and the economy.'),
  ('Sports',        'sports',        'Football, athletics and every game that matters.'),
  ('Politics',      'politics',      'Government, elections and public affairs.'),
  ('Health',        'health',        'Medicine, wellbeing and public health.')
on conflict (slug) do nothing;


-- -----------------------------------------------------------------------------
-- 4. Table: authors
-- -----------------------------------------------------------------------------
create table if not exists public.authors (
  id            serial      primary key,
  name          text        not null,
  biography     text,
  profile_image text,
  created_at    timestamptz not null default now()
);

comment on table public.authors is 'Journalist and contributor profiles. Used by the future Admin Dashboard.';


-- -----------------------------------------------------------------------------
-- 5. Table: articles
-- -----------------------------------------------------------------------------
create table if not exists public.articles (
  id             serial          primary key,
  title          text            not null,
  slug           text            not null unique,
  excerpt        text,
  -- ContentBlock[] stored as JSONB array.
  -- Shape: [{ type: "paragraph"|"heading"|"quote"|"image", text?: string, ... }]
  content        jsonb           not null default '[]'::jsonb,
  featured_image text,
  image_alt      text,
  image_caption  text,
  category_id    int             not null references public.categories(id) on delete restrict,
  author_name    text            not null,
  status         article_status  not null default 'draft',
  is_featured    boolean         not null default false,
  is_breaking    boolean         not null default false,
  reading_time   int             not null default 3,   -- estimated minutes
  published_at   timestamptz,
  created_at     timestamptz     not null default now(),
  updated_at     timestamptz     not null default now()
);

comment on table  public.articles                is 'News articles. Only status=published rows are visible to the public.';
comment on column public.articles.slug           is 'Unique URL slug, e.g. "parliament-debates-new-education-bill"';
comment on column public.articles.content        is 'Array of ContentBlock objects: {type,text,cite?,src?,alt?,caption?}';
comment on column public.articles.status         is 'draft: not visible; published: live; scheduled: will publish at published_at';
comment on column public.articles.is_featured    is 'Shown in hero carousels';
comment on column public.articles.is_breaking    is 'Shown in the breaking-news ticker';
comment on column public.articles.reading_time   is 'Estimated reading time in minutes; set by the editor';

-- Auto-update updated_at on every row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute procedure public.set_updated_at();

-- Set published_at automatically when status flips to 'published' and no date is supplied
create or replace function public.set_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists articles_set_published_at on public.articles;
create trigger articles_set_published_at
  before insert or update on public.articles
  for each row execute procedure public.set_published_at();


-- -----------------------------------------------------------------------------
-- 6. Table: article_images  (gallery / inline images)
-- -----------------------------------------------------------------------------
create table if not exists public.article_images (
  id            serial      primary key,
  article_id    int         not null references public.articles(id) on delete cascade,
  image_url     text        not null,
  image_caption text,
  created_at    timestamptz not null default now()
);

comment on table public.article_images is 'Gallery images attached to an article (not the featured hero image).';


-- -----------------------------------------------------------------------------
-- 7. Indexes
-- -----------------------------------------------------------------------------
-- Fast lookups when fetching a single article by slug
create index if not exists idx_articles_slug         on public.articles(slug);

-- Feed queries filter by category and status, ordered by published_at
create index if not exists idx_articles_category_status
  on public.articles(category_id, status, published_at desc);

-- Breaking ticker and featured carousel queries
create index if not exists idx_articles_breaking     on public.articles(is_breaking) where is_breaking = true;
create index if not exists idx_articles_featured     on public.articles(is_featured) where is_featured = true;

-- Full-text search using pg_trgm (supports partial / fuzzy word matching)
create index if not exists idx_articles_title_trgm   on public.articles using gin(title gin_trgm_ops);
create index if not exists idx_articles_excerpt_trgm on public.articles using gin(excerpt gin_trgm_ops);

-- Foreign key index
create index if not exists idx_article_images_article_id on public.article_images(article_id);

-- Category slug lookup (already has unique index, adding explicit one for reads)
create index if not exists idx_categories_slug       on public.categories(slug);


-- =============================================================================
-- 8. Row Level Security (RLS)
-- =============================================================================

-- ── categories ───────────────────────────────────────────────────────────────
alter table public.categories enable row level security;

-- Public: anyone can read all categories
create policy "categories_public_read"
  on public.categories for select
  using (true);

-- Write access: blocked for anonymous users (requires authenticated role —
-- the Admin Dashboard will use authenticated + role check)
create policy "categories_no_anon_insert"
  on public.categories for insert
  with check (auth.role() = 'authenticated');

create policy "categories_no_anon_update"
  on public.categories for update
  using (auth.role() = 'authenticated');

create policy "categories_no_anon_delete"
  on public.categories for delete
  using (auth.role() = 'authenticated');


-- ── articles ─────────────────────────────────────────────────────────────────
alter table public.articles enable row level security;

-- Public: read-only, published articles only
create policy "articles_public_read_published"
  on public.articles for select
  using (
    status = 'published'
    and published_at <= now()
  );

-- Write access: authenticated users only (Admin Dashboard)
create policy "articles_authenticated_insert"
  on public.articles for insert
  with check (auth.role() = 'authenticated');

create policy "articles_authenticated_update"
  on public.articles for update
  using (auth.role() = 'authenticated');

create policy "articles_authenticated_delete"
  on public.articles for delete
  using (auth.role() = 'authenticated');


-- ── authors ──────────────────────────────────────────────────────────────────
alter table public.authors enable row level security;

-- Authors are internal — not exposed to the public site
-- (future: publish author profile pages if desired)
create policy "authors_authenticated_read"
  on public.authors for select
  using (auth.role() = 'authenticated');

create policy "authors_authenticated_insert"
  on public.authors for insert
  with check (auth.role() = 'authenticated');

create policy "authors_authenticated_update"
  on public.authors for update
  using (auth.role() = 'authenticated');

create policy "authors_authenticated_delete"
  on public.authors for delete
  using (auth.role() = 'authenticated');


-- ── article_images ───────────────────────────────────────────────────────────
alter table public.article_images enable row level security;

-- Images linked to published articles are readable by anyone
create policy "article_images_public_read"
  on public.article_images for select
  using (
    exists (
      select 1 from public.articles a
      where a.id = article_images.article_id
        and a.status = 'published'
        and a.published_at <= now()
    )
  );

create policy "article_images_authenticated_insert"
  on public.article_images for insert
  with check (auth.role() = 'authenticated');

create policy "article_images_authenticated_update"
  on public.article_images for update
  using (auth.role() = 'authenticated');

create policy "article_images_authenticated_delete"
  on public.article_images for delete
  using (auth.role() = 'authenticated');


-- =============================================================================
-- 9. Storage: news-images bucket
-- =============================================================================
-- Note: storage policies require the Supabase storage extension to be enabled.
-- This is on by default for all Supabase projects.

-- Create the bucket (idempotent via ON CONFLICT DO NOTHING equivalent)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images',
  'news-images',
  true,                        -- publicly readable (images load without auth)
  5242880,                     -- 5 MB max upload size
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read: anyone can view images
create policy "news_images_public_read"
  on storage.objects for select
  using (bucket_id = 'news-images');

-- Upload / replace: authenticated users only
create policy "news_images_authenticated_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'news-images'
    and auth.role() = 'authenticated'
  );

create policy "news_images_authenticated_update"
  on storage.objects for update
  using (
    bucket_id = 'news-images'
    and auth.role() = 'authenticated'
  );

-- Delete: authenticated users only
create policy "news_images_authenticated_delete"
  on storage.objects for delete
  using (
    bucket_id = 'news-images'
    and auth.role() = 'authenticated'
  );


-- =============================================================================
-- 10. Future Admin Dashboard helpers
-- =============================================================================
-- User roles are stored in auth.users → user_metadata.role
-- Expected values: 'super_admin' | 'editor' | 'journalist'
--
-- When building the Admin Dashboard:
-- 1. Create Supabase Auth users and set user_metadata: { "role": "super_admin" }
-- 2. Update article/author policies to check:
--      auth.jwt() -> 'user_metadata' ->> 'role' in ('super_admin', 'editor')
-- 3. Add a scheduled_publisher Edge Function that runs every minute and
--      sets status='published' where status='scheduled' and published_at <= now()
-- 4. Use supabase.storage.from('news-images').upload() in a server function
--    (never expose service-role key to the browser)
--
-- Role permission matrix (future):
--   super_admin : full CRUD on articles, categories, authors, users
--   editor      : publish/unpublish/delete any article; manage categories
--   journalist  : create/edit own draft articles; cannot publish
-- =============================================================================
