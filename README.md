# 📖 Bíblia Alpha — Plataforma de Estudo Bíblico Avançado

![Bíblia Alpha](https://img.shields.io/badge/Bíblia_Alpha-Estudo_Avançado-d4af37?style=for-the-badge&logo=bookstack&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

> Plataforma digital completa para estudo bíblico com notas de teólogos históricos, dicionário bíblico, léxico Strong, mapa bíblico interativo e muito mais.

🔗 **Acesse:** [www.bibliaalpha.com](https://www.bibliaalpha.com)

---

## ✨ Funcionalidades

### 📚 Leitura & Estudo
- Texto bíblico completo (Antigo e Novo Testamento)
- Notas de estudo de teólogos históricos:
  - **Martinho Lutero** — Justificação pela fé, Sola Scriptura
  - **João Calvino** — Soberania divina, Eleição
  - **Agostinho de Hipona** — Graça, Pecado Original
  - **Tomás de Aquino** — Cinco Vias, Lei Natural
  - **Charles Spurgeon** — Pregações expositivas
  - **John Wesley** — Santificação, Graça Preveniente
- Notas de estudo inline integradas ao texto
- Referências cruzadas entre versículos
- Concordância exaustiva

### 🔤 Ferramentas de Estudo
- **Dicionário Bíblico** — Termos em português, hebraico e grego
- **Léxico Strong** — Números Strong com definições e morfologia
- **Vista Interlinear** — Texto original com transliteração
- **Personagens Bíblicos** — Informações detalhadas de pessoas da Bíblia

### 🗺️ Recursos Visuais
- **Mapa Bíblico Interativo** — Locais mencionados na Bíblia com Leaflet
- **Modo dia/noite** — Tema claro e escuro
- **Controle de fonte** — Ajuste do tamanho de leitura (14px–32px)

### 📋 Organização Pessoal
- Destaques coloridos nos versículos
- Favoritos com etiquetas
- Notas pessoais por versículo
- Histórico de leitura
- Planos de leitura com progresso

### 👤 Autenticação & Segurança
- Cadastro com aprovação por administrador
- Sistema de roles (admin, subscriber, pending)
- Políticas RLS em todas as tabelas
- Painel administrativo para gestão de usuários

### 🧠 Upgrade 66 Livros (Stack Inteligente)
- **Inteligência Bíblica 66X** no leitor (painel com referências, semântica e proveniência)
- **Camada linguística MACULA** (hebraico + grego): morfologia, sintaxe e papéis semânticos
- **Grafo de referências cruzadas** (`verse_cross_reference_edges`) para escalar para +500k conexões
- **Catálogo de datasets** com proveniência e licenças (`bible_dataset_sources`)
- **Função unificada de insights** (`get_verse_super_insights`) para entregar contexto rico por versículo
- **Cobertura por livro** (`book_resource_coverage`) para monitorar evolução dos 66 livros

---

## 🏗️ Arquitetura

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── ReaderHeader.tsx  # Cabeçalho do leitor bíblico
│   ├── ReaderSidebar.tsx # Menu lateral de navegação
│   ├── BookSelector.tsx  # Seletor de livro/capítulo
│   ├── DictionaryPanel.tsx    # Dicionário bíblico
│   ├── LexiconPanel.tsx       # Léxico Strong
│   ├── SearchPanel.tsx        # Busca global
│   ├── StudyNotesPanel.tsx    # Notas de estudo
│   ├── InlineStudyNotes.tsx   # Notas inline no texto
│   ├── InterlinearView.tsx    # Vista interlinear
│   ├── BibleMapPanel.tsx      # Mapa bíblico
│   ├── PeoplePanel.tsx        # Personagens bíblicos
│   ├── VerseIntelligencePanel.tsx # Insights avançados (MACULA + cross refs)
│   ├── VerseActionMenu.tsx    # Menu de ações por versículo
│   ├── OnboardingTour.tsx     # Tour de primeiro acesso
│   └── ReaderSettingsBar.tsx  # Controles de tema e fonte
├── contexts/            # Contextos React
│   ├── AuthContext.tsx          # Autenticação e autorização
│   └── ReaderSettingsContext.tsx # Preferências de leitura
├── data/                # Dados estáticos
│   └── bibleBooks.ts    # Metadados dos livros da Bíblia
├── hooks/               # Hooks customizados
│   └── useUserAnnotations.ts  # Destaques, favoritos, notas
├── integrations/        # Integrações externas
│   └── supabase/        # Cliente e tipos do banco de dados
├── lib/                 # Utilitários
│   ├── bibleApi.ts      # API de acesso ao texto bíblico
│   └── utils.ts         # Funções auxiliares
├── pages/               # Páginas da aplicação
│   ├── Shelf.tsx        # Página inicial (vitrine)
│   ├── Index.tsx        # Leitor bíblico principal
│   ├── Reader.tsx       # Componente do leitor
│   ├── Login.tsx        # Autenticação
│   ├── Signup.tsx       # Cadastro
│   ├── Admin.tsx        # Painel administrativo
│   ├── ReadingPlans.tsx # Planos de leitura
│   └── Preface.tsx      # Prefácio da Bíblia
└── index.css            # Design tokens e estilos globais
```

### Backend (Lovable Cloud)
```
supabase/
├── functions/           # Edge Functions (serverless)
│   ├── bible-api/       # API de texto bíblico
│   ├── generate-study-note/    # Geração de notas com IA
│   ├── translate-interlinear/  # Tradução interlinear
│   ├── verse-intelligence/     # API consolidada de insights por versículo
│   └── delete-user/     # Exclusão de conta
└── config.toml          # Configuração do projeto
```

### Pipeline de dados (novo)
```bash
scripts/bible-intelligence/
├── build-resource-manifest.mjs      # Descobre links dos hubs awesome-*
├── import-crossrefs-json.mjs        # Converte JSON de refs em grafo SQL/CSV
├── import-macula-tsv.mjs            # Converte TSV MACULA em tabelas normalizadas
└── book-id-map.mjs                  # Mapeamento OSIS -> IDs internos
```

---

## ⚙️ Executando o upgrade 66X

```bash
# 1) Catálogo de datasets (hubs awesome-*)
npm run upgrade:resources:manifest

# 2) Preparar base de referências cruzadas (grafo)
npm run upgrade:crossrefs:prepare -- ../crossrefs-json

# 3) Preparar base MACULA (hebraico + grego)
npm run upgrade:macula:prepare -- --hebrew ../macula-hebrew/WLC/tsv/macula-hebrew.tsv --greek-nestle ../macula-greek/Nestle1904/tsv/macula-greek-Nestle1904.tsv --greek-sbl ../macula-greek/SBLGNT/tsv/macula-greek-SBLGNT.tsv

# 4) Importar comentários patrísticos e reformados
npm run upgrade:theological:prepare
```

Depois aplique as migrations SQL de `supabase/migrations/` (arquivos 2026*), que contêm comentários de Agostinho, João Crisóstomo, João Calvino, Martinho Lutero, Jonathan Edwards, Charles Spurgeon e outros teólogos clássicos.

---

## 🎨 Design System

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#d4af37` (Gold) | Acentos, botões, destaques |
| `--background` | `#faf8f5` (Paper) | Fundo principal |
| Font Serif | EB Garamond | Texto bíblico, títulos |
| Font Sans | Inter | UI, labels, controles |

---

## ⚖️ Licença & Direitos

**© 2024–2025 Bíblia Alpha. Todos os direitos reservados.**

Este software e todo o seu conteúdo (incluindo, mas não limitado a, textos, notas de estudo, dados do dicionário, referências cruzadas e código-fonte) são propriedade exclusiva de seus autores.

**É expressamente proibido:**
- Copiar, reproduzir ou distribuir o código-fonte ou conteúdo
- Fazer engenharia reversa ou descompilar o software
- Extrair, raspar (scraping) ou coletar dados da plataforma
- Usar qualquer parte deste projeto para fins comerciais sem autorização

---

## 👨‍💻 Autor

**Erick Pereira da Silva**  
📧 analista.ericksilva@gmail.com

---

*Desenvolvido com ❤️ para a glória de Deus.*
# deploy
teste
deploy
deploy
