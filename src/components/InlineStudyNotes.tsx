import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import { Loader2, BookOpen, Languages, Link2, ChevronDown, ChevronUp } from "lucide-react";
import InterlinearView from "@/components/InterlinearView";

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

interface InlineStudyNotesProps {
  bookId: string;
  chapter: number;
  verse: number;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
  onClose: () => void;
}

const abbrevToId: Record<string, string> = {};
const nameToId: Record<string, string> = {};
bibleBooks.forEach((b) => {
  abbrevToId[b.abbrev.toLowerCase()] = b.id;
  nameToId[b.name.toLowerCase()] = b.id;
  abbrevToId[b.id] = b.id;
});

function parseReference(refStr: string) {
  const match = refStr.trim().match(/^(\d?\s?[A-Za-zÀ-ú]+)\s+(\d+)(?:[\.:](\d+))?/);
  if (!match) return null;
  const abbrev = match[1].replace(/\s/g, "").toLowerCase();
  const bookId = abbrevToId[abbrev] || nameToId[abbrev];
  if (!bookId) return null;
  return { bookId, chapter: parseInt(match[2], 10), verse: match[3] ? parseInt(match[3], 10) : undefined };
}

function renderContentWithRefs(
  text: string,
  onNav?: (bookId: string, chapter: number, verse?: number) => void
) {
  if (!onNav) return <span>{text}</span>;
  const refRegex = /(\d?\s?[A-ZÀ-Ú][a-zà-ú]+)\s+(\d+)[\.:](\d+)(?:-(\d+))?/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = refRegex.exec(text)) !== null) {
    const abbrev = match[1].replace(/\s/g, "").toLowerCase();
    const bookId = abbrevToId[abbrev] || nameToId[abbrev];
    if (bookId) {
      if (match.index > lastIndex) parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
      const ch = parseInt(match[2], 10);
      const vs = parseInt(match[3], 10);
      parts.push(
        <button
          key={`r${match.index}`}
          className="text-primary font-semibold hover:underline cursor-pointer bg-primary/5 hover:bg-primary/10 rounded px-1 py-0.5 transition-colors mx-0.5"
          onClick={() => onNav(bookId, ch, vs)}
        >
          📖 {match[0]}
        </button>
      );
      lastIndex = match.index + match[0].length;
    }
  }
  if (lastIndex < text.length) parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex)}</span>);
  return parts.length > 0 ? <>{parts}</> : <span>{text}</span>;
}

const SOURCE_LABELS: Record<string, string> = {
  matthew_henry: "Matthew Henry",
  sermon: "Sermão",
  commentary: "Nota de Estudo",
  concordance: "Concordância",
};

const InlineStudyNotes = ({ bookId, chapter, verse, onNavigate, onClose }: InlineStudyNotesProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [concordance, setConcordance] = useState<StudyNote[]>([]);
  const [dictEntries, setDictEntries] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["main"]));
  const [activeTab, setActiveTab] = useState<"notes" | "interlinear">("notes");

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [notesRes, concRes, dictRes] = await Promise.all([
        supabase
          .from("study_notes")
          .select("*")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .neq("note_type", "concordance")
          .lte("verse_start", verse)
          .order("verse_start"),
        supabase
          .from("study_notes")
          .select("*")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .eq("note_type", "concordance")
          .eq("verse_start", verse),
        supabase
          .from("bible_dictionary")
          .select("*")
          .not("references_list", "is", null)
          .not("hebrew_greek", "is", null),
      ]);

      let filtered = (notesRes.data as StudyNote[]) || [];
      filtered = filtered.filter(
        (n) => n.verse_start <= verse && (n.verse_end ? n.verse_end >= verse : n.verse_start === verse)
      );
      setNotes(filtered);
      setConcordance((concRes.data as StudyNote[]) || []);

      const allDict = (dictRes.data as DictEntry[]) || [];
      const matched = allDict.filter((e) => {
        if (!e.references_list || !Array.isArray(e.references_list)) return false;
        return e.references_list.some((ref: string) => {
          const parsed = parseReference(ref);
          return parsed && parsed.bookId === bookId && parsed.chapter === chapter && parsed.verse === verse;
        });
      });
      setDictEntries(matched);
      setLoading(false);
    };
    fetchData();
  }, [bookId, chapter, verse]);

  const handleNav = useCallback(
    (bId: string, ch: number, v?: number) => {
      onClose();
      onNavigate?.(bId, ch, v);
    },
    [onNavigate, onClose]
  );

  const hasContent = notes.length > 0 || concordance.length > 0 || dictEntries.length > 0;

  if (loading) {
    return (
      <div className="py-5 px-5 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-sans">Carregando notas…</span>
      </div>
    );
  }

  // Group notes by type
  const grouped: Record<string, StudyNote[]> = {};
  notes.forEach((n) => {
    const key = n.note_type || "commentary";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(n);
  });

  return (
    <div className="my-4 mx-1 rounded-xl border border-primary/20 bg-card shadow-lg overflow-hidden animate-fade-in">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-5 py-3 bg-primary/5 border-b border-primary/10">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-1.5 text-xs tracking-wider font-sans font-bold uppercase transition-all pb-1 cursor-pointer ${
              activeTab === "notes"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Notas
          </button>
          <button
            onClick={() => setActiveTab("interlinear")}
            className={`flex items-center gap-1.5 text-xs tracking-wider font-sans font-bold uppercase transition-all pb-1 cursor-pointer ${
              activeTab === "interlinear"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            Interlinear
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-sm w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Interlinear tab */}
      {activeTab === "interlinear" && (
        <InterlinearView
          bookId={bookId}
          chapter={chapter}
          verse={verse}
          onClose={() => setActiveTab("notes")}
        />
      )}

      {/* Notes tab - empty state */}
      {activeTab === "notes" && !hasContent && (
        <div className="py-6 px-5">
          <p className="text-sm text-muted-foreground font-sans italic">Sem notas de estudo para este versículo.</p>
        </div>
      )}

      {/* Notes tab - content */}
      {activeTab === "notes" && hasContent && (
        <div className="divide-y divide-border/30">
          {/* Dictionary / Original Words */}
          {dictEntries.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection("dict")}
                className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <Languages className="w-4 h-4 text-primary" />
                <span className="text-xs tracking-wider font-sans font-bold uppercase flex-1 text-left text-foreground">
                  Palavras Originais
                </span>
                {expandedSections.has("dict") ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has("dict") && (
                <div className="px-5 pb-5 space-y-3">
                  {dictEntries.map((entry) => (
                    <div key={entry.id} className="p-4 rounded-xl bg-muted/20 border border-border/30">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="font-serif font-bold text-primary text-xl">{entry.term}</span>
                        {entry.hebrew_greek && (
                          <span className="text-sm font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                            {entry.hebrew_greek}
                          </span>
                        )}
                      </div>
                      <p className="text-base font-serif leading-[2] text-foreground/90 text-left">{entry.definition}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Study notes by type */}
          {Object.entries(grouped).map(([type, typeNotes]) => (
            <div key={type}>
              <button
                onClick={() => toggleSection(type)}
                className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-xs tracking-wider font-sans font-bold uppercase flex-1 text-left text-foreground">
                  {SOURCE_LABELS[type] || type}
                </span>
                {expandedSections.has(type) ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has(type) && (
                <div className="px-5 pb-5 space-y-4">
                  {typeNotes.map((note) => {
                    const bgColor = note.color ? `bg-[${note.color}]/10` : "bg-muted/20";
                    const borderColor = note.color ? `border-[${note.color}]/30` : "border-border/30";
                    const textColor = note.color ? `text-[${note.color}]` : "text-foreground";
                    const sourceColor = note.color ? `text-[${note.color}]/70` : "text-muted-foreground/60";
                    return (
                      <div key={note.id} className={`p-5 rounded-xl ${bgColor} border ${borderColor}`} style={note.color ? { backgroundColor: `${note.color}15`, borderColor: `${note.color}4d` } : {}}>
                        {note.title && (
                          <p className={`text-sm font-sans font-bold ${textColor} mb-3 pb-2 border-b ${borderColor}`} style={note.color ? { color: note.color, borderColor: `${note.color}4d` } : {}}>
                            {note.title}
                          </p>
                        )}
                        <div className="text-base font-serif leading-[2.1] whitespace-pre-line text-left" style={note.color ? { color: note.color } : {}}>
                          {renderContentWithRefs(note.content, onNavigate ? handleNav : undefined)}
                        </div>
                        {note.source && (
                          <p className={`text-[10px] font-sans ${sourceColor} mt-3 pt-2 border-t ${borderColor} uppercase tracking-wider`} style={note.color ? { color: `${note.color}b3`, borderColor: `${note.color}33` } : {}}>
                            Fonte: {SOURCE_LABELS[note.source] || note.source}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Concordance / Cross References */}
          {concordance.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection("conc")}
                className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <Link2 className="w-4 h-4 text-primary" />
                <span className="text-xs tracking-wider font-sans font-bold uppercase flex-1 text-left text-foreground">
                  Referências Cruzadas
                </span>
                {expandedSections.has("conc") ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has("conc") && (
                <div className="px-5 pb-5">
                  {concordance.map((ref) => (
                    <div key={ref.id} className="flex flex-wrap gap-2">
                      {ref.content.split(";").map((r, i) => {
                        const parsed = parseReference(r.trim());
                        if (parsed && onNavigate) {
                          return (
                            <button
                              key={i}
                              className="text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg px-3.5 py-2 text-sm font-sans font-medium transition-all cursor-pointer hover:shadow-sm active:scale-95"
                              onClick={() => handleNav(parsed.bookId, parsed.chapter, parsed.verse)}
                            >
                              📖 {r.trim()}
                            </button>
                          );
                        }
                        return (
                          <span key={i} className="text-muted-foreground text-sm px-2 py-1.5">
                            {r.trim()}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineStudyNotes;
