import { useState, useEffect } from "react";
import { X, Loader2, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bibleApi, VERSION_LABELS, type ApiVerse } from "@/lib/bibleApi";
import { bibleBooks } from "@/data/bibleBooks";

interface VersionComparePanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse?: number | null;
}

const VersionComparePanel = ({ open, onClose, bookId, chapter, selectedVerse }: VersionComparePanelProps) => {
  const [version, setVersion] = useState("nvi");
  const [verses, setVerses] = useState<ApiVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = bibleBooks.find((b) => b.id === bookId);

  useEffect(() => {
    if (!open) return;
    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await bibleApi.getChapter(version, bookId, chapter);
        setVerses(data.verses || []);
      } catch (e: any) {
        setError("Não foi possível carregar esta versão. Tente novamente.");
        setVerses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChapter();
  }, [open, version, bookId, chapter]);

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
                onClick={() => setVersion(key)}
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
            ) : error ? (
              <p className="text-center text-muted-foreground text-sm font-sans py-12">{error}</p>
            ) : (
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
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default VersionComparePanel;
