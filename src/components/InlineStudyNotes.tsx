import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bibleBooks";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface StudyNote {
  id: string;
  verse_start: number;
  verse_end: number | null;
  title: string | null;
  content: string;
  source: string | null;
  note_type: string;
}

interface DictEntry {
  id: string;
  term: string;
  definition: string;
  hebrew_greek: string | null;
  references_list: string[] | null;
}

interface InlineStudyNotesProps {
  bookId: string;
  chapter: number;
  verse: number;
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void;
}

const abbrevToId: Record<string, string> = {};
const nameToId: Record<string, string> = {};

bibleBooks.forEach((book) => {
  abbrevToId[book.abbrev.toLowerCase()] = book.id;
  nameToId[book.name.toLowerCase()] = book.id;
  abbrevToId[book.id] = book.id;
});

const SOURCE_LABELS: Record<string, string> = {
  matthew_henry: "Matthew Henry",
  sermon: "Sermão",
  commentary: "Comentário",
  concordance: "Referência",
};

function parseReference(refStr: string) {
  const match = refStr
    .trim()
    .match(/^(\d?\s?[A-Za-zÀ-ú]+(?:\s+[A-Za-zÀ-ú]+)*)\s+(\d+)(?:[.:](\d+))?/);

  if (!match) return null;

  const rawBook = match[1].trim();
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : undefined;

  const compact = rawBook.replace(/\s+/g, "").toLowerCase();
  const spaced = rawBook.toLowerCase();

  const bookId = abbrevToId[compact] || nameToId[spaced] || nameToId[compact];
  if (!bookId) return null;

  return { bookId, chapter, verse };
}

function shortText(text: string, maxChars = 170) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > maxChars ? `${clean.slice(0, maxChars).trimEnd()}…` : clean;
}

function renderContentWithRefs(
  text: string,
  onNavigate?: (bookId: string, chapter: number, verse?: number) => void
) {
  if (!onNavigate) return <span>{text}</span>;

  const refRegex = /(\d?\s?[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú]?[a-zà-ú]+)*)\s+(\d+)[.:](\d+)(?:-(\d+))?/g;
  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = refRegex.exec(text)) !== null) {
    const matchedText = match[0];
    const parsed = parseReference(matchedText);

    if (match.index > lastIndex) {
      parts.push(<span key={`txt-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    if (parsed) {
      parts.push(
        <button
          key={`ref-${match.index}`}
          type="button"
          onClick={() => onNavigate(parsed.bookId, parsed.chapter, parsed.verse)}
          className="underline underline-offset-2 decoration-primary/40 hover:decoration-primary text-primary/90 hover:text-primary transition-colors"
        >
          {matchedText}
        </button>
      );
    } else {
      parts.push(<span key={`raw-ref-${match.index}`}>{matchedText}</span>);
    }

    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`txt-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length ? <>{parts}</> : <span>{text}</span>;
}

const InlineStudyNotes = ({
  bookId,
  chapter,
  verse,
  onNavigate,
}: InlineStudyNotesProps) => {
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<StudyNote[]>([]);
  const [crossRefs, setCrossRefs] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<DictEntry[]>([]);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [openKeywordId, setOpenKeywordId] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchInlineData = async () => {
      setLoading(true);

      const [notesRes, concRes, dictRes] = await Promise.all([
        supabase
          .from("study_notes")
          .select("*")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .neq("note_type", "concordance")
          .lte("verse_start", verse)
          .order("verse_start"),
        supabase
          .from("study_notes")
          .select("content")
          .eq("book_id", bookId)
          .eq("chapter", chapter)
          .eq("note_type", "concordance")
          .eq("verse_start", verse),
        supabase
          .from("bible_dictionary")
          .select("id, term, definition, hebrew_greek, references_list")
          .not("references_list", "is", null)
          .not("hebrew_greek", "is", null),
      ]);

      if (!mounted) return;

      const allNotes = ((notesRes.data as StudyNote[]) || []).filter(
        (note) =>
          note.verse_start <= verse &&
          (note.verse_end ? note.verse_end >= verse : note.verse_start === verse)
      );

      const limitedComments = allNotes.slice(0, 2);

      const refs = Array.from(
        new Set(
          ((concRes.data as Array<{ content: string }>) || [])
            .flatMap((row) => row.content.split(";"))
            .map((r) => r.trim())
            .filter(Boolean)
        )
      ).slice(0, 8);

      const allDict = (dictRes.data as DictEntry[]) || [];
      const matchedKeywords = allDict
        .filter((entry) => {
          if (!entry.references_list || !Array.isArray(entry.references_list)) return false;
          return entry.references_list.some((refText) => {
            const parsed = parseReference(refText);
            return (
              parsed &&
              parsed.bookId === bookId &&
              parsed.chapter === chapter &&
              parsed.verse === verse
            );
          });
        })
        .slice(0, 6);

      setComments(limitedComments);
      setCrossRefs(refs);
      setKeywords(matchedKeywords);
      setOpenCommentId(null);
      setOpenKeywordId(null);
      setLoading(false);
    };

    fetchInlineData();

    return () => {
      mounted = false;
    };
  }, [bookId, chapter, verse]);

  const activeKeyword = useMemo(
    () => keywords.find((entry) => entry.id === openKeywordId) || null,
    [keywords, openKeywordId]
  );

  useEffect(() => {
    setIsMinimized(true);
  }, [bookId, chapter, verse]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 ml-2 text-[12px] menu-strong align-middle">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        carregando notas
      </span>
    );
  }

  const hasAnyContent = comments.length > 0 || crossRefs.length > 0 || keywords.length > 0;

  if (!hasAnyContent) {
    return (
      <span className="block mt-2 mb-5 rounded-xl border border-border/70 bg-card/80 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <span className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.22em] menu-strong">Verso {verse}</span>
        </span>
        <span className="mt-2 block text-[13px] comment-strong">Sem comentários ou referências para este versículo.</span>
      </span>
    );
  }

  return (
    <span className="block mt-2 mb-5 rounded-xl border border-border/70 bg-card/85 px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.08)]">
      <span className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] menu-strong">Verso {verse}</span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="h-6 w-6 rounded-full text-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            aria-label={isMinimized ? "Expandir notas" : "Minimizar notas"}
            title={isMinimized ? "Expandir notas" : "Minimizar notas"}
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5 mx-auto" /> : <ChevronUp className="w-3.5 h-3.5 mx-auto" />}
          </button>
        </span>
      </span>

      {isMinimized ? (
        <span className="block text-[12px] comment-strong italic">Notas minimizadas para este versículo.</span>
      ) : (
      <>
      {comments.length > 0 && (
        <span className="flex flex-col gap-2">
          {comments.map((note, index) => {
            const expanded = openCommentId === note.id;
            const sourceLabel = note.source ? SOURCE_LABELS[note.source] || note.source : null;

            return (
              <span key={note.id} className="block rounded-lg bg-muted/40 px-3 py-2 border border-border/60">
                <button
                  type="button"
                  onClick={() => setOpenCommentId((prev) => (prev === note.id ? null : note.id))}
                  className="w-full text-left"
                >
                  <span className="block text-[11px] tracking-[0.12em] uppercase menu-strong">
                    Comentário {index + 1}
                    {sourceLabel ? ` · ${sourceLabel}` : ""}
                  </span>
                  <span className="block mt-1 text-[14px] leading-6 comment-strong">
                    {expanded ? renderContentWithRefs(note.content, onNavigate) : shortText(note.content, 140)}
                  </span>
                </button>
              </span>
            );
          })}
        </span>
      )}

      {crossRefs.length > 0 && (
        <span className="block mt-3">
          <span className="block text-[10px] uppercase tracking-[0.2em] menu-strong mb-1">Referências cruzadas</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-6">
            {crossRefs.map((ref, idx) => {
              const parsed = parseReference(ref);
              if (parsed && onNavigate) {
                return (
                  <button
                    key={`${ref}-${idx}`}
                    type="button"
                    onClick={() => onNavigate(parsed.bookId, parsed.chapter, parsed.verse)}
                    className="underline underline-offset-2 decoration-primary/40 hover:decoration-primary text-primary/90 hover:text-primary transition-colors"
                  >
                    {ref}
                  </button>
                );
              }

              return (
                <span key={`${ref}-${idx}`} className="comment-strong">
                  {ref}
                </span>
              );
            })}
          </span>
        </span>
      )}

      {keywords.length > 0 && (
        <span className="block mt-3">
          <span className="block text-[10px] uppercase tracking-[0.2em] menu-strong mb-1">Palavras‑chave</span>

          <span className="flex flex-wrap items-center gap-2">
            {keywords.map((entry) => {
              const active = openKeywordId === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setOpenKeywordId((prev) => (prev === entry.id ? null : entry.id))}
                  className={`rounded-full border px-2.5 py-0.5 text-[12px] transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground/85 hover:border-primary/40"
                  }`}
                >
                  {entry.term}
                </button>
              );
            })}
          </span>

          {activeKeyword && (
            <span className="block mt-2 rounded-md bg-muted/40 border border-border/60 px-3 py-2 text-[12px] leading-6 text-foreground/85">
              <strong className="font-semibold text-foreground">{activeKeyword.term}</strong>
              {activeKeyword.hebrew_greek ? ` (${activeKeyword.hebrew_greek})` : ""}: {shortText(activeKeyword.definition, 180)}
            </span>
          )}
        </span>
      )}
      </>
      )}
    </span>
  );
};

export default InlineStudyNotes;
