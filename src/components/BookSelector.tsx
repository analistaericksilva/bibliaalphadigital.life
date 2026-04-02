import { useState } from "react";
import { bibleBooks } from "@/data/bibleBooks";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [viewMode, setViewMode] = useState<"testament" | "group">("testament");

  if (!open) return null;

  const selectedBook = bibleBooks.find((b) => b.id === selectedBookId);

  // Group books by their group field
  const booksByGroup = bibleBooks.reduce<Record<string, typeof bibleBooks>>((acc, book) => {
    const group = book.group || (book.testament === "old" ? "Antigo Testamento" : "Novo Testamento");
    if (!acc[group]) acc[group] = [];
    acc[group].push(book);
    return acc;
  }, {});

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

  const renderBookButton = (book: typeof bibleBooks[0]) => (
    <button
      key={book.id}
      onClick={() => setSelectedBookId(book.id)}
      className={`text-left px-3 py-2.5 text-sm font-sans rounded transition-colors ${
        currentBook === book.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
      }`}
    >
      <span className="block">{book.name}</span>
      {book.author && (
        <span className="block text-[9px] text-muted-foreground tracking-wide mt-0.5">
          {book.author}
        </span>
      )}
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 transition-app animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            {selectedBookId && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground truncate">
              {selectedBookId ? breadcrumb.toUpperCase() : "LIVROS"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* View mode toggle — only in book list */}
        {!selectedBookId && (
          <div className="flex gap-1 p-3 border-b border-border">
            <button
              onClick={() => setViewMode("testament")}
              className={`flex-1 py-1.5 text-[9px] tracking-[0.2em] font-sans rounded transition-colors ${
                viewMode === "testament" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              POR TESTAMENTO
            </button>
            <button
              onClick={() => setViewMode("group")}
              className={`flex-1 py-1.5 text-[9px] tracking-[0.2em] font-sans rounded transition-colors ${
                viewMode === "group" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              POR CATEGORIA
            </button>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-120px)]">
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
            /* Chapter selection with book info */
            <div className="p-4">
              {/* Book metadata */}
              <div className="mb-4 p-3 bg-muted/50 rounded">
                <p className="text-sm font-serif font-medium text-foreground">{selectedBook.name}</p>
                {selectedBook.author && (
                  <p className="text-[10px] text-muted-foreground font-sans mt-1">
                    ✍️ Autor: {selectedBook.author}
                  </p>
                )}
                {selectedBook.group && (
                  <p className="text-[10px] text-muted-foreground font-sans">
                    📚 {selectedBook.group}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground font-sans">
                  📖 {selectedBook.chapters} capítulos
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2">
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
            </div>
          ) : viewMode === "group" ? (
            /* Book list by group/category */
            <div className="p-4">
              {Object.entries(booksByGroup).map(([group, books]) => (
                <div key={group} className="mb-5">
                  <p className="text-[9px] tracking-[0.3em] text-primary font-sans font-semibold mb-2">
                    {group.toUpperCase()}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {books.map(renderBookButton)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Book list by testament */
            <div className="p-4">
              <p className="text-[9px] tracking-[0.3em] text-muted-foreground mb-3 font-sans">ANTIGO TESTAMENTO</p>
              <div className="grid grid-cols-2 gap-1 mb-6">
                {oldTestament.map(renderBookButton)}
              </div>
              <p className="text-[9px] tracking-[0.3em] text-muted-foreground mb-3 font-sans">NOVO TESTAMENTO</p>
              <div className="grid grid-cols-2 gap-1">
                {newTestament.map(renderBookButton)}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  );
};

export default BookSelector;
