@echo off
REM HRPMIS Development Server Launcher
REM This script installs dependencies and starts the development server

echo ========================================
echo   HRPMIS - HR Personnel Management System
echo ========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Starting development server...
echo [INFO] The application will be available at http://localhost:47100
echo.
echo Press Ctrl+C to stop the server.
echo.

REM Start the development server
call npm run dev

pause
