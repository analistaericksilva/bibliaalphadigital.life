import { useState, useEffect } from "react";
import { X, Loader2, Languages, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface LexiconEntry {
  strongs_number: string;
  language: string;
  original_word: string | null;
  transliteration: string | null;
  gloss: string | null;
  morphology: string | null;
  definition: string | null;
}

interface LexiconPanelProps {
  open: boolean;
  onClose: () => void;
}

const LexiconPanel = ({ open, onClose }: LexiconPanelProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<LexiconEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<"all" | "hebrew" | "greek">("all");

  useEffect(() => {
    if (!open || search.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      let query = supabase
        .from("strongs_lexicon")
        .select("strongs_number, language, original_word, transliteration, gloss, morphology, definition");

      if (langFilter !== "all") {
        query = query.eq("language", langFilter);
      }

      // Search by Strong's number or gloss/transliteration
      if (/^[GHgh]\d+/.test(search)) {
        query = query.ilike("strongs_number", `${search.toUpperCase()}%`);
      } else {
        query = query.or(`gloss.ilike.%${search}%,transliteration.ilike.%${search}%,original_word.ilike.%${search}%`);
      }

      const { data } = await query.limit(50);
      setResults((data as LexiconEntry[]) || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [open, search, langFilter]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-primary" />
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
              LÉXICO STRONG'S
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Strong's (H0001, G0018) ou palavra..."
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "hebrew", "greek"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLangFilter(lang)}
                className={`px-3 py-1.5 text-[10px] tracking-wider font-sans rounded transition-colors ${
                  langFilter === lang
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-primary/10"
                }`}
              >
                {lang === "all" ? "Todos" : lang === "hebrew" ? "Hebraico" : "Grego"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-2 text-[9px] tracking-[0.2em] text-muted-foreground font-sans">
          {results.length > 0
            ? `${results.length} RESULTADO${results.length > 1 ? "S" : ""}`
            : search.length >= 2
            ? "NENHUM RESULTADO"
            : "DIGITE PARA BUSCAR • 20.192 ENTRADAS DISPONÍVEIS"}
        </div>

        {/* Results */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading &&
              results.map((entry) => (
                <div
                  key={entry.strongs_number}
                  className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    setExpanded(expanded === entry.strongs_number ? null : entry.strongs_number)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold text-primary">
                          {entry.strongs_number}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-sans tracking-wider ${
                            entry.language === "hebrew"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                        >
                          {entry.language === "hebrew" ? "HEB" : "GRE"}
                        </span>
                      </div>
                      <p className="text-lg font-serif text-foreground">{entry.original_word}</p>
                      <p className="text-xs text-muted-foreground font-sans italic">
                        {entry.transliteration}
                      </p>
                      <p className="text-sm font-sans font-medium text-foreground mt-1">
                        {entry.gloss}
                      </p>
                    </div>
                    {entry.morphology && (
                      <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                        {entry.morphology}
                      </span>
                    )}
                  </div>

                  {expanded === entry.strongs_number && entry.definition && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-[9px] tracking-[0.2em] text-muted-foreground font-sans mb-1.5">
                        DEFINIÇÃO COMPLETA
                      </p>
                      <p className="text-sm font-serif leading-relaxed text-foreground/90 whitespace-pre-line">
                        {entry.definition}
                      </p>
                    </div>
                  )}
                </div>
              ))}

            {!loading && search.length < 2 && (
              <div className="text-center py-12 space-y-3">
                <Languages className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground font-sans">
                  Pesquise por número Strong's ou palavra
                </p>
                <p className="text-xs text-muted-foreground/60 font-sans">
                  Dados do STEPBible (CC BY 4.0) — Tyndale House Cambridge
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default LexiconPanel;
