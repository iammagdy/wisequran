import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { azkarData, type AzkarCategory, type Dhikr } from "@/data/azkar-data";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreak } from "@/hooks/useStreak";
import { ArrowRight, RotateCcw, Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [remaining, setRemaining] = useState(dhikr.count);
  const done = remaining === 0;

  const handleTap = () => {
    if (remaining > 0) {
      const next = remaining - 1;
      setRemaining(next);
      if (next === 0) onComplete();
    }
  };

  return (
    <motion.div
      className={cn(
        "rounded-xl p-4 shadow-sm transition-colors",
        done ? "bg-primary/10" : "bg-card"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onToggleFavorite}
          className="rounded-lg p-1.5 transition-colors hover:bg-muted"
        >
          <Heart className={cn("h-4 w-4", isFavorite ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
      </div>
      <p
        className="font-arabic leading-loose text-right text-foreground mb-2"
        style={{ fontSize: fontSize * 0.85 }}
        dir="rtl"
      >
        {dhikr.text}
      </p>
      <p className="text-xs text-muted-foreground mb-3">{dhikr.translation}</p>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setRemaining(dhikr.count)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleTap}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition-colors",
            done
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-accent-foreground"
          )}
        >
          {done ? "✓" : remaining}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function AzkarPage() {
  const [selectedCategory, setSelectedCategory] = useState<AzkarCategory | null>(null);
  const [fontSize] = useLocalStorage<number>("wise-font-size", 24);
  const [favoriteAzkar, setFavoriteAzkar] = useLocalStorage<string[]>("wise-favorite-azkar", []);
  const [showFavorites, setShowFavorites] = useState(false);
  const { markActive } = useStreak();

  const toggleFavorite = (id: string) => {
    setFavoriteAzkar(
      favoriteAzkar.includes(id)
        ? favoriteAzkar.filter((f) => f !== id)
        : [...favoriteAzkar, id]
    );
  };

  // Collect all favorited dhikr items across categories
  const favoriteDhikrItems = azkarData
    .flatMap((cat) => cat.items)
    .filter((d) => favoriteAzkar.includes(d.id));

  return (
    <div className="px-4 pt-6">
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="mb-1 text-2xl font-bold">الأذكار</h1>
                <p className="text-sm text-muted-foreground">أذكار يومية</p>
              </div>
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  showFavorites ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}
              >
                <Star className="h-5 w-5" />
              </button>
            </div>

            {showFavorites ? (
              <div>
                <h2 className="mb-3 text-lg font-semibold">المفضلة</h2>
                {favoriteDhikrItems.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    لا توجد أذكار مفضلة بعد
                  </p>
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
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {azkarData.map((cat, i) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedCategory(cat)}
                    className="flex flex-col items-center gap-2 rounded-xl bg-card p-5 shadow-sm transition-colors active:bg-muted"
                  >
                    <span className="text-3xl">{cat.icon}</span>
                    <span className="font-semibold text-sm">{cat.nameAr}</span>
                    <span className="text-xs text-muted-foreground">{cat.items.length} أذكار</span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">{selectedCategory.nameAr}</h1>
                <p className="text-xs text-muted-foreground">{selectedCategory.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedCategory.items.map((dhikr) => (
                <DhikrCounter
                  key={dhikr.id}
                  dhikr={dhikr}
                  fontSize={fontSize}
                  onComplete={() => markActive()}
                  isFavorite={favoriteAzkar.includes(dhikr.id)}
                  onToggleFavorite={() => toggleFavorite(dhikr.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
