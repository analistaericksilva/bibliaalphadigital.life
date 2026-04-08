import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import {
  X,
  Loader2,
  Link2,
  ChevronRight,
  GitBranch,
  Network,
  Sparkles,
  BookOpen,
  ArrowRight,
  Circle,
  Maximize2,
  Minimize2,
  Filter,
  Eye,
  Hash,
  CornerDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CrossRefNode {
  bookId: string;
  chapter: number;
  verse: number;
  label: string;
  depth: number;
}

interface CrossRefGroup {
  verse: number;
  refs: string[];
  sources: string[];
}

interface CrossRefsPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse: number | null;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

const abbrevToId: Record<string, string> = {};
const nameToId: Record<string, string> = {};
const idToAbbrev: Record<string, string> = {};
const idToName: Record<string, string> = {};

bibleBooks.forEach((b) => {
  abbrevToId[b.abbrev.toLowerCase()] = b.id;
  nameToId[b.name.toLowerCase()] = b.id;
  abbrevToId[b.id] = b.id;
  idToAbbrev[b.id] = b.abbrev;
  idToName[b.id] = b.name;
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

function getBookColor(bookId: string): string {
  const colors: Record<string, string> = {
    gn: "#8B5CF6",
    ex: "#3B82F6",
    lv: "#10B981",
    nm: "#F59E0B",
    dt: "#EF4444",
    js: "#EC4899",
    jz: "#6366F1",
    rt: "#14B8A6",
    "1sm": "#F97316",
    "2sm": "#EAB308",
    "1rs": "#84CC16",
    "2rs": "#22C55E",
    "1cr": "#06B6D4",
    "2cr": "#0EA5E9",
    ed: "#A855F7",
    ne: "#D946EF",
    et: "#F43F5E",
    sl: "#8B5CF6",
    pv: "#14B8A6",
    ec: "#F59E0B",
    ct: "#EC4899",
    is: "#3B82F6",
    jr: "#6366F1",
    lm: "#10B981",
    ez: "#EF4444",
    dn: "#F97316",
    os: "#84CC16",
    am: "#06B6D4",
    ob: "#D946EF",
    jn: "#A855F7",
    mc: "#14B8A6",
    na: "#F59E0B",
    ha: "#EC4899",
    zc: "#3B82F6",
    ml: "#6366F1",
    mt: "#10B981",
    lc: "#F97316",
    jo: "#84CC16",
    at: "#22C55E",
    rm: "#06B6D4",
    "1co": "#D946EF",
    "2co": "#A855F7",
    gl: "#14B8A6",
    ef: "#F59E0B",
    fp: "#EC4899",
    cl: "#3B82F6",
    "1ts": "#6366F1",
    "2ts": "#10B981",
    "1tm": "#EF4444",
    "2tm": "#F97316",
    tt: "#84CC16",
    hb: "#22C55E",
    tg: "#06B6D4",
    "1pe": "#D946EF",
    "2pe": "#A855F7",
    "1jo": "#14B8A6",
    "2jo": "#F59E0B",
    "3jo": "#EC4899",
    jd: "#3B82F6",
    ap: "#F43F5E"
  };
  return colors[bookId] || "#6B7280";
}

const CrossRefsPanel = ({
  open,
  onClose,
  bookId,
  chapter,
  selectedVerse,
  onNavigate
}: CrossRefsPanelProps) => {
  const [loading, setLoading] = useState(true);
  const [rawRefs, setRawRefs] = useState<string[]>([]);
  const [expandedRefs, setExpandedRefs] = useState<CrossRefNode[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "tree" | "insights">("list");
  const [depthFilter, setDepthFilter] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    const fetchCrossRefs = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("study_notes")
        .select("content")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("note_type", "concordance")
        .order("verse_start");

      if (selectedVerse) {
        const selectedData = await supabase
          .from("study_notes")
          .select("content")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .eq("note_type", "concordance")
          .eq("verse_start", selectedVerse);

        setRawRefs(
          (selectedData.data || []).flatMap((row) =>
            row.content.split(";").map((r: string) => r.trim()).filter(Boolean)
          )
        );
      } else {
        setRawRefs(
          (data || []).flatMap((row) =>
            row.content.split(";").map((r: string) => r.trim()).filter(Boolean)
          )
        );
      }

      setLoading(false);
    };

    fetchCrossRefs();
  }, [open, bookId, chapter, selectedVerse]);

  useEffect(() => {
    const expandRefs = () => {
      const nodes: CrossRefNode[] = [];
      const seen = new Set<string>();

      const expand = (refStr: string, depth: number) => {
        if (depth > depthFilter) return;

        const parsed = parseReference(refStr);
        if (!parsed) return;

        const key = `${parsed.bookId}-${parsed.chapter}-${parsed.verse || 1}`;
        if (seen.has(key)) return;
        seen.add(key);

        nodes.push({
          bookId: parsed.bookId,
          chapter: parsed.chapter,
          verse: parsed.verse || 1,
          label: refStr,
          depth
        });

        if (depth < depthFilter) {
          const newDepth = depth + 1;
        }
      };

      rawRefs.forEach((ref) => expand(ref, 0));
      setExpandedRefs(nodes);
    };

    expandRefs();
  }, [rawRefs, depthFilter]);

  const groupedByVerse = useMemo(() => {
    const groups: Record<number, { refs: string[]; uniqueBooks: Set<string> }> = {};

    rawRefs.forEach((ref) => {
      const parsed = parseReference(ref);
      if (!parsed) return;

      const verse = parsed.verse || parsed.chapter;
      if (!groups[verse]) {
        groups[verse] = { refs: [], uniqueBooks: new Set() };
      }

      groups[verse].refs.push(ref);
      groups[verse].uniqueBooks.add(parsed.bookId);
    });

    return Object.entries(groups)
      .map(([verse, data]) => ({
        verse: parseInt(verse),
        refs: data.refs,
        bookCount: data.uniqueBooks.size
      }))
      .sort((a, b) => a.verse - b.verse);
  }, [rawRefs]);

  const uniqueBooks = useMemo(() => {
    const books = new Set<string>();
    expandedRefs.forEach((ref) => books.add(ref.bookId));
    return books.size;
  }, [expandedRefs]);

  const totalConnections = useMemo(() => {
    return rawRefs.length;
  }, [rawRefs]);

  const bookName = bibleBooks.find((b) => b.id === bookId)?.name || bookId;

  const handleNavigate = (targetBookId: string, targetChapter: number, verse?: number) => {
    if (onNavigate) {
      onClose();
      onNavigate(targetBookId, targetChapter, verse);
    }
  };

  const filteredRefs = useMemo(() => {
    if (!searchQuery) return rawRefs;
    const query = searchQuery.toLowerCase();
    return rawRefs.filter((ref) => ref.toLowerCase().includes(query));
  }, [rawRefs, searchQuery]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="reader-floating-panel fixed top-0 right-0 h-full w-full max-w-xl bg-background border-l border-border z-50 animate-fade-in flex flex-col shadow-2xl">
        {/* Header */}
        <div className="reader-panel-header px-5 py-4 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              <h2 className="text-xs tracking-[0.2em] title-strong uppercase">
                REFERÊNCIAS CRUZADAS
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
            <Link2 className="w-3 h-3" />
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

          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60">
              <Hash className="w-3 h-3" />
              <span>{totalConnections} referências</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100/60 text-violet-800">
              <BookOpen className="w-3 h-3" />
              <span>{uniqueBooks} livros conectados</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100/60 text-amber-800">
              <GitBranch className="w-3 h-3" />
              <span>{groupedByVerse.length} grupos</span>
            </div>
          </div>
        </div>

        {/* View Mode & Filters */}
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as typeof viewMode)}
              className="flex-1"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list" className="text-xs gap-1">
                  <Link2 className="w-3 h-3" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="tree" className="text-xs gap-1">
                  <GitBranch className="w-3 h-3" />
                  Árvore
                </TabsTrigger>
                <TabsTrigger value="insights" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  Insights
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/50" />
              <Input
                placeholder="Buscar referências..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/50 border-border/50 text-sm"
              />
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1.5 bg-muted/50 rounded border border-border/50">
                    <span className="text-[10px] text-foreground/70">Profundidade:</span>
                    <select
                      value={depthFilter}
                      onChange={(e) => setDepthFilter(parseInt(e.target.value))}
                      className="bg-transparent text-xs font-medium outline-none"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Níveis de profundidade para explorar
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-foreground" />
              </div>
            )}

            {!loading && filteredRefs.length === 0 && (
              <div className="text-center py-12 px-4">
                <Link2 className="w-10 h-10 mx-auto text-foreground/30 mb-3" />
                <p className="text-sm text-foreground/70 mb-1">
                  Nenhuma referência cruzada encontrada
                </p>
                <p className="text-xs text-foreground/50">
                  para {selectedVerse ? `versículo ${selectedVerse}` : "este capítulo"}
                </p>
              </div>
            )}

            {/* List View */}
            {!loading && viewMode === "list" && filteredRefs.length > 0 && (
              <div className="space-y-2">
                {groupedByVerse.map((group) => (
                  <div
                    key={group.verse}
                    className="rounded-xl border border-border/60 bg-card overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-foreground/80 bg-primary/10 px-2 py-0.5 rounded">
                          v. {group.verse}
                        </span>
                        <span className="text-[10px] text-foreground/50">
                          {group.refs.length} referências
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {group.bookCount} livros
                      </Badge>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2">
                      {group.refs.map((ref, idx) => {
                        const parsed = parseReference(ref);
                        const color = parsed ? getBookColor(parsed.bookId) : "#6B7280";

                        return parsed ? (
                          <button
                            key={`${ref}-${idx}`}
                            onClick={() => handleNavigate(parsed.bookId, parsed.chapter, parsed.verse)}
                            className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/50 transition-all hover:border-primary/30"
                          >
                            <Circle
                              className="w-2 h-2"
                              style={{ fill: color, color }}
                            />
                            <span className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors">
                              {ref}
                            </span>
                            <ArrowRight className="w-3 h-3 text-foreground/40 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                          </button>
                        ) : (
                          <span
                            key={`${ref}-${idx}`}
                            className="text-xs text-foreground/60 px-2 py-1"
                          >
                            {ref}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tree View */}
            {!loading && viewMode === "tree" && filteredRefs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-foreground/60 mb-3 flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  <span>Visualização em árvore — navegação hierárquica</span>
                </div>

                {groupedByVerse.map((group) => (
                  <div key={group.verse} className="pl-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {bookName} {chapter}:{group.verse}
                      </span>
                      <CornerDownRight className="w-3 h-3 text-foreground/40" />
                    </div>

                    <div className="border-l-2 border-primary/20 pl-4 ml-2 space-y-1">
                      {group.refs.slice(0, 6).map((ref, idx) => {
                        const parsed = parseReference(ref);
                        if (!parsed) return null;

                        const targetBook = idToName[parsed.bookId] || parsed.bookId;

                        return (
                          <div
                            key={`${ref}-${idx}`}
                            className="flex items-center gap-2 group cursor-pointer hover:bg-muted/30 rounded px-2 py-1"
                            onClick={() => handleNavigate(parsed.bookId, parsed.chapter, parsed.verse)}
                          >
                            <Circle
                              className="w-1.5 h-1.5"
                              style={{ fill: getBookColor(parsed.bookId) }}
                            />
                            <span className="text-xs text-foreground/70 group-hover:text-foreground">
                              {targetBook} {parsed.chapter}
                              {parsed.verse ? `:${parsed.verse}` : ""}
                            </span>
                            <ChevronRight className="w-3 h-3 text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        );
                      })}

                      {group.refs.length > 6 && (
                        <div className="text-[10px] text-foreground/50 pl-4">
                          +{group.refs.length - 6} mais...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Insights View */}
            {!loading && viewMode === "insights" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-semibold tracking-wide">CONEXÕES TEMÁTICAS</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-violet-50/50 border border-violet-100/50">
                      <p className="text-[11px] font-medium text-violet-800 mb-1">
                        Temas em comum
                      </p>
                      <p className="text-xs text-foreground/70">
                        Este capítulo possui conexões com{" "}
                        <span className="font-semibold text-violet-700">{uniqueBooks} livros</span>{" "}
                        da Bíblia, explorando temas de redenção, lei e história.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100/50">
                      <p className="text-[11px] font-medium text-blue-800 mb-1">
                        Evangelhos e epístolas
                      </p>
                      <p className="text-xs text-foreground/70">
                        Referências cruzadas encontradas em{" "}
                        <span className="font-semibold text-blue-700">
                          {groupedByVerse.filter((g) => {
                            const books = expandedRefs.filter(
                              (r) => r.verse === g.verse && ["mt", "mc", "lc", "jo", "rm", "1co", "gl"].includes(r.bookId)
                            ).length;
                            return books > 0;
                          }).length}
                        </span>{" "}
                        grupos conectam-se aos Evangelhos e epístolas paulinas.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-green-50/50 border border-green-100/50">
                      <p className="text-[11px] font-medium text-green-800 mb-1">
                        Pentateuco
                      </p>
                      <p className="text-xs text-foreground/70">
                        Das {totalConnections} referências,{" "}
                        <span className="font-semibold text-green-700">
                          {rawRefs.filter((r) => {
                            const parsed = parseReference(r);
                            return parsed && ["gn", "ex", "lv", "nm", "dt"].includes(parsed.bookId);
                          }).length}
                        </span>{" "}
                        apontam para o Pentateuco (Gênesis a Deuteronômio).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Book Cloud */}
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-semibold tracking-wide">NUVEM DE LIVROS</h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(expandedRefs.map((r) => r.bookId)))
                      .slice(0, 15)
                      .map((bookId) => {
                        const count = expandedRefs.filter((r) => r.bookId === bookId).length;
                        const size = Math.min(Math.max(0.7, count / 10), 1.3);
                        const color = getBookColor(bookId);

                        return (
                          <button
                            key={bookId}
                            onClick={() => {
                              const ref = expandedRefs.find((r) => r.bookId === bookId);
                              if (ref) handleNavigate(ref.bookId, ref.chapter, ref.verse);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/40 hover:bg-muted/70 transition-colors"
                            style={{ fontSize: `${size}rem` }}
                          >
                            <Circle className="w-1.5 h-1.5" style={{ fill: color }} />
                            <span className="text-xs">{idToName[bookId] || bookId}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <p className="text-xl font-bold text-primary">{totalConnections}</p>
                    <p className="text-[10px] text-foreground/60">Total de referências</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                    <p className="text-xl font-bold text-violet-600">{uniqueBooks}</p>
                    <p className="text-[10px] text-foreground/60">Livros conectados</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-foreground/60">
              <Eye className="w-3 h-3" />
              <span>Clique em uma referência para navegar</span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              <Maximize2 className="w-3 h-3 mr-1" />
              Ver painel completo
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CrossRefsPanel;