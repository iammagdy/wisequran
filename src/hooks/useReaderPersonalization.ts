import { useLocalStorage } from "@/hooks/useLocalStorage";

export type ReaderLineSpacing = "compact" | "balanced" | "relaxed";
export type ReaderColorTheme = "classic" | "emerald" | "sepia";
export type FocusPreset = "standard" | "calm";

const LINE_HEIGHT_MAP: Record<ReaderLineSpacing, number> = {
  compact: 2,
  balanced: 2.3,
  relaxed: 2.7,
};

const FOCUS_LINE_HEIGHT_MAP: Record<ReaderLineSpacing, number> = {
  compact: 2.3,
  balanced: 2.6,
  relaxed: 3,
};

export function getReaderToneClass(theme: ReaderColorTheme) {
  switch (theme) {
    case "emerald":
      return "text-emerald-800 dark:text-emerald-100";
    case "sepia":
      return "text-amber-900 dark:text-amber-100";
    default:
      return "text-foreground";
  }
}

export function useReaderPersonalization() {
  const [lineSpacing, setLineSpacing] = useLocalStorage<ReaderLineSpacing>("wise-reader-line-spacing", "balanced");
  const [readerColorTheme, setReaderColorTheme] = useLocalStorage<ReaderColorTheme>("wise-reader-color-theme", "classic");
  const [focusPreset, setFocusPreset] = useLocalStorage<FocusPreset>("wise-focus-preset", "standard");

  return {
    lineSpacing,
    setLineSpacing,
    readerColorTheme,
    setReaderColorTheme,
    focusPreset,
    setFocusPreset,
    lineHeight: LINE_HEIGHT_MAP[lineSpacing],
    focusLineHeight: FOCUS_LINE_HEIGHT_MAP[lineSpacing],
    readerToneClass: getReaderToneClass(readerColorTheme),
  };
}