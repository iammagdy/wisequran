import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import QuranPage from "@/pages/QuranPage";
import SurahReaderPage from "@/pages/SurahReaderPage";
import AzkarPage from "@/pages/AzkarPage";
import PrayerPage from "@/pages/PrayerPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<QuranPage />} />
            <Route path="/surah/:id" element={<SurahReaderPage />} />
            <Route path="/azkar" element={<AzkarPage />} />
            <Route path="/prayer" element={<PrayerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
