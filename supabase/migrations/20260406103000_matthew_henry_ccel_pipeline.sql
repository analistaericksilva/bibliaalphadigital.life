-- Pipeline Matthew Henry (CCEL): deduplicação + integração com API interna

ALTER TABLE public.verse_commentary_sources
  ADD COLUMN IF NOT EXISTS source_item_id text;

ALTER TABLE public.verse_commentary_sources
  ADD COLUMN IF NOT EXISTS content_hash text;

CREATE INDEX IF NOT EXISTS idx_verse_commentary_dataset_lookup
  ON public.verse_commentary_sources (source_dataset, book_id, chapter, verse_start, verse_end);

CREATE UNIQUE INDEX IF NOT EXISTS uq_verse_commentary_dataset_item
  ON public.verse_commentary_sources (source_dataset, source_item_id)
  WHERE source_item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_verse_commentary_dataset_range_hash
  ON public.verse_commentary_sources (source_dataset, book_id, chapter, verse_start, verse_end, content_hash)
  WHERE content_hash IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'bible_dataset_sources'
  ) THEN
    INSERT INTO public.bible_dataset_sources (
      id,
      name,
      category,
      repository_url,
      license,
      priority,
      enabled,
      notes
    ) VALUES (
      'ccel-matthew-henry',
      'CCEL Matthew Henry Commentary',
      'commentary',
      'https://www.ccel.org/ccel/henry/mhc.i.html',
      'Public Domain (via CCEL)',
      60,
      true,
      'Comentário completo normalizado por versículo: CCEL HTML -> parser -> banco -> API interna'
    )
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      repository_url = EXCLUDED.repository_url,
      license = EXCLUDED.license,
      priority = EXCLUDED.priority,
      enabled = EXCLUDED.enabled,
      notes = EXCLUDED.notes;
  END IF;
END
$$;
