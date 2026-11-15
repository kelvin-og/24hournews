import { createFileRoute } from "@tanstack/react-router";
import { getArticles } from "@/lib/news/api";
import { CATEGORIES, SITE } from "@/lib/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const articles = await getArticles();
        const paths = [
          "/",
          ...CATEGORIES.map((c) => `/${c.slug}`),
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms",
          "/cookie-policy",
        ];
        const urls = [
          ...paths.map((p) => `<url><loc>${SITE.url}${p}</loc></url>`),
          ...articles.map(
            (a) =>
              `<url><loc>${SITE.url}/news/${a.slug}</loc><lastmod>${a.updatedAt ?? a.publishedAt}</lastmod></url>`,
          ),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});
