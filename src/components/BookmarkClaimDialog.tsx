import { useEffect, useRef, useState } from "react";
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
  fingerprintPendingClaims,
  listPendingAnonymousClaims,
  mergeAnonymousBookmarksIntoUser,
  subscribeToBookmarkChanges,
  type BookmarkRecord,
} from "@/lib/bookmarks";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

// sessionStorage survives reload within the same tab but is cleared on
// sign-out (we also explicitly remove it below) and tab close — matching
// "shown once per sign-in session unless new anonymous bookmarks appear".
const DEFERRED_FP_KEY = (uid: string) => `wise-bm-claim-deferred:${uid}`;

function readDeferredFingerprint(uid: string): string | null {
  try {
    return sessionStorage.getItem(DEFERRED_FP_KEY(uid));
  } catch {
    return null;
  }
}
function writeDeferredFingerprint(uid: string, fp: string): void {
  try { sessionStorage.setItem(DEFERRED_FP_KEY(uid), fp); } catch { /* ignore */ }
}
function clearDeferredFingerprint(uid: string): void {
  try { sessionStorage.removeItem(DEFERRED_FP_KEY(uid)); } catch { /* ignore */ }
}

export default function BookmarkClaimDialog() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [pending, setPending] = useState<BookmarkRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // Fingerprint of the pending set the user most recently chose to
  // defer during *this* tab session. The dialog stays closed while the
  // live pending set still matches it; it reopens only when a new/edited
  // anonymous bookmark changes the fingerprint.
  const deferredFpRef = useRef<string | null>(null);
  // Remember the uid we last saw so we can clear its deferred-fingerprint
  // sessionStorage entry on sign-out (or when the user changes), so a
  // sign-out → sign-in cycle in the same tab yields a fresh prompt.
  const lastUidRef = useRef<string | null>(null);

  const ar = language === "ar";

  useEffect(() => {
    const prevUid = lastUidRef.current;
    if (!user) {
      if (prevUid) clearDeferredFingerprint(prevUid);
      lastUidRef.current = null;
      setPending([]);
      setOpen(false);
      deferredFpRef.current = null;
      return;
    }
    const uid = user.id;
    if (prevUid && prevUid !== uid) clearDeferredFingerprint(prevUid);
    lastUidRef.current = uid;
    deferredFpRef.current = readDeferredFingerprint(uid);
    let cancelled = false;
    const refresh = async () => {
      try {
        const list = await listPendingAnonymousClaims(uid);
        if (cancelled) return;
        setPending(list);
        if (list.length === 0) {
          setOpen(false);
          return;
        }
        const fp = fingerprintPendingClaims(list);
        // If the user already deferred exactly this set in this session,
        // don't re-open — honors "Decide later" until claims change.
        if (deferredFpRef.current && deferredFpRef.current === fp) {
          setOpen(false);
          return;
        }
        // New or changed pending set — clear any stale deferred fp and open.
        if (deferredFpRef.current && deferredFpRef.current !== fp) {
          deferredFpRef.current = null;
          clearDeferredFingerprint(uid);
        }
        setOpen(true);
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
      deferredFpRef.current = null;
      clearDeferredFingerprint(user.id);
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
      deferredFpRef.current = null;
      clearDeferredFingerprint(user.id);
      setOpen(false);
      setPending([]);
    } finally {
      setBusy(false);
    }
  };

  const handleLater = () => {
    if (busy || !user) return;
    // Persist the current pending fingerprint so subsequent bookmark
    // change events during this tab session don't re-open the dialog
    // unless the pending set actually changes.
    const fp = fingerprintPendingClaims(pending);
    deferredFpRef.current = fp;
    writeDeferredFingerprint(user.id, fp);
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
