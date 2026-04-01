import { useState, useEffect } from "react";
import { bibleBooks } from "@/data/bibleBooks";
import { supabase } from "@/integrations/supabase/client";
import ReaderHeader from "@/components/ReaderHeader";
import BookSelector from "@/components/BookSelector";
import SearchPanel from "@/components/SearchPanel";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Verse {
  verse: number;
  text: string;
}

const Reader = () => {
  const [currentBook, setCurrentBook] = useState("gn");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [showBooks, setShowBooks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  const book = bibleBooks.find((b) => b.id === currentBook);

  const fetchVerses = async (bookId: string, chapter: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bible_verses")
      .select("verse_number, text")
      .eq("book_id", bookId)
      .eq("chapter", chapter)
      .order("verse_number");

    if (data && !error) {
      setVerses(data.map((v) => ({ verse: v.verse_number, text: v.text })));
    } else {
      setVerses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVerses(currentBook, currentChapter);
  }, [currentBook, currentChapter]);

  const goToChapter = (bookId: string, chapter: number) => {
    setCurrentBook(bookId);
    setCurrentChapter(chapter);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  return (
    <div className="min-h-screen bg-background">
      <ReaderHeader
        onToggleSearch={() => setShowSearch(!showSearch)}
        onToggleBookSelector={() => setShowBooks(!showBooks)}
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

      {/* Reader content - PDF style */}
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

          {/* Verses */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="reader-content">
              {verses.map((v) => (
                <span key={v.verse}>
                  <sup className="verse-number">{v.verse}</sup>
                  {v.text}{" "}
                </span>
              ))}
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
        verses={verses}
        onVerseClick={() => {}}
      />
    </div>
  );
};

export default Reader;
