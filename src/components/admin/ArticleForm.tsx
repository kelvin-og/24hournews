import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  type AdminArticle,
  type AdminArticleStatus,
  saveAdminArticle,
  calculateReadingTime,
  generateSlug,
} from "@/lib/news/admin-api";
import type { ContentBlock } from "@/lib/news/types";
import { CATEGORIES, type CategorySlug } from "@/lib/site";
import { useAuth } from "@/lib/auth/AuthContext";
import { MediaLibraryModal } from "./MediaLibraryModal";
import { ArticlePreviewModal } from "./ArticlePreviewModal";
import {
  ArrowLeft,
  Eye,
  Save,
  Send,
  Upload,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Star,
  Flame,
} from "lucide-react";
import { toast } from "sonner";

interface ArticleFormProps {
  initialData?: Partial<AdminArticle>;
  isEditing?: boolean;
}

export function ArticleForm({ initialData, isEditing = false }: ArticleFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Core Form State
  const [headline, setHeadline] = useState(initialData?.headline || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState<CategorySlug>(
    (initialData?.category as CategorySlug) || "education",
  );
  const [author, setAuthor] = useState(initialData?.author || user?.fullName || "Staff Reporter");
  const [status, setStatus] = useState<AdminArticleStatus>(initialData?.status || "draft");
  const [scheduledFor, setScheduledFor] = useState(initialData?.scheduledFor || "");
  const [featuredImage, setFeaturedImage] = useState(
    initialData?.featuredImage ||
      "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1280&auto=format&fit=crop&q=80",
  );
  const [imageAlt, setImageAlt] = useState(initialData?.imageAlt || "");
  const [imageCaption, setImageCaption] = useState(initialData?.imageCaption || "");
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.featured));
  const [isBreaking, setIsBreaking] = useState(Boolean(initialData?.breaking));
  const [isEditorialPick, setIsEditorialPick] = useState(Boolean(initialData?.isEditorialPick));
  const [isPopularOverride, setIsPopularOverride] = useState(
    Boolean(initialData?.isPopularOverride),
  );
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(", ") || "");
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || "");

  // Content Blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    initialData?.content && initialData.content.length > 0
      ? initialData.content
      : [{ type: "paragraph", text: "" }],
  );

  // Modals & UI helpers
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-generate slug from headline unless user manually modified slug
  useEffect(() => {
    if (!slugManual && headline) {
      setSlug(generateSlug(headline));
    }
  }, [headline, slugManual]);

  // Autosave Draft to localStorage every 20 seconds
  useEffect(() => {
    if (!headline.trim()) return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      const draftPayload = {
        headline,
        description,
        category,
        blocks,
        featuredImage,
        imageAlt,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("24hournews_editor_draft", JSON.stringify(draftPayload));
      setLastSaved("Draft autosaved locally");
    }, 20000);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [headline, description, category, blocks, featuredImage, imageAlt]);

  // Block management
  const addBlock = (type: "paragraph" | "heading" | "quote") => {
    if (type === "quote") {
      setBlocks([...blocks, { type: "quote", text: "", cite: "" }]);
    } else {
      setBlocks([...blocks, { type, text: "" }]);
    }
  };

  const updateBlock = (index: number, text: string, cite?: string) => {
    const updated = [...blocks];
    const b = updated[index];
    if (!b) return;
    if (b.type === "quote") {
      const resolvedCite = cite ?? b.cite;
      updated[index] = {
        type: "quote",
        text,
        ...(resolvedCite !== undefined ? { cite: resolvedCite } : {}),
      };
    } else if (b.type === "paragraph") {
      updated[index] = { type: "paragraph", text };
    } else if (b.type === "heading") {
      updated[index] = { type: "heading", text };
    }
    setBlocks(updated);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) {
      setBlocks([{ type: "paragraph", text: "" }]);
      return;
    }
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  // Save / Publish action
  const handleSubmit = async (targetStatus?: AdminArticleStatus) => {
    if (!headline.trim()) {
      toast.error("Please add a story headline");
      return;
    }

    const currentStatus = targetStatus || status;

    if (currentStatus === "scheduled" && !scheduledFor) {
      toast.error("Please select a date and time to schedule this story");
      return;
    }

    setIsSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const articlePayload = {
        headline: headline.trim(),
        slug: slug.trim() || generateSlug(headline),
        description: description.trim(),
        category,
        author: author.trim() || "Newsroom Staff",
        status: currentStatus,
        featuredImage,
        imageAlt: imageAlt.trim() || headline,
        imageCaption: imageCaption.trim(),
        featured: isFeatured,
        breaking: isBreaking,
        isEditorialPick,
        isPopularOverride,
        tags,
        content: blocks.filter((b) => ("text" in b ? Boolean(b.text.trim()) : true)),
        seoTitle: seoTitle.trim() || headline,
        seoDescription: seoDescription.trim() || description,
        ...(initialData?.id !== undefined ? { id: initialData.id } : {}),
        ...(currentStatus === "scheduled" && scheduledFor ? { scheduledFor } : {}),
        ...(currentStatus === "published"
          ? { publishedAt: initialData?.publishedAt || new Date().toISOString() }
          : initialData?.publishedAt
            ? { publishedAt: initialData.publishedAt }
            : {}),
      } as Parameters<typeof saveAdminArticle>[0];

      const saved = await saveAdminArticle(
        articlePayload,
        user
          ? { id: user.id, name: user.fullName, email: user.email }
          : { id: "unknown", name: "Staff", email: "staff@24hournews.com.gh" },
      );

      setStatus(currentStatus);
      setLastSaved(
        `Saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );
      localStorage.removeItem("24hournews_editor_draft");

      if (currentStatus === "published") {
        toast.success("Story published successfully!");
      } else if (currentStatus === "scheduled") {
        toast.success("Story scheduled for publishing!");
      } else {
        toast.success("Draft saved successfully");
      }

      navigate({ to: "/admin/articles" });
    } catch {
      toast.error("Failed to save article");
    } finally {
      setIsSaving(false);
    }
  };

  const readingTime = calculateReadingTime(blocks, description);

  const previewData: Partial<AdminArticle> = {
    headline: headline || "Story headline preview",
    description,
    category: (category === "general-news"
      ? "education"
      : category) as import("@/lib/site").ArticleCategory,
    author: author || user?.fullName || "Staff Writer",
    featuredImage,
    imageAlt: imageAlt || headline,
    imageCaption,
    content: blocks,
    readingTime,
    tags: tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/articles"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Back to all stories"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {isEditing ? "Edit Story" : "Write New Story"}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{readingTime} min read</span>
              {lastSaved && (
                <>
                  <span>·</span>
                  <span className="text-primary flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> {lastSaved}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("draft")}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSubmit("published")}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {status === "published" ? "Update Published Story" : "Publish Now"}
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* Left Column: Story Writing Area */}
        <div className="space-y-6">
          {/* Headline */}
          <div className="space-y-1.5">
            <label
              htmlFor="headline"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Headline <span className="text-destructive">*</span>
            </label>
            <textarea
              id="headline"
              rows={2}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Enter clear, compelling headline..."
              className="w-full resize-none rounded-xl border border-input bg-card p-4 font-display text-2xl font-bold leading-snug tracking-tight text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Slug (URL key) */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">URL:</span>
            <span>24hournews.com.gh/news/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(generateSlug(e.target.value));
              }}
              className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none border-b border-dashed border-border focus:border-primary"
            />
          </div>

          {/* Summary / Excerpt */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="description"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Story Summary / Excerpt
              </label>
              <span className="text-[11px] text-muted-foreground">
                {description.length}/160 characters (ideal for previews)
              </span>
            </div>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary that introduces the story on the home page and in social previews..."
              className="w-full rounded-xl border border-input bg-card p-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Body Content Blocks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Story Body
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addBlock("paragraph")}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                >
                  <Plus className="h-3 w-3" /> Paragraph
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("heading")}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                >
                  <Plus className="h-3 w-3" /> Subheading
                </button>
                <button
                  type="button"
                  onClick={() => addBlock("quote")}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                >
                  <Plus className="h-3 w-3" /> Pull Quote
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div
                  key={index}
                  className="group relative rounded-xl border border-border bg-card p-3 transition focus-within:border-primary/60"
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold capitalize text-foreground/80">
                      {block.type === "heading"
                        ? "Subheading"
                        : block.type === "quote"
                          ? "Pull Quote"
                          : `Paragraph ${index + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBlock(index)}
                      className="opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                      title="Remove block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {block.type === "heading" && (
                    <input
                      type="text"
                      value={block.text}
                      onChange={(e) => updateBlock(index, e.target.value)}
                      placeholder="Section subheading..."
                      className="w-full bg-transparent font-display text-lg font-bold text-foreground outline-none"
                    />
                  )}

                  {block.type === "paragraph" && (
                    <textarea
                      rows={3}
                      value={block.text}
                      onChange={(e) => updateBlock(index, e.target.value)}
                      placeholder="Write paragraph text..."
                      className="w-full resize-y bg-transparent text-sm leading-relaxed text-foreground outline-none"
                    />
                  )}

                  {block.type === "quote" && (
                    <div className="space-y-2 border-l-2 border-primary pl-3">
                      <textarea
                        rows={2}
                        value={block.text}
                        onChange={(e) => updateBlock(index, e.target.value)}
                        placeholder="Quote text..."
                        className="w-full resize-none bg-transparent text-sm italic text-foreground outline-none"
                      />
                      <input
                        type="text"
                        value={block.cite || ""}
                        onChange={(e) => updateBlock(index, block.text, e.target.value)}
                        placeholder="Citation or source attribution (e.g. Minister of Education)..."
                        className="w-full bg-transparent text-xs text-muted-foreground outline-none border-b border-border focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Publishing, Media & SEO Settings */}
        <div className="space-y-6">
          {/* Publishing & Category Box */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-foreground">Publishing Settings</h3>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs font-semibold text-muted-foreground">
                News Desk / Category <span className="text-destructive">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CategorySlug)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div className="space-y-1.5">
              <label htmlFor="author" className="text-xs font-semibold text-muted-foreground">
                Author Byline
              </label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name..."
                className="w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-xs font-semibold text-muted-foreground">
                Publication Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AdminArticleStatus)}
                className="w-full rounded-lg border border-input bg-background p-2.5 text-xs font-medium text-foreground outline-none focus:border-primary"
              >
                <option value="draft">Draft (Work in progress)</option>
                <option value="published">Published (Live now)</option>
                <option value="scheduled">Scheduled (Publish later)</option>
                <option value="archived">Archived (Off public feed)</option>
              </select>
            </div>

            {/* Schedule picker if scheduled */}
            {status === "scheduled" && (
              <div className="rounded-lg bg-secondary/50 p-3 space-y-1.5">
                <label
                  htmlFor="scheduledFor"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Schedule Date & Time
                </label>
                <input
                  id="scheduledFor"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Editorial Flags & Homepage Placement */}
            <div className="pt-3 border-t border-border space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Homepage Placement & Feeds
              </span>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Hero Carousel (Top Stories)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={isEditorialPick}
                  onChange={(e) => setIsEditorialPick(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5 text-primary font-semibold">
                  <Star className="h-3.5 w-3.5 text-primary fill-primary/20" />
                  Editorial Highlights (Editor's Pick)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={isPopularOverride}
                  onChange={(e) => setIsPopularOverride(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5 text-orange-600 font-semibold dark:text-orange-400">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  Pin to Most Popular (Top 5 Ranking)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-1.5 text-destructive font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  Breaking News Ticker
                </span>
              </label>
            </div>
          </div>

          {/* Featured Image Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">Featured Photo</h3>
              <button
                type="button"
                onClick={() => setMediaModalOpen(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change Image
              </button>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted border border-border">
              {featuredImage ? (
                <img
                  src={featuredImage}
                  alt={imageAlt || "Story photo"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                  No image selected
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMediaModalOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-foreground"
            >
              <Upload className="h-3.5 w-3.5" />
              Choose from Media Library
            </button>

            <div className="space-y-1.5 pt-1">
              <label htmlFor="imageAlt" className="text-[11px] font-semibold text-muted-foreground">
                Alt Text (Screen readers & SEO)
              </label>
              <input
                id="imageAlt"
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Describe image content..."
                className="w-full rounded-md border border-input bg-background p-1.5 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="imageCaption"
                className="text-[11px] font-semibold text-muted-foreground"
              >
                Photo Caption
              </label>
              <input
                id="imageCaption"
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Credit or caption..."
                className="w-full rounded-md border border-input bg-background p-1.5 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Tags & Search Optimization */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="font-display text-sm font-bold text-foreground">
              Tags & Search Details
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-xs font-semibold text-muted-foreground">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Accra, Politics, Parliament, Economy"
                className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border">
              <label
                htmlFor="seoTitle"
                className="text-xs font-semibold text-muted-foreground flex items-center justify-between"
              >
                <span>Custom SEO Title</span>
                <span className="text-[10px]">{seoTitle.length}/60</span>
              </label>
              <input
                id="seoTitle"
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={headline || "Leave empty to use story headline"}
                className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="seoDescription"
                className="text-xs font-semibold text-muted-foreground flex items-center justify-between"
              >
                <span>Custom Meta Description</span>
                <span className="text-[10px]">{seoDescription.length}/160</span>
              </label>
              <textarea
                id="seoDescription"
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={description || "Leave empty to use story summary"}
                className="w-full resize-none rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MediaLibraryModal
        open={mediaModalOpen}
        onOpenChange={setMediaModalOpen}
        selectedUrl={featuredImage}
        onSelectImage={(asset) => {
          setFeaturedImage(asset.url);
          if (!imageAlt && asset.altText) setImageAlt(asset.altText);
          if (!imageCaption && asset.caption) setImageCaption(asset.caption);
        }}
      />

      <ArticlePreviewModal open={previewOpen} onOpenChange={setPreviewOpen} article={previewData} />
    </div>
  );
}
