import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

type Theme = "light" | "dark";
export type UIScale = "normal" | "large" | "xlarge";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("wise-quran-theme", "light");
  const [uiScale, setUIScale] = useLocalStorage<UIScale>("wise-ui-scale", "normal");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("ui-scale-normal", "ui-scale-large", "ui-scale-xlarge");
    el.classList.add(`ui-scale-${uiScale}`);
  }, [uiScale]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return { theme, setTheme, toggleTheme, uiScale, setUIScale };
}
