-- LIMPEZA PRÉ-EXPANSÃO 45K
-- Mantém somente autores curados e remove fontes legadas.

BEGIN;

DELETE FROM public.study_notes
WHERE COALESCE(source, '') = ''
   OR source NOT IN (
    'Tomás de Aquino','Anselmo de Cantuária','Bernardo de Claraval',
    'Martinho Lutero','João Calvino','Ulrich Zwingli','John Knox','Martin Bucer','Heinrich Bullinger','Theodore Beza',
    'Jonathan Edwards','John Owen','Richard Baxter','Thomas Watson','John Flavel','Stephen Charnock','Thomas Goodwin','William Perkins','William Gurnall','Thomas Boston','John Brown of Haddington',
    'John Wesley','George Whitefield','Charles Finney','Dwight L. Moody','R. A. Torrey',
    'Charles Hodge','A. A. Hodge','Charles Spurgeon','Andrew Murray','E. M. Bounds','F. B. Meyer','Alexander Maclaren','B. B. Warfield','Louis Berkhof','Herman Bavinck',
    'Albert Barnes','Adam Clarke','John Gill','Jamieson-Fausset-Brown','Joseph Benson','Octavius Winslow'
   );

COMMIT;
