@echo off
title Hardware POS System - Production Mode

echo ========================================
echo   Hardware POS System - Production Mode
echo ========================================
echo.

REM Check if we're in the correct directory
if not exist "backend\manage.py" (
    echo ERROR: Please run this script from the project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Checking prerequisites...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Prerequisites check passed!
echo.

REM Check if backend venv exists
if not exist "backend\venv\Scripts\activate.bat" (
    echo Backend virtual environment not found.
    echo Creating virtual environment...
    cd backend
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
    echo Please install dependencies: pip install -r requirements.txt
    cd ..
    echo.
)

REM Check if pos-frontend node_modules exists
if not exist "pos-frontend\node_modules" (
    echo POS frontend dependencies not found.
    echo Please install dependencies: cd pos-frontend && npm install
    echo.
)

echo Starting Hardware POS System in Production Mode...
echo.

REM Start Django Backend (Production)
echo [1/2] Starting Django Backend on port 8000 (Production Mode)...
start "Django Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && echo Django Backend running in production mode... && python manage.py runserver 0.0.0.0:8000"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Build POS Frontend (Production)
echo [2/2] Building POS Frontend for production...
cd pos-frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   POS System Started Successfully!
echo ========================================
echo.
echo Access Points:
echo   - Backend API:  http://localhost:8000
echo   - POS Frontend: http://localhost:3000
echo   - Admin Panel:  http://localhost:8000/admin
echo.
echo Note: Frontend is running as static build (faster, less memory)
echo.
echo To start the frontend server, run:
echo   cd pos-frontend\out
echo   python -m http.server 3000
echo.
echo Or use the provided start-pos-frontend.bat script
echo.
pause
