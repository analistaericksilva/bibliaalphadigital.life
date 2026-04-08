-- Create sermon_notes table for user sermon notes/notepad
CREATE TABLE IF NOT EXISTS sermon_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  verses_refs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sermon_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own sermon notes"
  ON sermon_notes FOR ALL
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_sermon_notes_user_id ON sermon_notes(user_id);
CREATE INDEX idx_sermon_notes_updated_at ON sermon_notes(updated_at DESC);