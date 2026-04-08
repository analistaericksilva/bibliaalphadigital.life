import { useState, useEffect } from "react";
import { RefreshCw, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DailyVerseData {
  text: string;
  book_name: string;
  chapter: number;
  verse_number: number;
}

const DailyVerse = () => {
  const [verse, setVerse] = useState<DailyVerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVerse = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Get total count, then pick a random offset
      const { count } = await supabase
        .from("bible_verses")
        .select("id", { count: "exact", head: true });

      if (!count || count === 0) throw new Error("No verses");

      const randomOffset = Math.floor(Math.random() * count);
      const { data, error } = await supabase
        .from("bible_verses")
        .select("text, book_name, chapter, verse_number")
        .range(randomOffset, randomOffset)
        .single();

      if (error) throw error;
      setVerse(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const cached = localStorage.getItem("dailyVerse");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today && parsed.verse) {
          setVerse(parsed.verse);
          setLoading(false);
          return;
        }
      } catch { /* ignore parse errors */ }
    }
    fetchVerse();
  }, []);

  useEffect(() => {
    if (verse) {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem("dailyVerse", JSON.stringify({ date: today, verse }));
    }
  }, [verse]);

  const handleRefresh = () => {
    localStorage.removeItem("dailyVerse");
    fetchVerse(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!verse) return null;

  return (
    <div className="reader-surface p-6 md:p-8 text-center relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-primary" />
        <p className="text-[9px] tracking-[0.4em] font-sans text-primary font-semibold">
          VERSÍCULO DO DIA
        </p>
      </div>

      <blockquote className="relative text-lg md:text-xl font-serif text-foreground leading-relaxed mb-4 italic">
        "{verse.text}"
      </blockquote>

      <p className="relative text-sm font-sans text-muted-foreground tracking-wide">
        {verse.book_name} {verse.chapter}:{verse.verse_number}
      </p>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="absolute top-4 right-4 p-2 rounded-lg border border-border/60 bg-card/70 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
        title="Novo versículo"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
};

export default DailyVerse;
