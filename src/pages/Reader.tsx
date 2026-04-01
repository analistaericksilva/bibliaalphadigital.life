import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { bibleBooks } from "@/data/bibleBooks";
import { supabase } from "@/integrations/supabase/client";
import ReaderHeader from "@/components/ReaderHeader";
import BookSelector from "@/components/BookSelector";
import SearchPanel from "@/components/SearchPanel";
import StudyNotesPanel from "@/components/StudyNotesPanel";
import DictionaryPanel from "@/components/DictionaryPanel";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Verse {
  verse: number;
  text: string;
}

interface InlineNote {
  verse_start: number;
  title: string | null;
  content: string;
}

// Patterns that indicate God speaking in OT
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

// Patterns for Jesus speaking in NT
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

const ntBooks = new Set(bibleBooks.filter(b => b.testament === "new").map(b => b.id));

const getSpeechClass = (text: string, bookId: string): string => {
  if (ntBooks.has(bookId)) {
    if (jesusSpeechPatterns.some(p => p.test(text))) return "text-jesus";
  } else {
    if (godSpeechPatterns.some(p => p.test(text))) return "text-god";
  }
  return "";
};

const Reader = () => {
  const [searchParams] = useSearchParams();
  const [currentBook, setCurrentBook] = useState(searchParams.get("book") || "gn");
  const [currentChapter, setCurrentChapter] = useState(Number(searchParams.get("chapter")) || 1);
  const [showBooks, setShowBooks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteVerses, setNoteVerses] = useState<Set<number>>(new Set());
  const [inlineNotes, setInlineNotes] = useState<Map<number, InlineNote>>(new Map());
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const verseRefs = useRef<Record<number, HTMLElement | null>>({});

  const book = bibleBooks.find((b) => b.id === currentBook);

  const fetchVerses = async (bookId: string, chapter: number) => {
    setLoading(true);
    setExpandedNotes(new Set());
    const [versesRes, notesRes] = await Promise.all([
      supabase
        .from("bible_verses")
        .select("verse_number, text")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .order("verse_number"),
      supabase
        .from("study_notes")
        .select("verse_start, title, content")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .order("verse_start"),
    ]);

    if (versesRes.data && !versesRes.error) {
      setVerses(versesRes.data.map((v) => ({ verse: v.verse_number, text: v.text })));
    } else {
      setVerses([]);
    }

    if (notesRes.data) {
      setNoteVerses(new Set(notesRes.data.map((n: any) => n.verse_start)));
      const notesMap = new Map<number, InlineNote>();
      notesRes.data.forEach((n: any) => {
        notesMap.set(n.verse_start, { verse_start: n.verse_start, title: n.title, content: n.content });
      });
      setInlineNotes(notesMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVerses(currentBook, currentChapter);
  }, [currentBook, currentChapter]);

  const goToChapter = (bookId: string, chapter: number, verse?: number) => {
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
    if (noteVerses.has(verseNum)) {
      setExpandedNotes(prev => {
        const next = new Set(prev);
        if (next.has(verseNum)) next.delete(verseNum);
        else next.add(verseNum);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ReaderHeader
        onToggleSearch={() => setShowSearch(!showSearch)}
        onToggleBookSelector={() => setShowBooks(!showBooks)}
        onToggleNotes={() => { setSelectedVerse(null); setShowNotes(!showNotes); }}
        onToggleDictionary={() => setShowDictionary(!showDictionary)}
      />

      {/* Navigation zones */}
      <div
        className="fixed top-0 left-0 h-full w-[12%] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-30 cursor-pointer text-muted-foreground"
        onClick={() => navigateChapter(-1)}
      >
        <ChevronLeft className="w-8 h-8" />
      </div>
      <div
        className="fixed top-0 right-0 h-full w-[12%] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-30 cursor-pointer text-muted-foreground"
        onClick={() => navigateChapter(1)}
      >
        <ChevronRight className="w-8 h-8" />
      </div>

      {/* Reader content */}
      <main className="max-w-3xl mx-auto px-6 md:px-12 pt-32 pb-48">
        <div className="bg-paper page-shadow rounded p-8 md:p-16 mb-8 animate-fade-in">
          {/* Chapter heading */}
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
          <div className="flex items-center justify-center gap-4 mb-8 text-[10px] font-sans tracking-wider">
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
              <span className="text-muted-foreground">TEM NOTA</span>
            </span>
          </div>

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
                return (
                  <span key={v.verse}>
                    <span
                      ref={(el) => { verseRefs.current[v.verse] = el; }}
                      className={`${hasNote ? "cursor-pointer hover:bg-primary/5 rounded px-0.5" : ""}`}
                      onClick={hasNote ? () => handleVerseClick(v.verse) : undefined}
                    >
                      <sup className={`verse-number ${hasNote ? "!text-primary !font-bold" : ""}`}>
                        {v.verse}
                      </sup>
                      <span className={speechClass}>{v.text}</span>{" "}
                    </span>
                    {hasNote && expandedNotes.has(v.verse) && inlineNotes.has(v.verse) && (
                      <span className="block my-2 mx-1 px-3 py-2 bg-primary/5 border-l-2 border-primary rounded-r text-xs font-sans text-foreground/80 leading-relaxed animate-fade-in">
                        {inlineNotes.get(v.verse)!.title && (
                          <span className="font-semibold text-primary mr-1">{inlineNotes.get(v.verse)!.title}:</span>
                        )}
                        {inlineNotes.get(v.verse)!.content}
                      </span>
                    )}
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
            <button
              onClick={() => navigateChapter(-1)}
              className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              ← ANTERIOR
            </button>
            <span className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground">
              {book?.abbrev} {currentChapter}
            </span>
            <button
              onClick={() => navigateChapter(1)}
              className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              PRÓXIMO →
            </button>
          </div>
        </div>
      </main>

      <BookSelector
        open={showBooks}
        onClose={() => setShowBooks(false)}
        onSelect={goToChapter}
        currentBook={currentBook}
        currentChapter={currentChapter}
      />

      <SearchPanel
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={goToChapter}
      />

      <StudyNotesPanel
        open={showNotes}
        onClose={() => setShowNotes(false)}
        bookId={currentBook}
        chapter={currentChapter}
        selectedVerse={selectedVerse}
      />

      <DictionaryPanel
        open={showDictionary}
        onClose={() => setShowDictionary(false)}
      />
    </div>
  );
};

export default Reader;
