-- Create user_preferences table for reading comfort settings
-- This enables customizable reading experience

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Theme preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system', 'sepia', 'comfort')),
  
  -- Reading comfort settings
  font_size TEXT DEFAULT 'comfortable' CHECK (font_size IN ('compact', 'standard', 'comfortable', 'relaxed', 'large')),
  line_height TEXT DEFAULT 'relaxed' CHECK (line_height IN ('compact', 'standard', 'relaxed', 'spacious')),
  font_family TEXT DEFAULT 'eb-garamond',
  
  -- Display preferences
  show_verse_numbers BOOLEAN DEFAULT TRUE,
  show_inline_notes BOOLEAN DEFAULT TRUE,
  show_cross_refs BOOLEAN DEFAULT TRUE,
  show_strong_numbers BOOLEAN DEFAULT FALSE,
  show_word_definitions BOOLEAN DEFAULT FALSE,
  
  -- Navigation preferences
  remember_position BOOLEAN DEFAULT TRUE,
  auto_scroll BOOLEAN DEFAULT FALSE,
  scroll_speed INTEGER DEFAULT 5,
  
  -- Accessibility
  high_contrast BOOLEAN DEFAULT FALSE,
  reduce_motion BOOLEAN DEFAULT FALSE,
  screen_reader_optimized BOOLEAN DEFAULT FALSE,
  
  -- Created/updated timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default preferences for a new user (via trigger or default)
COMMENT ON COLUMN public.user_preferences.theme IS 'Reading theme: light, dark, system, sepia (warm paper), comfort (soft)';
COMMENT ON COLUMN public.user_preferences.font_size IS 'Font size preset: compact (smaller), standard, comfortable, relaxed (larger), large';
COMMENT ON COLUMN public.user_preferences.line_height is 'Line height: compact (tight), standard, relaxed (loose), spacious';

COMMIT;