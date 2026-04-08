import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import {
  X,
  Loader2,
  Pencil,
  Trash2,
  Download,
  Share2,
  Tag,
  Star,
  Bookmark,
  Highlighter,
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Copy,
  Edit3,
  Save,
  Eye,
  EyeOff,
  ChevronRight,
  Layers,
  Clock,
  BookOpen,
  Link2,
  Quote,
  StickyNote,
  Lightbulb,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface UserAnnotation {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  verse_start: number;
  verse_end?: number | null;
  content: string;
  note_type: string;
  color?: string | null;
  tags?: string[] | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface NotebookPanelProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  chapter: number;
  selectedVerse?: number | null;
  userId?: string;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

const ANNOTATION_COLORS = [
  { name: "Amarelo", value: "#FEF08A", text: "#854D0E" },
  { name: "Verde", value: "#BBF7D0", text: "#166534" },
  { name: "Azul", value: "#BFDBFE", text: "#1E40AF" },
  { name: "Rosa", value: "#FBCFE8", text: "#9D174D" },
  { name: "Laranja", value: "#FED7AA", text: "#9A3412" },
  { name: "Roxo", value: "#DDD6FE", text: "#4C1D95" },
  { name: "Ciano", value: "#A5F3FC", text: "#164E63" },
  { name: "Cinza", value: "#E5E7EB", text: "#374151" }
];

const DEFAULT_TAGS = [
  "Teologia",
  " doutrina",
  "Aplicação",
  "Pregação",
  "Estudo",
  "Memória",
  "Pergunta",
  "Pesquisa",
  "Dúvida",
  "Importante"
];

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function exportToMarkdown(annotations: UserAnnotation[]): string {
  let md = "# Minhas Anotações - Bíblia Alpha\n\n";
  const grouped = annotations.reduce((acc, ann) => {
    const key = `${ann.book_id} ${ann.chapter}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ann);
    return acc;
  }, {} as Record<string, UserAnnotation[]>);

  for (const [ref, notes] of Object.entries(grouped)) {
    md += `## ${ref}\n\n`;
    for (const note of notes) {
      const verse = note.verse_end
        ? `${note.verse_start}-${note.verse_end}`
        : `${note.verse_start}`;
      md += `### Versículo ${verse}${note.note_type === "favorite" ? " ⭐" : ""}\n`;
      if (note.tags?.length) md += `**Tags:** ${note.tags.join(", ")}\n`;
      md += `${note.content}\n\n---\n\n`;
    }
  }

  return md;
}

const NotebookPanel = ({
  open,
  onClose,
  bookId,
  chapter,
  selectedVerse,
  userId,
  onNavigate
}: NotebookPanelProps) => {
  const [annotations, setAnnotations] = useState<UserAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAnnotation, setNewAnnotation] = useState({
    content: "",
    noteType: "note" as UserAnnotation["note_type"],
    color: ANNOTATION_COLORS[0].value,
    tags: [] as string[],
    isPublic: false
  });
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [filterVerse, setFilterVerse] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !userId) return;

    const fetchAnnotations = async () => {
      setLoading(true);
      const query = supabase
        .from("user_annotations")
        .select("*")
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .order("verse_start");

      let { data } = await query;

      if (selectedVerse) {
        data = (data as UserAnnotation[])?.filter(
          (a) =>
            a.verse_start <= selectedVerse &&
            (a.verse_end ? a.verse_end >= selectedVerse : a.verse_start === selectedVerse)
        );
      }

      setAnnotations(data || []);
      setLoading(false);
    };

    fetchAnnotations();
  }, [open, bookId, chapter, userId, selectedVerse]);

  const handleSave = async () => {
    if (!userId || !newAnnotation.content.trim()) return;

    setSaving(true);
    const payload = {
      user_id: userId,
      book_id: bookId,
      chapter,
      verse_start: selectedVerse || 1,
      content: newAnnotation.content,
      note_type: newAnnotation.noteType,
      color: newAnnotation.color,
      tags: newAnnotation.tags,
      is_public: newAnnotation.isPublic
    };

    const { error } = await supabase.from("user_annotations").insert(payload);

    if (!error) {
      setAnnotations((prev) => [
        ...prev,
        { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]);
      setNewAnnotation({
        content: "",
        noteType: "note",
        color: ANNOTATION_COLORS[0].value,
        tags: [],
        isPublic: false
      });
      setShowNewDialog(false);
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_annotations").delete().eq("id", id);
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdate = async (id: string, updates: Partial<UserAnnotation>) => {
    await supabase
      .from("user_annotations")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    setEditingId(null);
  };

  const handleExport = () => {
    const md = exportToMarkdown(annotations);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anotacoes-${bookId}-${chapter}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAnnotations = useMemo(() => {
    let filtered = annotations;

    if (activeTab !== "all") {
      filtered = filtered.filter((a) => a.note_type === activeTab);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.content.toLowerCase().includes(query) ||
          a.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [annotations, activeTab, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: annotations.length,
      highlights: annotations.filter((a) => a.note_type === "highlight").length,
      notes: annotations.filter((a) => a.note_type === "note").length,
      favorites: annotations.filter((a) => a.note_type === "favorite").length,
      bookmarks: annotations.filter((a) => a.note_type === "bookmark").length
    };
  }, [annotations]);

  const bookName = bibleBooks.find((b) => b.id === bookId)?.name || bookId;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-40" onClick={onClose} />
      <div className="reader-floating-panel fixed top-0 right-0 h-full w-full max-w-xl bg-background border-l border-border z-50 animate-fade-in flex flex-col shadow-2xl">
        {/* Header */}
        <div className="reader-panel-header px-5 py-4 border-b border-border bg-gradient-to-r from-muted/50 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              <h2 className="text-xs tracking-[0.2em] title-strong uppercase">
                MEU BLOCO DE NOTAS
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

          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px]">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60">
                    <Layers className="w-3 h-3" />
                    <span>{stats.total}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Total de anotações</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100/60 text-yellow-800">
                    <Highlighter className="w-3 h-3" />
                    <span>{stats.highlights}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Destaques</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100/60 text-blue-800">
                    <Edit3 className="w-3 h-3" />
                    <span>{stats.notes}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Notas</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-pink-100/60 text-pink-800">
                    <Star className="w-3 h-3" />
                    <span>{stats.favorites}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Favoritos</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100/60 text-green-800">
                    <Bookmark className="w-3 h-3" />
                    <span>{stats.bookmarks}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Marcadores</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/50" />
              <Input
                placeholder="Buscar anotações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-muted/50 border-border/50 text-sm"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-xs">Filtrar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setActiveTab("all")}>
                  Todas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab("highlight")}>
                  <Highlighter className="w-3 h-3 mr-2" />
                  Destaques
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("note")}>
                  <Edit3 className="w-3 h-3 mr-2" />
                  Notas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("favorite")}>
                  <Star className="w-3 h-3 mr-2" />
                  Favoritos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("bookmark")}>
                  <Bookmark className="w-3 h-3 mr-2" />
                  Marcadores
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={annotations.length === 0}
                    className="h-9"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar Markdown</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {/* New Annotation Button / Form */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-auto py-3 flex flex-col items-start gap-1 border-dashed"
                >
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Nova anotação</span>
                  </div>
                  <span className="text-xs text-foreground/60">
                    Adicionar nota, destaque ou favorito
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Nova Anotação
                  </DialogTitle>
                  <DialogDescription>
                    Criar uma nova anotação para {bookName} {chapter}:
                    {selectedVerse ? `:${selectedVerse}` : ""}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <Tabs
                    value={newAnnotation.noteType}
                    onValueChange={(v) =>
                      setNewAnnotation((p) => ({
                        ...p,
                        noteType: v as UserAnnotation["note_type"]
                      }))
                    }
                  >
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="highlight" className="gap-1">
                        <Highlighter className="w-3 h-3" />
                        Destaque
                      </TabsTrigger>
                      <TabsTrigger value="note" className="gap-1">
                        <Edit3 className="w-3 h-3" />
                        Nota
                      </TabsTrigger>
                      <TabsTrigger value="favorite" className="gap-1">
                        <Star className="w-3 h-3" />
                        Favorito
                      </TabsTrigger>
                      <TabsTrigger value="bookmark" className="gap-1">
                        <Bookmark className="w-3 h-3" />
                        Marcação
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Textarea
                    placeholder="Escreva sua anotação..."
                    value={newAnnotation.content}
                    onChange={(e) =>
                      setNewAnnotation((p) => ({ ...p, content: e.target.value }))
                    }
                    className="min-h-[120px] bg-muted/30"
                  />

                  <div className="space-y-2">
                    <label className="text-xs text-foreground/70">
                      Cor
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ANNOTATION_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() =>
                            setNewAnnotation((p) => ({ ...p, color: color.value }))
                          }
                          className={`w-8 h-8 rounded-full transition-transform ${
                            newAnnotation.color === color.value
                              ? "ring-2 ring-offset-2 ring-primary scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-foreground/70">Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setNewAnnotation((p) => ({
                              ...p,
                              tags: p.tags.includes(tag)
                                ? p.tags.filter((t) => t !== tag)
                                : [...p.tags, tag]
                            }));
                          }}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            newAnnotation.tags.includes(tag)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/30 border-border hover:bg-muted/60"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAnnotation.isPublic}
                      onChange={(e) =>
                        setNewAnnotation((p) => ({
                          ...p,
                          isPublic: e.target.checked
                        }))
                      }
                      className="rounded border-border"
                    />
                    <Share2 className="w-4 h-4" />
                    Tornar pública para outros estudiosos
                  </label>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !newAnnotation.content.trim()}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Annotations List */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-foreground" />
              </div>
            )}

            {!loading && filteredAnnotations.length === 0 && (
              <div className="text-center py-12 px-4">
                <StickyNote className="w-10 h-10 mx-auto text-foreground/30 mb-3" />
                <p className="text-sm text-foreground/70 mb-1">
                  Nenhuma anotação ainda
                </p>
                <p className="text-xs text-foreground/50">
                  Clique em "Nova anotação" para começar
                </p>
              </div>
            )}

            {!loading &&
              filteredAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="group relative rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 transition-colors"
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: annotation.color || ANNOTATION_COLORS[0].value
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium text-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded">
                        v. {annotation.verse_start}
                        {annotation.verse_end ? `-${annotation.verse_end}` : ""}
                      </span>

                      {annotation.note_type === "highlight" && (
                        <Highlighter className="w-3 h-3 text-yellow-600" />
                      )}
                      {annotation.note_type === "note" && (
                        <Edit3 className="w-3 h-3 text-blue-600" />
                      )}
                      {annotation.note_type === "favorite" && (
                        <Star className="w-3 h-3 text-pink-600" />
                      )}
                      {annotation.note_type === "bookmark" && (
                        <Bookmark className="w-3 h-3 text-green-600" />
                      )}

                      {annotation.is_public && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Share2 className="w-3 h-3 text-foreground/50" />
                            </TooltipTrigger>
                            <TooltipContent>Pública</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(annotation.content)}
                        >
                          <Copy className="w-3.5 h-3.5 mr-2" />
                          Copiar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdate(annotation.id, {
                              is_public: !annotation.is_public
                            })
                          }
                        >
                          {annotation.is_public ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 mr-2" />
                              Tornar privada
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              Tornar pública
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(annotation.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {editingId === annotation.id ? (
                    <div className="space-y-2">
                      <Textarea
                        defaultValue={annotation.content}
                        id={`edit-${annotation.id}`}
                        className="min-h-[80px] bg-muted/30"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            const content = (
                              document.getElementById(
                                `edit-${annotation.id}`
                              ) as HTMLTextAreaElement
                            )?.value;
                            if (content) {
                              handleUpdate(annotation.id, { content });
                            }
                          }}
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm comment-strong leading-relaxed whitespace-pre-line">
                      {annotation.content}
                    </p>
                  )}

                  {annotation.tags && annotation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border/30">
                      {annotation.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-foreground/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                    <span className="text-[10px] text-foreground/50">
                      {formatDate(annotation.created_at)}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setEditingId(annotation.id)}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>

        {/* Quick Tips */}
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-[10px] text-foreground/60">
            <Lightbulb className="w-3 h-3" />
            <span>
              Dica: Use cores para categorizar. Exporte suas anotações para estudar offline.
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotebookPanel;