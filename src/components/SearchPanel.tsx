import { useState, useCallback } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";

interface SearchResult {
  book_id: string;
  book_name: string;
  chapter: number;
  verse_number: number;
  text: string;
}

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (bookId: string, chapter: number) => void;
}

const SearchPanel = ({ open, onClose, onNavigate }: SearchPanelProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (query.length < 3) return;
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("bible_verses")
      .select("book_id, book_name, chapter, verse_number, text")
      .ilike("text", `%${query}%`)
      .order("book_id")
      .order("chapter")
      .order("verse_number")
      .limit(100);

    if (data && !error) {
      setResults(data);
    } else {
      setResults([]);
    }
    setLoading(false);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 animate-fade-in overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">BUSCAR NA BÍBLIA</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar em toda a Bíblia..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 font-sans text-sm"
                autoFocus
              />
            </div>
            <Button onClick={handleSearch} disabled={query.length < 3 || loading} size="sm">
              Buscar
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && results.map((r, i) => {
            const book = bibleBooks.find(b => b.id === r.book_id);
            return (
              <button
                key={`${r.book_id}-${r.chapter}-${r.verse_number}-${i}`}
                onClick={() => { onNavigate(r.book_id, r.chapter); onClose(); }}
                className="w-full text-left p-3 bg-muted rounded hover:bg-primary/5 transition-colors"
              >
                <span className="text-[10px] font-sans font-semibold text-primary mr-2">
                  {book?.abbrev || r.book_name} {r.chapter}:{r.verse_number}
                </span>
                <span className="text-sm font-serif text-foreground">{r.text}</span>
              </button>
            );
          })}
          {!loading && searched && results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8 font-sans">Nenhum resultado encontrado.</p>
          )}
          {!loading && results.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2 font-sans">
              {results.length === 100 ? "Mostrando os primeiros 100 resultados" : `${results.length} resultado(s)`}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchPanel;
