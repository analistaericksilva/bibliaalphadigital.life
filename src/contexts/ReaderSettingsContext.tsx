import { useState, useEffect, createContext, useContext, ReactNode } from "react";

type ThemeMode = "light" | "gray" | "dark";
type ViewMode = "paragraph" | "verse";
type CommentaryPosition = "none" | "below" | "right";
type ParallelViewMode = "none" | "horizontal" | "vertical";

interface ReaderSettingsContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showStrongNumbers: boolean;
  setShowStrongNumbers: (show: boolean) => void;
  showMorphology: boolean;
  setShowMorphology: (show: boolean) => void;
  showCrossRefs: boolean;
  setShowCrossRefs: (show: boolean) => void;
  showInlineNotes: boolean;
  setShowInlineNotes: (show: boolean) => void;
  showInlineCommentary: boolean;
  setShowInlineCommentary: (show: boolean) => void;
  showCommentaryLinks: boolean;
  setShowCommentaryLinks: (show: boolean) => void;
  wordLookupEnabled: boolean;
  setWordLookupEnabled: (enabled: boolean) => void;
  showHeaderFooter: boolean;
  setShowHeaderFooter: (show: boolean) => void;
  showUserHighlights: boolean;
  setShowUserHighlights: (show: boolean) => void;
  showFootnotes: boolean;
  setShowFootnotes: (show: boolean) => void;
  commentaryPosition: CommentaryPosition;
  setCommentaryPosition: (position: CommentaryPosition) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType>({
  fontSize: 20,
  setFontSize: () => {},
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  viewMode: "paragraph",
  setViewMode: () => {},
  showStrongNumbers: false,
  setShowStrongNumbers: () => {},
  showMorphology: false,
  setShowMorphology: () => {},
  showCrossRefs: true,
  setShowCrossRefs: () => {},
  showInlineNotes: true,
  setShowInlineNotes: () => {},
  showInlineCommentary: false,
  setShowInlineCommentary: () => {},
  showCommentaryLinks: true,
  setShowCommentaryLinks: () => {},
  wordLookupEnabled: true,
  setWordLookupEnabled: () => {},
  showHeaderFooter: true,
  setShowHeaderFooter: () => {},
  showUserHighlights: true,
  setShowUserHighlights: () => {},
  showFootnotes: true,
  setShowFootnotes: () => {},
  commentaryPosition: "none",
  setCommentaryPosition: () => {},
  selectedFont: "EB Garamond",
  setSelectedFont: () => {},
});

export const useReaderSettings = () => useContext(ReaderSettingsContext);

const FONT_SIZE_KEY = "biblia-alpha-font-size";
const THEME_KEY = "biblia-alpha-theme";
const VIEW_MODE_KEY = "biblia-alpha-view-mode";
const STRONG_NUMBERS_KEY = "biblia-alpha-strong-numbers";
const MORPHOLOGY_KEY = "biblia-alpha-morphology";
const CROSS_REFS_KEY = "biblia-alpha-cross-refs";
const INLINE_NOTES_KEY = "biblia-alpha-inline-notes";
const INLINE_COMMENTARY_KEY = "biblia-alpha-inline-commentary";
const COMMENTARY_LINKS_KEY = "biblia-alpha-commentary-links";
const WORD_LOOKUP_KEY = "biblia-alpha-word-lookup";
const HEADER_FOOTER_KEY = "biblia-alpha-header-footer";
const USER_HIGHLIGHTS_KEY = "biblia-alpha-user-highlights";
const FOOTNOTES_KEY = "biblia-alpha-footnotes";
const COMMENTARY_POSITION_KEY = "biblia-alpha-commentary-position";
const SELECTED_FONT_KEY = "biblia-alpha-selected-font";
const PARALLEL_MODE_KEY = "biblia-alpha-parallel-mode";
const SECOND_TRANSLATION_KEY = "biblia-alpha-second-translation";

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

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as ViewMode) || "paragraph";
  });

  const [showStrongNumbers, setShowStrongNumbersState] = useState(() => {
    const saved = localStorage.getItem(STRONG_NUMBERS_KEY);
    return saved === "true";
  });

  const [showMorphology, setShowMorphologyState] = useState(() => {
    const saved = localStorage.getItem(MORPHOLOGY_KEY);
    return saved === "true";
  });

  const [showCrossRefs, setShowCrossRefsState] = useState(() => {
    const saved = localStorage.getItem(CROSS_REFS_KEY);
    return saved !== "false";
  });

  const [showInlineNotes, setShowInlineNotesState] = useState(() => {
    const saved = localStorage.getItem(INLINE_NOTES_KEY);
    return saved !== "false";
  });

  const [showInlineCommentary, setShowInlineCommentaryState] = useState(() => {
    const saved = localStorage.getItem(INLINE_COMMENTARY_KEY);
    return saved === "true";
  });

  const [showCommentaryLinks, setShowCommentaryLinksState] = useState(() => {
    const saved = localStorage.getItem(COMMENTARY_LINKS_KEY);
    return saved !== "false";
  });

  const [wordLookupEnabled, setWordLookupEnabledState] = useState(() => {
    const saved = localStorage.getItem(WORD_LOOKUP_KEY);
    return saved !== "false";
  });

  const [showHeaderFooter, setShowHeaderFooterState] = useState(() => {
    const saved = localStorage.getItem(HEADER_FOOTER_KEY);
    return saved !== "false";
  });

  const [showUserHighlights, setShowUserHighlightsState] = useState(() => {
    const saved = localStorage.getItem(USER_HIGHLIGHTS_KEY);
    return saved !== "false";
  });

  const [showFootnotes, setShowFootnotesState] = useState(() => {
    const saved = localStorage.getItem(FOOTNOTES_KEY);
    return saved !== "false";
  });

  const [commentaryPosition, setCommentaryPositionState] = useState<CommentaryPosition>(() => {
    const saved = localStorage.getItem(COMMENTARY_POSITION_KEY);
    if (saved && ["none", "below", "right"].includes(saved)) return saved as CommentaryPosition;
    return "none";
  });

  const [selectedFont, setSelectedFontState] = useState(() => {
    const saved = localStorage.getItem(SELECTED_FONT_KEY);
    return saved || "EB Garamond";
  });

  const [parallelMode, setParallelModeState] = useState<ParallelViewMode>(() => {
    const saved = localStorage.getItem(PARALLEL_MODE_KEY);
    if (saved && ["none", "horizontal", "vertical"].includes(saved)) return saved as ParallelViewMode;
    return "none";
  });

  const [secondBibleTranslation, setSecondTranslationState] = useState(() => {
    const saved = localStorage.getItem(SECOND_TRANSLATION_KEY);
    return saved || "nvi";
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

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  };

  const setShowStrongNumbers = (show: boolean) => {
    setShowStrongNumbersState(show);
    localStorage.setItem(STRONG_NUMBERS_KEY, String(show));
  };

  const setShowMorphology = (show: boolean) => {
    setShowMorphologyState(show);
    localStorage.setItem(MORPHOLOGY_KEY, String(show));
  };

  const setShowCrossRefs = (show: boolean) => {
    setShowCrossRefsState(show);
    localStorage.setItem(CROSS_REFS_KEY, String(show));
  };

  const setShowInlineNotes = (show: boolean) => {
    setShowInlineNotesState(show);
    localStorage.setItem(INLINE_NOTES_KEY, String(show));
  };

  const setShowInlineCommentary = (show: boolean) => {
    setShowInlineCommentaryState(show);
    localStorage.setItem(INLINE_COMMENTARY_KEY, String(show));
  };

  const setShowCommentaryLinks = (show: boolean) => {
    setShowCommentaryLinksState(show);
    localStorage.setItem(COMMENTARY_LINKS_KEY, String(show));
  };

  const setWordLookupEnabled = (enabled: boolean) => {
    setWordLookupEnabledState(enabled);
    localStorage.setItem(WORD_LOOKUP_KEY, String(enabled));
  };

  const setShowHeaderFooter = (show: boolean) => {
    setShowHeaderFooterState(show);
    localStorage.setItem(HEADER_FOOTER_KEY, String(show));
  };

  const setShowUserHighlights = (show: boolean) => {
    setShowUserHighlightsState(show);
    localStorage.setItem(USER_HIGHLIGHTS_KEY, String(show));
  };

  const setShowFootnotes = (show: boolean) => {
    setShowFootnotesState(show);
    localStorage.setItem(FOOTNOTES_KEY, String(show));
  };

  const setCommentaryPosition = (position: CommentaryPosition) => {
    setCommentaryPositionState(position);
    localStorage.setItem(COMMENTARY_POSITION_KEY, position);
  };

  const setSelectedFont = (font: string) => {
    setSelectedFontState(font);
    localStorage.setItem(SELECTED_FONT_KEY, font);
  };

  const setParallelMode = (mode: ParallelViewMode) => {
    setParallelModeState(mode);
    localStorage.setItem(PARALLEL_MODE_KEY, mode);
  };

  const setSecondBibleTranslation = (translation: string) => {
    setSecondTranslationState(translation);
    localStorage.setItem(SECOND_TRANSLATION_KEY, translation);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === "light") return "gray";
      if (prev === "gray") return "dark";
      return "light";
    });
  };

  return (
    <ReaderSettingsContext.Provider value={{
      fontSize, setFontSize, theme, setTheme, toggleTheme,
      viewMode, setViewMode,
      showStrongNumbers, setShowStrongNumbers,
      showMorphology, setShowMorphology,
      showCrossRefs, setShowCrossRefs,
      showInlineNotes, setShowInlineNotes,
      showInlineCommentary, setShowInlineCommentary,
      showCommentaryLinks, setShowCommentaryLinks,
      wordLookupEnabled, setWordLookupEnabled,
      showHeaderFooter, setShowHeaderFooter,
      showUserHighlights, setShowUserHighlights,
      showFootnotes, setShowFootnotes,
      commentaryPosition, setCommentaryPosition,
      selectedFont, setSelectedFont,
      parallelMode, setParallelMode,
      secondBibleTranslation, setSecondBibleTranslation,
    }}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}