-- Publish all unpublished study notes
UPDATE study_notes
SET is_published = true
WHERE is_published = false OR is_published IS NULL;
