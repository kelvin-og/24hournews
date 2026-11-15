import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirmDelete: () => void;
  onUnpublishInstead?: () => void;
  isPublished?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  onConfirmDelete,
  onUnpublishInstead,
  isPublished = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-bold">
            Remove this story?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">“{title}”</span>?
            </p>
            {isPublished && onUnpublishInstead && (
              <p className="rounded-lg bg-amber-500/10 p-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                Tip: If you want to temporarily take this story down from the public site, you can
                unpublish it back to drafts instead of deleting it permanently.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {isPublished && onUnpublishInstead && (
            <AlertDialogAction
              onClick={onUnpublishInstead}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Unpublish to Draft
            </AlertDialogAction>
          )}
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
