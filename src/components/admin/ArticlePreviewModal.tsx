import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminArticle } from "@/lib/news/admin-api";
import { CategoryLabel } from "@/components/site/CategoryLabel";
import { formatDate } from "@/lib/news/api";

interface ArticlePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: Partial<AdminArticle>;
}

export function ArticlePreviewModal({ open, onOpenChange, article }: ArticlePreviewModalProps) {
  const content = article.content || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:rounded-2xl">
        {/* Preview Banner */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-amber-500/10 px-6 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              Reader Preview Mode
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {article.readingTime || 3} min read · Category: {article.category}
          </span>
        </div>

        <article className="mx-auto max-w-3xl px-6 py-8">
          {/* Category & Headline */}
          <div className="mb-4">
            {article.category && <CategoryLabel slug={article.category} />}
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {article.headline || "Untitled Story"}
          </h1>

          {article.description && (
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground font-sans">
              {article.description}
            </p>
          )}

          {/* Author Byline */}
          <div className="my-6 flex items-center gap-3 border-y border-border py-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              By {article.author || "Newsroom Staff"}
            </span>
            <span>·</span>
            <time>{formatDate(article.publishedAt || new Date().toISOString())}</time>
            <span>·</span>
            <span>{article.readingTime || 3} min read</span>
          </div>

          {/* Featured Hero Image */}
          {article.featuredImage && (
            <figure className="mb-8 overflow-hidden rounded-xl bg-muted">
              <img
                src={article.featuredImage}
                alt={article.imageAlt || article.headline || ""}
                className="aspect-[16/9] w-full object-cover"
              />
              {article.imageCaption && (
                <figcaption className="p-3 text-xs text-muted-foreground bg-muted/40">
                  {article.imageCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Content Blocks */}
          <div className="space-y-5 text-base leading-relaxed text-foreground/90 font-sans">
            {content.map((block, idx) => {
              if (block.type === "heading") {
                return (
                  <h2
                    key={idx}
                    className="pt-4 font-display text-2xl font-bold tracking-tight text-foreground"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "quote") {
                return (
                  <blockquote
                    key={idx}
                    className="border-l-4 border-primary pl-4 italic text-muted-foreground my-6 text-lg"
                  >
                    “{block.text}”
                    {block.cite && (
                      <cite className="block not-italic text-xs font-semibold text-foreground mt-2">
                        — {block.cite}
                      </cite>
                    )}
                  </blockquote>
                );
              }
              if (block.type === "image" && block.src) {
                return (
                  <figure key={idx} className="my-6 overflow-hidden rounded-lg">
                    <img src={block.src} alt={block.alt || ""} className="w-full object-cover" />
                    {block.caption && (
                      <figcaption className="pt-2 text-xs text-muted-foreground">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              }
              if (block.type === "paragraph") {
                return (
                  <p key={idx} className="leading-relaxed">
                    {block.text}
                  </p>
                );
              }
              return null;
            })}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-1.5 border-t border-border pt-4">
              {article.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>
      </DialogContent>
    </Dialog>
  );
}
