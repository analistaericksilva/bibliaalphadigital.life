import { Sun, Moon, Minus, Plus, Type } from "lucide-react";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const ReaderSettingsBar = () => {
  const { fontSize, setFontSize, isDark, toggleTheme } = useReaderSettings();

  return (
    <div className="flex items-center gap-1">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title={isDark ? "Modo dia" : "Modo noite"}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Font size popover */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Tamanho da fonte"
          >
            <Type className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-4" align="end">
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
