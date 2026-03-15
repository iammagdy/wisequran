import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { azkarData, azkarSections, type AzkarCategory, type Dhikr } from "@/data/azkar-data";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreak } from "@/hooks/useStreak";
import { useAzkarCompletion } from "@/hooks/useAzkarCompletion";
import { ArrowLeft, ArrowRight, RotateCcw, Heart, Star, CircleCheck as CheckCircle2, ChevronDown, Search, X } from "lucide-react";
import { cn, toArabicNumerals } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

function DhikrCounter({
  dhikr,
  fontSize,
  onComplete,
  isFavorite,
  onToggleFavorite,
}: {
  dhikr: Dhikr;
  fontSize: number;
  onComplete: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { language } = useLanguage();
  const [remaining, setRemaining] = useState(dhikr.count);
  const done = remaining === 0;
  const progress = ((dhikr.count - remaining) / dhikr.count) * 100;

  const handleTap = () => {
    if (remaining > 0) {
      if (navigator.vibrate) navigator.vibrate(10);
      const next = remaining - 1;
      setRemaining(next);
      if (next === 0) onComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl p-5 shadow-elevated transition-all border",
        done ? "bg-primary/10 border-primary/20" : "bg-card border-border/50"
      )}
    >
      <div className="flex items-center justify-between mb-3 h-7">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleFavorite}
          aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          className="rounded-xl p-2 transition-colors hover:bg-muted"
        >
          <Heart className={cn("h-5 w-5 transition-all", isFavorite ? "fill-primary text-primary" : "text-muted-foreground")} />
        </motion.button>
        <div className="flex-1 mx-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: done ? "100%" : `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        {done && (
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </div>
      <p
        className="font-arabic leading-loose text-right text-foreground mb-3"
        style={{ fontSize: fontSize * 0.85 }}
        dir="rtl"
      >
        {dhikr.text}
      </p>
      {language === "en" && (
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{dhikr.translation}</p>
      )}
      {dhikr.source && (
        <p className="text-xs text-muted-foreground/60 mb-3 text-right" dir="rtl">{dhikr.source}</p>
      )}
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setRemaining(dhikr.count)}
          aria-label="إعادة تعيين العداد"
          className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleTap}
          aria-label={done ? "تم" : `المتبقي: ${remaining}`}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold transition-all",
            done
              ? "counter-button text-primary-foreground"
              : "bg-accent/90 text-accent-foreground shadow-elevated hover:shadow-elevated-lg"
          )}
        >
          {done ? "✓" : (language === "ar" ? toArabicNumerals(remaining) : remaining)}
        </motion.button>
      </div>
    </motion.div>
  );
}

function CategoryCard({
  cat,
  isCategoryDone,
  isRTL,
  language,
  onClick,
}: {
  cat: AzkarCategory;
  isCategoryDone: (id: string) => boolean;
  isRTL: boolean;
  language: string;
  onClick: () => void;
}) {
  const done = isCategoryDone(cat.id);
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-2xl p-4 shadow-elevated border-2 transition-all hover:shadow-elevated-lg group w-full",
        isRTL ? "items-start text-right" : "items-start text-left",
        done ? "bg-primary/8 border-primary/25" : "bg-card border-border/50"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {done && (
        <div className={cn("absolute top-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center", isRTL ? "left-2.5" : "right-2.5")}>
          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      <p className="font-bold text-sm leading-snug text-foreground mb-1.5">
        {language === "ar" ? cat.nameAr : cat.name}
      </p>
      <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">
        {language === "en"
          ? `${cat.items.length} adhkar`
          : `${toArabicNumerals(cat.items.length)} أذكار`}
      </span>
    </motion.button>
  );
}

export default function AzkarPage() {
  const { t, language, isRTL } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<AzkarCategory | null>(null);
  const [fontSize] = useLocalStorage<number>("wise-font-size", 24);
  const [favoriteAzkar, setFavoriteAzkar] = useLocalStorage<string[]>("wise-favorite-azkar", []);
  const [showFavorites, setShowFavorites] = useState(false);
  const [expandedSections, setExpandedSections] = useLocalStorage<string[]>("wise-azkar-expanded-sections", ["daily"]);
  const [searchQuery, setSearchQuery] = useState("");
  const { markActive } = useStreak();
  const { isCategoryDone } = useAzkarCompletion();

  const expandedSet = useMemo(() => new Set(expandedSections), [expandedSections]);

  const toggleFavorite = (id: string) => {
    setFavoriteAzkar(
      favoriteAzkar.includes(id)
        ? favoriteAzkar.filter((f) => f !== id)
        : [...favoriteAzkar, id]
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(
      expandedSet.has(sectionId)
        ? expandedSections.filter((s) => s !== sectionId)
        : [...expandedSections, sectionId]
    );
  };

  const favoriteDhikrItems = azkarData
    .flatMap((cat) => cat.items)
    .filter((d) => favoriteAzkar.includes(d.id));

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return azkarSections
      .map((section) => {
        const matchingCats = azkarData.filter(
          (cat) =>
            cat.sectionId === section.id &&
            (cat.nameAr.includes(searchQuery) ||
              cat.name.toLowerCase().includes(q))
        );
        return { section, matchingCats };
      })
      .filter((s) => s.matchingCats.length > 0);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="px-4 pb-5 pt-5" dir={isRTL ? "rtl" : "ltr"}>
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="mb-1 text-2xl font-bold heading-decorated">{t("azkar_title")}</h1>
                <p className="text-sm text-muted-foreground">{t("azkar_subtitle")}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowFavorites(!showFavorites); setSearchQuery(""); }}
                aria-label={t("favorites")}
                className={cn(
                  "rounded-xl p-2.5 transition-all shadow-soft",
                  showFavorites ? "bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                <Star className="h-5 w-5" />
              </motion.button>
            </div>

            {!showFavorites && (
              <div className="relative mb-4">
                <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("azkar_search")}
                  className={cn(
                    "w-full h-10 rounded-xl bg-muted/50 border border-border/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all",
                    isRTL ? "pr-9 pl-9 text-right" : "pl-9 pr-9"
                  )}
                  dir={isRTL ? "rtl" : "ltr"}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="مسح البحث"
                    className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors", isRTL ? "left-3" : "right-3")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {showFavorites ? (
              <div>
                <h2 className="mb-4 text-lg font-bold">{t("favorites")}</h2>
                {favoriteDhikrItems.length === 0 ? (
                  <div className="rounded-2xl bg-muted/30 p-8 text-center">
                    <Heart className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t("no_favorites_azkar")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favoriteDhikrItems.map((dhikr) => (
                      <DhikrCounter
                        key={dhikr.id}
                        dhikr={dhikr}
                        fontSize={fontSize}
                        onComplete={() => markActive()}
                        isFavorite={true}
                        onToggleFavorite={() => toggleFavorite(dhikr.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : isSearching ? (
              <div className="space-y-4">
                {filteredSections && filteredSections.length > 0 ? (
                  filteredSections.map(({ section, matchingCats }) => (
                    <div key={section.id}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                        {language === "ar" ? section.nameAr : section.name}
                      </p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {matchingCats.map((cat) => (
                          <CategoryCard
                            key={cat.id}
                            cat={cat}
                            isCategoryDone={isCategoryDone}
                            isRTL={isRTL}
                            language={language}
                            onClick={() => setSelectedCategory(cat)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-muted/30 p-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{t("azkar_no_results")}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {azkarSections.map((section) => {
                  const isExpanded = expandedSet.has(section.id);
                  const cats = azkarData.filter((c) => c.sectionId === section.id);
                  const doneCount = cats.filter((c) => isCategoryDone(c.id)).length;

                  return (
                    <div key={section.id} className="rounded-2xl bg-card border border-border/50 shadow-elevated overflow-hidden">
                      <motion.button
                        onClick={() => toggleSection(section.id)}
                        whileTap={{ scale: 0.99 }}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        <div className="flex items-center gap-3">
                          <div className={isRTL ? "text-right" : "text-left"}>
                            <p className="font-bold text-base text-foreground leading-snug">
                              {language === "ar" ? section.nameAr : section.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {doneCount > 0 && (
                            <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                              {language === "en"
                                ? `${doneCount}/${cats.length}`
                                : `${toArabicNumerals(doneCount)}/${toArabicNumerals(cats.length)}`}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                            {language === "en"
                              ? `${cats.length}`
                              : toArabicNumerals(cats.length)}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </motion.button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-2.5">
                              {cats.map((cat) => (
                                <CategoryCard
                                  key={cat.id}
                                  cat={cat}
                                  isCategoryDone={isCategoryDone}
                                  isRTL={isRTL}
                                  language={language}
                                  onClick={() => setSelectedCategory(cat)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          >
            <div className="mb-5 flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedCategory(null)}
                aria-label="رجوع"
                className="rounded-xl p-2.5 hover:bg-muted transition-colors flex-shrink-0"
              >
                <BackIcon className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold">
                  {language === "ar" ? selectedCategory.nameAr : selectedCategory.name}
                </h1>
              </div>
            </div>

            <div className="space-y-3">
              {selectedCategory.items.map((dhikr, i) => (
                <motion.div
                  key={dhikr.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <DhikrCounter
                    dhikr={dhikr}
                    fontSize={fontSize}
                    onComplete={() => markActive()}
                    isFavorite={favoriteAzkar.includes(dhikr.id)}
                    onToggleFavorite={() => toggleFavorite(dhikr.id)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
