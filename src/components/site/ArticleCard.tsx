import { Link } from "@tanstack/react-router";
import type { Article } from "@/lib/news/types";
import { formatDate } from "@/lib/news/api";
import { CategoryLabel } from "./CategoryLabel";

type Variant = "default" | "compact" | "horizontal";

export function ArticleMeta({ a }: { a: Article }) {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{a.author}</span> ·{" "}
      <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time> · {a.readingTime} min read
    </p>
  );
}

export function ArticleCard({
  article: a,
  variant = "default",
}: {
  article: Article;
  variant?: Variant;
}) {
  const horizontal = variant === "horizontal";
  return (
    <article
      className={`group relative ${horizontal ? "grid grid-cols-[7rem_1fr] gap-4 sm:grid-cols-[10rem_1fr]" : "flex flex-col gap-3"}`}
    >
      <div className="overflow-hidden rounded-lg bg-muted">
        <img
          src={a.featuredImage}
          alt={a.imageAlt}
          loading="lazy"
          width={1280}
          height={768}
          className="aspect-[5/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="relative z-10">
          <CategoryLabel slug={a.category} />
        </div>
        <h3
          className={`font-display font-bold leading-snug text-foreground transition-colors group-hover:text-primary ${variant === "default" ? "text-xl" : "text-base sm:text-lg"}`}
        >
          <Link to="/news/$slug" params={{ slug: a.slug }} className="after:absolute after:inset-0">
            {a.headline}
          </Link>
        </h3>
        {variant === "default" && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
        )}
        <ArticleMeta a={a} />
      </div>
    </article>
  );
}
