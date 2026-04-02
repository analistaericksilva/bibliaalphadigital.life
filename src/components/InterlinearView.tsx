import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Languages } from "lucide-react";

interface InterlinearWord {
  word_num: number;
  original_word: string;
  transliteration: string | null;
  english: string | null;
  portuguese?: string | null;
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
  const [translating, setTranslating] = useState(false);
  const [selectedWord, setSelectedWord] = useState<InterlinearWord | null>(null);
  const [lexiconDef, setLexiconDef] = useState<string | null>(null);
  const [lexiconLoading, setLexiconLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setSelectedWord(null);
      setLexiconDef(null);
      const { data } = await supabase
        .from("interlinear_words")
        .select("word_num, original_word, transliteration, english, strongs_number, grammar, language")
        .eq("book_id", bookId)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .order("word_num");
      const fetched = (data as InterlinearWord[]) || [];
      setWords(fetched);
      setLoading(false);

      // Translate to Portuguese
      if (fetched.length > 0) {
        setTranslating(true);
        try {
          const { data: translateData, error } = await supabase.functions.invoke("translate-interlinear", {
            body: { words: fetched.map(w => ({ english: w.english, original_word: w.original_word })) },
          });
          if (!error && translateData?.translations?.length) {
            setWords(prev => prev.map((w, i) => ({
              ...w,
              portuguese: translateData.translations[i] || w.english,
            })));
          }
        } catch (e) {
          console.error("Translation error:", e);
        }
        setTranslating(false);
      }
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
      const cleanStrongs = word.strongs_number.replace(/[A-Za-z]$/, "");
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
      <div className="py-5 px-5">
        <p className="text-sm text-muted-foreground font-sans italic">
          Texto interlinear não disponível para este versículo.
        </p>
      </div>
    );
  }

  const isHebrew = words[0]?.language === "hebrew";
  const displayWord = (w: InterlinearWord) => w.portuguese || w.english;

  return (
    <div className="p-5">
      {/* Language badge */}
      <div className="flex items-center gap-2 mb-4">
        <Languages className="w-4 h-4 text-primary" />
        <span className="text-xs font-sans font-semibold text-foreground uppercase tracking-wider">
          Versículo {verse}
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-medium ${
            isHebrew
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          }`}
        >
          {isHebrew ? "Hebraico" : "Grego"}
        </span>
        {translating && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-sans">traduzindo…</span>
          </span>
        )}
      </div>

      {/* Word grid */}
      <div className={`flex flex-wrap gap-2 ${isHebrew ? "flex-row-reverse" : ""}`}>
        {words.map((w) => (
          <button
            key={w.word_num}
            onClick={() => handleWordClick(w)}
            className={`flex flex-col items-center px-3 py-3 rounded-xl transition-all min-w-[64px] border cursor-pointer ${
              selectedWord?.word_num === w.word_num
                ? "bg-primary/10 border-primary/30 shadow-sm scale-105"
                : "border-border/40 hover:bg-muted/50 hover:border-border hover:shadow-sm"
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
            <span className="text-[11px] font-sans text-primary font-semibold mt-1.5 leading-tight text-center">
              {displayWord(w)}
            </span>
            {w.strongs_number && (
              <span className="text-[8px] font-mono text-muted-foreground/60 mt-1">
                {w.strongs_number}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected word detail */}
      {selectedWord && (
        <div className="mt-5 p-5 rounded-xl bg-muted/40 border border-border/50 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <span className={`${isHebrew ? "text-3xl" : "text-2xl"} font-serif text-foreground`}>
              {selectedWord.original_word}
            </span>
            {selectedWord.strongs_number && (
              <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors">
                {selectedWord.strongs_number}
              </span>
            )}
          </div>
          {selectedWord.transliteration && (
            <p className="text-sm text-muted-foreground italic font-sans mb-1">
              {selectedWord.transliteration}
            </p>
          )}
          <p className="text-lg font-sans font-semibold text-foreground">
            {displayWord(selectedWord)}
          </p>
          {selectedWord.portuguese && selectedWord.english && selectedWord.portuguese !== selectedWord.english && (
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Literal: {selectedWord.english}
            </p>
          )}
          {selectedWord.grammar && (
            <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted/60 inline-block px-2.5 py-1.5 rounded-lg">
              Morfologia: {selectedWord.grammar}
            </p>
          )}
          {lexiconLoading && (
            <div className="flex items-center gap-2 mt-3 text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-xs font-sans">Buscando definição…</span>
            </div>
          )}
          {lexiconDef && (
            <div className="mt-4 p-4 bg-background rounded-xl border border-border/50 text-sm font-serif leading-[1.9] text-foreground/90">
              <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-primary mb-2">Definição do Léxico</p>
              {lexiconDef}
            </div>
          )}
        </div>
      )}

      <p className="text-[9px] text-muted-foreground/40 font-sans text-right mt-4">
        STEPBible TAGNT/TAHOT (CC BY 4.0) — Tyndale House
      </p>
    </div>
  );
};

export default InterlinearView;
