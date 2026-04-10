import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, Link2, BookOpen, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bibleBooks } from "@/data/bibleBooks";
import TranslatableText from "@/components/TranslatableText";

// --- Tipos ---

interface StudyNote {
  id: string;
  verse_start: number;
  verse_end: number | null;
  title: string | null;
  content: string;
  source: string | null;
  note_type: string;
  color?: string | null;
}

interface DictEntry {
  id: string;
  term: string;
  definition: string;
  hebrew_greek: string | null;
  references_list: any;
}

interface StudyNotesPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse: number | null;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

// --- Parse de referências ---

const abbrevToId: Record<string, string> = {};
const nameToId: Record<string, string> = {};
const idToAbbrev: Record<string, string> = {};
bibleBooks.forEach((b) => {
  abbrevToId[b.abbrev.toLowerCase()] = b.id;
  nameToId[b.name.toLowerCase()] = b.id;
  abbrevToId[b.id] = b.id;
  idToAbbrev[b.id] = b.abbrev;
});

function parseReference(refStr: string): { bookId: string; chapter: number; verse?: number } | null {
  const s = refStr.trim();
  const match = s.match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)(?:[.:](\d+))?/);
  if (!match) return null;
  const abbrev = match[1].replace(/\s/g, "").toLowerCase();
  const chapter = parseInt(match[2], 10);
  const verse = match[3] ? parseInt(match[3], 10) : undefined;
  const bookId = abbrevToId[abbrev] || nameToId[abbrev];
  if (!bookId) return null;
  return { bookId, chapter, verse };
}

function renderContentWithRefs(
  text: string,
  onNavigate: ((bookId: string, chapter: number, verse?: number) => void) | undefined
) {
  if (!onNavigate) return <span className="font-serif">{text}</span>;

  const refRegex = /((?:\d\s*)?[A-Za-zÀ-ú]{1,15}(?:\s+[A-Za-zÀ-ú]{1,15})*)\s+(\d+)[.:](\d+)(?:-(\d+))?/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = refRegex.exec(text)) !== null) {
    const fullMatch = match[0];
    const parsed = parseReference(fullMatch);

    if (parsed) {
      if (match.index > lastIndex) {
        parts.push(<span key={`t${lastIndex}`} className="font-serif">{text.slice(lastIndex, match.index)}</span>);
      }

      parts.push(
        <button
          key={`r${match.index}`}
          className="text-primary hover:underline cursor-pointer font-serif"
          onClick={() => onNavigate(parsed.bookId, parsed.chapter, parsed.verse)}
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
          {gi > 0 && <span className="text-foreground">; </span>}
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
        {gi > 0 && <span className="text-foreground">; </span>}
        <span className="font-serif">{group}</span>
      </span>
    );
  });
}

// --- Rótulos de fonte ---

const SOURCE_LABELS: Record<string, { label: string; subtitle: string }> = {
  agostinho: { label: "AGOSTINHO", subtitle: "Pai da Igreja (354–430)" },
  crisostomo: { label: "JOÃO CRISÓSTOMO", subtitle: "Pai da Igreja (349–407)" },
  calvino: { label: "JOÃO CALVINO", subtitle: "Reformador" },
  lutero: { label: "MARTINHO LUTERO", subtitle: "Reformador" },
  spurgeon: { label: "CHARLES SPURGEON", subtitle: "Puritano" },
  edwards: { label: "JONATHAN EDWARDS", subtitle: "Puritano" },
  owen: { label: "JOHN OWEN", subtitle: "Puritano" },
  baxter: { label: "RICHARD BAXTER", subtitle: "Puritano" },
  watson: { label: "THOMAS WATSON", subtitle: "Puritano" },
  flavel: { label: "JOHN FLAVEL", subtitle: "Puritano" },
  sermon: { label: "SERMÕES", subtitle: "Pregações Clássicas" },
  commentary: { label: "NOTA DE ESTUDO", subtitle: "Comentário Patrístico" },
};

const TYPE_ORDER = ["agostinho", "crisostomo", "commentary", "calvino", "lutero", "spurgeon", "edwards", "owen", "baxter", "watson", "flavel", "sermon"];

// --- Auxiliar: compara referências do dicionário com o versículo atual ---

function dictEntryMatchesVerse(entry: DictEntry, bookId: string, chapter: number, verse: number | null): boolean {
  if (!entry.references_list || !Array.isArray(entry.references_list)) return false;
  const abbrev = idToAbbrev[bookId];
  if (!abbrev) return false;

  return entry.references_list.some((ref: string) => {
    if (!ref) return false;
    // referências como "Gn 1:1", "Sl 19:1", "Gn 15:18"
    const parsed = parseReference(ref);
    if (!parsed) return false;
    if (parsed.bookId !== bookId) return false;
    if (parsed.chapter !== chapter) return false;
    if (verse && parsed.verse) return parsed.verse === verse;
    return true; // correspondência no nível de capítulo
  });
}

const StudyNotesPanel = ({ open, onClose, bookId, chapter, selectedVerse, onNavigate }: StudyNotesPanelProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [concordanceRefs, setConcordanceRefs] = useState<StudyNote[]>([]);
  const [strongEntries, setStrongEntries] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);

      // Busca notas de estudo (exceto concordância — exibida separadamente)
      let notesQuery = supabase
        .from("study_notes")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .neq("note_type", "concordance")
        .order("verse_start")
        .limit(500);

      // Busca concordância
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

      // Busca verbetes curados de Strong/dicionário em português (com referências)
      const dictQuery = supabase
        .from("bible_dictionary")
        .select("*")
        .not("references_list", "is", null)
        .not("hebrew_greek", "is", null);

      const [notesRes, concRes, dictRes] = await Promise.all([notesQuery, concQuery, dictQuery]);

      // Filtra notas que cobrem o versículo selecionado
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

      // Filtra verbetes do dicionário que combinam com a referência do versículo
      const allDict = (dictRes.data as DictEntry[]) || [];
      const matched = allDict.filter((e) =>
        dictEntryMatchesVerse(e, bookId, chapter, selectedVerse)
      );
      setStrongEntries(matched);

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

  // Agrupa notas por tipo
  const groupedNotes: Record<string, StudyNote[]> = {};
  notes.forEach((note) => {
    const key = note.note_type || "commentary";
    if (!groupedNotes[key]) groupedNotes[key] = [];
    groupedNotes[key].push(note);
  });

  const sortedTypes = Object.keys(groupedNotes).sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a);
    const bi = TYPE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const bookName = bibleBooks.find((b) => b.id === bookId)?.name || bookId;
  const hasContent = notes.length > 0 || concordanceRefs.length > 0 || strongEntries.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="reader-floating-panel fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 animate-fade-in flex flex-col shadow-2xl">
        {/* Cabeçalho */}
        <div className="reader-panel-header flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="text-xs tracking-[0.2em] title-strong uppercase">
                NOTAS DE ESTUDO
              </h2>
            </div>
            <p className="text-sm comment-strong">
              {selectedVerse
                ? `${bookName} ${chapter}:${selectedVerse}`
                : `${bookName} — Capítulo ${chapter}`}
            </p>
            <p className="text-[10px] font-sans text-foreground mt-1">
              {selectedVerse ? "Comentários, referências e léxico do versículo" : "Visão geral do capítulo"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="reader-icon-button h-8 w-8 rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-foreground" />
              </div>
            )}

            {!loading && !hasContent && (
              <p className="text-sm text-foreground text-center py-16 font-sans">
                Nenhuma nota ou referência disponível para {selectedVerse ? "este versículo" : "este capítulo"}.
              </p>
            )}

            {/* Léxico Hebraico/Grego — mostra primeiro para contexto imediato */}
            {!loading && strongEntries.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Languages className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-[10px] tracking-[0.25em] title-strong uppercase">
                        PALAVRAS ORIGINAIS
                      </h3>
                      <p className="text-[10px] font-sans text-foreground">
                        Hebraico & Grego — Léxico de Strong
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {strongEntries.map((entry) => (
                    <div key={entry.id} className="pb-3 border-b border-border/30 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2 mb-1.5">
                        <span className="text-sm font-serif font-bold text-primary leading-tight">
                          {entry.term}
                        </span>
                      </div>
                      {entry.hebrew_greek && (
                        <p className="text-[11px] font-mono text-foreground mb-1.5">
                          {entry.hebrew_greek}
                        </p>
                      )}
                      <TranslatableText
                        text={entry.definition}
                        className="text-[13px] comment-strong leading-[1.8]"
                        forceTranslate
                      />
                      {/* Renderiza referências como itens clicáveis */}
                      {entry.references_list && Array.isArray(entry.references_list) && entry.references_list.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {entry.references_list.map((ref: string, i: number) => {
                            const parsed = parseReference(ref);
                            if (parsed && onNavigate) {
                              return (
                                <button
                                  key={i}
                                  className="text-[10px] font-sans text-primary hover:underline cursor-pointer bg-primary/5 rounded px-1.5 py-0.5"
                                  onClick={() => handleNavigate(parsed.bookId, parsed.chapter, parsed.verse)}
                                >
                                  {ref}
                                </button>
                              );
                            }
                            return (
                              <span key={i} className="text-[10px] font-sans text-foreground bg-muted rounded px-1.5 py-0.5">
                                {ref}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notas agrupadas por fonte/tipo */}
            {!loading &&
              sortedTypes.map((type) => {
                const typeNotes = groupedNotes[type];
                const config = SOURCE_LABELS[type] || { label: type.toUpperCase(), subtitle: "" };

                if (type === "sermon") {
                  const bySource: Record<string, StudyNote[]> = {};
                  typeNotes.forEach((n) => {
                    const src = n.source || "Sermão";
                    if (!bySource[src]) bySource[src] = [];
                    bySource[src].push(n);
                  });

                  return Object.entries(bySource).map(([source, srcNotes]) => (
                    <div key={`sermon-${source}`} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                      <div className="px-5 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-[10px] tracking-[0.25em] title-strong uppercase">
                              {source.toUpperCase()}
                            </h3>
                            <p className="text-[10px] font-sans text-foreground">Pregação Clássica</p>
                          </div>
                        </div>
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
                            <TranslatableText
                              text={note.content}
                              className="text-[13px] comment-strong leading-[1.8] whitespace-pre-line"
                              renderText={(content) => renderContentWithRefs(content, onNavigate ? handleNavigate : undefined)}
                              forceTranslate
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                }

                return (
                  <div key={type} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                    <div className="px-5 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                      <h3 className="text-[10px] tracking-[0.25em] title-strong uppercase">
                        {config.label}
                      </h3>
                      {config.subtitle && (
                        <p className="text-[10px] font-sans text-foreground mt-0.5">{config.subtitle}</p>
                      )}
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      {typeNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`${typeNotes.length > 1 ? "pb-4 border-b border-border/30 last:border-0 last:pb-0" : ""} ${note.color ? "pl-3 border-l-2" : ""}`}
                          style={note.color ? { borderLeftColor: note.color } : undefined}
                        >
                          <div className="flex items-start gap-2 mb-1.5">
                            <span
                              className="text-[10px] font-sans font-semibold tracking-wider shrink-0 mt-0.5"
                              style={{ color: note.color || undefined }}
                            >
                              v. {note.verse_start}{note.verse_end ? `–${note.verse_end}` : ""}
                            </span>
                            <div className="flex-1">
                              {note.title && note.title !== config.label && (
                                <span className="text-xs font-sans font-semibold text-foreground block">{note.title}</span>
                              )}
                              {note.source && (
                                <span
                                  className="text-[10px] font-sans italic"
                                  style={{ color: note.color || undefined }}
                                >
                                  {note.source}
                                </span>
                              )}
                            </div>
                          </div>
                          <TranslatableText
                            text={note.content}
                            className="text-[13px] comment-strong leading-[1.8] whitespace-pre-line"
                            renderText={(content) => renderContentWithRefs(content, onNavigate ? handleNavigate : undefined)}
                            forceTranslate
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* Concordância Exaustiva */}
            {!loading && concordanceRefs.length > 0 && (
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="px-5 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Link2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-[10px] tracking-[0.25em] title-strong uppercase">
                        CONCORDÂNCIA EXAUSTIVA
                      </h3>
                      <p className="text-[10px] font-sans text-foreground">Referências Cruzadas</p>
                    </div>
                  </div>
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
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default StudyNotesPanel;
