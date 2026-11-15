import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getStoredMedia, uploadMediaAsset, type MediaAsset } from "@/lib/news/admin-api";
import { useAuth } from "@/lib/auth/AuthContext";
import { Upload, Check, Image as ImageIcon, Search } from "lucide-react";
import { toast } from "sonner";

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (asset: MediaAsset) => void;
  selectedUrl?: string;
}

export function MediaLibraryModal({
  open,
  onOpenChange,
  onSelectImage,
  selectedUrl,
}: MediaLibraryModalProps) {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMedia(getStoredMedia());
    }
  }, [open]);

  const filtered = media.filter(
    (m) =>
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      m.altText.toLowerCase().includes(search.toLowerCase()) ||
      m.caption?.toLowerCase().includes(search.toLowerCase()),
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
        file.name.replace(/\.[^/.]+$/, ""),
        "",
        user ? { id: user.id, name: user.fullName, email: user.email } : undefined,
      );
      setMedia(getStoredMedia());
      toast.success("Image uploaded successfully");
      onSelectImage(asset);
      onOpenChange(false);
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Media Library</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select an existing image or upload a new photo for this story.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search images by name or alt text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary"
            />
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
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isUploading ? "Uploading..." : "Upload New Image"}
            </button>
          </div>
        </div>

        {/* Images Grid */}
        <div className="mt-4 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold">No images found</p>
              <p className="text-xs">Upload a photo or try a different search keyword.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filtered.map((item) => {
                const isSelected = selectedUrl === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectImage(item);
                      onOpenChange(false);
                    }}
                    className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition focus:outline-none ${
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-1"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                      <img
                        src={item.url}
                        alt={item.altText}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[11px] font-semibold text-foreground">
                        {item.filename}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {item.altText || "No description"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
