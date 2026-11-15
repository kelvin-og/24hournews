import { describe, expect, it } from "vitest";
import { getArticles, getFeatured, searchArticles } from "@/lib/news/api";

describe("news data rules", () => {
  it("General News aggregates all categories without duplicates", async () => {
    const list = await getArticles("general-news");
    expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
    expect(new Set(list.map((a) => a.category)).size).toBe(6);
  });
  it("category carousels only contain that category", async () => {
    const f = await getFeatured("sports");
    expect(f.length).toBeGreaterThan(0);
    expect(f.every((a) => a.category === "sports")).toBe(true);
  });
  it("search matches article body text", async () => {
    expect((await searchArticles("clinics")).length).toBe(1);
  });
});
