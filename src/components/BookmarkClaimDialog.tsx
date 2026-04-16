import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  discardAnonymousClaims,
  listPendingAnonymousClaims,
  mergeAnonymousBookmarksIntoUser,
  subscribeToBookmarkChanges,
  type BookmarkRecord,
} from "@/lib/bookmarks";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function BookmarkClaimDialog() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [pending, setPending] = useState<BookmarkRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const ar = language === "ar";

  useEffect(() => {
    if (!user) {
      setPending([]);
      setOpen(false);
      return;
    }
    const uid = user.id;
    let cancelled = false;
    const refresh = async () => {
      try {
        const list = await listPendingAnonymousClaims(uid);
        if (cancelled) return;
        setPending(list);
        if (list.length > 0) setOpen(true);
      } catch {
        // ignore — if we can't read IDB, the dialog simply won't show
      }
    };
    void refresh();
    const unsub = subscribeToBookmarkChanges(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [user]);

  if (!user || pending.length === 0) return null;

  const count = pending.length;
  const handleMerge = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const n = await mergeAnonymousBookmarksIntoUser(user.id);
      toast.success(
        ar
          ? `تمت إضافة ${n} إشارة إلى حسابك.`
          : `Added ${n} bookmark${n === 1 ? "" : "s"} to your account.`,
      );
      setOpen(false);
      setPending([]);
    } finally {
      setBusy(false);
    }
  };

  const handleDiscard = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await discardAnonymousClaims(user.id);
      setOpen(false);
      setPending([]);
    } finally {
      setBusy(false);
    }
  };

  const handleLater = () => {
    if (busy) return;
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleLater()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {ar ? "إضافة الإشارات المرجعية إلى حسابك؟" : "Add bookmarks to your account?"}
          </DialogTitle>
          <DialogDescription>
            {ar
              ? `وجدنا ${count} إشارة مرجعية أو ملاحظة محفوظة على هذا الجهاز قبل تسجيل الدخول. ماذا تريد أن تفعل؟`
              : `We found ${count} bookmark${count === 1 ? "" : "s"} or note${count === 1 ? "" : "s"} saved on this device before you signed in. What would you like to do?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button variant="ghost" onClick={handleLater} disabled={busy}>
            {ar ? "لاحقًا" : "Decide later"}
          </Button>
          <Button variant="outline" onClick={handleDiscard} disabled={busy}>
            {ar ? "لا تُضف" : "Don't add"}
          </Button>
          <Button onClick={handleMerge} disabled={busy}>
            {ar ? "أضف إلى حسابي" : "Add to my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
