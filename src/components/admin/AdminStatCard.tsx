import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  label: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  badge?: string;
}

export function AdminStatCard({
  label,
  value,
  description,
  icon: Icon,
  href,
  badge,
}: AdminStatCardProps) {
  const content = (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-black text-foreground">{value}</span>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
