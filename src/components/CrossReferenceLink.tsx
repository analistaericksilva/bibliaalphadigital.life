import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, ExternalLink, BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CrossRef {
  book_id: string;
  chapter: number;
  verse: number;
  refs: string;
}

interface CrossReferenceLinkProps {
  bookId: string;
  chapter: number;
  verse: number;
  className?: string;
  children?: React.ReactNode;
}

const CrossReferenceLink = ({ bookId, chapter, verse, className, children }: CrossReferenceLinkProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [crossRefs, setCrossRefs] = useState<CrossRef[]>([]);

  useEffect(() => {
    if (isOpen && !crossRefs.length) {
      setIsLoading(true);
      loadCrossRefs();
    }
  }, [isOpen]);

  const loadCrossRefs = async () => {
    try {
      const { data, error } = await supabase
        .from("bible_cross_references")
        .select("*")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("verse", verse);

      if (error) throw error;
      setCrossRefs(data || []);
    } catch (err) {
      console.error("Error loading cross references:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para navegar para a referência
  const navigateToRef = (ref: string) => {
    // Parse ref como "Gn 1:1" ou "1:1"
    const parts = ref.trim().split(/[\s:]+/);
    if (parts.length >= 2) {
      const bookAbbrev = parts[0];
      const chapterVerse = parts[1];
      
      // Converter abreviação para ID do livro
      const bookMap: Record<string, string> = {
        "gn": "gn", "ex": "ex", "lv": "lv", "nm": "nm", "dt": "dt",
        "js": "js", "jz": "jz", "1sm": "1sm", "2sm": "2sm",
        "1rs": "1rs", "2rs": "2rs", "1cr": "1cr", "2cr": "2cr",
        "ed": "ed", "ne": "ne", "et": "et", "sl": "sl", "pv": "pv",
        "ec": "ec", "ct": "ct", "is": "is", "jr": "jr", "lm": "lm",
        "ez": "ez", "dn": "dn", "os": "os", "jl": "jl", "am": "am",
        "ob": "ob", "mq": "mq", "na": "na", "hc": "hc", "sf": "sf",
        "ag": "ag", "zc": "zc", "ml": "ml",
        "mt": "mt", "mc": "mc", "lc": "lc", "jo": "jo", "at": "at",
        "rm": "rm", "1co": "1co", "2co": "2co", "gl": "gl", "ef": "ef",
        "fp": "fp", "cl": "cl", "1ts": "1ts", "2ts": "2ts",
        "1tm": "1tm", "2tm": "2tm", "tt": "tt", "fm": "fm",
        "hb": "hb", "tg": "tg", "1pe": "1pe", "2pe": "2pe",
        "1jo": "1jo", "2jo": "2jo", "3jo": "3jo", "jd": "jd", "ap": "ap",
      };

      const bookId = bookMap[bookAbbrev.toLowerCase()] || bookAbbrev;
      const [ch, v] = chapterVerse.split(",").map(Number);
      
      // Dispara evento de navegação (será capturado pelo componente pai)
      window.dispatchEvent(new CustomEvent("navigate-to-verse", {
        detail: { bookId, chapter: ch, verse: v || 1 }
      }));
      
      setIsOpen(false);
    }
  };

  // Formatar referência para exibição
  const formatRef = (ref: string): string => {
    return ref.replace(/^(\w+)\s*(\d+):(\d+)/, (_, book, ch, v) => {
      const bookNames: Record<string, string> = {
        "gn": "Gn", "ex": "Êx", "lv": "Lv", "nm": "Nm", "dt": "Dt",
        "js": "Js", "jz": "Jz", "1sm": "1Sm", "2sm": "2Sm",
        "1rs": "1Rs", "2rs": "2Rs", "1cr": "1Cr", "2cr": "2Cr",
        "ed": "Ed", "ne": "Ne", "et": "Et", "sl": "Sl", "pv": "Pv",
        "ec": "Ec", "ct": "Ct", "is": "Is", "jr": "Jr", "lm": "Lm",
        "ez": "Ez", "dn": "Dn", "os": "Os", "jl": "Jl", "am": "Am",
        "ob": "Ob", "mq": "Mq", "na": "Na", "hc": "Hc", "sf": "Sf",
        "ag": "Ag", "zc": "Zc", "ml": "Ml",
        "mt": "Mt", "mc": "Mc", "lc": "Lc", "jo": "Jo", "at": "At",
        "rm": "Rm", "1co": "1Co", "2co": "2Co", "gl": "Gl", "ef": "Ef",
        "fp": "Fp", "cl": "Cl", "1ts": "1Ts", "2ts": "2Ts",
        "1tm": "1Tm", "2tm": "2Tm", "tt": "Tt", "fm": "Fm",
        "hb": "Hb", "tg": "Tg", "1pe": "1Pe", "2pe": "2Pe",
        "1jo": "1Jo", "2jo": "2Jo", "3jo": "3Jo", "jd": "Jd", "ap": "Ap",
      };
      const bookName = bookNames[book.toLowerCase()] || book;
      return `${bookName} ${ch}:${v}`;
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children ? (
          <span className={className}>{children}</span>
        ) : (
          <button
            className={cn(
              "inline-flex items-center text-[10px] font-sans underline underline-offset-2",
              "decoration-primary/50 text-primary/90 hover:text-primary",
              "cursor-pointer transition-colors hover:decoration-primary",
              className
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            aria-label={`Ver referências cruzadas do versículo ${verse}`}
          >
            <Link2 className="w-2.5 h-2.5 mr-0.5" />
            ↗
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <span className="font-semibold text-sm">Referências Cruzadas</span>
        </div>
        
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : crossRefs.length > 0 ? (
            <div className="space-y-2">
              {crossRefs.map((ref, index) => (
                <button
                  key={index}
                  onClick={() => navigateToRef(ref.refs)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors text-left group"
                >
                  <span className="text-sm font-medium">
                    {formatRef(ref.refs)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma referência cruzada encontrada</p>
              <p className="text-xs mt-1">Dados não disponíveis no banco</p>
            </div>
          )}
        </div>
        
        <div className="px-3 pb-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-cross-refs-panel", {
                detail: { bookId, chapter, verse }
              }));
              setIsOpen(false);
            }}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Ver mais referências
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CrossReferenceLink;
export { CrossReferenceLink };