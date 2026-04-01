import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, BookOpen, Loader2, Link2, Sparkles } from "lucide-react";
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

// Map abbreviations to book IDs
const abbrevToId: Record<string, string> = {};
bibleBooks.forEach((b) => {
  abbrevToId[b.abbrev.toLowerCase()] = b.id;
});

function parseReference(refStr: string): { bookId: string; chapter: number; verse?: number } | null {
  // Match patterns like "Gn 1.1", "1Co 3.13", "Pv 8.22-24", "Sl 33.6,9"
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
  // Split by semicolons, then render each group
  const groups = refsText.split(";").map((g) => g.trim()).filter(Boolean);
  
  return groups.map((group, gi) => {
    // Each group might be like "Pv 8.22-24" or "Sl 33.6,9" or just "10,12,18,25,31"
    // Try to parse the leading book reference
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
    
    // Fallback: just render as text
    return (
      <span key={gi}>
        {gi > 0 && <span className="text-muted-foreground">; </span>}
        <span className="font-serif">{group}</span>
      </span>
    );
  });
}

const StudyNotesPanel = ({ open, onClose, bookId, chapter, selectedVerse, onNavigate }: StudyNotesPanelProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiNotes, setAiNotes] = useState<Record<number, string>>({});
  const [aiLoading, setAiLoading] = useState<number | null>(null);

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
        notesQuery = notesQuery.eq("verse_start", selectedVerse);
        refsQuery = refsQuery.eq("verse", selectedVerse);
      }

      const [notesRes, refsRes] = await Promise.all([notesQuery, refsQuery]);
      
      setNotes((notesRes.data as StudyNote[]) || []);
      setCrossRefs((refsRes.data as CrossRef[]) || []);
      setLoading(false);

      // Auto-generate AI note for selected verse if not already generated
      if (selectedVerse && !aiNotes[selectedVerse]) {
        generateAiNote(selectedVerse);
      }
    };
    fetchData();
  }, [open, bookId, chapter, selectedVerse]);

  const handleNavigate = useCallback((targetBookId: string, targetChapter: number, verse?: number) => {
    if (onNavigate) {
      onClose();
      onNavigate(targetBookId, targetChapter, verse);
    }
  }, [onNavigate, onClose]);

  const generateAiNote = useCallback(async (verse: number) => {
    const book = bibleBooks.find((b) => b.id === bookId);
    if (!book) return;
    
    setAiLoading(verse);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-note", {
        body: { bookId, bookName: book.name, chapter, verse },
      });
      if (!error && data?.note) {
        setAiNotes((prev) => ({ ...prev, [verse]: data.note }));
      }
    } catch (err) {
      console.error("Error generating AI note:", err);
    } finally {
      setAiLoading(null);
    }
  }, [bookId, chapter]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
              {selectedVerse ? `REFERÊNCIAS — V. ${selectedVerse}` : "NOTAS E REFERÊNCIAS"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && notes.length === 0 && crossRefs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12 font-sans">
                Nenhuma nota ou referência disponível para este {selectedVerse ? "versículo" : "capítulo"}.
              </p>
            )}

            {/* Cross References */}
            {!loading && crossRefs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] tracking-[0.3em] font-sans font-semibold text-muted-foreground">
                    REFERÊNCIAS CRUZADAS
                  </span>
                </div>
                {crossRefs.map((ref) => (
                  <div key={ref.id} className="bg-paper rounded p-4 border border-border">
                    <span className="text-[10px] font-sans font-semibold text-primary tracking-wider block mb-2">
                      V. {ref.verse}
                    </span>
                    <div className="text-sm leading-relaxed text-foreground/90 flex flex-wrap gap-x-0.5">
                      {onNavigate
                        ? renderClickableRefs(ref.refs, handleNavigate)
                        : <span className="font-serif">{ref.refs}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Study Note (Matthew Henry + Strong) */}
            {!loading && selectedVerse && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] tracking-[0.3em] font-sans font-semibold text-muted-foreground">
                    NOTA EXPLICATIVA
                  </span>
                </div>
                {aiLoading === selectedVerse ? (
                  <div className="bg-paper rounded p-4 border border-border flex items-center gap-2 text-sm text-muted-foreground font-sans">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando nota explicativa...
                  </div>
                ) : aiNotes[selectedVerse] ? (
                  <div className="bg-paper rounded p-4 border border-border">
                    <p className="text-sm font-serif leading-relaxed text-foreground/90 whitespace-pre-line">
                      {aiNotes[selectedVerse]}
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-sans"
                    onClick={() => generateAiNote(selectedVerse)}
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    Gerar nota explicativa
                  </Button>
                )}
              </div>
            )}

            {/* Study Notes */}
            {!loading && notes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] tracking-[0.3em] font-sans font-semibold text-muted-foreground">
                    NOTAS DE ESTUDO
                  </span>
                </div>
                {notes.map((note) => (
                  <div key={note.id} className="bg-paper rounded p-4 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-sans font-semibold text-primary tracking-wider">
                        V. {note.verse_start}
                        {note.verse_end ? `–${note.verse_end}` : ""}
                      </span>
                      {note.title && (
                        <span className="text-xs font-sans font-semibold text-foreground">
                          {note.title}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-serif leading-relaxed text-foreground/90">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default StudyNotesPanel;
