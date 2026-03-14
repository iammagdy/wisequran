import { motion } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { APP_VERSION, changelog, type ChangelogEntry } from "@/data/changelog";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChangelogModalProps {
  open: boolean;
  newEntries: ChangelogEntry[];
  onDismiss: () => void;
}

export default function ChangelogModal({ open, newEntries, onDismiss }: ChangelogModalProps) {
  const [showAll, setShowAll] = useState(false);
  const { t } = useLanguage();

  const displayEntries = showAll ? changelog : newEntries;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl px-0 [&>button:last-child]:hidden">
        <SheetHeader className="px-6 pb-2">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <SheetTitle className="font-arabic text-lg">{t("whats_new")} {APP_VERSION}</SheetTitle>
            <p className="text-xs text-muted-foreground">{t("app_updated")}</p>
          </motion.div>
        </SheetHeader>

        <Separator className="mb-0" />

        <ScrollArea className="h-[calc(75vh-180px)] px-6 py-4">
          <div className="space-y-6">
            {displayEntries.map((entry, idx) => (
              <motion.div
                key={entry.version}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">v{entry.version}</Badge>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <ul className="space-y-1.5 pr-4">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {change}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {!showAll && changelog.length > newEntries.length && (
              <button
                onClick={() => setShowAll(true)}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                {t("show_all_changelog")}
              </button>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 pb-4 pt-2">
          <Button variant="gradient" className="w-full" onClick={onDismiss}>
            {t("ok_thanks")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
