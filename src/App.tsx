import { useState, useCallback, lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import InstallBanner from "@/components/InstallBanner";
import ChangelogModal from "@/components/ChangelogModal";
import UpdateNotification from "@/components/UpdateNotification";
import SplashScreen from "@/components/SplashScreen";
import ErrorBoundary from "@/components/ErrorBoundary";
import { usePostUpdateChangelog } from "@/hooks/usePostUpdateChangelog";

const QuranPage = lazy(() => import("@/pages/QuranPage"));
const SurahReaderPage = lazy(() => import("@/pages/SurahReaderPage"));
const AzkarPage = lazy(() => import("@/pages/AzkarPage"));
const PrayerPage = lazy(() => import("@/pages/PrayerPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const SafariDiagnosticsPage = lazy(() => import("@/pages/SafariDiagnosticsPage"));
const TasbeehPage = lazy(() => import("@/pages/TasbeehPage"));
const StatsPage = lazy(() => import("@/pages/StatsPage"));
const HifzPage = lazy(() => import("@/pages/HifzPage"));
const RecitationTestPage = lazy(() => import("@/pages/RecitationTestPage"));
const QiblaPage = lazy(() => import("@/pages/QiblaPage"));
const OfflineCenterPage = lazy(() => import("@/pages/OfflineCenterPage"));
const FridayModePage = lazy(() => import("@/pages/FridayModePage"));
const RamadanPage = lazy(() => import("@/pages/RamadanPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const SignInPage = lazy(() => import("@/pages/SignInPage"));
const SleepModePage = lazy(() => import("@/pages/SleepModePage"));
const AuthCallbackPage = lazy(() => import("@/pages/AuthCallbackPage"));
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";
import { useAzkarNotifications } from "@/hooks/useAzkarNotifications";
import { useAdhan } from "@/hooks/useAdhan";
import { usePrayerReminders } from "@/hooks/usePrayerReminders";
import { useGlobalAudioBootstrap } from "@/hooks/useGlobalAudioBootstrap";
import { useFridayReminders } from "@/hooks/useFridayReminders";
import { useSyncQueue } from "@/hooks/useSyncQueue";

const queryClient = new QueryClient();

const AppContent = () => {
  useGlobalAudioBootstrap();
  usePrayerNotifications();
  useAzkarNotifications();
  useAdhan();
  usePrayerReminders();
  useFridayReminders();
  useSyncQueue();
  const { showChangelog, newEntries, dismissTemporary, dismissPermanent } = usePostUpdateChangelog();
  return (
    <>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/sleep" element={<SleepModePage />} />
        <Route
          path="*"
          element={
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
                  <Route path="/hifz/test" element={<RecitationTestPage />} />
                  <Route path="/qibla" element={<QiblaPage />} />
                  <Route path="/friday" element={<FridayModePage />} />
                  <Route path="/ramadan" element={<RamadanPage />} />
                  <Route path="/offline" element={<OfflineCenterPage />} />
                  <Route path="/settings/safari-diagnostics" element={<SafariDiagnosticsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppShell>
              <InstallBanner />
              <UpdateNotification />
            </>
          }
        />
      </Routes>
      </Suspense>
      <ChangelogModal
        open={showChangelog}
        newEntries={newEntries}
        onDismissTemporary={dismissTemporary}
        onDismissPermanent={dismissPermanent}
      />
    </>
  );
};

const App = () => {
  const [appReady, setAppReady] = useState(false);

  const handleSplashComplete = useCallback(() => {
    setAppReady(true);
  }, []);

  return (
    <>
      <SplashScreen onComplete={handleSplashComplete} />
      {appReady && (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AuthProvider>
                <LanguageProvider>
                  <AudioPlayerProvider>
                    <ErrorBoundary>
                      <AppContent />
                    </ErrorBoundary>
                  </AudioPlayerProvider>
                </LanguageProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      )}
    </>
  );
};

export default App;
