import { Link } from "@tanstack/react-router";
import type { Article } from "@/lib/news/types";

/** Renders nothing when there is no breaking news. */
export function BreakingTicker({ items }: { items: Article[] }) {
  if (!items.length) return null;
  const loop = [...items, ...items];
  return (
    <div
      className="border-b border-border bg-secondary text-secondary-foreground"
      role="region"
      aria-label="Breaking news"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4">
        <span className="shrink-0 bg-primary px-3 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary-foreground" />
          Breaking
        </span>
        <div className="relative flex-1 overflow-hidden">
          <ul className="flex w-max animate-ticker gap-10 py-2 text-sm">
            {loop.map((a, i) => (
              <li key={i} aria-hidden={i >= items.length}>
                <Link
                  to="/news/$slug"
                  params={{ slug: a.slug }}
                  tabIndex={i >= items.length ? -1 : 0}
                  className="whitespace-nowrap hover:text-primary"
                >
                  {a.headline}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
