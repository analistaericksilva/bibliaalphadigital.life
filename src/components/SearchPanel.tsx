import { useState } from "react";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
  verses: Array<{ verse: number; text: string }>;
  onVerseClick: (verse: number) => void;
}

const SearchPanel = ({ open, onClose, verses, onVerseClick }: SearchPanelProps) => {
  const [query, setQuery] = useState("");

  if (!open) return null;

  const results = query.length > 2
    ? verses.filter((v) => v.text.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">BUSCAR</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar no capítulo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 font-sans text-sm"
              autoFocus
            />
          </div>
          <div className="mt-4 space-y-2">
            {results.map((v) => (
              <button
                key={v.verse}
                onClick={() => { onVerseClick(v.verse); onClose(); }}
                className="w-full text-left p-3 bg-muted rounded hover:bg-primary/5 transition-colors"
              >
                <span className="text-[10px] font-sans font-semibold text-primary mr-2">{v.verse}</span>
                <span className="text-sm font-serif text-foreground">{v.text}</span>
              </button>
            ))}
            {query.length > 2 && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 font-sans">Nenhum resultado encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPanel;
