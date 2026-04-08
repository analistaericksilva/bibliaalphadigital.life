import { useState, useEffect, createContext, useContext, ReactNode } from "react";

type ThemeMode = "light" | "gray" | "dark";
type ViewMode = "paragraph" | "verse";
type CommentaryPosition = "none" | "below" | "right";
type UsageTemplate = "browseros" | "focus" | "study";

interface ReaderSettingsContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  showStrongNumbers: boolean;
  setShowStrongNumbers: (show: boolean) => void;
  toggleShowStrongNumbers: () => void;
  showMorphology: boolean;
  setShowMorphology: (show: boolean) => void;
  toggleShowMorphology: () => void;
  showCrossRefs: boolean;
  setShowCrossRefs: (show: boolean) => void;
  toggleShowCrossRefs: () => void;
  showInlineNotes: boolean;
  setShowInlineNotes: (show: boolean) => void;
  toggleShowInlineNotes: () => void;
  showInlineCommentary: boolean;
  setShowInlineCommentary: (show: boolean) => void;
  toggleShowInlineCommentary: () => void;
  showCommentaryLinks: boolean;
  setShowCommentaryLinks: (show: boolean) => void;
  toggleShowCommentaryLinks: () => void;
  wordLookupEnabled: boolean;
  setWordLookupEnabled: (enabled: boolean) => void;
  toggleWordLookupEnabled: () => void;
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
  showLeftIcons: boolean;
  setShowLeftIcons: (show: boolean) => void;
  showCompareMode: boolean;
  setShowCompareMode: (show: boolean) => void;
  usageTemplate: UsageTemplate;
  setUsageTemplate: (template: UsageTemplate) => void;
  applyUsageTemplate: (template: UsageTemplate) => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType>({
  fontSize: 20,
  setFontSize: () => {},
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  viewMode: "paragraph",
  setViewMode: () => {},
  toggleViewMode: () => {},
  showStrongNumbers: false,
  setShowStrongNumbers: () => {},
  toggleShowStrongNumbers: () => {},
  showMorphology: false,
  setShowMorphology: () => {},
  toggleShowMorphology: () => {},
  showCrossRefs: true,
  setShowCrossRefs: () => {},
  toggleShowCrossRefs: () => {},
  showInlineNotes: true,
  setShowInlineNotes: () => {},
  toggleShowInlineNotes: () => {},
  showInlineCommentary: false,
  setShowInlineCommentary: () => {},
  toggleShowInlineCommentary: () => {},
  showCommentaryLinks: true,
  setShowCommentaryLinks: () => {},
  toggleShowCommentaryLinks: () => {},
  wordLookupEnabled: true,
  setWordLookupEnabled: () => {},
  toggleWordLookupEnabled: () => {},
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
  showLeftIcons: true,
  setShowLeftIcons: () => {},
  showCompareMode: false,
  setShowCompareMode: () => {},
  usageTemplate: "browseros",
  setUsageTemplate: () => {},
  applyUsageTemplate: () => {},
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
const LEFT_ICONS_KEY = "biblia-alpha-left-icons";
const COMPARE_MODE_KEY = "biblia-alpha-compare-mode";
const USAGE_TEMPLATE_KEY = "biblia-alpha-usage-template";

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

  const [showLeftIcons, setShowLeftIconsState] = useState(() => {
    const saved = localStorage.getItem(LEFT_ICONS_KEY);
    return saved !== "false";
  });

  const [showCompareMode, setShowCompareModeState] = useState(() => {
    const saved = localStorage.getItem(COMPARE_MODE_KEY);
    return saved === "true";
  });

  const [usageTemplate, setUsageTemplateState] = useState<UsageTemplate>(() => {
    const saved = localStorage.getItem(USAGE_TEMPLATE_KEY);
    if (saved && ["browseros", "focus", "study"].includes(saved)) return saved as UsageTemplate;
    return "browseros";
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

  const toggleViewMode = () => {
    const newMode = viewMode === "paragraph" ? "verse" : "paragraph";
    setViewModeState(newMode);
    localStorage.setItem(VIEW_MODE_KEY, newMode);
  };

  const setShowStrongNumbers = (show: boolean) => {
    setShowStrongNumbersState(show);
    localStorage.setItem(STRONG_NUMBERS_KEY, String(show));
  };

  const toggleShowStrongNumbers = () => {
    setShowStrongNumbersState(prev => !prev);
    localStorage.setItem(STRONG_NUMBERS_KEY, String(!showStrongNumbers));
  };

  const setShowMorphology = (show: boolean) => {
    setShowMorphologyState(show);
    localStorage.setItem(MORPHOLOGY_KEY, String(show));
  };

  const toggleShowMorphology = () => {
    setShowMorphologyState(prev => !prev);
    localStorage.setItem(MORPHOLOGY_KEY, String(!showMorphology));
  };

  const setShowCrossRefs = (show: boolean) => {
    setShowCrossRefsState(show);
    localStorage.setItem(CROSS_REFS_KEY, String(show));
  };

  const toggleShowCrossRefs = () => {
    setShowCrossRefsState(prev => !prev);
    localStorage.setItem(CROSS_REFS_KEY, String(!showCrossRefs));
  };

  const setShowInlineNotes = (show: boolean) => {
    setShowInlineNotesState(show);
    localStorage.setItem(INLINE_NOTES_KEY, String(show));
  };

  const toggleShowInlineNotes = () => {
    setShowInlineNotesState(prev => !prev);
    localStorage.setItem(INLINE_NOTES_KEY, String(!showInlineNotes));
  };

  const setShowInlineCommentary = (show: boolean) => {
    setShowInlineCommentaryState(show);
    localStorage.setItem(INLINE_COMMENTARY_KEY, String(show));
  };

  const toggleShowInlineCommentary = () => {
    setShowInlineCommentaryState(prev => !prev);
    localStorage.setItem(INLINE_COMMENTARY_KEY, String(!showInlineCommentary));
  };

  const setShowCommentaryLinks = (show: boolean) => {
    setShowCommentaryLinksState(show);
    localStorage.setItem(COMMENTARY_LINKS_KEY, String(show));
  };

  const toggleShowCommentaryLinks = () => {
    setShowCommentaryLinksState(prev => !prev);
    localStorage.setItem(COMMENTARY_LINKS_KEY, String(!showCommentaryLinks));
  };

  const setWordLookupEnabled = (enabled: boolean) => {
    setWordLookupEnabledState(enabled);
    localStorage.setItem(WORD_LOOKUP_KEY, String(enabled));
  };

  const toggleWordLookupEnabled = () => {
    setWordLookupEnabledState(prev => !prev);
    localStorage.setItem(WORD_LOOKUP_KEY, String(!wordLookupEnabled));
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

  const setShowLeftIcons = (show: boolean) => {
    setShowLeftIconsState(show);
    localStorage.setItem(LEFT_ICONS_KEY, String(show));
  };

  const setShowCompareMode = (show: boolean) => {
    setShowCompareModeState(show);
    localStorage.setItem(COMPARE_MODE_KEY, String(show));
  };

  const setUsageTemplate = (template: UsageTemplate) => {
    setUsageTemplateState(template);
    localStorage.setItem(USAGE_TEMPLATE_KEY, template);
  };

  const applyUsageTemplate = (template: UsageTemplate) => {
    setUsageTemplate(template);

    if (template === "browseros") {
      setThemeState("gray");
      localStorage.setItem(THEME_KEY, "gray");
      setViewModeState("paragraph");
      localStorage.setItem(VIEW_MODE_KEY, "paragraph");
      setShowCrossRefsState(true);
      localStorage.setItem(CROSS_REFS_KEY, "true");
      setShowInlineNotesState(true);
      localStorage.setItem(INLINE_NOTES_KEY, "true");
      setShowCommentaryLinksState(true);
      localStorage.setItem(COMMENTARY_LINKS_KEY, "true");
      setWordLookupEnabledState(true);
      localStorage.setItem(WORD_LOOKUP_KEY, "true");
      setShowLeftIconsState(true);
      localStorage.setItem(LEFT_ICONS_KEY, "true");
      setShowHeaderFooterState(true);
      localStorage.setItem(HEADER_FOOTER_KEY, "true");
      setShowStrongNumbersState(false);
      localStorage.setItem(STRONG_NUMBERS_KEY, "false");
      setShowMorphologyState(false);
      localStorage.setItem(MORPHOLOGY_KEY, "false");
      setCommentaryPositionState("none");
      localStorage.setItem(COMMENTARY_POSITION_KEY, "none");
      return;
    }

    if (template === "focus") {
      setThemeState("dark");
      localStorage.setItem(THEME_KEY, "dark");
      setViewModeState("paragraph");
      localStorage.setItem(VIEW_MODE_KEY, "paragraph");
      setShowCrossRefsState(false);
      localStorage.setItem(CROSS_REFS_KEY, "false");
      setShowInlineNotesState(false);
      localStorage.setItem(INLINE_NOTES_KEY, "false");
      setShowCommentaryLinksState(false);
      localStorage.setItem(COMMENTARY_LINKS_KEY, "false");
      setWordLookupEnabledState(false);
      localStorage.setItem(WORD_LOOKUP_KEY, "false");
      setShowLeftIconsState(false);
      localStorage.setItem(LEFT_ICONS_KEY, "false");
      setShowHeaderFooterState(false);
      localStorage.setItem(HEADER_FOOTER_KEY, "false");
      setShowFootnotesState(false);
      localStorage.setItem(FOOTNOTES_KEY, "false");
      setShowStrongNumbersState(false);
      localStorage.setItem(STRONG_NUMBERS_KEY, "false");
      setShowMorphologyState(false);
      localStorage.setItem(MORPHOLOGY_KEY, "false");
      setCommentaryPositionState("none");
      localStorage.setItem(COMMENTARY_POSITION_KEY, "none");
      return;
    }

    setThemeState("light");
    localStorage.setItem(THEME_KEY, "light");
    setViewModeState("verse");
    localStorage.setItem(VIEW_MODE_KEY, "verse");
    setShowCrossRefsState(true);
    localStorage.setItem(CROSS_REFS_KEY, "true");
    setShowInlineNotesState(true);
    localStorage.setItem(INLINE_NOTES_KEY, "true");
    setShowCommentaryLinksState(true);
    localStorage.setItem(COMMENTARY_LINKS_KEY, "true");
    setWordLookupEnabledState(true);
    localStorage.setItem(WORD_LOOKUP_KEY, "true");
    setShowLeftIconsState(true);
    localStorage.setItem(LEFT_ICONS_KEY, "true");
    setShowHeaderFooterState(true);
    localStorage.setItem(HEADER_FOOTER_KEY, "true");
    setShowFootnotesState(true);
    localStorage.setItem(FOOTNOTES_KEY, "true");
    setShowStrongNumbersState(true);
    localStorage.setItem(STRONG_NUMBERS_KEY, "true");
    setShowMorphologyState(true);
    localStorage.setItem(MORPHOLOGY_KEY, "true");
    setCommentaryPositionState("right");
    localStorage.setItem(COMMENTARY_POSITION_KEY, "right");
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
      viewMode, setViewMode, toggleViewMode,
      showStrongNumbers, setShowStrongNumbers, toggleShowStrongNumbers,
      showMorphology, setShowMorphology, toggleShowMorphology,
      showCrossRefs, setShowCrossRefs, toggleShowCrossRefs,
      showInlineNotes, setShowInlineNotes, toggleShowInlineNotes,
      showInlineCommentary, setShowInlineCommentary, toggleShowInlineCommentary,
      showCommentaryLinks, setShowCommentaryLinks, toggleShowCommentaryLinks,
      wordLookupEnabled, setWordLookupEnabled, toggleWordLookupEnabled,
      showHeaderFooter, setShowHeaderFooter,
      showUserHighlights, setShowUserHighlights,
      showFootnotes, setShowFootnotes,
      commentaryPosition, setCommentaryPosition,
      selectedFont, setSelectedFont,
      showLeftIcons, setShowLeftIcons,
      showCompareMode, setShowCompareMode,
      usageTemplate, setUsageTemplate, applyUsageTemplate,
    }}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}