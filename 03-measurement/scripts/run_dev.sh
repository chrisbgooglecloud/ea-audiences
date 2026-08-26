#!/usr/bin/env bash
set -e

# ==============================================================================
# EA Creative Intelligence & Agentic Measurement Engine - Local Dev Runner
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=================================================================="
echo " Starting EA Creative Intelligence & Agentic Measurement Services "
echo " Workspace: $WORKSPACE_ROOT"
echo "=================================================================="

# Function to cleanup child processes on exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Determine Python / Uvicorn executable
if [ -f "$WORKSPACE_ROOT/.venv/bin/uvicorn" ]; then
    UVICORN_CMD="$WORKSPACE_ROOT/.venv/bin/uvicorn"
elif [ -f "$WORKSPACE_ROOT/backend/.venv/bin/uvicorn" ]; then
    UVICORN_CMD="$WORKSPACE_ROOT/backend/.venv/bin/uvicorn"
elif command -v uvicorn &> /dev/null; then
    UVICORN_CMD="uvicorn"
elif [ -f "$WORKSPACE_ROOT/.venv/bin/python" ]; then
    UVICORN_CMD="$WORKSPACE_ROOT/.venv/bin/python -m uvicorn"
else
    UVICORN_CMD="python3 -m uvicorn"
fi

# Start Backend if backend directory exists
if [ -d "$WORKSPACE_ROOT/backend" ] && [ -f "$WORKSPACE_ROOT/backend/app/main.py" ]; then
    echo "[Backend] Launching FastAPI backend on http://127.0.0.1:8000 using $UVICORN_CMD..."
    (cd "$WORKSPACE_ROOT/backend" && PYTHONPATH="$WORKSPACE_ROOT/backend:$WORKSPACE_ROOT" $UVICORN_CMD app.main:app --host 0.0.0.0 --port 8000 --reload) &
fi

# Start Next.js Frontend
if [ -d "$WORKSPACE_ROOT/frontend" ]; then
    echo "[Frontend] Launching Next.js Executive UI on http://localhost:3000..."
    (cd "$WORKSPACE_ROOT/frontend" && npm run dev) &
fi

wait
