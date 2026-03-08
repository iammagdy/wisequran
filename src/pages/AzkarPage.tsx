import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { azkarData, type AzkarCategory, type Dhikr } from "@/data/azkar-data";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function DhikrCounter({ dhikr, fontSize }: { dhikr: Dhikr; fontSize: number }) {
  const [remaining, setRemaining] = useState(dhikr.count);
  const done = remaining === 0;

  const handleTap = () => {
    if (remaining > 0) setRemaining(remaining - 1);
  };

  return (
    <motion.div
      className={cn(
        "rounded-xl p-4 shadow-sm transition-colors",
        done ? "bg-primary/10" : "bg-card"
      )}
    >
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
            <h1 className="mb-1 text-2xl font-bold">الأذكار</h1>
            <p className="mb-6 text-sm text-muted-foreground">Daily Remembrance</p>

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
                <DhikrCounter key={dhikr.id} dhikr={dhikr} fontSize={fontSize} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
