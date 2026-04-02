-- Strong's Lexicon table for Hebrew and Greek words
CREATE TABLE public.strongs_lexicon (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strongs_number text NOT NULL,
  language text NOT NULL CHECK (language IN ('hebrew', 'greek')),
  original_word text,
  transliteration text,
  gloss text,
  morphology text,
  definition text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(strongs_number)
);

CREATE INDEX idx_strongs_number ON public.strongs_lexicon(strongs_number);
CREATE INDEX idx_strongs_language ON public.strongs_lexicon(language);

ALTER TABLE public.strongs_lexicon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lexicon"
ON public.strongs_lexicon FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage lexicon"
ON public.strongs_lexicon FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Bible People table for proper nouns
CREATE TABLE public.bible_people (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  strongs_number text,
  references_list jsonb DEFAULT '[]'::jsonb,
  family_info text,
  person_type text DEFAULT 'person',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_bible_people_name ON public.bible_people(name);
CREATE INDEX idx_bible_people_strongs ON public.bible_people(strongs_number);

ALTER TABLE public.bible_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read people"
ON public.bible_people FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage people"
ON public.bible_people FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));