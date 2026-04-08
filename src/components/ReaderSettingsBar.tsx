import { Sun, Moon, Cloud, Minus, Plus, Type, Sparkles } from "lucide-react";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LucideIcon } from "lucide-react";

const ReaderSettingsBar = () => {
  const { fontSize, setFontSize, theme, setTheme } = useReaderSettings();

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
                  onClick={() => setTheme(t.value as any)}
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
    </div>
  );
};

export default ReaderSettingsBar;