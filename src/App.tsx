import { useState, useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import InstallBanner from "@/components/InstallBanner";
import SplashScreen from "@/components/SplashScreen";
import QuranPage from "@/pages/QuranPage";
import SurahReaderPage from "@/pages/SurahReaderPage";
import AzkarPage from "@/pages/AzkarPage";
import PrayerPage from "@/pages/PrayerPage";
import SettingsPage from "@/pages/SettingsPage";
import TasbeehPage from "@/pages/TasbeehPage";
import StatsPage from "@/pages/StatsPage";
import HifzPage from "@/pages/HifzPage";
import QiblaPage from "@/pages/QiblaPage";
import RamadanPage from "@/pages/RamadanPage";
import NotFound from "@/pages/NotFound";
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";
import { useAzkarNotifications } from "@/hooks/useAzkarNotifications";

const queryClient = new QueryClient();

const AppContent = () => {
  usePrayerNotifications();
  useAzkarNotifications();
  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<QuranPage />} />
          <Route path="/surah/:id" element={<SurahReaderPage />} />
          <Route path="/azkar" element={<AzkarPage />} />
          <Route path="/prayer" element={<PrayerPage />} />
          <Route path="/tasbeeh" element={<TasbeehPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/hifz" element={<HifzPage />} />
          <Route path="/qibla" element={<QiblaPage />} />
          <Route path="/ramadan" element={<RamadanPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
      <InstallBanner />
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
    return !sessionStorage.getItem("splashShown");
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("splashShown", "true");
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <BrowserRouter>
          <AudioPlayerProvider>
            <AppContent />
          </AudioPlayerProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
