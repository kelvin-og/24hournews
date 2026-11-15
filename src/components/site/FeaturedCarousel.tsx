import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Article } from "@/lib/news/types";
import { formatDate } from "@/lib/news/api";
import { CategoryLabel } from "./CategoryLabel";

export function FeaturedCarousel({
  articles,
  label = "Featured stories",
}: {
  articles: Article[];
  label?: string;
}) {
  const [ref, api] = useEmblaCarousel({ loop: true });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSel = () => setIndex(api.selectedScrollSnap());
    const stop = () => setPaused(true);
    api.on("select", onSel).on("pointerDown", stop);
    return () => {
      api.off("select", onSel).off("pointerDown", stop);
    };
  }, [api]);

  useEffect(() => {
    if (!api || paused || articles.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => api.scrollNext(), 6000);
    return () => clearInterval(t);
  }, [api, paused, articles.length]);

  const go = useCallback((fn: () => void) => {
    setPaused(true);
    fn();
  }, []);
  if (!articles.length) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative overflow-hidden rounded-2xl bg-secondary shadow-lift"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(() => api?.scrollPrev());
        if (e.key === "ArrowRight") go(() => api?.scrollNext());
      }}
    >
      <div ref={ref} className="overflow-hidden">
        <div className="flex">
          {articles.map((a, i) => (
            <div
              key={a.id}
              className="relative min-w-0 shrink-0 grow-0 basis-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${articles.length}`}
            >
              <img
                src={a.featuredImage}
                alt={a.imageAlt}
                width={1280}
                height={768}
                loading={i === 0 ? "eager" : "lazy"}
                className="aspect-[4/5] w-full object-cover sm:aspect-[16/9] lg:aspect-[21/9]"
              />
              <div className="absolute inset-0 bg-overlay" />
              <div className="absolute inset-x-0 bottom-0 p-5 pb-14 sm:p-10 sm:pb-16">
                <div className="max-w-3xl space-y-3 text-on-image">
                  <CategoryLabel slug={a.category} onImage />
                  <h2 className="font-display text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                    <Link
                      to="/news/$slug"
                      params={{ slug: a.slug }}
                      tabIndex={i === index ? 0 : -1}
                      className="hover:underline decoration-primary decoration-4 underline-offset-4"
                    >
                      {a.headline}
                    </Link>
                  </h2>
                  <p className="hidden max-w-2xl opacity-90 sm:block">{a.description}</p>
                  <p className="text-xs opacity-80">
                    {a.author} · {formatDate(a.publishedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {articles.length > 1 && (
        <>
          <div className="absolute bottom-5 right-5 flex gap-2">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(() => api?.scrollPrev())}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-card transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(() => api?.scrollNext())}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-foreground shadow-card transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-7 left-5 flex gap-1.5 sm:left-10">
            {articles.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(() => api?.scrollTo(i))}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-primary" : "w-3 bg-background/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
