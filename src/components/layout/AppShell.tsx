import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import BottomNav from "./BottomNav";
import GlobalAudioBar from "@/components/quran/GlobalAudioBar";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  const location = useLocation();
  const { surahNumber } = useAudioPlayer();
  const onSurahPage = location.pathname.startsWith("/surah/");
  const showGlobalBar = surahNumber !== null && !onSurahPage;

  return (
    <div className="min-h-screen bg-background">
      <main className={`pb-20 ${showGlobalBar ? "pb-36" : ""}`}>{children}</main>
      <AnimatePresence>
        {showGlobalBar && <GlobalAudioBar />}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
