-- ============================================================================
-- REMOÇÃO DE NOTAS PATRÍSTICAS (SOLICITADO PELO USUÁRIO)
-- Objetivo: Remover as 3.418 notas patrísticas inseridas pelo Lovable
-- Cobrindo os 16 Pais da Igreja especificados.
-- ============================================================================

BEGIN;

DELETE FROM public.study_notes
WHERE source IN (
  'Agostinho de Hipona',
  'João Crisóstomo',
  'Tertuliano',
  'Origenes',
  'Orígenes',
  'Ireneu de Lyon',
  'Jerônimo',
  'Basílio de Cesareia',
  'Basílio Magno',
  'Gregório de Nissa',
  'Gregório Nazianzeno',
  'Gregório de Nazianzo',
  'Atanásio de Alexandria',
  'Atanásio',
  'Ambrósio de Milão',
  'Cipriano de Cartago',
  'Clemente de Alexandria',
  'Clemente de Roma',
  'Efrém da Síria',
  'Cirilo de Alexandria',
  'Leão Magno',
  'Inácio de Antioquia',
  'Policarpo de Esmirna',
  'Justino Mártir'
);

COMMIT;

SELECT 'REMOÇÃO DE NOTAS PATRÍSTICAS CONCLUÍDA' AS status;
