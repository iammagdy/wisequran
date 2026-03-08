import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed or dismissed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("wise-install-dismissed")) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem("wise-install-dismissed", "1");
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    setDeferredPrompt(null);
  }, [deferredPrompt, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-20 left-3 right-3 z-50 rounded-xl border border-border bg-card p-4 shadow-lg"
        >
          <button
            onClick={dismiss}
            className="absolute top-2 left-2 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3" dir="rtl">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">ثبّت التطبيق</p>
              <p className="text-xs text-muted-foreground">للوصول السريع بدون متصفح</p>
            </div>
            {isIOS ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Share className="h-3.5 w-3.5" />
                <span>شارك ← أضف للشاشة</span>
              </div>
            ) : deferredPrompt ? (
              <Button size="sm" onClick={handleInstall} className="shrink-0">
                تثبيت
              </Button>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
