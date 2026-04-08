import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Plus, Trash2, Copy, Share2, Download, BookOpen, Sparkles, Save, Calendar, Tag, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NotepadProps {
  open: boolean;
  onClose: () => void;
}

interface SermonNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  verses_refs: string[];
  created_at: string;
  updated_at: string;
}

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

const Notepad = ({ open, onClose }: NotepadProps) => {
  const { user } = useAuth();
  const [sermons, setSermons] = useState<SermonNote[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<SermonNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSermons = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("sermon_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setSermons(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open && user) fetchSermons();
  }, [open, user, fetchSermons]);

  const filteredSermons = useMemo(() => {
    if (!searchQuery.trim()) return sermons;
    const term = searchQuery.toLowerCase();
    return sermons.filter((sermon) => {
      const tagsText = sermon.tags.join(" ").toLowerCase();
      return (
        sermon.title.toLowerCase().includes(term) ||
        sermon.content.toLowerCase().includes(term) ||
        tagsText.includes(term)
      );
    });
  }, [sermons, searchQuery]);

  const totalWords = useMemo(
    () => sermons.reduce((acc, sermon) => acc + countWords(sermon.content), 0),
    [sermons],
  );

  const latestUpdate = useMemo(() => {
    if (!sermons.length) return "—";
    return new Date(sermons[0].updated_at).toLocaleDateString("pt-BR");
  }, [sermons]);

  const createSermon = async () => {
    if (!user || !newTitle.trim()) return;
    const { data, error } = await supabase
      .from("sermon_notes")
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: [],
        verses_refs: [],
      })
      .select()
      .single();

    if (!error && data) {
      setSermons([data, ...sermons]);
      setSelectedSermon(data);
      setNewTitle("");
      setNewContent("");
      setShowNewForm(false);
      toast({ title: "Sermão criado", description: "Seu sermão foi adicionado ao bloco de notas premium." });
    }
  };

  const updateSermon = async () => {
    if (!selectedSermon || !editTitle.trim()) return;
    const tagsArray = editTags.split(",").map((t) => t.trim()).filter(Boolean);
    const { data, error } = await supabase
      .from("sermon_notes")
      .update({
        title: editTitle.trim(),
        content: editContent.trim(),
        tags: tagsArray,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedSermon.id)
      .select()
      .single();

    if (!error && data) {
      setSermons(sermons.map((s) => (s.id === data.id ? data : s)));
      setSelectedSermon(data);
      setEditing(false);
      toast({ title: "Sermão salvo", description: "Alterações aplicadas com sucesso." });
    }
  };

  const deleteSermon = async (id: string) => {
    await supabase.from("sermon_notes").delete().eq("id", id);
    setSermons(sermons.filter((s) => s.id !== id));
    if (selectedSermon?.id === id) setSelectedSermon(null);
    toast({ title: "Sermão excluído" });
  };

  const copySermon = async (sermon: SermonNote) => {
    const text = `# ${sermon.title}\n\n${sermon.content}`;
    await navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "Conteúdo copiado para sua área de transferência." });
  };

  const shareSermon = async (sermon: SermonNote) => {
    const shareText = `📝 *${sermon.title}*\n\n${sermon.content.slice(0, 500)}${sermon.content.length > 500 ? "..." : ""}\n\n— Criado na Bíblia Alpha`;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
        toast({ title: "Compartilhado", description: "Sermão enviado com sucesso." });
        return;
      } catch {
        // cancelado pelo usuário
      }
    }

    await navigator.clipboard.writeText(shareText);
    toast({ title: "Copiado para compartilhar", description: "Texto pronto para envio." });
  };

  const exportSermon = (sermon: SermonNote) => {
    const blob = new Blob([`# ${sermon.title}\n\n${sermon.content}\n\nTags: ${sermon.tags.join(", ")}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sermon.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: "Arquivo markdown baixado." });
  };

  const startEditing = () => {
    if (!selectedSermon) return;
    setEditing(true);
    setEditTitle(selectedSermon.title);
    setEditContent(selectedSermon.content);
    setEditTags(selectedSermon.tags.join(", "));
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/45 backdrop-blur-md z-40" onClick={onClose} />
      <div className="fixed inset-2 sm:inset-4 md:inset-8 lg:inset-10 z-50 flex items-center justify-center">
        <div className="w-full h-full max-w-7xl bg-card/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-border/40 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)] flex overflow-hidden relative">

          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-primary/20 via-background/20 to-primary/10 border-b border-border/20 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/85 to-primary/40 flex items-center justify-center shadow-lg shadow-primary/20">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Bloco de Notas Incrível
                </h2>
                <p className="text-[11px] text-muted-foreground truncate">Escreva, organize, compartilhe e exporte seus sermões com estilo BrowserOS.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="reader-chip">{sermons.length} sermões</span>
                <span className="reader-chip">{totalWords.toLocaleString("pt-BR")} palavras</span>
                <span className="reader-chip">Atualizado {latestUpdate}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-muted/50">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex w-full h-full pt-16">
            <aside className="w-[330px] border-r border-border/20 flex flex-col bg-muted/10">
              <div className="p-4 border-b border-border/15 space-y-3">
                <Button
                  onClick={() => {
                    setShowNewForm(true);
                    setSelectedSermon(null);
                    setEditing(false);
                  }}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Sermão
                </Button>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por título, conteúdo ou tag..."
                    className="pl-9 rounded-xl bg-background/70 border-border/40"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 notepad-scroll">
                <div className="p-3 space-y-2">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : filteredSermons.length === 0 ? (
                    <div className="text-center py-10 px-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Nenhum sermão encontrado</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">Crie um novo sermão ou ajuste o filtro.</p>
                    </div>
                  ) : (
                    filteredSermons.map((sermon) => (
                      <button
                        key={sermon.id}
                        onClick={() => {
                          setSelectedSermon(sermon);
                          setShowNewForm(false);
                          setEditing(false);
                        }}
                        className={cn(
                          "w-full p-3.5 rounded-xl text-left transition-all duration-200 border",
                          selectedSermon?.id === sermon.id
                            ? "bg-gradient-to-r from-primary/15 to-primary/5 border-primary/25 shadow-sm"
                            : "hover:bg-muted/60 border-transparent",
                        )}
                        type="button"
                      >
                        <h3 className="text-sm font-semibold text-foreground truncate">{sermon.title}</h3>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{sermon.content.slice(0, 110) || "Sem conteúdo ainda."}</p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <Calendar className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-[10px] text-muted-foreground/70">{new Date(sermon.updated_at).toLocaleDateString("pt-BR")}</span>
                          <span className="text-[10px] text-muted-foreground/70">• {countWords(sermon.content)} palavras</span>
                          {sermon.tags.length > 0 && <Tag className="w-3 h-3 text-muted-foreground/60 ml-auto" />}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </aside>

            <section className="flex-1 flex flex-col bg-background/30">
              {showNewForm ? (
                <div className="flex-1 p-6 space-y-4 overflow-y-auto notepad-scroll">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold">Novo Sermão</span>
                  </div>

                  <Input
                    placeholder="Título do sermão..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="text-lg font-semibold bg-background/60 border-border/40 rounded-xl"
                  />

                  <Textarea
                    placeholder="Escreva seu sermão, pontos da mensagem, aplicações e referências..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="min-h-[55vh] bg-background/60 border-border/40 rounded-xl resize-none font-serif text-base leading-relaxed"
                  />

                  <div className="flex gap-3">
                    <Button onClick={createSermon} className="rounded-xl bg-gradient-to-r from-primary to-primary/80">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Sermão
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewForm(false)} className="rounded-xl">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : selectedSermon ? (
                editing ? (
                  <div className="flex-1 p-6 space-y-4 overflow-y-auto notepad-scroll">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-bold bg-background/60 border-border/40 rounded-xl"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[55vh] bg-background/60 border-border/40 rounded-xl resize-none font-serif text-base leading-relaxed"
                    />
                    <Input
                      placeholder="Tags (separadas por vírgula)..."
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="bg-background/60 border-border/40 rounded-xl"
                    />
                    <div className="flex gap-3">
                      <Button onClick={updateSermon} className="rounded-xl bg-gradient-to-r from-primary to-primary/80">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-6 border-b border-border/15 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{selectedSermon.title}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Atualizado em {new Date(selectedSermon.updated_at).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="reader-chip">{countWords(selectedSermon.content)} palavras</span>
                          {selectedSermon.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" onClick={startEditing} className="rounded-xl hover:bg-muted/60" title="Editar">
                          <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => copySermon(selectedSermon)} className="rounded-xl hover:bg-muted/60" title="Copiar">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => shareSermon(selectedSermon)} className="rounded-xl hover:bg-muted/60" title="Compartilhar">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => exportSermon(selectedSermon)} className="rounded-xl hover:bg-muted/60" title="Exportar">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSermon(selectedSermon.id)} className="rounded-xl hover:bg-red-500/10 text-red-500" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 notepad-scroll">
                      <div className="p-6">
                        <div className="prose prose-lg max-w-none font-serif text-foreground/90 leading-loose whitespace-pre-wrap">
                          {selectedSermon.content || "Este sermão está vazio. Clique em editar para adicionar conteúdo."}
                        </div>
                      </div>
                    </ScrollArea>
                  </>
                )
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center max-w-md">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted to-muted/40 mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Selecione um sermão</h3>
                    <p className="text-sm text-muted-foreground">Abra uma nota da lista ou crie um novo sermão para começar.</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-9 bg-gradient-to-r from-transparent via-muted/20 to-transparent border-t border-border/10 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Bíblia Alpha • Bloco de Notas Premium BrowserOS
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notepad;
