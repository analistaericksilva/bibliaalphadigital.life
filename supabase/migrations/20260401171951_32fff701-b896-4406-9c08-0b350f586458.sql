
-- Reading history
CREATE TABLE public.reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  chapter integer NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, chapter)
);
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reading history" ON public.reading_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Favorites
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, chapter, verse)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Highlights
CREATE TABLE public.highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  color text NOT NULL DEFAULT 'yellow',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, chapter, verse)
);
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own highlights" ON public.highlights FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Personal notes
CREATE TABLE public.personal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own personal notes" ON public.personal_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_personal_notes_updated_at BEFORE UPDATE ON public.personal_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
