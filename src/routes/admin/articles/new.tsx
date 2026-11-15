import { createFileRoute } from "@tanstack/react-router";
import { ArticleForm } from "@/components/admin/ArticleForm";

export const Route = createFileRoute("/admin/articles/new")({
  component: NewArticlePage,
});

function NewArticlePage() {
  return <ArticleForm isEditing={false} />;
}
