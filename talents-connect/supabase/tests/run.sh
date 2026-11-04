#!/usr/bin/env bash
# Rejoue les migrations sur une base PostgreSQL locale jetable puis lance les
# tests de sécurité (RLS et fonctions métier). Usage : npm run test:db
set -eo pipefail
cd "$(dirname "$0")/.."
DB=${TC_TEST_DB:-talents_connect_test}
dropdb --if-exists "$DB" >/dev/null 2>&1 || true
createdb "$DB"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f tests/00_supabase_stub.sql
for f in migrations/*.sql; do psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"; done
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f seed.sql
psql -v ON_ERROR_STOP=1 -q -o /dev/null -d "$DB" -f tests/rls_test.sql 2>&1 | sed "s/^psql:[^ ]* NOTICE:  /  /"
echo "✔ Migrations, données de référence et tests de sécurité : OK"
