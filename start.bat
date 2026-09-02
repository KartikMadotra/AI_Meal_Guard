@echo off
title AI MealGuard — One-Click Launcher
color 0A
echo.
echo  ===================================
echo   AI MealGuard - Starting Up
echo  ===================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.11+ from python.org
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install Node 18+ from nodejs.org
    pause
    exit /b 1
)

:: Install Python dependencies
echo [1/5] Installing Python dependencies...
pip install -r requirements.txt --quiet 2>nul
if errorlevel 1 (
    echo [WARN] Some packages may have failed. Continuing...
)

:: Install frontend dependencies
echo [2/5] Installing frontend dependencies...
cd frontend
call npm install --silent 2>nul
cd ..

:: Seed database
echo [3/5] Seeding database...
python -m backend.seed 2>nul

:: Start backend server
echo [4/5] Starting backend server on port 8000...
start "MealGuard Backend" cmd /c "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

:: Wait for backend to be ready
timeout /t 3 /nobreak >nul

:: Start frontend server
echo [5/5] Starting frontend server...
cd frontend
start "MealGuard Frontend" cmd /c "npm run dev"
cd ..

:: Wait and open browser
timeout /t 5 /nobreak >nul
echo.
echo  ===================================
echo   AI MealGuard is RUNNING!
echo  ===================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://127.0.0.1:8000
echo   API Docs:  http://127.0.0.1:8000/docs
echo.
echo   Close this window to stop.
echo  ===================================
echo.

:: Open browser
start http://localhost:5173

:: Keep window open
pause
