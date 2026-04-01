
CREATE TABLE public.bible_verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('old', 'new')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read verses" ON public.bible_verses
  FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_bible_verses_book_chapter ON public.bible_verses (book_id, chapter);
CREATE INDEX idx_bible_verses_text ON public.bible_verses USING GIN (to_tsvector('portuguese', text));

CREATE UNIQUE INDEX idx_bible_verses_unique ON public.bible_verses (book_id, chapter, verse_number);
