import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ title, category }: { title: string; category?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-foreground pb-3">
      <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
      {category && (
        <Link
          to="/$category"
          params={{ category }}
          className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary hover:text-primary-strong"
        >
          See all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
