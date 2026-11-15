import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getAdminArticles,
  deleteAdminArticle,
  setArticleStatus,
  toggleArticleFeature,
  type AdminArticle,
  type AdminArticleStatus,
} from "@/lib/news/admin-api";
import { CATEGORIES, type CategorySlug } from "@/lib/site";
import { useAuth } from "@/lib/auth/AuthContext";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { formatDate } from "@/lib/news/api";
import {
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Star,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/articles/")({
  component: ArticlesListPage,
});

function ArticlesListPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | AdminArticleStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | CategorySlug>("all");
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "title">("latest");

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminArticle | null>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const data = await getAdminArticles({
        status: statusTab,
        category: categoryFilter,
        ...(authorFilter !== "all" ? { author: authorFilter } : {}),
        search,
        sortBy,
      });
      setArticles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [statusTab, categoryFilter, authorFilter, sortBy, search]);

  const handleTogglePublish = async (article: AdminArticle) => {
    if (!user) return;
    const newStatus: AdminArticleStatus = article.status === "published" ? "draft" : "published";
    await setArticleStatus(article.id, newStatus, {
      id: user.id,
      name: user.fullName,
      email: user.email,
    });
    toast.success(
      newStatus === "published"
        ? "Story published to live site"
        : "Story unpublished (moved to drafts)",
    );
    fetchArticles();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !user) return;
    await deleteAdminArticle(deleteTarget.id, {
      id: user.id,
      name: user.fullName,
      email: user.email,
    });
    toast.success("Story removed permanently");
    setDeleteTarget(null);
    fetchArticles();
  };

  const handleUnpublishInstead = async () => {
    if (!deleteTarget || !user) return;
    await setArticleStatus(deleteTarget.id, "draft", {
      id: user.id,
      name: user.fullName,
      email: user.email,
    });
    toast.success("Story unpublished and kept in drafts");
    setDeleteTarget(null);
    fetchArticles();
  };

  const handleToggleFeature = async (
    article: AdminArticle,
    field: "isEditorialPick" | "isPopularOverride",
  ) => {
    if (!user) return;
    await toggleArticleFeature(article.id, field, {
      id: user.id,
      name: user.fullName,
      email: user.email,
    });
    const labels = { isEditorialPick: "Editorial Pick", isPopularOverride: "Most Popular" };
    const wasOn = Boolean(article[field]);
    toast.success(wasOn ? `Removed from ${labels[field]}` : `Added to ${labels[field]}`);
    fetchArticles();
  };

  const statusBadge = (s: AdminArticleStatus) => {
    switch (s) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
            Draft
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300">
            <Clock className="h-3 w-3" /> Scheduled
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            Archived
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            News Stories
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage, edit, schedule and organize stories across desks.
          </p>
        </div>

        <Link
          to="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" /> Write New Story
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
          {(["all", "published", "draft", "scheduled", "archived"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusTab === tab
                  ? "bg-primary/10 text-primary font-bold border border-primary/20 shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab === "all" ? "All Stories" : tab}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search headline, summary or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as "all" | CategorySlug)}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              <option value="all">All Desks</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Author dropdown */}
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              <option value="all">All Authors</option>
              {Array.from(new Set(articles.map((a) => a.author))).map((authorName) => (
                <option key={authorName} value={authorName}>
                  {authorName}
                </option>
              ))}
            </select>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "latest" | "oldest" | "title")}
              className="h-9 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              <option value="latest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Headline A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stories Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <p className="font-semibold text-foreground">No stories match your filter</p>
            <p className="text-xs mt-1">Try clearing filters or search keywords.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusTab("all");
                setCategoryFilter("all");
              }}
              className="mt-4 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 pl-4 pr-3">Story</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Author</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.map((article) => (
                  <tr key={article.id} className="transition hover:bg-muted/20">
                    <td className="py-3 pl-4 pr-3 max-w-sm">
                      <div className="flex items-start gap-2.5">
                        <img
                          src={article.featuredImage}
                          alt=""
                          className="h-10 w-14 shrink-0 rounded-md object-cover bg-muted"
                        />
                        <div className="min-w-0">
                          <Link
                            to="/admin/articles/$id"
                            params={{ id: article.id }}
                            className="font-display text-xs font-bold text-foreground hover:text-primary transition line-clamp-1"
                          >
                            {article.headline}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {article.featured && (
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                                <Sparkles className="h-2.5 w-2.5" /> Hero
                              </span>
                            )}
                            {article.breaking && (
                              <span className="text-[10px] font-bold text-destructive">
                                Breaking
                              </span>
                            )}
                            {article.isEditorialPick && (
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-yellow-600">
                                <Star className="h-2.5 w-2.5 fill-current" /> Pick
                              </span>
                            )}
                            {article.isPopularOverride && (
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-600">
                                <Flame className="h-2.5 w-2.5 fill-current" /> Popular
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {article.readingTime} min read
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 capitalize text-muted-foreground">
                      {article.category}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground truncate max-w-[120px]">
                      {article.author}
                    </td>
                    <td className="px-3 py-3">{statusBadge(article.status)}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {formatDate(
                        article.publishedAt || article.updatedAt || new Date().toISOString(),
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Editorial Pick toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(article, "isEditorialPick")}
                          title={
                            article.isEditorialPick
                              ? "Remove from Editorial Picks"
                              : "Pin as Editorial Pick"
                          }
                          className={`rounded-md p-1.5 transition ${
                            article.isEditorialPick
                              ? "text-yellow-600 hover:bg-yellow-500/10"
                              : "text-muted-foreground hover:bg-muted hover:text-yellow-600"
                          }`}
                        >
                          <Star
                            className={`h-4 w-4 ${article.isEditorialPick ? "fill-current" : ""}`}
                          />
                        </button>

                        {/* Most Popular toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(article, "isPopularOverride")}
                          title={
                            article.isPopularOverride
                              ? "Remove from Most Popular"
                              : "Pin to Most Popular"
                          }
                          className={`rounded-md p-1.5 transition ${
                            article.isPopularOverride
                              ? "text-orange-600 hover:bg-orange-500/10"
                              : "text-muted-foreground hover:bg-muted hover:text-orange-600"
                          }`}
                        >
                          <Flame
                            className={`h-4 w-4 ${article.isPopularOverride ? "fill-current" : ""}`}
                          />
                        </button>

                        {/* Quick Publish / Unpublish */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(article)}
                          title={
                            article.status === "published" ? "Unpublish to draft" : "Publish now"
                          }
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {article.status === "published" ? (
                            <XCircle className="h-4 w-4 text-amber-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                        </button>

                        {/* Edit */}
                        <Link
                          to="/admin/articles/$id"
                          params={{ id: article.id }}
                          title="Edit story"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        {/* View live if published */}
                        {article.status === "published" && (
                          <Link
                            to="/news/$slug"
                            params={{ slug: article.slug }}
                            target="_blank"
                            title="View on reader site"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(article)}
                          title="Delete story"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={deleteTarget.headline}
          isPublished={deleteTarget.status === "published"}
          onConfirmDelete={handleConfirmDelete}
          onUnpublishInstead={handleUnpublishInstead}
        />
      )}
    </div>
  );
}
