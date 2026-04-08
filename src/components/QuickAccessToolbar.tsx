import { BookOpen, Search, Library, Bookmark, Map, Settings, ChevronDown, Home, ArrowLeft, ArrowRight, Star, FileText, Users, BookKey, Notebook, AlignJustify } from "lucide-react";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface QuickAccessToolbarProps {
  onToggleSearch: () => void;
  onToggleBookSelector: () => void;
  onToggleNotes: () => void;
  onToggleDictionary: () => void;
  onToggleHistory: () => void;
  onToggleFavorites: () => void;
  onToggleGoTo: () => void;
  onToggleMap: () => void;
  onToggleLexicon: () => void;
  onTogglePeople: () => void;
  onToggleNotepad: () => void;
  onToggleCompareMode: () => void;
}

const QuickAccessToolbar = ({
  onToggleSearch,
  onToggleBookSelector,
  onToggleNotes,
  onToggleDictionary,
  onToggleHistory,
  onToggleFavorites,
  onToggleGoTo,
  onToggleMap,
  onToggleLexicon,
  onTogglePeople,
  onToggleNotepad,
  onToggleCompareMode,
}: QuickAccessToolbarProps) => {
  const { showLeftIcons, showCompareMode, viewMode, toggleViewMode, showCrossRefs, toggleShowCrossRefs, showStrongNumbers, toggleShowStrongNumbers, showMorphology, toggleShowMorphology, showHeaderFooter, setShowHeaderFooter, showUserHighlights, setShowUserHighlights, showFootnotes, setShowFootnotes, wordLookupEnabled, toggleWordLookupEnabled } = useReaderSettings();

  const [showQuickOptions, setShowQuickOptions] = useState(false);

  if (!showLeftIcons) return null;

  const quickOptions = [
    { icon: BookOpen, label: "Modo Parágrafo", active: viewMode === "paragraph", action: toggleViewMode },
    { type: "separator" as const },
    { icon: Star, label: "Números Strong (S)", active: showStrongNumbers, action: toggleShowStrongNumbers },
    { icon: Library, label: "Morfologia (M)", active: showMorphology, action: toggleShowMorphology },
    { type: "separator" as const },
    { icon: Bookmark, label: "Refs. Cruzadas (X)", active: showCrossRefs, action: toggleShowCrossRefs },
    { icon: FileText, label: "Notas de Rodapé (F)", active: showFootnotes, action: () => setShowFootnotes(!showFootnotes) },
    { type: "separator" as const },
    { icon: Bookmark, label: "Busca de Palavras (D)", active: wordLookupEnabled, action: toggleWordLookupEnabled },
    { type: "separator" as const },
    { icon: Home, label: "Cabeçalho/Rodapé (Q)", active: showHeaderFooter, action: () => setShowHeaderFooter(!showHeaderFooter) },
    { icon: Star, label: "Destaques Usuário (U)", active: showUserHighlights, action: () => setShowUserHighlights(!showUserHighlights) },
    { type: "separator" as const },
    { icon: Search, label: "Modo Comparar", active: showCompareMode, action: onToggleCompareMode },
  ];

  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-card border-r border-border min-h-full">
      {/* Main navigation icons */}
      <button
        onClick={onToggleBookSelector}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Seletor de Livro"
      >
        <BookOpen className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleSearch}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Buscar na Bíblia (F3)"
      >
        <Search className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleGoTo}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Ir para... (Ctrl+G)"
      >
        <Library className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleHistory}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Histórico de Leitura"
      >
        <Home className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleFavorites}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Favoritos"
      >
        <Star className="w-4 h-4" />
      </button>

      <div className="w-full h-px bg-border my-1" />

      <button
        onClick={onToggleLexicon}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Léxico/Concordância"
      >
        <Library className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleDictionary}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Dicionário"
      >
        <BookKey className="w-4 h-4" />
      </button>

      <button
        onClick={onTogglePeople}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Personagens Bíblicos"
      >
        <Users className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleMap}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Mapa Bíblico"
      >
        <Map className="w-4 h-4" />
      </button>

      <div className="w-full h-px bg-border my-1" />

      <button
        onClick={onToggleNotes}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Notas de Estudo"
      >
        <FileText className="w-4 h-4" />
      </button>

      <button
        onClick={onToggleNotepad}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="Bloco de Notas"
      >
        <Notebook className="w-4 h-4" />
      </button>

      <div className="w-full h-px bg-border my-1" />

      {/* Quick Options Dropdown - Estilo TheWord */}
      <div className="relative">
        <button
          onClick={() => setShowQuickOptions(!showQuickOptions)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showQuickOptions ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          title="Opções Rápidas (Ctrl+O)"
        >
          <Settings className="w-4 h-4" />
          <ChevronDown className="w-3 h-3 absolute -bottom-1 -right-1" />
        </button>

        {showQuickOptions && (
          <div className="absolute left-full top-0 ml-2 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[200px] z-50">
            <p className="text-[10px] tracking-[0.2em] font-semibold text-muted-foreground px-2 mb-2">
              OPÇÕES RÁPIDAS
            </p>
            {quickOptions.map((option, index) => (
              option.type === "separator" ? (
                <div key={index} className="w-full h-px bg-border my-1" />
              ) : (
                <button
                  key={index}
                  onClick={() => {
                    option.action?.();
                    setShowQuickOptions(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                    option.active
                      ? "bg-primary/15 text-primary font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  <option.icon className="w-3.5 h-3.5" />
                  <span>{option.label}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>

      {/* Compare Mode Toggle */}
      <button
        onClick={onToggleCompareMode}
        className={cn(
          "p-2 rounded-lg transition-colors",
          showCompareMode ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        title="Modo Comparar"
      >
        <ArrowRight className="w-4 h-4 rotate-90" />
      </button>
    </div>
  );
};

export default QuickAccessToolbar;