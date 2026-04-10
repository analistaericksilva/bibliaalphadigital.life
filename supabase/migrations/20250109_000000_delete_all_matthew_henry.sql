-- MIGRATION: Remove ALL Matthew Henry Comments
-- Date: 2025-01-09
-- Purpose: Complete removal of Matthew Henry before adding Patristic comments

-- Delete ALL study notes by Matthew Henry
DELETE FROM public.study_notes 
WHERE source ILIKE '%Matthew Henry%' 
   OR source ILIKE '%MH%'
   OR source ILIKE '%Mathew Henry%'
   OR source ILIKE '%M. Henry%';

-- Delete any references in metadata
DELETE FROM public.study_notes 
WHERE content ILIKE '%Matthew Henry%' 
   AND source ILIKE '%Matthew Henry%';

-- Log the cleanup
COMMENT ON TABLE public.study_notes IS 'Study notes - Matthew Henry removed on 2025-01-09, replaced with Patristic theologians';
