#!/usr/bin/env bash
# Fresh throwaway database, migrations, seed, RLS tests. Needs a local Postgres.
set -euo pipefail
BASE=${PG_BASE_URL:-postgresql://postgres@127.0.0.1:54329}
DB=clipsong_test
psql "$BASE/postgres" -qc "drop database if exists $DB" -qc "create database $DB"
export DATABASE_URL="$BASE/$DB"
node scripts/migrate.mjs --local-shim
node --no-warnings scripts/seed-db.ts
node --no-warnings --test supabase/test/rls.test.ts lib/billing/webhook.test.ts
