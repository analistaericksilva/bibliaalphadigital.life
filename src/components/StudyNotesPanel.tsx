import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, BookOpen, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

const StudyNotesPanel = ({ open, onClose, bookId, chapter, selectedVerse }: StudyNotesPanelProps) => {
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
        notesQuery = notesQuery.eq("verse_start", selectedVerse);
        refsQuery = refsQuery.eq("verse", selectedVerse);
      }

      const [notesRes, refsRes] = await Promise.all([notesQuery, refsQuery]);
      
      setNotes((notesRes.data as StudyNote[]) || []);
      setCrossRefs((refsRes.data as CrossRef[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [open, bookId, chapter, selectedVerse]);

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
                    <p className="text-sm font-serif leading-relaxed text-foreground/90">
                      {ref.refs}
                    </p>
                  </div>
                ))}
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
