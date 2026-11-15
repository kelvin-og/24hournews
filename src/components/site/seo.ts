import { SITE } from "@/lib/site";

/**
 * Shared helper that builds the `head()` return value for page routes.
 * Keeps og:site_name, twitter:card and canonical consistent across every section.
 */
export function pageMeta(title: string, description: string, path: string) {
  const url = `${SITE.url}${path}`;
  return {
    meta: [
      { title: `${title} | ${SITE.name}` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | ${SITE.name}` },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
