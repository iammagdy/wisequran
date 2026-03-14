import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Book, Moon, SquareCheck as CheckSquare, Circle, Settings, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isRamadanTabVisible } from "@/hooks/useRamadan";
import { useLanguage } from "@/contexts/LanguageContext";

const basePaths = [
  { path: "/", icon: Book, key: "nav_quran" as const },
  { path: "/azkar", icon: Moon, key: "nav_azkar" as const },
  { path: "/prayer", icon: CheckSquare, key: "nav_prayer" as const },
  { path: "/tasbeeh", icon: Circle, key: "nav_tasbeeh" as const },
  { path: "/settings", icon: Settings, key: "nav_settings" as const },
];

export default function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const showRamadan = useMemo(() => isRamadanTabVisible(), []);

  const tabs = useMemo(() => {
    if (!showRamadan) return basePaths;
    return [
      ...basePaths.slice(0, -1),
      { path: "/ramadan", icon: Star, key: "nav_ramadan" as const },
      basePaths[basePaths.length - 1],
    ];
  }, [showRamadan]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="glass-subtle border-t border-border/30">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2 px-2">
          {tabs.map(({ path, icon: Icon, key }) => {
            const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            return (
              <NavLink
                key={path}
                to={path}
                className="relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl transition-all duration-200"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative z-10"
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                    style={{
                      filter: isActive ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" : "none"
                    }}
                  />
                </motion.div>

                <span
                  className={cn(
                    "relative z-10 text-xs font-semibold transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {t(key)}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
