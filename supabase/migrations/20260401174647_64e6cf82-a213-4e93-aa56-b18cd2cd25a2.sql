CREATE TABLE public.bible_places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  place_type text NOT NULL DEFAULT 'settlement',
  refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bible_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read places"
  ON public.bible_places FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage places"
  ON public.bible_places FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_bible_places_name ON public.bible_places (name);
CREATE INDEX idx_bible_places_refs ON public.bible_places USING GIN (refs);