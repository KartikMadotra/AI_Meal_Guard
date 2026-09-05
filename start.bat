@echo off
setlocal EnableDelayedExpansion

echo ==================================================
echo AI MealGuard - Backend Startup
echo ==================================================
echo.

echo [1/2] Installing requirements...
python -m pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install requirements. Please check your Python installation.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/2] Starting FastAPI Backend...
echo.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8080 --reload
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start the backend.
    pause
    exit /b %ERRORLEVEL%
)

endlocal
