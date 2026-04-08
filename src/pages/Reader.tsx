import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
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
import CommentsSidebar from "@/components/CommentsSidebar";

import LexiconPanel from "@/components/LexiconPanel";
import PeoplePanel from "@/components/PeoplePanel";
import DailyVerse from "@/components/DailyVerse";
import OnboardingTour from "@/components/OnboardingTour";
import Notepad from "@/components/Notepad";
import { useUserAnnotations } from "@/hooks/useUserAnnotations";
import ReaderSettingsBar from "@/components/ReaderSettingsBar";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, Menu, MessageCircle } from "lucide-react";

const CrossRefsPanel = lazy(() => import("@/components/CrossRefsPanel"));
const MedievalTheologiansPanel = lazy(() => import("@/components/MedievalTheologiansPanel"));
const NotebookPanel = lazy(() => import("@/components/NotebookPanel"));
const InterlinearView = lazy(() => import("@/components/InterlinearView"));

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
  const { fontSize } = useReaderSettings();

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
  const [showRightPanel, setShowRightPanel] = useState(false);

  const [showLexicon, setShowLexicon] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [userPanelTab, setUserPanelTab] = useState<UserPanelTab>("history");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(storedReading?.selectedVerse ?? null);
  const [lastFocusedVerse, setLastFocusedVerse] = useState<number | null>(storedReading?.verse ?? storedReading?.selectedVerse ?? null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteVerses, setNoteVerses] = useState<Set<number>>(new Set());
  const [crossRefVerses, setCrossRefVerses] = useState<Set<number>>(new Set());
  const [actionMenu, setActionMenu] = useState<{ verse: number; x: number; y: number } | null>(null);
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

  const jesusSpeechVerses = useMemo(() => {
    if (!ntBooks.has(currentBook) || verses.length === 0) return new Set<number>();

    const marked = new Set<number>();
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
  }, [currentBook, verses]);

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
    if (container && isContainerScrollable()) {
      return container.scrollTop;
    }
    return window.scrollY;
  }, [isContainerScrollable]);

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

  const fetchVerses = async (bookId: string, chapter: number) => {
    setLoading(true);
    const [versesRes, notesRes, crossRefsRes] = await Promise.all([
      supabase.from("bible_verses").select("verse_number, text").eq("book_id", bookId).eq("chapter", chapter).order("verse_number"),
      supabase.from("study_notes").select("verse_start").eq("book_id", bookId).eq("chapter", chapter),
      supabase.from("bible_cross_references").select("verse").eq("book_id", bookId).eq("chapter", chapter),
    ]);
    if (versesRes.data && !versesRes.error) {
      setVerses(versesRes.data.map((v) => ({ verse: v.verse_number, text: v.text })));
    } else {
      setVerses([]);
    }
    if (notesRes.data) setNoteVerses(new Set(notesRes.data.map((n: any) => n.verse_start)));
    if (crossRefsRes.data) setCrossRefVerses(new Set(crossRefsRes.data.map((r: any) => r.verse)));
    setLoading(false);
  };

  useEffect(() => { fetchVerses(currentBook, currentChapter); }, [currentBook, currentChapter]);

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
    // Abre notas manualmente para versos sem referências pré-carregadas
    setLastFocusedVerse(verseNum);
    setSelectedVerse((prev) => (prev === verseNum ? null : verseNum));
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

  const toggleIntelligencePanel = () => {
    if (!selectedVerse && !lastFocusedVerse) {
      const firstVerse = verses[0]?.verse || null;
      if (firstVerse) {
        setSelectedVerse(firstVerse);
        setLastFocusedVerse(firstVerse);
      }
    }
    setShowRightPanel((prev) => !prev);
  };

  const handleShareChapter = async () => {
    const shareText = `📖 ${book?.name} ${currentChapter} — Bíblia Alpha`;
    const shareUrl = `${window.location.origin}/?book=${currentBook}&chapter=${currentChapter}`;
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
      <div className="reader-shell min-h-screen flex w-full text-foreground">
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
          <div className="flex-1 flex flex-col min-w-0">
            {/* Compact top bar with sidebar trigger */}
            <header className="reader-topbar sticky top-0 z-40 h-12 flex items-center px-4 md:px-6 gap-3">
              <SidebarTrigger className="shrink-0 rounded-lg hover:bg-muted">
                <Menu className="w-4 h-4" />
              </SidebarTrigger>
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">
                  {book?.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentChapter}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className={`reader-icon-button ${showRightPanel ? "bg-muted text-foreground" : ""}`}
                  title="Comentários"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <ReaderSettingsBar />
                <button onClick={() => navigateChapter(-1)} className="reader-icon-button" aria-label="Capítulo anterior">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => navigateChapter(1)} className="reader-icon-button" aria-label="Próximo capítulo">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </header>

          {/* Reader content */}
          <main ref={readingContainerRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 md:px-10 pt-8 pb-24">
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
                <h1 className="text-2xl font-semibold text-foreground">
                  {book?.name} <span className="text-muted-foreground font-normal">{currentChapter}</span>
                </h1>
              </div>

              {/* Chapter Navigation */}
              <ChapterNavigation bookId={currentBook} chapter={currentChapter} onNavigate={goToChapter} />

              <div className="mt-6" />

              {/* Verses */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="reader-content reading-ai" style={{ fontSize: `${fontSize}px` }}>
                  {verses.map((v) => {
                    const speechClass = jesusSpeechVerses.has(v.verse)
                      ? "text-jesus"
                      : getSpeechClass(v.text, currentBook);
                    const hasNote = noteVerses.has(v.verse);
                    const hasCrossRef = crossRefVerses.has(v.verse);
                    const shouldShowInlineNotes = hasNote || hasCrossRef || selectedVerse === v.verse;
                    const hlColor = getHighlightColor(v.verse);
                    const fav = isFavorite(v.verse);
                    const pNote = hasPersonalNote(v.verse);
                    const hlBg = hlColor ? HIGHLIGHT_BG[hlColor] || "" : "";

                        return (
                        <span key={v.verse}>
                            <span
                              ref={(el) => { verseRefs.current[v.verse] = el; }}
                              className={`reader-verse cursor-pointer ${hlBg} rounded-md px-0.5 md:px-1 transition-colors align-baseline inline`}
                              onClick={() => handleVerseClick(v.verse)}
                            onContextMenu={(e) => handleVerseLongPress(v.verse, e)}
                            onTouchStart={(e) => {
                              const timer = setTimeout(() => handleVerseLongPress(v.verse, e), 500);
                              const clear = () => clearTimeout(timer);
                              e.currentTarget.addEventListener("touchend", clear, { once: true });
                              e.currentTarget.addEventListener("touchmove", clear, { once: true });
                            }}
                          >
                              <sup
                                className={`verse-number text-[0.7em] align-super mr-1 font-semibold text-primary ${hasNote ? "!text-primary" : ""} ${fav ? "!text-destructive" : ""} ${pNote ? "!text-accent" : ""}`}
                              >
                              {v.verse}{fav && "♥"}
                            </sup>
                            <span className={speechClass}>{v.text}</span>
                            {hasCrossRef && (
                              <button
                                className="ml-1 align-super text-[10px] font-sans underline underline-offset-2 decoration-primary/50 text-primary/90 hover:text-primary cursor-pointer transition-colors"
                                onClick={() => handleVerseClick(v.verse)}
                                aria-label={`Ver referências do versículo ${v.verse}`}
                              >
                                ↗
                              </button>
                            )}
                          </span>
                        </span>
                      );
                    })}
                    {verses.length === 0 && (
                      <p className="text-center text-foreground font-sans text-sm">
                        Nenhum versículo encontrado.
                      </p>
                    )}
                  </div>
                )}

              {/* Chapter navigation */}
              <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
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
            </div>
          </main>
          </div>

          {/* Persistent Comments Sidebar */}
          <CommentsSidebar
            bookId={currentBook}
            chapter={currentChapter}
            selectedVerse={selectedVerse}
            onNavigate={goToChapter}
            open={showRightPanel}
            onClose={() => setShowRightPanel(false)}
          />
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
      
      <OnboardingTour />
    </SidebarProvider>
  );
};

export default Reader;
