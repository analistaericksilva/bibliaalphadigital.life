
CREATE TABLE public.bible_cross_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  refs text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, chapter, verse)
);

ALTER TABLE public.bible_cross_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cross references"
  ON public.bible_cross_references FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage cross references"
  ON public.bible_cross_references FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_cross_refs_lookup ON public.bible_cross_references (book_id, chapter, verse);

-- Remove all existing study notes to avoid copyright issues
DELETE FROM public.study_notes;
