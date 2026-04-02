import { useState, useEffect } from "react";
import { RefreshCw, Loader2, BookOpen } from "lucide-react";
import { bibleApi, type RandomVerse } from "@/lib/bibleApi";

const DailyVerse = () => {
  const [verse, setVerse] = useState<RandomVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVerse = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await bibleApi.getRandomVerse("nvi");
      setVerse(data);
    } catch {
      // Silently fail — the component will just not show
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Try to use a cached verse for today
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
      } catch {}
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
    <div className="bg-paper page-shadow rounded p-6 md:p-8 text-center relative">
      <div className="flex items-center justify-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-primary" />
        <p className="text-[9px] tracking-[0.4em] font-sans text-primary font-semibold">
          VERSÍCULO DO DIA
        </p>
      </div>

      <blockquote className="text-lg md:text-xl font-serif text-foreground leading-relaxed mb-4 italic">
        "{verse.text}"
      </blockquote>

      <p className="text-sm font-sans text-muted-foreground">
        {verse.book.name} {verse.chapter}:{verse.number}
      </p>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary transition-colors"
        title="Novo versículo"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
};

export default DailyVerse;
