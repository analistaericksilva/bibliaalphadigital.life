-- Delete AI-generated notes (Enfase Pentecostal)
DELETE FROM study_notes 
WHERE source = 'Enfase Pentecostal' 
OR source LIKE '%IA%' 
OR source LIKE '%AI%'
OR content LIKE '%Enfase Pentecostal%'
OR content LIKE '%gerado por IA%'
OR content LIKE '%inteligência artificial%';

-- Select count to verify
SELECT COUNT(*) as remaining_notes FROM study_notes;