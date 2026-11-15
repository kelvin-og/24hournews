import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { searchArticles } from "@/lib/news/api";
import { ArticleCard } from "@/components/site/ArticleCard";
import { pageMeta } from "@/components/site/seo";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? s["q"] : "" }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => searchArticles(deps.q),
  head: () => ({
    ...pageMeta("Search", "Search 24HOURNEWS stories by headline, topic or section.", "/search"),
    meta: [
      ...pageMeta("Search", "Search 24HOURNEWS stories by headline, topic or section.", "/search")
        .meta,
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const results = Route.useLoaderData();
  const navigate = useNavigate();
  const [value, setValue] = useState(q);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-black">Search</h1>
      <form
        role="search"
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: value } });
        }}
      >
        <label htmlFor="search-page" className="sr-only">
          Search articles
        </label>
        <input
          id="search-page"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Headlines, topics, sections…"
          className="h-12 flex-1 rounded-full border border-input px-5 outline-none focus:border-primary"
        />
        <button className="h-12 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary-strong">
          Search
        </button>
      </form>
      {q && (
        <p className="mt-6 text-sm text-muted-foreground" role="status">
          {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
        </p>
      )}
      {q && !results.length && (
        <div className="mt-10 rounded-2xl bg-muted p-8 text-center">
          <h2 className="font-display text-2xl font-bold">No stories found</h2>
          <p className="mt-2 text-muted-foreground">
            Try fewer or different words, or search a section name such as “Sports” or “Health”.
          </p>
        </div>
      )}
      <div className="mt-8 space-y-8">
        {results.map((a) => (
          <ArticleCard key={a.id} article={a} variant="horizontal" />
        ))}
      </div>
    </div>
  );
}
