import { useLocalStorage } from "./useLocalStorage";
import { useCallback } from "react";

export interface ReadingHistoryEntry {
  surah: number;
  surahName: string;
  ayahReached: number;
  timestamp: number;
}

const MAX_ENTRIES = 50;

export function useReadingHistory() {
  const [history, setHistory] = useLocalStorage<ReadingHistoryEntry[]>("wise-reading-history", []);

  const addToHistory = useCallback(
    (surah: number, surahName: string, ayahReached: number = 1) => {
      setHistory((prev) => {
        const filtered = prev.filter((e) => e.surah !== surah);
        const entry: ReadingHistoryEntry = {
          surah,
          surahName,
          ayahReached,
          timestamp: Date.now(),
        };
        return [entry, ...filtered].slice(0, MAX_ENTRIES);
      });
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return { history, addToHistory, clearHistory };
}
