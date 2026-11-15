import type { ReactNode } from "react";

export function StaticPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 border-b-2 border-foreground pb-4 font-display text-4xl font-black sm:text-5xl">
        {title}
      </h1>
      <div className="space-y-5 text-lg leading-relaxed [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold">
        {children}
      </div>
    </div>
  );
}
