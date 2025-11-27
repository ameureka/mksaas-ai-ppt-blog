'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ADMIN_I18N } from '@/lib/constants/ppt-i18n';
import type { PPT } from '@/lib/types/ppt/ppt';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface PPTDeleteDialogProps {
  ppt: PPT | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PPTDeleteDialog({
  ppt,
  open,
  onOpenChange,
}: PPTDeleteDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!ppt) return;

    setIsDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('[v0] Deleting PPT:', ppt.id);
      toast.success(ADMIN_I18N.ppt.deleteSuccess);
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(ADMIN_I18N.ppt.deleteError);
      console.error('[v0] Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!ppt) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {ADMIN_I18N.ppt.deleteConfirmTitle}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>{ADMIN_I18N.ppt.deleteConfirmDesc}</p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">
                    {ADMIN_I18N.ppt.titleLabel}：
                  </span>
                  <span className="font-medium">{ppt.title}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">ID：</span>
                  <span className="font-mono text-sm">{ppt.id}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    {ADMIN_I18N.ppt.downloadsLabel}：
                  </span>
                  <span>
                    {ppt.downloads} {ADMIN_I18N.common.times}
                  </span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {ADMIN_I18N.ppt.deleteWarningTitle}
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-6">
                  <li>{ADMIN_I18N.ppt.deleteWarning1}</li>
                  <li>{ADMIN_I18N.ppt.deleteWarning2}</li>
                  <li>{ADMIN_I18N.ppt.deleteWarning3}</li>
                </ul>
              </div>
              <p className="font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {ADMIN_I18N.ppt.deleteIrreversible}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {ADMIN_I18N.common.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting
              ? ADMIN_I18N.common.deleting
              : ADMIN_I18N.common.confirmDelete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
