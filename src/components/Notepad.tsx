import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Plus, Trash2, Copy, Share2, Download, BookOpen, Sparkles, Zap, Save, MessageCircle, Send, MoreVertical, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

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
      toast({ title: "Sermão criado", description: "Seu sermão foi adicionado ao notepad." });
    }
  };

  const updateSermon = async () => {
    if (!selectedSermon || !editTitle.trim()) return;
    const tagsArray = editTags.split(",").map(t => t.trim()).filter(Boolean);
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
      setSermons(sermons.map(s => s.id === data.id ? data : s));
      setSelectedSermon(data);
      setEditing(false);
      toast({ title: "Sermão salvo", description: "Suas alterações foram salvas." });
    }
  };

  const deleteSermon = async (id: string) => {
    await supabase.from("sermon_notes").delete().eq("id", id);
    setSermons(sermons.filter(s => s.id !== id));
    if (selectedSermon?.id === id) setSelectedSermon(null);
    toast({ title: "Sermão excluído" });
  };

  const shareSermon = async (sermon: SermonNote) => {
    const shareText = `📝 *${sermon.title}*\n\n${sermon.content.slice(0, 500)}${sermon.content.length > 500 ? "..." : ""}\n\n— Criado na Bíblia Alpha`;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch { /* ignore */ }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copiado!", description: "Sermão copiado para a área de transferência." });
    }
  };

  const exportSermon = (sermon: SermonNote) => {
    const blob = new Blob([`# ${sermon.title}\n\n${sermon.content}\n\nTags: ${sermon.tags.join(", ")}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sermon.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex items-center justify-center">
        <div className="w-full h-full max-w-6xl bg-background/95 backdrop-blur-xl rounded-3xl border border-border/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex overflow-hidden">
          
          {/* Header estilo AI */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 border-b border-border/20 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary/20 flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  Notepad de Sermões
                </h2>
                <p className="text-[11px] text-muted-foreground">Crie, organize e compartilhe seus estudos bíblicos</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-muted/50">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex w-full h-full pt-16">
            {/* Sidebar da lista */}
            <div className="w-80 border-r border-border/20 flex flex-col bg-muted/5">
              <div className="p-4 border-b border-border/10">
                <Button 
                  onClick={() => setShowNewForm(true)} 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Sermão
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : sermons.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Nenhum sermão ainda</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">Crie seu primeiro sermão!</p>
                    </div>
                  ) : (
                    sermons.map(sermon => (
                      <button
                        key={sermon.id}
                        onClick={() => { setSelectedSermon(sermon); setEditing(false); }}
                        className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                          selectedSermon?.id === sermon.id
                            ? "bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/20"
                            : "hover:bg-muted/50 border border-transparent"
                        }`}
                      >
                        <h3 className="text-sm font-semibold text-foreground truncate">{sermon.title}</h3>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{sermon.content.slice(0, 80)}...</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(sermon.updated_at).toLocaleDateString("pt-BR")}
                          </span>
                          {sermon.tags.length > 0 && (
                            <Tag className="w-3 h-3 text-muted-foreground/60 ml-2" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Área principal */}
            <div className="flex-1 flex flex-col">
              {showNewForm ? (
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold">Novo Sermão</span>
                  </div>
                  <Input
                    placeholder="Título do sermão..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="text-lg font-semibold bg-muted/30 border-border/20 rounded-xl"
                  />
                  <Textarea
                    placeholder="Escreva seu sermão, anotações, reflexões..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="flex-1 min-h-[400px] bg-muted/30 border-border/20 rounded-xl resize-none font-serif text-base leading-relaxed"
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
                  <div className="flex-1 p-6 space-y-4">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-bold bg-muted/30 border-border/20 rounded-xl"
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 min-h-[400px] bg-muted/30 border-border/20 rounded-xl resize-none font-serif text-base leading-relaxed"
                    />
                    <Input
                      placeholder="Tags (separadas por vírgula)..."
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="bg-muted/30 border-border/20 rounded-xl"
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
                  <div className="flex-1 flex flex-col">
                    <div className="p-6 border-b border-border/10 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">{selectedSermon.title}</h2>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(selectedSermon.updated_at).toLocaleDateString("pt-BR")}
                          </span>
                          {selectedSermon.tags.map(tag => (
                            <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(true); setEditTitle(selectedSermon.title); setEditContent(selectedSermon.content); setEditTags(selectedSermon.tags.join(", ")); }} className="rounded-xl hover:bg-muted/50">
                          <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => shareSermon(selectedSermon)} className="rounded-xl hover:bg-muted/50">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => exportSermon(selectedSermon)} className="rounded-xl hover:bg-muted/50">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSermon(selectedSermon.id)} className="rounded-xl hover:bg-red-500/10 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-6">
                        <div className="prose prose-lg max-w-none font-serif text-foreground/90 leading-loose whitespace-pre-wrap">
                          {selectedSermon.content || "Este sermão está vazio. Clique no botão de edição para adicionar conteúdo."}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                )
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted to-muted/50 mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Selecione um Sermão</h3>
                    <p className="text-sm text-muted-foreground">Escolha um sermão da lista ou crie um novo</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-r from-transparent via-muted/20 to-transparent border-t border-border/10 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Bíblia Alpha • Notepad Inteligente
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Notepad;