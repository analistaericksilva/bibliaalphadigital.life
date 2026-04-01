import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, BookOpen, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bibleBooks } from "@/data/bibleBooks";

interface StudyNote {
  id: string;
  verse_start: number;
  verse_end: number | null;
  title: string | null;
  content: string;
  source: string | null;
  note_type: string;
}

interface CrossRef {
  id: string;
  verse: number;
  refs: string;
}

interface StudyNotesPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse: number | null;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

const abbrevToId: Record<string, string> = {};
bibleBooks.forEach((b) => {
  abbrevToId[b.abbrev.toLowerCase()] = b.id;
});

function parseReference(refStr: string): { bookId: string; chapter: number; verse?: number } | null {
  const match = refStr.trim().match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  const abbrev = match[1].replace(/\s/g, "").toLowerCase();
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : undefined;
  const bookId = abbrevToId[abbrev];
  if (!bookId) return null;
  return { bookId, chapter, verse };
}

function renderClickableRefs(
  refsText: string,
  onNavigate: (bookId: string, chapter: number, verse?: number) => void
) {
  const groups = refsText.split(";").map((g) => g.trim()).filter(Boolean);
  return groups.map((group, gi) => {
    const parsed = parseReference(group);
    if (parsed) {
      return (
        <span key={gi}>
          {gi > 0 && <span className="text-muted-foreground">; </span>}
          <button
            className="text-primary hover:underline cursor-pointer font-serif"
            onClick={() => onNavigate(parsed.bookId, parsed.chapter, parsed.verse)}
          >
            {group}
          </button>
        </span>
      );
    }
    return (
      <span key={gi}>
        {gi > 0 && <span className="text-muted-foreground">; </span>}
        <span className="font-serif">{group}</span>
      </span>
    );
  });
}

// Group notes by source/type for display
const SOURCE_LABELS: Record<string, { label: string; subtitle: string }> = {
  "matthew_henry": { label: "MATTHEW HENRY", subtitle: "Comentário Devocional" },
  "strong": { label: "AUGUSTUS H. STRONG", subtitle: "Teologia Sistemática" },
  "pentecostal": { label: "NOTA PENTECOSTAL", subtitle: "Perspectiva Carismática" },
  "devocional": { label: "DEVOCIONAL DIÁRIO", subtitle: "Reflexão Espiritual" },
  "aplicacao": { label: "APLICAÇÃO PESSOAL", subtitle: "Vida Prática" },
  "wesley": { label: "JOHN WESLEY", subtitle: "Sermões" },
  "spurgeon": { label: "C. H. SPURGEON", subtitle: "Sermões Graciosos" },
  "enciclopedia": { label: "ENCICLOPÉDIA BÍBLICA", subtitle: "Referência" },
  "commentary": { label: "NOTA DE ESTUDO", subtitle: "Comentário" },
};

const StudyNotesPanel = ({ open, onClose, bookId, chapter, selectedVerse, onNavigate }: StudyNotesPanelProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);

      let notesQuery = supabase
        .from("study_notes")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .order("verse_start");

      let refsQuery = supabase
        .from("bible_cross_references")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .order("verse");

      if (selectedVerse) {
        notesQuery = notesQuery.lte("verse_start", selectedVerse);
        refsQuery = refsQuery.eq("verse", selectedVerse);
      }

      const [notesRes, refsRes] = await Promise.all([notesQuery, refsQuery]);

      // Filter notes that cover the selected verse
      let filteredNotes = (notesRes.data as StudyNote[]) || [];
      if (selectedVerse) {
        filteredNotes = filteredNotes.filter(
          (n) => n.verse_start <= selectedVerse && (n.verse_end ? n.verse_end >= selectedVerse : n.verse_start === selectedVerse)
        );
      }

      setNotes(filteredNotes);
      setCrossRefs((refsRes.data as CrossRef[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [open, bookId, chapter, selectedVerse]);

  const handleNavigate = useCallback((targetBookId: string, targetChapter: number, verse?: number) => {
    if (onNavigate) {
      onClose();
      onNavigate(targetBookId, targetChapter, verse);
    }
  }, [onNavigate, onClose]);

  if (!open) return null;

  // Group notes by note_type/source
  const groupedNotes: Record<string, StudyNote[]> = {};
  notes.forEach((note) => {
    const key = note.note_type || "commentary";
    if (!groupedNotes[key]) groupedNotes[key] = [];
    groupedNotes[key].push(note);
  });

  const hasContent = notes.length > 0 || crossRefs.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-[11px] tracking-[0.25em] font-sans font-semibold text-foreground uppercase">
              {selectedVerse ? `Notas de Estudo — v. ${selectedVerse}` : "Notas e Referências"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && !hasContent && (
              <p className="text-sm text-muted-foreground text-center py-16 font-sans">
                Nenhuma nota ou referência disponível para este {selectedVerse ? "versículo" : "capítulo"}.
              </p>
            )}

            {/* Notes grouped by source/type */}
            {!loading && Object.entries(groupedNotes).map(([type, typeNotes]) => {
              const config = SOURCE_LABELS[type] || { label: type.toUpperCase(), subtitle: "" };
              return (
                <div key={type} className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="px-5 pt-4 pb-2 border-b border-border/50 bg-muted/30">
                    <h3 className="text-[10px] tracking-[0.25em] font-sans font-bold text-foreground uppercase">
                      {config.label}
                    </h3>
                    {config.subtitle && (
                      <p className="text-[10px] font-sans text-muted-foreground mt-0.5">
                        {config.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {typeNotes.map((note) => (
                      <div key={note.id}>
                        {(typeNotes.length > 1 || note.title) && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-sans font-semibold text-primary tracking-wider">
                              v. {note.verse_start}
                              {note.verse_end ? `–${note.verse_end}` : ""}
                            </span>
                            {note.title && (
                              <span className="text-xs font-sans font-semibold text-foreground">
                                {note.title}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[13px] font-serif leading-[1.8] text-foreground/90 whitespace-pre-line">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Cross References */}
            {!loading && crossRefs.length > 0 && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-5 pt-4 pb-2 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-[10px] tracking-[0.25em] font-sans font-bold text-foreground uppercase">
                      Referências Cruzadas
                    </h3>
                  </div>
                  <p className="text-[10px] font-sans text-muted-foreground mt-0.5">Concordância</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {crossRefs.map((ref) => (
                    <div key={ref.id}>
                      <span className="text-[10px] font-sans font-semibold text-primary tracking-wider block mb-1">
                        v. {ref.verse}
                      </span>
                      <div className="text-sm leading-relaxed text-foreground/90 flex flex-wrap gap-x-0.5">
                        {onNavigate
                          ? renderClickableRefs(ref.refs, handleNavigate)
                          : <span className="font-serif">{ref.refs}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default StudyNotesPanel;
