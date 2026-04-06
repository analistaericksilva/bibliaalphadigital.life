-- Create user_annotations table for personal notes
-- This enables the Notebook feature with annotation capabilities

BEGIN;

-- Create table for user annotations (notes, highlights, favorites, bookmarks)
CREATE TABLE IF NOT EXISTS public.user_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('highlight', 'note', 'favorite', 'bookmark', 'study')),
  color TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_annotations_user_id ON public.user_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_book_chapter ON public.user_annotations(book_id, chapter);
CREATE INDEX IF NOT EXISTS idx_user_annotations_verse ON public.user_annotations(verse_start, verse_end);
CREATE INDEX IF NOT EXISTS idx_user_annotations_type ON public.user_annotations(note_type);
CREATE INDEX IF NOT EXISTS idx_user_annotations_public ON public.user_annotations(is_public) WHERE is_public = TRUE;

-- Enable RLS
ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own annotations, or public ones from other users
CREATE POLICY "Users can manage their own annotations" ON public.user_annotations
  FOR ALL
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_annotations_updated_at
  BEFORE UPDATE ON public.user_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;