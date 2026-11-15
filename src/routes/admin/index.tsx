import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDashboardStats, type DashboardStats, setArticleStatus } from "@/lib/news/admin-api";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { CategoryLabel } from "@/components/site/CategoryLabel";
import { formatDate } from "@/lib/news/api";
import {
  FileText,
  FileClock,
  Send,
  PlusCircle,
  ImageIcon,
  Users,
  Eye,
  Edit,
  ArrowRight,
  TrendingUp,
  Archive,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleQuickPublish = async (id: string) => {
    if (!user) return;
    await setArticleStatus(id, "published", {
      id: user.id,
      name: user.fullName,
      email: user.email,
    });
    toast.success("Story published to live site");
    loadStats();
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {user?.fullName?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Newsroom overview for{" "}
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            Write New Story
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Live Stories"
          value={stats?.publishedCount ?? 0}
          description="Active articles on the public website"
          icon={Send}
          href="/admin/articles"
          badge="Live"
        />
        <AdminStatCard
          label="Drafts in Progress"
          value={stats?.draftCount ?? 0}
          description="Stories awaiting edits or review"
          icon={FileText}
          href="/admin/articles"
        />
        <AdminStatCard
          label="Scheduled Posts"
          value={stats?.scheduledCount ?? 0}
          description="Stories queued for automatic release"
          icon={FileClock}
          href="/admin/articles"
        />
        <AdminStatCard
          label="Media Assets"
          value={stats?.totalMedia ?? 0}
          description="Photos and illustrations available"
          icon={ImageIcon}
          href="/admin/media"
        />
      </div>

      {/* Quick Shortcuts Bar */}
      <div
        className={`grid gap-3 ${
          isSuperAdmin ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
        }`}
      >
        <Link
          to="/admin/articles/new"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Write a Story</h2>
            <p className="text-xs text-muted-foreground">Open the clean story editor</p>
          </div>
        </Link>

        <Link
          to="/admin/articles"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Manage Articles</h2>
            <p className="text-xs text-muted-foreground">Search, filter & organize content</p>
          </div>
        </Link>

        {isSuperAdmin ? (
          <>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Staff & Roles</h2>
                <p className="text-xs text-muted-foreground">Manage editors & access</p>
              </div>
            </Link>

            <Link
              to="/admin/system"
              className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 transition hover:border-primary/40 hover:bg-primary/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">System Usage</h2>
                <p className="text-xs text-muted-foreground">Storage, DB & health</p>
              </div>
            </Link>
          </>
        ) : (
          <Link
            to="/admin/media"
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Media Library</h2>
              <p className="text-xs text-muted-foreground">Upload & manage images</p>
            </div>
          </Link>
        )}
      </div>

      {/* Main Grid: Recent Stories & Publishing Activity */}
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Left: Recent Stories Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-display text-lg font-bold text-foreground">Recent News Stories</h2>
            <Link
              to="/admin/articles"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all stories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {stats?.recentArticles.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No articles yet. Click "Write New Story" to create your first article!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats?.recentArticles.map((article) => {
                  const statusColors: Record<string, string> = {
                    published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    draft: "bg-muted text-muted-foreground",
                    scheduled: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
                    archived: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                  };

                  return (
                    <div
                      key={article.id}
                      className="flex flex-col gap-3 p-4 transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              statusColors[article.status] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {article.status}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {article.category}
                          </span>
                        </div>
                        <h3 className="truncate font-display text-base font-bold text-foreground">
                          {article.headline}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          By {article.author} ·{" "}
                          {formatDate(article.publishedAt || new Date().toISOString())}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-2">
                        {article.status === "draft" && (
                          <button
                            type="button"
                            onClick={() => handleQuickPublish(article.id)}
                            className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                          >
                            Publish
                          </button>
                        )}
                        <Link
                          to="/admin/articles/$id"
                          params={{ id: article.id }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit story"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        {article.status === "published" && (
                          <Link
                            to="/news/$slug"
                            params={{ slug: article.slug }}
                            target="_blank"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="View on public site"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Activity Log Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Publishing Activity
            </h2>
            {isSuperAdmin && (
              <Link
                to="/admin/audit"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Full history
              </Link>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            {stats?.recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground">No recent activity logged yet.</p>
            ) : (
              <div className="space-y-3.5">
                {stats?.recentActivity.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground">
                        <span className="font-semibold">{log.actorName}</span>{" "}
                        <span className="text-muted-foreground">
                          {log.action.replace("article.", "story ").replace("user.", "user ")}
                        </span>
                      </p>
                      {log.entityTitle && (
                        <p className="truncate font-medium text-foreground/80 mt-0.5">
                          “{log.entityTitle}”
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
