-- =============================================================================
-- 24HOURNEWS — Demo article seed data
-- Migration: 002_seed_demo_articles.sql
--
-- Inserts 18 placeholder articles (matching the in-code SAMPLE_ARTICLES)
-- into the live database so all carousels and sections work during development.
--
-- To remove demo content later:
--   DELETE FROM public.articles WHERE is_demo = true;
-- =============================================================================

-- Add a temporary is_demo column so demo articles are easy to identify and
-- bulk-delete later without touching real content.
alter table public.articles
  add column if not exists is_demo boolean not null default false;

-- ── Helper: resolve category_id from slug ────────────────────────────────────
-- We'll use a small inline function so the inserts stay readable.

do $$
declare
  cat_education     int;
  cat_entertainment int;
  cat_business      int;
  cat_sports        int;
  cat_politics      int;
  cat_health        int;

  base_ts timestamptz := '2026-11-10T08:00:00Z'::timestamptz;

  content_tpl jsonb;

begin
  -- Resolve category IDs
  select id into cat_education     from public.categories where slug = 'education';
  select id into cat_entertainment from public.categories where slug = 'entertainment';
  select id into cat_business      from public.categories where slug = 'business';
  select id into cat_sports        from public.categories where slug = 'sports';
  select id into cat_politics      from public.categories where slug = 'politics';
  select id into cat_health        from public.categories where slug = 'health';

  -- Shared body template (category name filled per-article below)
  content_tpl := '[
    {"type":"paragraph","text":"This is demonstration content created to preview the article layout on 24HOURNEWS. It does not describe real events, people or organisations, and will be replaced with genuine reporting once the publishing system is connected."},
    {"type":"paragraph","text":"A real article would open here with the key facts of the story: who, what, where and when. Paragraphs are kept at a comfortable measure with generous line spacing so long reads remain easy on phones and large screens alike."},
    {"type":"heading","text":"How the layout handles subheadings"},
    {"type":"paragraph","text":"Subheadings break longer pieces into scannable sections. The article body preserves every paragraph, heading, quotation and caption supplied by the newsroom without truncation."},
    {"type":"quote","text":"Pull quotes highlight a memorable line from the story and give readers a moment to pause.","cite":"Example attribution"},
    {"type":"paragraph","text":"Further context, background and analysis would follow, along with any embedded media supplied with the story. Related articles from the same desk appear below for readers who want to keep exploring."},
    {"type":"paragraph","text":"When the content management system is introduced, editors will be able to publish, update and feature stories, and this page will display them automatically."}
  ]'::jsonb;

  -- ── Education (3 articles) ─────────────────────────────────────────────────
  insert into public.articles
    (title, slug, excerpt, content, featured_image, image_alt, image_caption,
     category_id, author_name, status, is_featured, is_breaking,
     reading_time, published_at, is_demo)
  values
  (
    'Sample story: Regional schools pilot a new digital learning programme',
    'regional-schools-pilot-a-new-digital-learning-programme',
    'A demonstration article showing how an education feature would look on 24HOURNEWS.',
    content_tpl, '', 'Students writing in notebooks in a sunlit classroom',
    'Illustrative image for demonstration purposes.',
    cat_education, 'Ama Mensah (Demo)', 'published', true, false,
    3, base_ts - interval '0 hours', true
  ),
  (
    'Sample story: University libraries extend opening hours for exam season',
    'university-libraries-extend-opening-hours-for-exam-season',
    'Placeholder content illustrating a short education news report.',
    content_tpl, '', 'Students writing in notebooks in a sunlit classroom',
    'Illustrative image for demonstration purposes.',
    cat_education, 'Kofi Asante (Demo)', 'published', false, false,
    4, base_ts - interval '3.5 hours', true
  ),
  (
    'Sample story: Teachers share approaches to reading in early grades',
    'teachers-share-approaches-to-reading-in-early-grades',
    'Placeholder feature demonstrating long-form education coverage.',
    content_tpl, '', 'Students writing in notebooks in a sunlit classroom',
    'Illustrative image for demonstration purposes.',
    cat_education, 'Efua Owusu (Demo)', 'published', false, false,
    5, base_ts - interval '7 hours', true
  )
  on conflict (slug) do nothing;

  -- ── Entertainment (3 articles) ─────────────────────────────────────────────
  insert into public.articles
    (title, slug, excerpt, content, featured_image, image_alt, image_caption,
     category_id, author_name, status, is_featured, is_breaking,
     reading_time, published_at, is_demo)
  values
  (
    'Sample story: Weekend music festival draws crowds to the capital',
    'weekend-music-festival-draws-crowds-to-the-capital',
    'Demonstration article for the entertainment desk layout.',
    content_tpl, '', 'Crowd at a concert under orange stage lights',
    'Illustrative image for demonstration purposes.',
    cat_entertainment, 'Yaw Boateng (Demo)', 'published', true, true,
    3, base_ts - interval '10.5 hours', true
  ),
  (
    'Sample story: Local filmmakers prepare for a screening season',
    'local-filmmakers-prepare-for-a-screening-season',
    'Placeholder entertainment story used to preview article cards.',
    content_tpl, '', 'Crowd at a concert under orange stage lights',
    'Illustrative image for demonstration purposes.',
    cat_entertainment, 'Akosua Darko (Demo)', 'published', false, false,
    4, base_ts - interval '14 hours', true
  ),
  (
    'Sample story: A look inside a community theatre rehearsal',
    'a-look-inside-a-community-theatre-rehearsal',
    'Placeholder feature for showcasing culture coverage.',
    content_tpl, '', 'Crowd at a concert under orange stage lights',
    'Illustrative image for demonstration purposes.',
    cat_entertainment, 'Kwame Ofori (Demo)', 'published', false, false,
    5, base_ts - interval '17.5 hours', true
  )
  on conflict (slug) do nothing;

  -- ── Business (3 articles) ──────────────────────────────────────────────────
  insert into public.articles
    (title, slug, excerpt, content, featured_image, image_alt, image_caption,
     category_id, author_name, status, is_featured, is_breaking,
     reading_time, published_at, is_demo)
  values
  (
    'Sample story: Small businesses adapt to mobile payment growth',
    'small-businesses-adapt-to-mobile-payment-growth',
    'Demonstration business article illustrating market coverage.',
    content_tpl, '', 'Professionals walking past glass office towers',
    'Illustrative image for demonstration purposes.',
    cat_business, 'Abena Kusi (Demo)', 'published', true, true,
    3, base_ts - interval '21 hours', true
  ),
  (
    'Sample story: What a typical market week looks like for traders',
    'what-a-typical-market-week-looks-like-for-traders',
    'Placeholder business feature for layout preview.',
    content_tpl, '', 'Professionals walking past glass office towers',
    'Illustrative image for demonstration purposes.',
    cat_business, 'Nana Adjei (Demo)', 'published', false, false,
    4, base_ts - interval '24.5 hours', true
  ),
  (
    'Sample story: Startups gather for an innovation showcase',
    'startups-gather-for-an-innovation-showcase',
    'Placeholder business report demonstrating card design.',
    content_tpl, '', 'Professionals walking past glass office towers',
    'Illustrative image for demonstration purposes.',
    cat_business, 'Esi Appiah (Demo)', 'published', false, false,
    5, base_ts - interval '28 hours', true
  )
  on conflict (slug) do nothing;

  -- ── Sports (3 articles) ────────────────────────────────────────────────────
  insert into public.articles
    (title, slug, excerpt, content, featured_image, image_alt, image_caption,
     category_id, author_name, status, is_featured, is_breaking,
     reading_time, published_at, is_demo)
  values
  (
    'Sample story: Club football season opens with a packed stadium',
    'club-football-season-opens-with-a-packed-stadium',
    'Demonstration sports article for the 24HOURNEWS layout.',
    content_tpl, '', 'Footballer striking the ball during an evening match',
    'Illustrative image for demonstration purposes.',
    cat_sports, 'Kojo Amoah (Demo)', 'published', true, false,
    3, base_ts - interval '31.5 hours', true
  ),
  (
    'Sample story: Young athletes train for regional championships',
    'young-athletes-train-for-regional-championships',
    'Placeholder sports feature for previewing cards.',
    content_tpl, '', 'Footballer striking the ball during an evening match',
    'Illustrative image for demonstration purposes.',
    cat_sports, 'Adwoa Nyarko (Demo)', 'published', false, false,
    4, base_ts - interval '35 hours', true
  ),
  (
    'Sample story: Coaches discuss grassroots development',
    'coaches-discuss-grassroots-development',
    'Placeholder sports analysis demonstrating long-form layout.',
    content_tpl, '', 'Footballer striking the ball during an evening match',
    'Illustrative image for demonstration purposes.',
    cat_sports, 'Fiifi Quaye (Demo)', 'published', false, false,
    5, base_ts - interval '38.5 hours', true
  )
  on conflict (slug) do nothing;

  -- ── Politics (3 articles) ──────────────────────────────────────────────────
  insert into public.articles
    (title, slug, excerpt, content, featured_image, image_alt, image_caption,
     category_id, author_name, status, is_featured, is_breaking,
     reading_time, published_at, is_demo)
  values
  (
    'Sample story: Parliament schedules debate on a proposed bill',
    'parliament-schedules-debate-on-a-proposed-bill',
    'Demonstration politics article. Not a real event.',
    content_tpl, '', 'Empty parliamentary chamber with microphones at each seat',
    'Illustrative image for demonstration purposes.',
    cat_politics, 'Akua Sarpong (Demo)', 'published', true, false,
    3, base_ts - interval '42 hours', true
  ),
  (
    'Sample story: Explaining how local assembly elections work',
    'explaining-how-local-assembly-elections-work',
    'Placeholder explainer showing politics coverage.',
    content_tpl, '', 'Empty parliamentary chamber with microphones at each seat',
    'Illustrative image for demonstration purposes.',
    cat_politics, 'Kwesi Annan (Demo)', 'published', false, false,
    4, base_ts - interval '45.5 hours', true
  ),
  (
    'Sample story: Citizens attend a town hall on public services',
    'citizens-attend-a-town-hall-on-public-services',
    'Placeholder politics report for layout preview.',
    content_tpl, '', 'Empty parliamentary chamber with microphones at each seat',
    'Illustrative image for demonstration purposes.',
    cat_politics, 'Maame Tetteh (Demo)', 'published', false, false,
    5, base_ts - interval '49 hours', true
  )
  on conflict (slug) do nothing;

  -- ── Health (3 articles) ────────────────────────────────────────────────────
  insert into public.articles
    (title, slug, excerpt, content, featured_image, image_alt, image_caption,
     category_id, author_name, status, is_featured, is_breaking,
     reading_time, published_at, is_demo)
  values
  (
    'Sample story: Community clinics run free blood pressure checks',
    'community-clinics-run-free-blood-pressure-checks',
    'Demonstration health article for the 24HOURNEWS layout.',
    content_tpl, '', 'Nurse measuring a patient''s blood pressure in a clinic',
    'Illustrative image for demonstration purposes.',
    cat_health, 'Dr. Yaa Badu (Demo)', 'published', true, false,
    3, base_ts - interval '52.5 hours', true
  ),
  (
    'Sample story: Simple habits for staying hydrated in the heat',
    'simple-habits-for-staying-hydrated-in-the-heat',
    'Placeholder wellbeing feature for previewing cards.',
    content_tpl, '', 'Nurse measuring a patient''s blood pressure in a clinic',
    'Illustrative image for demonstration purposes.',
    cat_health, 'Kobby Acheampong (Demo)', 'published', false, false,
    4, base_ts - interval '56 hours', true
  ),
  (
    'Sample story: How health workers prepare for flu season',
    'how-health-workers-prepare-for-flu-season',
    'Placeholder public-health report demonstrating layout.',
    content_tpl, '', 'Nurse measuring a patient''s blood pressure in a clinic',
    'Illustrative image for demonstration purposes.',
    cat_health, 'Afia Frimpong (Demo)', 'published', false, false,
    5, base_ts - interval '59.5 hours', true
  )
  on conflict (slug) do nothing;

end $$;

-- Verify the seed worked
select
  c.name as category,
  count(*) as article_count,
  sum(case when a.is_featured then 1 else 0 end) as featured,
  sum(case when a.is_breaking then 1 else 0 end) as breaking
from public.articles a
join public.categories c on c.id = a.category_id
where a.is_demo = true
group by c.name
order by c.name;
