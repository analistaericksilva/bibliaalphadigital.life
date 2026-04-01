
-- Reading plans table
CREATE TABLE public.reading_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'annual', -- annual, semester, thematic
  total_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read plans"
  ON public.reading_plans FOR SELECT
  TO authenticated
  USING (true);

-- Plan days with readings
CREATE TABLE public.reading_plan_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT,
  readings JSONB NOT NULL DEFAULT '[]', -- [{book_id, book_name, chapter_start, chapter_end}]
  devotional_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (plan_id, day_number)
);

ALTER TABLE public.reading_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read plan days"
  ON public.reading_plan_days FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX idx_plan_days_plan ON public.reading_plan_days(plan_id, day_number);

-- User progress tracking
CREATE TABLE public.user_plan_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id, day_number)
);

ALTER TABLE public.user_plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.user_plan_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_plan_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.user_plan_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_progress ON public.user_plan_progress(user_id, plan_id);
