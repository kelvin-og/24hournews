import type { Article } from "./types";
import { SAMPLE_ARTICLES } from "./sample-data";

// Shared in-process memory store for SSR & server execution
let serverArticles: Article[] = [...SAMPLE_ARTICLES];

export function getServerArticles(): Article[] {
  return serverArticles;
}

export function setServerArticles(articles: Article[]): void {
  serverArticles = articles;
}

export function upsertServerArticle(article: Article): void {
  const idx = serverArticles.findIndex((a) => a.id === article.id || a.slug === article.slug);
  if (idx !== -1) {
    serverArticles[idx] = article;
  } else {
    serverArticles.unshift(article);
  }
}

export function removeServerArticle(id: string): void {
  serverArticles = serverArticles.filter((a) => a.id !== id);
}
