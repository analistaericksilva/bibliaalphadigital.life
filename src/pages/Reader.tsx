import { useState, useEffect, useRef, useCallback } from "react";
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
import VersionComparePanel from "@/components/VersionComparePanel";
import DailyVerse from "@/components/DailyVerse";
import { useUserAnnotations } from "@/hooks/useUserAnnotations";
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, Menu } from "lucide-react";

interface Verse {
  verse: number;
  text: string;
}

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
  /^(?:E )?[Dd]isse-lhes? (?:Jesus|ele|Ele)/i,
  /^(?:E )?[Rr]espondeu-lhes? (?:Jesus|ele|Ele)/i,
  /^(?:E )?[Jj]esus (?:disse|respondeu|lhes disse)/i,
  /^(?:E )?[Dd]isse (?:Jesus|o Senhor Jesus)/i,
  /^(?:E )?[Rr]espondeu (?:Jesus)/i,
  /^(?:E )?[Tt]ornou (?:Jesus)/i,
  /^Eu sou/i,
  /^Em verdade,? em verdade/i,
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
  const [currentBook, setCurrentBook] = useState(searchParams.get("book") || "gn");
  const [currentChapter, setCurrentChapter] = useState(Number(searchParams.get("chapter")) || 1);
  const [showBooks, setShowBooks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [userPanelTab, setUserPanelTab] = useState("history");
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteVerses, setNoteVerses] = useState<Set<number>>(new Set());
  const [crossRefVerses, setCrossRefVerses] = useState<Set<number>>(new Set());
  const [actionMenu, setActionMenu] = useState<{ verse: number; x: number; y: number } | null>(null);
  const [navHistory, setNavHistory] = useState<Array<{ bookId: string; chapter: number; verse?: number }>>([]);
  const verseRefs = useRef<Record<number, HTMLElement | null>>({});

  const book = bibleBooks.find((b) => b.id === currentBook);

  const {
    highlights, personalNotes, favorites,
    toggleHighlight, toggleFavorite, savePersonalNote, recordReading,
  } = useUserAnnotations(currentBook, currentChapter);

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

  const goToChapter = useCallback((bookId: string, chapter: number, verse?: number) => {
    if (bookId !== currentBook || chapter !== currentChapter) {
      setNavHistory((prev) => [...prev, { bookId: currentBook, chapter: currentChapter }]);
    }
    setCurrentBook(bookId);
    setCurrentChapter(chapter);
    if (verse) {
      setTimeout(() => {
        const el = verseRefs.current[verse];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentBook, currentChapter]);

  const goBack = () => {
    if (navHistory.length === 0) return;
    const prev = navHistory[navHistory.length - 1];
    setNavHistory((h) => h.slice(0, -1));
    setCurrentBook(prev.bookId);
    setCurrentChapter(prev.chapter);
    if (prev.verse) {
      setTimeout(() => {
        const el = verseRefs.current[prev.verse!];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    setSelectedVerse(verseNum);
    setShowNotes(true);
  };

  const handleVerseLongPress = (verseNum: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
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

  const openUserPanel = (tab: string) => {
    setUserPanelTab(tab);
    setShowUserPanel(true);
  };

  const handleShareChapter = async () => {
    const shareText = `📖 ${book?.name} ${currentChapter} — Bíblia Alpha`;
    const shareUrl = `${window.location.origin}/?book=${currentBook}&chapter=${currentChapter}`;
    if (navigator.share) {
      try { await navigator.share({ title: shareText, text: shareText, url: shareUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ReaderSidebar
          onToggleSearch={() => setShowSearch(!showSearch)}
          onToggleBookSelector={() => setShowBooks(!showBooks)}
          onToggleNotes={() => { setSelectedVerse(null); setShowNotes(!showNotes); }}
          onToggleDictionary={() => setShowDictionary(!showDictionary)}
          onToggleHistory={() => openUserPanel("history")}
          onToggleFavorites={() => openUserPanel("favorites")}
          onToggleGoTo={() => openUserPanel("goto")}
          onToggleMap={() => setShowMap(!showMap)}
          onShare={handleShareChapter}
          onToggleCompare={() => setShowCompare(!showCompare)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Compact top bar with sidebar trigger */}
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border h-12 flex items-center px-4 gap-3">
            <SidebarTrigger className="shrink-0">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="flex items-baseline gap-2 overflow-hidden">
              <span className="text-sm tracking-[0.2em] font-serif font-medium text-foreground truncate">
                {book?.name}
              </span>
              <span className="text-xs font-sans text-muted-foreground shrink-0">
                Cap. {currentChapter}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => navigateChapter(-1)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => navigateChapter(1)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Reader content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 md:px-12 pt-8 pb-32">
              {/* Daily Verse */}
              <div className="mb-8 animate-fade-in">
                <DailyVerse />
              </div>

              <div className="bg-paper page-shadow rounded p-8 md:p-16 mb-8 animate-fade-in">
                {/* Back button */}
                {navHistory.length > 0 && (
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] font-sans text-primary hover:text-primary/80 transition-colors mb-4"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    VOLTAR AO TEXTO ANTERIOR
                  </button>
                )}

                <div className="text-center mb-12">
                  <p className="text-[9px] tracking-[0.4em] text-muted-foreground font-sans mb-2">
                    {book?.testament === "old" ? "ANTIGO TESTAMENTO" : "NOVO TESTAMENTO"}
                  </p>
                  <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-1">
                    {book?.name}
                  </h1>
                  <p className="text-lg text-muted-foreground font-serif">Capítulo {currentChapter}</p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-[10px] font-sans tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--god))]" />
                    <span className="text-muted-foreground">DEUS FALA</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[hsl(var(--jesus))]" />
                    <span className="text-muted-foreground">JESUS FALA</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">NOTA DE ESTUDO</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">FAVORITO</span>
                  </span>
                </div>

                <p className="text-[9px] text-center text-muted-foreground font-sans mb-6 tracking-wide">
                  Clique longo em qualquer versículo para grifar, favoritar ou anotar
                </p>

                {/* Verses */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="reader-content">
                    {verses.map((v) => {
                      const speechClass = getSpeechClass(v.text, currentBook);
                      const hasNote = noteVerses.has(v.verse);
                      const hlColor = getHighlightColor(v.verse);
                      const fav = isFavorite(v.verse);
                      const pNote = hasPersonalNote(v.verse);
                      const hlBg = hlColor ? HIGHLIGHT_BG[hlColor] || "" : "";

                      return (
                        <span key={v.verse}>
                          <span
                            ref={(el) => { verseRefs.current[v.verse] = el; }}
                            className={`cursor-pointer ${hlBg} rounded px-0.5 transition-colors`}
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
                              className={`verse-number ${hasNote ? "!text-primary !font-bold" : ""} ${fav ? "!text-destructive !font-bold" : ""} ${pNote ? "!text-accent !underline" : ""}`}
                            >
                              {v.verse}{fav && "♥"}
                            </sup>
                            <span className={speechClass}>{v.text}</span>{" "}
                          </span>
                        </span>
                      );
                    })}
                    {verses.length === 0 && (
                      <p className="text-center text-muted-foreground font-sans text-sm">
                        Nenhum versículo encontrado.
                      </p>
                    )}
                  </div>
                )}

                {/* Chapter navigation */}
                <div className="flex items-center justify-between mt-16 pt-8 border-t border-border">
                  <button onClick={() => navigateChapter(-1)} className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground hover:text-foreground transition-colors">
                    ← ANTERIOR
                  </button>
                  <span className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground">
                    {book?.abbrev} {currentChapter}
                  </span>
                  <button onClick={() => navigateChapter(1)} className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground hover:text-foreground transition-colors">
                    PRÓXIMO →
                  </button>
                </div>
              </div>
            </div>
          </main>
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
      <VersionComparePanel open={showCompare} onClose={() => setShowCompare(false)} bookId={currentBook} chapter={currentChapter} selectedVerse={selectedVerse} />
    </SidebarProvider>
  );
};

export default Reader;
