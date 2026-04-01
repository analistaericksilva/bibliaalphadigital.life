import { useState } from "react";
import { bibleBooks } from "@/data/bibleBooks";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BookSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (bookId: string, chapter: number) => void;
  currentBook: string;
  currentChapter: number;
}

const BookSelector = ({ open, onClose, onSelect, currentBook, currentChapter }: BookSelectorProps) => {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  if (!open) return null;

  const selectedBook = bibleBooks.find((b) => b.id === selectedBookId);
  const oldTestament = bibleBooks.filter((b) => b.testament === "old");
  const newTestament = bibleBooks.filter((b) => b.testament === "new");

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 transition-app animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
            {selectedBookId ? selectedBook?.name.toUpperCase() : "LIVROS"}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => selectedBookId ? setSelectedBookId(null) : onClose()}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-64px)]">
          {selectedBookId && selectedBook ? (
            <div className="p-4 grid grid-cols-5 gap-2">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => { onSelect(selectedBookId, ch); onClose(); setSelectedBookId(null); }}
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
