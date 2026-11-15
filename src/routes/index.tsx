import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getArticles, getFeatured, getPopular, dedupe } from "@/lib/news/api";
import type { Article } from "@/lib/news/types";
import { CATEGORIES } from "@/lib/site";
import { FeaturedCarousel } from "@/components/site/FeaturedCarousel";
import { ArticleCard } from "@/components/site/ArticleCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Newsletter } from "@/components/site/Newsletter";
import { DemoNotice } from "@/components/site/DemoNotice";
import { pageMeta } from "@/components/site/seo";

export const Route = createFileRoute("/")({
  head: () =>
    pageMeta(
      "News from Ghana, around the clock",
      "Breaking news, analysis and features across general news, education, entertainment, business, sports, politics and health.",
      "/",
    ),
  loader: async () => {
    const [featured, all, popular] = await Promise.all([
      getFeatured(undefined, 5),
      getArticles(),
      getPopular(5),
    ]);
    return { featured, all, popular };
  },
  component: Home,
});

function LatestNewsSection({ articles }: { articles: Article[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="min-w-0">
      <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-foreground pb-3">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Latest news</h2>
        <div className="flex items-center gap-3">
          {/* Mobile scroll buttons (only below sm breakpoint) */}
          <div className="flex items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous articles"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next articles"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-muted disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link
            to="/$category"
            params={{ category: "general-news" }}
            className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary hover:text-primary-strong"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Mobile: horizontal swipe strip. sm+: 2-col grid */}
      <div className="relative min-w-0 max-w-full">
        {/* Scroll container — only active below sm breakpoint */}
        <div
          ref={scrollRef}
          className="no-scrollbar flex w-full max-w-full min-w-0 gap-4 overflow-x-auto pb-4 scroll-smooth sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:pb-0"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {articles.map((a) => (
            <div
              key={a.id}
              className="w-[78vw] shrink-0 sm:w-auto sm:shrink"
              style={{ scrollSnapAlign: "start" }}
            >
              <ArticleCard article={a} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const { featured, all, popular } = Route.useLoaderData();
  const featuredIds = new Set(featured.map((a) => a.id));
  const latest = dedupe(all.filter((a) => !featuredIds.has(a.id))).slice(0, 6);
  const editorialPicks = all.filter((a) => a.isEditorialPick);
  const featuredFallback = all.filter((a) => a.featured && !a.isEditorialPick);
  const highlights = dedupe([...editorialPicks, ...featuredFallback]).slice(0, 3);
  return (
    <>
      <DemoNotice />
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-6">
        <h1 className="sr-only">24HOURNEWS — latest news from Ghana</h1>
        <FeaturedCarousel articles={featured} label="Top stories" />

        <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
          <LatestNewsSection articles={latest} />
          <aside aria-labelledby="popular">
            <div className="mb-6 border-b-2 border-foreground pb-3">
              <h2 id="popular" className="font-display text-2xl font-bold">
                Most popular
              </h2>
            </div>
            <ol className="space-y-6">
              {popular.map((a, i) => (
                <li key={a.id} className="flex gap-4">
                  <span className="font-display text-4xl font-black leading-none text-primary">
                    {i + 1}
                  </span>
                  <ArticleCard article={a} variant="compact" />
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <section className="rounded-2xl bg-accent p-6 sm:p-10">
          <p className="text-xs font-extrabold uppercase tracking-widest text-accent-foreground">
            Editor's picks
          </p>
          <h2 className="mb-8 mt-2 font-display text-3xl font-bold">Editorial highlights</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {highlights.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>

        {CATEGORIES.filter((c) => c.slug !== "general-news").map((c) => {
          const items = all.filter((a) => a.category === c.slug).slice(0, 3);
          if (!items.length) return null;
          return (
            <section key={c.slug}>
              <SectionHeading title={c.name} category={c.slug} />
              <div className="grid gap-8 md:grid-cols-3">
                {items.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </section>
          );
        })}

        <Newsletter />
      </div>
    </>
  );
}
