import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Search, Loader2, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DictEntry {
  id: string;
  term: string;
  definition: string;
  hebrew_greek: string | null;
  references_list: string[];
}

interface DictionaryPanelProps {
  open: boolean;
  onClose: () => void;
  initialTerm?: string;
}

const DictionaryPanel = ({ open, onClose, initialTerm }: DictionaryPanelProps) => {
  const [query, setQuery] = useState(initialTerm || "");
  const [entries, setEntries] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [allEntries, setAllEntries] = useState<DictEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    const fetchAll = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("bible_dictionary")
        .select("*")
        .order("term");
      if (data) {
        const mapped = data.map((d: any) => ({
          ...d,
          references_list: Array.isArray(d.references_list) ? d.references_list : [],
        }));
        setAllEntries(mapped);
        setEntries(mapped);
      }
      setLoading(false);
    };
    fetchAll();
  }, [open]);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = allEntries.filter(
        (e) =>
          e.term.toLowerCase().includes(query.toLowerCase()) ||
          e.definition.toLowerCase().includes(query.toLowerCase())
      );
      setEntries(filtered);
    } else {
      setEntries(allEntries);
    }
  }, [query, allEntries]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookText className="w-4 h-4 text-primary" />
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">DICIONÁRIO BÍBLICO</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar termo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 font-sans text-sm"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && entries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8 font-sans">
                Nenhum termo encontrado.
              </p>
            )}
            {!loading &&
              entries.map((entry) => (
                <div key={entry.id} className="bg-paper rounded p-4 border border-border">
                  <h3 className="text-base font-serif font-semibold text-primary mb-1">{entry.term}</h3>
                  {entry.hebrew_greek && (
                    <p className="text-[11px] font-sans text-muted-foreground mb-2 italic">
                      {entry.hebrew_greek}
                    </p>
                  )}
                  <p className="text-sm font-serif leading-relaxed text-foreground/90 mb-3">
                    {entry.definition}
                  </p>
                  {entry.references_list.length > 0 && (
                    <div>
                      <p className="text-[10px] tracking-[0.2em] font-sans text-muted-foreground mb-1">REFERÊNCIAS</p>
                      <div className="flex flex-wrap gap-1">
                        {entry.references_list.map((ref, i) => (
                          <span
                            key={i}
                            className="text-xs font-sans text-primary bg-primary/10 px-2 py-0.5 rounded"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default DictionaryPanel;
