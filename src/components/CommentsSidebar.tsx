import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, MessageCircle, X } from "lucide-react";

interface CommentsSidebarProps {
  bookId: string;
  chapter: number;
  selectedVerse: number | null;
  onNavigate: (bookId: string, chapter: number, verse?: number) => void;
  open: boolean;
  onClose: () => void;
}

interface StudyNote {
  id: string;
  title: string | null;
  content: string;
  source: string | null;
  note_type: string;
  verse_start: number;
  verse_end: number | null;
}

const CommentsSidebar = ({ bookId, chapter, selectedVerse, onNavigate, open, onClose }: CommentsSidebarProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAuthors, setExpandedAuthors] = useState<Set<string>>(new Set());

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("study_notes")
      .select("*")
      .eq("book_id", bookId)
      .eq("chapter", chapter)
      .order("verse_start", { ascending: true });
    if (data) setNotes(data);
    setLoading(false);
  }, [bookId, chapter]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const notesByAuthor = notes.reduce((acc, note) => {
    const author = note.source || note.note_type || "Comentário";
    if (!acc[author]) acc[author] = [];
    acc[author].push(note);
    return acc;
  }, {} as Record<string, StudyNote[]>);

  const toggleAuthor = (author: string) => {
    setExpandedAuthors(prev => {
      const next = new Set(prev);
      if (next.has(author)) next.delete(author);
      else next.add(author);
      return next;
    });
  };

  const authorEntries = Object.entries(notesByAuthor);

  // Filter notes for selected verse
  const getRelevantNotes = (authorNotes: StudyNote[]) => {
    if (!selectedVerse) return authorNotes;
    return authorNotes.filter(n => 
      n.verse_start <= selectedVerse && 
      (n.verse_end ? n.verse_end >= selectedVerse : n.verse_start === selectedVerse)
    );
  };

  if (!open) return null;

  return (
    <div className="comments-sidebar w-80 lg:w-96 shrink-0 flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Comentários</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {notes.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="reader-icon-button"
          aria-label="Fechar comentários"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : authorEntries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum comentário</p>
              <p className="text-xs text-muted-foreground/60 mt-1">disponível para este capítulo</p>
            </div>
          ) : (
            authorEntries.map(([author, authorNotes]) => {
              const relevantNotes = getRelevantNotes(authorNotes);
              const isExpanded = expandedAuthors.has(author);
              const noteCount = selectedVerse ? relevantNotes.length : authorNotes.length;
              
              if (selectedVerse && relevantNotes.length === 0) return null;

              return (
                <div key={author} className="comment-author-card overflow-hidden">
                  {/* Author header — always visible */}
                  <button
                    onClick={() => toggleAuthor(author)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">
                        {author}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {noteCount} {noteCount === 1 ? "nota" : "notas"}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Notes — expandable */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {(selectedVerse ? relevantNotes : authorNotes).map(note => (
                        <div
                          key={note.id}
                          className="p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              v. {note.verse_start}{note.verse_end ? `–${note.verse_end}` : ""}
                            </span>
                            {note.title && (
                              <span className="text-xs font-medium text-foreground truncate">
                                {note.title}
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line">
                            {note.content.length > 300 ? note.content.slice(0, 300) + "..." : note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommentsSidebar;
