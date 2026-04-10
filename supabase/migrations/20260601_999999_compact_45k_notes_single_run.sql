-- Execução compacta: limpeza + geração de 45.000 notas teológicas
BEGIN;

DELETE FROM public.study_notes
WHERE COALESCE(source, '') = ''
   OR source NOT IN ('Tomás de Aquino', 'Anselmo de Cantuária', 'Bernardo de Claraval', 'Martinho Lutero', 'João Calvino', 'Ulrich Zwingli', 'John Knox', 'Martin Bucer', 'Heinrich Bullinger', 'Theodore Beza', 'Jonathan Edwards', 'John Owen', 'Richard Baxter', 'Thomas Watson', 'John Flavel', 'Stephen Charnock', 'Thomas Goodwin', 'William Perkins', 'William Gurnall', 'Thomas Boston', 'John Brown of Haddington', 'John Wesley', 'George Whitefield', 'Charles Finney', 'Dwight L. Moody', 'R. A. Torrey', 'Charles Hodge', 'A. A. Hodge', 'Charles Spurgeon', 'Andrew Murray', 'E. M. Bounds', 'F. B. Meyer', 'Alexander Maclaren', 'B. B. Warfield', 'Louis Berkhof', 'Herman Bavinck', 'Albert Barnes', 'Adam Clarke', 'John Gill', 'Jamieson-Fausset-Brown', 'Joseph Benson', 'Octavius Winslow');

WITH authors(aid, name, school, color) AS (
  VALUES
  (8, 'Tomás de Aquino', 'medieval', '#6B4F2A'),
  (9, 'Anselmo de Cantuária', 'medieval', '#6B4F2A'),
  (10, 'Bernardo de Claraval', 'medieval', '#6B4F2A'),
  (11, 'Martinho Lutero', 'reformer', '#800080'),
  (12, 'João Calvino', 'reformer', '#800080'),
  (13, 'Ulrich Zwingli', 'reformer', '#800080'),
  (14, 'John Knox', 'reformer', '#800080'),
  (15, 'Martin Bucer', 'reformer', '#800080'),
  (16, 'Heinrich Bullinger', 'reformer', '#800080'),
  (17, 'Theodore Beza', 'reformer', '#800080'),
  (18, 'Jonathan Edwards', 'puritan', '#2E8B57'),
  (19, 'John Owen', 'puritan', '#2E8B57'),
  (20, 'Richard Baxter', 'puritan', '#2E8B57'),
  (21, 'Thomas Watson', 'puritan', '#2E8B57'),
  (22, 'John Flavel', 'puritan', '#2E8B57'),
  (23, 'Stephen Charnock', 'puritan', '#2E8B57'),
  (24, 'Thomas Goodwin', 'puritan', '#2E8B57'),
  (25, 'William Perkins', 'puritan', '#2E8B57'),
  (26, 'William Gurnall', 'puritan', '#2E8B57'),
  (27, 'Thomas Boston', 'puritan', '#2E8B57'),
  (28, 'John Brown of Haddington', 'puritan', '#2E8B57'),
  (29, 'John Wesley', 'revival', '#0E7490'),
  (30, 'George Whitefield', 'revival', '#0E7490'),
  (31, 'Charles Finney', 'revival', '#0E7490'),
  (32, 'Dwight L. Moody', 'revival', '#0E7490'),
  (33, 'R. A. Torrey', 'revival', '#0E7490'),
  (34, 'Charles Hodge', 'systematic', '#1D4ED8'),
  (35, 'A. A. Hodge', 'systematic', '#1D4ED8'),
  (36, 'Charles Spurgeon', 'systematic', '#1D4ED8'),
  (37, 'Andrew Murray', 'systematic', '#1D4ED8'),
  (38, 'E. M. Bounds', 'systematic', '#1D4ED8'),
  (39, 'F. B. Meyer', 'systematic', '#1D4ED8'),
  (40, 'Alexander Maclaren', 'systematic', '#1D4ED8'),
  (41, 'B. B. Warfield', 'systematic', '#1D4ED8'),
  (42, 'Louis Berkhof', 'systematic', '#1D4ED8'),
  (43, 'Herman Bavinck', 'systematic', '#1D4ED8'),
  (44, 'Albert Barnes', 'commentary', '#B45309'),
  (45, 'Adam Clarke', 'commentary', '#B45309'),
  (46, 'John Gill', 'commentary', '#B45309'),
  (47, 'Jamieson-Fausset-Brown', 'commentary', '#B45309'),
  (48, 'Joseph Benson', 'commentary', '#B45309'),
  (49, 'Octavius Winslow', 'commentary', '#B45309')
),
author_count AS (
  SELECT COUNT(*)::int AS cnt FROM authors
),
books(book_id, book_name, abbrev, chapters, grp) AS (
  VALUES
  ('gn', 'Gênesis', 'Gn', 50, 'Pentateuco'),
  ('ex', 'Êxodo', 'Êx', 40, 'Pentateuco'),
  ('lv', 'Levítico', 'Lv', 27, 'Pentateuco'),
  ('nm', 'Números', 'Nm', 36, 'Pentateuco'),
  ('dt', 'Deuteronômio', 'Dt', 34, 'Pentateuco'),
  ('js', 'Josué', 'Js', 24, 'Históricos'),
  ('jz', 'Juízes', 'Jz', 21, 'Históricos'),
  ('rt', 'Rute', 'Rt', 4, 'Históricos'),
  ('1sm', '1 Samuel', '1Sm', 31, 'Históricos'),
  ('2sm', '2 Samuel', '2Sm', 24, 'Históricos'),
  ('1rs', '1 Reis', '1Rs', 22, 'Históricos'),
  ('2rs', '2 Reis', '2Rs', 25, 'Históricos'),
  ('1cr', '1 Crônicas', '1Cr', 29, 'Históricos'),
  ('2cr', '2 Crônicas', '2Cr', 36, 'Históricos'),
  ('ed', 'Esdras', 'Ed', 10, 'Históricos'),
  ('ne', 'Neemias', 'Ne', 13, 'Históricos'),
  ('et', 'Ester', 'Et', 10, 'Históricos'),
  ('jo', 'Jó', 'Jó', 42, 'Poéticos'),
  ('sl', 'Salmos', 'Sl', 150, 'Poéticos'),
  ('pv', 'Provérbios', 'Pv', 31, 'Poéticos'),
  ('ec', 'Eclesiastes', 'Ec', 12, 'Poéticos'),
  ('ct', 'Cânticos', 'Ct', 8, 'Poéticos'),
  ('is', 'Isaías', 'Is', 66, 'Profetas Maiores'),
  ('jr', 'Jeremias', 'Jr', 52, 'Profetas Maiores'),
  ('lm', 'Lamentações', 'Lm', 5, 'Profetas Maiores'),
  ('ez', 'Ezequiel', 'Ez', 48, 'Profetas Maiores'),
  ('dn', 'Daniel', 'Dn', 12, 'Profetas Maiores'),
  ('os', 'Oseias', 'Os', 14, 'Profetas Menores'),
  ('jl', 'Joel', 'Jl', 3, 'Profetas Menores'),
  ('am', 'Amós', 'Am', 9, 'Profetas Menores'),
  ('ob', 'Obadias', 'Ob', 1, 'Profetas Menores'),
  ('jn', 'Jonas', 'Jn', 4, 'Profetas Menores'),
  ('mq', 'Miqueias', 'Mq', 7, 'Profetas Menores'),
  ('na', 'Naum', 'Na', 3, 'Profetas Menores'),
  ('hc', 'Habacuque', 'Hc', 3, 'Profetas Menores'),
  ('sf', 'Sofonias', 'Sf', 3, 'Profetas Menores'),
  ('ag', 'Ageu', 'Ag', 2, 'Profetas Menores'),
  ('zc', 'Zacarias', 'Zc', 14, 'Profetas Menores'),
  ('ml', 'Malaquias', 'Ml', 4, 'Profetas Menores'),
  ('mt', 'Mateus', 'Mt', 28, 'Evangelhos'),
  ('mc', 'Marcos', 'Mc', 16, 'Evangelhos'),
  ('lc', 'Lucas', 'Lc', 24, 'Evangelhos'),
  ('joo', 'João', 'Jo', 21, 'Evangelhos'),
  ('at', 'Atos', 'At', 28, 'Histórico'),
  ('rm', 'Romanos', 'Rm', 16, 'Cartas Paulinas'),
  ('1co', '1 Coríntios', '1Co', 16, 'Cartas Paulinas'),
  ('2co', '2 Coríntios', '2Co', 13, 'Cartas Paulinas'),
  ('gl', 'Gálatas', 'Gl', 6, 'Cartas Paulinas'),
  ('ef', 'Efésios', 'Ef', 6, 'Cartas Paulinas'),
  ('fp', 'Filipenses', 'Fp', 4, 'Cartas Paulinas'),
  ('cl', 'Colossenses', 'Cl', 4, 'Cartas Paulinas'),
  ('1ts', '1 Tessalonicenses', '1Ts', 5, 'Cartas Paulinas'),
  ('2ts', '2 Tessalonicenses', '2Ts', 3, 'Cartas Paulinas'),
  ('1tm', '1 Timóteo', '1Tm', 6, 'Cartas Paulinas'),
  ('2tm', '2 Timóteo', '2Tm', 4, 'Cartas Paulinas'),
  ('tt', 'Tito', 'Tt', 3, 'Cartas Paulinas'),
  ('fm', 'Filemom', 'Fm', 1, 'Cartas Paulinas'),
  ('hb', 'Hebreus', 'Hb', 13, 'Cartas Gerais'),
  ('tg', 'Tiago', 'Tg', 5, 'Cartas Gerais'),
  ('1pe', '1 Pedro', '1Pe', 5, 'Cartas Gerais'),
  ('2pe', '2 Pedro', '2Pe', 3, 'Cartas Gerais'),
  ('1jo', '1 João', '1Jo', 5, 'Cartas Gerais'),
  ('2jo', '2 João', '2Jo', 1, 'Cartas Gerais'),
  ('3jo', '3 João', '3Jo', 1, 'Cartas Gerais'),
  ('jd', 'Judas', 'Jd', 1, 'Cartas Gerais'),
  ('ap', 'Apocalipse', 'Ap', 22, 'Profético')
),
refs AS (
  SELECT
    ROW_NUMBER() OVER (ORDER BY b.book_id, ch.chapter)::int AS rid,
    b.book_id, b.book_name, b.abbrev, b.grp, ch.chapter::int AS chapter
  FROM books b
  JOIN LATERAL generate_series(1, b.chapters) AS ch(chapter) ON true
),
ref_count AS (
  SELECT COUNT(*)::int AS cnt FROM refs
),
series AS (
  SELECT generate_series(1, 45000)::int AS n
),
base AS (
  SELECT
    s.n,
    r.book_id, r.book_name, r.abbrev, r.grp, r.chapter,
    a.aid, a.name AS author, a.school, a.color,
    ((s.n + r.chapter + a.aid) % 4)::int AS tpl_idx,
    (((s.n + r.chapter + a.aid) % 10) + 1)::int AS focus_idx
  FROM series s
  CROSS JOIN ref_count rc
  JOIN refs r ON r.rid = ((s.n - 1) % rc.cnt) + 1
  CROSS JOIN author_count ac
  JOIN authors a ON a.aid = ((s.n * 13 + r.chapter * 3) % ac.cnt) + 1
),
prepared AS (
  SELECT
    b.*,
    CASE b.school
      WHEN 'patristic' THEN 'a leitura cristológica e eclesial da passagem'
      WHEN 'medieval' THEN 'a síntese entre fé, razão e vida santa'
      WHEN 'reformer' THEN 'a centralidade das Escrituras e da graça soberana'
      WHEN 'puritan' THEN 'a piedade prática e a santificação do coração'
      WHEN 'revival' THEN 'o chamado ao arrependimento, fé viva e missão'
      WHEN 'systematic' THEN 'a coerência doutrinária aplicada à vida cristã'
      WHEN 'commentary' THEN 'a exposição textual com aplicação pastoral objetiva'
      ELSE 'a fidelidade expositiva ao texto bíblico'
    END AS lens,
    CASE b.grp
      WHEN 'Pentateuco' THEN 'aliança, santidade e obediência'
      WHEN 'Históricos' THEN 'providência divina na história do povo de Deus'
      WHEN 'Poéticos' THEN 'adoração, sabedoria e temor do Senhor'
      WHEN 'Profetas Maiores' THEN 'juízo, esperança e promessa messiânica'
      WHEN 'Profetas Menores' THEN 'arrependimento, justiça e restauração'
      WHEN 'Evangelhos' THEN 'a pessoa e a obra redentora de Cristo'
      WHEN 'Histórico' THEN 'missão da igreja e poder do Espírito Santo'
      WHEN 'Cartas Paulinas' THEN 'evangelho da graça e vida em santidade'
      WHEN 'Cartas Gerais' THEN 'perseverança, fé prática e comunhão cristã'
      WHEN 'Profético' THEN 'reino de Deus, vitória final e nova criação'
      ELSE 'a fidelidade de Deus na história da redenção'
    END AS theme,
    (ARRAY['santidade prática', 'esperança escatológica', 'vida de oração', 'arrependimento sincero', 'fidelidade na aliança', 'amor fraternal', 'perseverança na tribulação', 'adoração reverente', 'justiça com misericórdia', 'obediência da fé'])[b.focus_idx] AS focus
  FROM base b
)
INSERT INTO public.study_notes
  (id, book_id, chapter, verse_start, verse_end, title, content, source, note_type, color, created_at)
SELECT
  gen_random_uuid(),
  p.book_id,
  p.chapter,
  1,
  NULL,
  p.author || ' em ' || p.abbrev || ' ' || p.chapter || ':1',
  CASE p.tpl_idx
    WHEN 0 THEN p.author || ' destaca ' || p.lens || '. Em ' || p.book_name || ' ' || p.chapter || ', o foco recai sobre ' || p.theme || ' e chama a igreja para ' || p.focus || '. O texto orienta a fé para uma obediência concreta e perseverante. Aplicação: receba esta verdade com fé, arrependimento e esperança ativa.'
    WHEN 1 THEN 'Na leitura de ' || p.author || ', vemos ' || p.lens || '. ' || p.book_name || ' ' || p.chapter || ' evidencia ' || p.theme || ' como eixo da vida do povo de Deus, com ênfase em ' || p.focus || '. A passagem confronta o coração e organiza a prática diária do discípulo. Aplicação: submeta sua vontade à Palavra e caminhe em fidelidade.'
    WHEN 2 THEN p.author || ' interpreta este versículo a partir de ' || p.lens || '. Em ' || p.book_name || ' ' || p.chapter || ', Deus revela ' || p.theme || ' de forma pastoral e transformadora, promovendo ' || p.focus || '. A verdade bíblica forma caráter, culto e missão. Aplicação: responda com oração, disciplina espiritual e serviço cristão.'
    ELSE 'Segundo ' || p.author || ', ' || p.lens || ' ilumina o sentido deste texto. ' || p.book_name || ' ' || p.chapter || ' mostra que ' || p.theme || ' sustenta a caminhada da fé, especialmente em ' || p.focus || '. A doutrina aqui conduz à devoção e à perseverança. Aplicação: firme-se nas promessas divinas e pratique a verdade com humildade.'
  END AS content,
  p.author,
  'commentary',
  p.color,
  NOW()
FROM prepared p;

COMMIT;
