import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Moon, Sun, Trash2, Download, Check, ChevronDown, ChevronUp, Volume2, Loader2, Target } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "@/hooks/useTheme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { clearAllData, getAllDownloadedSurahs, getAllDownloadedAudio, clearAllAudio, deleteAudio } from "@/lib/db";
import { downloadSurah, fetchSurahList, type SurahMeta } from "@/lib/quran-api";
import { downloadSurahAudio } from "@/lib/quran-audio";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [fontSize, setFontSize] = useLocalStorage<number>("wise-font-size", 24);
  const { goal, setGoal } = useDailyReading();
  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>([]);
  const [downloadedAudio, setDownloadedAudio] = useState<number[]>([]);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [audioDownloading, setAudioDownloading] = useState(false);
  const [audioDownloadProgress, setAudioDownloadProgress] = useState(0);
  const [singleAudioDownloading, setSingleAudioDownloading] = useState<number | null>(null);
  const [showAudioList, setShowAudioList] = useState(false);

  useEffect(() => {
    getAllDownloadedSurahs().then(setDownloadedSurahs);
    getAllDownloadedAudio().then(setDownloadedAudio);
    fetchSurahList().then(setSurahs);
  }, []);

  const handleDownloadAll = async () => {
    setDownloading(true);
    const total = 114;
    for (let i = 1; i <= total; i++) {
      if (!downloadedSurahs.includes(i)) {
        try { await downloadSurah(i); } catch { /* continue */ }
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
    setDownloadedAudio([]);
    toast.success("تم مسح البيانات المحملة");
  };

  const handleDownloadAllAudio = async () => {
    setAudioDownloading(true);
    const total = 114;
    for (let i = 1; i <= total; i++) {
      if (!downloadedAudio.includes(i)) {
        try { await downloadSurahAudio(i); } catch { /* continue */ }
      }
      setAudioDownloadProgress(Math.round((i / total) * 100));
    }
    const updated = await getAllDownloadedAudio();
    setDownloadedAudio(updated);
    setAudioDownloading(false);
    toast.success("تم تحميل جميع التلاوات");
  };

  const handleClearAllAudio = async () => {
    await clearAllAudio();
    setDownloadedAudio([]);
    toast.success("تم مسح جميع التلاوات");
  };

  const handleDownloadSingleAudio = async (num: number) => {
    setSingleAudioDownloading(num);
    try {
      await downloadSurahAudio(num);
      const updated = await getAllDownloadedAudio();
      setDownloadedAudio(updated);
      toast.success("تم تحميل التلاوة");
    } catch {
      toast.error("فشل تحميل التلاوة");
    }
    setSingleAudioDownloading(null);
  };

  const handleDeleteSingleAudio = async (num: number) => {
    await deleteAudio(num);
    const updated = await getAllDownloadedAudio();
    setDownloadedAudio(updated);
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

        {/* Text Download Manager */}
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

        {/* Audio Download Manager */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {downloadedAudio.length}/114 سورة
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">الصوت المحمّل</span>
              <Volume2 className="h-5 w-5 text-primary" />
            </div>
          </div>

          {audioDownloading ? (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${audioDownloadProgress}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                جارٍ تحميل التلاوات... {audioDownloadProgress}%
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive transition-colors hover:bg-destructive/20"
                    disabled={downloadedAudio.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    مسح الصوت
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>مسح جميع التلاوات؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف جميع ملفات الصوت المحملة. يمكنك إعادة تحميلها لاحقاً.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogAction onClick={handleClearAllAudio} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      نعم، مسح الكل
                    </AlertDialogAction>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <button
                onClick={handleDownloadAllAudio}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary p-3 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {downloadedAudio.length === 114 ? (
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

          {/* Expandable surah list */}
          <button
            onClick={() => setShowAudioList(!showAudioList)}
            className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {showAudioList ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showAudioList ? "إخفاء التفاصيل" : "عرض التفاصيل"}
          </button>

          {showAudioList && surahs.length > 0 && (
            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-lg bg-muted/50 p-2">
              {surahs.map((s) => {
                const isDownloaded = downloadedAudio.includes(s.number);
                const isLoading = singleAudioDownloading === s.number;
                return (
                  <div
                    key={s.number}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  >
                    <div>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : isDownloaded ? (
                        <button
                          onClick={() => handleDeleteSingleAudio(s.number)}
                          className="text-destructive/60 transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDownloadSingleAudio(s.number)}
                          className="text-primary/60 transition-colors hover:text-primary"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isDownloaded && <Check className="h-3 w-3 text-primary" />}
                      <span className="font-arabic">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.number}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Daily Quran Goal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{goal} آية</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">الهدف اليومي</span>
              <Target className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            {[10, 20, 50].map((v) => (
              <button
                key={v}
                onClick={() => setGoal(v)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  goal === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Slider
            value={[goal]}
            onValueChange={([v]) => setGoal(v)}
            min={5}
            max={100}
            step={5}
          />
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl bg-card p-4 text-center shadow-sm"
        >
          <p className="font-arabic text-lg font-bold text-primary">Wise QURAN</p>
          <p className="text-xs text-muted-foreground">v1.0.0 · Made with ❤️</p>
        </motion.div>
      </div>
    </div>
  );
}
