import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Languages } from "lucide-react";

interface InterlinearWord {
  word_num: number;
  original_word: string;
  transliteration: string | null;
  english: string | null;
  strongs_number: string | null;
  grammar: string | null;
  language: string;
}

interface InterlinearViewProps {
  bookId: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}

const InterlinearView = ({ bookId, chapter, verse, onClose }: InterlinearViewProps) => {
  const [words, setWords] = useState<InterlinearWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<InterlinearWord | null>(null);
  const [lexiconDef, setLexiconDef] = useState<string | null>(null);
  const [lexiconLoading, setLexiconLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("interlinear_words")
        .select("word_num, original_word, transliteration, english, strongs_number, grammar, language")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .order("word_num");
      setWords((data as InterlinearWord[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [bookId, chapter, verse]);

  const handleWordClick = async (word: InterlinearWord) => {
    if (selectedWord?.word_num === word.word_num) {
      setSelectedWord(null);
      setLexiconDef(null);
      return;
    }
    setSelectedWord(word);
    setLexiconDef(null);

    if (word.strongs_number) {
      setLexiconLoading(true);
      const cleanStrongs = word.strongs_number.replace(/[A-Za-z]$/, '');
      const { data } = await supabase
        .from("strongs_lexicon")
        .select("definition, gloss, original_word, transliteration")
        .or(`strongs_number.eq.${word.strongs_number},strongs_number.eq.${cleanStrongs}`)
        .limit(1);
      if (data && data.length > 0) {
        setLexiconDef(data[0].definition || data[0].gloss || null);
      }
      setLexiconLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-sans">Carregando interlinear…</span>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="py-4 px-5">
        <p className="text-sm text-muted-foreground font-sans italic">
          Texto interlinear não disponível para este versículo.
        </p>
      </div>
    );
  }

  const isHebrew = words[0]?.language === "hebrew";

  return (
    <div className="p-4">
      {/* Language badge */}
      <div className="flex items-center gap-2 mb-4">
        <Languages className="w-4 h-4 text-primary" />
        <span className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider">
          Versículo {verse}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-medium ${
          isHebrew 
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
        }`}>
          {isHebrew ? "Hebraico" : "Grego"}
        </span>
      </div>

      {/* Word grid */}
      <div className={`flex flex-wrap gap-2 ${isHebrew ? "flex-row-reverse" : ""}`}>
        {words.map((w) => (
          <button
            key={w.word_num}
            onClick={() => handleWordClick(w)}
            className={`flex flex-col items-center px-3 py-2.5 rounded-xl transition-all min-w-[60px] border ${
              selectedWord?.word_num === w.word_num
                ? "bg-primary/10 border-primary/30 shadow-sm"
                : "border-transparent hover:bg-muted/50 hover:border-border"
            }`}
          >
            <span className={`${isHebrew ? "text-lg" : "text-base"} font-serif text-foreground leading-tight`}>
              {w.original_word}
            </span>
            {w.transliteration && (
              <span className="text-[10px] text-muted-foreground italic font-sans mt-1">
                {w.transliteration}
              </span>
            )}
            <span className="text-[11px] font-sans text-foreground/80 mt-1 leading-tight text-center font-medium">
              {w.english}
            </span>
            {w.strongs_number && (
              <span className="text-[9px] font-mono text-primary/70 mt-1">
                {w.strongs_number}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected word detail */}
      {selectedWord && (
        <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <span className={`${isHebrew ? "text-2xl" : "text-xl"} font-serif text-foreground`}>
              {selectedWord.original_word}
            </span>
            {selectedWord.strongs_number && (
              <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">
                {selectedWord.strongs_number}
              </span>
            )}
          </div>
          {selectedWord.transliteration && (
            <p className="text-sm text-muted-foreground italic font-sans mb-1">
              {selectedWord.transliteration}
            </p>
          )}
          <p className="text-base font-sans font-semibold text-foreground">
            {selectedWord.english}
          </p>
          {selectedWord.grammar && (
            <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted/50 inline-block px-2 py-1 rounded">
              {selectedWord.grammar}
            </p>
          )}
          {lexiconLoading && (
            <div className="flex items-center gap-2 mt-3 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs">Buscando definição…</span>
            </div>
          )}
          {lexiconDef && (
            <div className="mt-3 p-3 bg-background rounded-lg border border-border/50 text-sm font-serif leading-relaxed text-foreground/90">
              {lexiconDef}
            </div>
          )}
        </div>
      )}

      <p className="text-[9px] text-muted-foreground/50 font-sans text-right mt-3">
        STEPBible TAGNT/TAHOT (CC BY 4.0) — Tyndale House
      </p>
    </div>
  );
};

export default InterlinearView;
