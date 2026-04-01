import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, Link2, BookOpen, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bibleBooks } from "@/data/bibleBooks";

// --- Types ---

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

interface DictEntry {
  id: string;
  term: string;
  definition: string;
  hebrew_greek: string | null;
}

interface StudyNotesPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse: number | null;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

// --- Reference parsing ---

const abbrevToId: Record<string, string> = {};
const nameToId: Record<string, string> = {};
bibleBooks.forEach((b) => {
  abbrevToId[b.abbrev.toLowerCase()] = b.id;
  nameToId[b.name.toLowerCase()] = b.id;
  // also map id itself
  abbrevToId[b.id] = b.id;
});

function parseReference(refStr: string): { bookId: string; chapter: number; verse?: number } | null {
  const s = refStr.trim();
  // Match patterns like "Gn 1.2", "1Co 3.4", "Sl 119.105", "Hb 1.10"
  const match = s.match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)(?:[\.:](\d+))?/);
  if (!match) return null;
  const abbrev = match[1].replace(/\s/g, "").toLowerCase();
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : undefined;
  const bookId = abbrevToId[abbrev] || nameToId[abbrev];
  if (!bookId) return null;
  return { bookId, chapter, verse };
}

// Renders a text block making all biblical references clickable
function renderContentWithRefs(
  text: string,
  onNavigate: ((bookId: string, chapter: number, verse?: number) => void) | undefined
) {
  if (!onNavigate) return <span className="font-serif">{text}</span>;

  // Regex to find biblical references like "Gn 1.2", "1Co 3:4", "Sl 119.105", "Êx 20.11"
  const refRegex = /(\d?\s?[A-ZÀ-Ú][a-zà-ú]+)\s+(\d+)[\.:](\d+)(?:-(\d+))?/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = refRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const abbrev = match[1].replace(/\s/g, "").toLowerCase();
    const bookId = abbrevToId[abbrev] || nameToId[abbrev];

    if (bookId) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(<span key={`t${lastIndex}`} className="font-serif">{text.slice(lastIndex, match.index)}</span>);
      }
      const ch = parseInt(match[2], 10);
      const vs = parseInt(match[3], 10);
      parts.push(
        <button
          key={`r${match.index}`}
          className="text-primary hover:underline cursor-pointer font-serif"
          onClick={() => onNavigate(bookId, ch, vs)}
        >
          {fullMatch}
        </button>
      );
      lastIndex = match.index + fullMatch.length;
    }
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t${lastIndex}`} className="font-serif">{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? <>{parts}</> : <span className="font-serif">{text}</span>;
}

// Renders semicolon-separated cross references as clickable links
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

// --- Source labels ---

const SOURCE_LABELS: Record<string, { label: string; subtitle: string }> = {
  matthew_henry: { label: "MATTHEW HENRY", subtitle: "Comentário Devocional" },
  sermon: { label: "SERMÕES", subtitle: "Pregações Clássicas" },
  commentary: { label: "NOTA DE ESTUDO", subtitle: "Comentário" },
};

// --- Display order for note groups ---
const TYPE_ORDER = ["matthew_henry", "sermon", "commentary"];

const StudyNotesPanel = ({ open, onClose, bookId, chapter, selectedVerse, onNavigate }: StudyNotesPanelProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [concordanceRefs, setConcordanceRefs] = useState<StudyNote[]>([]);
  const [strongEntries, setStrongEntries] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);

      // Fetch study notes (exclude concordance — it's shown separately)
      let notesQuery = supabase
        .from("study_notes")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .neq("note_type", "concordance")
        .order("verse_start")
        .limit(500);

      // Fetch concordance from study_notes (the main source with 31k+ entries)
      let concQuery = supabase
        .from("study_notes")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("note_type", "concordance")
        .order("verse_start")
        .limit(200);

      if (selectedVerse) {
        notesQuery = notesQuery.lte("verse_start", selectedVerse);
        concQuery = concQuery.eq("verse_start", selectedVerse);
      }

      // Fetch Strong's dictionary entries relevant to this verse/chapter
      // Search for entries that reference this book+chapter
      const searchTerm = selectedVerse
        ? `${bookId} ${chapter}:${selectedVerse}`
        : `${bookId} ${chapter}`;

      const [notesRes, concRes] = await Promise.all([notesQuery, concQuery]);

      // Filter notes covering selected verse
      let filteredNotes = (notesRes.data as StudyNote[]) || [];
      if (selectedVerse) {
        filteredNotes = filteredNotes.filter(
          (n) =>
            n.verse_start <= selectedVerse &&
            (n.verse_end ? n.verse_end >= selectedVerse : n.verse_start === selectedVerse)
        );
      }

      setNotes(filteredNotes);
      setConcordanceRefs((concRes.data as StudyNote[]) || []);

      // Fetch Strong's entries based on verse text keywords
      if (selectedVerse) {
        // First get the verse text
        const { data: verseData } = await supabase
          .from("bible_verses")
          .select("text")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .eq("verse_number", selectedVerse)
          .single();

        if (verseData?.text) {
          // Extract meaningful words (4+ chars, no common words)
          const stopWords = new Set(["para", "como", "pela", "pelo", "dele", "dela", "deus", "senhor", "sobre", "disse", "todos", "toda", "este", "esta", "isso", "aqui", "mais", "seus", "suas", "eles", "elas", "foram", "será", "está", "tinha", "fazer", "onde", "qual", "quem", "quando", "porque", "porém", "então", "também", "depois", "antes", "entre", "ainda", "muito", "outro", "outra", "cada", "mesmo", "mesma", "nosso", "vosso", "terra", "casa", "pois", "assim", "seria", "pode", "podem", "havia", "estas", "estes", "outros", "outras", "tudo", "nada"]);
          const words = verseData.text
            .replace(/[^\wÀ-ú]/g, " ")
            .split(/\s+/)
            .filter((w: string) => w.length >= 4 && !stopWords.has(w.toLowerCase()))
            .map((w: string) => w.toLowerCase())
            .slice(0, 6); // Top 6 keywords

          if (words.length > 0) {
            // Search dictionary for terms matching any keyword
            const orFilter = words.map((w: string) => `term.ilike.%${w}%`).join(",");
            const { data: strongData } = await supabase
              .from("bible_dictionary")
              .select("*")
              .not("hebrew_greek", "is", null)
              .or(orFilter)
              .limit(8);
            setStrongEntries((strongData as DictEntry[]) || []);
          } else {
            setStrongEntries([]);
          }
        } else {
          setStrongEntries([]);
        }
      } else {
        setStrongEntries([]);
      }

      setLoading(false);
    };
    fetchData();
  }, [open, bookId, chapter, selectedVerse]);

  const handleNavigate = useCallback(
    (targetBookId: string, targetChapter: number, verse?: number) => {
      if (onNavigate) {
        onClose();
        onNavigate(targetBookId, targetChapter, verse);
      }
    },
    [onNavigate, onClose]
  );

  if (!open) return null;

  // Group notes by note_type, excluding concordance
  const groupedNotes: Record<string, StudyNote[]> = {};
  notes.forEach((note) => {
    const key = note.note_type || "commentary";
    if (!groupedNotes[key]) groupedNotes[key] = [];
    groupedNotes[key].push(note);
  });

  // Sort groups by defined order
  const sortedTypes = Object.keys(groupedNotes).sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a);
    const bi = TYPE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const hasContent = notes.length > 0 || concordanceRefs.length > 0 || strongEntries.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 animate-fade-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-[11px] tracking-[0.25em] font-sans font-semibold text-foreground uppercase">
            {selectedVerse ? `Notas de Estudo — v. ${selectedVerse}` : "Notas e Referências"}
          </h2>
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
            {!loading &&
              sortedTypes.map((type) => {
                const typeNotes = groupedNotes[type];
                const config = SOURCE_LABELS[type] || { label: type.toUpperCase(), subtitle: "" };

                // Group sermons by source (Wesley vs Spurgeon)
                if (type === "sermon") {
                  const bySource: Record<string, StudyNote[]> = {};
                  typeNotes.forEach((n) => {
                    const src = n.source || "Sermão";
                    if (!bySource[src]) bySource[src] = [];
                    bySource[src].push(n);
                  });

                  return Object.entries(bySource).map(([source, srcNotes]) => (
                    <div key={`sermon-${source}`} className="rounded-lg border border-border bg-card overflow-hidden">
                      <div className="px-5 pt-4 pb-2 border-b border-border/50 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          <h3 className="text-[10px] tracking-[0.25em] font-sans font-bold text-foreground uppercase">
                            {source.toUpperCase()}
                          </h3>
                        </div>
                        <p className="text-[10px] font-sans text-muted-foreground mt-0.5">Pregação Clássica</p>
                      </div>
                      <div className="px-5 py-4 space-y-4">
                        {srcNotes.map((note) => (
                          <div key={note.id} className={srcNotes.length > 1 ? "pb-4 border-b border-border/30 last:border-0 last:pb-0" : ""}>
                            <div className="flex items-start gap-2 mb-1.5">
                              <span className="text-[10px] font-sans font-semibold text-primary tracking-wider shrink-0 mt-0.5">
                                v. {note.verse_start}{note.verse_end ? `–${note.verse_end}` : ""}
                              </span>
                              {note.title && (
                                <span className="text-xs font-sans font-semibold text-foreground block flex-1">
                                  {note.title}
                                </span>
                              )}
                            </div>
                            <div className="text-[13px] font-serif leading-[1.8] text-foreground/90 whitespace-pre-line">
                              {renderContentWithRefs(note.content, onNavigate ? handleNavigate : undefined)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                }

                return (
                  <div key={type} className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="px-5 pt-4 pb-2 border-b border-border/50 bg-muted/30">
                      <h3 className="text-[10px] tracking-[0.25em] font-sans font-bold text-foreground uppercase">
                        {config.label}
                      </h3>
                      {config.subtitle && (
                        <p className="text-[10px] font-sans text-muted-foreground mt-0.5">{config.subtitle}</p>
                      )}
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      {typeNotes.map((note) => (
                        <div key={note.id} className={typeNotes.length > 1 ? "pb-4 border-b border-border/30 last:border-0 last:pb-0" : ""}>
                          <div className="flex items-start gap-2 mb-1.5">
                            <span className="text-[10px] font-sans font-semibold text-primary tracking-wider shrink-0 mt-0.5">
                              v. {note.verse_start}{note.verse_end ? `–${note.verse_end}` : ""}
                            </span>
                            <div className="flex-1">
                              {note.title && note.title !== config.label && (
                                <span className="text-xs font-sans font-semibold text-foreground block">{note.title}</span>
                              )}
                              {note.source && (
                                <span className="text-[10px] font-sans text-muted-foreground italic">{note.source}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-[13px] font-serif leading-[1.8] text-foreground/90 whitespace-pre-line">
                            {renderContentWithRefs(note.content, onNavigate ? handleNavigate : undefined)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* Concordância Exaustiva — from study_notes concordance type */}
            {!loading && concordanceRefs.length > 0 && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-5 pt-4 pb-2 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-[10px] tracking-[0.25em] font-sans font-bold text-foreground uppercase">
                      CONCORDÂNCIA EXAUSTIVA
                    </h3>
                  </div>
                  <p className="text-[10px] font-sans text-muted-foreground mt-0.5">Referências Cruzadas</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {concordanceRefs.map((ref) => (
                    <div key={ref.id}>
                      <span className="text-[10px] font-sans font-semibold text-primary tracking-wider block mb-1">
                        v. {ref.verse_start}
                      </span>
                      <div className="text-sm leading-relaxed text-foreground/90 flex flex-wrap gap-x-0.5">
                        {onNavigate
                          ? renderClickableRefs(ref.content, handleNavigate)
                          : <span className="font-serif">{ref.content}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strong's Lexicon */}
            {!loading && strongEntries.length > 0 && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-5 pt-4 pb-2 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Languages className="w-3.5 h-3.5 text-primary" />
                    <h3 className="text-[10px] tracking-[0.25em] font-sans font-bold text-foreground uppercase">
                      LÉXICO DE STRONG
                    </h3>
                  </div>
                  <p className="text-[10px] font-sans text-muted-foreground mt-0.5">Hebraico & Grego</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {strongEntries.map((entry) => (
                    <div key={entry.id} className="pb-3 border-b border-border/30 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-primary">{entry.hebrew_greek}</span>
                        <span className="text-xs font-sans font-semibold text-foreground">{entry.term}</span>
                      </div>
                      <p className="text-[13px] font-serif leading-[1.8] text-foreground/90">
                        {entry.definition}
                      </p>
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
