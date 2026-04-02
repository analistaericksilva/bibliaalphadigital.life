CREATE TABLE public.interlinear_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  word_num integer NOT NULL,
  original_word text NOT NULL,
  transliteration text,
  english text,
  strongs_number text,
  grammar text,
  language text NOT NULL DEFAULT 'greek',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_interlinear_book_chap_verse ON public.interlinear_words (book_id, chapter, verse);
CREATE INDEX idx_interlinear_strongs ON public.interlinear_words (strongs_number);

ALTER TABLE public.interlinear_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read interlinear"
  ON public.interlinear_words FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage interlinear"
  ON public.interlinear_words FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'));