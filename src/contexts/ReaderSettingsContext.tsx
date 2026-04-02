import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface ReaderSettingsContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType>({
  fontSize: 20,
  setFontSize: () => {},
  isDark: false,
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

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const setFontSize = (size: number) => {
    const clamped = Math.min(32, Math.max(14, size));
    setFontSizeState(clamped);
    localStorage.setItem(FONT_SIZE_KEY, String(clamped));
  };

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ReaderSettingsContext.Provider value={{ fontSize, setFontSize, isDark, toggleTheme }}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}
