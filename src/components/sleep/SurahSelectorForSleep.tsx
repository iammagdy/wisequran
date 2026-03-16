import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { SURAH_META } from "@/data/surah-meta";

const SLEEP_SURAHS = [2, 3, 18, 36, 55, 56, 67, 73, 76, 78, 112, 113, 114];

interface SurahSelectorForSleepProps {
  selected: number;
  language: string;
  onChange: (surahNumber: number) => void;
}

export function SurahSelectorForSleep({ selected, language, onChange }: SurahSelectorForSleepProps) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  const suggestedSurahs = SURAH_META.filter((s) => SLEEP_SURAHS.includes(s.number));
  const allFiltered = SURAH_META.filter(
    (s) =>
      s.name.includes(query) ||
      s.englishName.toLowerCase().includes(query.toLowerCase()) ||
      String(s.number).includes(query)
  );

  const displayList = showAll ? allFiltered : suggestedSurahs;
  const selectedSurah = SURAH_META.find((s) => s.number === selected);

  return (
    <div className="space-y-2">
      {showAll && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === "ar" ? "ابحث عن سورة..." : "Search surah..."}
            className="w-full bg-white/8 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-amber-400/40"
            dir={language === "ar" ? "rtl" : "ltr"}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
        {displayList.map((surah) => (
          <button
            key={surah.number}
            onClick={() => onChange(surah.number)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
              selected === surah.number
                ? "bg-amber-400/20 border-amber-400/50 text-amber-100"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
            }`}
          >
            <span className="text-xs opacity-60">{surah.number}.</span>
            <span>{language === "ar" ? surah.name : surah.englishName}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => { setShowAll(!showAll); setQuery(""); }}
        className="flex items-center gap-1 text-xs text-amber-300/70 hover:text-amber-300 transition-colors"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${showAll ? "rotate-180" : ""}`} />
        {showAll
          ? (language === "ar" ? "إظهار المقترحة فقط" : "Show suggested only")
          : (language === "ar" ? `عرض كل السور (${SURAH_META.length})` : `All ${SURAH_META.length} surahs`)}
      </button>

      {selectedSurah && (
        <p className="text-xs text-white/40">
          {language === "ar" ? "مختارة:" : "Selected:"} {selectedSurah.name} ({selectedSurah.englishName})
        </p>
      )}
    </div>
  );
}
