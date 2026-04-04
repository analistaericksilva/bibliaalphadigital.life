# Activation Report — Matthew Henry (CCEL)

- Pipeline executed: `scripts/bible-intelligence/activate-matthew-henry.ps1 -Mode test`
- Crawl scope reached: full index (66 books)
- Pages fetched: **1255**
- Records normalized: **4230**
- Warnings: **33**
- Output files generated:
  - `data/bible-intelligence/matthew-henry/matthew-henry-normalized.json`
  - `data/bible-intelligence/matthew-henry/matthew-henry-upsert.sql`
  - `data/bible-intelligence/matthew-henry/matthew-henry-warnings.log`

## Activation status

- ✅ Parser/normalizer stage executed.
- ⏸ Database apply stage pending due missing `SUPABASE_DB_URL` in environment.

## To finalize DB activation

Run one of:

- `bash scripts/bible-intelligence/activate-matthew-henry.sh full`
- `powershell -ExecutionPolicy Bypass -File scripts/bible-intelligence/activate-matthew-henry.ps1 -Mode full`

With `SUPABASE_DB_URL` configured and `psql` installed.
