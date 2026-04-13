# BibleAlpha - Deploy para Napoleon (Sem Supabase)

## Arquivos Criados

### API PHP (pasta /api)
- `config.php` - Configuração do banco MySQL
- `verses.php` - API de versículos
- `notes.php` - API de notas de estudo
- `users.php` - API de usuários/perfis
- `user-data.php` - API de dados do usuário (highlights, favoritos, etc)
- `bible-data.php` - API de dados bíblicos (dicionário, pessoas, lugares, etc)

### Frontend Atualizado
- `src/integrations/supabase/client.ts` - Substituído por cliente API PHP

## Deploy Manual

### Passo 1: Criar as tabelas no banco MySQL
Acesse: https://pro127.dnspro.net.br/phpMyAdmin/
Execute o script SQL em `MIGRACAO_SUPABASE_NAPOLEON.md` ou o script簡化版本 abaixo:

```sql
-- Tabelas essenciais
CREATE TABLE IF NOT EXISTS bible_verses (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(10) NOT NULL,
    book_name VARCHAR(50) NOT NULL,
    chapter INT NOT NULL,
    verse_number INT NOT NULL,
    text TEXT NOT NULL,
    testament VARCHAR(20) DEFAULT 'old',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

### Passo 2: Enviar arquivos para /public_html

1. Compile o frontend:
```bash
npm run build
```

2. Os arquivos compilados estarão em `dist/`

3. Envie para /public_html via FTP ou File Manager:
   - Todo conteúdo da pasta `dist/` → /public_html/
   - Pasta `api/` → /public_html/api/

### Passo 3: Atualizar config.php com credenciais corretas

Edite `/public_html/api/config.php` com as credenciais do seu banco:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'inte5419_biblia');
define('DB_USER', 'inte5419');
define('DB_PASS', 'Er158471');
```

### Passo 4: Testar
Acesse seu site: https://bibliaalphadigital.life

## Estrutura de Arquivos no Servidor

```
/public_html/
├── index.html
├── api/
│   ├── config.php
│   ├── verses.php
│   ├── notes.php
│   ├── users.php
│   ├── user-data.php
│   └── bible-data.php
├── assets/
└── (outros arquivos do build)
```

## Solução de Problemas

### Erro de conexão com banco
- Verifique as credenciais em `api/config.php`
- Verifique se o banco existe no phpMyAdmin

### Erro 404 nas APIs
- Verifique se a pasta `api/` está no diretório correto
- Verifique se o PHP está habilitado no servidor

### Dados não aparecem
- Execute o SQL para criar as tabelas primeiro
- Verifique se há dados nas tabelas