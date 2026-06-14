#!/bin/bash
# Start PostgreSQL + FastAPI + MCP for AI-First Autónomos
# Run this when the system starts, or use cron @reboot

export LD_LIBRARY_PATH=/home/ai/pg-dist/usr/lib/x86_64-linux-gnu:/home/ai/pg-dist/usr/lib/postgresql/16/lib
export PATH=/home/ai/pg-dist/usr/lib/postgresql/16/bin:$PATH

REPO_DIR=/home/ai/free-works
PG_DATA=/home/ai/pg-data
PG_LOG=$PG_DATA/logfile
API_DIR=$REPO_DIR/db
API_LOG=$API_DIR/logs/api.log

# Load env vars if .env exists
if [ -f "$REPO_DIR/.env" ]; then
    set -a
    . "$REPO_DIR/.env"
    set +a
fi

echo "[$(date)] Starting Free Works stack..."

# 1. Start PostgreSQL if not running
if ! pg_isready -h /home/ai/pg-data/sockets -q 2>/dev/null; then
    echo "  Starting PostgreSQL..."
    pg_ctl -D $PG_DATA -l $PG_LOG start
    sleep 2
    if pg_isready -h /home/ai/pg-data/sockets -q; then
        echo "  ✅ PostgreSQL started"
    else
        echo "  ❌ PostgreSQL failed to start"
        cat $PG_LOG | tail -5
    fi
else
    echo "  ✅ PostgreSQL already running"
fi

# 2. Start FastAPI if not running
if ! curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "  Starting API server..."
    mkdir -p $API_DIR/logs
    cd $REPO_DIR
    nohup python db/api.py > $API_LOG 2>&1 &
    API_PID=$!
    sleep 2
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "  ✅ API started (PID: $API_PID)"
    else
        echo "  ❌ API failed to start"
    fi
else
    echo "  ✅ API already running"
fi

echo "[$(date)] Stack ready."
