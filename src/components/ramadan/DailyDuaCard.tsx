import { Share2, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DAILY_DUAS } from "@/lib/ramadan-data";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface DailyDuaCardProps {
  ramadanDay: number;
}

export default function DailyDuaCard({ ramadanDay }: DailyDuaCardProps) {
  const { t, language } = useLanguage();
  const dua = DAILY_DUAS[(ramadanDay - 1) % 30];

  const handleShare = async () => {
    const text = language === "ar"
      ? `🤲 دعاء اليوم ${ramadanDay} من رمضان\n\n${dua.text}\n\n— ${dua.source}`
      : `🤲 Day ${ramadanDay} Ramadan Dua\n\n${dua.text}\n\n— ${dua.source}`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fall through
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("dua_copied"));
    } catch {
      toast.error(t("copy_failed"));
    }
  };

  return (
    <Card className="border-amber-300/40 dark:border-amber-600/30 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-900/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">{t("daily_dua_label")}</h3>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleShare}>
            {navigator.share ? (
              <Share2 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <p className="text-sm leading-relaxed font-arabic text-foreground" dir="rtl">{dua.text}</p>
        <p className="text-[0.625rem] text-muted-foreground">{dua.source}</p>
      </CardContent>
    </Card>
  );
}
