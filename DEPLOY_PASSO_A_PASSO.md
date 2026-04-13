# Deploy BibleAlpha - Script Automático

## PASSO 1: Criar tabelas no banco (execute no phpMyAdmin)

Acesse: https://pro127.dnspro.net.br/phpMyAdmin/
- Selecione o banco: `inte5419_biblia`
- Clique na aba "SQL"
- Execute este código:

```sql
-- TABELAS DO BANCO - BibleAlpha

CREATE TABLE IF NOT EXISTS bible_verses (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(10) NOT NULL,
    book_name VARCHAR(50) NOT NULL,
    chapter INT NOT NULL,
    verse_number INT NOT NULL,
    text TEXT NOT NULL,
    testament VARCHAR(20) DEFAULT 'old',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_book_chapter (book_id, chapter)
);

CREATE TABLE IF NOT EXISTS study_notes (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(10) NOT NULL,
    chapter INT NOT NULL,
    verse_start INT NOT NULL,
    verse_end INT,
    note_type VARCHAR(50) DEFAULT 'commentary',
    title VARCHAR(255),
    content TEXT NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(20) DEFAULT 'subscriber'
);

CREATE TABLE IF NOT EXISTS highlights (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    book_id VARCHAR(10) NOT NULL,
    chapter INT NOT NULL,
    verse INT NOT NULL,
    color VARCHAR(20) DEFAULT '#ffeb3b',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    book_id VARCHAR(10) NOT NULL,
    chapter INT NOT NULL,
    verse INT NOT NULL,
    label VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_notes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    book_id VARCHAR(10) NOT NULL,
    chapter INT NOT NULL,
    verse INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    book_id VARCHAR(10) NOT NULL,
    chapter INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## PASSO 2: Preparar arquivos para deploy

No seu computador:
1. Execute: `npm run build`
2. A pasta `dist/` será criada com os arquivos do site

## PASSO 3: Enviar para Napoleon (FTP)

Use o File Manager do DirectAdmin ou um cliente FTP:

**Arquivos da pasta `dist/`** → envie para `/public_html/`

**Pasta `api/`** → envie para `/public_html/api/`

## PASSO 4: Testar

Acesse: https://bibliaalphadigital.life/api/setup.php
- Se aparecer "Setup complete!" as tabelas estão criadas

Acesse: https://bibliaalphadigital.life/api/verses.php?book=gn&chapter=1
- Deve retornar os versículos em JSON

---

## Arquivos prontos para deploy:

| Pasta/Arquivo | Destino no Servidor |
|---------------|---------------------|
| `dist/` (após build) | `/public_html/` |
| `api/config.php` | `/public_html/api/config.php` |
| `api/verses.php` | `/public_html/api/verses.php` |
| `api/notes.php` | `/public_html/api/notes.php` |
| `api/users.php` | `/public_html/api/users.php` |
| `api/user-data.php` | `/public_html/api/user-data.php` |
| `api/bible-data.php` | `/public_html/api/bible-data.php` |
| `api/setup.php` | `/public_html/api/setup.php` |