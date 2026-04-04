#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"
ARGS="--out-dir data/bible-intelligence/matthew-henry"

if [[ "$MODE" == "test" ]]; then
  ARGS="$ARGS --book-limit 3 --page-limit-per-book 3"
fi

echo "[1/2] Gerando bundle Matthew Henry (CCEL)..."
node scripts/bible-intelligence/import-matthew-henry-ccel.mjs $ARGS

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "[2/2] SUPABASE_DB_URL não definido."
  echo "      Bundle gerado em data/bible-intelligence/matthew-henry/"
  echo "      Para ativar no banco, exporte SUPABASE_DB_URL e rode novamente."
  exit 0
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql não encontrado. Instale PostgreSQL client e execute novamente."
  exit 1
fi

echo "[2/2] Aplicando migrations + import no Supabase..."
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260406090000_bible_intelligence_stack.sql
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260406103000_matthew_henry_ccel_pipeline.sql
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f data/bible-intelligence/matthew-henry/matthew-henry-upsert.sql

echo "✅ Ativação concluída."
