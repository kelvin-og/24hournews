import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Link2 } from "lucide-react";
import { useState } from "react";
import { formatDate, getArticleBySlug, getRelated } from "@/lib/news/api";
import { getCategory, SITE } from "@/lib/site";
import { ArticleCard } from "@/components/site/ArticleCard";
import { CategoryLabel } from "@/components/site/CategoryLabel";
import type { ContentBlock } from "@/lib/news/types";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const article = await getArticleBySlug(params.slug);
    if (!article) throw notFound();
    return { article, related: await getRelated(article) };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [{ title: "Article not found | 24HOURNEWS" }, { name: "robots", content: "noindex" }],
      };
    const a = loaderData.article;
    const url = `${SITE.url}/news/${a.slug}`;
    return {
      meta: [
        { title: `${a.headline} | ${SITE.name}` },
        { name: "description", content: a.description },
        { property: "og:title", content: a.headline },
        { property: "og:description", content: a.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: a.publishedAt },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: a.headline,
            description: a.description,
            datePublished: a.publishedAt,
            dateModified: a.updatedAt ?? a.publishedAt,
            author: { "@type": "Person", name: a.author },
            publisher: { "@type": "NewsMediaOrganization", name: SITE.name, url: SITE.url },
            mainEntityOfPage: url,
          }),
        },
      ],
    };
  },
  component: ArticlePage,
});

function Block({ b }: { b: ContentBlock }) {
  switch (b.type) {
    case "heading":
      return <h2 className="mt-10 font-display text-2xl font-bold">{b.text}</h2>;
    case "quote":
      return (
        <blockquote className="my-8 border-l-4 border-primary pl-6 font-display text-2xl italic leading-snug">
          “{b.text}”
          {b.cite && (
            <footer className="mt-2 font-sans text-sm not-italic text-muted-foreground">
              — {b.cite}
            </footer>
          )}
        </blockquote>
      );
    case "image":
      return (
        <figure className="my-8">
          <img src={b.src} alt={b.alt} loading="lazy" className="w-full rounded-lg" />
          {b.caption && (
            <figcaption className="mt-2 text-sm text-muted-foreground">{b.caption}</figcaption>
          )}
        </figure>
      );
    default:
      return <p className="mt-5">{b.text}</p>;
  }
}

function Share({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url),
    t = encodeURIComponent(title);
  const btn =
    "flex h-9 items-center gap-1 rounded-full border border-border px-4 text-xs font-bold transition hover:border-primary hover:bg-primary hover:text-primary-foreground";
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Share this article">
      <span className="mr-1 text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
        Share
      </span>
      <a
        className={btn}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}
      >
        Facebook
      </a>
      <a
        className={btn}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://twitter.com/intent/tweet?url=${u}&text=${t}`}
      >
        X
      </a>
      <a
        className={btn}
        target="_blank"
        rel="noopener noreferrer"
        href={`https://wa.me/?text=${t}%20${u}`}
      >
        WhatsApp
      </a>
      <button
        type="button"
        className={btn}
        onClick={() => {
          navigator.clipboard?.writeText(url);
          setCopied(true);
        }}
      >
        <Link2 className="h-3.5 w-3.5" />
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

function ArticlePage() {
  const { article: a, related } = Route.useLoaderData();
  const cat = getCategory(a.category)!;
  const url = `${SITE.url}/news/${a.slug}`;
  return (
    <article className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link to="/" className="hover:text-primary">
              Home
            </Link>{" "}
            /
          </li>
          <li>
            <Link to="/$category" params={{ category: cat.slug }} className="hover:text-primary">
              {cat.name}
            </Link>{" "}
            /
          </li>
          <li aria-current="page" className="line-clamp-1 text-foreground">
            {a.headline}
          </li>
        </ol>
      </nav>
      <header className="mx-auto max-w-3xl space-y-4">
        <CategoryLabel slug={a.category} />
        {a.isDemo && (
          <p className="text-xs font-bold text-accent-foreground">
            Demonstration content — not a real news story.
          </p>
        )}
        <h1 className="font-display text-4xl font-black leading-[1.08] sm:text-5xl">
          {a.headline}
        </h1>
        {a.subtitle && <p className="text-xl text-muted-foreground">{a.subtitle}</p>}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
          <div className="text-sm">
            <p className="font-bold">By {a.author}</p>
            <p className="text-muted-foreground">
              Published <time dateTime={a.publishedAt}>{formatDate(a.publishedAt)}</time>
              {a.updatedAt && (
                <>
                  {" "}
                  · Updated <time dateTime={a.updatedAt}>{formatDate(a.updatedAt)}</time>
                </>
              )}{" "}
              · {a.readingTime} min read
            </p>
          </div>
          <Share title={a.headline} url={url} />
        </div>
      </header>
      <figure className="mx-auto my-8 max-w-5xl">
        <img
          src={a.featuredImage}
          alt={a.imageAlt}
          width={1280}
          height={768}
          className="aspect-[16/9] w-full rounded-2xl object-cover"
        />
        {a.imageCaption && (
          <figcaption className="mt-2 text-sm text-muted-foreground">{a.imageCaption}</figcaption>
        )}
      </figure>
      <div className="mx-auto max-w-2xl text-lg leading-[1.8]">
        {a.content.map((b, i) => (
          <Block key={i} b={b} />
        ))}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <Link
            to="/$category"
            params={{ category: cat.slug }}
            className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-strong"
          >
            <ChevronLeft className="h-4 w-4" /> Back to {cat.name}
          </Link>
          <Share title={a.headline} url={url} />
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 border-b-2 border-foreground pb-3 font-display text-2xl font-bold">
            Related stories
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {related.map((r) => (
              <ArticleCard key={r.id} article={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
