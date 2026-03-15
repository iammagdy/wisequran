import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isRamadanTabVisible } from "@/hooks/useRamadan";
import { useLanguage } from "@/contexts/LanguageContext";

function QuranIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 1.75 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M12 7c0 0-1.5 1-1.5 2.5S12 12 12 12s1.5-1 1.5-2.5S12 7 12 7z" />
    </svg>
  );
}

function MoonStarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 1.75 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5L19 3z" />
    </svg>
  );
}

function MosqueIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 1.75 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20v-1a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v1" />
      <path d="M9 15V9" />
      <path d="M15 15V9" />
      <path d="M9 9a3 3 0 0 1 6 0" />
      <path d="M7 9H5a2 2 0 0 1-2-2V6l2-2" />
      <path d="M17 9h2a2 2 0 0 0 2-2V6l-2-2" />
      <path d="M12 4V2" />
    </svg>
  );
}

function TasbeehIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 1.75 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="17.6" cy="7.4" r="1.5" />
      <circle cx="19" cy="13.5" r="1.5" />
      <circle cx="15.5" cy="18.5" r="1.5" />
      <circle cx="8.5" cy="18.5" r="1.5" />
      <circle cx="5" cy="13.5" r="1.5" />
      <circle cx="6.4" cy="7.4" r="1.5" />
      <path d="M12 10V7.5" strokeDasharray="1 2" />
    </svg>
  );
}

function RamadanIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 1.75 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a4 4 0 0 1 0 8 6 6 0 0 1-10.9-4.6A6 6 0 0 1 11 3a4 4 0 0 1 6 0z" />
      <path d="M12 8l.5 1.5L14 10l-1.5.5L12 12l-.5-1.5L10 10l1.5-.5L12 8z" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 1.75 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const iconMap = {
  "/": QuranIcon,
  "/azkar": MoonStarIcon,
  "/prayer": MosqueIcon,
  "/tasbeeh": TasbeehIcon,
  "/ramadan": RamadanIcon,
  "/settings": SettingsIcon,
} as const;

const basePaths = [
  { path: "/", key: "nav_quran" as const },
  { path: "/azkar", key: "nav_azkar" as const },
  { path: "/prayer", key: "nav_prayer" as const },
  { path: "/tasbeeh", key: "nav_tasbeeh" as const },
  { path: "/settings", key: "nav_settings" as const },
];

export default function BottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  const showRamadan = useMemo(() => isRamadanTabVisible(), []);

  const tabs = useMemo(() => {
    if (!showRamadan) return basePaths;
    return [
      ...basePaths.slice(0, -1),
      { path: "/ramadan", key: "nav_ramadan" as const },
      basePaths[basePaths.length - 1],
    ];
  }, [showRamadan]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="nav-floating glass-subtle border-t border-border/40">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2" style={{ height: 'var(--nav-height)' }}>
          {tabs.map(({ path, key }) => {
            const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
            const IconComponent = iconMap[path as keyof typeof iconMap];
            return (
              <NavLink
                key={path}
                to={path}
                className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 min-w-[52px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-primary/12"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                <motion.div
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="relative z-10"
                >
                  {IconComponent && (
                    <div
                      className={cn(
                        "transition-all duration-200",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                      style={{
                        filter: isActive ? "drop-shadow(0 0 6px hsl(var(--primary) / 0.45))" : "none"
                      }}
                    >
                      <IconComponent active={isActive} />
                    </div>
                  )}
                </motion.div>

                <motion.span
                  animate={{ opacity: isActive ? 1 : 0.6 }}
                  className={cn(
                    "relative z-10 text-[10px] font-semibold transition-all duration-200 leading-none",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {t(key)}
                </motion.span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
