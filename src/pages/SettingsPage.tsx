import { useState, useEffect } from "react";
import { toArabicNumerals } from "@/lib/utils";
import { motion } from "framer-motion";
import { Moon, Sun, Trash2, Download, Check, ChevronDown, ChevronUp, Volume2, Loader2, Target, Type, Palette, Info, Bell, BellOff, Mic, BookOpen, Smartphone, Share, CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTheme } from "@/hooks/useTheme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { clearAllData, getAllDownloadedSurahs, getAllDownloadedAudio, clearAllAudio, deleteAudio } from "@/lib/db";
import { downloadAllSurahs, fetchSurahList, type SurahMeta } from "@/lib/quran-api";
import { downloadSurahAudio } from "@/lib/quran-audio";
import { RECITERS, DEFAULT_RECITER } from "@/lib/reciters";
import { TAFSIR_EDITIONS, DEFAULT_TAFSIR } from "@/data/tafsir-editions";
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
  const [reciterId, setReciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);
  const [tafsirId, setTafsirId] = useLocalStorage<string>("wise-tafsir", DEFAULT_TAFSIR);
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage<boolean>("wise-prayer-notifications", false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
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

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    getAllDownloadedSurahs().then(setDownloadedSurahs);
    getAllDownloadedAudio(reciterId).then(setDownloadedAudio);
    fetchSurahList().then(setSurahs);
  }, [reciterId]);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      await downloadAllSurahs((percent) => setDownloadProgress(percent));
    } catch {
      toast.error("فشل تحميل القرآن، تحقق من الاتصال بالإنترنت");
    }
    const updated = await getAllDownloadedSurahs();
    setDownloadedSurahs(updated);
    setDownloading(false);
    if (updated.length === 114) {
      toast.success("تم تحميل القرآن الكريم بالكامل");
    }
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
        try { await downloadSurahAudio(reciterId, i); } catch { /* continue */ }
      }
      setAudioDownloadProgress(Math.round((i / total) * 100));
    }
    const updated = await getAllDownloadedAudio(reciterId);
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
      await downloadSurahAudio(reciterId, num);
      const updated = await getAllDownloadedAudio(reciterId);
      setDownloadedAudio(updated);
      toast.success("تم تحميل التلاوة");
    } catch {
      toast.error("فشل تحميل التلاوة");
    }
    setSingleAudioDownloading(null);
  };

  const handleDeleteSingleAudio = async (num: number) => {
    await deleteAudio(reciterId, num);
    const updated = await getAllDownloadedAudio(reciterId);
    setDownloadedAudio(updated);
  };

  return (
    <div className="px-4 pt-6 pb-8" dir="rtl">
      <h1 className="mb-1 text-2xl font-bold">الإعدادات</h1>
      <p className="mb-6 text-sm text-muted-foreground">إعدادات التطبيق</p>

      <div className="space-y-6">
        {/* ─── Appearance & Reading ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            المظهر والقراءة
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-card p-4 shadow-sm space-y-0"
          >
            {/* Theme toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="h-4.5 w-4.5 text-primary" /> : <Sun className="h-4.5 w-4.5 text-primary" />}
                <span className="text-sm font-medium">الوضع الليلي</span>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            <Separator className="my-4" />

            {/* Font size */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Type className="h-4.5 w-4.5 text-primary" />
                  <span className="text-sm font-medium">حجم الخط</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{toArabicNumerals(fontSize)}px</span>
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
              >
                بِسْمِ اللَّهِ
              </p>
            </div>
          </motion.div>
        </section>

        {/* ─── Reciter Selection ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5" />
            صوت القارئ
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="rounded-xl bg-card p-4 shadow-sm"
          >
            <p className="mb-3 text-xs text-muted-foreground">اختر صوت القارئ المفضل لتلاوة القرآن</p>
            <div className="space-y-1.5">
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setReciterId(r.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    reciterId === r.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    reciterId === r.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {reciterId === r.id && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="font-arabic">{r.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ─── Tafsir Selection ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            التفسير
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.025 }}
            className="rounded-xl bg-card p-4 shadow-sm"
          >
            <p className="mb-3 text-xs text-muted-foreground">اختر التفسير المفضل لعرضه عند الضغط على الآية</p>
            <div className="space-y-1.5">
              {TAFSIR_EDITIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTafsirId(t.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    tafsirId === t.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    tafsirId === t.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {tafsirId === t.id && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="font-arabic">{t.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ─── Prayer Notifications ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            إشعارات الصلاة
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="rounded-xl bg-card p-4 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notificationsEnabled ? (
                  <Bell className="h-4.5 w-4.5 text-primary" />
                ) : (
                  <BellOff className="h-4.5 w-4.5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">تذكير بأوقات الصلاة</span>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    if (!("Notification" in window)) {
                      toast.error("المتصفح لا يدعم الإشعارات");
                      return;
                    }
                    const perm = await Notification.requestPermission();
                    setNotificationPermission(perm);
                    if (perm === "granted") {
                      setNotificationsEnabled(true);
                      toast.success("تم تفعيل إشعارات الصلاة");
                    } else {
                      toast.error("تم رفض إذن الإشعارات، يرجى تفعيلها من إعدادات المتصفح");
                    }
                  } else {
                    setNotificationsEnabled(false);
                    toast.success("تم إيقاف إشعارات الصلاة");
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {notificationPermission === "denied"
                ? "تم رفض إذن الإشعارات — يرجى تفعيلها من إعدادات المتصفح"
                : "ستصلك إشعارات عند دخول وقت كل صلاة"}
            </p>
          </motion.div>
        </section>

        <section>
          <div className="section-title flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            الهدف اليومي
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">عدد الآيات يومياً</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{toArabicNumerals(goal)} آية</span>
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
                  {toArabicNumerals(v)}
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
        </section>

        {/* ─── Downloads ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            التحميلات
          </div>
          <div className="space-y-3">
            {/* Quran Text Download */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-card p-4 shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">نصوص القرآن</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {toArabicNumerals(`${downloadedSurahs.length}/114`)}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">تحميل نصوص السور للقراءة بدون إنترنت</p>

              {downloading ? (
                <div className="space-y-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    جارٍ التحميل... {toArabicNumerals(`${downloadProgress}%`)}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleClear}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive/10 py-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    مسح الكل
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {downloadedSurahs.length === 114 ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        مكتمل
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        تحميل الكل
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Audio Download */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-card p-4 shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">التلاوات الصوتية</span>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {toArabicNumerals(`${downloadedAudio.length}/114`)}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">تحميل التلاوات للاستماع بدون إنترنت</p>

              {audioDownloading ? (
                <div className="space-y-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${audioDownloadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    جارٍ تحميل التلاوات... {toArabicNumerals(`${audioDownloadProgress}%`)}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive/10 py-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                        disabled={downloadedAudio.length === 0}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {downloadedAudio.length === 114 ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        مكتمل
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        تحميل الكل
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Collapsible surah list */}
              <Collapsible open={showAudioList} onOpenChange={setShowAudioList}>
                <CollapsibleTrigger asChild>
                  <button className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    {showAudioList ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {showAudioList ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {surahs.length > 0 && (
                    <div className="mt-3 max-h-64 space-y-0.5 overflow-y-auto rounded-lg bg-muted/30 p-1.5">
                      {surahs.map((s, idx) => {
                        const isDownloaded = downloadedAudio.includes(s.number);
                        const isLoading = singleAudioDownloading === s.number;
                        return (
                          <div
                            key={s.number}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${idx % 2 === 0 ? "bg-background/50" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-6 text-center">{toArabicNumerals(s.number)}</span>
                              <span className="font-arabic text-sm">{s.name}</span>
                              {isDownloaded && <Check className="h-3 w-3 text-primary" />}
                            </div>
                            <div>
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              ) : isDownloaded ? (
                                <button
                                  onClick={() => handleDeleteSingleAudio(s.number)}
                                  className="text-destructive/50 transition-colors hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDownloadSingleAudio(s.number)}
                                  className="text-primary/50 transition-colors hover:text-primary"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          </div>
        </section>

        {/* ─── About ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            حول التطبيق
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-card p-5 text-center shadow-sm"
          >
            <p className="font-arabic text-xl font-bold text-primary mb-1">Wise QURAN</p>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground">تطبيق للقراءة والأذكار والصلاة</p>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
