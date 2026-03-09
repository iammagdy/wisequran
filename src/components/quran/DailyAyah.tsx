import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Share2, Volume2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { getDailyAyahReference, getDailyAyahCacheKey, type DailyAyahRef } from "@/lib/daily-ayah";
import { fetchSurahAyahs, type Ayah } from "@/lib/quran-api";
import { SURAH_META } from "@/data/surah-meta";
import { toArabicNumerals } from "@/lib/utils";

interface CachedAyah {
  surah: number;
  ayah: number;
  text: string;
  surahName: string;
}

export function DailyAyah() {
  const [data, setData] = useState<CachedAyah | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const cacheKey = getDailyAyahCacheKey();
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const ref: DailyAyahRef = getDailyAyahReference();
      try {
        const ayahs: Ayah[] = await fetchSurahAyahs(ref.surah);
        const ayah = ayahs.find((a) => a.numberInSurah === ref.ayah);
        const surahMeta = SURAH_META.find((s) => s.number === ref.surah);
        
        if (ayah && surahMeta) {
          const entry: CachedAyah = {
            surah: ref.surah,
            ayah: ref.ayah,
            text: ayah.text,
            surahName: surahMeta.name,
          };
          localStorage.setItem(cacheKey, JSON.stringify(entry));
          setData(entry);
        }
      } catch (err) {
        console.error("Failed to load daily ayah:", err);
      }
      setLoading(false);
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="mb-5 rounded-2xl gradient-hero p-5 shadow-elevated ornamental-corner">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-20 w-full mb-3 rounded-xl" />
        <Skeleton className="h-3 w-28 mr-auto" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => navigate(`/surah/${data.surah}?ayah=${data.ayah}`)}
      className="mb-5 w-full rounded-2xl gradient-hero p-5 text-right shadow-elevated border border-primary/10 ornamental-corner relative overflow-hidden group"
      dir="rtl"
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="islamic-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="currentColor" />
            <circle cx="0" cy="0" r="1" fill="currentColor" />
            <circle cx="40" cy="0" r="1" fill="currentColor" />
            <circle cx="0" cy="40" r="1" fill="currentColor" />
            <circle cx="40" cy="40" r="1" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary icon-glow" />
          </div>
          <span className="text-xs font-semibold text-primary">آية اليوم</span>
        </div>
        
        <p className="font-arabic text-lg leading-loose mb-4 text-foreground/90 line-clamp-3">
          {data.text}
        </p>
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium">
            {data.surahName} · آية {toArabicNumerals(data.ayah)}
          </p>
          <div className="flex items-center gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                const shareText = `${data.text}\n\n— ${data.surahName}، آية ${data.ayah}`;
                if (navigator.share) {
                  navigator.share({ text: shareText }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(shareText);
                  toast({ title: "تم النسخ" });
                }
              }}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5 text-primary/60" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                const audio = new Audio(
                  `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getGlobalAyahNumber(data.surah, data.ayah)}.mp3`
                );
                audio.play().catch(() => {
                  toast({ title: "تعذر تشغيل الصوت" });
                });
              }}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Volume2 className="h-3.5 w-3.5 text-primary/60" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
