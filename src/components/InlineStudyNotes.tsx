import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import { Loader2, BookOpen, Languages, Link2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import InterlinearView from "@/components/InterlinearView";
import { toast } from "sonner";

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

interface AiSections {
  explicacao?: string;
  aplicacao?: string;
  autores?: string;
  scofield?: string;
  insight?: string;
  // Legacy fields for backward compat
  matthewHenry?: string;
  strong?: string;
  pentecostal?: string;
  reformada?: string;
  devocional?: string;
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

// Author → color mapping
const AUTHOR_COLORS: Record<string, string> = {
  "calvino": "#1E40AF",
  "joão calvino": "#1E40AF",
  "matthew henry": "#B8860B",
  "john owen": "#6B21A8",
  "thomas watson": "#6B21A8",
  "richard baxter": "#6B21A8",
  "puritanos": "#6B21A8",
  "lutero": "#047857",
  "martinho lutero": "#047857",
  "agostinho": "#6B7280",
  "crisóstomo": "#6B7280",
  "atanásio": "#6B7280",
  "pais da igreja": "#6B7280",
  "wesley": "#EA580C",
  "john wesley": "#EA580C",
  "finney": "#DC2626",
  "charles finney": "#DC2626",
  "torrey": "#DC2626",
  "r. a. torrey": "#DC2626",
};

function getAuthorColor(author: string): string {
  const lower = author.trim().toLowerCase();
  for (const [key, color] of Object.entries(AUTHOR_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "hsl(var(--muted-foreground))";
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
  const [aiSections, setAiSections] = useState<AiSections | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [scofieldOpen, setScofieldOpen] = useState(false);
  const aiFeatureEnabled = false;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  useEffect(() => {
    setAiSections(null);
    setScofieldOpen(false);
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

  const generateAiNotes = useCallback(async () => {
    setAiLoading(true);
    const bookName = bibleBooks.find((b) => b.id === bookId)?.name || bookId;
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-note", {
        body: { bookId, bookName, chapter, verse },
      });
      if (error) throw error;
      if (data?.sections) {
        setAiSections(data.sections);
      } else if (data?.note) {
        setAiSections({ explicacao: data.note });
      } else {
        toast.error("Não foi possível gerar notas.");
      }
    } catch (err: any) {
      console.error("AI generation error:", err);
      if (err?.message?.includes("429") || err?.status === 429) {
        toast.error("Limite de requisições excedido. Tente novamente em alguns segundos.");
      } else if (err?.message?.includes("402") || err?.status === 402) {
        toast.error("Créditos de IA esgotados.");
      } else {
        toast.error("Erro ao gerar notas de estudo.");
      }
    } finally {
      setAiLoading(false);
    }
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

  // Parse autores string into colored chips
  const renderAuthorChips = (autoresStr: string) => {
    const authors = autoresStr.split(",").map((a) => a.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {authors.map((author, i) => {
          const color = getAuthorColor(author);
          return (
            <span
              key={i}
              className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{
                color,
                backgroundColor: `${color}15`,
                border: `1px solid ${color}30`,
              }}
            >
              {author}
            </span>
          );
        })}
      </div>
    );
  };

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

      {/* Notes tab */}
      {activeTab === "notes" && (
        <div className="divide-y divide-border/30">
          {/* AI Generate Button */}
          {aiFeatureEnabled && !aiSections && !aiLoading && (
            <div className="px-5 py-3">
              <button
                onClick={generateAiNotes}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#1E40AF]/10 to-[#6B21A8]/10 border border-[#1E40AF]/20 hover:border-[#1E40AF]/40 text-sm font-sans font-semibold text-foreground transition-all hover:shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#1E40AF]" />
                Gerar Notas de Estudo
              </button>
            </div>
          )}

          {aiFeatureEnabled && aiLoading && (
            <div className="px-5 py-6 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-sans">Gerando notas de estudo…</span>
            </div>
          )}

          {/* AI Generated — Modern Study Bible Layout */}
          {aiFeatureEnabled && aiSections && (
            <div className="px-5 py-5 space-y-4">
              {/* Main explanation card */}
              {aiSections.explicacao && (
                <div className="rounded-xl border border-border/40 bg-card">
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-2.5">
                      Explicação
                    </p>
                    <div className="text-[15px] font-serif leading-[1.9] text-foreground/90">
                      {renderContentWithRefs(aiSections.explicacao, onNavigate ? handleNav : undefined)}
                    </div>
                  </div>

                  {/* Application — subtle highlight */}
                  {aiSections.aplicacao && (
                    <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-primary/5 border-l-2 border-primary/40">
                      <p className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-primary/60 mb-1.5">
                        Aplicação
                      </p>
                      <div className="text-sm font-sans leading-[1.8] text-foreground/80">
                        {renderContentWithRefs(aiSections.aplicacao, onNavigate ? handleNav : undefined)}
                      </div>
                    </div>
                  )}

                  {/* Insight — optional small block */}
                  {aiSections.insight && (
                    <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-muted/30">
                      <p className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-muted-foreground/60 mb-1.5">
                        Insight Teológico
                      </p>
                      <div className="text-sm font-sans leading-[1.8] text-foreground/70 italic">
                        {renderContentWithRefs(aiSections.insight, onNavigate ? handleNav : undefined)}
                      </div>
                    </div>
                  )}

                  {/* Author chips */}
                  {aiSections.autores && (
                    <div className="px-5 pb-4">
                      {renderAuthorChips(aiSections.autores)}
                    </div>
                  )}
                </div>
              )}

              {/* Scofield collapsible */}
              {aiSections.scofield && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#1E40AF30" }}>
                  <button
                    onClick={() => setScofieldOpen(!scofieldOpen)}
                    className="w-full flex items-center gap-2.5 px-5 py-3 hover:bg-[#1E40AF]/5 transition-colors cursor-pointer"
                  >
                    <span className="text-base">📘</span>
                    <span
                      className="text-[11px] tracking-wider font-sans font-bold uppercase flex-1 text-left"
                      style={{ color: "#1E40AF" }}
                    >
                      Scofield Reference Bible (1917)
                    </span>
                    <span className="text-[9px] font-sans text-muted-foreground/60 bg-muted/40 rounded px-1.5 py-0.5">
                      Traduzido
                    </span>
                    {scofieldOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {scofieldOpen && (
                    <div className="px-5 pb-5">
                      <div
                        className="p-4 rounded-lg border"
                        style={{ backgroundColor: "#1E40AF08", borderColor: "#1E40AF20" }}
                      >
                        <div className="text-[15px] font-serif leading-[1.9] whitespace-pre-line text-foreground/85">
                          {renderContentWithRefs(aiSections.scofield, onNavigate ? handleNav : undefined)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Legacy AI sections (backward compat for old format) */}
              {(aiSections.matthewHenry || aiSections.reformada || aiSections.strong || aiSections.pentecostal || aiSections.devocional) && (
                <>
                  {[
                    { key: "matthewHenry", label: "Matthew Henry", color: "#B8860B", icon: "📖" },
                    { key: "reformada", label: "Nota Reformada / Puritana", color: "#6B21A8", icon: "⛪" },
                    { key: "strong", label: "Teologia Sistemática", color: "#B45309", icon: "🔬" },
                    { key: "pentecostal", label: "Perspectiva Wesleyana", color: "#DC2626", icon: "🔥" },
                    { key: "devocional", label: "Devocional", color: "#0891B2", icon: "💎" },
                  ].map(({ key, label, color, icon }) => {
                    const content = (aiSections as any)[key];
                    if (!content || content === "null") return null;
                    const isExpanded = expandedSections.has(key);
                    return (
                      <div key={key} className="rounded-xl border overflow-hidden" style={{ borderColor: `${color}30` }}>
                        <button
                          onClick={() => toggleSection(key)}
                          className="w-full flex items-center gap-2.5 px-5 py-3 transition-colors cursor-pointer"
                          style={{ backgroundColor: isExpanded ? `${color}08` : undefined }}
                        >
                          <span className="text-base">{icon}</span>
                          <span className="text-[11px] tracking-wider font-sans font-bold uppercase flex-1 text-left" style={{ color }}>
                            {label}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        {isExpanded && (
                          <div className="px-5 pb-5">
                            <div className="p-4 rounded-lg border" style={{ backgroundColor: `${color}08`, borderColor: `${color}20` }}>
                              <div className="text-[15px] font-serif leading-[1.9] whitespace-pre-line text-foreground/85">
                                {renderContentWithRefs(content, onNavigate ? handleNav : undefined)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* Empty state */}
          {!hasContent && (!aiFeatureEnabled || (!aiSections && !aiLoading)) && (
            <div className="py-4 px-5">
              <p className="text-sm text-muted-foreground font-sans italic">Sem notas pré-cadastradas para este versículo.</p>
            </div>
          )}

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
                  {typeNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-5 rounded-xl border"
                      style={
                        note.color
                          ? { backgroundColor: `${note.color}10`, borderColor: `${note.color}30` }
                          : { backgroundColor: "hsl(var(--muted) / 0.15)", borderColor: "hsl(var(--border) / 0.3)" }
                      }
                    >
                      {note.title && (
                        <p
                          className="text-xs font-sans font-bold mb-3 pb-2 border-b uppercase tracking-wider"
                          style={note.color ? { color: note.color, borderColor: `${note.color}30` } : {}}
                        >
                          {note.title}
                        </p>
                      )}
                      <div className="text-[15px] font-serif leading-[1.9] whitespace-pre-line text-left text-foreground/85">
                        {renderContentWithRefs(note.content, onNavigate ? handleNav : undefined)}
                      </div>
                      {note.source && (
                        <div className="mt-3 pt-2 border-t" style={{ borderColor: note.color ? `${note.color}25` : "hsl(var(--border) / 0.2)" }}>
                          <span
                            className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={
                              note.color
                                ? { color: note.color, backgroundColor: `${note.color}12` }
                                : { color: "hsl(var(--muted-foreground) / 0.6)" }
                            }
                          >
                            {SOURCE_LABELS[note.source] || note.source}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
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
