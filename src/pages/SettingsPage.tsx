import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Trash2, Download, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/hooks/useTheme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { clearAllData, getAllDownloadedSurahs } from "@/lib/db";
import { downloadSurah, fetchSurahList, type SurahMeta } from "@/lib/quran-api";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [fontSize, setFontSize] = useLocalStorage<number>("wise-font-size", 24);
  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>([]);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    getAllDownloadedSurahs().then(setDownloadedSurahs);
    fetchSurahList().then(setSurahs);
  }, []);

  const handleDownloadAll = async () => {
    setDownloading(true);
    const total = 114;
    for (let i = 1; i <= total; i++) {
      if (!downloadedSurahs.includes(i)) {
        try {
          await downloadSurah(i);
        } catch {
          // continue on error
        }
      }
      setDownloadProgress(Math.round((i / total) * 100));
    }
    const updated = await getAllDownloadedSurahs();
    setDownloadedSurahs(updated);
    setDownloading(false);
    toast.success("تم تحميل القرآن الكريم بالكامل");
  };

  const handleClear = async () => {
    await clearAllData();
    setDownloadedSurahs([]);
    toast.success("تم مسح البيانات المحملة");
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-1 text-2xl font-bold">الإعدادات</h1>
      <p className="mb-6 text-sm text-muted-foreground">Settings</p>

      <div className="space-y-4">
        {/* Theme */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm"
        >
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          <div className="flex items-center gap-3">
            <span className="font-semibold">الوضع الليلي</span>
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </div>
        </motion.div>

        {/* Font Size */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{fontSize}px</span>
            <span className="font-semibold">حجم الخط</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={16}
            max={40}
            step={2}
          />
          <p
            className="mt-3 text-center font-arabic text-muted-foreground"
            style={{ fontSize }}
            dir="rtl"
          >
            بِسْمِ اللَّهِ
          </p>
        </motion.div>

        {/* Download Manager */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {downloadedSurahs.length}/114 سورة
            </span>
            <span className="font-semibold">المحتوى المحمّل</span>
          </div>

          {downloading ? (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                جارٍ التحميل... {downloadProgress}%
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive transition-colors hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
                مسح الكل
              </button>
              <button
                onClick={handleDownloadAll}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary p-3 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {downloadedSurahs.length === 114 ? (
                  <>
                    <Check className="h-4 w-4" />
                    مكتمل
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    تحميل الكل
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl bg-card p-4 text-center shadow-sm"
        >
          <p className="font-arabic text-lg font-bold text-primary">Wise QURAN</p>
          <p className="text-xs text-muted-foreground">v1.0.0 · Made with ❤️</p>
        </motion.div>
      </div>
    </div>
  );
}
