#!/usr/bin/env bash
# Backend container entrypoint:
#  1. Wait for the database to be reachable.
#  2. Run Alembic migrations.
#  3. Exec the CMD (uvicorn by default).

set -e

echo "[entrypoint] Starting Smart Helpdesk backend..."

# Wait for the database. We retry up to 30 times (~60s) so postgres in compose
# has time to become ready.
echo "[entrypoint] Waiting for database..."
for i in $(seq 1 30); do
  if python -c "import os, psycopg2; url=os.environ['DATABASE_URL'].replace('postgresql+psycopg2://', 'postgresql://', 1); conn=psycopg2.connect(url); conn.close()" >/dev/null 2>&1; then
    echo "[entrypoint] Database is ready."
    break
  fi
  if [ "$i" = "30" ]; then
    echo "[entrypoint] ERROR: database not reachable after 30 attempts." >&2
    exit 1
  fi
  sleep 2
done

# Apply migrations.
echo "[entrypoint] Running alembic upgrade head..."
alembic upgrade head

# Hand off to the CMD.
echo "[entrypoint] Launching: $@"
exec "$@"
