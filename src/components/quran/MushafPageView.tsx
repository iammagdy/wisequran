import { useMemo } from "react";
import { Bookmark, BookmarkCheck, BookOpen } from "lucide-react";
import { type Ayah } from "@/lib/quran-api";
import { cn, toArabicNumerals } from "@/lib/utils";

interface MushafPageViewProps {
  ayahs: Ayah[];
  fontSize: number;
  surahNumber: number;
  highlightedAyah: number | null;
  isBookmarked: (ayahNum: number) => boolean;
  toggleBookmark: (ayahNum: number) => void;
  onAyahTafsir: (ayahNum: number) => void;
  setAyahRef: (el: HTMLDivElement | null, num: number) => void;
}

export default function MushafPageView({
  ayahs,
  fontSize,
  surahNumber,
  highlightedAyah,
  isBookmarked,
  toggleBookmark,
  onAyahTafsir,
  setAyahRef,
}: MushafPageViewProps) {
  // Group ayahs by page number
  const pages = useMemo(() => {
    const map = new Map<number, Ayah[]>();
    for (const ayah of ayahs) {
      const page = ayah.page || 0;
      if (!map.has(page)) map.set(page, []);
      map.get(page)!.push(ayah);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [ayahs]);

  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);

  return (
    <div className="space-y-6" dir="rtl">
      {pages.map(([pageNum, pageAyahs]) => (
        <div
          key={pageNum}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          {/* Page header */}
          {pageNum > 0 && (
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-bold text-primary">
                صفحة {toArabicNumerals(pageNum)}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {/* Continuous text */}
          <p
            className="font-arabic text-foreground text-justify"
            style={{ fontSize, lineHeight: 2.4 }}
          >
            {pageAyahs.map((ayah) => (
              <span
                key={ayah.numberInSurah}
                id={`ayah-${ayah.numberInSurah}`}
                data-ayah={ayah.numberInSurah}
                ref={(el) => setAyahRef(el as HTMLDivElement | null, ayah.numberInSurah)}
                className={cn(
                  "transition-colors",
                  highlightedAyah === ayah.numberInSurah && "bg-primary/10 rounded-sm"
                )}
              >
                {ayah.text}{" "}
                <button
                  onClick={() =>
                    setSelectedAyah(selectedAyah === ayah.numberInSurah ? null : ayah.numberInSurah)
                  }
                  className="inline-flex items-baseline text-primary/70 hover:text-primary transition-colors"
                  style={{ fontSize: fontSize * 0.65 }}
                >
                  ﴿{toArabicNumerals(ayah.numberInSurah)}﴾
                </button>{" "}
              </span>
            ))}
          </p>

          {/* Inline action popup for selected ayah */}
          {selectedAyah !== null &&
            pageAyahs.some((a) => a.numberInSurah === selectedAyah) && (
              <div className="mt-3 flex items-center justify-center gap-3 rounded-lg bg-muted/50 p-2">
                <span className="text-xs text-muted-foreground">
                  الآية {toArabicNumerals(selectedAyah)}
                </span>
                <button
                  onClick={() => toggleBookmark(selectedAyah)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-background"
                >
                  {isBookmarked(selectedAyah) ? (
                    <BookmarkCheck className="h-4 w-4 text-accent" />
                  ) : (
                    <Bookmark className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => {
                    onAyahTafsir(selectedAyah);
                    setSelectedAyah(null);
                  }}
                  className="rounded-lg p-1.5 transition-colors hover:bg-background text-muted-foreground"
                >
                  <BookOpen className="h-4 w-4" />
                </button>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

// Need useState import
import { useState } from "react";
