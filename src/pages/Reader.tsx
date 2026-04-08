import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { bibleBooks } from "@/data/bibleBooks";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import ReaderSidebar from "@/components/ReaderSidebar";
import BookSelector from "@/components/BookSelector";
import SearchPanel from "@/components/SearchPanel";
import StudyNotesPanel from "@/components/StudyNotesPanel";
import DictionaryPanel from "@/components/DictionaryPanel";
import UserPanel from "@/components/UserPanel";
import BibleMapPanel from "@/components/BibleMapPanel";
import VerseActionMenu from "@/components/VerseActionMenu";
import ChapterNavigation from "@/components/ChapterNavigation";
import VerseCommentPopup from "@/components/VerseCommentPopup";

import LexiconPanel from "@/components/LexiconPanel";
import PeoplePanel from "@/components/PeoplePanel";
import DailyVerse from "@/components/DailyVerse";
import OnboardingTour from "@/components/OnboardingTour";
import Notepad from "@/components/Notepad";
import { useUserAnnotations } from "@/hooks/useUserAnnotations";
import ReaderSettingsBar from "@/components/ReaderSettingsBar";
import QuickAccessToolbar from "@/components/QuickAccessToolbar";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, Menu, MessageCircle, FileText, Search, BookOpen, Library, Map, Users, Keyboard, Star } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

import CrossReferenceLink from "@/components/CrossReferenceLink";
import BibleApplications from "@/components/BibleApplications";
import { githubBibleService, type ExternalBibleVersion } from "@/services/githubBibleService";

interface Verse {
  verse: number;
  text: string;
}

interface LastReadingState {
  bookId: string;
  chapter: number;
  verse?: number;
  selectedVerse?: number | null;
  scrollTop?: number;
  savedAt: string;
}

type UserPanelTab = "goto" | "history" | "favorites" | "data";

const BASE_TRANSLATION_KEY = "local:base";
const TRANSLATION_STORAGE_KEY = "biblia-alpha-text-translation";

const godSpeechPatterns = [
  /^Disse (?:mais )?(?:o )?(?:Senhor|Deus|SENHOR|Jeová)/i,
  /^E disse (?:o )?(?:Senhor|Deus|SENHOR)/i,
  /^Respondeu (?:o )?(?:Senhor|Deus|SENHOR)/i,
  /^Falou (?:mais )?(?:o )?(?:Senhor|Deus|SENHOR)/i,
  /^Disse-lhe (?:o )?(?:Senhor|Deus|SENHOR)/i,
  /^Ordenou (?:o )?(?:Senhor|Deus|SENHOR)/i,
  /^Assim diz (?:o )?(?:Senhor|Deus|SENHOR)/i,
  /^Palavra (?:do )?(?:Senhor|SENHOR)/i,
  /^Disse (?:Deus|o SENHOR):/i,
  /^E disse Deus:/i,
];

const jesusSpeechPatterns = [
  /^(?:E\s+)?[Dd]isse-?lhes?\s+(?:Jesus|ele|Ele)/i,
  /^(?:E\s+)?[Rr]espondeu-?lhes?\s+(?:Jesus|ele|Ele)/i,
  /^(?:E\s+)?[Jj]esus\s+(?:disse|respondeu|lhes disse|replicou|falou|exclamou|declarou|ensinou)/i,
  /^(?:E\s+)?[Dd]isse\s+(?:Jesus|o Senhor Jesus)/i,
  /^(?:E\s+)?[Rr]espondeu\s+(?:Jesus)/i,
  /^(?:E\s+)?[Tt]ornou\s+(?:Jesus)/i,
  /^(?:Então\s+)?Jesus\s+/i,
  /^Em verdade,?\s+em verdade/i,
  /^Eu\s+sou/i,
];

const nonJesusSpeechMarkers = [
  /^(?:E\s+)?(?:Pedro|Paulo|Pilatos|Herodes|Marta|Tomé|Filipe|Judas|fariseus|escribas|discípulos|multidão)\s+(?:disse|respondeu|perguntou|falaram)/i,
  /^(?:E\s+)?(?:Disse|Responderam|Perguntaram)\s+eles/i,
  /^(?:E\s+)?(?:Disse|Respondeu)\s+o\s+(?:sumo sacerdote|governador|centurião)/i,
];

const jesusContinuationPatterns = [
  /^[-—“"'«»]/,
  /^(?:Bem-aventurados|Ouvistes|Eu\s+porém\s+vos\s+digo|Se\s+alguém|Na\s+verdade\s+vos\s+digo|Porque\s+eu\s+vos\s+digo|Vinde\s+a\s+mim)/i,
];

const ntBooks = new Set(bibleBooks.filter((b) => b.testament === "new").map((b) => b.id));

const getSpeechClass = (text: string, bookId: string): string => {
  if (ntBooks.has(bookId)) {
    if (jesusSpeechPatterns.some((p) => p.test(text))) return "text-jesus";
  } else {
    if (godSpeechPatterns.some((p) => p.test(text))) return "text-god";
  }
  return "";
};

const HIGHLIGHT_BG: Record<string, string> = {
  yellow: "bg-yellow-200/60",
  green: "bg-green-200/60",
  blue: "bg-blue-200/60",
  pink: "bg-pink-200/60",
  orange: "bg-orange-200/60",
};

const Reader = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const readerSettings = useReaderSettings();
  const fontSize = readerSettings.fontSize;
  const viewMode = readerSettings.viewMode;
  const showCrossRefs = readerSettings.showCrossRefs;
  const showInlineNotes = readerSettings.showInlineNotes;
  const showHeaderFooter = readerSettings.showHeaderFooter;
  const showUserHighlights = readerSettings.showUserHighlights;
  const selectedFont = readerSettings.selectedFont;
  const usageTemplate = readerSettings.usageTemplate;

  const usageTemplateLabel = useMemo(() => {
    if (usageTemplate === "focus") return "Foco";
    if (usageTemplate === "study") return "Estudo";
    return "Padrão";
  }, [usageTemplate]);

  const lastReadingKey = user ? `biblia-alpha:last-reading:${user.id}` : null;

  const getStoredReading = (): LastReadingState | null => {
    if (!lastReadingKey || searchParams.has("book") || searchParams.has("chapter")) return null;

    try {
      const raw = localStorage.getItem(lastReadingKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as LastReadingState;
      const hasBook = typeof parsed.bookId === "string" && parsed.bookId.length > 0;
      const hasChapter = typeof parsed.chapter === "number" && parsed.chapter > 0;
      if (!hasBook || !hasChapter) return null;

      const bookMeta = bibleBooks.find((b) => b.id === parsed.bookId);
      if (!bookMeta) return null;

      return {
        ...parsed,
        chapter: Math.min(Math.max(parsed.chapter, 1), bookMeta.chapters),
      };
    } catch {
      return null;
    }
  };

  const storedReadingRef = useRef<LastReadingState | null>(getStoredReading());
  const storedReading = storedReadingRef.current;

  const [currentBook, setCurrentBook] = useState(searchParams.get("book") || storedReading?.bookId || "gn");
  const [currentChapter, setCurrentChapter] = useState(Number(searchParams.get("chapter")) || storedReading?.chapter || 1);
  const [showBooks, setShowBooks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showVerseCommentPopup, setShowVerseCommentPopup] = useState(false);
  const [showCompareMode, setShowCompareMode] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const [showLexicon, setShowLexicon] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [userPanelTab, setUserPanelTab] = useState<UserPanelTab>("history");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(storedReading?.selectedVerse ?? null);
  const [lastFocusedVerse, setLastFocusedVerse] = useState<number | null>(storedReading?.verse ?? storedReading?.selectedVerse ?? null);
  const [selectedTranslation, setSelectedTranslation] = useState<string>(() => localStorage.getItem(TRANSLATION_STORAGE_KEY) || BASE_TRANSLATION_KEY);
  const [availableTranslations, setAvailableTranslations] = useState<ExternalBibleVersion[]>([]);
  const [translationWarning, setTranslationWarning] = useState<string | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteVerses, setNoteVerses] = useState<Set<number>>(new Set());
  const [crossRefVerses, setCrossRefVerses] = useState<Set<number>>(new Set());
  const [jesusSpeechTableVerses, setJesusSpeechTableVerses] = useState<Set<number>>(new Set());
  const [actionMenu, setActionMenu] = useState<{ verse: number; x: number; y: number } | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [navHistory, setNavHistory] = useState<Array<{ bookId: string; chapter: number; verse?: number }>>([]);
  const verseRefs = useRef<Record<number, HTMLElement | null>>({});
  const readingContainerRef = useRef<HTMLElement | null>(null);
  const restoreTargetRef = useRef<{ verse?: number; scrollTop?: number } | null>(
    storedReading
      ? {
          verse: storedReading.verse ?? storedReading.selectedVerse ?? undefined,
          scrollTop: storedReading.scrollTop,
        }
      : null
  );

  const book = bibleBooks.find((b) => b.id === currentBook);

  const selectedTranslationLabel = useMemo(() => {
    if (selectedTranslation === BASE_TRANSLATION_KEY) return "Bíblia Alpha (Base)";
    const found = availableTranslations.find((item) => item.key === selectedTranslation);
    return found?.label || selectedTranslation.toUpperCase();
  }, [selectedTranslation, availableTranslations]);

  const jesusSpeechVerses = useMemo(() => {
    if (!ntBooks.has(currentBook) || verses.length === 0) return new Set<number>();

    const marked = new Set<number>(jesusSpeechTableVerses);
    let jesusContextOpen = false;

    for (const v of verses) {
      const text = (v.text || "").trim();
      const explicitJesus = jesusSpeechPatterns.some((pattern) => pattern.test(text));
      const explicitNonJesus = nonJesusSpeechMarkers.some((pattern) => pattern.test(text));

      if (explicitJesus) {
        marked.add(v.verse);
        jesusContextOpen = true;
        continue;
      }

      if (jesusContextOpen) {
        if (explicitNonJesus) {
          jesusContextOpen = false;
          continue;
        }

        if (jesusContinuationPatterns.some((pattern) => pattern.test(text))) {
          marked.add(v.verse);
          continue;
        }

        jesusContextOpen = false;
      }
    }

    return marked;
  }, [currentBook, verses, jesusSpeechTableVerses]);

  const {
    highlights, personalNotes, favorites,
    toggleHighlight, toggleFavorite, savePersonalNote, recordReading,
  } = useUserAnnotations(currentBook, currentChapter);

  const isContainerScrollable = useCallback(() => {
    const container = readingContainerRef.current;
    if (!container) return false;
    return container.scrollHeight - container.clientHeight > 4;
  }, []);

  const getCurrentScrollTop = useCallback(() => {
    const container = readingContainerRef.current;
    if (container && container.scrollHeight > container.clientHeight) {
      return container.scrollTop;
    }
    return window.scrollY;
  }, []);

  const getClosestVisibleVerse = useCallback(() => {
    const container = readingContainerRef.current;
    const viewportTop = container && isContainerScrollable()
      ? container.getBoundingClientRect().top
      : 120;

    let closestVerse: number | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    Object.entries(verseRefs.current).forEach(([verseKey, element]) => {
      if (!element) return;
      const distance = Math.abs(element.getBoundingClientRect().top - viewportTop);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestVerse = Number(verseKey);
      }
    });

    return closestVerse;
  }, [isContainerScrollable]);

  const persistLastReading = useCallback((override: Partial<LastReadingState> = {}) => {
    if (!lastReadingKey) return;

    const fallbackVerse = lastFocusedVerse ?? selectedVerse ?? getClosestVisibleVerse() ?? undefined;

    const payload: LastReadingState = {
      bookId: override.bookId ?? currentBook,
      chapter: override.chapter ?? currentChapter,
      verse: override.verse ?? fallbackVerse,
      selectedVerse: override.selectedVerse ?? selectedVerse,
      scrollTop: override.scrollTop ?? getCurrentScrollTop(),
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(lastReadingKey, JSON.stringify(payload));
  }, [lastReadingKey, currentBook, currentChapter, lastFocusedVerse, selectedVerse, getClosestVisibleVerse, getCurrentScrollTop]);

  const scrollReaderToTop = useCallback(() => {
    const container = readingContainerRef.current;
    if (container && isContainerScrollable()) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isContainerScrollable]);

  useEffect(() => {
    let active = true;

    githubBibleService
      .getSupportedVersions()
      .then((versions) => {
        if (active) setAvailableTranslations(versions);
      })
      .catch((err) => {
        console.error("Falha ao carregar traduções externas:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(TRANSLATION_STORAGE_KEY, selectedTranslation);
  }, [selectedTranslation]);

  const fetchVerses = async (bookId: string, chapter: number) => {
    setLoading(true);

    const notesPromise = supabase.from("study_notes").select("verse_start").eq("book_id", bookId).eq("chapter", chapter);
    const crossRefsPromise = supabase.from("bible_cross_references").select("verse").eq("book_id", bookId).eq("chapter", chapter);
    const jesusSpeechPromise = ntBooks.has(bookId)
      ? supabase.from("jesus_speech").select("verse").eq("book_id", bookId).eq("chapter", chapter)
      : Promise.resolve({ data: [] as Array<{ verse: number | null }>, error: null });

    let resolvedVerses: Verse[] = [];

    if (selectedTranslation === BASE_TRANSLATION_KEY) {
      const versesRes = await supabase
        .from("bible_verses")
        .select("verse_number, text")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .order("verse_number");

      if (versesRes.data && !versesRes.error) {
        resolvedVerses = versesRes.data.map((v) => ({ verse: v.verse_number, text: v.text }));
      }
      setTranslationWarning(null);
    } else {
      try {
        resolvedVerses = await githubBibleService.getChapter(selectedTranslation, bookId, chapter);
        setTranslationWarning(null);
      } catch (externalErr) {
        console.error("Falha na fonte externa, voltando para base local:", externalErr);

        const fallback = await supabase
          .from("bible_verses")
          .select("verse_number, text")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .order("verse_number");

        if (fallback.data && !fallback.error) {
          resolvedVerses = fallback.data.map((v) => ({ verse: v.verse_number, text: v.text }));
        }

        setTranslationWarning("A tradução externa não respondeu para este trecho. Exibindo base local.");
      }
    }

    const [notesRes, crossRefsRes, jesusSpeechRes] = await Promise.all([notesPromise, crossRefsPromise, jesusSpeechPromise]);

    setVerses(resolvedVerses);

    if (notesRes.data) {
      const verseStarts = notesRes.data
        .map((n) => n.verse_start)
        .filter((value): value is number => typeof value === "number");
      setNoteVerses(new Set(verseStarts));
    }
    if (crossRefsRes.data) {
      const crossRefVerseNumbers = crossRefsRes.data
        .map((r) => r.verse)
        .filter((value): value is number => typeof value === "number");
      setCrossRefVerses(new Set(crossRefVerseNumbers));
    }

    if (jesusSpeechRes.data) {
      const jesusVerseNumbers = jesusSpeechRes.data
        .map((r) => r.verse)
        .filter((value): value is number => typeof value === "number");
      setJesusSpeechTableVerses(new Set(jesusVerseNumbers));
    } else {
      setJesusSpeechTableVerses(new Set());
    }

    if (jesusSpeechRes.error) {
      console.warn("Falha ao carregar marcação de falas de Jesus:", jesusSpeechRes.error);
    }

    setLoading(false);
  };

  useEffect(() => { fetchVerses(currentBook, currentChapter); }, [currentBook, currentChapter, selectedTranslation]);

  useEffect(() => {
    setShowVerseCommentPopup(false);
  }, [currentBook, currentChapter]);

  useEffect(() => {
    if (!loading && verses.length > 0) recordReading();
  }, [currentBook, currentChapter, loading, verses.length, recordReading]);

  useEffect(() => {
    if (!lastReadingKey) return;
    persistLastReading();
  }, [lastReadingKey, currentBook, currentChapter, selectedVerse, lastFocusedVerse, persistLastReading]);

  useEffect(() => {
    if (!lastReadingKey) return;

    const handleBeforeUnload = () => {
      persistLastReading();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [lastReadingKey, persistLastReading]);

  useEffect(() => {
    if (!lastReadingKey) return;

    const container = readingContainerRef.current;
    let scrollTimer: number | undefined;

    const onScroll = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => persistLastReading(), 180);
    };

    const useContainer = container && isContainerScrollable();
    if (useContainer) {
      container.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    return () => {
      window.clearTimeout(scrollTimer);
      if (useContainer) {
        container.removeEventListener("scroll", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
      }
    };
  }, [lastReadingKey, currentBook, currentChapter, persistLastReading, isContainerScrollable]);

  useEffect(() => {
    const container = readingContainerRef.current;
    let hideTimer: number | undefined;
    let lastScrollTop = getCurrentScrollTop();

    const inactivityDelayMs = 5000;
    const readingThreshold = 96;

    const clearHideTimer = () => {
      window.clearTimeout(hideTimer);
    };

    const isInReadingZone = () => getCurrentScrollTop() > readingThreshold;

    const revealHeaderAndFooter = () => {
      setIsHeaderVisible(true);
      setIsFooterVisible(true);
    };

    const scheduleHide = () => {
      clearHideTimer();

      if (!isInReadingZone()) {
        return;
      }

      hideTimer = window.setTimeout(() => {
        if (isInReadingZone()) {
          setIsHeaderVisible(false);
          setIsFooterVisible(false);
        }
      }, inactivityDelayMs);
    };

    const onUserInteraction = () => {
      revealHeaderAndFooter();
      scheduleHide();
    };

    const onScroll = () => {
      const currentScrollTop = getCurrentScrollTop();
      const isScrollingUp = currentScrollTop < lastScrollTop;
      lastScrollTop = currentScrollTop;

      if (isScrollingUp || currentScrollTop <= readingThreshold) {
        setIsHeaderVisible(true);
        setIsFooterVisible(true);
      } else {
        revealHeaderAndFooter();
      }

      scheduleHide();
    };

    revealHeaderAndFooter();
    scheduleHide();

    const useContainer = container && isContainerScrollable();
    if (useContainer) {
      container.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    let lastMouseMoveAt = 0;
    const onMouseMove = () => {
      const now = Date.now();
      if (now - lastMouseMoveAt < 160) return;
      lastMouseMoveAt = now;
      onUserInteraction();
    };

    const interactionEvents: Array<keyof WindowEventMap> = ["touchstart", "pointerdown", "keydown", "wheel"];

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    interactionEvents.forEach((eventName) => {
      const passive = eventName !== "keydown";
      window.addEventListener(eventName, onUserInteraction, { passive });
    });

    return () => {
      clearHideTimer();
      if (useContainer) {
        container.removeEventListener("scroll", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
      }

      window.removeEventListener("mousemove", onMouseMove);

      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onUserInteraction);
      });
    };
  }, [getCurrentScrollTop, isContainerScrollable]);

  useEffect(() => {
    if (loading || verses.length === 0) return;

    const target = restoreTargetRef.current;
    if (!target) return;

    const container = readingContainerRef.current;
    const timeout = window.setTimeout(() => {
      if (target.verse && verseRefs.current[target.verse]) {
        verseRefs.current[target.verse]?.scrollIntoView({ behavior: "auto", block: "center" });
      } else if (typeof target.scrollTop === "number") {
        if (container && isContainerScrollable()) {
          container.scrollTo({ top: target.scrollTop, behavior: "auto" });
        } else {
          window.scrollTo({ top: target.scrollTop, behavior: "auto" });
        }
      }

      restoreTargetRef.current = null;
    }, 60);

    return () => window.clearTimeout(timeout);
  }, [loading, verses.length, currentBook, currentChapter, isContainerScrollable]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // F-keys para novos painéis (estilo TheWord)
      if (e.key === "F11") {
        e.preventDefault();
        setShowBooks(true);
        return;
      }
      if (e.key === "F12") {
        e.preventDefault();
        setShowNotes(true);
        return;
      }
      if (e.key === "F10") {
        e.preventDefault();
        setShowSearch(true);
        return;
      }
      if (e.key === "F9") {
        e.preventDefault();
        setShowDictionary(true);
        return;
      }
      if (e.key === "F8") {
        e.preventDefault();
        openUserPanel("goto");
        return;
      }
      if (e.key === "F3") {
        e.preventDefault();
        setShowSearch(true);
        return;
      }

      // Ctrl combinations
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        // Abrir configurações - já temos o botão na toolbar
        return;
      }
      if (e.ctrlKey && e.key === "t") {
        e.preventDefault();
        readerSettings.setShowLeftIcons(!readerSettings.showLeftIcons);
        return;
      }
      if (e.ctrlKey && e.key === "g") {
        e.preventDefault();
        openUserPanel("goto");
        return;
      }

      // Toggle options (um único caractere - estilo TheWord)
      switch (e.key.toLowerCase()) {
        case "p":
          readerSettings.setViewMode(viewMode === "paragraph" ? "verse" : "paragraph");
          break;
        case "s":
          readerSettings.setShowStrongNumbers();
          break;
        case "m":
          readerSettings.setShowMorphology();
          break;
        case "x":
          readerSettings.setShowCrossRefs();
          break;
        case "n":
          readerSettings.setShowInlineNotes();
          break;
        case "l":
          readerSettings.setShowCommentaryLinks();
          break;
        case "d":
          readerSettings.setWordLookupEnabled();
          break;
        case "q":
          readerSettings.setShowHeaderFooter();
          break;
        case "u":
          readerSettings.setShowUserHighlights();
          break;
        case "f":
          readerSettings.setShowFootnotes();
          break;
        case "j":
          // Palavra de Jesus - highlight especial
          break;
        case "o":
          // Citações do AT
          break;
        case "c":
          readerSettings.setCommentaryPosition(readerSettings.commentaryPosition === "below" ? "none" : "below");
          break;
        case "t":
          readerSettings.setCommentaryPosition(readerSettings.commentaryPosition === "right" ? "none" : "right");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readerSettings, viewMode]);

  const goToChapter = useCallback((bookId: string, chapter: number, verse?: number) => {
    if (bookId !== currentBook || chapter !== currentChapter) {
      setNavHistory((prev) => [...prev, { bookId: currentBook, chapter: currentChapter }]);
    }

    setCurrentBook(bookId);
    setCurrentChapter(chapter);

    if (verse) {
      setLastFocusedVerse(verse);
      setTimeout(() => {
        const el = verseRefs.current[verse];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    } else {
      scrollReaderToTop();
    }
  }, [currentBook, currentChapter, scrollReaderToTop]);

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<{ bookId: string; chapter: number; verse?: number }>;
      const { bookId, chapter, verse } = customEvent.detail || {};
      if (!bookId || !chapter) return;
      goToChapter(bookId, chapter, verse);
    };

    window.addEventListener("navigate-to-verse", handleNavigate);
    return () => window.removeEventListener("navigate-to-verse", handleNavigate);
  }, [goToChapter]);

  const goBack = () => {
    if (navHistory.length === 0) return;
    const prev = navHistory[navHistory.length - 1];
    setNavHistory((h) => h.slice(0, -1));
    setCurrentBook(prev.bookId);
    setCurrentChapter(prev.chapter);

    if (prev.verse) {
      setLastFocusedVerse(prev.verse);
      setTimeout(() => {
        const el = verseRefs.current[prev.verse!];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    } else {
      scrollReaderToTop();
    }
  };

  const navigateChapter = (direction: -1 | 1) => {
    if (!book) return;
    const newChapter = currentChapter + direction;
    if (newChapter >= 1 && newChapter <= book.chapters) {
      goToChapter(currentBook, newChapter);
    } else {
      const idx = bibleBooks.findIndex((b) => b.id === currentBook);
      if (direction === 1 && idx < bibleBooks.length - 1) {
        goToChapter(bibleBooks[idx + 1].id, 1);
      } else if (direction === -1 && idx > 0) {
        const prevBook = bibleBooks[idx - 1];
        goToChapter(prevBook.id, prevBook.chapters);
      }
    }
  };

  const handleVerseClick = (verseNum: number) => {
    setLastFocusedVerse(verseNum);
    const newSelectedVerse = selectedVerse === verseNum ? null : verseNum;
    setSelectedVerse(newSelectedVerse);

    if (newSelectedVerse) {
      setShowVerseCommentPopup(true);
    } else {
      setShowVerseCommentPopup(false);
    }
  };

  const handleVerseLongPress = (verseNum: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setLastFocusedVerse(verseNum);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setActionMenu({ verse: verseNum, x: clientX, y: clientY });
  };

  const getHighlightColor = (verse: number) => {
    const hl = highlights.find((h) => h.verse === verse);
    return hl ? hl.color : null;
  };

  const isFavorite = (verse: number) => favorites.some((f) => f.verse === verse);
  const getPersonalNote = (verse: number) => personalNotes.find((n) => n.verse === verse)?.content || "";
  const hasPersonalNote = (verse: number) => personalNotes.some((n) => n.verse === verse);

  const openUserPanel = (tab: UserPanelTab) => {
    setUserPanelTab(tab);
    setShowUserPanel(true);
  };

  const handleShareChapter = async () => {
    const shareText = `📖 ${book?.name} ${currentChapter} — Bíblia Alpha`;
    const shareUrl = `${window.location.origin}/biblia?book=${currentBook}&chapter=${currentChapter}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, text: shareText, url: shareUrl });
      } catch (error) {
        console.warn("Compartilhamento cancelado ou indisponível:", error);
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    }
  };

  return (
    <SidebarProvider>
      <div className={cn("reader-shell min-h-screen flex w-full text-foreground", `reader-template-${usageTemplate === "focus" ? "focus" : usageTemplate === "study" ? "study" : "default"}`)}>
        <ReaderSidebar
          onToggleSearch={() => setShowSearch(!showSearch)}
          onToggleBookSelector={() => setShowBooks(!showBooks)}
          onToggleNotes={() => { setSelectedVerse(null); setShowNotes((p) => !p); }}
          onToggleDictionary={() => setShowDictionary(!showDictionary)}
          onToggleHistory={() => openUserPanel("history")}
          onToggleFavorites={() => openUserPanel("favorites")}
          onToggleGoTo={() => openUserPanel("goto")}
          onToggleReset={() => openUserPanel("data")}
          onToggleMap={() => setShowMap(!showMap)}
          onShare={handleShareChapter}
          onToggleLexicon={() => setShowLexicon(!showLexicon)}
          onTogglePeople={() => setShowPeople(!showPeople)}
          onToggleNotepad={() => setShowNotepad(!showNotepad)}
        />

        <div className="flex-1 flex min-w-0 overflow-hidden">
          <QuickAccessToolbar
            onToggleSearch={() => setShowSearch((p) => !p)}
            onToggleBookSelector={() => setShowBooks((p) => !p)}
            onToggleNotes={() => setShowNotes((p) => !p)}
            onToggleDictionary={() => setShowDictionary((p) => !p)}
            onToggleHistory={() => openUserPanel("history")}
            onToggleFavorites={() => openUserPanel("favorites")}
            onToggleGoTo={() => openUserPanel("goto")}
            onToggleMap={() => setShowMap((p) => !p)}
            onToggleLexicon={() => setShowLexicon((p) => !p)}
            onTogglePeople={() => setShowPeople((p) => !p)}
            onToggleNotepad={() => setShowNotepad((p) => !p)}
            onToggleCompareMode={() => setShowCompareMode((p) => !p)}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <header
              className={cn(
                "sticky top-0 z-50 overflow-hidden transition-[max-height,opacity,transform,padding,border-color,background-color,box-shadow] duration-300 ease-out will-change-transform", 
                isHeaderVisible
                  ? "max-h-[220px] px-2 sm:px-3 pt-1.5 pb-1.5 bg-background/88 backdrop-blur-md border-b border-border/55 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.45)] opacity-100 translate-y-0"
                  : "max-h-0 px-2 sm:px-3 pt-0 pb-0 border-b-0 bg-transparent shadow-none opacity-0 -translate-y-2 pointer-events-none"
              )}
            >
              <div className="rounded-2xl border border-border/70 bg-card/85 shadow-sm reader-header-shell">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 px-2 md:px-3 py-2 border-b border-border/60">
                  <SidebarTrigger className="h-8 w-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                    <Menu className="w-4 h-4" />
                  </SidebarTrigger>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">Bíblia Alpha</p>
                    <p className="text-[11px] text-muted-foreground truncate">{book?.name} {currentChapter} • leitura inteligente</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="hidden xl:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] px-2 h-7 rounded-full border border-border/70 bg-background/60 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {usageTemplateLabel}
                    </span>

                    <select
                      value={selectedTranslation}
                      onChange={(e) => setSelectedTranslation(e.target.value)}
                      className="h-9 w-[152px] sm:w-[190px] rounded-md border border-border bg-background/85 px-2 text-[11px] text-foreground"
                      title="Escolher tradução bíblica"
                    >
                      <option value={BASE_TRANSLATION_KEY}>BASE • Bíblia Alpha</option>
                      {availableTranslations.map((version) => (
                        <option key={version.key} value={version.key}>
                          {version.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setCommandOpen(true)}
                      className="hidden md:inline-flex items-center gap-1.5 text-[11px] px-2.5 h-7 rounded-full border border-border bg-background/80 text-muted-foreground hover:text-foreground hover:border-primary/40"
                      type="button"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      Ctrl+K
                    </button>
                  </div>
                  <ReaderSettingsBar />
                </div>

                <div className="px-2 md:px-3 py-2 border-b border-border/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap">
                  {[
                    { label: "Biblioteca", action: () => setShowBooks(true) },
                    { label: "Busca", action: () => setShowSearch(true) },
                    { label: "Notas", action: () => setShowNotes(true) },
                    { label: "Dicionário", action: () => setShowDictionary(true) },
                    { label: "Comandos", action: () => setCommandOpen(true) },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="reader-menu-chip shrink-0"
                      onClick={item.action}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="px-2 md:px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button onClick={() => navigateChapter(-1)} className="reader-icon-button" aria-label="Capítulo anterior" type="button">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigateChapter(1)} className="reader-icon-button" aria-label="Próximo capítulo" type="button">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <button onClick={() => setShowSearch(true)} className="reader-icon-button" title="Buscar" type="button">
                    <Search className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowNotes(true)} className="reader-icon-button" title="Notas" type="button">
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowLexicon(true)} className="reader-icon-button" title="Léxico" type="button">
                    <Library className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowMap(true)} className="reader-icon-button" title="Mapa bíblico" type="button">
                    <Map className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowPeople(true)} className="reader-icon-button" title="Personagens" type="button">
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const targetVerse = selectedVerse ?? verses[0]?.verse ?? null;
                      if (!targetVerse) return;
                      setSelectedVerse(targetVerse);
                      setShowVerseCommentPopup((prev) => !prev || targetVerse !== selectedVerse);
                    }}
                    className={cn("reader-icon-button", showVerseCommentPopup && "bg-muted text-foreground")}
                    title="Comentário do versículo"
                    type="button"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <span className="ml-auto text-[11px] text-muted-foreground hidden md:block">{book?.abbrev?.toUpperCase()} {currentChapter}</span>
                </div>
              </div>
            </header>

            {/* Reader content */}
            <main ref={readingContainerRef} className="flex-1 overflow-y-auto">
              <div
                className={cn(
                  "mx-auto w-full px-3 sm:px-5 md:px-8 lg:px-12 xl:px-14 pt-6 sm:pt-8 pb-24 transition-all duration-300",
                  usageTemplate === "focus"
                    ? "max-w-[980px]"
                    : usageTemplate === "study"
                      ? "max-w-[1240px]"
                      : "max-w-[1100px]",
                )}
              >
              {/* Back button */}
              {navHistory.length > 0 && (
                <button
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
              )}

              {/* Chapter title */}
              <div className="mb-8">
                <p className="text-xs text-muted-foreground mb-1">
                  {book?.testament === "old" ? "Antigo Testamento" : "Novo Testamento"}
                </p>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {book?.name} <span className="text-muted-foreground font-normal">{currentChapter}</span>
                </h1>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tradução ativa: {selectedTranslationLabel}
                </p>
              </div>

              <div className="mb-6">
                <DailyVerse />
              </div>

              {/* Chapter Navigation */}
              <ChapterNavigation bookId={currentBook} chapter={currentChapter} onNavigate={goToChapter} />

              <div className="mt-6" />

              {/* Texto bíblico */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {showCompareMode && (
                    <div className="reader-surface p-3 text-xs text-muted-foreground">
                      Modo comparar ativado. A segunda tradução será liberada assim que houver múltiplas versões no banco.
                    </div>
                  )}

                  {translationWarning && (
                    <div className="reader-surface p-3 text-xs text-amber-700 bg-amber-100/60 border border-amber-300/40 rounded-lg">
                      {translationWarning}
                    </div>
                  )}

                  {viewMode === "paragraph" ? (
                    <article className="reader-main-paper reader-main-card p-5 sm:p-6 md:p-10" style={{ fontSize: `${fontSize}px` }}>
                      <div className="reader-content reader-content-flow text-reader-black select-text">
                        {verses.map((v) => {
                          const speechClass = jesusSpeechVerses.has(v.verse)
                            ? "text-jesus"
                            : getSpeechClass(v.text, currentBook);
                          const hasNote = noteVerses.has(v.verse);
                          const hasCrossRef = crossRefVerses.has(v.verse);
                          const hlColor = getHighlightColor(v.verse);
                          const fav = isFavorite(v.verse);
                          const pNote = hasPersonalNote(v.verse);
                          const hlBg = hlColor ? HIGHLIGHT_BG[hlColor] || "" : "";
                          const isActive = selectedVerse === v.verse;

                          return (
                            <span
                              key={v.verse}
                              ref={(el) => {
                                verseRefs.current[v.verse] = el;
                              }}
                              className={cn(
                                "reader-inline-verse inline cursor-pointer transition-colors",
                                hlBg,
                                isActive && "is-active text-[#3C166C]",
                              )}
                              onClick={() => handleVerseClick(v.verse)}
                              onContextMenu={(e) => handleVerseLongPress(v.verse, e)}
                            >
                              <sup className={cn("verse-number verse-reference-color font-semibold", isActive && "text-[#2F1257]")}>{v.verse}</sup>
                              <span className={cn("verse-text-lilac", speechClass)}>{v.text}</span>
                              {isActive && showInlineNotes && hasNote && <span className="ml-1 text-[10px] text-accent">✎</span>}
                              {isActive && fav && <span className="ml-1 text-[10px] text-destructive">♥</span>}
                              {isActive && pNote && <span className="ml-1 text-[10px] text-primary">●</span>}
                              {isActive && showCrossRefs && hasCrossRef && (
                                <CrossReferenceLink
                                  bookId={currentBook}
                                  chapter={currentChapter}
                                  verse={v.verse}
                                  className="inline-flex align-middle ml-1"
                                />
                              )}
                              {" "}
                            </span>
                          );
                        })}
                      </div>
                    </article>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2" style={{ fontSize: `${fontSize}px` }}>
                      {verses.map((v) => {
                        const speechClass = jesusSpeechVerses.has(v.verse)
                          ? "text-jesus"
                          : getSpeechClass(v.text, currentBook);
                        const hlColor = getHighlightColor(v.verse);
                        const hlBg = hlColor ? HIGHLIGHT_BG[hlColor] || "" : "";
                        const isActive = selectedVerse === v.verse;

                        return (
                          <div
                            key={v.verse}
                            ref={(el) => {
                              verseRefs.current[v.verse] = el;
                            }}
                            className={cn(
                              "reader-verse-line px-1 cursor-pointer transition-colors leading-[1.75]",
                              hlBg,
                              isActive && "text-[#3C166C] underline decoration-[#3C166C]/40 underline-offset-[3px]",
                            )}
                            onClick={() => handleVerseClick(v.verse)}
                            onContextMenu={(e) => handleVerseLongPress(v.verse, e)}
                            role="button"
                            tabIndex={0}
                          >
                            <sup className="verse-number verse-reference-color font-semibold">{v.verse}</sup>
                            <span className={cn("verse-text-lilac", speechClass)}>{v.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <BibleApplications />
                </div>
              )}
              

              {/* Chapter navigation */}
              <div className="mt-12 pt-6 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <button onClick={() => navigateChapter(-1)} className="reader-nav-button">
                    ← Anterior
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {book?.abbrev} {currentChapter}
                  </span>
                  <button onClick={() => navigateChapter(1)} className="reader-nav-button">
                    Próximo →
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowBooks(true)}
                    className="reader-book-nav-chip"
                    type="button"
                  >
                    📚 Livro
                  </button>
                  <button
                    onClick={() => openUserPanel("goto")}
                    className="reader-book-nav-chip"
                    type="button"
                  >
                    🔢 Ir p/ capítulo
                  </button>
                  <button
                    onClick={() => setShowSearch(true)}
                    className="reader-book-nav-chip"
                    type="button"
                  >
                    🔍 Busca
                  </button>
                  <button
                    onClick={() => setShowNotes(true)}
                    className="reader-book-nav-chip"
                    type="button"
                  >
                    📝 Notas
                  </button>
                  <button
                    onClick={scrollReaderToTop}
                    className="reader-book-nav-chip"
                    type="button"
                  >
                    ↑ Topo
                  </button>
                  <button
                    onClick={() => {
                      const container = readingContainerRef.current;
                      if (container && isContainerScrollable()) {
                        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
                      } else {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                      }
                    }}
                    className="reader-book-nav-chip"
                    type="button"
                  >
                    ↓ Rodapé
                  </button>
                </div>
              </div>
              </div>
            </main>

            {showHeaderFooter && (
              <footer className="h-8 border-t border-border/60 bg-card/70 text-muted-foreground px-3 text-[11px] flex items-center justify-between backdrop-blur">
                <span>{book?.name} {currentChapter}</span>
                <span>{verses.length} versículos • {selectedVerse ? `v.${selectedVerse} selecionado` : "pronto"}</span>
              </footer>
            )}
            </div>

          <VerseCommentPopup
            open={showVerseCommentPopup}
            bookId={currentBook}
            chapter={currentChapter}
            verse={selectedVerse}
            onNavigate={goToChapter}
            onClose={() => setShowVerseCommentPopup(false)}
            onOpenAllNotes={() => {
              setShowVerseCommentPopup(false);
              setShowNotes(true);
            }}
          />
        </div>
      </div>
      {/* Overlays */}
      {actionMenu && (
        <VerseActionMenu
          verse={actionMenu.verse}
          verseText={verses.find((v) => v.verse === actionMenu.verse)?.text || ""}
          bookName={book?.name || ""}
          chapter={currentChapter}
          x={actionMenu.x}
          y={actionMenu.y}
          isFavorite={isFavorite(actionMenu.verse)}
          highlightColor={getHighlightColor(actionMenu.verse)}
          existingNote={getPersonalNote(actionMenu.verse)}
          onClose={() => setActionMenu(null)}
          onToggleFavorite={() => toggleFavorite(actionMenu.verse)}
          onHighlight={(color) => toggleHighlight(actionMenu.verse, color)}
          onSaveNote={(content) => savePersonalNote(actionMenu.verse, content)}
        />
      )}

      <BookSelector open={showBooks} onClose={() => setShowBooks(false)} onSelect={goToChapter} currentBook={currentBook} currentChapter={currentChapter} />
      <SearchPanel open={showSearch} onClose={() => setShowSearch(false)} onNavigate={goToChapter} />
      <StudyNotesPanel open={showNotes} onClose={() => setShowNotes(false)} bookId={currentBook} chapter={currentChapter} selectedVerse={selectedVerse} onNavigate={goToChapter} />
      <DictionaryPanel open={showDictionary} onClose={() => setShowDictionary(false)} />
      <UserPanel open={showUserPanel} onClose={() => setShowUserPanel(false)} onNavigate={goToChapter} defaultTab={userPanelTab} />
      <BibleMapPanel open={showMap} onClose={() => setShowMap(false)} bookId={currentBook} chapter={currentChapter} onNavigate={goToChapter} />
      
      <LexiconPanel open={showLexicon} onClose={() => setShowLexicon(false)} />
      <PeoplePanel open={showPeople} onClose={() => setShowPeople(false)} />
      <Notepad open={showNotepad} onClose={() => setShowNotepad(false)} />

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Digite um comando ou painel..." />
        <CommandList>
          <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => { setShowBooks(true); setCommandOpen(false); }}>
              <BookOpen className="mr-2 h-4 w-4" />
              Escolher livro/capítulo
              <CommandShortcut>F11</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { navigateChapter(-1); setCommandOpen(false); }}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Capítulo anterior
            </CommandItem>
            <CommandItem onSelect={() => { navigateChapter(1); setCommandOpen(false); }}>
              <ChevronRight className="mr-2 h-4 w-4" />
              Próximo capítulo
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ferramentas de estudo">
            <CommandItem onSelect={() => { setShowSearch(true); setCommandOpen(false); }}>
              <Search className="mr-2 h-4 w-4" />
              Busca bíblica
              <CommandShortcut>F3</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setShowNotes(true); setCommandOpen(false); }}>
              <FileText className="mr-2 h-4 w-4" />
              Notas de estudo
            </CommandItem>
            <CommandItem onSelect={() => { setShowDictionary(true); setCommandOpen(false); }}>
              <BookOpen className="mr-2 h-4 w-4" />
              Dicionário bíblico
            </CommandItem>
            <CommandItem onSelect={() => { setShowLexicon(true); setCommandOpen(false); }}>
              <Library className="mr-2 h-4 w-4" />
              Léxico Strong
            </CommandItem>
            <CommandItem onSelect={() => { setShowMap(true); setCommandOpen(false); }}>
              <Map className="mr-2 h-4 w-4" />
              Mapa bíblico
            </CommandItem>
            <CommandItem onSelect={() => { setShowPeople(true); setCommandOpen(false); }}>
              <Users className="mr-2 h-4 w-4" />
              Personagens bíblicos
            </CommandItem>
            <CommandItem onSelect={() => { openUserPanel("history"); setCommandOpen(false); }}>
              <Keyboard className="mr-2 h-4 w-4" />
              Histórico de leitura
            </CommandItem>
            <CommandItem onSelect={() => { openUserPanel("favorites"); setCommandOpen(false); }}>
              <Star className="mr-2 h-4 w-4" />
              Favoritos
            </CommandItem>
            <CommandItem onSelect={() => { setShowNotepad(true); setCommandOpen(false); }}>
              <FileText className="mr-2 h-4 w-4" />
              Bloco de notas
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      
      <OnboardingTour />
    </SidebarProvider>
  );
};

export default Reader;
