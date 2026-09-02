@echo off
title POS Frontend - Static Server

echo ========================================
echo   POS Frontend - Static Server
echo ========================================
echo.

REM Check if we're in the correct directory
if not exist "pos-frontend\out" (
    echo ERROR: POS frontend build not found
    echo Please run: start-pos-production.bat first to build the frontend
    pause
    exit /b 1
)

echo Starting POS Frontend static server on port 3000...
echo.

cd pos-frontend\out

REM Start static file server using Python
echo Serving static files from: %CD%
echo Access at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

python -m http.server 3000

pause
