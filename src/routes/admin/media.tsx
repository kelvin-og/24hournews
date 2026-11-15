import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  getStoredMedia,
  uploadMediaAsset,
  deleteMediaAsset,
  type MediaAsset,
} from "@/lib/news/admin-api";
import { useAuth } from "@/lib/auth/AuthContext";
import { Upload, Search, Copy, Trash2, Check, ImageIcon, HardDrive } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/media")({
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    const list = getStoredMedia();
    setMedia(list);
    if (!selectedAsset && list.length > 0 && list[0]) {
      setSelectedAsset(list[0]);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = media.filter(
    (m) =>
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      m.altText.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const asset = await uploadMediaAsset(
        file,
        file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        "",
        user ? { id: user.id, name: user.fullName, email: user.email } : undefined,
      );
      reload();
      setSelectedAsset(asset);
      toast.success("Image uploaded successfully");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCopyUrl = (asset: MediaAsset) => {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    toast.success("Image URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this image from your media library?")) {
      await deleteMediaAsset(id);
      toast.success("Image removed");
      const updated = media.filter((m) => m.id !== id);
      setMedia(updated);
      if (selectedAsset?.id === id) {
        setSelectedAsset(updated[0] || null);
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Media Library
          </h1>
          <p className="text-xs text-muted-foreground">
            Upload, browse, and reuse newsroom photos and editorial illustrations.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload New Photo"}
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search photos by filename or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-xs outline-none focus:border-primary"
          />
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {media.length} photos in library
        </p>
      </div>

      {/* Main Grid: Thumbnails & Inspector */}
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* Photos Grid */}
        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">No media files found</p>
              <p className="text-xs mt-1">Upload a photo to start using it in your articles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((item) => {
                const isSelected = selectedAsset?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAsset(item)}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition ${
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={item.url}
                        alt={item.altText}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5 bg-card">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {item.filename}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatSize(item.sizeBytes)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Asset Details Inspector */}
        <div>
          {selectedAsset ? (
            <div className="sticky top-24 rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted border border-border">
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.altText}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-1">
                <h3 className="truncate font-display text-base font-bold text-foreground">
                  {selectedAsset.filename}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatSize(selectedAsset.sizeBytes)} · {selectedAsset.mimeType}
                </p>
              </div>

              <div className="space-y-2 border-t border-border pt-3 text-xs">
                <div>
                  <span className="font-semibold text-foreground">Alt Text:</span>
                  <p className="text-muted-foreground mt-0.5">{selectedAsset.altText || "None"}</p>
                </div>
                {selectedAsset.caption && (
                  <div>
                    <span className="font-semibold text-foreground">Caption:</span>
                    <p className="text-muted-foreground mt-0.5">{selectedAsset.caption}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedAsset)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80"
                >
                  {copiedId === selectedAsset.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" /> URL Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Image URL
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedAsset.id)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-destructive/20 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete from Library
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Select an image from the library to view details and copy its URL.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
