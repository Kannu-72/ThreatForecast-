@echo off
python scripts\verify_artifacts.py
if errorlevel 1 exit /b 1
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
