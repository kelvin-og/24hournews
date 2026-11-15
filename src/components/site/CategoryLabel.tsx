import { Link } from "@tanstack/react-router";
import { getCategory } from "@/lib/site";

export function CategoryLabel({ slug, onImage = false }: { slug: string; onImage?: boolean }) {
  const c = getCategory(slug);
  if (!c) return null;
  return (
    <Link
      to="/$category"
      params={{ category: c.slug }}
      className={`inline-block text-[11px] font-extrabold uppercase tracking-[0.14em] transition-colors ${onImage ? "rounded-sm bg-primary px-2 py-1 text-primary-foreground" : "text-primary hover:text-primary-strong"}`}
    >
      {c.name}
    </Link>
  );
}
