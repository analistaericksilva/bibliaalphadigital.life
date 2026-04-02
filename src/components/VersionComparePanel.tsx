import { useState, useEffect } from "react";
import { X, Loader2, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bibleApi, VERSION_LABELS, type ApiVerse } from "@/lib/bibleApi";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";

interface VersionComparePanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse?: number | null;
}

interface LocalVerse {
  number: number;
  text: string;
}

const VersionComparePanel = ({ open, onClose, bookId, chapter, selectedVerse }: VersionComparePanelProps) => {
  const [version, setVersion] = useState("nvi");
  const [verses, setVerses] = useState<LocalVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  const book = bibleBooks.find((b) => b.id === bookId);

  useEffect(() => {
    if (!open) return;

    const fetchChapter = async () => {
      setLoading(true);
      setError(null);

      // For versions other than the default, try the API with a timeout
      if (version !== "nvi" && !useLocalFallback) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

          const data = await bibleApi.getChapter(version, bookId, chapter);
          clearTimeout(timeout);
          setVerses((data.verses || []).map((v: ApiVerse) => ({ number: v.number, text: v.text })));
          setLoading(false);
          return;
        } catch {
          // Fall through to local DB
          setUseLocalFallback(true);
        }
      }

      // Use local database (NVI stored locally)
      try {
        const { data, error: dbError } = await supabase
          .from("bible_verses")
          .select("verse_number, text")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .order("verse_number");

        if (dbError) throw dbError;
        setVerses((data || []).map((v) => ({ number: v.verse_number, text: v.text })));

        if (version !== "nvi") {
          setError("API externa indisponível. Exibindo versão local (NVI).");
        }
      } catch {
        setError("Não foi possível carregar os versículos.");
        setVerses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [open, version, bookId, chapter, useLocalFallback]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border z-50 animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
              COMPARAR VERSÕES
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Version selector */}
        <div className="p-4 border-b border-border">
          <p className="text-[9px] tracking-[0.3em] text-muted-foreground font-sans mb-2">
            SELECIONE A VERSÃO
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(VERSION_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setUseLocalFallback(false); setVersion(key); }}
                className={`px-3 py-1.5 text-[10px] tracking-wider font-sans rounded transition-colors ${
                  version === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-primary/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="p-4 border-b border-border text-center">
          <p className="text-sm font-serif text-foreground">
            {book?.name} {chapter}
          </p>
          <p className="text-[9px] tracking-[0.2em] text-primary font-sans mt-1">
            {VERSION_LABELS[version] || version.toUpperCase()}
          </p>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {error && (
                  <p className="text-center text-muted-foreground text-xs font-sans py-2 mb-4 bg-muted/50 rounded px-3">
                    {error}
                  </p>
                )}
                <div className="space-y-3">
                  {verses.map((v) => (
                    <p
                      key={v.number}
                      className={`text-sm font-serif leading-relaxed transition-colors ${
                        selectedVerse === v.number
                          ? "bg-primary/10 rounded px-2 py-1 border-l-2 border-primary"
                          : ""
                      }`}
                    >
                      <sup className="text-[9px] font-sans text-primary mr-1 font-bold">
                        {v.number}
                      </sup>
                      {v.text}
                    </p>
                  ))}
                  {verses.length === 0 && !error && (
                    <p className="text-center text-muted-foreground text-sm font-sans py-12">
                      Nenhum versículo encontrado nesta versão.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default VersionComparePanel;
