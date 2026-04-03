import { ChevronLeft, ChevronRight } from "lucide-react";
import { bibleBooks } from "@/data/bibleBooks";

interface ChapterNavigationProps {
  bookId: string;
  chapter: number;
  onNavigate: (bookId: string, chapter: number) => void;
}

const ChapterNavigation = ({ bookId, chapter, onNavigate }: ChapterNavigationProps) => {
  const book = bibleBooks.find((b) => b.id === bookId);
  if (!book) return null;

  const maxChapters = book.chapters;
  const canGoPrev = chapter > 1;
  const canGoNext = chapter < maxChapters;

  // Generate chapter buttons - show current and nearby chapters
  const getChapterButtons = () => {
    const buttons = [];
    const start = Math.max(1, chapter - 2);
    const end = Math.min(maxChapters, chapter + 2);

    if (start > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => onNavigate(bookId, 1)}
          className="px-2 py-1 text-xs rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Primeiro capítulo"
        >
          1
        </button>
      );
      if (start > 2) {
        buttons.push(
          <span key="dots1" className="px-1 text-muted-foreground">
            ...
          </span>
        );
      }
    }

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => onNavigate(bookId, i)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            i === chapter
              ? "bg-primary text-primary-foreground font-bold"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {i}
        </button>
      );
    }

    if (end < maxChapters) {
      if (end < maxChapters - 1) {
        buttons.push(
          <span key="dots2" className="px-1 text-muted-foreground">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key="last"
          onClick={() => onNavigate(bookId, maxChapters)}
          className="px-2 py-1 text-xs rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Último capítulo"
        >
          {maxChapters}
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4 border-t border-border/30 bg-muted/20 rounded-lg">
      <button
        onClick={() => onNavigate(bookId, chapter - 1)}
        disabled={!canGoPrev}
        className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Capítulo anterior"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex items-center gap-1 overflow-x-auto px-2">
        {getChapterButtons()}
      </div>

      <button
        onClick={() => onNavigate(bookId, chapter + 1)}
        disabled={!canGoNext}
        className="p-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Próximo capítulo"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export default ChapterNavigation;
