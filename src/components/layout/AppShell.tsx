import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import BottomNav from "./BottomNav";
import GlobalAudioBar from "@/components/quran/GlobalAudioBar";
import { AchievementUnlockNotification } from "@/components/AchievementsSheet";
import UpdateNotification from "@/components/UpdateNotification";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  const location = useLocation();
  const { surahNumber } = useAudioPlayer();
  const onSurahPage = location.pathname.startsWith("/surah/");
  const showGlobalBar = surahNumber !== null && !onSurahPage;

  useTheme();

  return (
    <div className="min-h-screen bg-background gradient-spiritual">
      <main className={showGlobalBar ? "pb-nav-with-bar" : "pb-nav"}>{children}</main>
      <AnimatePresence>
        {showGlobalBar && <GlobalAudioBar />}
      </AnimatePresence>
      <BottomNav />
      <AchievementUnlockNotification />
    </div>
  );
}
