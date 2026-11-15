import { useState, useEffect } from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { getAdminArticleById, type AdminArticle } from "@/lib/news/admin-api";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/articles/$id")({
  loader: async ({ params }) => {
    const article = await getAdminArticleById(params.id);
    if (!article) throw notFound();
    return { article };
  },
  notFoundComponent: () => (
    <div className="py-16 text-center space-y-4">
      <h2 className="font-display text-2xl font-bold">Story Not Found</h2>
      <p className="text-sm text-muted-foreground">
        The story you are trying to edit does not exist or may have been deleted.
      </p>
      <Link
        to="/admin/articles"
        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to stories
      </Link>
    </div>
  ),
  component: EditArticlePage,
});

function EditArticlePage() {
  const { article } = Route.useLoaderData();
  return <ArticleForm initialData={article} isEditing={true} />;
}
