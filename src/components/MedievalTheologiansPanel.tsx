import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import {
  X,
  Loader2,
  BookOpen,
  Feather,
  Scale,
  Heart,
  Crown,
  Star,
  ChevronDown,
  ChevronUp,
  Users,
  Sparkles,
  Library,
  MoreVertical,
  ExternalLink,
  Copy,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MedievalNote {
  id: string;
  book_id: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  title: string | null;
  content: string;
  source: string;
  note_type: string;
  color: string | null;
}

interface MedievalTheologian {
  id: string;
  name: string;
  title: string;
  years: string;
  tradition: "thomism" | "franciscana" | "carolingian" | "escolastica" | "mistica";
  color: string;
  icon: React.ReactNode;
  description: string;
}

interface MedievalTheologiansPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse: number | null;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

const MEDIEVAL_THEOLOGIANS: MedievalTheologian[] = [
  {
    id: "aquinas",
    name: "Tomás de Aquino",
    title: "Doutor Angélico",
    years: "1225-1274",
    tradition: "thomism",
    color: "#1E40AF",
    icon: <Scale className="w-4 h-4" />,
    description: "Suma Teológica, Cinco Vias, Lei Natural"
  },
  {
    id: "bernard",
    name: "Bernardo de Claraval",
    title: "Doctor Mellifluus",
    years: "1090-1153",
    tradition: "mistica",
    color: "#7C3AED",
    icon: <Heart className="w-4 h-4" />,
    description: "Misticismo, devoção mariana, reformas cistercienses"
  },
  {
    id: "augustine_harensis",
    name: "Agostinho de Hipona",
    title: "Doctor Gratiae",
    years: "354-430",
    tradition: "carolingian",
    color: "#B45309",
    icon: <Star className="w-4 h-4" />,
    description: "Graça, Pecado Original, Cidade de Deus"
  },
  {
    id: "anselm",
    name: "Anselmo de Cantuária",
    title: "Pai da Escolástica",
    years: "1033-1109",
    tradition: "escolastica",
    color: "#047857",
    icon: <Crown className="w-4 h-4" />,
    description: "Prova ontológica, fé buscando entendimento"
  },
  {
    id: "bonaventure",
    name: "Boaventura",
    title: "Doctor Seraphicus",
    years: "1221-1274",
    tradition: "franciscana",
    color: "#C026D3",
    icon: <Feather className="w-4 h-4" />,
    description: "Misticismo franciscano, iluminação"
  },
  {
    id: "germanus",
    name: "Gregório de Nissa",
    title: "Doctor Christianorum",
    years: "335-394",
    tradition: "carolingian",
    color: "#0891B2",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Trindade, apofatismo, pneumatologia"
  },
  {
    id: "maximus",
    name: "Maximo o Confessor",
    title: "Doctor Maximus",
    years: "580-662",
    tradition: "carolingian",
    color: "#BE185D",
    icon: <Sparkles className="w-4 h-4" />,
    description: "Cristologia, teologia mística, divinização"
  },
  {
    id: "john_damascene",
    name: "João Damasceno",
    title: "Doctor Orientalis",
    years: "675-749",
    tradition: "carolingian",
    color: "#6366F1",
    icon: <Library className="w-4 h-4" />,
    description: "Ícones, teologia sistemática, filosofia"
  }
];

const TRADITION_COLORS: Record<string, { bg: string; text: string }> = {
  thomism: { bg: "bg-blue-100", text: "text-blue-800" },
  franciscana: { bg: "bg-purple-100", text: "text-purple-800" },
  carolingian: { bg: "bg-amber-100", text: "text-amber-800" },
  escolastica: { bg: "bg-emerald-100", text: "text-emerald-800" },
  mistica: { bg: "bg-rose-100", text: "text-rose-800" }
};

const TRADITION_LABELS: Record<string, string> = {
  thomism: "Tomismo",
  franciscana: "Escola Franciscana",
  carolingian: "Patrística",
  escolastica: "Escolástica",
  mistica: "Mística"
};

const MedievalTheologiansPanel = ({
  open,
  onClose,
  bookId,
  chapter,
  selectedVerse,
  onNavigate
}: MedievalTheologiansPanelProps) => {
  const [notes, setNotes] = useState<MedievalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheologian, setSelectedTheologian] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!open) return;

    const fetchNotes = async () => {
      setLoading(true);

      let query = supabase
        .from("study_notes")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .in("source", [
          "Tomás de Aquino",
          "Bernardo de Claraval",
          "Agostinho de Hipona",
          "Anselmo de Cantuária",
          "Boaventura",
          "Gregório de Nissa",
          "Maximo o Confessor",
          "João Damasceno"
        ])
        .order("verse_start");

      if (selectedVerse) {
        query = query.lte("verse_start", selectedVerse);
      }

      const { data } = await query;
      setNotes(data || []);
      setLoading(false);
    };

    fetchNotes();
  }, [open, bookId, chapter, selectedVerse]);

  const theologiansWithNotes = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((note) => {
      const theologian = MEDIEVAL_THEOLOGIANS.find(
        (t) => t.name === note.source
      );
      if (theologian) {
        counts[theologian.id] = (counts[theologian.id] || 0) + 1;
      }
    });
    return counts;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (!selectedTheologian) return notes;
    const theologian = MEDIEVAL_THEOLOGIANS.find((t) => t.id === selectedTheologian);
    return notes.filter((n) => n.source === theologian?.name);
  }, [notes, selectedTheologian]);

  const bookName = bibleBooks.find((b) => b.id === bookId)?.name || bookId;

  const handleNavigate = (targetBookId: string, targetChapter: number, verse?: number) => {
    if (onNavigate) {
      onClose();
      onNavigate(targetBookId, targetChapter, verse);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="reader-floating-panel fixed top-0 right-0 h-full w-full max-w-xl bg-background border-l border-border z-50 animate-fade-in flex flex-col shadow-2xl">
        {/* Header */}
        <div className="reader-panel-header px-5 py-4 border-b border-border bg-gradient-to-r from-violet-50/50 to-transparent dark:from-violet-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Library className="w-4 h-4 text-violet-600" />
              <h2 className="text-xs tracking-[0.2em] title-strong uppercase">
                TEÓLOGOS MEDIEVAIS
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-foreground/70 mb-3">
            <BookOpen className="w-3 h-3" />
            <span>{bookName}</span>
            <span>•</span>
            <span>Capítulo {chapter}</span>
            {selectedVerse && (
              <>
                <span>•</span>
                <span>Versículo {selectedVerse}</span>
              </>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8">
              <TabsTrigger value="overview" className="text-xs gap-1 h-7">
                <Sparkles className="w-3 h-3" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="theologians" className="text-xs gap-1 h-7">
                <Users className="w-3 h-3" />
                Teólogos
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs gap-1 h-7">
                <BookOpen className="w-3 h-3" />
                Notas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-foreground" />
              </div>
            )}

            {!loading && activeTab === "overview" && (
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-center dark:border-violet-800 dark:bg-violet-950/20">
                    <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                      {Object.keys(theologiansWithNotes).length}
                    </p>
                    <p className="text-[10px] text-foreground/60">Teólogos</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-center dark:border-amber-800 dark:bg-amber-950/20">
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {notes.length}
                    </p>
                    <p className="text-[10px] text-foreground/60">Notas</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {new Set(notes.map((n) => n.verse_start)).size}
                    </p>
                    <p className="text-[10px] text-foreground/60">Versículos</p>
                  </div>
                </div>

                {/* Theologians Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {MEDIEVAL_THEOLOGIANS.map((theologian) => {
                    const count = theologiansWithNotes[theologian.id] || 0;
                    const tradition = TRADITION_COLORS[theologian.tradition];

                    return (
                      <button
                        key={theologian.id}
                        onClick={() => {
                          setSelectedTheologian(theologian.id);
                          setActiveTab("notes");
                        }}
                        className={`relative rounded-xl border p-3 text-left transition-all hover:border-primary/30 ${
                          selectedTheologian === theologian.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${theologian.color}20` }}
                          >
                            <span style={{ color: theologian.color }}>
                              {theologian.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {theologian.name}
                            </p>
                            <p className="text-[10px] text-foreground/60">
                              {theologian.years}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${tradition.bg} ${tradition.text}`}
                          >
                            {TRADITION_LABELS[theologian.tradition]}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {count}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Introduction */}
                <div className="rounded-xl border border-violet-200 bg-violet-50/30 p-4 dark:border-violet-800 dark:bg-violet-950/10">
                  <h3 className="text-xs font-semibold text-violet-800 dark:text-violet-200 mb-2 flex items-center gap-2">
                    <Library className="w-4 h-4" />
                    Tradição Teológica Medieval
                  </h3>
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    Esta seção apresenta comentários de teólogos da tradição patrística e medieval,
                    incluindo contribuições do Tomismo, Escola Franciscana, Mística e Escolástica.
                    Estes pensadores moldaram a teologia cristã ocidental e oriental.
                  </p>
                </div>
              </div>
            )}

            {!loading && activeTab === "theologians" && (
              <div className="space-y-3">
                {MEDIEVAL_THEOLOGIANS.map((theologian) => {
                  const count = theologiansWithNotes[theologian.id] || 0;
                  const tradition = TRADITION_COLORS[theologian.tradition];

                  return (
                    <div
                      key={theologian.id}
                      className={`rounded-xl border p-4 transition-all ${
                        selectedTheologian === theologian.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${theologian.color}15` }}
                        >
                          <span style={{ color: theologian.color }}>
                            {theologian.icon}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">
                                {theologian.name}
                              </h3>
                              <p className="text-[10px] text-foreground/60">
                                {theologian.title} • {theologian.years}
                              </p>
                            </div>
                            {count > 0 && (
                              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                                {count} notas
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-foreground/70 mb-2">
                            {theologian.description}
                          </p>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${tradition.bg} ${tradition.text}`}
                            >
                              {TRADITION_LABELS[theologian.tradition]}
                            </span>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                setSelectedTheologian(theologian.id);
                                setActiveTab("notes");
                              }}
                            >
                              Ver notas
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && activeTab === "notes" && (
              <div className="space-y-3">
                {selectedTheologian && (
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedTheologian(null)}
                    >
                      Todos os teólogos
                    </Button>
                  </div>
                )}

                {filteredNotes.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <BookOpen className="w-10 h-10 mx-auto text-foreground/30 mb-3" />
                    <p className="text-sm text-foreground/70 mb-1">
                      Nenhuma nota disponível
                    </p>
                    <p className="text-xs text-foreground/50">
                      para {selectedTheologian || "este capítulo"}
                    </p>
                  </div>
                ) : (
                  filteredNotes.map((note) => {
                    const theologian = MEDIEVAL_THEOLOGIANS.find(
                      (t) => t.name === note.source
                    );
                    const isExpanded = expandedNoteId === note.id;

                    return (
                      <div
                        key={note.id}
                        className="rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/20 transition-colors"
                      >
                        <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {theologian && (
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center"
                                style={{ backgroundColor: `${theologian.color}15` }}
                              >
                                <span style={{ color: theologian.color, fontSize: 12 }}>
                                  {theologian.icon}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-[11px] font-medium text-foreground">
                                {note.source}
                              </span>
                              <span className="text-[10px] text-foreground/50 ml-2">
                                v. {note.verse_start}
                                {note.verse_end ? `-${note.verse_end}` : ""}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copiar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                  >
                                    <Bookmark className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Salvar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>

                        <div className="p-4">
                          {note.title && (
                            <h4 className="text-xs font-semibold text-foreground mb-2">
                              {note.title}
                            </h4>
                          )}

                          <p className={`text-sm comment-strong leading-relaxed ${!isExpanded ? "line-clamp-3" : ""}`}>
                            {note.content}
                          </p>

                          {note.content.length > 200 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full mt-2 text-xs"
                              onClick={() =>
                                setExpandedNoteId(isExpanded ? null : note.id)
                              }
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3 mr-1" />
                                  Mostrar menos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  Ler mais
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-foreground/60">
              <Library className="w-3 h-3" />
              <span>{notes.length} notas de teólogos medievais</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MedievalTheologiansPanel;