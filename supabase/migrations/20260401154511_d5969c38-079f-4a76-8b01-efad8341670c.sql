
CREATE TABLE public.study_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER,
  note_type TEXT NOT NULL DEFAULT 'commentary',
  title TEXT,
  content TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read study notes"
  ON public.study_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage study notes"
  ON public.study_notes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_study_notes_lookup ON public.study_notes(book_id, chapter, verse_start);

-- Biblical dictionary
CREATE TABLE public.bible_dictionary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  hebrew_greek TEXT,
  references_list JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dictionary"
  ON public.bible_dictionary FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dictionary"
  ON public.bible_dictionary FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_dictionary_term ON public.bible_dictionary(term);
