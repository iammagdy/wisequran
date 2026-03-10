import { useMemo } from "react";

import { NavLink, useLocation } from "react-router-dom";
import { Book, Moon, CheckSquare, Circle, Settings, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isRamadanTabVisible } from "@/hooks/useRamadan";

const baseTabs = [
  { path: "/", icon: Book, label: "القرآن" },
  { path: "/azkar", icon: Moon, label: "الأذكار" },
  { path: "/prayer", icon: CheckSquare, label: "الصلوات" },
  { path: "/tasbeeh", icon: Circle, label: "التسبيح" },
  { path: "/settings", icon: Settings, label: "الإعدادات" },
];

export default function BottomNav() {
  const location = useLocation();
  const showRamadan = useMemo(() => isRamadanTabVisible(), []);
  const tabs = useMemo(() => {
    if (!showRamadan) return baseTabs;
    // Insert Ramadan tab before settings
    return [
      ...baseTabs.slice(0, -1),
      { path: "/ramadan", icon: Star, label: "رمضان" },
      baseTabs[baseTabs.length - 1],
    ];
  }, [showRamadan]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Gradient border top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Glass background */}
      <div className="glass-subtle border-t border-border/30">
        <div className="mx-auto flex max-w-lg items-center justify-around py-2 px-2">
          {tabs.map(({ path, icon: Icon, label }) => {
            const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            return (
              <NavLink
                key={path}
                to={path}
                className="relative flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all duration-200"
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative z-10"
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                    style={{
                      filter: isActive ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" : "none"
                    }}
                  />
                </motion.div>
                
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-semibold transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
