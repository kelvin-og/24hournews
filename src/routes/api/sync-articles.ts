import { createFileRoute } from "@tanstack/react-router";
import {
  getServerArticles,
  upsertServerArticle,
  removeServerArticle,
} from "@/lib/news/server-store";
import {
  upsertArticleInSupabase,
  deleteArticleInSupabase,
  fetchArticlesFromSupabase,
  insertAuditLogInSupabase,
  fetchAuditLogsFromSupabase,
  upsertStaffProfileInSupabase,
  fetchStaffProfilesFromSupabase,
  upsertMediaAssetInSupabase,
  fetchMediaAssetsFromSupabase,
} from "@/lib/supabase/db-server";
import type { Article } from "@/lib/news/types";

export const Route = createFileRoute("/api/sync-articles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const type = url.searchParams.get("type");

        if (type === "staff") {
          const staff = await fetchStaffProfilesFromSupabase();
          return Response.json(staff || []);
        }
        if (type === "audit") {
          const audit = await fetchAuditLogsFromSupabase();
          return Response.json(audit || []);
        }
        if (type === "media") {
          const media = await fetchMediaAssetsFromSupabase();
          return Response.json(media || []);
        }

        try {
          const dbArticles = await fetchArticlesFromSupabase();
          if (dbArticles && dbArticles.length > 0) {
            return Response.json(dbArticles);
          }
        } catch {
          // fallback
        }
        return Response.json(getServerArticles());
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action: "upsert" | "remove" | "audit" | "staff" | "media";
            article?: Article;
            id?: string;
            auditLog?: Parameters<typeof insertAuditLogInSupabase>[0];
            staff?: Parameters<typeof upsertStaffProfileInSupabase>[0];
            media?: Parameters<typeof upsertMediaAssetInSupabase>[0];
          };

          if (body.action === "upsert" && body.article) {
            upsertServerArticle(body.article);
            await upsertArticleInSupabase(body.article);
            return Response.json({ success: true, count: getServerArticles().length });
          } else if (body.action === "remove" && (body.id || body.article?.slug)) {
            const target = body.id || body.article?.slug || "";
            removeServerArticle(target);
            await deleteArticleInSupabase(target);
            return Response.json({ success: true, count: getServerArticles().length });
          } else if (body.action === "audit" && body.auditLog) {
            await insertAuditLogInSupabase(body.auditLog);
            return Response.json({ success: true });
          } else if (body.action === "staff" && body.staff) {
            await upsertStaffProfileInSupabase(body.staff);
            return Response.json({ success: true });
          } else if (body.action === "media" && body.media) {
            await upsertMediaAssetInSupabase(body.media);
            return Response.json({ success: true });
          }

          return Response.json({ error: "Invalid payload" }, { status: 400 });
        } catch (err) {
          return Response.json({ error: (err as Error).message }, { status: 500 });
        }
      },
    },
  },
});
