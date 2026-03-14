import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { azkarData, type AzkarCategory, type Dhikr } from "@/data/azkar-data";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreak } from "@/hooks/useStreak";
import { useAzkarCompletion } from "@/hooks/useAzkarCompletion";
import { ArrowRight, RotateCcw, Heart, Star, CircleCheck as CheckCircle2 } from "lucide-react";
import { cn, toArabicNumerals } from "@/lib/utils";

function DhikrCounter({
  dhikr,
  fontSize,
  onComplete,
  isFavorite,
  onToggleFavorite






}: {dhikr: Dhikr;fontSize: number;onComplete: () => void;isFavorite: boolean;onToggleFavorite: () => void;}) {
  const [remaining, setRemaining] = useState(dhikr.count);
  const done = remaining === 0;
  const progress = (dhikr.count - remaining) / dhikr.count * 100;

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
      )}>
      
      <div className="flex items-center justify-between mb-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleFavorite}
          className="rounded-xl p-2 transition-colors hover:bg-muted">
          
          <Heart className={cn("h-5 w-5 transition-all", isFavorite ? "fill-primary text-primary" : "text-muted-foreground")} />
        </motion.button>
        {!done &&
        <div className="flex-1 mx-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }} />
          
          </div>
        }
      </div>
      <p
        className="font-arabic leading-loose text-right text-foreground mb-3"
        style={{ fontSize: fontSize * 0.85 }}
        dir="rtl">
        
        {dhikr.text}
      </p>
      <p className="text-xs text-muted-foreground mb-4">{dhikr.translation}</p>
      <div className="flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setRemaining(dhikr.count)}
          className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted transition-colors">
          
          <RotateCcw className="h-5 w-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleTap}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold transition-all",
            done ?
            "counter-button text-primary-foreground" :
            "bg-accent/90 text-accent-foreground shadow-elevated hover:shadow-elevated-lg"
          )}>
          
          {done ? "✓" : toArabicNumerals(remaining)}
        </motion.button>
      </div>
    </motion.div>);

}

export default function AzkarPage() {
  const [selectedCategory, setSelectedCategory] = useState<AzkarCategory | null>(null);
  const [fontSize] = useLocalStorage<number>("wise-font-size", 24);
  const [favoriteAzkar, setFavoriteAzkar] = useLocalStorage<string[]>("wise-favorite-azkar", []);
  const [showFavorites, setShowFavorites] = useState(false);
  const { markActive } = useStreak();
  const { isCategoryDone, toggleCategory } = useAzkarCompletion();

  const toggleFavorite = (id: string) => {
    setFavoriteAzkar(
      favoriteAzkar.includes(id) ?
      favoriteAzkar.filter((f) => f !== id) :
      [...favoriteAzkar, id]
    );
  };

  // Collect all favorited dhikr items across categories
  const favoriteDhikrItems = azkarData.
  flatMap((cat) => cat.items).
  filter((d) => favoriteAzkar.includes(d.id));

  return (
    <div className="px-4 pb-5 pt-5 pl-2.5">
      <AnimatePresence mode="wait">
        {!selectedCategory ?
        <motion.div
          key="categories"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>
          
            <div className="flex items-center justify-between mb-[5px]">
              <div>
                <h1 className="mb-1 text-2xl font-bold heading-decorated">الأذكار</h1>
                <p className="text-sm text-muted-foreground pt-1.5 pb-1.5">أذكار يومية</p>
              </div>
              <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFavorites(!showFavorites)}
              className={cn(
                "rounded-xl p-2.5 transition-all shadow-soft",
                showFavorites ? "bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground hover:bg-muted"
              )}>
              
                <Star className="h-5 w-5" />
              </motion.button>
            </div>

            {showFavorites ?
          <div>
                <h2 className="mb-4 text-lg font-bold">المفضلة</h2>
                {favoriteDhikrItems.length === 0 ?
            <div className="rounded-2xl bg-muted/30 p-8 text-center">
                    <Heart className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      لا توجد أذكار مفضلة بعد
                    </p>
                  </div> :

            <div className="space-y-3">
                    {favoriteDhikrItems.map((dhikr) =>
              <DhikrCounter
                key={dhikr.id}
                dhikr={dhikr}
                fontSize={fontSize}
                onComplete={() => markActive()}
                isFavorite={true}
                onToggleFavorite={() => toggleFavorite(dhikr.id)} />

              )}
                  </div>
            }
              </div> :

          <div className="grid grid-cols-2 gap-3">
                {azkarData.map((cat, i) =>
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory(cat)}
              className="flex flex-col items-center rounded-2xl bg-card p-6 shadow-elevated border-border/50 transition-all hover:shadow-elevated-lg group pt-2.5 pb-2.5 pl-1.5 pr-1.5 gap-px border-2">
              
                    <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <span className="text-3xl">{cat.icon}</span>
                      {isCategoryDone(cat.id) &&
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                        </div>
                }
                    </div>
                    <span className="font-bold text-sm">{cat.nameAr}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground rounded-full bg-muted px-2.5 py-0.5">{toArabicNumerals(cat.items.length)} أذكار</span>
                    </div>
                  </motion.button>
            )}
              </div>
          }
          </motion.div> :

        <motion.div
          key="list"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}>
          
            <div className="mb-5 flex items-center gap-3">
              <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedCategory(null)}
              className="rounded-xl p-2.5 hover:bg-muted transition-colors">
              
                <ArrowRight className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold">{selectedCategory.nameAr}</h1>
                <p className="text-xs text-muted-foreground">{toArabicNumerals(selectedCategory.items.length)} أذكار</p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedCategory.items.map((dhikr, i) =>
            <motion.div
              key={dhikr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              
                  <DhikrCounter
                dhikr={dhikr}
                fontSize={fontSize}
                onComplete={() => markActive()}
                isFavorite={favoriteAzkar.includes(dhikr.id)}
                onToggleFavorite={() => toggleFavorite(dhikr.id)} />
              
                </motion.div>
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}