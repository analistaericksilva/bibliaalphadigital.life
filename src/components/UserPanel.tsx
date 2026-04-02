import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { bibleBooks } from "@/data/bibleBooks";
import { X, Clock, Heart, Search, Download, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserPanelProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (bookId: string, chapter: number, verse?: number) => void;
  defaultTab?: "goto" | "history" | "favorites" | "data";
}

interface HistoryItem {
  book_id: string;
  chapter: number;
  read_at: string;
}

interface FavoriteItem {
  id: string;
  book_id: string;
  chapter: number;
  verse: number;
  label: string | null;
  created_at: string;
}

interface AnnotationExport {
  highlights: any[];
  personalNotes: any[];
  favorites: any[];
}

const UserPanel = ({ open, onClose, onNavigate, defaultTab = "history" }: UserPanelProps) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [goToBook, setGoToBook] = useState("");
  const [goToChapter, setGoToChapter] = useState("");
  const [goToVerse, setGoToVerse] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    try {
      await Promise.all([
        supabase.from("highlights").delete().eq("user_id", user.id),
        supabase.from("personal_notes").delete().eq("user_id", user.id),
        supabase.from("favorites").delete().eq("user_id", user.id),
        supabase.from("reading_history").delete().eq("user_id", user.id),
        supabase.from("user_plan_progress").delete().eq("user_id", user.id),
      ]);
      setHistory([]);
      setFavorites([]);
      toast({ title: "Dados resetados", description: "Todas as suas anotações, marcações e histórico foram apagados." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível resetar os dados.", variant: "destructive" });
    }
    setResetting(false);
  };

  useEffect(() => {
    if (!open || !user) return;
    const fetchData = async () => {
      setLoading(true);
      const [histRes, favRes] = await Promise.all([
        supabase
          .from("reading_history")
          .select("book_id, chapter, read_at")
          .eq("user_id", user.id)
          .order("read_at", { ascending: false })
          .limit(50),
        supabase
          .from("favorites")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (histRes.data) setHistory(histRes.data);
      if (favRes.data) setFavorites(favRes.data as FavoriteItem[]);
      setLoading(false);
    };
    fetchData();
  }, [open, user]);

  const getBookName = (bookId: string) => bibleBooks.find((b) => b.id === bookId)?.name || bookId;

  const handleGoTo = () => {
    const searchText = goToBook.toLowerCase().trim();
    const book = bibleBooks.find(
      (b) =>
        b.name.toLowerCase().includes(searchText) ||
        b.abbrev.toLowerCase() === searchText ||
        b.id === searchText
    );
    if (book) {
      const ch = parseInt(goToChapter) || 1;
      const vs = parseInt(goToVerse) || undefined;
      onNavigate(book.id, Math.min(ch, book.chapters), vs);
      onClose();
    }
  };

  const handleExport = async () => {
    if (!user) return;
    const [hlRes, notesRes, favRes] = await Promise.all([
      supabase.from("highlights").select("*").eq("user_id", user.id),
      supabase.from("personal_notes").select("*").eq("user_id", user.id),
      supabase.from("favorites").select("*").eq("user_id", user.id),
    ]);

    const data: AnnotationExport = {
      highlights: (hlRes.data || []).map((h: any) => ({
        livro: getBookName(h.book_id),
        capitulo: h.chapter,
        versiculo: h.verse,
        cor: h.color,
      })),
      personalNotes: (notesRes.data || []).map((n: any) => ({
        livro: getBookName(n.book_id),
        capitulo: n.chapter,
        versiculo: n.verse,
        nota: n.content,
      })),
      favorites: (favRes.data || []).map((f: any) => ({
        livro: getBookName(f.book_id),
        capitulo: f.chapter,
        versiculo: f.verse,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "biblia-alpha-anotacoes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredFavorites = favorites.filter((f) => {
    if (!searchFilter) return true;
    const bookName = getBookName(f.book_id).toLowerCase();
    return bookName.includes(searchFilter.toLowerCase());
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/5 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-background border-l border-border z-50 animate-fade-in flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xs tracking-[0.3em] font-sans font-semibold text-foreground">
            MINHA BÍBLIA
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue={defaultTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="mx-4 mt-2 grid grid-cols-4 shrink-0">
            <TabsTrigger value="goto" className="text-xs">Ir Para</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">Favoritos</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Dados</TabsTrigger>
          </TabsList>

          {/* Go To */}
          <TabsContent value="goto" className="flex-1 p-4 space-y-4">
            <p className="text-sm text-muted-foreground font-sans">
              Digite o nome do livro, capítulo e versículo para navegar diretamente.
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Livro (ex: Gênesis, Sl, Jo)"
                value={goToBook}
                onChange={(e) => setGoToBook(e.target.value)}
                className="font-sans"
                onKeyDown={(e) => e.key === "Enter" && handleGoTo()}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Capítulo"
                  type="number"
                  value={goToChapter}
                  onChange={(e) => setGoToChapter(e.target.value)}
                  className="font-sans"
                  min={1}
                  onKeyDown={(e) => e.key === "Enter" && handleGoTo()}
                />
                <Input
                  placeholder="Versículo"
                  type="number"
                  value={goToVerse}
                  onChange={(e) => setGoToVerse(e.target.value)}
                  className="font-sans"
                  min={1}
                  onKeyDown={(e) => e.key === "Enter" && handleGoTo()}
                />
              </div>
              <Button onClick={handleGoTo} className="w-full">
                <Search className="w-4 h-4 mr-2" /> Ir para o texto
              </Button>
            </div>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {loading && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!loading && history.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12 font-sans">
                    Nenhum histórico de leitura ainda.
                  </p>
                )}
                {!loading &&
                  history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { onNavigate(h.book_id, h.chapter); onClose(); }}
                      className="w-full flex items-center justify-between p-3 rounded bg-paper hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-sans font-medium">
                          {getBookName(h.book_id)} {h.chapter}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-sans">
                        {new Date(h.read_at).toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites" className="flex-1 min-h-0 flex flex-col">
            <div className="px-4 pt-2">
              <Input
                placeholder="Filtrar por livro..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="text-sm font-sans"
              />
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-2">
                {loading && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!loading && filteredFavorites.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-12 font-sans">
                    Nenhum favorito salvo.
                  </p>
                )}
                {!loading &&
                  filteredFavorites.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { onNavigate(f.book_id, f.chapter, f.verse); onClose(); }}
                      className="w-full flex items-center justify-between p-3 rounded bg-paper hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-destructive fill-destructive" />
                        <span className="text-sm font-sans font-medium">
                          {getBookName(f.book_id)} {f.chapter}:{f.verse}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </ScrollArea>
            {favorites.length > 0 && (
              <div className="p-4 border-t border-border shrink-0">
                <Button variant="outline" size="sm" onClick={handleExport} className="w-full text-xs">
                  <Download className="w-3 h-3 mr-2" /> Exportar anotações
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="data" className="flex-1 p-4 space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-sans font-semibold text-foreground">
                Resetar dados de uso
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-sans">
                Apague suas anotações, destaques, favoritos, histórico de leitura e progresso dos planos para voltar ao estado inicial.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-sm text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5">
                  <RotateCcw className="w-4 h-4 mr-2" /> Resetar todos os meus dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá apagar permanentemente todas as suas anotações pessoais, marcações de destaque, favoritos, histórico de leitura e progresso dos planos de leitura. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {resetting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Sim, apagar tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default UserPanel;
