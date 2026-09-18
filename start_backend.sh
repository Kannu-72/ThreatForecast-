#!/usr/bin/env bash
set -e
python scripts/verify_artifacts.py
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
