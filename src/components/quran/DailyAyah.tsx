import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-3 w-24 mr-auto" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/surah/${data.surah}?ayah=${data.ayah}`)}
      className="mb-4 w-full rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-right transition-all active:scale-[0.98]"
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-medium">آية اليوم</span>
      </div>
      <p className="font-arabic text-base leading-loose mb-2 line-clamp-3">
        {data.text}
      </p>
      <p className="text-xs text-muted-foreground">
        {data.surahName} · آية {toArabicNumerals(data.ayah)}
      </p>
    </motion.button>
  );
}
