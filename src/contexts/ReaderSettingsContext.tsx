import { useState, useEffect, createContext, useContext, ReactNode } from "react";

type ThemeMode = "light" | "gray" | "dark";

interface ReaderSettingsContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType>({
  fontSize: 20,
  setFontSize: () => {},
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useReaderSettings = () => useContext(ReaderSettingsContext);

const FONT_SIZE_KEY = "biblia-alpha-font-size";
const THEME_KEY = "biblia-alpha-theme";

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved ? Number(saved) : 20;
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved && ["light", "gray", "dark"].includes(saved)) return saved as ThemeMode;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "gray", "dark");
    root.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => setThemeState(newTheme);

  const setFontSize = (size: number) => {
    const clamped = Math.min(32, Math.max(14, size));
    setFontSizeState(clamped);
    localStorage.setItem(FONT_SIZE_KEY, String(clamped));
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === "light") return "gray";
      if (prev === "gray") return "dark";
      return "light";
    });
  };

  return (
    <ReaderSettingsContext.Provider value={{ fontSize, setFontSize, theme, setTheme, toggleTheme }}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}