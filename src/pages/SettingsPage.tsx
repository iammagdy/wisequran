import { useState, useEffect, useRef, useCallback } from "react";
import { toArabicNumerals } from "@/lib/utils";
import { motion } from "framer-motion";
import { Moon, Sun, Trash2, Download, Check, ChevronDown, ChevronUp, Volume2, Loader2, Target, Type, Palette, Info, Bell, BellOff, Mic, BookOpen, Smartphone, Share, CheckCircle, RotateCcw, Star, Clock, Pause, MoreVertical, Menu, HardDrive, FileText, Music, BookMarked, Mail, Github, Globe, Sparkles, RefreshCw } from "lucide-react";
import { detectBrowser, getInstallInstructions } from "@/lib/browser-detect";
import { CALCULATION_METHODS, type CalculationMethod } from "@/lib/prayer-times";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTheme } from "@/hooks/useTheme";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { clearAllData, getAllDownloadedSurahs, getAllDownloadedAudio, clearAllAudio, deleteAudio, getAudio, getStorageStats, clearAllTafsir } from "@/lib/db";
import { downloadAllSurahs, fetchSurahList, type SurahMeta } from "@/lib/quran-api";
import { downloadSurahAudio, formatBytes } from "@/lib/quran-audio";
import { RECITERS, DEFAULT_RECITER, getReciterAyahAudioUrl, getReciterAudioUrl } from "@/lib/reciters";
import { TAFSIR_EDITIONS, DEFAULT_TAFSIR } from "@/data/tafsir-editions";
import { toast } from "sonner";
import { isRamadanNow, isRamadanTabVisible, hideRamadanTab, showRamadanTab } from "@/hooks/useRamadan";
import { APP_VERSION, changelog } from "@/data/changelog";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  const { theme, toggleTheme, uiScale, setUIScale } = useTheme();
  const [showChangelog, setShowChangelog] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const { checkForUpdate } = useServiceWorkerUpdate();
  const [fontSize, setFontSize] = useLocalStorage<number>("wise-font-size", 24);
  const [reciterId, setReciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);
  const [tafsirId, setTafsirId] = useLocalStorage<string>("wise-tafsir", DEFAULT_TAFSIR);
  const [calcMethod, setCalcMethod] = useLocalStorage<CalculationMethod>("wise-prayer-method", "egyptian");
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage<boolean>("wise-prayer-notifications", false);
  const [azkarNotificationsEnabled, setAzkarNotificationsEnabled] = useLocalStorage<boolean>("wise-azkar-notifications", false);
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

  // Storage stats
  const [storageStats, setStorageStats] = useState<{ quranText: number; audio: number; tafsir: number; total: number; audioCount: number; surahCount: number; tafsirCount: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const refreshStorageStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch { /* ignore */ }
    setLoadingStats(false);
  }, []);

  // Preview reciter audio
  const [previewingReciter, setPreviewingReciter] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = "";
      previewAudioRef.current = null;
    }
    setPreviewingReciter(null);
    setPreviewLoading(null);
  }, []);

  const togglePreview = useCallback(async (r: typeof RECITERS[0]) => {
    // If already previewing this reciter, stop
    if (previewingReciter === r.id) {
      stopPreview();
      return;
    }
    // Stop any current preview
    stopPreview();

    setPreviewLoading(r.id);

    // Create Audio IMMEDIATELY to preserve user gesture context
    const audio = new Audio();
    previewAudioRef.current = audio;
    // Silent unlock for iOS/Safari
    audio.play().catch(() => {});

    // Now fetch the URL asynchronously
    const url = await getReciterAudioUrl(r.id, 1);

    // Timeout: abort if audio doesn't start within 10s
    const timeoutId = setTimeout(() => {
      if (previewAudioRef.current === audio) {
        audio.pause();
        audio.src = "";
        previewAudioRef.current = null;
        setPreviewLoading(null);
        setPreviewingReciter(null);
        toast.error("انتهت مهلة تحميل المعاينة");
      }
    }, 10000);

    audio.addEventListener("canplay", () => {
      clearTimeout(timeoutId);
      setPreviewLoading(null);
      setPreviewingReciter(r.id);
      audio.play().catch(() => {
        setPreviewingReciter(null);
      });
    }, { once: true });

    audio.addEventListener("ended", () => {
      setPreviewingReciter(null);
    }, { once: true });

    audio.addEventListener("error", () => {
      clearTimeout(timeoutId);
      setPreviewLoading(null);
      setPreviewingReciter(null);
      toast.error("تعذر تشغيل المعاينة");
    }, { once: true });

    // Set src after listeners are attached
    audio.src = url;
    audio.preload = "auto";

    audio.load();
  }, [previewingReciter, stopPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const browserType = detectBrowser();
  const installInstructions = getInstallInstructions(browserType);
  const isIOS = browserType === "ios-safari";
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
    refreshStorageStats();
  }, [reciterId, refreshStorageStats]);

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
    refreshStorageStats();
    if (updated.length === 114) {
      toast.success("تم تحميل القرآن الكريم بالكامل");
    }
  };

  const handleClear = async () => {
    await clearAllData();
    setDownloadedSurahs([]);
    setDownloadedAudio([]);
    refreshStorageStats();
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
    refreshStorageStats();
    toast.success("تم تحميل جميع التلاوات");
  };

  const handleClearAllAudio = async () => {
    await clearAllAudio();
    setDownloadedAudio([]);
    refreshStorageStats();
    toast.success("تم مسح جميع التلاوات");
  };

  const handleDownloadSingleAudio = async (num: number) => {
    setSingleAudioDownloading(num);
    try {
      const size = await downloadSurahAudio(reciterId, num);
      const updated = await getAllDownloadedAudio(reciterId);
      setDownloadedAudio(updated);
      refreshStorageStats();
      toast.success(`تم تحميل التلاوة (${formatBytes(size)})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحميل التلاوة");
    }
    setSingleAudioDownloading(null);
  };

  const handleDeleteSingleAudio = async (num: number) => {
    await deleteAudio(reciterId, num);
    const updated = await getAllDownloadedAudio(reciterId);
    setDownloadedAudio(updated);
    refreshStorageStats();
  };

  const handleClearTafsir = async () => {
    await clearAllTafsir();
    refreshStorageStats();
    toast.success("تم مسح جميع التفاسير المحملة");
  };

  return (
    <div className="px-4 pt-6 pb-24" dir="rtl">
      <h1 className="mb-1 text-2xl font-bold heading-decorated">الإعدادات</h1>
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
            className="rounded-2xl bg-card p-5 shadow-elevated border border-border/50 space-y-4"
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

            {/* UI Scale */}
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Smartphone className="h-4.5 w-4.5 text-primary" />
                <span className="text-sm font-medium">حجم الواجهة</span>
              </div>
              <div className="flex gap-2">
                {([
                  { value: "normal" as const, label: "عادي" },
                  { value: "large" as const, label: "كبير" },
                  { value: "xlarge" as const, label: "كبير جداً" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setUIScale(opt.value)}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                      uiScale === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Font size */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Type className="h-4.5 w-4.5 text-primary" />
                  <span className="text-sm font-medium">حجم خط القرآن</span>
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

        {/* ─── Reciter Selection (Collapsible) ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5" />
            صوت القارئ
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="rounded-xl bg-card shadow-sm overflow-hidden"
          >
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                <span className="font-arabic">{RECITERS.find(r => r.id === reciterId)?.name ?? "مشاري العفاسي"}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/50 px-2 py-2 max-h-64 overflow-y-auto space-y-0.5">
                  {RECITERS.map((r) => (
                    <div
                      key={r.id}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        reciterId === r.id
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <button
                        onClick={() => setReciterId(r.id)}
                        className="flex flex-1 items-center gap-3 min-w-0"
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          reciterId === r.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                        }`}>
                          {reciterId === r.id && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <span className="font-arabic truncate">{r.name}</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePreview(r); }}
                        className="shrink-0 p-1.5 rounded-full hover:bg-muted-foreground/10 transition-colors"
                        title="معاينة الصوت"
                      >
                        {previewLoading === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : previewingReciter === r.id ? (
                          <Pause className="h-4 w-4 text-primary" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        </section>

        {/* ─── Tafsir Selection (Collapsible) ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            التفسير
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.025 }}
            className="rounded-xl bg-card shadow-sm overflow-hidden"
          >
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                <span className="font-arabic">{TAFSIR_EDITIONS.find(t => t.id === tafsirId)?.name ?? "تفسير الميسر"}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/50 px-2 py-2 space-y-0.5">
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
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        tafsirId === t.id ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}>
                        {tafsirId === t.id && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <span className="font-arabic">{t.name}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
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

            <Separator className="my-4" />

            {/* Azkar Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {azkarNotificationsEnabled ? (
                  <Bell className="h-4.5 w-4.5 text-primary" />
                ) : (
                  <BellOff className="h-4.5 w-4.5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">تذكير بأذكار الصباح والمساء</span>
              </div>
              <Switch
                checked={azkarNotificationsEnabled}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    if (!("Notification" in window)) {
                      toast.error("المتصفح لا يدعم الإشعارات");
                      return;
                    }
                    const perm = await Notification.requestPermission();
                    setNotificationPermission(perm);
                    if (perm === "granted") {
                      setAzkarNotificationsEnabled(true);
                      toast.success("تم تفعيل تذكير الأذكار");
                    } else {
                      toast.error("تم رفض إذن الإشعارات، يرجى تفعيلها من إعدادات المتصفح");
                    }
                  } else {
                    setAzkarNotificationsEnabled(false);
                    toast.success("تم إيقاف تذكير الأذكار");
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              تذكير عند الفجر والمغرب لقراءة الأذكار
            </p>
          </motion.div>
        </section>

        {/* ─── Prayer Calculation Method (Collapsible) ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            طريقة حساب المواقيت
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.035 }}
            className="rounded-xl bg-card shadow-sm overflow-hidden"
          >
            <Collapsible>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                <span className="font-arabic">{CALCULATION_METHODS[calcMethod]?.name ?? "الهيئة المصرية"}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/50 px-2 py-2 space-y-0.5">
                  {(Object.entries(CALCULATION_METHODS) as [CalculationMethod, typeof CALCULATION_METHODS[CalculationMethod]][]).map(([key, method]) => (
                    <button
                      key={key}
                      onClick={() => setCalcMethod(key)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        calcMethod === key
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        calcMethod === key ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}>
                        {calcMethod === key && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      <span className="font-arabic">{method.name}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
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
                <span className="rounded-full bg-muted px-2 py-0.5 text-[0.625rem] text-muted-foreground">
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
                <span className="rounded-full bg-muted px-2 py-0.5 text-[0.625rem] text-muted-foreground">
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

        {/* ─── Install PWA ─── */}
        {!isInstalled && (
          <section>
            <div className="section-title flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              تثبيت التطبيق
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-card p-5 shadow-sm"
            >
              {isIOS ? (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-foreground">لتثبيت التطبيق على جهازك:</p>
                  <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">١.</span>
                      <span>اضغط على زر المشاركة</span>
                      <Share className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">٢.</span>
                      <span>اختر "إضافة إلى الشاشة الرئيسية"</span>
                    </div>
                  </div>
                </div>
              ) : deferredPrompt ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">ثبّت التطبيق على جهازك للوصول السريع والعمل بدون إنترنت</p>
                  <button
                    onClick={handleInstall}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Download className="h-4 w-4" />
                    تثبيت التطبيق
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-foreground">لتثبيت التطبيق على جهازك:</p>
                  <div className="flex flex-col items-center gap-2 rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">١.</span>
                      <span>{installInstructions.step1}</span>
                      {browserType === "chromium" && <MoreVertical className="h-4 w-4" />}
                      {browserType === "firefox" && <Menu className="h-4 w-4" />}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">٢.</span>
                      <span>{installInstructions.step2}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </section>
        )}

        {isInstalled && (
          <section>
            <div className="section-title flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              تثبيت التطبيق
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <CheckCircle className="h-4 w-4" />
                <span>التطبيق مثبّت بالفعل</span>
              </div>
            </motion.div>
          </section>
        )}

        {/* ─── Storage Management ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5" />
            إدارة التخزين
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="rounded-xl bg-card p-4 shadow-sm space-y-4"
          >
            {loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : storageStats ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">إجمالي التخزين</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {formatBytes(storageStats.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-l from-primary to-primary/70 transition-all" style={{ width: `${Math.min((storageStats.total / (500 * 1024 * 1024)) * 100, 100)}%` }} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">نصوص القرآن</p>
                        <p className="text-[0.625rem] text-muted-foreground">{toArabicNumerals(storageStats.surahCount)} سورة</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatBytes(storageStats.quranText)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                        <Music className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">التلاوات الصوتية</p>
                        <p className="text-[0.625rem] text-muted-foreground">{toArabicNumerals(storageStats.audioCount)} ملف صوتي</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatBytes(storageStats.audio)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <BookMarked className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">التفاسير</p>
                        <p className="text-[10px] text-muted-foreground">{toArabicNumerals(storageStats.tafsirCount)} سورة</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatBytes(storageStats.tafsir)}</span>
                      {storageStats.tafsirCount > 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="text-destructive/50 hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>مسح جميع التفاسير؟</AlertDialogTitle>
                              <AlertDialogDescription>سيتم حذف جميع التفاسير المحملة. يمكنك إعادة تحميلها لاحقاً.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogAction onClick={handleClearTafsir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">نعم، مسح الكل</AlertDialogAction>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>

                {storageStats.total === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-2">لا توجد بيانات محملة حالياً</p>
                )}
              </>
            ) : null}
          </motion.div>
        </section>

        {/* ─── Reset Progress ─── */}
        <section>
          <div className="section-title flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة تعيين التقدم
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="rounded-xl bg-card p-4 shadow-sm"
          >
            <p className="mb-3 text-xs text-muted-foreground">
              سيتم مسح سجل القراءة والعلامات المرجعية والمفضلة والأهداف اليومية. لن يتم حذف البيانات المحملة.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/10 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20">
                  <RotateCcw className="h-4 w-4" />
                  إعادة تعيين التقدم
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>إعادة تعيين جميع التقدم؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم مسح: آخر قراءة، العلامات المرجعية، السور المفضلة، الهدف اليومي، سجل القراءة، وسلسلة الأيام. هل أنت متأكد؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                  <AlertDialogAction
                    onClick={() => {
                      localStorage.removeItem("wise-last-read");
                      localStorage.removeItem("wise-bookmarks");
                      localStorage.removeItem("wise-favorite-surahs");
                      localStorage.removeItem("wise-daily-reading");
                      localStorage.removeItem("wise-streak");
                      localStorage.removeItem("wise-reading-history");
                      toast.success("تم إعادة تعيين التقدم بنجاح");
                      setTimeout(() => window.location.reload(), 500);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    نعم، إعادة تعيين
                  </AlertDialogAction>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </section>

        {/* ─── Ramadan Tab Visibility ─── */}
        {isRamadanNow() && (
          <section>
            <div className="section-title flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              رمضان
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.17 }}
              className="rounded-xl bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌙</span>
                  <span className="text-sm font-medium">إظهار تبويب رمضان</span>
                </div>
                <Switch
                  checked={isRamadanTabVisible()}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      showRamadanTab();
                    } else {
                      hideRamadanTab();
                    }
                    toast.success(checked ? "تم إظهار تبويب رمضان" : "تم إخفاء تبويب رمضان");
                    setTimeout(() => window.location.reload(), 500);
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                يظهر التبويب تلقائياً خلال شهر رمضان فقط
              </p>
            </motion.div>
          </section>
        )}

        <section>
          <div className="section-title flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            حول التطبيق
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl gradient-hero p-6 text-center shadow-elevated border border-primary/10"
          >
            <p className="font-arabic text-2xl font-bold text-gradient mb-1">Wise QURAN</p>
            <button
              onClick={() => setShowChangelog(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer mb-3"
            >
              <Sparkles className="h-3 w-3" />
              v{APP_VERSION}
            </button>

            <Separator className="my-3" />
            <p className="text-sm text-muted-foreground mb-4">تطبيق للقراءة والأذكار والصلاة</p>

            {/* Check for Updates */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 mb-3"
              disabled={checkingUpdate}
              onClick={async () => {
                setCheckingUpdate(true);
                const hasUpdate = await checkForUpdate();
                setCheckingUpdate(false);
                if (!hasUpdate) {
                  toast.success("التطبيق محدّث بالفعل ✓");
                }
              }}
            >
              {checkingUpdate ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              التحقق من التحديثات
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                const shareData = {
                  title: 'Wise QURAN',
                  text: 'تطبيق القرآن الكريم والأذكار — حمّله الآن!',
                  url: 'https://wisequran.lovable.app',
                };
                if (navigator.share) {
                  try { await navigator.share(shareData); } catch {}
                } else {
                  await navigator.clipboard.writeText(shareData.url);
                  toast.success("تم نسخ الرابط");
                }
              }}
            >
              <Share className="h-4 w-4" />
              شارك التطبيق مع أصدقائك
            </Button>
          </motion.div>
        </section>

        {/* Changelog Sheet */}
        <Sheet open={showChangelog} onOpenChange={setShowChangelog}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-0">
            <SheetHeader className="px-6 pb-4">
              <SheetTitle className="text-center font-arabic text-lg">سجل التحديثات</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full px-6 pb-8">
              <div className="space-y-6">
                {changelog.map((entry) => (
                  <div key={entry.version} className="space-y-2">
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
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Developer Card */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
            className="relative p-[2px] rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--gold)), hsl(var(--primary)), hsl(var(--accent)), hsl(var(--gold)), hsl(var(--primary)))',
              backgroundSize: '400% 400%',
              animation: 'gradient-border 3s ease infinite',
            }}
          >
            <div className="bg-card rounded-[14px] p-6 text-center relative overflow-hidden">
              {/* Shimmer overlay */}
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                  background: 'linear-gradient(110deg, transparent 30%, hsl(var(--gold) / 0.6) 50%, transparent 70%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite',
                }}
              />

              {/* Floating Ramadan emojis */}
              {[
                { emoji: '🏮', top: '6px', right: '12px', size: 'text-xl', delay: 0 },
                { emoji: '🌙', top: '8px', left: '14px', size: 'text-2xl', delay: 0.5 },
                { emoji: '⭐', bottom: '8px', right: '16px', size: 'text-sm', delay: 1.2 },
                { emoji: '✨', bottom: '12px', left: '18px', size: 'text-base', delay: 0.8 },
                { emoji: '🕌', top: '50%', right: '8px', size: 'text-sm', delay: 1.5 },
                { emoji: '🏮', bottom: '6px', left: '50%', size: 'text-lg', delay: 0.3 },
              ].map((item, i) => (
                <motion.span
                  key={i}
                  className={`absolute ${item.size} pointer-events-none select-none`}
                  style={{
                    top: item.top,
                    bottom: item.bottom,
                    left: item.left,
                    right: item.right,
                    opacity: 0.35,
                  }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: item.delay,
                  }}
                >
                  {item.emoji}
                </motion.span>
              ))}

              {/* Developer badge */}
              <motion.span
                className="inline-block mb-2 px-3 py-0.5 text-[10px] font-bold rounded-full"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--gold)), hsl(42 90% 60%))',
                  color: 'hsl(var(--gold-foreground))',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.4 }}
              >
                المطوّر ✦
              </motion.span>

              <p
                className="text-xl font-bold text-foreground mb-1"
                style={{ textShadow: '0 0 12px hsl(var(--gold) / 0.3)' }}
              >
                Magdy Saber
              </p>

              <p className="text-xs text-muted-foreground mb-4">
                صنع بـ ❤️ في رمضان 🌙
              </p>

              <div className="flex items-center justify-center gap-3">
                {[
                  { href: 'mailto:contact@magdysaber.com', icon: <Mail size={18} />, title: 'Email' },
                  { href: 'https://github.com/iammagdy', icon: <Github size={18} />, title: 'GitHub' },
                  { href: 'https://magdysaber.com', icon: <Globe size={18} />, title: 'Website' },
                ].map((link, i) => (
                  <motion.a
                    key={i}
                    href={link.href}
                    target={link.href.startsWith('mailto') ? undefined : '_blank'}
                    rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                    title={link.title}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-gold-foreground transition-colors"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--gold) / 0.2), hsl(var(--primary) / 0.15))',
                      color: 'hsl(var(--primary))',
                    }}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  >
                    {link.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
