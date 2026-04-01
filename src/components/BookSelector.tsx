import { useState, useEffect } from "react";
import { bibleBooks } from "@/data/bibleBooks";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface BookSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (bookId: string, chapter: number, verse?: number) => void;
  currentBook: string;
  currentChapter: number;
}

const BookSelector = ({ open, onClose, onSelect, currentBook, currentChapter }: BookSelectorProps) => {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verseCount, setVerseCount] = useState(0);
  const [loadingVerses, setLoadingVerses] = useState(false);

  if (!open) return null;

  const selectedBook = bibleBooks.find((b) => b.id === selectedBookId);
  const oldTestament = bibleBooks.filter((b) => b.testament === "old");
  const newTestament = bibleBooks.filter((b) => b.testament === "new");

  const handleChapterClick = async (ch: number) => {
    setSelectedChapter(ch);
    setLoadingVerses(true);
    const { count } = await supabase
      .from("bible_verses")
      .select("*", { count: "exact", head: true })
      .eq("book_id", selectedBookId!)
      .eq("chapter", ch);
    setVerseCount(count || 0);
    setLoadingVerses(false);
  };

  const handleBack = () => {
    if (selectedChapter) {
      setSelectedChapter(null);
    } else if (selectedBookId) {
      setSelectedBookId(null);
    } else {
      onClose();
    }
  };

  const breadcrumb = selectedBookId
    ? selectedChapter
      ? `${selectedBook?.name} > Cap. ${selectedChapter} > Versículo`
      : `${selectedBook?.name} > Capítulo`
    : "LIVROS";

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 transition-app animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground truncate">
              {selectedBookId ? breadcrumb.toUpperCase() : "LIVROS"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-64px)]">
          {selectedBookId && selectedChapter ? (
            /* Verse selection */
            <div className="p-4">
              <button
                onClick={() => {
                  onSelect(selectedBookId, selectedChapter);
                  onClose();
                  setSelectedBookId(null);
                  setSelectedChapter(null);
                }}
                className="w-full mb-4 py-3 text-sm font-sans rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Ir para o capítulo inteiro
              </button>
              <p className="text-[9px] tracking-[0.3em] text-muted-foreground mb-3 font-sans">IR PARA O VERSÍCULO</p>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: verseCount }, (_, i) => i + 1).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      onSelect(selectedBookId, selectedChapter, v);
                      onClose();
                      setSelectedBookId(null);
                      setSelectedChapter(null);
                    }}
                    className="py-3 text-sm font-sans rounded bg-muted text-foreground hover:bg-primary/10 transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ) : selectedBookId && selectedBook ? (
            /* Chapter selection */
            <div className="p-4 grid grid-cols-5 gap-2">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChapterClick(ch)}
                  className={`py-3 text-sm font-sans rounded transition-colors ${
                    currentBook === selectedBookId && currentChapter === ch
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-primary/10"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          ) : (
            /* Book list */
            <div className="p-4">
              <p className="text-[9px] tracking-[0.3em] text-muted-foreground mb-3 font-sans">ANTIGO TESTAMENTO</p>
              <div className="grid grid-cols-2 gap-1 mb-6">
                {oldTestament.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBookId(book.id)}
                    className={`text-left px-3 py-2 text-sm font-sans rounded transition-colors ${
                      currentBook === book.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
              <p className="text-[9px] tracking-[0.3em] text-muted-foreground mb-3 font-sans">NOVO TESTAMENTO</p>
              <div className="grid grid-cols-2 gap-1">
                {newTestament.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBookId(book.id)}
                    className={`text-left px-3 py-2 text-sm font-sans rounded transition-colors ${
                      currentBook === book.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {book.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
};

export default BookSelector;
