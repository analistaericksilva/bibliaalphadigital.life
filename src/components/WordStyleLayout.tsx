import { useState, useEffect } from "react";
import { 
  FileText, Edit, View, BookOpen, Search, Settings, HelpCircle, 
  ChevronDown, ChevronRight, Plus, Save, Printer, FolderOpen,
  Undo, Redo, Scissors, Copy, ClipboardPaste, Bold, Italic, Underline, Highlighter,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  Home, Send, ChevronsRight, ChevronsLeft,
  Book, Bookmark, Star, Clock, History,
  Map, Users, FileSignature, Library, Database,
  MessageSquare, X, Menu, MoreHorizontal
} from "lucide-react";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WordStyleLayoutProps {
  children: React.ReactNode;
  currentBook?: string;
  currentChapter?: number;
  onNavigate?: (book: string, chapter: number) => void;
}

const WordStyleLayout = ({ 
  children, 
  currentBook = "Gênesis", 
  currentChapter = 1,
  onNavigate 
}: WordStyleLayoutProps) => {
  const readerSettings = useReaderSettings();
  const { showLeftIcons, viewMode, fontSize, selectedFont, showStrongNumbers, showMorphology, showCrossRefs, showHeaderFooter } = readerSettings;

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Menu items estilo Word
  const menus = [
    {
      id: "file",
      label: "Arquivo",
      items: [
        { icon: Plus, label: "Novo", shortcut: "Ctrl+N" },
        { icon: FolderOpen, label: "Abrir", shortcut: "Ctrl+A" },
        { icon: Save, label: "Salvar", shortcut: "Ctrl+S" },
        { type: "separator" },
        { icon: Print, label: "Imprimir", shortcut: "Ctrl+P" },
        { type: "separator" },
        { label: "Sair", shortcut: "Alt+F4" },
      ]
    },
    {
      id: "edit",
      label: "Editar",
      items: [
        { icon: Undo, label: "Desfazer", shortcut: "Ctrl+Z" },
        { icon: Redo, label: "Refazer", shortcut: "Ctrl+Y" },
        { type: "separator" },
        { icon: Cut, label: "Recortar", shortcut: "Ctrl+X" },
        { icon: Copy, label: "Copiar", shortcut: "Ctrl+C" },
        { icon: Paste, label: "Colar", shortcut: "Ctrl+V" },
      ]
    },
    {
      id: "view",
      label: "Visualizar",
      items: [
        { label: viewMode === "paragraph" ? "Modo Parágrafo (P)" : "Modo Versículo (P)", action: () => readerSettings.toggleViewMode() },
        { type: "separator" },
        { label: showStrongNumbers ? "✓ Números Strong (S)" : "Números Strong (S)", action: () => readerSettings.toggleShowStrongNumbers() },
        { label: showMorphology ? "✓ Morfologia (M)" : "Morfologia (M)", action: () => readerSettings.toggleShowMorphology() },
        { label: showCrossRefs ? "✓ Referências Cruzadas (X)" : "Referências Cruzadas (X)", action: () => readerSettings.toggleShowCrossRefs() },
        { type: "separator" },
        { label: showHeaderFooter ? "✓ Cabeçalho e Rodapé" : "Cabeçalho e Rodapé", action: () => readerSettings.setShowHeaderFooter(!showHeaderFooter) },
        { type: "separator" },
        { label: "Tela Cheia", shortcut: "F11", action: () => setIsFullscreen(!isFullscreen) },
      ]
    },
    {
      id: "tools",
      label: "Ferramentas",
      items: [
        { icon: Search, label: "Buscar na Bíblia", shortcut: "F3" },
        { icon: History, label: "Histórico de Leitura" },
        { icon: Star, label: "Favoritos" },
        { type: "separator" },
        { icon: Book, label: "Concordância" },
        { icon: Library, label: "Léxico" },
        { icon: Map, label: "Mapas" },
        { type: "separator" },
        { icon: Settings, label: "Opções...", shortcut: "Ctrl+O" },
      ]
    },
    {
      id: "modules",
      label: "Módulos",
      items: [
        { icon: Database, label: "Gerenciador de Módulos" },
        { icon: BookOpen, label: "Módulos Instalados" },
        { type: "separator" },
        { label: "Números Strong" },
        { label: "Morfologia" },
        { label: "Dicionários" },
      ]
    },
    {
      id: "help",
      label: "Ajuda",
      items: [
        { icon: HelpCircle, label: "Índice de Ajuda" },
        { type: "separator" },
        { label: "Sobre a BíbliaAlpha" },
      ]
    },
  ];

  // Toolbar icons
  const toolbarGroups = [
    {
      items: [
        { icon: ArrowLeft, label: "Anterior", action: () => onNavigate?.(currentBook, Math.max(1, currentChapter - 1)) },
        { icon: ArrowRight, label: "Próximo", action: () => onNavigate?.(currentBook, currentChapter + 1) },
        { icon: Home, label: "Início", action: () => onNavigate?.("gn", 1) },
        { icon: Bookmark, label: "Selecionar Livro" },
      ]
    },
    {
      items: [
        { icon: Undo, label: "Voltar", action: () => {} },
        { icon: Redo, label: "Avançar", action: () => {} },
      ]
    },
    {
      items: [
        { icon: Bold, label: "Negrito (simulação)" },
        { icon: Italic, label: "Itálico (simulação)" },
        { icon: Underline, label: "Sublinhado (simulação)" },
      ]
    },
    {
      items: [
        { icon: viewMode === "paragraph" ? AlignLeft : List, label: viewMode === "paragraph" ? "Parágrafo" : "Versículos", action: () => readerSettings.toggleViewMode() },
        { icon: MessageSquare, label: "Comentários", action: () => {} },
      ]
    },
    {
      items: [
        { icon: Star, label: "Strong", active: showStrongNumbers, action: () => readerSettings.toggleShowStrongNumbers() },
        { icon: Database, label: "Morfologia", active: showMorphology, action: () => readerSettings.toggleShowMorphology() },
        { icon: BookOpen, label: "Refs. Cruzadas", active: showCrossRefs, action: () => readerSettings.toggleShowCrossRefs() },
      ]
    },
  ];

  // Left sidebar - Navigation tree
  const SidebarNav = () => (
    <div className="w-64 h-full bg-card border-r flex flex-col">
      <div className="p-2 border-b">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <Book className="w-4 h-4" />
          <span>Árvore de Livros</span>
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider px-2 py-1">
            Antigo Testamento
          </div>
          {["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Samuel", "Reis", "Crônicas", "Esdras", "Neemias", "Salmos", "Provérbios", "Eclesiastes", "Cânticos", "Isaías", "Jeremias", "Lamentações", "Ezequiel", "Daniel", "Oséias", "Joel", "Amós"].map((book, i) => (
            <Button 
              key={book} 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start text-left h-8 px-2",
                currentBook === book && "bg-primary/10 text-primary"
              )}
              onClick={() => onNavigate?.(book.toLowerCase().replace(" ", ""), 1)}
            >
              <ChevronRight className="w-3 h-3 mr-1" />
              <span className="truncate">{book}</span>
            </Button>
          ))}
          <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider px-2 py-1 mt-4">
            Novo Testamento
          </div>
          {["Mateus", "Marcos", "Lucas", "João", "Atos", "Romanos", "Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "Tessalonicenses", "Timóteo", "Tito", "Filemom", "Hebreus", "Tiago", "Pedro", "João", "Judas", "Apocalipse"].map((book) => (
            <Button 
              key={book} 
              variant="ghost" 
              size="sm" 
              className={cn(
                "w-full justify-start text-left h-8 px-2",
                currentBook === book && "bg-primary/10 text-primary"
              )}
              onClick={() => onNavigate?.(book.toLowerCase().replace(" ", ""), 1)}
            >
              <ChevronRight className="w-3 h-3 mr-1" />
              <span className="truncate">{book}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className={cn(
      "flex flex-col h-screen bg-background text-foreground",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Title Bar */}
      <div className="h-8 bg-[#2b579a] text-white flex items-center justify-between px-2 text-xs select-none">
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span className="font-medium">BibliaAlpha - {currentBook} {currentChapter}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="p-1 hover:bg-white/20 rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="h-7 bg-[#f3f3f3] dark:bg-[#1e1e1e] border-b flex items-center px-1">
        {menus.map(menu => (
          <div key={menu.id} className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
              onBlur={() => setTimeout(() => setActiveMenu(null), 200)}
              className={cn(
                "px-2 py-0.5 text-xs rounded hover:bg-[#e5e5e5] dark:hover:bg-[#3c3c3c]",
                activeMenu === menu.id && "bg-[#e5e5e5] dark:bg-[#3c3c3c]"
              )}
            >
              {menu.label}
            </button>
            {activeMenu === menu.id && (
              <div className="absolute top-full left-0 bg-card border shadow-lg rounded py-1 min-w-[200px] z-50">
                {menu.items.map((item, i) => (
                  item.type === "separator" ? (
                    <Separator key={i} className="my-1" />
                  ) : (
                    <button
                      key={i}
                      className="w-full px-3 py-1 text-xs text-left hover:bg-muted flex items-center gap-2"
                      onClick={(e) => {
                        if ('action' in item && item.action) item.action();
                        setActiveMenu(null);
                      }}
                    >
                      {'icon' in item && item.icon && <item.icon className="w-3 h-3" />}
                      <span className="flex-1">{item.label}</span>
                      {'shortcut' in item && item.shortcut && (
                        <span className="text-muted-foreground text-[10px]">{item.shortcut}</span>
                      )}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="h-10 bg-[#f3f3f3] dark:bg-[#1e1e1e] border-b flex items-center px-2 gap-1">
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {group.items.map((item, i) => (
              <button
                key={i}
                onClick={() => 'action' in item && item.action?.()}
                className={cn(
                  "p-1.5 rounded hover:bg-[#e5e5e5] dark:hover:bg-[#3c3c3c]",
                  'active' in item && item.active && "bg-primary/20 text-primary"
                )}
                title={item.label}
              >
                <item.icon className="w-4 h-4" />
              </button>
            ))}
            {gi < toolbarGroups.length - 1 && <Separator orientation="vertical" className="h-6 mx-1" />}
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation */}
        {showSidebar && <SidebarNav />}

        {/* Document Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Ribbon / Additional Toolbar */}
          <div className="h-8 bg-card border-b flex items-center px-2 gap-2">
            <span className="text-xs text-muted-foreground">
              {currentBook} - Capítulo {currentChapter}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs text-muted-foreground">
              {viewMode === "paragraph" ? "Modo Parágrafo" : "Um Versículo por Linha"}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              Fonte: {selectedFont} | Tamanho: {fontSize}px
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-white dark:bg-[#1e1e1e]">
            {children}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-2 text-xs">
        <div className="flex items-center gap-4">
          <span>Capítulo {currentChapter}</span>
          <span>|</span>
          <span>{currentBook}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{viewMode === "paragraph" ? "Parágrafo" : "Versículos"}</span>
          <span>|</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default WordStyleLayout;