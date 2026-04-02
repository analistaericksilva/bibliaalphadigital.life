
-- Fix 1: Privilege escalation on user_roles
-- Drop the existing ALL policy that lacks WITH CHECK
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Recreate with proper WITH CHECK for all operations
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Change user-data table policies from public to authenticated

-- highlights
DROP POLICY IF EXISTS "Users manage own highlights" ON public.highlights;
CREATE POLICY "Users manage own highlights"
  ON public.highlights
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- favorites
DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
CREATE POLICY "Users manage own favorites"
  ON public.favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- reading_history
DROP POLICY IF EXISTS "Users manage own reading history" ON public.reading_history;
CREATE POLICY "Users manage own reading history"
  ON public.reading_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- personal_notes
DROP POLICY IF EXISTS "Users manage own personal notes" ON public.personal_notes;
CREATE POLICY "Users manage own personal notes"
  ON public.personal_notes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
