import { useState } from "react";
import { Sun, Moon, Cloud, Minus, Plus, Type, Sparkles, AlignLeft, List, BookOpen, Link2, MessageSquare, FileText, Search, Languages, Columns, Rows, X, Type as FontIcon, Heading, Highlighter, FileSignature, AlignCenter } from "lucide-react";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LucideIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const FONT_OPTIONS = [
  { value: "EB Garamond", label: "EB Garamond" },
  { value: "Inter", label: "Inter" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Cormorant Garamond", label: "Cormorant Garamond" },
  { value: "Georgia", label: "Georgia" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Segoe UI", label: "Segoe UI" },
];

const ReaderSettingsBar = () => {
  const {
    fontSize, setFontSize, theme, setTheme,
    viewMode, setViewMode,
    showStrongNumbers, setShowStrongNumbers,
    showMorphology, setShowMorphology,
    showCrossRefs, setShowCrossRefs,
    showInlineNotes, setShowInlineNotes,
    showCommentaryLinks, setShowCommentaryLinks,
    wordLookupEnabled, setWordLookupEnabled,
    showHeaderFooter, setShowHeaderFooter,
    showUserHighlights, setShowUserHighlights,
    showFootnotes, setShowFootnotes,
    commentaryPosition, setCommentaryPosition,
    selectedFont, setSelectedFont,
  } = useReaderSettings();

  const [parallelMode, setParallelMode] = useState<"none" | "horizontal" | "vertical">("none");
  const [secondBibleTranslation, setSecondBibleTranslation] = useState("nvi");

  const themeOptions: { value: "light" | "gray" | "dark"; icon: LucideIcon; label: string; color: string }[] = [
    { value: "light", icon: Sun, label: "Claro", color: "text-amber-500" },
    { value: "gray", icon: Cloud, label: "Cinza", color: "text-slate-400" },
    { value: "dark", icon: Moon, label: "Escuro", color: "text-indigo-400" },
  ];

  const currentTheme = themeOptions.find(t => t.value === theme) || themeOptions[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="flex items-center gap-1.5">
      {/* Theme toggle */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="reader-icon-button"
            title={`Tema: ${currentTheme.label}`}
          >
            <CurrentIcon className={`w-4 h-4 ${currentTheme.color}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3 reader-surface border border-border/70" align="end">
          <div className="space-y-2">
            <p className="text-[10px] tracking-[0.2em] font-sans font-semibold text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              TEMA
            </p>
            <div className="flex gap-2">
              {themeOptions.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                    theme === t.value
                      ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <t.icon className={`w-5 h-5 ${t.color}`} />
                  <span className="text-[10px] font-medium text-muted-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Font size popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="reader-icon-button"
            title="Tamanho da fonte"
          >
            <Type className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-4 reader-surface border border-border/70" align="end">
          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.3em] font-sans font-semibold text-muted-foreground">
              TAMANHO DA FONTE
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setFontSize(fontSize - 2)}
                disabled={fontSize <= 14}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Slider
                value={[fontSize]}
                min={14}
                max={32}
                step={2}
                onValueChange={([v]) => setFontSize(v)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setFontSize(fontSize + 2)}
                disabled={fontSize >= 32}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-sans">
              <span>A</span>
              <span className="font-serif" style={{ fontSize: `${fontSize}px` }}>
                {fontSize}px
              </span>
              <span className="text-base">A</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Visual Options (TheWord style) */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="reader-icon-button"
            title="Opções de Visualização"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 reader-surface border border-border/70" align="end">
          <div className="space-y-4">
            <p className="text-[10px] tracking-[0.3em] font-sans font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              VISUALIZAÇÃO
            </p>

            {/* View Mode */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Modo de Visualização</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("paragraph")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all",
                    viewMode === "paragraph"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  Parágrafo
                </button>
                <button
                  onClick={() => setViewMode("verse")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all",
                    viewMode === "verse"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  Um por Linha
                </button>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Display Options */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Exibir</p>
              <div className="space-y-1.5">
                <ToggleOption
                  label="Referências Cruzadas"
                  enabled={showCrossRefs}
                  onChange={setShowCrossRefs}
                  shortcut="X"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </ToggleOption>
                <ToggleOption
                  label="Notas de Estudo"
                  enabled={showInlineNotes}
                  onChange={setShowInlineNotes}
                  shortcut="N"
                >
                  <FileText className="w-3.5 h-3.5" />
                </ToggleOption>
                <ToggleOption
                  label="Links de Comentários"
                  enabled={showCommentaryLinks}
                  onChange={setShowCommentaryLinks}
                  shortcut="L"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </ToggleOption>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Linguistic Options */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Linguística</p>
              <div className="space-y-1.5">
                <ToggleOption
                  label="Números Strong"
                  enabled={showStrongNumbers}
                  onChange={setShowStrongNumbers}
                  shortcut="S"
                >
                  <span className="w-3.5 h-3.5 text-[10px] font-bold">S#</span>
                </ToggleOption>
                <ToggleOption
                  label="Morfologia"
                  enabled={showMorphology}
                  onChange={setShowMorphology}
                  shortcut="M"
                >
                  <Languages className="w-3.5 h-3.5" />
                </ToggleOption>
                <ToggleOption
                  label="Busca de Palavras"
                  enabled={wordLookupEnabled}
                  onChange={setWordLookupEnabled}
                  shortcut="D"
                >
                  <Search className="w-3.5 h-3.5" />
                </ToggleOption>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Parallel View */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Visão Paralela</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setParallelMode("none")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all",
                    parallelMode === "none"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <X className="w-3.5 h-3.5" />
                  Desligado
                </button>
                <button
                  onClick={() => setParallelMode("horizontal")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all",
                    parallelMode === "horizontal"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <Columns className="w-3.5 h-3.5" />
                  Horizontal
                </button>
                <button
                  onClick={() => setParallelMode("vertical")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all",
                    parallelMode === "vertical"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <Rows className="w-3.5 h-3.5" />
                  Vertical
                </button>
              </div>
              {parallelMode !== "none" && (
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground">Segunda tradução:</label>
                  <select
                    value={secondBibleTranslation}
                    onChange={(e) => setSecondBibleTranslation(e.target.value)}
                    className="mt-1 w-full p-2 rounded border border-border text-xs bg-background"
                  >
                    <option value="nvi">NVI - Nova Versão Internacional</option>
                    <option value="ra"> Almeida Revisada</option>
                    <option value="acf">Almeida Corrigida Fiel</option>
                    <option value="nbb">Nova Biblia de Jardim</option>
                  </select>
                </div>
              )}
            </div>

            <Separator className="my-2" />

            {/* Header/Footer Navigation - Estilo TheWord */}
            <div className="space-y-2">
              <ToggleOption
                label="Navegação Cabeçalho/Rodapé"
                enabled={showHeaderFooter}
                onChange={setShowHeaderFooter}
                shortcut="Q"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </ToggleOption>
              <ToggleOption
                label="Destaques do Usuário"
                enabled={showUserHighlights}
                onChange={setShowUserHighlights}
                shortcut="U"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </ToggleOption>
              <ToggleOption
                label="Notas de Rodapé"
                enabled={showFootnotes}
                onChange={setShowFootnotes}
                shortcut="F"
              >
                <FileSignature className="w-3.5 h-3.5" />
              </ToggleOption>
            </div>

            <Separator className="my-2" />

            {/* Inline Commentary Position - Estilo TheWord */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Comentários Inline</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCommentaryPosition("none")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all",
                    commentaryPosition === "none"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <X className="w-3.5 h-3.5" />
                  Desligado
                </button>
                <button
                  onClick={() => setCommentaryPosition("below")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all",
                    commentaryPosition === "below"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  Abaixo
                </button>
                <button
                  onClick={() => setCommentaryPosition("right")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-medium transition-all",
                    commentaryPosition === "right"
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                  )}
                >
                  <Columns className="w-3.5 h-3.5" />
                  Direita
                </button>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Font Selection - Estilo TheWord */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Fonte do Texto</p>
              <div className="grid grid-cols-2 gap-1">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setSelectedFont(font.value)}
                    className={cn(
                      "p-2 rounded-lg text-xs font-medium transition-all",
                      selectedFont === font.value
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "hover:bg-muted/50 text-muted-foreground border border-transparent"
                    )}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const ToggleOption = ({
  label,
  enabled,
  onChange,
  children,
  shortcut,
}: {
  label: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  shortcut?: string;
}) => (
  <button
    onClick={() => onChange(!enabled)}
    className={cn(
      "w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all",
      enabled
        ? "bg-primary/10 text-foreground"
        : "hover:bg-muted/50 text-muted-foreground"
    )}
  >
    <div className="flex items-center gap-2">
      {children}
      <span>{label}</span>
    </div>
    {shortcut && (
      <span className="text-[10px] opacity-60 font-mono bg-muted/30 px-1.5 py-0.5 rounded">
        {shortcut}
      </span>
    )}
  </button>
);

export default ReaderSettingsBar;