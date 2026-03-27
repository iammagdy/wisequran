import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Download, HardDrive, Loader2, Trash2, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatBytes, downloadSurahAudio } from "@/lib/quran-audio";
import { downloadAllSurahs } from "@/lib/quran-api";
import { clearAllAudio, deleteSurah, getAllDownloadedAudio, getAllDownloadedSurahs, getStorageStats } from "@/lib/db";
import { RECITERS, DEFAULT_RECITER } from "@/lib/reciters";
import { cn, toArabicNumerals } from "@/lib/utils";

export default function OfflineCenterPage() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const [reciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);
  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>([]);
  const [downloadedAudio, setDownloadedAudio] = useState<number[]>([]);
  const [downloadingText, setDownloadingText] = useState(false);
  const [downloadingAudio, setDownloadingAudio] = useState(false);
  const [textProgress, setTextProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [storageTotal, setStorageTotal] = useState(0);

  const reciterName = useMemo(() => {
    const reciter = RECITERS.find((item) => item.id === reciterId);
    return language === "ar" ? (reciter?.name ?? "") : (reciter?.nameEn ?? reciter?.name ?? "");
  }, [language, reciterId]);

  const refresh = useCallback(async () => {
    const [surahs, audio, stats] = await Promise.all([
      getAllDownloadedSurahs(),
      getAllDownloadedAudio(reciterId),
      getStorageStats(),
    ]);
    setDownloadedSurahs(surahs);
    setDownloadedAudio(audio);
    setStorageTotal(stats.total);
  }, [reciterId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleDownloadText = useCallback(async () => {
    setDownloadingText(true);
    try {
      await downloadAllSurahs((percent) => setTextProgress(percent));
      await refresh();
    } finally {
      setDownloadingText(false);
    }
  }, [refresh]);

  const handleClearText = useCallback(async () => {
    const current = await getAllDownloadedSurahs();
    await Promise.all(current.map((surahNumber) => deleteSurah(surahNumber)));
    await refresh();
  }, [refresh]);

  const handleDownloadAudio = useCallback(async () => {
    setDownloadingAudio(true);
    try {
      for (let surahNumber = 1; surahNumber <= 114; surahNumber++) {
        await downloadSurahAudio(reciterId, surahNumber);
        setAudioProgress(Math.round((surahNumber / 114) * 100));
      }
      await refresh();
    } finally {
      setDownloadingAudio(false);
    }
  }, [reciterId, refresh]);

  const handleClearAudio = useCallback(async () => {
    await clearAllAudio();
    await refresh();
  }, [refresh]);

  return (
    <div className="px-4 pt-6 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="rounded-xl glass-card p-2.5 shadow-soft" data-testid="offline-center-back-button">
          {isRTL ? <ArrowRight className="h-5 w-5 text-foreground" /> : <ArrowLeft className="h-5 w-5 text-foreground" />}
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold heading-decorated" data-testid="offline-center-title">{language === "ar" ? "المكتبة بدون إنترنت" : "Offline Center"}</h1>
          <p className="text-xs text-muted-foreground" data-testid="offline-center-subtitle">
            {language === "ar" ? "نزّل النصوص والصوت للاستخدام بدون اتصال" : "Download text and audio for offline use."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl glass-card p-4 border border-border/40" data-testid="offline-center-text-count-card">
          <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "نص القرآن" : "Quran Text"}</p>
          <p className="text-xl font-bold text-foreground">{language === "ar" ? toArabicNumerals(downloadedSurahs.length) : downloadedSurahs.length} / 114</p>
        </div>
        <div className="rounded-2xl glass-card p-4 border border-border/40" data-testid="offline-center-audio-count-card">
          <p className="text-xs text-muted-foreground mb-1">{language === "ar" ? "الصوت" : "Audio"}</p>
          <p className="text-xl font-bold text-foreground">{language === "ar" ? toArabicNumerals(downloadedAudio.length) : downloadedAudio.length} / 114</p>
        </div>
      </div>

      <div className="rounded-2xl glass-card p-4 border border-border/40 mb-4" data-testid="offline-center-storage-card">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">{language === "ar" ? "التخزين الحالي" : "Current Storage"}</p>
        </div>
        <p className="text-sm text-muted-foreground">{formatBytes(storageTotal)}</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl glass-card p-4 border border-border/40" data-testid="offline-center-text-panel">
          <div className="flex items-center gap-2 mb-2">
            <Download className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">{language === "ar" ? "تحميل النصوص" : "Download Text"}</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {language === "ar" ? "احفظ السور للقراءة بدون إنترنت." : "Store surahs for offline reading."}
          </p>
          {downloadingText && (
            <p className="text-xs text-primary mb-3">{language === "ar" ? `جارٍ التحميل ${toArabicNumerals(textProgress)}%` : `Downloading ${textProgress}%`}</p>
          )}
          <div className="flex gap-2">
            <Button data-testid="offline-center-download-text-button" className="flex-1 gap-2" onClick={handleDownloadText} disabled={downloadingText}>
              {downloadingText ? <Loader2 className="h-4 w-4 animate-spin" /> : downloadedSurahs.length === 114 ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {downloadedSurahs.length === 114 ? (language === "ar" ? "مكتمل" : "Complete") : (language === "ar" ? "تحميل الكل" : "Download All")}
            </Button>
            <Button data-testid="offline-center-clear-text-button" variant="outline" className="gap-2" onClick={handleClearText} disabled={downloadedSurahs.length === 0 || downloadingText}>
              <Trash2 className="h-4 w-4" />
              {language === "ar" ? "مسح" : "Clear"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl glass-card p-4 border border-border/40" data-testid="offline-center-audio-panel">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">{language === "ar" ? "تحميل الصوت" : "Download Audio"}</p>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            {language === "ar" ? `القارئ الحالي: ${reciterName}` : `Current reciter: ${reciterName}`}
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {language === "ar" ? "احفظ التلاوات للاستماع بدون إنترنت." : "Store recitations for offline listening."}
          </p>
          {downloadingAudio && (
            <p className="text-xs text-primary mb-3">{language === "ar" ? `جارٍ التحميل ${toArabicNumerals(audioProgress)}%` : `Downloading ${audioProgress}%`}</p>
          )}
          <div className="flex gap-2">
            <Button data-testid="offline-center-download-audio-button" className="flex-1 gap-2" onClick={handleDownloadAudio} disabled={downloadingAudio}>
              {downloadingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : downloadedAudio.length === 114 ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {downloadedAudio.length === 114 ? (language === "ar" ? "مكتمل" : "Complete") : (language === "ar" ? "تحميل الكل" : "Download All")}
            </Button>
            <Button data-testid="offline-center-clear-audio-button" variant="outline" className="gap-2" onClick={handleClearAudio} disabled={downloadedAudio.length === 0 || downloadingAudio}>
              <Trash2 className="h-4 w-4" />
              {language === "ar" ? "مسح" : "Clear"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/40 bg-card p-4 text-xs text-muted-foreground" data-testid="offline-center-note">
        {language === "ar"
          ? "هذه الشاشة تركّز على النصوص والصوت فقط حتى يبقى التحميل بسيطًا وواضحًا بدون التأثير على باقي وظائف التطبيق."
          : "This screen focuses on text and audio only, keeping offline downloads simple without affecting the rest of the app."}
      </div>
    </div>
  );
}