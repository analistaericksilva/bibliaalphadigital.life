import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Highlight {
  id: string;
  verse: number;
  color: string;
}

interface PersonalNote {
  id: string;
  verse: number;
  content: string;
}

interface Favorite {
  id: string;
  verse: number;
  label: string | null;
}

export function useUserAnnotations(bookId: string, chapter: number) {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) return;

    const [hlRes, notesRes, favRes] = await Promise.all([
      supabase
        .from("highlights")
        .select("id, verse, color")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .eq("chapter", chapter),
      supabase
        .from("personal_notes")
        .select("id, verse, content")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .eq("chapter", chapter),
      supabase
        .from("favorites")
        .select("id, verse, label")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .eq("chapter", chapter),
    ]);

    if (hlRes.data) setHighlights(hlRes.data);
    if (notesRes.data) setPersonalNotes(notesRes.data);
    if (favRes.data) setFavorites(favRes.data);
  }, [user, bookId, chapter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleHighlight = async (verse: number, color = "yellow") => {
    if (!user) return;
    const existing = highlights.find((h) => h.verse === verse);
    if (existing) {
      if (existing.color === color) {
        await supabase.from("highlights").delete().eq("id", existing.id);
      } else {
        await supabase.from("highlights").update({ color }).eq("id", existing.id);
      }
    } else {
      await supabase.from("highlights").insert({
        user_id: user.id,
        book_id: bookId,
        chapter,
        verse,
        color,
      });
    }
    fetchAll();
  };

  const toggleFavorite = async (verse: number) => {
    if (!user) return;
    const existing = favorites.find((f) => f.verse === verse);
    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        book_id: bookId,
        chapter,
        verse,
      });
    }
    fetchAll();
  };

  const savePersonalNote = async (verse: number, content: string) => {
    if (!user) return;
    const existing = personalNotes.find((n) => n.verse === verse);
    if (existing) {
      if (!content.trim()) {
        await supabase.from("personal_notes").delete().eq("id", existing.id);
      } else {
        await supabase.from("personal_notes").update({ content }).eq("id", existing.id);
      }
    } else if (content.trim()) {
      await supabase.from("personal_notes").insert({
        user_id: user.id,
        book_id: bookId,
        chapter,
        verse,
        content,
      });
    }
    fetchAll();
  };

  const recordReading = useCallback(async () => {
    if (!user) return;
    await supabase.from("reading_history").upsert(
      { user_id: user.id, book_id: bookId, chapter, read_at: new Date().toISOString() },
      { onConflict: "user_id,book_id,chapter" }
    );
  }, [user, bookId, chapter]);

  return {
    highlights,
    personalNotes,
    favorites,
    toggleHighlight,
    toggleFavorite,
    savePersonalNote,
    recordReading,
    refreshAnnotations: fetchAll,
  };
}
