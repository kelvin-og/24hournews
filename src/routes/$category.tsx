import { createFileRoute, notFound } from "@tanstack/react-router";
import { getArticles, getFeatured } from "@/lib/news/api";
import { getCategory, type CategorySlug } from "@/lib/site";
import { FeaturedCarousel } from "@/components/site/FeaturedCarousel";
import { ArticleCard } from "@/components/site/ArticleCard";
import { DemoNotice } from "@/components/site/DemoNotice";
import { pageMeta } from "@/components/site/seo";

export const Route = createFileRoute("/$category")({
  loader: async ({ params }) => {
    const category = getCategory(params.category);
    if (!category) throw notFound();
    const slug = category.slug as CategorySlug;
    const [featured, articles] = await Promise.all([getFeatured(slug, 4), getArticles(slug)]);
    return { category, featured, articles };
  },
  head: ({ loaderData, params }) =>
    loaderData
      ? pageMeta(
          `${loaderData.category.name} News`,
          `${loaderData.category.description} Latest ${loaderData.category.name.toLowerCase()} stories on 24HOURNEWS.`,
          `/${params.category}`,
        )
      : {
          meta: [
            { title: "Section not found | 24HOURNEWS" },
            { name: "robots", content: "noindex" },
          ],
        },
  component: CategoryPage,
});

function CategoryPage() {
  const { category, featured, articles } = Route.useLoaderData();
  return (
    <>
      <DemoNotice />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-8 border-b-2 border-foreground pb-4">
          <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Section</p>
          <h1 className="font-display text-4xl font-black sm:text-6xl">{category.name}</h1>
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        </header>
        <FeaturedCarousel articles={featured} label={`Featured ${category.name} stories`} />
        <h2 className="mb-6 mt-14 font-display text-2xl font-bold">All {category.name} stories</h2>
        {articles.length ? (
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No stories in this section yet.</p>
        )}
      </div>
    </>
  );
}
