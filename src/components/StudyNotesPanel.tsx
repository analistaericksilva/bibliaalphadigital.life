import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, BookOpen, Loader2 } from "lucide-react";
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

interface StudyNotesPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse: number | null;
}

const StudyNotesPanel = ({ open, onClose, bookId, chapter, selectedVerse }: StudyNotesPanelProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchNotes = async () => {
      setLoading(true);
      let query = supabase
        .from("study_notes")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .order("verse_start");

      if (selectedVerse) {
        query = query.eq("verse_start", selectedVerse);
      }

      const { data } = await query;
      setNotes((data as StudyNote[]) || []);
      setLoading(false);
    };
    fetchNotes();
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
              {selectedVerse ? `NOTAS — V. ${selectedVerse}` : "NOTAS DE ESTUDO"}
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
            {!loading && notes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12 font-sans">
                Nenhuma nota de estudo disponível para este {selectedVerse ? "versículo" : "capítulo"}.
              </p>
            )}
            {!loading &&
              notes.map((note) => (
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
                  {note.source && (
                    <p className="text-[10px] font-sans text-muted-foreground mt-2 italic">
                      Fonte: {note.source}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default StudyNotesPanel;
